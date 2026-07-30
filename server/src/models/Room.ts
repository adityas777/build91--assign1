import { Schema, model, Types } from "mongoose";

const roomSchema = new Schema(
  {
    projectId: { type: Schema.Types.ObjectId, ref: "Project", required: true },
    name: { type: String, required: true },
    assignedArtist: { type: String, default: "" },
    targetDeliveryDate: { type: Date },
    stage: {
      type: String,
      enum: ["Modeling", "Internal Review", "Rendering", "QA Review", "Final Renders", "Completed"],
      default: "Modeling",
    },
    progress: { type: Number, min: 0, max: 100, default: 0 },
    reviewerComments: { type: String, default: "" },
  },
  { timestamps: true }
);

export default model("Room", roomSchema);
