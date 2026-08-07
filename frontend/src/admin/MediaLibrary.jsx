import React, { useCallback, useEffect, useRef, useState } from "react";
import api from "../lib/api";
import { toast } from "sonner";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Upload, Search, Trash2, Copy, Pencil, Save } from "lucide-react";

function backendUrl(u) { return u && u.startsWith("/") ? `${process.env.REACT_APP_BACKEND_URL}${u}` : u; }

export default function MediaLibrary() {
  const [items, setItems] = useState([]);
  const [q, setQ] = useState("");
  const [folder, setFolder] = useState("");
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(null);
  const fileRef = useRef(null);

  const load = useCallback(async () => {
    const { data } = await api.get("/admin/media", { params: { q, folder } });
    setItems(data);
  }, [q, folder]);

  useEffect(() => { load(); }, [load]);

  const upload = async (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    if (file.size > 20 * 1024 * 1024) return toast.error("File too large (max 20 MB)");
    setBusy(true);
    const fd = new FormData();
    fd.append("file", file); fd.append("folder", folder || "root");
    try { await api.post("/admin/media/upload", fd, { headers: { "Content-Type": "multipart/form-data" } }); toast.success("Uploaded"); load(); }
    catch (err) { toast.error(err.response?.data?.detail || "Upload failed"); }
    finally { setBusy(false); if (fileRef.current) fileRef.current.value = ""; }
  };

  const del = async (id) => { if (!window.confirm("Delete this file?")) return; await api.delete(`/admin/media/${id}`); toast.success("Deleted"); load(); };
  const copy = (url) => { navigator.clipboard.writeText(url); toast.success("URL copied"); };
  const saveMeta = async () => {
    await api.put(`/admin/media/${editing.id}`, { alt: editing.alt, caption: editing.caption, folder: editing.folder });
    toast.success("Saved"); setEditing(null); load();
  };

  return (
    <div className="px-8 py-8">
      <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-navy">Media Library</h1>
          <p className="text-sm text-slate">Upload, search and manage images and files. Images auto-optimize to WebP.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate" />
            <Input placeholder="Search..." value={q} onChange={(e) => setQ(e.target.value)} data-testid="media-search" className="pl-9 w-56" />
          </div>
          <Input placeholder="Folder" value={folder} onChange={(e) => setFolder(e.target.value)} className="w-32" data-testid="media-folder" />
          <label className={`inline-flex items-center gap-2 rounded-md bg-cyan text-navy font-semibold px-4 py-2 text-sm cursor-pointer ${busy ? "opacity-60" : "hover:bg-navy hover:text-white"}`}>
            <Upload size={15} /> {busy ? "Uploading..." : "Upload"}
            <input ref={fileRef} type="file" className="hidden" onChange={upload} data-testid="media-upload" />
          </label>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-24 bg-white rounded-xl border border-dashed"><p className="text-slate">No media yet. Upload your first file.</p></div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {items.map((m, i) => (
            <div key={m.id} data-testid={`media-${i}`} className="bg-white rounded-lg overflow-hidden shadow-soft group relative">
              <div className="aspect-square bg-lightgray/60 flex items-center justify-center">
                {m.mime?.startsWith("image/") ? (
                  <img src={backendUrl(m.url)} alt={m.alt} className="w-full h-full object-cover" loading="lazy" />
                ) : (
                  <span className="font-mono text-xs text-slate">{(m.filename || "").split(".").pop().toUpperCase()}</span>
                )}
              </div>
              <div className="p-2">
                <p className="text-xs font-semibold text-navy truncate" title={m.filename}>{m.filename}</p>
                <p className="text-[10px] text-slate">{(m.size / 1024).toFixed(0)} KB{m.width ? ` · ${m.width}×${m.height}` : ""}</p>
              </div>
              <div className="absolute inset-0 bg-navy/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
                <button onClick={() => copy(backendUrl(m.url))} title="Copy URL" className="h-8 w-8 grid place-items-center rounded bg-white text-navy hover:bg-cyan"><Copy size={14} /></button>
                <button onClick={() => setEditing({ ...m })} title="Edit metadata" className="h-8 w-8 grid place-items-center rounded bg-white text-navy hover:bg-cyan"><Pencil size={14} /></button>
                <button onClick={() => del(m.id)} title="Delete" className="h-8 w-8 grid place-items-center rounded bg-white text-red-500 hover:bg-red-500 hover:text-white"><Trash2 size={14} /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 bg-navy/60 grid place-items-center z-50 p-6" onClick={() => setEditing(null)}>
          <div className="bg-white rounded-xl p-6 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-navy mb-4">Edit media</h3>
            {editing.mime?.startsWith("image/") && <img src={backendUrl(editing.url)} alt="" className="w-full h-40 object-cover rounded mb-4" />}
            <div className="space-y-3">
              <div><label className="block text-xs font-medium text-navy mb-1">ALT text (accessibility & SEO)</label><Input value={editing.alt || ""} onChange={(e) => setEditing({ ...editing, alt: e.target.value })} data-testid="edit-alt" /></div>
              <div><label className="block text-xs font-medium text-navy mb-1">Caption</label><Input value={editing.caption || ""} onChange={(e) => setEditing({ ...editing, caption: e.target.value })} /></div>
              <div><label className="block text-xs font-medium text-navy mb-1">Folder</label><Input value={editing.folder || "root"} onChange={(e) => setEditing({ ...editing, folder: e.target.value })} /></div>
              <div><p className="text-xs text-slate break-all"><span className="font-semibold">URL:</span> {backendUrl(editing.url)}</p></div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
              <Button onClick={saveMeta} className="bg-navy text-white" data-testid="edit-save"><Save size={14} className="mr-1" /> Save</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
