import React, { useEffect, useState } from "react";
import api from "../lib/api";
import { toast } from "sonner";

export default function RequestsView({ kind }) {
  // kind: "contact" | "careers"
  const path = kind === "careers" ? "/careers-applications" : "/contact-requests";
  const title = kind === "careers" ? "Careers Applications" : "Contact Requests";
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(path).then(({ data }) => { setItems(data); setLoading(false); })
      .catch((err) => { toast.error(err.response?.data?.detail || "Failed"); setLoading(false); });
  }, [path]);

  return (
    <div className="px-8 py-8">
      <h1 className="text-2xl font-bold text-navy">{title}</h1>
      <p className="text-sm text-slate mb-6">Submissions received from the public website.</p>
      {loading ? <p className="text-slate">Loading...</p> : items.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-dashed"><p className="text-slate">No submissions yet.</p></div>
      ) : (
        <div className="grid gap-3">
          {items.map((r, i) => (
            <div key={i} data-testid={`req-${i}`} className="bg-white rounded-xl p-5 shadow-soft">
              <div className="flex justify-between flex-wrap gap-2">
                <p className="font-semibold text-navy">{r.full_name || r.name || "—"} {r.company ? `— ${r.company}` : ""}</p>
                <span className="text-xs text-slate font-mono">{(r.created_at || "").slice(0, 16).replace("T", " ")}</span>
              </div>
              <p className="text-sm text-slate mt-1">{r.email}{r.phone || r.mobile ? ` · ${r.phone || r.mobile}` : ""}</p>
              {kind === "careers" ? (
                <>
                  <p className="text-sm text-slate mt-1">City: {r.city || "—"} · Nationality: {r.nationality || "—"} · Experience: {r.experience || "—"} yrs</p>
                  <p className="text-sm text-slate">Current: {r.current_job || "—"} · Sector: {r.sector || "—"} · Qualification: {r.qualification || "—"}</p>
                  <p className="text-xs text-slate mt-1">CV: <span className="font-mono">{r.cv_filename}</span> ({(r.cv_size / 1024).toFixed(0)} KB)</p>
                  {r.bio && <p className="text-sm text-navy mt-2 bg-lightgray/50 rounded p-3 whitespace-pre-line">{r.bio}</p>}
                </>
              ) : (
                <>
                  <p className="text-sm text-slate mt-1">Vessel: {r.vessel_name || "—"} · IMO: {r.imo_number || "—"} · Port: {r.port || "—"}</p>
                  <p className="text-sm text-slate">Service: {r.requested_service || "—"} · Date: {r.preferred_date || "—"}</p>
                  {r.message && <p className="text-sm text-navy mt-2 bg-lightgray/50 rounded p-3 whitespace-pre-line">{r.message}</p>}
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
