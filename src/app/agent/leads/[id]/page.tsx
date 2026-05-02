"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, MessageCircle, Calendar, Clock, Activity } from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import toast from "react-hot-toast";

const activityIcons: Record<string, string> = {
  LEAD_CREATED: "🆕", STATUS_UPDATED: "🔄", ASSIGNED: "👤",
  REASSIGNED: "🔁", NOTE_UPDATED: "📝", FOLLOW_UP_SET: "📅",
  PRIORITY_CHANGED: "⚡", LEAD_UPDATED: "✏️",
};

export default function AgentLeadDetail() {
  const { id } = useParams();
  const router = useRouter();
  const [lead, setLead] = useState<any>(null);
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");
  const [notes, setNotes] = useState("");
  const [followUpDate, setFollowUpDate] = useState("");
  const [saving, setSaving] = useState(false);
  const [settingFollowUp, setSettingFollowUp] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<any>(null);
  const [loadingAI, setLoadingAI] = useState(false);

  async function fetchData() {
    const [leadRes, actRes] = await Promise.all([
      fetch(`/api/leads/${id}`),
      fetch(`/api/leads/${id}/activities`),
    ]);
    const [leadData, actData] = await Promise.all([leadRes.json(), actRes.json()]);
    if (leadData.success) {
      setLead(leadData.data);
      setStatus(leadData.data.status);
      setNotes(leadData.data.notes || "");
    }
    if (actData.success) setActivities(actData.data);
    setLoading(false);
  }

  useEffect(() => { fetchData(); }, [id]);

  async function saveChanges() {
    setSaving(true);
    const res = await fetch(`/api/leads/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, notes }),
    });
    const data = await res.json();
    setSaving(false);
    if (data.success) { toast.success("Lead updated!"); fetchData(); }
    else toast.error("Failed to update");
  }

  async function setFollowUp() {
    if (!followUpDate) return;
    setSettingFollowUp(true);
    const res = await fetch("/api/followups", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ leadId: id, followUpDate }),
    });
    const data = await res.json();
    setSettingFollowUp(false);
    if (data.success) { toast.success("Follow-up scheduled!"); fetchData(); }
    else toast.error("Failed to set follow-up");
  }

  async function getAISuggestion() {
    setLoadingAI(true);
    setAiSuggestion(null);
    const res = await fetch(`/api/leads/${id}/ai-suggest`, { method: "POST" });
    const data = await res.json();
    if (data.success) setAiSuggestion(data.data);
    else toast.error("AI suggestion failed");
    setLoadingAI(false);
  }

  function openWhatsApp() {
    if (!lead?.phone) return;
    const clean = lead.phone.replace(/\D/g, "").replace(/^0/, "92");
    window.open(`https://wa.me/${clean}`, "_blank");
  }

  if (loading) return (
    <div style={{ padding: "32px", textAlign: "center", color: "#64748b", paddingTop: "100px" }}>Loading...</div>
  );

  if (!lead) return (
    <div style={{ padding: "32px", textAlign: "center" }}>
      <p style={{ color: "#ef4444" }}>Lead not found</p>
      <button onClick={() => router.back()} className="btn-primary" style={{ marginTop: "16px" }}>Go Back</button>
    </div>
  );

  return (
    <div style={{ padding: "32px" }}>
      <button onClick={() => router.back()} style={{ display: "flex", alignItems: "center", gap: "6px", background: "none", border: "none", color: "#64748b", cursor: "pointer", marginBottom: "24px", fontSize: "14px" }}>
        <ArrowLeft size={16} /> Back to Leads
      </button>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: "20px" }}>
        <div>
          <div className="card" style={{ padding: "28px", marginBottom: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
              <div>
                <h1 style={{ margin: 0, fontSize: "22px", fontWeight: "700", color: "#e2e8f0" }}>{lead.name}</h1>
                <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: "13px" }}>
                  Added {formatDistanceToNow(new Date(lead.createdAt), { addSuffix: true })}
                </p>
              </div>
              <span className={`badge-${lead.priority?.toLowerCase()}`} style={{ padding: "4px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: "600" }}>
                {lead.priority} Priority
              </span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "20px" }}>
              {[
                { label: "Phone", value: lead.phone },
                { label: "Email", value: lead.email || "—" },
                { label: "Property", value: lead.propertyInterest },
                { label: "Budget", value: lead.budgetFormatted },
                { label: "Source", value: lead.source },
                { label: "Location", value: lead.location || "—" },
              ].map(({ label, value }) => (
                <div key={label} style={{ padding: "12px", background: "rgba(99,102,241,0.05)", borderRadius: "8px" }}>
                  <div style={{ fontSize: "11px", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "4px" }}>{label}</div>
                  <div style={{ fontSize: "14px", color: "#e2e8f0", fontWeight: "500" }}>{value}</div>
                </div>
              ))}
            </div>

            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", fontSize: "12px", color: "#94a3b8", marginBottom: "6px", fontWeight: "500", textTransform: "uppercase" }}>Update Status</label>
              <select className="input" value={status} onChange={(e) => setStatus(e.target.value)}>
                {["New", "Contacted", "In Progress", "Closed", "Lost"].map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", fontSize: "12px", color: "#94a3b8", marginBottom: "6px", fontWeight: "500", textTransform: "uppercase" }}>Notes</label>
              <textarea className="input" value={notes} onChange={(e) => setNotes(e.target.value)} rows={4} placeholder="Add notes about this lead..." style={{ resize: "vertical" }} />
            </div>

            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              <button onClick={openWhatsApp} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "10px 16px", background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)", borderRadius: "8px", color: "#10b981", cursor: "pointer", fontSize: "13px", fontWeight: "500" }}>
                <MessageCircle size={15} /> WhatsApp
              </button>
              <button className="btn-primary" onClick={saveChanges} disabled={saving}>
                {saving ? "Saving..." : "Save Changes"}
              </button>
              <button
                onClick={getAISuggestion}
                disabled={loadingAI}
                style={{ display: "flex", alignItems: "center", gap: "6px", padding: "10px 16px", background: "linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.2))", border: "1px solid rgba(139,92,246,0.4)", borderRadius: "8px", color: "#a78bfa", cursor: loadingAI ? "not-allowed" : "pointer", fontSize: "13px", fontWeight: "500" }}
              >
                {loadingAI ? "🤖 Thinking..." : "🤖 AI Suggestion"}
              </button>
            </div>

            {/* AI Suggestion Card */}
            {aiSuggestion && (
              <div style={{ marginTop: "20px", padding: "20px", background: "linear-gradient(135deg, rgba(99,102,241,0.1), rgba(139,92,246,0.1))", border: "1px solid rgba(139,92,246,0.3)", borderRadius: "12px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
                  <span style={{ fontSize: "20px" }}>🤖</span>
                  <h3 style={{ margin: 0, fontSize: "15px", fontWeight: "600", color: "#a78bfa" }}>AI Follow-up Suggestion</h3>
                  <span style={{
                    marginLeft: "auto", padding: "3px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: "600",
                    background: aiSuggestion.urgency === "High" ? "rgba(239,68,68,0.15)" : aiSuggestion.urgency === "Medium" ? "rgba(245,158,11,0.15)" : "rgba(16,185,129,0.15)",
                    color: aiSuggestion.urgency === "High" ? "#ef4444" : aiSuggestion.urgency === "Medium" ? "#f59e0b" : "#10b981",
                  }}>
                    {aiSuggestion.urgency} Urgency
                  </span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "14px" }}>
                  {[
                    { label: "Recommended Action", value: aiSuggestion.recommendedAction },
                    { label: "Best Time to Contact", value: aiSuggestion.bestTimeToContact },
                    { label: "Follow Up In", value: `${aiSuggestion.followUpInDays} day(s)` },
                    { label: "Reasoning", value: aiSuggestion.reasoning },
                  ].map(({ label, value }) => (
                    <div key={label} style={{ padding: "10px", background: "rgba(99,102,241,0.05)", borderRadius: "8px" }}>
                      <div style={{ fontSize: "10px", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "4px" }}>{label}</div>
                      <div style={{ fontSize: "13px", color: "#e2e8f0" }}>{value}</div>
                    </div>
                  ))}
                </div>
                <div style={{ padding: "14px", background: "rgba(139,92,246,0.1)", borderRadius: "8px", borderLeft: "3px solid #a78bfa" }}>
                  <div style={{ fontSize: "11px", color: "#94a3b8", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>💬 Suggested Message</div>
                  <p style={{ margin: 0, color: "#e2e8f0", fontSize: "14px", lineHeight: "1.6" }}>{aiSuggestion.suggestedMessage}</p>
                </div>
              </div>
            )}
          </div>

          {/* Follow-up */}
          <div className="card" style={{ padding: "24px" }}>
            <h3 style={{ margin: "0 0 16px", fontSize: "15px", fontWeight: "600", color: "#e2e8f0", display: "flex", alignItems: "center", gap: "8px" }}>
              <Calendar size={16} color="#818cf8" /> Schedule Follow-up
            </h3>
            {lead.followUpDate && (
              <div style={{ padding: "10px 14px", background: "rgba(99,102,241,0.1)", borderRadius: "8px", marginBottom: "12px", fontSize: "14px", color: "#818cf8" }}>
                📅 Current: {format(new Date(lead.followUpDate), "PPP p")}
                {new Date(lead.followUpDate) < new Date() && (
                  <span style={{ marginLeft: "8px", color: "#ef4444", fontWeight: "600" }}>— OVERDUE</span>
                )}
              </div>
            )}
            <div style={{ display: "flex", gap: "10px" }}>
              <input type="datetime-local" className="input" value={followUpDate} onChange={(e) => setFollowUpDate(e.target.value)} style={{ flex: 1 }} />
              <button className="btn-primary" onClick={setFollowUp} disabled={settingFollowUp || !followUpDate}>
                {settingFollowUp ? "..." : "Set"}
              </button>
            </div>
          </div>
        </div>

        {/* Activity Timeline */}
        <div className="card" style={{ padding: "24px", maxHeight: "75vh", overflow: "auto" }}>
          <h3 style={{ margin: "0 0 20px", fontSize: "15px", fontWeight: "600", color: "#e2e8f0", display: "flex", alignItems: "center", gap: "8px" }}>
            <Activity size={16} color="#818cf8" /> Activity Timeline
          </h3>
          {activities.length === 0 ? (
            <p style={{ color: "#475569", fontSize: "13px", textAlign: "center" }}>No activity yet</p>
          ) : (
            <div style={{ position: "relative" }}>
              <div style={{ position: "absolute", left: "15px", top: 0, bottom: 0, width: "2px", background: "rgba(99,102,241,0.2)" }} />
              {activities.map((a) => (
                <div key={a._id} style={{ display: "flex", gap: "12px", marginBottom: "18px", position: "relative" }}>
                  <div style={{ width: "30px", height: "30px", borderRadius: "50%", background: "rgba(99,102,241,0.15)", border: "2px solid rgba(99,102,241,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px", flexShrink: 0, zIndex: 1 }}>
                    {activityIcons[a.action] || "•"}
                  </div>
                  <div style={{ paddingTop: "4px" }}>
                    <p style={{ margin: 0, fontSize: "13px", color: "#e2e8f0", fontWeight: "500" }}>{a.description}</p>
                    <div style={{ display: "flex", gap: "6px", marginTop: "3px", fontSize: "11px", color: "#475569" }}>
                      <span>{a.performedBy?.name}</span>
                      <span>•</span>
                      <span><Clock size={10} style={{ display: "inline" }} /> {formatDistanceToNow(new Date(a.createdAt), { addSuffix: true })}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}