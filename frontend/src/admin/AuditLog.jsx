import React, { useEffect, useState } from "react";
import api from "../lib/api";
import { toast } from "sonner";
import { IMAGES } from "../content";

export default function AuditLog() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/admin/audit").then(({ data }) => { setItems(data); setLoading(false); })
      .catch(() => { toast.error("Failed to load audit log"); setLoading(false); });
  }, []);

  return (
    <div className="px-8 py-8">
      <h1 className="text-2xl font-bold text-navy">Audit Log</h1>
      <p className="text-sm text-slate mb-6">All administrative actions across the platform.</p>
      {loading ? <p className="text-slate">Loading...</p> : (
        <div className="bg-white rounded-xl shadow-soft overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-lightgray/50 text-navy">
              <tr><th className="text-left px-4 py-3">When</th><th className="text-left px-4 py-3">User</th><th className="text-left px-4 py-3">Role</th><th className="text-left px-4 py-3">Action</th><th className="text-left px-4 py-3">Resource</th><th className="text-left px-4 py-3">IP</th></tr>
            </thead>
            <tbody>
              {items.map((a, i) => (
                <tr key={i} data-testid={`audit-${i}`} className="border-t hover:bg-lightgray/30">
                  <td className="px-4 py-2.5 text-slate font-mono text-xs">{new Date(a.ts).toLocaleString()}</td>
                  <td className="px-4 py-2.5 text-navy">{a.user_email || "—"}</td>
                  <td className="px-4 py-2.5"><span className="text-xs font-mono uppercase text-teal">{a.role}</span></td>
                  <td className="px-4 py-2.5 font-medium text-navy">{a.action}</td>
                  <td className="px-4 py-2.5 text-slate">{a.resource}{a.resource_id ? ` · ${a.resource_id.slice(0, 8)}` : ""}</td>
                  <td className="px-4 py-2.5 text-slate font-mono text-xs">{a.ip || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
