import React from "react";
import Layout from "../components/site/Layout";
import { Reveal, PageHero } from "../components/site/Shared";
import { useApp } from "../context/AppContext";
import { IMAGES } from "../content";
import { ShieldCheck } from "lucide-react";

export default function Standards() {
  const { t } = useApp();
  const s = t.standards;
  return (
    <Layout title={t.nav.standards} description={s.intro}>
      <PageHero eyebrow={s.label} title={s.title} image={IMAGES.cargoPort} crumbs={[t.nav.home, t.nav.standards]} />
      <section className="py-24 bg-white">
        <div className="max-w-5xl mx-auto px-6 md:px-12">
          <Reveal><p className="text-lg text-slate leading-relaxed mb-12">{s.intro}</p></Reveal>
          <div className="grid gap-6">
            {s.items.map((it, i) => (
              <Reveal key={i} delay={(i % 3) * 0.05}>
                <div className="flex gap-5 rounded-2xl border border-lightgray p-8 hover:border-cyan hover:shadow-soft transition-[box-shadow,border-color]">
                  <div className="h-12 w-12 shrink-0 grid place-items-center rounded-xl bg-teal/10 text-teal"><ShieldCheck size={22} /></div>
                  <div>
                    <h2 className="text-xl font-semibold text-navy">{it.t}</h2>
                    <p className="mt-2 text-slate leading-relaxed text-sm">{it.d}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </Layout>
  );
}
