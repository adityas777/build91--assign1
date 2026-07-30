import express from "express";
import cors from "cors";
import dotenv from "dotenv";

// Load environment variables before importing configs
dotenv.config();

import { connectDB } from "./config/db";
import { verifyS3Connection } from "./config/s3";
import projectRoutes from "./routes/projects";
import roomRoutes from "./routes/rooms";
import assetRoutes from "./routes/assets";
import dashboardRoutes from "./routes/dashboard";
import { errorHandler } from "./middleware/errorHandler";

const app = express();

// Middleware
app.use(cors({
  origin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// REST API Endpoints
app.use("/api/projects", projectRoutes);
app.use("/api/rooms", roomRoutes);
app.use("/api/assets", assetRoutes);
app.use("/api/dashboard", dashboardRoutes);

// Catch-all route for unmatched endpoints
app.use((req, res, next) => {
  res.status(404).json({ error: { message: `Route ${req.method} ${req.url} not found`, status: 404 } });
});

// Error handling middleware
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// Bootstrap server
async function bootstrap() {
  console.log("Bootstrapping server...");
  
  // 1. Connect to MongoDB Atlas
  await connectDB();
  
  // 2. Verify S3 Bucket availability (fails fast if credentials/bucket incorrect)
  await verifyS3Connection();

  // 3. Start listening
  app.listen(PORT, () => {
    console.log(`Server is running in ${process.env.NODE_ENV || "development"} mode on port ${PORT}`);
  });
}

bootstrap().catch(err => {
  console.error("Bootstrapping failed with a critical error:", err);
  process.exit(1);
});
