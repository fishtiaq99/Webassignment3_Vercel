import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import Lead from "@/models/Lead";
import Activity from "@/models/Activity";
import { requireAuth, apiResponse, apiError } from "@/lib/middleware";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { error, user } = await requireAuth(request);
  if (error) return error;

  try {
    await connectDB();

    const lead = await Lead.findById(params.id)
      .populate("assignedTo", "name")
      .lean();

    if (!lead) return apiError("Lead not found", 404);

    const activities = await Activity.find({ lead: params.id })
      .populate("performedBy", "name")
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    const activitySummary = activities
      .map((a: any) => `- ${a.action}: ${a.description}`)
      .join("\n");

    const prompt = `You are a real estate CRM assistant for a property dealer in Pakistan. 
Analyze this lead and suggest the best follow-up action.

LEAD DETAILS:
- Name: ${(lead as any).name}
- Phone: ${(lead as any).phone}
- Property Interest: ${(lead as any).propertyInterest}
- Budget: ${(lead as any).budgetFormatted}
- Priority: ${(lead as any).priority}
- Status: ${(lead as any).status}
- Source: ${(lead as any).source}
- Location: ${(lead as any).location || "Not specified"}
- Notes: ${(lead as any).notes || "None"}
- Follow-up Date: ${(lead as any).followUpDate ? new Date((lead as any).followUpDate).toLocaleDateString() : "Not set"}
- Last Activity: ${(lead as any).lastActivityAt ? new Date((lead as any).lastActivityAt).toLocaleDateString() : "Unknown"}

RECENT ACTIVITY:
${activitySummary || "No activity recorded yet"}

Respond in this exact JSON format only, no extra text:
{
  "suggestedMessage": "A WhatsApp/call script in Urdu-English mix (2-3 sentences) the agent should use",
  "recommendedAction": "One specific action to take (e.g. Call, WhatsApp, Schedule Visit, Send Brochure)",
  "urgency": "High|Medium|Low",
  "reasoning": "One sentence explaining why this approach",
  "bestTimeToContact": "Morning|Afternoon|Evening",
  "followUpInDays": 1
}`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    const data = await response.json();
    const text = data.content?.[0]?.text || "";

    let suggestion;
    try {
      suggestion = JSON.parse(text);
    } catch {
      suggestion = { suggestedMessage: text, recommendedAction: "Follow up", urgency: "Medium" };
    }

    return apiResponse(suggestion);
  } catch (err) {
    console.error("AI suggest error:", err);
    return apiError("AI suggestion failed", 500);
  }
}