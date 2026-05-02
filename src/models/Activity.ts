import mongoose, { Schema, Document } from "mongoose";

export interface IActivity extends Document {
  lead: mongoose.Types.ObjectId;
  performedBy: mongoose.Types.ObjectId;
  action: string;
  description: string;
  oldValue?: string;
  newValue?: string;
  createdAt: Date;
}

const ActivitySchema = new Schema<IActivity>(
  {
    lead: { type: Schema.Types.ObjectId, ref: "Lead", required: true },
    performedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    action: {
      type: String,
      required: true,
      enum: [
        "LEAD_CREATED",
        "STATUS_UPDATED",
        "ASSIGNED",
        "REASSIGNED",
        "NOTE_UPDATED",
        "FOLLOW_UP_SET",
        "PRIORITY_CHANGED",
        "LEAD_UPDATED",
        "LEAD_DELETED",
      ],
    },
    description: { type: String, required: true },
    oldValue: { type: String },
    newValue: { type: String },
  },
  { timestamps: true }
);

ActivitySchema.index({ lead: 1, createdAt: -1 });

export default mongoose.models.Activity ||
  mongoose.model<IActivity>("Activity", ActivitySchema);
