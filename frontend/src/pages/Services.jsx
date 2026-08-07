import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Layout from "../components/site/Layout";
import { Reveal, SectionHeading, PageHero } from "../components/site/Shared";
import Icon from "../lib/icons";
import { useApp } from "../context/AppContext";
import { IMAGES } from "../content";
import api from "../lib/api";
import { ArrowRight } from "lucide-react";

export default function Services() {
  const { t, lang } = useApp();
  const [cms, setCms] = useState(null);
  useEffect(() => { api.get("/cms/service").then(({ data }) => setCms(data)).catch(() => setCms([])); }, []);
  const services = cms && cms.length > 0
    ? cms.map((it) => ({
        icon: it.data?.icon || "Droplets",
        t: lang === "ar" && it.data?.title_ar ? it.data.title_ar : (it.data?.title_en || ""),
        d: lang === "ar" && it.data?.description_ar ? it.data.description_ar : (it.data?.description_en || ""),
      }))
    : t.services.slice(0, 6);
  return (
    <Layout title={t.nav.services} description={t.servicesSection.title}>
      <PageHero eyebrow={t.servicesSection.label} title={t.servicesSection.title} image={IMAGES.labBeakers} crumbs={[t.nav.home, t.nav.services]} />
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6 md:px-12 grid md:grid-cols-2 gap-6">
          {services.map((s, i) => (
            <Reveal key={i} delay={i * 0.05}>
              <div className="group h-full flex gap-6 rounded-2xl border border-lightgray p-8 hover:border-cyan hover:shadow-lift transition-[box-shadow,border-color]">
                <div className="h-14 w-14 shrink-0 grid place-items-center rounded-xl bg-navy text-cyan group-hover:bg-cyan group-hover:text-navy transition-colors">
                  <Icon name={s.icon} size={26} />
                </div>
                <div>
                  <span className="font-mono text-teal text-sm">0{i + 1}</span>
                  <h3 className="mt-1 text-xl font-semibold text-navy">{s.t}</h3>
                  <p className="mt-2 text-slate leading-relaxed text-sm">{s.d}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>
      <section className="py-20 bg-navy grain">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <Reveal>
            <h2 className="text-3xl md:text-4xl font-bold text-white">{t.ctaBand.title}</h2>
            <Link to="/contact" className="mt-8 inline-flex items-center gap-2 rounded-full bg-cyan px-8 py-4 font-semibold text-navy hover:bg-white transition-colors">
              {t.cta.request} <ArrowRight size={18} />
            </Link>
          </Reveal>
        </div>
      </section>
    </Layout>
  );
}
