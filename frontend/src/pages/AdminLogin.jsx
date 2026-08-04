import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { IMAGES } from "../content";
import { toast } from "sonner";

function formatErr(d) {
  if (!d) return "Login failed";
  if (typeof d === "string") return d;
  if (Array.isArray(d)) return d.map((e) => e.msg || JSON.stringify(e)).join(" ");
  return String(d);
}

export default function AdminLogin() {
  const { login, user, t } = useApp();
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => { if (user) nav("/admin/news"); }, [user, nav]);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast.success("Welcome");
      nav("/admin/news");
    } catch (err) {
      toast.error(formatErr(err.response?.data?.detail));
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen grid place-items-center bg-navy grain px-6">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lift p-8">
        <div className="flex items-center gap-3 mb-6">
          <img src={IMAGES.logo} alt="TASNED" className="h-11 w-11 object-contain rounded" />
          <span className="font-bold text-navy">TASNED <span className="text-cyan">INTEGRATED</span></span>
        </div>
        <h1 className="text-2xl font-bold text-navy">{t.admin.login}</h1>
        <form onSubmit={submit} className="mt-6 space-y-4" data-testid="admin-login-form">
          <Input type="email" placeholder={t.admin.email} value={email} onChange={(e) => setEmail(e.target.value)} data-testid="admin-email" required />
          <Input type="password" placeholder={t.admin.password} value={password} onChange={(e) => setPassword(e.target.value)} data-testid="admin-password" required />
          <Button type="submit" disabled={loading} data-testid="admin-signin" className="w-full bg-cyan text-navy hover:bg-navy hover:text-white font-semibold py-6">
            {loading ? "…" : t.admin.signIn}
          </Button>
        </form>
      </div>
    </div>
  );
}
