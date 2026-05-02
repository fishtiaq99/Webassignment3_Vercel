import mongoose from "mongoose";

const FollowupSchema = new mongoose.Schema(
  {
    lead: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lead",
      required: true,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    status: {
      type: String,
      enum: ["Pending", "Completed", "Missed"],
      default: "Pending",
    },
    note: {
      type: String,
      default: "",
    },
    dueDate: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// prevent model overwrite in dev (IMPORTANT in Next.js)
export default mongoose.models.Followup ||
  mongoose.model("Followup", FollowupSchema);