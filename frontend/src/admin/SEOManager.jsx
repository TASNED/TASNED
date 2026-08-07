import React, { useEffect, useState } from "react";
import api from "../lib/api";
import { toast } from "sonner";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Button } from "../components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { Pencil, ExternalLink, Save, X, Globe } from "lucide-react";

const empty = { route: "", title: "", description: "", keywords: "", canonical: "", robots: "index, follow", og_image: "", og_title: "", og_description: "", twitter_card: "summary_large_image", jsonld_extra: "" };

export default function SEOManager() {
  const [routes, setRoutes] = useState([]);
  const [overrides, setOverrides] = useState({});
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);

  const load = async () => {
    const [r, o] = await Promise.all([
      api.get("/public-routes").then(({ data }) => data),
      api.get("/admin/page-seo").then(({ data }) => data),
    ]);
    setRoutes(r);
    setOverrides(Object.fromEntries(o.map((x) => [x.route, x])));
  };
  useEffect(() => { load(); }, []);

  const open = (route) => { setEditing(route); setForm({ ...empty, ...(overrides[route] || {}), route }); };
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const save = async (e) => {
    e.preventDefault();
    try { await api.put("/admin/page-seo", form); toast.success("Saved. Live now."); setEditing(null); load(); }
    catch (err) { toast.error(err.response?.data?.detail || "Save failed"); }
  };

  const clearRoute = async (route) => {
    if (!window.confirm("Remove SEO overrides for this route?")) return;
    await api.delete("/admin/page-seo", { params: { route } });
    toast.success("Overrides cleared"); load();
  };

  return (
    <div className="px-8 py-8">
      <h1 className="text-2xl font-bold text-navy">SEO Dashboard</h1>
      <p className="text-sm text-slate mb-2">Per-page SEO controls. Titles, descriptions, canonical, robots, Open Graph, Twitter Cards. Overrides apply live.</p>
      <div className="flex flex-wrap gap-3 text-xs mb-6">
        {[
          ["Sitemap", "/api/sitemap.xml"],
          ["Image Sitemap", "/api/sitemap-images.xml"],
          ["Robots.txt", "/api/robots.txt"],
          ["llms.txt (AI)", "/api/llms.txt"],
        ].map(([label, path]) => (
          <a key={path} href={`${process.env.REACT_APP_BACKEND_URL}${path}`} target="_blank" rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-full border border-navy/15 px-3 py-1.5 text-navy hover:bg-navy hover:text-white transition-colors">
            <ExternalLink size={12} /> {label}
          </a>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-soft overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-lightgray/50 text-navy">
            <tr><th className="text-left px-4 py-3">Route</th><th className="text-left px-4 py-3">SEO Title</th><th className="text-left px-4 py-3">Robots</th><th className="text-left px-4 py-3">Status</th><th className="px-4 py-3 w-32"></th></tr>
          </thead>
          <tbody>
            {routes.map((r) => {
              const o = overrides[r] || {};
              return (
                <tr key={r} data-testid={`seo-row-${r}`} className="border-t hover:bg-lightgray/30">
                  <td className="px-4 py-3 font-mono text-navy">{r}</td>
                  <td className="px-4 py-3 text-slate max-w-md truncate">{o.title || <span className="text-slate/60 italic">default</span>}</td>
                  <td className="px-4 py-3 text-slate">{o.robots || "index, follow"}</td>
                  <td className="px-4 py-3"><span className={`text-xs font-mono px-2 py-0.5 rounded-full ${o.route ? "bg-teal/10 text-teal" : "bg-slate/10 text-slate"}`}>{o.route ? "custom" : "default"}</span></td>
                  <td className="px-4 py-3 text-right space-x-1">
                    <Button size="icon" variant="ghost" onClick={() => open(r)} data-testid={`seo-edit-${r}`}><Pencil size={15} /></Button>
                    {o.route && <Button size="icon" variant="ghost" onClick={() => clearRoute(r)} className="text-red-500 hover:text-red-600" data-testid={`seo-clear-${r}`}><X size={15} /></Button>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Dialog open={!!editing} onOpenChange={(v) => !v && setEditing(null)}>
        <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto">
          <DialogHeader><DialogTitle>SEO for {editing}</DialogTitle></DialogHeader>
          <form onSubmit={save} className="space-y-4" data-testid="seo-form">
            <div>
              <label className="block text-xs font-medium text-navy mb-1">Meta Title <span className="text-slate/60">({form.title?.length || 0}/60)</span></label>
              <Input value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="Leave empty to use default" data-testid="seo-title" />
            </div>
            <div>
              <label className="block text-xs font-medium text-navy mb-1">Meta Description <span className="text-slate/60">({form.description?.length || 0}/160)</span></label>
              <Textarea rows={2} value={form.description} onChange={(e) => set("description", e.target.value)} data-testid="seo-description" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-xs font-medium text-navy mb-1">Keywords</label><Input value={form.keywords} onChange={(e) => set("keywords", e.target.value)} data-testid="seo-keywords" /></div>
              <div><label className="block text-xs font-medium text-navy mb-1">Robots</label>
                <Select value={form.robots || "index, follow"} onValueChange={(v) => set("robots", v)}>
                  <SelectTrigger data-testid="seo-robots"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="index, follow">Index, Follow (default)</SelectItem>
                    <SelectItem value="noindex, follow">NoIndex, Follow</SelectItem>
                    <SelectItem value="index, nofollow">Index, NoFollow</SelectItem>
                    <SelectItem value="noindex, nofollow">NoIndex, NoFollow</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div><label className="block text-xs font-medium text-navy mb-1">Canonical URL</label><Input value={form.canonical} onChange={(e) => set("canonical", e.target.value)} placeholder="Leave empty to auto-generate" /></div>
            <div className="border-t pt-4">
              <h4 className="font-semibold text-navy text-sm mb-3">Social (Open Graph & Twitter)</h4>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-xs font-medium text-navy mb-1">OG Title</label><Input value={form.og_title} onChange={(e) => set("og_title", e.target.value)} placeholder="Falls back to Meta Title" /></div>
                <div>
                  <label className="block text-xs font-medium text-navy mb-1">Twitter Card</label>
                  <Select value={form.twitter_card || "summary_large_image"} onValueChange={(v) => set("twitter_card", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="summary">Summary</SelectItem><SelectItem value="summary_large_image">Summary Large Image</SelectItem></SelectContent>
                  </Select>
                </div>
              </div>
              <div className="mt-3"><label className="block text-xs font-medium text-navy mb-1">OG Description</label><Textarea rows={2} value={form.og_description} onChange={(e) => set("og_description", e.target.value)} /></div>
              <div className="mt-3"><label className="block text-xs font-medium text-navy mb-1">OG Image URL</label><Input value={form.og_image} onChange={(e) => set("og_image", e.target.value)} placeholder="1200×630 recommended" /></div>
            </div>

            {/* Social preview */}
            <div className="border-t pt-4">
              <p className="text-xs font-medium text-navy mb-2 flex items-center gap-2"><Globe size={13} /> Google search preview</p>
              <div className="rounded-lg border p-3 bg-white">
                <p className="text-xs text-slate font-mono truncate">{form.canonical || "https://tasned.sa" + (form.route || "")}</p>
                <p className="text-blue-700 text-base font-medium truncate">{form.title || "Default title will be used"}</p>
                <p className="text-slate text-sm line-clamp-2">{form.description || "Default description will be used"}</p>
              </div>
              <p className="text-xs font-medium text-navy mt-4 mb-2">Social preview (OG)</p>
              <div className="rounded-lg border overflow-hidden max-w-md">
                {form.og_image && <img src={form.og_image} alt="" className="w-full h-40 object-cover" />}
                <div className="p-3 bg-lightgray/40">
                  <p className="text-xs text-slate uppercase">{(form.canonical || "tasned.sa").replace(/^https?:\/\//, "").split("/")[0]}</p>
                  <p className="font-semibold text-navy line-clamp-1">{form.og_title || form.title || "Default title"}</p>
                  <p className="text-xs text-slate line-clamp-2">{form.og_description || form.description || "Default description"}</p>
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <label className="block text-xs font-medium text-navy mb-1">Custom JSON-LD (advanced)</label>
              <Textarea rows={4} value={form.jsonld_extra} onChange={(e) => set("jsonld_extra", e.target.value)} placeholder='{"@context":"https://schema.org","@type":"Article",...}' className="font-mono text-xs" />
              <p className="text-xs text-slate mt-1">Valid JSON. Injected alongside auto-generated schemas.</p>
            </div>

            <div className="flex justify-end gap-3 border-t pt-4">
              <Button type="button" variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
              <Button type="submit" data-testid="seo-save" className="bg-navy text-white hover:bg-teal"><Save size={15} className="mr-1" /> Save</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
