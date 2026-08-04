import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import Layout from "../components/site/Layout";
import { PageHero } from "../components/site/Shared";
import { useApp } from "../context/AppContext";
import { IMAGES } from "../content";
import api from "../lib/api";
import { ArrowLeft } from "lucide-react";

export default function NewsArticle() {
  const { slug } = useParams();
  const { t, lang } = useApp();
  const [n, setN] = useState(null);
  const [err, setErr] = useState(false);
  useEffect(() => { api.get(`/news/${slug}`).then(({ data }) => setN(data)).catch(() => setErr(true)); }, [slug]);

  if (err) return <Layout title="News"><div className="pt-40 pb-24 text-center"><p className="text-slate">404</p><Link to="/news" className="text-teal">{t.news.back}</Link></div></Layout>;
  if (!n) return <Layout title="News"><div className="pt-40 pb-24 text-center text-slate">…</div></Layout>;

  const title = lang === "ar" && n.title_ar ? n.title_ar : n.title_en;
  const body = lang === "ar" && n.body_ar ? n.body_ar : n.body_en;
  return (
    <Layout title={title} description={n.excerpt_en}>
      <PageHero eyebrow={n.category} title={title} image={n.cover_image || IMAGES.oceanSurface} crumbs={[t.nav.home, t.news.label]} />
      <article className="py-20 bg-white">
        <div className="max-w-3xl mx-auto px-6 md:px-12">
          {n.cover_image && <img src={n.cover_image} alt={title} className="rounded-2xl shadow-soft w-full object-cover aspect-[16/9] mb-10" />}
          <div className="prose max-w-none text-slate leading-relaxed whitespace-pre-line text-lg">{body}</div>
          <Link to="/news" className="mt-12 inline-flex items-center gap-2 text-teal font-semibold hover:text-cyan">
            <ArrowLeft size={16} /> {t.news.back}
          </Link>
        </div>
      </article>
    </Layout>
  );
}
