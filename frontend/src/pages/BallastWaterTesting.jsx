import React from "react";
import Layout from "../components/site/Layout";
import { Reveal, PageHero } from "../components/site/Shared";
import { useApp } from "../context/AppContext";
import { IMAGES } from "../content";

export default function BallastWaterTesting() {
  const { t } = useApp();
  const b = t.testing;
  return (
    <Layout title={t.nav.testing} description={b.title}>
      <PageHero eyebrow={b.label} title={b.title} image={IMAGES.oceanSurface} crumbs={[t.nav.home, t.nav.testing]} />
      <section className="py-24 bg-white">
        <div className="max-w-5xl mx-auto px-6 md:px-12">
          <div className="grid gap-y-2">
            {b.sections.map((s, i) => (
              <Reveal key={i} delay={(i % 3) * 0.05}>
                <article className="grid md:grid-cols-[80px_1fr] gap-4 md:gap-8 py-8 border-b border-lightgray">
                  <span className="font-mono text-cyan text-lg font-bold">{String(i + 1).padStart(2, "0")}</span>
                  <div>
                    <h2 className="text-2xl font-semibold text-navy">{s.t}</h2>
                    <p className="mt-3 text-slate leading-relaxed">{s.d}</p>
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </Layout>
  );
}
