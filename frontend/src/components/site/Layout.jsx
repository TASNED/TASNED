import React, { useEffect } from "react";
import { useLocation } from "react-router-dom";
import Lenis from "lenis";
import Navbar from "./Navbar";
import Footer from "./Footer";
import { useApp } from "../../context/AppContext";

const SITE_URL = "https://www.tasned.sa";
const DEFAULT_TITLE = "TASNED INTEGRATED — Ballast Water Testing & Marine Laboratory";
const DEFAULT_DESCRIPTION = "TASNED INTEGRATED provides independent ballast water sampling and laboratory analysis services to support vessel compliance with international marine environmental regulations.";
const DEFAULT_IMAGE = "https://customer-assets-lxgj4vgw.emergentagent.net/job_marine-testing-hub/artifacts/kut7eg12_WhatsApp%20Image%202026-08-04%20at%208.34.29%20PM.jpeg";

const ORGANIZATION_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "TASNED INTEGRATED",
  url: SITE_URL,
  logo: "https://customer-assets-lxgj4vgw.emergentagent.net/job_marine-testing-hub/artifacts/kut7eg12_WhatsApp%20Image%202026-08-04%20at%208.34.29%20PM.jpeg",
  sameAs: [
    "https://www.linkedin.com/company/tasnedsa/"
  ],
  contactPoint: [
    {
      "@type": "ContactPoint",
      telephone: "+966-500-000000",
      contactType: "customer support",
      areaServed: "SA",
      availableLanguage: ["English", "Arabic"]
    }
  ]
};

const setMeta = (attrName, attrValue, content) => {
  const selector = `meta[${attrName}="${attrValue}"]`;
  let node = document.head.querySelector(selector);
  if (!node) {
    node = document.createElement("meta");
    node.setAttribute(attrName, attrValue);
    document.head.appendChild(node);
  }
  node.content = content;
};

const setLink = (rel, href) => {
  let node = document.head.querySelector(`link[rel="${rel}"]`);
  if (!node) {
    node = document.createElement("link");
    node.rel = rel;
    document.head.appendChild(node);
  }
  node.href = href;
};

const setStructuredData = (data) => {
  let node = document.head.querySelector('script[type="application/ld+json"]');
  if (!node) {
    node = document.createElement("script");
    node.type = "application/ld+json";
    document.head.appendChild(node);
  }
  node.textContent = JSON.stringify(data);
};

export default function Layout({ children, title, description, image, robots = "index, follow" }) {
  const { pathname } = useLocation();
  const { lang } = useApp();

  useEffect(() => {
    const lenis = new Lenis({ duration: 1.1, smoothWheel: true });
    let raf;
    const loop = (t) => { lenis.raf(t); raf = requestAnimationFrame(loop); };
    raf = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(raf); lenis.destroy(); };
  }, []);

  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);

  useEffect(() => {
    const pageTitle = title ? `${title} | TASNED INTEGRATED` : DEFAULT_TITLE;
    const pageDescription = description || DEFAULT_DESCRIPTION;
    const canonicalUrl = `${SITE_URL}${pathname}`;
    const imageUrl = image || DEFAULT_IMAGE;

    document.title = pageTitle;
    document.documentElement.lang = lang || "en";

    setMeta("name", "description", pageDescription);
    setMeta("name", "robots", robots);
    setMeta("property", "og:type", "website");
    setMeta("property", "og:site_name", "TASNED INTEGRATED");
    setMeta("property", "og:title", pageTitle);
    setMeta("property", "og:description", pageDescription);
    setMeta("property", "og:url", canonicalUrl);
    setMeta("property", "og:image", imageUrl);
    setMeta("name", "twitter:card", "summary_large_image");
    setMeta("name", "twitter:title", pageTitle);
    setMeta("name", "twitter:description", pageDescription);
    setMeta("name", "twitter:image", imageUrl);
    setLink("canonical", canonicalUrl);
    setStructuredData(ORGANIZATION_JSON_LD);
  }, [title, description, image, robots, pathname, lang]);

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
