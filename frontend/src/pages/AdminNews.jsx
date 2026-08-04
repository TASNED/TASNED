import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useApp } from "../context/AppContext";
import api from "../lib/api";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Button } from "../components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../components/ui/tabs";
import { IMAGES } from "../content";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, LogOut, ExternalLink } from "lucide-react";

const blank = { title_en: "", title_ar: "", excerpt_en: "", excerpt_ar: "", body_en: "", body_ar: "", category: "News", cover_image: "", published: true };

export default function AdminNews() {
  const { user, logout, t } = useApp();
  const nav = useNavigate();
  const [items, setItems] = useState([]);
  const [requests, setRequests] = useState([]);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(blank);
  const [open, setOpen] = useState(false);

  const load = useCallback(async () => {
    const { data } = await api.get("/news?all=true");
    setItems(data);
    try { const r = await api.get("/contact-requests"); setRequests(r.data); } catch { /* ignore */ }
  }, []);

  useEffect(() => { if (user === false) nav("/admin/login"); if (user) load(); }, [user, nav, load]);

  const openNew = () => { setEditing(null); setForm(blank); setOpen(true); };
  const openEdit = (n) => { setEditing(n); setForm({ ...blank, ...n }); setOpen(true); };
  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  const save = async (e) => {
    e.preventDefault();
    try {
      if (editing) await api.put(`/news/${editing.id}`, form);
      else await api.post("/news", form);
      toast.success("Saved");
      setOpen(false); load();
    } catch { toast.error("Save failed"); }
  };
  const del = async (id) => {
    if (!window.confirm("Delete this article?")) return;
    await api.delete(`/news/${id}`); toast.success("Deleted"); load();
  };
  const doLogout = async () => { await logout(); nav("/admin/login"); };

  if (!user) return <div className="min-h-screen grid place-items-center text-slate">…</div>;

  return (
    <div className="min-h-screen bg-lightgray/30">
      <header className="bg-navy text-white">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={IMAGES.logo} alt="TASNED" className="h-9 w-9 object-contain rounded" />
            <span className="font-semibold">{t.admin.dashboard}</span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/" className="text-sm text-white/70 hover:text-cyan flex items-center gap-1"><ExternalLink size={14} /> Site</Link>
            <Button onClick={doLogout} variant="ghost" data-testid="admin-logout" className="text-white hover:bg-white/10"><LogOut size={16} className="me-1" /> {t.admin.logout}</Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-10">
        <Tabs defaultValue="news">
          <TabsList>
            <TabsTrigger value="news" data-testid="tab-news">{t.news.label}</TabsTrigger>
            <TabsTrigger value="requests" data-testid="tab-requests">{t.admin.requests} ({requests.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="news">
            <div className="flex justify-end mb-4">
              <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                  <Button onClick={openNew} data-testid="admin-new-article" className="bg-cyan text-navy hover:bg-navy hover:text-white font-semibold"><Plus size={16} className="me-1" /> {t.admin.new}</Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader><DialogTitle>{editing ? t.admin.edit : t.admin.new}</DialogTitle></DialogHeader>
                  <form onSubmit={save} className="space-y-4" data-testid="admin-article-form">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <Input placeholder="Title (EN)" value={form.title_en} onChange={set("title_en")} data-testid="art-title-en" required />
                      <Input placeholder="العنوان (AR)" value={form.title_ar} onChange={set("title_ar")} data-testid="art-title-ar" dir="rtl" />
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <Input placeholder="Category" value={form.category} onChange={set("category")} />
                      <Input placeholder="Cover image URL" value={form.cover_image} onChange={set("cover_image")} />
                    </div>
                    <Textarea placeholder="Excerpt (EN)" rows={2} value={form.excerpt_en} onChange={set("excerpt_en")} />
                    <Textarea placeholder="مقتطف (AR)" rows={2} value={form.excerpt_ar} onChange={set("excerpt_ar")} dir="rtl" />
                    <Textarea placeholder="Body (EN)" rows={5} value={form.body_en} onChange={set("body_en")} />
                    <Textarea placeholder="المحتوى (AR)" rows={5} value={form.body_ar} onChange={set("body_ar")} dir="rtl" />
                    <div className="flex justify-end gap-3">
                      <Button type="button" variant="outline" onClick={() => setOpen(false)}>{t.admin.cancel}</Button>
                      <Button type="submit" data-testid="art-save" className="bg-navy text-white">{t.admin.save}</Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            {items.length === 0 ? (
              <p className="text-slate text-center py-16">No articles yet. Create your first one.</p>
            ) : (
              <div className="grid gap-3">
                {items.map((n, i) => (
                  <div key={n.id} data-testid={`admin-article-${i}`} className="bg-white rounded-xl p-4 flex items-center gap-4 shadow-soft">
                    <img src={n.cover_image || IMAGES.cargoPort} alt="" className="h-14 w-20 object-cover rounded-md" />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-navy truncate">{n.title_en}</p>
                      <p className="text-xs text-slate">{n.category} · {n.slug} {n.published ? "" : "· draft"}</p>
                    </div>
                    <Button size="icon" variant="ghost" onClick={() => openEdit(n)} data-testid={`edit-${i}`}><Pencil size={16} /></Button>
                    <Button size="icon" variant="ghost" onClick={() => del(n.id)} data-testid={`delete-${i}`} className="text-red-500 hover:text-red-600"><Trash2 size={16} /></Button>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="requests">
            {requests.length === 0 ? (
              <p className="text-slate text-center py-16">No inspection requests yet.</p>
            ) : (
              <div className="grid gap-3">
                {requests.map((r, i) => (
                  <div key={i} className="bg-white rounded-xl p-5 shadow-soft">
                    <div className="flex justify-between flex-wrap gap-2">
                      <p className="font-semibold text-navy">{r.name} — {r.company || "—"}</p>
                      <span className="text-xs text-slate font-mono">{(r.created_at || "").slice(0, 10)}</span>
                    </div>
                    <p className="text-sm text-slate mt-1">{r.email} · {r.phone}</p>
                    <p className="text-sm text-slate mt-1">Vessel: {r.vessel_name || "—"} · IMO: {r.imo_number || "—"} · Port: {r.port || "—"}</p>
                    <p className="text-sm text-slate mt-1">Service: {r.requested_service || "—"} · Date: {r.preferred_date || "—"}</p>
                    {r.message && <p className="text-sm text-navy mt-2 bg-lightgray/50 rounded p-3">{r.message}</p>}
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
