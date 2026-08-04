import React from "react";
import Layout from "../components/site/Layout";
import { Reveal, SectionHeading, PageHero } from "../components/site/Shared";
import { useApp } from "../context/AppContext";
import { IMAGES } from "../content";
import { Target, Eye } from "lucide-react";

export default function About() {
  const { t } = useApp();
  const a = t.about;
  return (
    <Layout title={t.nav.about} description={a.intro}>
      <PageHero eyebrow={a.label} title={a.title} image={IMAGES.oceanSurface} crumbs={[t.nav.home, t.nav.about]} />
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6 md:px-12 grid lg:grid-cols-2 gap-14 items-center">
          <Reveal><img src={IMAGES.cargoPort} alt="Port operations" className="rounded-2xl shadow-lift w-full object-cover aspect-[4/3]" /></Reveal>
          <Reveal delay={0.1}>
            <p className="text-lg text-slate leading-relaxed">{a.intro}</p>
            <div className="mt-10 grid gap-6">
              {[[Target, a.mission], [Eye, a.vision]].map(([Ic, v], i) => (
                <div key={i} className="flex gap-5 rounded-2xl bg-lightgray/40 p-6">
                  <div className="h-12 w-12 shrink-0 grid place-items-center rounded-xl bg-navy text-cyan"><Ic size={22} /></div>
                  <div><h3 className="text-xl font-semibold text-navy">{v.t}</h3><p className="mt-2 text-slate text-sm leading-relaxed">{v.d}</p></div>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>
      <section className="py-24 bg-lightgray/40">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <Reveal><SectionHeading label={a.label} title={a.valuesTitle} center /></Reveal>
          <div className="mt-14 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {a.values.map((v, i) => (
              <Reveal key={i} delay={i * 0.05}>
                <div className="h-full bg-white rounded-2xl p-8 shadow-soft hover:-translate-y-1 hover:shadow-lift transition-[transform,box-shadow]">
                  <span className="font-mono text-teal text-sm">0{i + 1}</span>
                  <h3 className="mt-3 text-xl font-semibold text-navy">{v.t}</h3>
                  <p className="mt-2 text-slate text-sm leading-relaxed">{v.d}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </Layout>
  );
}
