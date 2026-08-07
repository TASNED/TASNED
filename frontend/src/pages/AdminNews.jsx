import React, { useState, useEffect, useCallback } from "react";
import api from "../lib/api";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Button } from "../components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog";
import { IMAGES } from "../content";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";

const blank = { title_en: "", title_ar: "", excerpt_en: "", excerpt_ar: "", body_en: "", body_ar: "", category: "News", cover_image: "", published: true };

export default function AdminNews() {
  const [items, setItems] = useState([]);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(blank);
  const [open, setOpen] = useState(false);

  const load = useCallback(async () => {
    try { const { data } = await api.get("/news?all=true"); setItems(data); } catch { toast.error("Failed to load"); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const openNew = () => { setEditing(null); setForm(blank); setOpen(true); };
  const openEdit = (n) => { setEditing(n); setForm({ ...blank, ...n }); setOpen(true); };
  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  const save = async (e) => {
    e.preventDefault();
    try {
      if (editing) await api.put(`/news/${editing.id}`, form);
      else await api.post("/news", form);
      toast.success("Saved"); setOpen(false); load();
    } catch { toast.error("Save failed"); }
  };
  const del = async (id) => { if (!window.confirm("Delete this article?")) return; await api.delete(`/news/${id}`); toast.success("Deleted"); load(); };

  return (
    <div className="px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-bold text-navy">News</h1><p className="text-sm text-slate">Articles published on the public News page.</p></div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNew} data-testid="admin-new-article" className="bg-cyan text-navy hover:bg-navy hover:text-white font-semibold"><Plus size={16} className="mr-1" /> New Article</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{editing ? "Edit article" : "New article"}</DialogTitle></DialogHeader>
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
              <Textarea placeholder="Body (EN)" rows={6} value={form.body_en} onChange={set("body_en")} />
              <Textarea placeholder="المحتوى (AR)" rows={6} value={form.body_ar} onChange={set("body_ar")} dir="rtl" />
              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button type="submit" data-testid="art-save" className="bg-navy text-white">Save</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-dashed"><p className="text-slate">No articles yet.</p></div>
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
    </div>
  );
}
