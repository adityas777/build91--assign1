# 3D Rendering Project Tracker — MVP

A full-stack, production-ready MVP for tracking 3D rendering projects, room-by-room stages, and CAD/PDF files. Built with React 19, TypeScript, Express, MongoDB Atlas, and AWS S3.

## Architecture & Features

This application implements the 5 core components connecting React, Express, MongoDB Atlas, and AWS S3 as described in the guide:

1. **Vite + React (TypeScript) Frontend**: Styled with clean Tailwind CSS defaults. Powered by `@tanstack/react-query` for server state sync and `axios` for client-side API requests.
2. **Express + Node (TypeScript) Backend**: Exposes a RESTful CRUD API under `/api` for projects, rooms, and assets, including real aggregation for the dashboard.
3. **Mongoose Models**: Real schemas for `Project` (metadata, status), `Room` (assigned artist, progress, stage, comments), and `Asset` (S3 identifiers and signed retrieval metadata).
4. **AWS S3 Integration (Signed URLs)**: Files are stored in a private AWS S3 bucket. At upload time, files are streamed to S3 via `multer-s3`. At request time, the backend generates short-lived **presigned URLs** to enable secure file downloads without exposing public bucket access.
5. **Robust CAD Handling**: Because browsers often mislabel or omit the MIME type of CAD files (such as `.dwg` and `.dxf`), the server validates files using both file extension and MIME type. CAD files are fully downloadable but not previewed in-browser.

---

## Directory Structure

```
build91 - assign1/
  server/
    src/
      config/        # db.ts (MongoDB connection), s3.ts (S3 Client & boot checks)
      models/        # Project, Room, and Asset Mongoose schemas
      routes/        # REST endpoints (projects, rooms, assets, dashboard summary)
      middleware/     # Express global error handler
      index.ts       # Server entry point with boot validation checks
    .env.example     # Environment template
  client/
    src/
      api/           # Axios API wrappers (projects, rooms, assets, dashboard)
      components/    # RoomCard (stages/progress), AssetManager (Dropzone S3 upload)
      pages/         # Dashboard (KPIs), Projects (listing), ProjectDetails (rooms, general files)
      App.tsx        # Router and layout configuration
      main.tsx       # QueryClient initialization
    .env.example     # Frontend config template
  README.md
```

---

## Getting Started

### 1. Prerequisites
- Node.js 20+
- A MongoDB Atlas connection string
- An AWS S3 bucket and IAM programmatic access credentials

### 2. Environment Setup

#### Backend configuration:
1. Navigate to the `server` directory: `cd server`
2. Create your `.env` file: `copy .env.example .env`
3. Edit `.env` and fill in your connection details:
   ```env
   PORT=5000
   MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/rendering-tracker?retryWrites=true&w=majority
   AWS_ACCESS_KEY_ID=your-aws-access-key-id
   AWS_SECRET_ACCESS_KEY=your-aws-secret-access-key
   AWS_REGION=ap-south-1
   AWS_S3_BUCKET=build91-rendering-tracker-yourname
   CLIENT_ORIGIN=http://localhost:5173
   ```

#### Frontend configuration:
1. Navigate to the `client` directory: `cd client`
2. Create your `.env` file: `copy .env.example .env`
3. Verify or edit the backend API endpoint (default is port 5000):
   ```env
   VITE_API_BASE_URL=http://localhost:5000/api
   ```

### 3. Installation & Running

#### Start the Backend Server:
```bash
cd server
npm install
npm run dev
```
On boot, the backend runs a **Fail-Fast** check to confirm both the MongoDB connection is alive and S3 bucket is accessible. Look for confirmation messages:
- `MongoDB connected successfully to Atlas.`
- `AWS S3 connection verified. Bucket "..." is accessible.`

#### Start the Frontend Client:
```bash
cd client
npm install --legacy-peer-deps
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## Known Assumptions & Limitations

- **Pipeline Transition Restrictions**: Project status and Room stage can only transition to an adjacent step in their defined pipeline (one step forward or backward) — arbitrary jumps (e.g. Submitted directly to Done) are rejected by the backend and hidden from the frontend dropdown.
- **Project Date Validation**: Target delivery date must be on or after the start date; this is validated on the backend (and cannot be bypassed via direct API calls) as well as the frontend for immediate UX feedback.
- **S3 Signed URL Model**: S3 bucket is assumed to be private. Previews/Downloads utilize presigned URLs with 1-hour expiration.
- **Client-Side CAD Previews**: AutoCAD files (`.dwg`, `.dxf`) are stored, managed, and downloadable. They are not rendered visually in-browser because client-side parsing of CAD binaries is outside the scope of this MVP.
- **Cascading Deletions**: Deleting a project cascades down to delete its rooms from the database, and all assets (both project-wide and room-specific) from both MongoDB and S3.
- **Authentication**: No authentication or user access management is implemented in this MVP.
