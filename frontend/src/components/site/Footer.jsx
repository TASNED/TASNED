import React from "react";
import { Link } from "react-router-dom";
import { Linkedin, Mail, Globe, MapPin } from "lucide-react";
import { useApp } from "../../context/AppContext";
import { IMAGES } from "../../content";

const LINKEDIN_URL = "https://www.linkedin.com/company/tasnedsa/";

export default function Footer() {
  const { t } = useApp();
  const quick = [["/services", "services"], ["/industries", "industries"], ["/standards", "standards"], ["/careers", "careers"], ["/contact", "contact"]];
  return (
    <footer className="bg-navy text-white/70">
      <div className="max-w-7xl mx-auto px-6 md:px-12 py-16 grid gap-12 md:grid-cols-4">
        <div className="md:col-span-2">
          <div className="flex items-center gap-4">
            <span className="h-16 w-16 md:h-20 md:w-20 rounded-xl overflow-hidden bg-white shadow-lift flex items-center justify-center">
              <img src={IMAGES.logo} alt="TASNED" className="h-full w-full object-contain scale-[1.65] origin-center" />
            </span>
            <span className="font-bold text-2xl text-white tracking-tight">TASNED <span className="text-cyan">INTEGRATED</span></span>
          </div>
          <div className="mt-1">
            <div className="text-sm leading-none">تسنيد المتكاملة — تسنيد</div>
          </div>
          <p className="mt-5 max-w-md text-sm leading-relaxed">{t.footer.about}</p>
          <p className="mt-4 text-base italic text-cyan/90 font-medium">{t.footer.disclaimer}</p>
          <div className="mt-6 flex gap-3">
            <a href={LINKEDIN_URL} target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" data-testid="footer-linkedin"
              className="h-11 w-11 grid place-items-center rounded-full border border-white/15 hover:bg-cyan hover:text-navy hover:border-cyan transition-colors">
              <Linkedin size={18} />
            </a>
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
          <p className="font-mono text-white/60"><span className="text-white/40 uppercase tracking-wider">{t.footer.crLabel}:</span> <span className="text-cyan">{t.footer.crNumber}</span></p>
          <div className="flex gap-6">
            <Link to="/privacy" className="hover:text-cyan">{t.footer.privacy}</Link>
            <Link to="/terms" className="hover:text-cyan">{t.footer.terms}</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
