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
    startDate: { type: Date },
    targetDate: { type: Date },
  },
  { timestamps: true }
);

export default model("Project", projectSchema);
