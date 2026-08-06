import React from "react";
import Layout from "../components/site/Layout";
import { Reveal, PageHero } from "../components/site/Shared";
import { useApp } from "../context/AppContext";
import { IMAGES } from "../content";
import { Mail, Briefcase, ArrowRight } from "lucide-react";

export default function Careers() {
  const { t } = useApp();
  const c = t.careers;
  return (
    <Layout title={c.label} description={c.intro}>
      <PageHero eyebrow={c.label} title={c.title} image={IMAGES.portSunset} crumbs={[t.nav.home, c.label]} />
      <section className="py-24 bg-white">
        <div className="max-w-3xl mx-auto px-6 md:px-12">
          <Reveal>
            <p className="text-lg text-slate leading-relaxed">{c.intro}</p>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="mt-12 rounded-2xl border border-dashed border-navy/15 bg-lightgray/40 p-10 text-center">
              <Briefcase className="mx-auto text-teal" size={40} />
              <p className="mt-4 text-slate leading-relaxed">{c.empty}</p>
              <a href={`mailto:${c.emailLabel}`} data-testid="careers-email"
                className="mt-8 inline-flex items-center gap-2 rounded-full bg-cyan px-7 py-3.5 font-semibold text-navy hover:bg-navy hover:text-white transition-colors">
                <Mail size={17} /> {c.cta} <ArrowRight size={16} />
              </a>
              <p className="mt-4 font-mono text-sm text-navy">{c.emailLabel}</p>
            </div>
          </Reveal>
        </div>
      </section>
    </Layout>
  );
}
