import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import Activity from "@/models/Activity";
import { requireAuth, apiResponse, apiError } from "@/lib/middleware";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { error } = await requireAuth(request);
  if (error) return error;

  try {
    await connectDB();
    const activities = await Activity.find({ lead: params.id })
      .populate("performedBy", "name role")
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    return apiResponse(activities);
  } catch (err) {
    return apiError("Server error", 500);
  }
}
