# 3D Rendering Project Tracker — Build Guide

Build91 SDE Intern Assignment — 4 Hour MVP
Stack: React 19 + TypeScript · Node/Express + TypeScript · MongoDB (Atlas) · AWS S3 · REST APIs

This document is written to be handed directly to an IDE/coding agent (Claude Code, Cursor, etc.)
as a step-by-step execution plan. Every external service connection below uses **real, live
credentials** — nothing is mocked. Steps 0–1 must be done manually in a browser (AWS + MongoDB
consoles) before any code is written, because the code needs real keys/connection strings to work.

---

## 0. Prerequisites

- Node.js 20+, npm
- Git
- An AWS account (free tier is fine)
- A MongoDB Atlas account (free M0 cluster is fine)
- AWS CLI installed (optional but useful for verifying bucket access): `aws --version`

---

## 1. Real AWS S3 Setup (do this first, in the AWS Console)

### 1.1 Create the bucket
1. AWS Console → S3 → **Create bucket**
2. Bucket name: `build91-rendering-tracker-<yourname>` (must be globally unique)
3. Region: pick one close to you, e.g. `ap-south-1` (Mumbai) — **remember this region string**, you'll need it in `.env`
4. Block Public Access: leave **all blocked** (we will serve files via signed/proxied URLs, not public ACLs, unless you explicitly want public read for images — see 1.4)
5. Create bucket.

### 1.2 Create an IAM user with programmatic access (do NOT use root keys)
1. IAM → Users → **Create user** → name: `build91-tracker-app`
2. Attach policy → **Create inline policy** → JSON, paste (replace `BUCKET_NAME`):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::BUCKET_NAME",
        "arn:aws:s3:::BUCKET_NAME/*"
      ]
    }
  ]
}
```

3. Create the user, then go to **Security credentials → Create access key → Application running outside AWS**
4. Copy the `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` immediately (secret is shown once) — you'll paste these into the backend `.env` in step 4.

### 1.3 CORS config on the bucket (required so the browser/server can upload)
S3 → your bucket → Permissions → CORS → paste:

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
    "AllowedOrigins": ["http://localhost:5173"],
    "ExposeHeaders": ["ETag"]
  }
]
```

(Add your deployed frontend origin here later if you deploy.)

### 1.4 Decide file access model
For this MVP: server uploads to S3 via `multer-s3` (backend proxies the file), and we store the
resulting object URL in MongoDB. Keep the bucket private and use `s3.getSignedUrl` (or SDK v3
`getSignedUrl` from `@aws-sdk/s3-request-presigner`) to generate short-lived read URLs when the
frontend requests an asset. This avoids making the bucket public while keeping everything real.

