import React from "react";
import Layout from "../components/site/Layout";
import { Reveal, PageHero } from "../components/site/Shared";
import { useApp } from "../context/AppContext";
import { IMAGES, LEGAL } from "../content";

export default function Legal({ kind }) {
  const { t } = useApp();
  const label = kind === "terms" ? t.footer.terms : t.footer.privacy;
  const doc = kind === "terms" ? LEGAL.terms : LEGAL.privacy;

  return (
    <Layout title={doc.title} description={doc.intro}>
      <PageHero eyebrow={t.footer.legal} title={doc.title} image={IMAGES.oceanSurface} crumbs={[t.nav.home, label]} />
      <section className="py-24 bg-white">
        <div className="max-w-3xl mx-auto px-6 md:px-12 text-slate leading-relaxed">
          <Reveal>
            <p className="text-lg mb-10">{doc.intro}</p>
          </Reveal>

          <div className="space-y-10">
            {doc.sections.map((s, i) => (
              <Reveal key={i} delay={(i % 4) * 0.05}>
                <article>
                  <div className="flex items-baseline gap-3 mb-3">
                    <span className="font-mono text-cyan text-sm">{String(i + 1).padStart(2, "0")}</span>
                    <h2 className="text-xl md:text-2xl font-semibold text-navy">{s.h}</h2>
                  </div>
                  <p className="whitespace-pre-line ps-9">{s.body}</p>
                </article>
              </Reveal>
            ))}
          </div>

          <Reveal delay={0.1}>
            <div className="mt-16 pt-8 border-t border-lightgray">
              <p className="whitespace-pre-line font-semibold text-navy">{doc.signature}</p>
            </div>
          </Reveal>
        </div>
      </section>
    </Layout>
  );
}
