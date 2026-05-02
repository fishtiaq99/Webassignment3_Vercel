"use client";
import { useState } from "react";
import { X } from "lucide-react";
import toast from "react-hot-toast";

interface Props {
  onClose: () => void;
  onSuccess: () => void;
  lead?: any; // For editing
}

const defaultForm = {
  name: "",
  email: "",
  phone: "",
  propertyInterest: "House",
  budget: "",
  source: "Website",
  location: "",
  notes: "",
  status: "New",
};

export default function LeadFormModal({ onClose, onSuccess, lead }: Props) {
  const [form, setForm] = useState(
    lead
      ? {
          name: lead.name,
          email: lead.email || "",
          phone: lead.phone,
          propertyInterest: lead.propertyInterest,
          budget: String(lead.budget),
          source: lead.source,
          location: lead.location || "",
          notes: lead.notes || "",
          status: lead.status,
        }
      : defaultForm
  );
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const payload = { ...form, budget: Number(form.budget) };
    const url = lead ? `/api/leads/${lead._id}` : "/api/leads";
    const method = lead ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    setLoading(false);

    if (!data.success) {
      toast.error(data.error || "Something went wrong");
      return;
    }

    toast.success(lead ? "Lead updated!" : "Lead created!");
    onSuccess();
    onClose();
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.7)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: "20px",
        backdropFilter: "blur(4px)",
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="card animate-in"
        style={{
          width: "100%",
          maxWidth: "560px",
          maxHeight: "90vh",
          overflow: "auto",
          padding: "28px",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
          <h2 style={{ margin: 0, fontSize: "18px", fontWeight: "600", color: "#e2e8f0" }}>
            {lead ? "Edit Lead" : "Add New Lead"}
          </h2>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer" }}
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            {/* Name */}
            <div style={{ gridColumn: "span 2" }}>
              <label className="field-label">Client Name *</label>
              <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ahmed Khan" required />
            </div>

            {/* Phone */}
            <div>
              <label className="field-label">Phone *</label>
              <input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="03001234567" required />
            </div>

            {/* Email */}
            <div>
              <label className="field-label">Email</label>
              <input className="input" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="ahmed@email.com" />
            </div>

            {/* Property Interest */}
            <div>
              <label className="field-label">Property Interest *</label>
              <select className="input" value={form.propertyInterest} onChange={(e) => setForm({ ...form, propertyInterest: e.target.value })}>
                {["House", "Apartment", "Plot", "Commercial", "Villa"].map((v) => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            </div>

            {/* Source */}
            <div>
              <label className="field-label">Lead Source</label>
              <select className="input" value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })}>
                {["Facebook Ads", "Walk-in", "Website", "Referral", "Phone"].map((v) => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            </div>

            {/* Budget */}
            <div>
              <label className="field-label">Budget (PKR) *</label>
              <input
                className="input"
                type="number"
                value={form.budget}
                onChange={(e) => setForm({ ...form, budget: e.target.value })}
                placeholder="e.g. 15000000 for 15M"
                min="0"
                required
              />
            </div>

            {/* Status (only for edit) */}
            {lead && (
              <div>
                <label className="field-label">Status</label>
                <select className="input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                  {["New", "Contacted", "In Progress", "Closed", "Lost"].map((v) => (
                    <option key={v} value={v}>{v}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Location */}
            <div style={{ gridColumn: lead ? "span 1" : "span 2" }}>
              <label className="field-label">Location</label>
              <input className="input" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="DHA Phase 5, Lahore" />
            </div>

            {/* Notes */}
            <div style={{ gridColumn: "span 2" }}>
              <label className="field-label">Notes</label>
              <textarea
                className="input"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Any additional information about this lead..."
                rows={3}
                style={{ resize: "vertical" }}
              />
            </div>

            {/* Budget hint */}
            {form.budget && (
              <div style={{ gridColumn: "span 2" }}>
                <div
                  style={{
                    padding: "10px 14px",
                    borderRadius: "8px",
                    fontSize: "13px",
                    background: Number(form.budget) > 20_000_000
                      ? "rgba(239,68,68,0.1)"
                      : Number(form.budget) >= 10_000_000
                      ? "rgba(245,158,11,0.1)"
                      : "rgba(16,185,129,0.1)",
                    color: Number(form.budget) > 20_000_000
                      ? "#ef4444"
                      : Number(form.budget) >= 10_000_000
                      ? "#f59e0b"
                      : "#10b981",
                    border: `1px solid ${Number(form.budget) > 20_000_000
                      ? "rgba(239,68,68,0.2)"
                      : Number(form.budget) >= 10_000_000
                      ? "rgba(245,158,11,0.2)"
                      : "rgba(16,185,129,0.2)"}`,
                  }}
                >
                  Auto-Score:{" "}
                  <strong>
                    {Number(form.budget) > 20_000_000
                      ? "🔴 High Priority (Score: 100)"
                      : Number(form.budget) >= 10_000_000
                      ? "🟡 Medium Priority (Score: 60)"
                      : "🟢 Low Priority (Score: 20)"}
                  </strong>
                </div>
              </div>
            )}
          </div>

          <div style={{ display: "flex", gap: "10px", marginTop: "24px", justifyContent: "flex-end" }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: "10px 20px",
                background: "none",
                border: "1px solid rgba(99,102,241,0.3)",
                borderRadius: "8px",
                color: "#94a3b8",
                cursor: "pointer",
                fontSize: "14px",
              }}
            >
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? "Saving..." : lead ? "Update Lead" : "Create Lead"}
            </button>
          </div>
        </form>
      </div>

      <style>{`
        .field-label {
          display: block;
          font-size: 12px;
          color: #94a3b8;
          margin-bottom: 6px;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
      `}</style>
    </div>
  );
}
