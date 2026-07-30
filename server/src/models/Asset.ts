import { Schema, model, Types } from "mongoose";

const assetSchema = new Schema(
  {
    projectId: { type: Schema.Types.ObjectId, ref: "Project", required: true },
    roomId: { type: Schema.Types.ObjectId, ref: "Room", default: null },
    fileName: { type: String, required: true },
    fileType: { type: String, required: true },
    fileSize: { type: Number, required: true },
    s3Key: { type: String, required: true },
    url: { type: String, required: true }, // The URL returned at upload time (or base S3 URL)
  },
  { timestamps: true }
);

export default model("Asset", assetSchema);
