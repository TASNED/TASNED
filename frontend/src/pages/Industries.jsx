import React from "react";
import Layout from "../components/site/Layout";
import { Reveal, PageHero } from "../components/site/Shared";
import Icon from "../lib/icons";
import { useApp } from "../context/AppContext";
import { IMAGES } from "../content";

export default function Industries() {
  const { t } = useApp();
  return (
    <Layout title={t.nav.industries} description={t.industriesSection.title}>
      <PageHero eyebrow={t.industriesSection.label} title={t.industriesSection.title} image={IMAGES.portSunset} crumbs={[t.nav.home, t.nav.industries]} />
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6 md:px-12 grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {t.industries.map((it, i) => (
            <Reveal key={i} delay={(i % 4) * 0.05}>
              <div className="group h-full rounded-2xl bg-navy p-8 overflow-hidden relative shadow-soft hover:shadow-lift transition-shadow">
                <div className="h-14 w-14 grid place-items-center rounded-xl bg-white/10 text-cyan group-hover:bg-cyan group-hover:text-navy transition-colors">
                  <Icon name={it.icon} size={26} />
                </div>
                <h3 className="mt-6 text-lg font-semibold text-white">{it.t}</h3>
              </div>
            </Reveal>
          ))}
        </div>
      </section>
    </Layout>
  );
}
