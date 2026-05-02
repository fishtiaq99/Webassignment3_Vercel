import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { requireAdmin, requireAuth, apiResponse, apiError } from "@/lib/middleware";

export async function GET(request: NextRequest) {
  const { error } = await requireAuth(request);
  if (error) return error;

  try {
    await connectDB();
    const agents = await User.find({ role: "agent", isActive: true })
      .select("-password")
      .sort({ name: 1 })
      .lean();

    return apiResponse(agents);
  } catch (err) {
    return apiError("Server error", 500);
  }
}

export async function PUT(request: NextRequest) {
  const { error, user } = await requireAdmin(request);
  if (error) return error;

  try {
    const body = await request.json();
    const { agentId, isActive } = body;

    await connectDB();
    const agent = await User.findByIdAndUpdate(
      agentId,
      { isActive },
      { new: true }
    ).select("-password");

    if (!agent) return apiError("Agent not found", 404);
    return apiResponse(agent);
  } catch (err) {
    return apiError("Server error", 500);
  }
}
