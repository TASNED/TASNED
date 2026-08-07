import React, { useCallback, useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../lib/api";
import { toast } from "sonner";
import { CMS_TYPES, STATUS_OPTIONS } from "./config";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Button } from "../components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog";
import { Plus, Pencil, Trash2, History, ArrowUp, ArrowDown, Save, X, Image as ImageIcon } from "lucide-react";
import { API } from "../lib/api";

function backendUrl(u) { return u && u.startsWith("/") ? `${process.env.REACT_APP_BACKEND_URL}${u}` : u; }

export default function GenericCMSManager({ typeOverride }) {
  const { type: paramType } = useParams();
  const type = typeOverride || paramType;
  const cfg = CMS_TYPES[type];
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ data: {}, status: "draft", published_at: "", order: 0 });
  const [versions, setVersions] = useState(null);

  const load = useCallback(async () => {
    if (!cfg) return;
    setLoading(true);
    try { const { data } = await api.get(`/admin/cms/${type}`); setItems(data); }
    catch { toast.error("Failed to load"); }
    finally { setLoading(false); }
  }, [type, cfg]);

  useEffect(() => { setForm({ data: {}, status: "draft", published_at: "", order: 0 }); setEditing(null); load(); }, [load]);

  if (!cfg) return <div className="p-10">Unknown type: {type}</div>;

  const openNew = () => { setEditing(null); setForm({ data: {}, status: "draft", published_at: "", order: items.length }); setVersions(null); setOpen(true); };
  const openEdit = (it) => { setEditing(it); setForm({ data: it.data || {}, status: it.status || "draft", published_at: it.published_at || "", order: it.order ?? 0 }); setVersions(null); setOpen(true); };
  const setData = (k, v) => setForm((p) => ({ ...p, data: { ...p.data, [k]: v } }));

  const save = async (e) => {
    e.preventDefault();
    const payload = { data: form.data, status: form.status, order: Number(form.order) || 0 };
    if (form.status === "scheduled" && form.published_at) payload.published_at = form.published_at;
    else if (form.status === "published") payload.published_at = form.published_at || new Date().toISOString();
    else payload.published_at = null;
    try {
      if (editing) await api.put(`/admin/cms/${type}/${editing.id}`, payload);
      else await api.post(`/admin/cms/${type}`, payload);
      toast.success("Saved");
      setOpen(false); load();
    } catch (err) { toast.error(err.response?.data?.detail || "Save failed"); }
  };

  const del = async (id) => {
    if (!window.confirm("Delete this item permanently?")) return;
    await api.delete(`/admin/cms/${type}/${id}`); toast.success("Deleted"); load();
  };

  const move = async (it, dir) => {
    await api.put(`/admin/cms/${type}/${it.id}`, { order: (it.order ?? 0) + dir });
    load();
  };

  const loadVersions = async () => {
    if (!editing) return;
    const { data } = await api.get(`/admin/cms/${type}/${editing.id}/versions`);
    setVersions(data);
  };

  const restore = async (vid) => {
    if (!editing) return;
    if (!window.confirm("Restore this version? Current state will be saved as a version too.")) return;
    await api.post(`/admin/cms/${type}/${editing.id}/restore/${vid}`);
    toast.success("Restored");
    setOpen(false); load();
  };

  return (
    <div className="px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-navy">{cfg.label}</h1>
          <p className="text-sm text-slate">Manage your {cfg.label.toLowerCase()} content.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNew} data-testid="cms-new" className="bg-cyan text-navy hover:bg-navy hover:text-white font-semibold">
              <Plus size={16} className="mr-1" /> New {cfg.singular}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{editing ? `Edit ${cfg.singular}` : `New ${cfg.singular}`}</DialogTitle></DialogHeader>
            <form onSubmit={save} className="space-y-4 pt-2" data-testid="cms-form">
              {cfg.fields.map((f) => (
                <div key={f.key}>
                  <label className="block text-xs font-medium text-navy mb-1">{f.label}{f.required && <span className="text-cyan"> *</span>}</label>
                  {f.type === "textarea" ? (
                    <Textarea rows={f.key.startsWith("body") || f.key.startsWith("answer") || f.key.startsWith("quote") ? 5 : 3}
                      value={form.data[f.key] || ""} onChange={(e) => setData(f.key, e.target.value)}
                      dir={f.dir} placeholder={f.placeholder} required={f.required} data-testid={`f-${f.key}`} />
                  ) : f.type === "media" ? (
                    <div className="flex gap-2">
                      <Input value={form.data[f.key] || ""} onChange={(e) => setData(f.key, e.target.value)}
                        placeholder="Paste media URL or use Media Library" dir={f.dir} data-testid={`f-${f.key}`} />
                      <Button type="button" variant="outline" onClick={() => window.open("/admin/media", "_blank")}>
                        <ImageIcon size={15} />
                      </Button>
                    </div>
                  ) : (
                    <Input type={f.type} value={form.data[f.key] || ""} onChange={(e) => setData(f.key, e.target.value)}
                      dir={f.dir} placeholder={f.placeholder} required={f.required} data-testid={`f-${f.key}`} />
                  )}
                  {form.data[f.key] && f.type === "media" && (
                    <img src={backendUrl(form.data[f.key])} alt="" className="mt-2 h-20 w-20 object-cover rounded border" />
                  )}
                </div>
              ))}

              <div className="grid grid-cols-3 gap-4 border-t pt-4">
                <div>
                  <label className="block text-xs font-medium text-navy mb-1">Status</label>
                  <Select value={form.status} onValueChange={(v) => setForm((p) => ({ ...p, status: v }))}>
                    <SelectTrigger data-testid="f-status"><SelectValue /></SelectTrigger>
                    <SelectContent>{STATUS_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                {form.status === "scheduled" && (
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-navy mb-1">Publish at (UTC)</label>
                    <Input type="datetime-local" value={form.published_at ? form.published_at.slice(0, 16) : ""}
                      onChange={(e) => setForm((p) => ({ ...p, published_at: new Date(e.target.value).toISOString() }))} data-testid="f-pubat" />
                  </div>
                )}
                <div>
                  <label className="block text-xs font-medium text-navy mb-1">Order</label>
                  <Input type="number" value={form.order} onChange={(e) => setForm((p) => ({ ...p, order: e.target.value }))} data-testid="f-order" />
                </div>
              </div>

              {editing && (
                <div className="border-t pt-3">
                  <button type="button" onClick={loadVersions} className="text-sm text-teal hover:text-cyan inline-flex items-center gap-1">
                    <History size={14} /> {versions === null ? "View version history" : `${versions.length} versions`}
                  </button>
                  {versions && (
                    <div className="mt-2 max-h-40 overflow-y-auto border rounded p-2 space-y-1">
                      {versions.length === 0 && <p className="text-xs text-slate">No previous versions yet.</p>}
                      {versions.map((v) => (
                        <div key={v.id} className="flex items-center justify-between text-xs p-1.5 hover:bg-lightgray/40 rounded">
                          <span className="text-slate">{new Date(v.created_at).toLocaleString()} — {v.editor}</span>
                          <button type="button" onClick={() => restore(v.id)} className="text-teal hover:text-cyan font-medium">Restore</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-end gap-3 border-t pt-4">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}><X size={15} className="mr-1" /> Cancel</Button>
                <Button type="submit" data-testid="cms-save" className="bg-navy text-white hover:bg-teal"><Save size={15} className="mr-1" /> Save</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? <p className="text-slate">Loading...</p> : items.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-dashed">
          <p className="text-slate">No items yet. Click "New {cfg.singular}" to add one.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-soft overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-lightgray/50 text-navy">
              <tr>
                <th className="text-left px-4 py-3 font-semibold w-16">#</th>
                {cfg.list.map((c) => <th key={c.key} className="text-left px-4 py-3 font-semibold">{c.label}</th>)}
                <th className="text-left px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 w-40"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((it, i) => (
                <tr key={it.id} data-testid={`cms-row-${i}`} className="border-t hover:bg-lightgray/30">
                  <td className="px-4 py-3 font-mono text-slate">
                    {it.order ?? 0}
                    <span className="ml-1 inline-flex flex-col align-middle">
                      <button onClick={() => move(it, -1)} className="text-slate hover:text-navy"><ArrowUp size={11} /></button>
                      <button onClick={() => move(it, 1)} className="text-slate hover:text-navy"><ArrowDown size={11} /></button>
                    </span>
                  </td>
                  {cfg.list.map((c) => <td key={c.key} className="px-4 py-3 text-navy">{it.data?.[c.key] || "—"}</td>)}
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full font-mono ${it.status === "published" ? "bg-teal/10 text-teal" : it.status === "scheduled" ? "bg-cyan/10 text-cyan" : "bg-slate/10 text-slate"}`}>
                      {it.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right space-x-1">
                    <Button size="icon" variant="ghost" onClick={() => openEdit(it)} data-testid={`cms-edit-${i}`}><Pencil size={15} /></Button>
                    <Button size="icon" variant="ghost" onClick={() => del(it.id)} data-testid={`cms-del-${i}`} className="text-red-500 hover:text-red-600"><Trash2 size={15} /></Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
