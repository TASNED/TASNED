import React, { useEffect } from "react";
import { NavLink, Outlet, useNavigate, Link } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { IMAGES } from "../content";
import { LayoutDashboard, Newspaper, Users, Wrench, Users2, Building2, MessageSquareQuote, HelpCircle, LayoutTemplate, Image, Settings, ClipboardList, LogOut, ExternalLink, Mail, Briefcase, Search } from "lucide-react";

const NAV = [
  { to: "/admin", end: true, icon: LayoutDashboard, label: "Dashboard", roles: ["super_admin", "admin", "editor"] },
  { to: "/admin/homepage_section", icon: LayoutTemplate, label: "Homepage", roles: ["super_admin", "admin", "editor"] },
  { to: "/admin/service", icon: Wrench, label: "Services", roles: ["super_admin", "admin", "editor"] },
  { to: "/admin/team_member", icon: Users2, label: "Team", roles: ["super_admin", "admin", "editor"] },
  { to: "/admin/client", icon: Building2, label: "Clients", roles: ["super_admin", "admin", "editor"] },
  { to: "/admin/testimonial", icon: MessageSquareQuote, label: "Testimonials", roles: ["super_admin", "admin", "editor"] },
  { to: "/admin/faq", icon: HelpCircle, label: "FAQs", roles: ["super_admin", "admin", "editor"] },
  { to: "/admin/news", icon: Newspaper, label: "News", roles: ["super_admin", "admin", "editor"] },
  { to: "/admin/media", icon: Image, label: "Media Library", roles: ["super_admin", "admin", "editor"] },
  { to: "/admin/contact-requests", icon: Mail, label: "Contact Requests", roles: ["super_admin", "admin"] },
  { to: "/admin/careers-applications", icon: Briefcase, label: "Careers", roles: ["super_admin", "admin"] },
  { to: "/admin/settings", icon: Settings, label: "Site Settings", roles: ["super_admin", "admin"] },
  { to: "/admin/seo", icon: Search, label: "SEO Dashboard", roles: ["super_admin", "admin", "editor"] },
  { to: "/admin/users", icon: Users, label: "Users", roles: ["super_admin"] },
  { to: "/admin/audit", icon: ClipboardList, label: "Audit Log", roles: ["super_admin", "admin"] },
];

export default function AdminLayout() {
  const { user, logout } = useApp();
  const nav = useNavigate();

  useEffect(() => { if (user === false) nav("/admin/login"); }, [user, nav]);

  if (!user) return <div className="min-h-screen grid place-items-center bg-lightgray/40 text-slate">Loading...</div>;

  const role = user.role;
  const items = NAV.filter((n) => n.roles.includes(role));
  const doLogout = async () => { await logout(); nav("/admin/login"); };

  return (
    <div className="min-h-screen bg-lightgray/30 flex" dir="ltr">
      <aside className="w-64 bg-navy text-white/80 flex flex-col shrink-0 sticky top-0 h-screen overflow-y-auto">
        <div className="p-5 border-b border-white/10">
          <Link to="/admin" className="flex items-center gap-3">
            <span className="h-11 w-11 rounded-lg overflow-hidden bg-white flex items-center justify-center">
              <img src={IMAGES.logo} alt="TASNED" className="h-full w-full object-contain scale-[1.65]" />
            </span>
            <div className="leading-tight">
              <p className="text-white font-bold text-sm">TASNED</p>
              <p className="text-cyan text-xs font-medium">Admin CMS</p>
            </div>
          </Link>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {items.map((it) => (
            <NavLink key={it.to} to={it.to} end={it.end} data-testid={`sidebar-${it.label.toLowerCase().replace(/\s+/g,'-')}`}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  isActive ? "bg-cyan text-navy font-semibold" : "text-white/75 hover:bg-white/5 hover:text-white"
                }`}>
              <it.icon size={17} /> {it.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t border-white/10 space-y-1">
          <div className="px-3 py-2 text-xs">
            <p className="text-white font-medium truncate">{user.email}</p>
            <p className="text-cyan/80 font-mono uppercase tracking-wide">{role}</p>
          </div>
          <Link to="/" target="_blank" className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-white/70 hover:bg-white/5 hover:text-white">
            <ExternalLink size={15} /> View site
          </Link>
          <button onClick={doLogout} data-testid="admin-logout"
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-white/70 hover:bg-red-500/10 hover:text-red-300">
            <LogOut size={15} /> Logout
          </button>
        </div>
      </aside>
      <main className="flex-1 min-w-0">
        <Outlet />
      </main>
    </div>
  );
}
