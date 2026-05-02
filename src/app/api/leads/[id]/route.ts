import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import Lead from "@/models/Lead";
import Activity from "@/models/Activity";
import User from "@/models/User";
import { requireAuth, apiResponse, apiError } from "@/lib/middleware";
import { sendEmail, assignmentEmailTemplate } from "@/lib/email";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { error, user } = await requireAuth(request);
  if (error) return error;

  try {
    await connectDB();
    const lead = await Lead.findById(params.id).populate("assignedTo", "name email phone");
    if (!lead) return apiError("Lead not found", 404);

    if (user.role === "agent" && lead.assignedTo?._id.toString() !== user.id) {
      return apiError("Access denied", 403);
    }

    return apiResponse(lead);
  } catch {
    return apiError("Server error", 500);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { error, user } = await requireAuth(request);
  if (error) return error;

  try {
    const body = await request.json();
    await connectDB();

    const existing = await Lead.findById(params.id);
    if (!existing) return apiError("Lead not found", 404);

    if (user.role === "agent") {
      if (existing.assignedTo?.toString() !== user.id) return apiError("Access denied", 403);
      delete body.assignedTo;
    }

    const wasReassigned = body.assignedTo && body.assignedTo !== existing.assignedTo?.toString();
    const statusChanged = body.status && body.status !== existing.status;
    const notesChanged = body.notes !== undefined && body.notes !== existing.notes;
    const priorityChanged = body.priority && body.priority !== existing.priority;
    const followUpChanged = body.followUpDate !== undefined;

    const updated = await Lead.findByIdAndUpdate(
      params.id,
      { $set: { ...body, lastActivityAt: new Date() } },
      { new: true }
    ).populate("assignedTo", "name email");

    // Log each change as separate activity
    const activities = [];

    if (wasReassigned) {
      const newAgent = await User.findById(body.assignedTo).select("name");
      activities.push({
        lead: params.id,
        performedBy: user.id,
        action: existing.assignedTo ? "REASSIGNED" : "ASSIGNED",
        description: existing.assignedTo
          ? `Lead reassigned to ${newAgent?.name || "agent"}`
          : `Lead assigned to ${newAgent?.name || "agent"}`,
        oldValue: existing.assignedTo?.toString(),
        newValue: body.assignedTo,
      });
    }

    if (statusChanged) {
      activities.push({
        lead: params.id,
        performedBy: user.id,
        action: "STATUS_UPDATED",
        description: `Status changed from ${existing.status} to ${body.status}`,
        oldValue: existing.status,
        newValue: body.status,
      });
    }

    if (notesChanged) {
      activities.push({
        lead: params.id,
        performedBy: user.id,
        action: "NOTE_UPDATED",
        description: "Notes were updated",
        oldValue: existing.notes || "",
        newValue: body.notes,
      });
    }

    if (priorityChanged) {
      activities.push({
        lead: params.id,
        performedBy: user.id,
        action: "PRIORITY_CHANGED",
        description: `Priority changed from ${existing.priority} to ${body.priority}`,
        oldValue: existing.priority,
        newValue: body.priority,
      });
    }

    if (followUpChanged) {
      activities.push({
        lead: params.id,
        performedBy: user.id,
        action: "FOLLOW_UP_SET",
        description: `Follow-up scheduled for ${new Date(body.followUpDate).toLocaleDateString()}`,
        newValue: body.followUpDate,
      });
    }

    if (activities.length === 0) {
      activities.push({
        lead: params.id,
        performedBy: user.id,
        action: "LEAD_UPDATED",
        description: "Lead details updated",
      });
    }

    await Activity.insertMany(activities);

    if (wasReassigned && updated?.assignedTo) {
      const agent = await User.findById(body.assignedTo);
      if (agent) {
        await sendEmail({
          to: agent.email,
          subject: `Lead Assigned: ${updated.name}`,
          html: assignmentEmailTemplate(agent.name, updated.name, updated),
        });
      }
    }

    return apiResponse(updated);
  } catch (err) {
    console.error(err);
    return apiError("Server error", 500);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { error, user } = await requireAuth(request);
  if (error) return error;

  if (user.role !== "admin") return apiError("Admin only", 403);

  try {
    await connectDB();
    const lead = await Lead.findById(params.id);
    if (!lead) return apiError("Lead not found", 404);

    await Lead.findByIdAndDelete(params.id);
    await Activity.deleteMany({ lead: params.id });
    return apiResponse({ message: "Deleted" });
  } catch {
    return apiError("Server error", 500);
  }
}