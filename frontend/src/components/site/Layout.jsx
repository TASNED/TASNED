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
  const [pageSeo, setPageSeo] = useState({});
  const [schemas, setSchemas] = useState([]);

  useEffect(() => { fetchSettings().then(setSettings); }, []);

  useEffect(() => {
    api.get("/page-seo", { params: { route: pathname } }).then(({ data }) => setPageSeo(data || {})).catch(() => setPageSeo({}));
    api.get("/schemas", { params: { route: pathname } }).then(({ data }) => setSchemas(data || [])).catch(() => setSchemas([]));
  }, [pathname]);

  useEffect(() => {
    const lenis = new Lenis({ duration: 1.1, smoothWheel: true });
    let raf;
    const loop = (t) => { lenis.raf(t); raf = requestAnimationFrame(loop); };
    raf = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(raf); lenis.destroy(); };
  }, []);

  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);

  useEffect(() => {
    const brand = settings.site_name || "TASNED Integrated";
    const defaultTitle = settings.seo_title || `TASNED | ${brand} – Maritime & Ballast Water Services`;
    const defaultDesc = settings.seo_description || "TASNED Integrated (تسنيد) is a Saudi Arabian maritime services company specializing in independent ballast water sampling, laboratory testing and environmental compliance for ships.";
    // Home page keeps the branded default title; other pages get "Page | Brand"
    const finalTitle = pageSeo.title || (title ? `${title} | ${brand}` : defaultTitle);
    const finalDesc = pageSeo.description || description || defaultDesc;
    document.title = finalTitle;
    ensureMeta("description", finalDesc);
    ensureMeta("robots", pageSeo.robots || settings.robots_default || "index, follow, max-image-preview:large");
    ensureMeta("og:site_name", brand, "property");
    ensureMeta("og:title", pageSeo.og_title || finalTitle, "property");
    ensureMeta("og:description", pageSeo.og_description || finalDesc, "property");
    ensureMeta("og:type", "website", "property");
    if (pageSeo.og_image || settings.og_image) ensureMeta("og:image", pageSeo.og_image || settings.og_image, "property");
    ensureMeta("twitter:card", pageSeo.twitter_card || "summary_large_image");
    ensureMeta("twitter:title", pageSeo.og_title || finalTitle);
    ensureMeta("twitter:description", pageSeo.og_description || finalDesc);
    if (pageSeo.og_image || settings.og_image) ensureMeta("twitter:image", pageSeo.og_image || settings.og_image);
    const canBase = (settings.canonical_base || "https://www.tasned.sa").replace(/\/$/, "");
    const canPath = pathname === "/" ? "/" : pathname;
    if (pageSeo.canonical) ensureLink("canonical", pageSeo.canonical);
    else ensureLink("canonical", `${canBase}${canPath}`);
    ensureMeta("og:url", pageSeo.canonical || `${canBase}${canPath}`, "property");
    if (settings.google_verification) ensureMeta("google-site-verification", settings.google_verification);
    // hreflang — update existing static hreflang tags in place (avoid duplicates)
    const setHreflang = (code, href) => {
      let el = document.querySelector(`link[rel="alternate"][hreflang="${code}"]`);
      if (!el) {
        el = document.createElement("link");
        el.setAttribute("rel", "alternate");
        el.setAttribute("hreflang", code);
        document.head.appendChild(el);
      }
      el.setAttribute("href", href);
    };
    setHreflang("en", `${canBase}${canPath}`);
    setHreflang("ar", `${canBase}${canPath}${canPath.includes("?") ? "&" : "?"}lang=ar`);
    setHreflang("x-default", `${canBase}${canPath}`);
  }, [title, description, lang, pathname, settings, pageSeo]);

  // Inject JSON-LD schemas (remove static pre-hydrated Organization/WebSite first
  // so we don't emit duplicates once the richer runtime schemas arrive)
  useEffect(() => {
    if (!schemas || schemas.length === 0) return;
    document.querySelectorAll("script[data-jsonld]").forEach((el) => el.remove());
    // Remove any pre-hydrated Organization / WebSite from index.html — the runtime
    // versions are the authoritative source.
    document.querySelectorAll('script[type="application/ld+json"]').forEach((el) => {
      try {
        const j = JSON.parse(el.textContent || "{}");
        const t = j["@type"];
        if (t === "Organization" || t === "WebSite") el.remove();
      } catch { /* ignore */ }
    });
    schemas.forEach((s, i) => {
      const script = document.createElement("script");
      script.type = "application/ld+json";
      script.setAttribute("data-jsonld", String(i));
      script.text = JSON.stringify(s);
      document.head.appendChild(script);
    });
    if (pageSeo.jsonld_extra) {
      try {
        const extra = JSON.parse(pageSeo.jsonld_extra);
        const script = document.createElement("script");
        script.type = "application/ld+json";
        script.setAttribute("data-jsonld", "extra");
        script.text = JSON.stringify(extra);
        document.head.appendChild(script);
      } catch { /* ignore invalid JSON */ }
    }
  }, [schemas, pageSeo.jsonld_extra]);

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
