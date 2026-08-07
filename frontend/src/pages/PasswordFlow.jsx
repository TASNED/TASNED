import React, { useEffect, useState } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import api from "../lib/api";
import { toast } from "sonner";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { IMAGES } from "../content";

export function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const submit = async (e) => {
    e.preventDefault(); setLoading(true);
    try { await api.post("/auth/forgot-password", { email }); setSent(true); }
    catch { toast.error("Something went wrong. Please try again."); }
    finally { setLoading(false); }
  };
  return (
    <div className="min-h-screen grid place-items-center bg-navy grain px-6">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lift p-8">
        <div className="flex items-center gap-3 mb-6">
          <span className="h-11 w-11 rounded-lg overflow-hidden bg-white flex items-center justify-center border">
            <img src={IMAGES.logo} alt="TASNED" className="h-full w-full object-contain scale-[1.65]" />
          </span>
          <span className="font-bold text-navy">TASNED <span className="text-cyan">INTEGRATED</span></span>
        </div>
        {sent ? (
          <>
            <h1 className="text-2xl font-bold text-navy">Check your email</h1>
            <p className="mt-3 text-slate text-sm">If an account exists for <span className="font-mono">{email}</span>, we've sent a link to reset your password. It expires in 1 hour.</p>
            <Link to="/admin/login" className="mt-6 inline-block text-teal font-semibold text-sm hover:text-cyan">← Back to login</Link>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-bold text-navy">Reset your password</h1>
            <p className="mt-2 text-sm text-slate">Enter your admin email — we'll send you a reset link.</p>
            <form onSubmit={submit} className="mt-6 space-y-4" data-testid="forgot-form">
              <Input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required data-testid="forgot-email" />
              <Button type="submit" disabled={loading} data-testid="forgot-submit" className="w-full bg-cyan text-navy hover:bg-navy hover:text-white font-semibold py-6">{loading ? "..." : "Send reset link"}</Button>
            </form>
            <Link to="/admin/login" className="mt-4 inline-block text-teal text-sm hover:text-cyan">← Back to login</Link>
          </>
        )}
      </div>
    </div>
  );
}

export function ResetPassword() {
  const [params] = useSearchParams();
  const token = params.get("token") || "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();
  useEffect(() => { if (!token) toast.error("Missing reset token"); }, [token]);
  const submit = async (e) => {
    e.preventDefault();
    if (password.length < 8) return toast.error("Password must be at least 8 characters");
    if (password !== confirm) return toast.error("Passwords do not match");
    setLoading(true);
    try { await api.post("/auth/reset-password", { token, password }); toast.success("Password updated. You can sign in now."); nav("/admin/login"); }
    catch (err) { toast.error(err.response?.data?.detail || "Reset failed"); }
    finally { setLoading(false); }
  };
  return (
    <div className="min-h-screen grid place-items-center bg-navy grain px-6">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lift p-8">
        <h1 className="text-2xl font-bold text-navy">Set a new password</h1>
        <p className="mt-2 text-sm text-slate">Minimum 8 characters.</p>
        <form onSubmit={submit} className="mt-6 space-y-4" data-testid="reset-form">
          <Input type="password" placeholder="New password" value={password} onChange={(e) => setPassword(e.target.value)} required data-testid="reset-pw" />
          <Input type="password" placeholder="Confirm password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required data-testid="reset-confirm" />
          <Button type="submit" disabled={loading || !token} data-testid="reset-submit" className="w-full bg-cyan text-navy hover:bg-navy hover:text-white font-semibold py-6">{loading ? "..." : "Update password"}</Button>
        </form>
      </div>
    </div>
  );
}
