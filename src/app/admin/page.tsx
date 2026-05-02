import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Lead from "@/models/Lead";
import User from "@/models/User";
import AdminDashboardClient from "@/components/dashboard/AdminDashboardClient";

export default async function AdminDashboard() {
  await connectDB();

  const [totalLeads, totalAgents, highPriority, unassigned, recentLeads] =
    await Promise.all([
      Lead.countDocuments(),
      User.countDocuments({ role: "agent", isActive: true }),
      Lead.countDocuments({ priority: "High" }),
      Lead.countDocuments({ assignedTo: null }),
      Lead.find()
        .populate("assignedTo", "name")
        .sort({ createdAt: -1 })
        .limit(8)
        .lean(),
    ]);

  const stats = { totalLeads, totalAgents, highPriority, unassigned };

  return (
    <AdminDashboardClient
      stats={stats}
      recentLeads={JSON.parse(JSON.stringify(recentLeads))}
    />
  );
}
