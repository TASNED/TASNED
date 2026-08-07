import React, { useEffect, useState } from "react";
import api from "../lib/api";
import { toast } from "sonner";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog";
import { Plus, Trash2, Pencil } from "lucide-react";

const ROLES = [{ value: "editor", label: "Editor" }, { value: "admin", label: "Admin" }, { value: "super_admin", label: "Super Admin" }];

export default function UsersManager() {
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ email: "", name: "", role: "editor", password: "" });

  const load = async () => { try { const { data } = await api.get("/admin/users"); setItems(data); } catch (err) { toast.error(err.response?.data?.detail || "Failed"); } };
  useEffect(() => { load(); }, []);

  const openNew = () => { setEditing(null); setForm({ email: "", name: "", role: "editor", password: "" }); setOpen(true); };
  const openEdit = (u) => { setEditing(u); setForm({ email: u.email, name: u.name || "", role: u.role || "editor", password: "" }); setOpen(true); };

  const save = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        const payload = { name: form.name, role: form.role };
        if (form.password) payload.password = form.password;
        await api.put(`/admin/users/${editing.id}`, payload);
      } else {
        await api.post("/admin/users", form);
      }
      toast.success("Saved"); setOpen(false); load();
    } catch (err) { toast.error(err.response?.data?.detail || "Save failed"); }
  };

  const del = async (u) => {
    if (!window.confirm(`Delete user ${u.email}?`)) return;
    try { await api.delete(`/admin/users/${u.id}`); toast.success("Deleted"); load(); }
    catch (err) { toast.error(err.response?.data?.detail || "Delete failed"); }
  };

  return (
    <div className="px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-bold text-navy">Users & Roles</h1><p className="text-sm text-slate">Manage admin accounts and access levels.</p></div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNew} data-testid="user-new" className="bg-cyan text-navy hover:bg-navy hover:text-white font-semibold"><Plus size={16} className="mr-1" /> New user</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editing ? "Edit user" : "Create user"}</DialogTitle></DialogHeader>
            <form onSubmit={save} className="space-y-3" data-testid="user-form">
              <Input placeholder="Email" type="email" value={form.email} disabled={!!editing} onChange={(e) => setForm({ ...form, email: e.target.value })} required data-testid="u-email" />
              <Input placeholder="Full name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} data-testid="u-name" />
              <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}>
                <SelectTrigger data-testid="u-role"><SelectValue /></SelectTrigger>
                <SelectContent>{ROLES.map((r) => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}</SelectContent>
              </Select>
              <Input placeholder={editing ? "New password (leave empty to keep)" : "Password (min 8 chars)"} type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required={!editing} data-testid="u-password" />
              <div className="flex justify-end gap-2 pt-3 border-t">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button type="submit" data-testid="user-save" className="bg-navy text-white">Save</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-white rounded-xl shadow-soft overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-lightgray/50 text-navy"><tr><th className="text-left px-4 py-3">Email</th><th className="text-left px-4 py-3">Name</th><th className="text-left px-4 py-3">Role</th><th className="text-left px-4 py-3">Created</th><th></th></tr></thead>
          <tbody>
            {items.map((u, i) => (
              <tr key={u.id} className="border-t">
                <td className="px-4 py-3 font-medium text-navy">{u.email}</td>
                <td className="px-4 py-3 text-slate">{u.name || "—"}</td>
                <td className="px-4 py-3"><span className="text-xs font-mono uppercase px-2 py-0.5 rounded-full bg-teal/10 text-teal">{u.role}</span></td>
                <td className="px-4 py-3 text-slate text-xs">{(u.created_at || "").slice(0, 10)}</td>
                <td className="px-4 py-3 text-right">
                  <Button size="icon" variant="ghost" onClick={() => openEdit(u)} data-testid={`user-edit-${i}`}><Pencil size={15} /></Button>
                  <Button size="icon" variant="ghost" onClick={() => del(u)} data-testid={`user-del-${i}`} className="text-red-500 hover:text-red-600"><Trash2 size={15} /></Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
