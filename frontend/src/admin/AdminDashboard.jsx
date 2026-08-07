import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../lib/api";
import { useApp } from "../context/AppContext";
import { Newspaper, Wrench, HelpCircle, Image, Mail, Briefcase, Users, Sparkles } from "lucide-react";

const TILES = [
  { to: "/admin/service", label: "Services", icon: Wrench, type: "service" },
  { to: "/admin/faq", label: "FAQs", icon: HelpCircle, type: "faq" },
  { to: "/admin/news", label: "News", icon: Newspaper, custom: "news" },
  { to: "/admin/media", label: "Media", icon: Image, custom: "media" },
  { to: "/admin/contact-requests", label: "Contact requests", icon: Mail, custom: "contact" },
  { to: "/admin/careers-applications", label: "Careers apps", icon: Briefcase, custom: "careers" },
];

export default function AdminDashboard() {
  const { user } = useApp();
  const [stats, setStats] = useState({});

  useEffect(() => {
    (async () => {
      const s = {};
      try { s.service = (await api.get("/admin/cms/service")).data.length; } catch {}
      try { s.faq = (await api.get("/admin/cms/faq")).data.length; } catch {}
      try { s.news = (await api.get("/news?all=true")).data.length; } catch {}
      try { s.media = (await api.get("/admin/media")).data.length; } catch {}
      try { s.contact = (await api.get("/contact-requests")).data.length; } catch {}
      try { s.careers = (await api.get("/careers-applications")).data.length; } catch {}
      setStats(s);
    })();
  }, []);

  return (
    <div className="px-8 py-8">
      <div className="mb-8">
        <p className="text-sm font-mono text-cyan uppercase tracking-wider">TASNED CMS</p>
        <h1 className="mt-1 text-3xl font-bold text-navy">Welcome back, {user?.name || "Admin"}.</h1>
        <p className="text-slate mt-1">Manage every piece of content on your live website — changes go live instantly.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {TILES.map((t) => {
          const key = t.type || t.custom;
          return (
            <Link key={t.to} to={t.to} data-testid={`tile-${key}`}
              className="group bg-white rounded-xl p-6 shadow-soft hover:shadow-lift hover:-translate-y-1 transition-[transform,box-shadow] border border-transparent hover:border-cyan/40">
              <div className="flex items-start justify-between">
                <div className="h-11 w-11 grid place-items-center rounded-lg bg-navy text-cyan group-hover:bg-cyan group-hover:text-navy transition-colors">
                  <t.icon size={20} />
                </div>
                <span className="font-mono text-3xl font-bold text-navy">{stats[key] ?? "—"}</span>
              </div>
              <p className="mt-4 text-sm font-semibold text-navy">{t.label}</p>
            </Link>
          );
        })}
      </div>

      <div className="mt-10 grid md:grid-cols-2 gap-6">
        <div className="bg-navy text-white rounded-xl p-6">
          <div className="flex items-center gap-2 text-cyan font-mono text-xs uppercase tracking-widest"><Sparkles size={14} /> Quick actions</div>
          <ul className="mt-4 space-y-2 text-sm">
            <li><Link to="/admin/homepage_section" className="hover:text-cyan">→ Edit homepage sections</Link></li>
            <li><Link to="/admin/settings" className="hover:text-cyan">→ Update site settings, SEO & Analytics</Link></li>
            <li><Link to="/admin/media" className="hover:text-cyan">→ Upload new media</Link></li>
            <li><Link to="/admin/audit" className="hover:text-cyan">→ Review recent activity</Link></li>
          </ul>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-soft">
          <p className="text-sm font-mono text-teal uppercase tracking-widest">Your access</p>
          <p className="mt-2 text-2xl font-bold text-navy">{user?.role?.replace("_", " ").toUpperCase()}</p>
          <p className="mt-2 text-sm text-slate">Signed in as <span className="font-mono">{user?.email}</span></p>
        </div>
      </div>
    </div>
  );
}
