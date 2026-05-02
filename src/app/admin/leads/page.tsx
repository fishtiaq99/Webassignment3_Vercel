"use client";
import { useState, useEffect, useCallback } from "react";
import { Plus, Search, Filter, RefreshCw, MessageCircle, Trash2, Edit, UserCheck, Download } from "lucide-react";
import toast from "react-hot-toast";
import { formatDistanceToNow } from "date-fns";
import LeadFormModal from "@/components/leads/LeadFormModal";
import AssignModal from "@/components/leads/AssignModal";
import Link from "next/link";

const statusClass: Record<string, string> = {
  New: "status-new", Contacted: "status-contacted", "In Progress": "status-in-progress", Closed: "status-closed", Lost: "status-lost",
};

export default function AdminLeadsPage() {
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editLead, setEditLead] = useState<any>(null);
  const [assignLead, setAssignLead] = useState<any>(null);
  const [filters, setFilters] = useState({ status: "", priority: "", search: "", source: "" });
  const [pagination, setPagination] = useState({ total: 0, page: 1, totalPages: 1 });

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({
      page: String(pagination.page),
      limit: "15",
      ...(filters.status && { status: filters.status }),
      ...(filters.priority && { priority: filters.priority }),
      ...(filters.search && { search: filters.search }),
      ...(filters.source && { source: filters.source }),
    });

    const res = await fetch(`/api/leads?${params}`);
    const data = await res.json();
    if (data.success) {
      setLeads(data.data.leads);
      setPagination(data.data.pagination);
    }
    setLoading(false);
  }, [filters, pagination.page]);

  useEffect(() => { fetchLeads(); }, []);
  useEffect(() => {
    const t = setTimeout(fetchLeads, 400);
    return () => clearTimeout(t);
  }, [filters]);

  // Poll every 20s for real-time updates
  useEffect(() => {
    const interval = setInterval(fetchLeads, 20000);
    return () => clearInterval(interval);
  }, [fetchLeads]);

  async function deleteLead(id: string, name: string) {
    if (!confirm(`Delete lead "${name}"? This cannot be undone.`)) return;
    const res = await fetch(`/api/leads/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (data.success) { toast.success("Lead deleted"); fetchLeads(); }
    else toast.error("Failed to delete");
  }

  function openWhatsApp(phone: string) {
    const clean = phone.replace(/\D/g, "").replace(/^0/, "92");
    window.open(`https://wa.me/${clean}`, "_blank");
  }

  async function exportCSV() {
    const res = await fetch("/api/leads/export?format=csv");
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `leads-${Date.now()}.csv`;
    a.click();
    toast.success("Exported successfully!");
  }

  return (
    <div style={{ padding: "32px" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: "24px", fontWeight: "700", color: "#e2e8f0" }}>Lead Management</h1>
          <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: "14px" }}>
            {pagination.total} total leads
          </p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button onClick={exportCSV} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "10px 14px", background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)", borderRadius: "8px", color: "#10b981", cursor: "pointer", fontSize: "13px", fontWeight: "500" }}>
            <Download size={15} /> Export CSV
          </button>
          <button onClick={fetchLeads} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "10px 14px", background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.3)", borderRadius: "8px", color: "#818cf8", cursor: "pointer", fontSize: "13px" }}>
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} /> Refresh
          </button>
          <button className="btn-primary" onClick={() => setShowCreateModal(true)} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <Plus size={16} /> Add Lead
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card" style={{ padding: "16px 20px", marginBottom: "20px" }}>
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ position: "relative", flex: 1, minWidth: "200px" }}>
            <Search size={15} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "#64748b" }} />
            <input
              className="input"
              placeholder="Search name, phone, email..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              style={{ paddingLeft: "32px", height: "38px" }}
            />
          </div>
          {[
            { key: "status", options: ["", "New", "Contacted", "In Progress", "Closed", "Lost"], placeholder: "Status" },
            { key: "priority", options: ["", "High", "Medium", "Low"], placeholder: "Priority" },
            { key: "source", options: ["", "Facebook Ads", "Walk-in", "Website", "Referral", "Phone"], placeholder: "Source" },
          ].map(({ key, options, placeholder }) => (
            <select
              key={key}
              className="input"
              value={(filters as any)[key]}
              onChange={(e) => setFilters({ ...filters, [key]: e.target.value })}
              style={{ width: "150px", height: "38px" }}
            >
              <option value="">{placeholder}</option>
              {options.filter(Boolean).map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          ))}
          {Object.values(filters).some(Boolean) && (
            <button
              onClick={() => setFilters({ status: "", priority: "", search: "", source: "" })}
              style={{ padding: "8px 14px", background: "none", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "8px", color: "#ef4444", cursor: "pointer", fontSize: "13px", whiteSpace: "nowrap" }}
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="card" style={{ overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "rgba(99,102,241,0.05)" }}>
                {["Client", "Phone", "Property", "Budget", "Priority", "Status", "Source", "Assigned To", "Created", "Actions"].map((h) => (
                  <th key={h} style={{ padding: "12px 14px", textAlign: "left", fontSize: "11px", fontWeight: "600", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px", whiteSpace: "nowrap" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array(5).fill(0).map((_, i) => (
                  <tr key={i} className="table-row">
                    {Array(10).fill(0).map((_, j) => (
                      <td key={j} style={{ padding: "14px" }}>
                        <div style={{ height: "16px", background: "rgba(99,102,241,0.1)", borderRadius: "4px", animation: "pulse 1.5s infinite" }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : leads.length === 0 ? (
                <tr>
                  <td colSpan={10} style={{ padding: "60px", textAlign: "center", color: "#475569" }}>
                    No leads found. Try adjusting your filters.
                  </td>
                </tr>
              ) : leads.map((lead) => (
                <tr key={lead._id} className="table-row">
                  <td style={{ padding: "14px" }}>
                    <Link href={`/admin/leads/${lead._id}`} style={{ color: "#e2e8f0", textDecoration: "none", fontWeight: "500", fontSize: "14px" }}>
                      {lead.name}
                    </Link>
                    {lead.email && <div style={{ fontSize: "12px", color: "#64748b" }}>{lead.email}</div>}
                  </td>
                  <td style={{ padding: "14px", fontSize: "13px", color: "#94a3b8", whiteSpace: "nowrap" }}>{lead.phone}</td>
                  <td style={{ padding: "14px", fontSize: "13px", color: "#94a3b8" }}>{lead.propertyInterest}</td>
                  <td style={{ padding: "14px", fontSize: "13px", color: "#94a3b8", whiteSpace: "nowrap" }}>{lead.budgetFormatted}</td>
                  <td style={{ padding: "14px" }}>
                    <span className={`badge-${lead.priority?.toLowerCase()}`} style={{ padding: "3px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: "600", whiteSpace: "nowrap" }}>
                      {lead.priority}
                    </span>
                  </td>
                  <td style={{ padding: "14px" }}>
                    <span className={statusClass[lead.status]} style={{ padding: "3px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: "500", whiteSpace: "nowrap" }}>
                      {lead.status}
                    </span>
                  </td>
                  <td style={{ padding: "14px", fontSize: "12px", color: "#64748b", whiteSpace: "nowrap" }}>{lead.source}</td>
                  <td style={{ padding: "14px", fontSize: "13px", color: lead.assignedTo ? "#94a3b8" : "#475569", whiteSpace: "nowrap" }}>
                    {lead.assignedTo?.name || "Unassigned"}
                  </td>
                  <td style={{ padding: "14px", fontSize: "12px", color: "#475569", whiteSpace: "nowrap" }}>
                    {formatDistanceToNow(new Date(lead.createdAt), { addSuffix: true })}
                  </td>
                  <td style={{ padding: "14px" }}>
                    <div style={{ display: "flex", gap: "6px" }}>
                      <button
                        title="WhatsApp"
                        onClick={() => openWhatsApp(lead.phone)}
                        style={{ padding: "6px", background: "rgba(16,185,129,0.1)", border: "none", borderRadius: "6px", color: "#10b981", cursor: "pointer" }}
                      >
                        <MessageCircle size={14} />
                      </button>
                      <button
                        title="Assign"
                        onClick={() => setAssignLead(lead)}
                        style={{ padding: "6px", background: "rgba(99,102,241,0.1)", border: "none", borderRadius: "6px", color: "#818cf8", cursor: "pointer" }}
                      >
                        <UserCheck size={14} />
                      </button>
                      <button
                        title="Edit"
                        onClick={() => setEditLead(lead)}
                        style={{ padding: "6px", background: "rgba(245,158,11,0.1)", border: "none", borderRadius: "6px", color: "#f59e0b", cursor: "pointer" }}
                      >
                        <Edit size={14} />
                      </button>
                      <button
                        title="Delete"
                        onClick={() => deleteLead(lead._id, lead.name)}
                        style={{ padding: "6px", background: "rgba(239,68,68,0.1)", border: "none", borderRadius: "6px", color: "#ef4444", cursor: "pointer" }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div style={{ padding: "16px 20px", borderTop: "1px solid rgba(99,102,241,0.15)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "13px", color: "#64748b" }}>
              Page {pagination.page} of {pagination.totalPages} ({pagination.total} leads)
            </span>
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                disabled={pagination.page <= 1}
                onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                style={{ padding: "6px 14px", background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.3)", borderRadius: "6px", color: pagination.page <= 1 ? "#475569" : "#818cf8", cursor: pagination.page <= 1 ? "not-allowed" : "pointer" }}
              >
                Previous
              </button>
              <button
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                style={{ padding: "6px 14px", background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.3)", borderRadius: "6px", color: pagination.page >= pagination.totalPages ? "#475569" : "#818cf8", cursor: pagination.page >= pagination.totalPages ? "not-allowed" : "pointer" }}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {showCreateModal && <LeadFormModal onClose={() => setShowCreateModal(false)} onSuccess={fetchLeads} />}
      {editLead && <LeadFormModal lead={editLead} onClose={() => setEditLead(null)} onSuccess={fetchLeads} />}
      {assignLead && <AssignModal lead={assignLead} onClose={() => setAssignLead(null)} onSuccess={fetchLeads} />}
    </div>
  );
}
