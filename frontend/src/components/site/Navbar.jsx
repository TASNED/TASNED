import React, { useState, useEffect } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { Menu, X, Globe } from "lucide-react";
import { useApp } from "../../context/AppContext";
import { IMAGES } from "../../content";

const links = [
  ["/", "home"], ["/about", "about"], ["/services", "services"],
  ["/ballast-water-testing", "testing"],
  ["/standards", "standards"], ["/industries", "industries"],
  ["/faq", "faq"], ["/news", "news"], ["/contact", "contact"],
];

export default function Navbar() {
  const { t, toggleLang, lang } = useApp();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const loc = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  useEffect(() => setOpen(false), [loc.pathname]);

  const solid = scrolled || loc.pathname !== "/";

  return (
    <header className={`fixed top-0 inset-x-0 z-50 transition-colors duration-300 ${solid ? "bg-white/90 backdrop-blur-md shadow-soft" : "bg-transparent"}`}>
      <div className="max-w-7xl mx-auto px-6 md:px-12 h-20 flex items-center justify-between gap-4">
        <Link to="/" data-testid="nav-logo" className="flex items-center gap-3 shrink-0">
          <img src={IMAGES.logo} alt="TASNED" className="h-11 w-11 object-contain rounded" />
          <span className={`font-bold text-lg tracking-tight leading-none ${solid ? "text-navy" : "text-white"}`}>
            TASNED <span className="text-cyan font-medium">INTEGRATED</span>
          </span>
        </Link>

        <nav className="hidden xl:flex items-center gap-1">
          {links.map(([to, key]) => (
            <NavLink key={to} to={to} end={to === "/"} data-testid={`nav-${key}`}
              className={({ isActive }) =>
                `px-3 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap ${
                  isActive ? "text-cyan" : solid ? "text-navy/80 hover:text-teal" : "text-white/85 hover:text-cyan"
                }`}>
              {t.nav[key]}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <button onClick={toggleLang} data-testid="lang-toggle"
            className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-mono font-medium border transition-colors ${
              solid ? "border-navy/15 text-navy hover:bg-navy hover:text-white" : "border-white/30 text-white hover:bg-white hover:text-navy"}`}>
            <Globe size={15} /> {lang === "en" ? "AR" : "EN"}
          </button>
          <Link to="/contact" data-testid="nav-cta"
            className="hidden lg:inline-flex items-center rounded-full bg-cyan px-5 py-2.5 text-sm font-semibold text-navy hover:bg-teal hover:text-white transition-colors whitespace-nowrap">
            {t.cta.request}
          </Link>
          <button className="xl:hidden p-2" onClick={() => setOpen((o) => !o)} data-testid="nav-mobile-toggle"
            aria-label="Menu">
            {open ? <X className={solid ? "text-navy" : "text-white"} /> : <Menu className={solid ? "text-navy" : "text-white"} />}
          </button>
        </div>
      </div>

      {open && (
        <div className="xl:hidden bg-white border-t border-lightgray shadow-soft max-h-[80vh] overflow-y-auto">
          <nav className="px-6 py-4 flex flex-col">
            {links.map(([to, key]) => (
              <NavLink key={to} to={to} end={to === "/"} data-testid={`nav-m-${key}`}
                className={({ isActive }) => `py-3 border-b border-lightgray text-base font-medium ${isActive ? "text-cyan" : "text-navy"}`}>
                {t.nav[key]}
              </NavLink>
            ))}
            <Link to="/contact" className="mt-4 text-center rounded-full bg-cyan px-5 py-3 font-semibold text-navy">{t.cta.request}</Link>
          </nav>
        </div>
      )}
    </header>
  );
}
