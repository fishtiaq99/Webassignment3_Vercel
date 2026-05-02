import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Lead from "@/models/Lead";
import { requireAdmin, apiError } from "@/lib/middleware";

export async function GET(request: NextRequest) {
  const { error } = await requireAdmin(request);
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const format = searchParams.get("format") || "json";

  try {
    await connectDB();
    const leads = await Lead.find()
      .populate("assignedTo", "name email")
      .sort({ createdAt: -1 })
      .lean();

    const data = leads.map((l: any) => ({
      Name: l.name,
      Email: l.email || "",
      Phone: l.phone,
      "Property Interest": l.propertyInterest,
      Budget: l.budgetFormatted,
      Status: l.status,
      Priority: l.priority,
      Source: l.source,
      "Assigned To": l.assignedTo?.name || "Unassigned",
      Location: l.location || "",
      Notes: l.notes || "",
      "Follow Up Date": l.followUpDate
        ? new Date(l.followUpDate).toLocaleDateString()
        : "",
      "Created At": new Date(l.createdAt).toLocaleDateString(),
    }));

    if (format === "csv") {
      const headers = Object.keys(data[0] || {}).join(",");
      const rows = data.map((row) =>
        Object.values(row)
          .map((v) => `"${String(v).replace(/"/g, '""')}"`)
          .join(",")
      );
      const csv = [headers, ...rows].join("\n");

      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="leads-${Date.now()}.csv"`,
        },
      });
    }

    return NextResponse.json({ success: true, data });
  } catch (err) {
    return apiError("Server error", 500);
  }
}
