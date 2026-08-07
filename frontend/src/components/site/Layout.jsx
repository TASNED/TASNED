import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import Lenis from "lenis";
import Navbar from "./Navbar";
import Footer from "./Footer";
import { useApp } from "../../context/AppContext";
import api from "../../lib/api";

let _settingsPromise = null;
function fetchSettings() {
  if (!_settingsPromise) _settingsPromise = api.get("/settings").then(r => r.data).catch(() => ({}));
  return _settingsPromise;
}

function ensureMeta(name, content, key = "name") {
  if (!content) return;
  let el = document.querySelector(`meta[${key}="${name}"]`);
  if (!el) { el = document.createElement("meta"); el.setAttribute(key, name); document.head.appendChild(el); }
  el.setAttribute("content", content);
}
function ensureLink(rel, href) {
  if (!href) return;
  let el = document.querySelector(`link[rel="${rel}"]`);
  if (!el) { el = document.createElement("link"); el.setAttribute("rel", rel); document.head.appendChild(el); }
  el.setAttribute("href", href);
}
function ensureScript(id, code, isSrc = false) {
  if (document.getElementById(id)) return;
  const s = document.createElement("script");
  s.id = id;
  if (isSrc) { s.src = code; s.async = true; } else { s.text = code; }
  document.head.appendChild(s);
}

export default function Layout({ children, title, description }) {
  const { pathname } = useLocation();
  const { lang } = useApp();
  const [settings, setSettings] = useState({});

  useEffect(() => { fetchSettings().then(setSettings); }, []);

  useEffect(() => {
    const lenis = new Lenis({ duration: 1.1, smoothWheel: true });
    let raf;
    const loop = (t) => { lenis.raf(t); raf = requestAnimationFrame(loop); };
    raf = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(raf); lenis.destroy(); };
  }, []);

  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);

  useEffect(() => {
    const brand = settings.site_name || "TASNED INTEGRATED";
    const defaultTitle = settings.seo_title || `${brand} — Ballast Water Testing & Marine Laboratory`;
    const defaultDesc = settings.seo_description || "Independent ballast water sampling and inspection supporting international marine environmental compliance.";
    document.title = title ? `${title} | ${brand}` : defaultTitle;
    ensureMeta("description", description || defaultDesc);
    ensureMeta("keywords", settings.seo_keywords || "");
    ensureMeta("robots", settings.robots_default || "index, follow");
    // Open Graph
    ensureMeta("og:title", title || defaultTitle, "property");
    ensureMeta("og:description", description || defaultDesc, "property");
    ensureMeta("og:type", "website", "property");
    if (settings.og_image) ensureMeta("og:image", settings.og_image, "property");
    ensureMeta("twitter:card", "summary_large_image");
    // Canonical
    if (settings.canonical_base) {
      const path = pathname === "/" ? "" : pathname;
      ensureLink("canonical", `${settings.canonical_base.replace(/\/$/, "")}${path}`);
    }
    // Google Search Console
    if (settings.google_verification) ensureMeta("google-site-verification", settings.google_verification);
    // hreflang alt for language switch
    ensureLink("alternate", null); // no-op placeholder; real hreflang added below
  }, [title, description, lang, pathname, settings]);

  useEffect(() => {
    // GA4
    if (settings.ga4_measurement_id && !document.getElementById("ga4-src")) {
      ensureScript("ga4-src", `https://www.googletagmanager.com/gtag/js?id=${settings.ga4_measurement_id}`, true);
      ensureScript("ga4-init", `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${settings.ga4_measurement_id}');`);
    }
    // GTM
    if (settings.gtm_id && !document.getElementById("gtm-src")) {
      ensureScript("gtm-src", `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s);j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${settings.gtm_id}');`);
    }
  }, [settings.ga4_measurement_id, settings.gtm_id]);

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
