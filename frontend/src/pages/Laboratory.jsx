import React from "react";
import Layout from "../components/site/Layout";
import { Reveal, SectionHeading, PageHero } from "../components/site/Shared";
import Icon from "../lib/icons";
import { useApp } from "../context/AppContext";
import { IMAGES } from "../content";

export default function Laboratory() {
  const { t } = useApp();
  const l = t.laboratory;
  return (
    <Layout title={t.nav.laboratory} description={l.intro}>
      <PageHero eyebrow={l.label} title={l.title} image={IMAGES.microscope} crumbs={[t.nav.home, t.nav.laboratory]} />
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6 md:px-12 grid lg:grid-cols-2 gap-14 items-center">
          <Reveal><img src={IMAGES.microscope} alt="Laboratory microscope" className="rounded-2xl shadow-lift w-full object-cover aspect-[4/3]" /></Reveal>
          <Reveal delay={0.1}>
            <SectionHeading label={l.label} title={l.title} />
            <p className="mt-6 text-lg text-slate leading-relaxed">{l.intro}</p>
          </Reveal>
        </div>
      </section>
      <section className="py-24 bg-lightgray/40">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {l.items.map((it, i) => (
              <Reveal key={i} delay={(i % 4) * 0.05}>
                <div className="h-full bg-white rounded-2xl p-7 shadow-soft hover:-translate-y-1 hover:shadow-lift transition-[transform,box-shadow]">
                  <div className="h-12 w-12 grid place-items-center rounded-xl bg-navy text-cyan"><Icon name={it.icon} size={22} /></div>
                  <h3 className="mt-5 text-lg font-semibold text-navy">{it.t}</h3>
                  <p className="mt-2 text-slate text-sm leading-relaxed">{it.d}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </Layout>
  );
}
