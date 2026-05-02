import mongoose, { Schema, Document } from "mongoose";

export type LeadStatus = "New" | "Contacted" | "In Progress" | "Closed" | "Lost";
export type LeadPriority = "High" | "Medium" | "Low";
export type PropertyInterest = "House" | "Apartment" | "Plot" | "Commercial" | "Villa";

export interface ILead extends Document {
  name: string;
  email?: string;
  phone: string;
  propertyInterest: PropertyInterest;
  budget: number;
  budgetFormatted: string;
  status: LeadStatus;
  priority: LeadPriority;
  score: number;
  notes?: string;
  source: "Facebook Ads" | "Walk-in" | "Website" | "Referral" | "Phone";
  assignedTo?: mongoose.Types.ObjectId;
  location?: string;
  followUpDate?: Date;
  lastActivityAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const LeadSchema = new Schema<ILead>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, lowercase: true, trim: true },
    phone: { type: String, required: true, trim: true },
    propertyInterest: {
      type: String,
      enum: ["House", "Apartment", "Plot", "Commercial", "Villa"],
      required: true,
    },
    budget: { type: Number, required: true, min: 0 },
    budgetFormatted: { type: String },
    status: {
      type: String,
      enum: ["New", "Contacted", "In Progress", "Closed", "Lost"],
      default: "New",
    },
    priority: {
      type: String,
      enum: ["High", "Medium", "Low"],
      default: "Low",
    },
    score: { type: Number, default: 0 },
    notes: { type: String, trim: true },
    source: {
      type: String,
      enum: ["Facebook Ads", "Walk-in", "Website", "Referral", "Phone"],
      default: "Website",
    },
    assignedTo: { type: Schema.Types.ObjectId, ref: "User" },
    location: { type: String, trim: true },
    followUpDate: { type: Date },
    lastActivityAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Scoring middleware — runs before save
LeadSchema.pre("save", function (next) {
  // Budget-based priority & score (budget in millions PKR)
  const budgetInMillions = this.budget / 1_000_000;

  if (budgetInMillions > 20) {
    this.priority = "High";
    this.score = 100;
  } else if (budgetInMillions >= 10) {
    this.priority = "Medium";
    this.score = 60;
  } else {
    this.priority = "Low";
    this.score = 20;
  }

  // Format budget display
  if (this.budget >= 1_000_000_000) {
    this.budgetFormatted = `${(this.budget / 1_000_000_000).toFixed(1)}B PKR`;
  } else if (this.budget >= 1_000_000) {
    this.budgetFormatted = `${(this.budget / 1_000_000).toFixed(1)}M PKR`;
  } else {
    this.budgetFormatted = `${this.budget.toLocaleString()} PKR`;
  }

  next();
});

// Indexes for performance
LeadSchema.index({ assignedTo: 1, status: 1 });
LeadSchema.index({ priority: 1 });
LeadSchema.index({ createdAt: -1 });
LeadSchema.index({ followUpDate: 1 });

export default mongoose.models.Lead || mongoose.model<ILead>("Lead", LeadSchema);
