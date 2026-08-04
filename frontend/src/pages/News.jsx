import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Layout from "../components/site/Layout";
import { Reveal, PageHero } from "../components/site/Shared";
import { useApp } from "../context/AppContext";
import { IMAGES } from "../content";
import api from "../lib/api";
import { ArrowRight, Newspaper } from "lucide-react";

export default function News() {
  const { t, lang } = useApp();
  const [items, setItems] = useState(null);
  useEffect(() => { api.get("/news").then(({ data }) => setItems(data)).catch(() => setItems([])); }, []);
  return (
    <Layout title={t.news.label} description={t.news.title}>
      <PageHero eyebrow={t.news.label} title={t.news.title} image={IMAGES.oceanSurface} crumbs={[t.nav.home, t.news.label]} />
      <section className="py-24 bg-white min-h-[40vh]">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          {items === null ? (
            <p className="text-slate">…</p>
          ) : items.length === 0 ? (
            <Reveal>
              <div className="text-center py-20 rounded-2xl bg-lightgray/40 border border-dashed border-navy/15">
                <Newspaper className="mx-auto text-teal" size={40} />
                <p className="mt-4 text-slate text-lg">{t.news.empty}</p>
              </div>
            </Reveal>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {items.map((n, i) => {
                const title = lang === "ar" && n.title_ar ? n.title_ar : n.title_en;
                const excerpt = lang === "ar" && n.excerpt_ar ? n.excerpt_ar : n.excerpt_en;
                return (
                  <Reveal key={n.id} delay={(i % 3) * 0.06}>
                    <Link to={`/news/${n.slug}`} data-testid={`news-card-${i}`}
                      className="group block h-full rounded-2xl overflow-hidden bg-white border border-lightgray hover:shadow-lift transition-shadow">
                      <div className="aspect-[16/10] overflow-hidden bg-navy">
                        <img src={n.cover_image || IMAGES.cargoPort} alt={title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      </div>
                      <div className="p-6">
                        <span className="font-mono text-xs text-teal uppercase tracking-wider">{n.category}</span>
                        <h3 className="mt-2 text-lg font-semibold text-navy line-clamp-2">{title}</h3>
                        <p className="mt-2 text-slate text-sm line-clamp-3">{excerpt}</p>
                        <span className="mt-4 inline-flex items-center gap-2 text-teal font-semibold text-sm group-hover:text-cyan">
                          {t.cta.readMore} <ArrowRight size={15} />
                        </span>
                      </div>
                    </Link>
                  </Reveal>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
}
