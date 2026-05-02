import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import Lead from "@/models/Lead";
import User from "@/models/User";
import { requireAdmin, apiResponse, apiError } from "@/lib/middleware";

export async function GET(request: NextRequest) {
  const { error } = await requireAdmin(request);
  if (error) return error;

  try {
    await connectDB();

    const [
      totalLeads,
      statusDist,
      priorityDist,
      sourceDist,
      agentPerformance,
      recentLeads,
      monthlyTrend,
    ] = await Promise.all([
      Lead.countDocuments(),

      Lead.aggregate([
        { $group: { _id: "$status", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),

      Lead.aggregate([
        { $group: { _id: "$priority", count: { $sum: 1 } } },
      ]),

      Lead.aggregate([
        { $group: { _id: "$source", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),

      Lead.aggregate([
        { $match: { assignedTo: { $exists: true, $ne: null } } },
        {
          $group: {
            _id: "$assignedTo",
            totalLeads: { $sum: 1 },
            closedLeads: {
              $sum: { $cond: [{ $eq: ["$status", "Closed"] }, 1, 0] },
            },
            highPriority: {
              $sum: { $cond: [{ $eq: ["$priority", "High"] }, 1, 0] },
            },
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "_id",
            foreignField: "_id",
            as: "agent",
          },
        },
        { $unwind: "$agent" },
        {
          $project: {
            name: "$agent.name",
            email: "$agent.email",
            totalLeads: 1,
            closedLeads: 1,
            highPriority: 1,
            conversionRate: {
              $multiply: [
                { $divide: ["$closedLeads", "$totalLeads"] },
                100,
              ],
            },
          },
        },
        { $sort: { totalLeads: -1 } },
      ]),

      Lead.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .populate("assignedTo", "name")
        .lean(),

      Lead.aggregate([
        {
          $group: {
            _id: {
              month: { $month: "$createdAt" },
              year: { $year: "$createdAt" },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { "_id.year": 1, "_id.month": 1 } },
        { $limit: 12 },
      ]),
    ]);

    const unassignedLeads = await Lead.countDocuments({ assignedTo: null });
    const overdueFollowups = await Lead.countDocuments({
      followUpDate: { $lt: new Date() },
      status: { $nin: ["Closed", "Lost"] },
    });

    return apiResponse({
      totalLeads,
      unassignedLeads,
      overdueFollowups,
      statusDistribution: statusDist,
      priorityDistribution: priorityDist,
      sourceDistribution: sourceDist,
      agentPerformance,
      recentLeads,
      monthlyTrend,
    });
  } catch (err) {
    console.error("Analytics error:", err);
    return apiError("Server error", 500);
  }
}