**Env values to save now** (you'll put these in `server/.env` in step 4):
```
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=ap-south-1
AWS_S3_BUCKET=build91-rendering-tracker-<yourname>
```

---

## 2. Real MongoDB Setup (MongoDB Atlas)

1. https://cloud.mongodb.com → Create a free M0 cluster
2. Database Access → Add New Database User → username/password (save these)
3. Network Access → Add IP Address → **Add Current IP Address** (or `0.0.0.0/0` only for the duration of the assignment, tighten later)
4. Once cluster is up → **Connect → Drivers → Node.js** → copy the connection string:
```
mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
```
5. Append a database name before the `?`:
```
mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/rendering-tracker?retryWrites=true&w=majority
```

**Env value to save:**
```
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/rendering-tracker?retryWrites=true&w=majority
```

---

## 3. Project Scaffolding

```bash
mkdir 3d-rendering-tracker && cd 3d-rendering-tracker
git init

# --- backend ---
mkdir server && cd server
npm init -y
npm install express mongoose cors dotenv multer multer-s3 @aws-sdk/client-s3 @aws-sdk/s3-request-presigner zod
npm install -D typescript ts-node-dev @types/node @types/express @types/cors @types/multer nodemon
npx tsc --init
cd ..

# --- frontend ---
npm create vite@latest client -- --template react-ts
cd client
npm install
npm install react-router-dom @tanstack/react-query axios react-dropzone
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
cd ..
```

Final structure:
```
3d-rendering-tracker/
  server/
    src/
      config/        (db.ts, s3.ts)
      models/        (Project.ts, Room.ts, Asset.ts)
      routes/        (projects.ts, rooms.ts, assets.ts, dashboard.ts)
      middleware/     (errorHandler.ts, validate.ts)
      index.ts
    .env
  client/
    src/
      api/           (client.ts, projects.ts, rooms.ts, assets.ts)
      pages/
      components/
      App.tsx
    .env
  README.md
```

---

## 4. Backend: Node/Express + TypeScript

### 4.1 `server/.env`
```
PORT=5000
MONGODB_URI=<from step 2>
AWS_ACCESS_KEY_ID=<from step 1>
AWS_SECRET_ACCESS_KEY=<from step 1>
AWS_REGION=ap-south-1
AWS_S3_BUCKET=<from step 1>
CLIENT_ORIGIN=http://localhost:5173
```

### 4.2 `server/src/config/db.ts` — **real MongoDB connection**
```ts
import mongoose from "mongoose";

export async function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI not set");
  await mongoose.connect(uri);
  console.log("MongoDB connected");
}
```

### 4.3 `server/src/config/s3.ts` — **real S3 client**
```ts
import { S3Client } from "@aws-sdk/client-s3";

export const s3 = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export const BUCKET = process.env.AWS_S3_BUCKET!;
```

### 4.4 `server/src/index.ts` — **the actual REST API server**
```ts
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectDB } from "./config/db";
import projectRoutes from "./routes/projects";
import roomRoutes from "./routes/rooms";
import assetRoutes from "./routes/assets";
import dashboardRoutes from "./routes/dashboard";
import { errorHandler } from "./middleware/errorHandler";

dotenv.config();

const app = express();
app.use(cors({ origin: process.env.CLIENT_ORIGIN }));
app.use(express.json());

app.use("/api/projects", projectRoutes);
app.use("/api/rooms", roomRoutes);
app.use("/api/assets", assetRoutes);
app.use("/api/dashboard", dashboardRoutes);

app.use(errorHandler);

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
});
```

### 4.5 Models
`server/src/models/Project.ts`
```ts
import { Schema, model } from "mongoose";

const projectSchema = new Schema(
  {
    name: { type: String, required: true },
    client: { type: String, required: true },
    status: {
      type: String,
      enum: ["Submitted", "Approved", "In Progress", "Review", "Done"],
      default: "Submitted",
    },
    startDate: Date,
    targetDate: Date,
  },
  { timestamps: true }
);

export default model("Project", projectSchema);
```

`server/src/models/Room.ts`
```ts
import { Schema, model, Types } from "mongoose";

const roomSchema = new Schema(
  {
    projectId: { type: Types.ObjectId, ref: "Project", required: true },
    name: { type: String, required: true },
    assignedArtist: String,
    targetDeliveryDate: Date,
    stage: {
      type: String,
      enum: ["Modeling", "Internal Review", "Rendering", "QA Review", "Final Renders", "Completed"],
      default: "Modeling",
    },
    progress: { type: Number, min: 0, max: 100, default: 0 },
    reviewerComments: String,
  },
  { timestamps: true }
);

export default model("Room", roomSchema);
```

`server/src/models/Asset.ts`
```ts
import { Schema, model, Types } from "mongoose";

const assetSchema = new Schema(
  {
    projectId: { type: Types.ObjectId, ref: "Project", required: true },
    roomId: { type: Types.ObjectId, ref: "Room" },
    fileName: String,
    fileType: String,
    fileSize: Number,
    s3Key: { type: String, required: true },
    url: String,
  },
  { timestamps: true }
);

export default model("Asset", assetSchema);
```

### 4.6 Routes — example: `server/src/routes/projects.ts` (REST CRUD, real DB calls)
```ts
import { Router } from "express";
import Project from "../models/Project";

const router = Router();

router.get("/", async (req, res, next) => {
  try {
    const { status, client } = req.query;
    const filter: Record<string, unknown> = {};
    if (status) filter.status = status;
    if (client) filter.client = new RegExp(String(client), "i");
    const projects = await Project.find(filter).sort({ createdAt: -1 });
    res.json(projects);
  } catch (err) { next(err); }
});

router.post("/", async (req, res, next) => {
  try {
    const project = await Project.create(req.body);
    res.status(201).json(project);
  } catch (err) { next(err); }
});

router.put("/:id", async (req, res, next) => {
  try {
    const project = await Project.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(project);
  } catch (err) { next(err); }
});

router.delete("/:id", async (req, res, next) => {
  try {
    await Project.findByIdAndDelete(req.params.id);
    res.status(204).send();
  } catch (err) { next(err); }
});

export default router;
```
Repeat the same pattern for `rooms.ts` (scoped by `projectId`).

### 4.7 `server/src/routes/assets.ts` — **real S3 upload endpoint**
```ts
import { Router } from "express";
import multer from "multer";
import multerS3 from "multer-s3";
import { s3, BUCKET } from "../config/s3";
import Asset from "../models/Asset";

const upload = multer({
  storage: multerS3({
    s3,
    bucket: BUCKET,
    key: (req, file, cb) => {
      cb(null, `assets/${Date.now()}-${file.originalname}`);
    },
  }),
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB
  fileFilter: (req, file, cb) => {
    const allowed = ["application/pdf", "image/jpeg", "image/png", "application/dwg", "application/dxf"];
    cb(null, true); // relax for CAD mimetypes browsers often mislabel; validate by extension too if time allows
  },
});

const router = Router();

router.post("/upload", upload.single("file"), async (req, res, next) => {
  try {
    const file = req.file as Express.MulterS3.File;
    const asset = await Asset.create({
      projectId: req.body.projectId,
      roomId: req.body.roomId || undefined,
      fileName: file.originalname,
      fileType: file.mimetype,
      fileSize: file.size,
      s3Key: file.key,
      url: file.location, // real S3 object URL
    });
    res.status(201).json(asset);
  } catch (err) { next(err); }
});

export default router;
```

### 4.8 `server/src/routes/dashboard.ts` — real aggregation
```ts
import { Router } from "express";
import Project from "../models/Project";

const router = Router();

router.get("/summary", async (req, res, next) => {
  try {
    const summary = await Project.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);
    res.json(summary);
  } catch (err) { next(err); }
});

export default router;
```

### 4.9 `server/src/middleware/errorHandler.ts`
```ts
import { Request, Response, NextFunction } from "express";

export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  console.error(err);
  res.status(err.status || 500).json({ message: err.message || "Server error" });
}
```

### 4.10 Run it
Add to `server/package.json` scripts: `"dev": "ts-node-dev --respawn src/index.ts"`
```bash
cd server && npm run dev
```
Confirm in terminal: `MongoDB connected` and `Server running on port 5000`. This is your proof the
DB connection is real, not mocked.

---

## 5. Frontend: React + TypeScript

### 5.1 `client/.env`
```
VITE_API_BASE_URL=http://localhost:5000/api
```

### 5.2 `client/src/api/client.ts` — **the real connection to the backend**
```ts
import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
});
```

### 5.3 `client/src/api/projects.ts`
```ts
import { api } from "./client";

export const getProjects = (params?: Record<string, string>) =>
  api.get("/projects", { params }).then((r) => r.data);

export const createProject = (data: unknown) =>
  api.post("/projects", data).then((r) => r.data);

export const updateProject = (id: string, data: unknown) =>
  api.put(`/projects/${id}`, data).then((r) => r.data);

export const deleteProject = (id: string) =>
  api.delete(`/projects/${id}`);
```

### 5.4 React Query setup — `client/src/main.tsx`
```tsx
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from "./App";

const queryClient = new QueryClient();

// wrap <App /> in <QueryClientProvider client={queryClient}> in your root render
```

### 5.5 Example data-fetching component
```tsx
import { useQuery } from "@tanstack/react-query";
import { getProjects } from "../api/projects";

function ProjectList() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["projects"],
    queryFn: () => getProjects(),
  });

  if (isLoading) return <p>Loading projects...</p>;
  if (isError) return <p>Failed to load projects.</p>;

  return (
    <div className="grid grid-cols-3 gap-4">
      {data.map((p: any) => (
        <div key={p._id} className="border rounded p-4">{p.name} — {p.status}</div>
      ))}
    </div>
  );
}
```

### 5.6 Real file upload from the frontend
```tsx
import { useDropzone } from "react-dropzone";
import { api } from "../api/client";

function AssetUpload({ projectId }: { projectId: string }) {
  const onDrop = async (files: File[]) => {
    const form = new FormData();
    form.append("file", files[0]);
    form.append("projectId", projectId);
    await api.post("/assets/upload", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  };

  const { getRootProps, getInputProps } = useDropzone({ onDrop });

  return (
    <div {...getRootProps()} className="border-dashed border-2 p-6 text-center">
      <input {...getInputProps()} />
      Drag & drop a file, or click to select
    </div>
  );
}
```

### 5.7 Run it
```bash
cd client && npm run dev
```
Open `http://localhost:5173`, load the project list — if it renders real data from Mongo (even an
empty array, not an error), frontend↔backend↔DB is confirmed connected end to end.

---

## 6. How the 5 pieces actually connect (summary)

| Connection | Mechanism | Where configured |
|---|---|---|
| React → Express | `axios` instance with `baseURL` = backend URL | `client/src/api/client.ts` + `VITE_API_BASE_URL` |
| Express → allows React's origin | `cors({ origin: CLIENT_ORIGIN })` | `server/src/index.ts` |
| Express → MongoDB | `mongoose.connect(MONGODB_URI)` at boot | `server/src/config/db.ts` |
| Express → AWS S3 | `S3Client` with IAM access key/secret, `multer-s3` as multer's storage engine | `server/src/config/s3.ts`, `routes/assets.ts` |
| React → S3 (indirect) | Never talks to S3 directly — uploads go through Express, which streams to S3 and returns the object URL to store in Mongo | `assets.ts` upload route |
| REST APIs | Express `Router` per resource, mounted under `/api/<resource>`, called via axios from React Query hooks | `routes/*.ts` + `api/*.ts` |

This is a **server-proxied upload** design (see reasoning discussed earlier) rather than
presigned-URL direct-to-S3 — simpler to wire correctly inside a 4-hour window, with presigned URLs
noted as a documented next step.

---

## 7. Order of execution for the IDE/agent

1. Scaffold folders + install deps (Section 3)
2. Backend: `db.ts` → `s3.ts` → models → `index.ts` boot → confirm `MongoDB connected` in console
3. Backend: Project routes → test with curl/Postman (`GET /api/projects` should return `[]`)
4. Backend: Room routes → test
5. Backend: Asset upload route → test with a real file upload via Postman, confirm object appears in S3 console
6. Backend: Dashboard aggregation route
7. Frontend: scaffold, Tailwind config, `api/client.ts`
8. Frontend: Project list + create/edit forms wired to React Query
9. Frontend: Project detail page with Room list + stage updates
10. Frontend: Drag-drop asset upload wired to `/api/assets/upload`
11. Loading/error states pass everywhere
12. README: setup steps, assumptions, screenshots, known limitations (mention presigned URLs, auth, deployment as future work)
13. Final commit + push

---

## 8. Known limitations to state in the README (be upfront about these — it reads as maturity, not weakness)

- Uploads are proxied through the Express server rather than using presigned S3 URLs for direct browser→S3 upload (simpler within the time box; noted as a production improvement).
- No authentication/authorization layer (Users collection marked optional in the brief; out of scope for 4 hours).
- CAD file (DWG/DXF) preview is not rendered in-browser — only stored/downloadable, since parsing those formats client-side is out of scope for an MVP.
- No pagination on project/room list endpoints yet.
