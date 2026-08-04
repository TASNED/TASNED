import React from "react";
import { Link } from "react-router-dom";
import { Linkedin, Twitter, Facebook, Mail, Globe, MapPin } from "lucide-react";
import { useApp } from "../../context/AppContext";
import { IMAGES } from "../../content";

export default function Footer() {
  const { t } = useApp();
  const quick = [["/services", "services"], ["/industries", "industries"], ["/standards", "standards"], ["/contact", "contact"]];
  return (
    <footer className="bg-navy text-white/70">
      <div className="max-w-7xl mx-auto px-6 md:px-12 py-16 grid gap-12 md:grid-cols-4">
        <div className="md:col-span-2">
          <div className="flex items-center gap-3">
            <img src={IMAGES.logo} alt="TASNED" className="h-12 w-12 object-contain rounded bg-white/5" />
            <span className="font-bold text-lg text-white">TASNED <span className="text-cyan">INTEGRATED</span></span>
          </div>
          <p className="mt-5 max-w-md text-sm leading-relaxed">{t.footer.about}</p>
          <p className="mt-4 text-xs text-cyan/80 font-mono">{t.footer.disclaimer}</p>
          <div className="mt-6 flex gap-3">
            {[Linkedin, Twitter, Facebook].map((Icon, i) => (
              <a key={i} href="#" aria-label="social" data-testid={`footer-social-${i}`}
                className="h-10 w-10 grid place-items-center rounded-full border border-white/15 hover:bg-cyan hover:text-navy hover:border-cyan transition-colors">
                <Icon size={17} />
              </a>
            ))}
          </div>
        </div>

        <div>
          <h4 className="text-white font-semibold mb-4 text-sm tracking-wide uppercase">{t.footer.quick}</h4>
          <ul className="space-y-3 text-sm">
            {quick.map(([to, key]) => (
              <li key={to}><Link to={to} className="hover:text-cyan transition-colors">{t.nav[key]}</Link></li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="text-white font-semibold mb-4 text-sm tracking-wide uppercase">{t.contact.label}</h4>
          <ul className="space-y-3 text-sm">
            <li className="flex items-start gap-2"><MapPin size={16} className="text-cyan mt-0.5 shrink-0" /> {t.contact.info.address}</li>
            <li className="flex items-center gap-2"><Mail size={16} className="text-cyan shrink-0" /> info@tasned.sa</li>
            <li className="flex items-center gap-2"><Globe size={16} className="text-cyan shrink-0" /> www.tasned.sa</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-6 md:px-12 py-6 flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
          <p>© {new Date().getFullYear()} TASNED INTEGRATED. {t.footer.rights}</p>
          <div className="flex gap-6">
            <Link to="/privacy" className="hover:text-cyan">{t.footer.privacy}</Link>
            <Link to="/terms" className="hover:text-cyan">{t.footer.terms}</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
