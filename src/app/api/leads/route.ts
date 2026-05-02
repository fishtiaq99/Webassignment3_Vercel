import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import Lead from "@/models/Lead";
import Activity from "@/models/Activity";
import User from "@/models/User";
import {
  requireAuth,
  validateBody,
  apiResponse,
  apiError,
  rateLimit,
} from "@/lib/middleware";
import {
  sendEmail,
  newLeadEmailTemplate,
  assignmentEmailTemplate,
} from "@/lib/email";

/* ========================= GET ========================= */
export async function GET(request: NextRequest) {
  const { error, user } = await requireAuth(request);
  if (error) return error;

  if (user.role === "agent") {
    const { allowed } = rateLimit(`agent:${user.id}`, 50, 60000);
    if (!allowed)
      return apiError("Rate limit exceeded. Max 50 requests/minute.", 429);
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const priority = searchParams.get("priority");
  const assignedTo = searchParams.get("assignedTo");
  const source = searchParams.get("source");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const search = searchParams.get("search");

  try {
    await connectDB();

    const query: any = {};

    if (user.role === "agent") {
      query.assignedTo = user.id;
    } else if (assignedTo) {
      query.assignedTo = assignedTo;
    }

    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (source) query.source = source;

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
      ];
    }

    const total = await Lead.countDocuments(query);

    const leads = await Lead.find(query)
      .populate("assignedTo", "name email")
      .sort({ score: -1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    return apiResponse({
      leads,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error(err);
    return apiError("Server error", 500);
  }
}

/* ========================= POST ========================= */
export async function POST(request: NextRequest) {
  const { error, user } = await requireAuth(request);
  if (error) return error;

  try {
    const body = await request.json();

    const { valid, missing } = validateBody(body, [
      "name",
      "phone",
      "propertyInterest",
      "budget",
    ]);

    if (!valid)
      return apiError(`Missing fields: ${missing?.join(", ")}`);

    await connectDB();

    const lead = await Lead.create({
      ...body,
      lastActivityAt: new Date(),
    });

    await Activity.create({
      lead: lead._id,
      performedBy: user.id,
      action: "LEAD_CREATED",
      description: `Lead created by ${user.name}`,
    });

    // 🔔 Email to admins
    const admins = await User.find({
      role: "admin",
      isActive: true,
    }).select("email");

    for (const admin of admins) {
      await sendEmail({
        to: admin.email,
        subject: `New Lead: ${lead.name}`,
        html: newLeadEmailTemplate(lead.name, lead),
      });
    }

    return apiResponse(lead, 201);
  } catch (err) {
    console.error(err);
    return apiError("Server error", 500);
  }
}

/* ========================= PUT ========================= */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { error, user } = await requireAuth(request);
  if (error) return error;

  try {
    await connectDB();

    const body = await request.json();

    const existingLead = await Lead.findById(params.id);
    if (!existingLead) return apiError("Lead not found", 404);

    // 🔍 Track changes
    const changes: string[] = [];

    // Status change
    if (body.status && body.status !== existingLead.status) {
      changes.push(`Status changed from ${existingLead.status} → ${body.status}`);

      await Activity.create({
        lead: existingLead._id,
        performedBy: user.id,
        action: "STATUS_UPDATED",
        description: `Status changed to ${body.status}`,
      });
    }

    // Notes update
    if (body.notes && body.notes !== existingLead.notes) {
      changes.push("Notes updated");

      await Activity.create({
        lead: existingLead._id,
        performedBy: user.id,
        action: "NOTES_UPDATED",
        description: "Lead notes updated",
      });
    }

    // Assignment change
    if (
      body.assignedTo &&
      body.assignedTo.toString() !== existingLead.assignedTo?.toString()
    ) {
      const agent = await User.findById(body.assignedTo);

      changes.push(`Assigned to ${agent?.name}`);

      await Activity.create({
        lead: existingLead._id,
        performedBy: user.id,
        action: "REASSIGNED",
        description: `Lead assigned to ${agent?.name}`,
      });

      // 📧 Send email to agent
      if (agent?.email) {
        await sendEmail({
          to: agent.email,
          subject: "New Lead Assigned",
          html: assignmentEmailTemplate(agent.name, existingLead.name, existingLead),
        });
      }
    }

    // Update lead
    const updatedLead = await Lead.findByIdAndUpdate(
      params.id,
      {
        ...body,
        lastActivityAt: new Date(),
      },
      { new: true }
    );

    return apiResponse(updatedLead);
  } catch (err) {
    console.error(err);
    return apiError("Server error", 500);
  }
}