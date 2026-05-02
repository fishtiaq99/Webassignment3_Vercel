"use client";
import { useState, useEffect, useCallback } from "react";
import {
  AlertTriangle, Calendar, Clock, RefreshCw,
  Search, User, MessageCircle, TrendingUp
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import Link from "next/link";
import toast from "react-hot-toast";

interface FollowupLead {
  _id: string;
  name: string;
  phone: string;
  propertyInterest: string;
  budgetFormatted: string;
  priority: string;
  status: string;
  followUpDate?: string;
  lastActivityAt: string;
  assignedTo?: { _id: string; name: string };
}

interface FollowupData {
  overdue: FollowupLead[];
  upcoming: FollowupLead[];
  stale: FollowupLead[];
}

export default function AdminFollowupsPage() {
  const [data, setData] = useState<FollowupData>({ overdue: [], upcoming: [], stale: [] });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"overdue" | "upcoming" | "stale">("overdue");

  const fetchFollowups = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/followups");
      const json = await res.json();
      if (json.success) setData(json.data);
      else toast.error("Failed to load follow-ups");
    } catch {
      toast.error("Server error");
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchFollowups(); }, []);

  // Auto-refresh every 30s
  useEffect(() => {
    const interval = setInterval(fetchFollowups, 30000);
    return () => clearInterval(interval);
  }, [fetchFollowups]);

  function openWhatsApp(phone: string) {
    const clean = phone.replace(/\D/g, "").replace(/^0/, "92");
    window.open(`https://wa.me/${clean}`, "_blank");
  }

  const tabs: { key: "overdue" | "upcoming" | "stale"; label: string; icon: any; color: string }[] = [
    { key: "overdue", label: "Overdue", icon: AlertTriangle, color: "#ef4444" },
    { key: "upcoming", label: "Upcoming (3 days)", icon: Calendar, color: "#10b981" },
    { key: "stale", label: "Stale Leads", icon: Clock, color: "#f59e0b" },
  ];

  const currentLeads = data[activeTab].filter((lead) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      lead.name.toLowerCase().includes(s) ||
      lead.phone.includes(s) ||
      (lead.assignedTo?.name || "").toLowerCase().includes(s)
    );
  });

  const activeColor = tabs.find((t) => t.key === activeTab)?.color || "#818cf8";

  return (
    <div style={{ padding: "32px" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "28px",
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: "24px", fontWeight: "700", color: "#e2e8f0" }}>
            Follow-up Tracker
          </h1>
          <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: "14px" }}>
            Monitor overdue, upcoming, and stale leads across all agents
          </p>
        </div>
        <button
          onClick={fetchFollowups}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            padding: "10px 14px",
            background: "rgba(99,102,241,0.1)",
            border: "1px solid rgba(99,102,241,0.3)",
            borderRadius: "8px",
            color: "#818cf8",
            cursor: "pointer",
            fontSize: "13px",
          }}
        >
          <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* Summary Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "16px",
          marginBottom: "24px",
        }}
      >
        {[
          {
            label: "Overdue Follow-ups",
            value: data.overdue.length,
            icon: AlertTriangle,
            color: "#ef4444",
            bg: "rgba(239,68,68,0.1)",
          },
          {
            label: "Upcoming (3 days)",
            value: data.upcoming.length,
            icon: Calendar,
            color: "#10b981",
            bg: "rgba(16,185,129,0.1)",
          },
          {
            label: "Stale Leads",
            value: data.stale.length,
            icon: Clock,
            color: "#f59e0b",
            bg: "rgba(245,158,11,0.1)",
          },
          {
            label: "Total Needing Attention",
            value: data.overdue.length + data.upcoming.length + data.stale.length,
            icon: TrendingUp,
            color: "#818cf8",
            bg: "rgba(99,102,241,0.1)",
          },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div
            key={label}
            className="card"
            style={{ padding: "20px", display: "flex", alignItems: "center", gap: "14px" }}
          >
            <div
              style={{
                width: "44px",
                height: "44px",
                borderRadius: "10px",
                background: bg,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Icon size={20} color={color} />
            </div>
            <div>
              <div style={{ fontSize: "22px", fontWeight: "700", color: "#e2e8f0" }}>
                {loading ? "—" : value}
              </div>
              <div style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }}>
                {label}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs + Search */}
      <div className="card" style={{ marginBottom: "20px", overflow: "hidden" }}>
        {/* Tab Bar */}
        <div
          style={{
            display: "flex",
            gap: "0",
            borderBottom: "1px solid rgba(99,102,241,0.15)",
            padding: "0 20px",
          }}
        >
          {tabs.map(({ key, label, icon: Icon, color }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "7px",
                padding: "14px 18px",
                background: "none",
                border: "none",
                borderBottom: activeTab === key ? `2px solid ${color}` : "2px solid transparent",
                color: activeTab === key ? color : "#64748b",
                cursor: "pointer",
                fontSize: "13px",
                fontWeight: activeTab === key ? "600" : "400",
                transition: "all 0.2s",
                marginBottom: "-1px",
              }}
            >
              <Icon size={14} />
              {label}
              <span
                style={{
                  background: activeTab === key ? `${color}22` : "rgba(99,102,241,0.08)",
                  color: activeTab === key ? color : "#475569",
                  padding: "1px 7px",
                  borderRadius: "10px",
                  fontSize: "11px",
                  fontWeight: "600",
                }}
              >
                {data[key].length}
              </span>
            </button>
          ))}
        </div>

        {/* Search */}
        <div style={{ padding: "14px 20px", borderBottom: "1px solid rgba(99,102,241,0.1)" }}>
          <div style={{ position: "relative", maxWidth: "360px" }}>
            <Search
              size={14}
              style={{
                position: "absolute",
                left: "10px",
                top: "50%",
                transform: "translateY(-50%)",
                color: "#64748b",
              }}
            />
            <input
              className="input"
              placeholder="Search by name, phone or agent..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: "32px", height: "36px", fontSize: "13px" }}
            />
          </div>
        </div>

        {/* Context hint */}
        <div
          style={{
            padding: "10px 20px",
            background: `${activeColor}0a`,
            borderBottom: "1px solid rgba(99,102,241,0.08)",
            fontSize: "12px",
            color: "#64748b",
          }}
        >
          {activeTab === "overdue" && "⚠️ These leads have passed their follow-up date and need immediate attention."}
          {activeTab === "upcoming" && "📅 Follow-ups scheduled within the next 3 days — plan ahead."}
          {activeTab === "stale" && "💤 No activity for 7+ days and no follow-up scheduled. Reach out soon."}
        </div>

        {/* Table */}
        {loading ? (
          <div style={{ padding: "60px", textAlign: "center", color: "#475569" }}>
            Loading follow-ups...
          </div>
        ) : currentLeads.length === 0 ? (
          <div style={{ padding: "60px", textAlign: "center", color: "#475569" }}>
            {search
              ? "No leads match your search."
              : activeTab === "overdue"
              ? "✅ No overdue follow-ups. Great work!"
              : activeTab === "upcoming"
              ? "No follow-ups in the next 3 days."
              : "No stale leads. All leads are active!"}
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "rgba(99,102,241,0.05)" }}>
                  {[
                    "Client",
                    "Phone",
                    "Property",
                    "Budget",
                    "Priority",
                    "Agent",
                    activeTab === "stale" ? "Last Activity" : "Follow-up Date",
                    "Actions",
                  ].map((h) => (
                    <th
                      key={h}
                      style={{
                        padding: "10px 16px",
                        textAlign: "left",
                        fontSize: "11px",
                        color: "#64748b",
                        textTransform: "uppercase",
                        fontWeight: "600",
                        letterSpacing: "0.5px",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {currentLeads.map((lead) => (
                  <tr key={lead._id} className="table-row">
                    <td style={{ padding: "14px 16px" }}>
                      <Link
                        href={`/admin/leads/${lead._id}`}
                        style={{
                          color: "#e2e8f0",
                          textDecoration: "none",
                          fontWeight: "500",
                          fontSize: "14px",
                        }}
                      >
                        {lead.name}
                      </Link>
                    </td>
                    <td style={{ padding: "14px 16px", color: "#94a3b8", fontSize: "13px" }}>
                      {lead.phone}
                    </td>
                    <td style={{ padding: "14px 16px", color: "#94a3b8", fontSize: "13px" }}>
                      {lead.propertyInterest}
                    </td>
                    <td
                      style={{
                        padding: "14px 16px",
                        color: "#94a3b8",
                        fontSize: "13px",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {lead.budgetFormatted}
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <span
                        className={`badge-${lead.priority?.toLowerCase()}`}
                        style={{
                          padding: "3px 10px",
                          borderRadius: "20px",
                          fontSize: "11px",
                          fontWeight: "600",
                        }}
                      >
                        {lead.priority}
                      </span>
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      {lead.assignedTo ? (
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <div
                            style={{
                              width: "24px",
                              height: "24px",
                              borderRadius: "6px",
                              background: "linear-gradient(135deg, #4f46e5, #6366f1)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: "10px",
                              fontWeight: "700",
                              color: "white",
                              flexShrink: 0,
                            }}
                          >
                            {lead.assignedTo.name.charAt(0).toUpperCase()}
                          </div>
                          <span style={{ fontSize: "13px", color: "#94a3b8" }}>
                            {lead.assignedTo.name}
                          </span>
                        </div>
                      ) : (
                        <span style={{ fontSize: "13px", color: "#475569" }}>Unassigned</span>
                      )}
                    </td>
                    <td style={{ padding: "14px 16px", fontSize: "13px" }}>
                      {activeTab === "stale" ? (
                        <span style={{ color: "#f59e0b" }}>
                          {formatDistanceToNow(new Date(lead.lastActivityAt), {
                            addSuffix: true,
                          })}
                        </span>
                      ) : lead.followUpDate ? (
                        <span style={{ color: activeColor }}>
                          {format(new Date(lead.followUpDate), "MMM d, yyyy")}
                          <br />
                          <span style={{ fontSize: "11px", opacity: 0.8 }}>
                            {formatDistanceToNow(new Date(lead.followUpDate), {
                              addSuffix: true,
                            })}
                          </span>
                        </span>
                      ) : (
                        <span style={{ color: "#475569" }}>No date set</span>
                      )}
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <button
                        title="WhatsApp"
                        onClick={() => openWhatsApp(lead.phone)}
                        style={{
                          padding: "6px",
                          background: "rgba(16,185,129,0.1)",
                          border: "none",
                          borderRadius: "6px",
                          color: "#10b981",
                          cursor: "pointer",
                        }}
                      >
                        <MessageCircle size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
