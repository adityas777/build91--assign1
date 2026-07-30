import mongoose from "mongoose";

export async function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("CRITICAL ERROR: MONGODB_URI environment variable is not defined.");
    process.exit(1);
  }

  try {
    await mongoose.connect(uri);
    console.log("MongoDB connected successfully to Atlas.");
  } catch (error) {
    console.error("CRITICAL ERROR: Failed to connect to MongoDB Atlas.", error);
    process.exit(1);
  }
}
