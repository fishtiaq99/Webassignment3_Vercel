import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import Lead from "@/models/Lead";
import Activity from "@/models/Activity";
import { requireAuth, apiResponse, apiError } from "@/lib/middleware";

export async function GET(request: NextRequest) {
  const { error, user } = await requireAuth(request);
  if (error) return error;

  try {
    await connectDB();

    const query: any = {
      status: { $nin: ["Closed", "Lost"] },
    };

    if (user.role === "agent") {
      query.assignedTo = user.id;
    }

    const now = new Date();
    const threeDaysLater = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

    // Overdue follow-ups
    const overdue = await Lead.find({
      ...query,
      followUpDate: { $lt: now },
    })
      .populate("assignedTo", "name")
      .sort({ followUpDate: 1 })
      .lean();

    // Upcoming (next 3 days)
    const upcoming = await Lead.find({
      ...query,
      followUpDate: { $gte: now, $lte: threeDaysLater },
    })
      .populate("assignedTo", "name")
      .sort({ followUpDate: 1 })
      .lean();

    // Stale leads (no activity in 7 days, no follow-up set)
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const stale = await Lead.find({
      ...query,
      lastActivityAt: { $lt: sevenDaysAgo },
      followUpDate: { $exists: false },
    })
      .populate("assignedTo", "name")
      .sort({ lastActivityAt: 1 })
      .lean();

    return apiResponse({ overdue, upcoming, stale });
  } catch (err) {
    return apiError("Server error", 500);
  }
}

export async function POST(request: NextRequest) {
  const { error, user } = await requireAuth(request);
  if (error) return error;

  try {
    const { leadId, followUpDate } = await request.json();

    await connectDB();

    const lead = await Lead.findByIdAndUpdate(
      leadId,
      { followUpDate: new Date(followUpDate), lastActivityAt: new Date() },
      { new: true }
    );

    if (!lead) return apiError("Lead not found", 404);

    await Activity.create({
      lead: leadId,
      performedBy: user.id,
      action: "FOLLOW_UP_SET",
      description: `Follow-up scheduled for ${new Date(followUpDate).toLocaleDateString()}`,
      newValue: followUpDate,
    });

    return apiResponse(lead);
  } catch (err) {
    return apiError("Server error", 500);
  }
}
