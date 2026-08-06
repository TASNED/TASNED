import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import Layout from "../components/site/Layout";
import { Reveal, Eyebrow, SectionHeading, BrandMarquee, Counter, PageHero, RotatingImage } from "../components/site/Shared";
import Icon from "../lib/icons";
import { useApp } from "../context/AppContext";
import { IMAGES, WHO_GALLERY } from "../content";

const line = { hidden: { y: "110%" }, show: (i) => ({ y: "0%", transition: { duration: 0.9, delay: 0.15 + i * 0.12, ease: [0.22, 1, 0.36, 1] } }) };

function Hero() {
  const { t } = useApp();
  const words = t.hero.title.split(" ");
  const mid = Math.ceil(words.length / 2);
  const lines = [words.slice(0, mid).join(" "), words.slice(mid).join(" ")];
  return (
    <section className="relative min-h-screen flex items-center bg-navy overflow-hidden grain">
      <div className="absolute inset-0">
        <img src={IMAGES.heroOcean} alt="" className="w-full h-full object-cover opacity-40" />
        <div className="absolute inset-0 bg-gradient-to-b from-navy/85 via-navy/70 to-navy" />
      </div>
      <div className="relative max-w-7xl mx-auto px-6 md:px-12 pt-32 pb-20 w-full">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
          <Eyebrow light>{t.hero.eyebrow}</Eyebrow>
        </motion.div>
        <h1 className="mt-6 text-white font-bold tracking-tight leading-[1.1] rtl:leading-[1.35] text-4xl sm:text-5xl lg:text-7xl max-w-5xl">
          {lines.map((l, i) => (
            <span key={i} className="block overflow-hidden pb-1 rtl:pb-3">
              <motion.span variants={line} custom={i} initial="hidden" animate="show" className="block">
                {l}
              </motion.span>
            </span>
          ))}
        </h1>
        <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55, duration: 0.7 }}
          className="mt-8 max-w-2xl text-lg text-white/75 leading-relaxed">
          {t.hero.subtitle}
        </motion.p>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7, duration: 0.7 }}
          className="mt-10 flex flex-wrap gap-4">
          <Link to="/contact" data-testid="hero-request"
            className="group inline-flex items-center gap-2 rounded-full bg-cyan px-7 py-4 font-semibold text-navy hover:bg-white transition-colors">
            {t.cta.request} <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link to="/services" data-testid="hero-contact"
            className="inline-flex items-center gap-2 rounded-full border border-white/30 px-7 py-4 font-semibold text-white hover:bg-white/10 transition-colors">
            {t.cta.contact}
          </Link>
        </motion.div>
      </div>
    </section>
  );
}

export default function Home() {
  const { t } = useApp();
  return (
    <Layout title={null}>
      <Hero />
      <BrandMarquee text={t.marquee} />

      {/* Who we are */}
      <section className="py-24 md:py-32 bg-white">
        <div className="max-w-7xl mx-auto px-6 md:px-12 grid lg:grid-cols-2 gap-14 items-center">
          <Reveal>
            <div className="relative">
              <RotatingImage images={WHO_GALLERY} alt="Ballast water analysis and vessels served"
                className="rounded-2xl shadow-lift w-full aspect-[4/5]" />
              <div className="absolute -bottom-6 -right-4 md:-right-8 bg-navy text-white rounded-2xl p-6 shadow-lift max-w-[220px] z-20">
                <p className="font-mono text-cyan text-sm">IMO</p>
                <p className="mt-1 text-sm text-white/80">{t.hero.eyebrow}</p>
              </div>
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <SectionHeading label={t.who.label} title={t.who.title} />
            <p className="mt-6 text-slate leading-relaxed text-lg">
              {t.who.body.split(t.brand).map((part, i, arr) => (
                <React.Fragment key={i}>
                  {part}
                  {i < arr.length - 1 && <strong className="font-bold text-navy">{t.brand}</strong>}
                </React.Fragment>
              ))}
            </p>
            <Link to="/about" data-testid="home-about-link" className="mt-8 inline-flex items-center gap-2 font-semibold text-teal hover:text-cyan transition-colors">
              {t.cta.learn} <ArrowRight size={18} />
            </Link>
          </Reveal>
        </div>
      </section>

      {/* Services */}
      <section className="py-24 md:py-32 bg-lightgray/40">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <Reveal><SectionHeading label={t.servicesSection.label} title={t.servicesSection.title} /></Reveal>
          <div className="mt-14 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {t.services.map((s, i) => (
              <Reveal key={i} delay={i * 0.05}>
                <Link to="/services" data-testid={`home-service-${i}`}
                  className="group block h-full bg-white rounded-2xl p-8 shadow-soft hover:shadow-lift hover:-translate-y-1 transition-[transform,box-shadow] duration-300 border border-transparent hover:border-cyan/30">
                  <div className="h-14 w-14 grid place-items-center rounded-xl bg-navy text-cyan group-hover:bg-cyan group-hover:text-navy transition-colors">
                    <Icon name={s.icon} size={26} />
                  </div>
                  <h3 className="mt-6 text-xl font-semibold text-navy">{s.t}</h3>
                  <p className="mt-3 text-slate text-sm leading-relaxed">{s.d}</p>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Workflow */}
      <section className="py-24 md:py-32 bg-navy grain relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 md:px-12 relative">
          <Reveal><SectionHeading label={t.workflow.label} title={t.workflow.title} light /></Reveal>
          <div className="mt-16 grid md:grid-cols-5 gap-6 relative">
            <div className="hidden md:block absolute top-8 inset-x-0 h-px bg-white/15" />
            {t.workflow.steps.map((s, i) => (
              <Reveal key={i} delay={i * 0.1} className="relative">
                <div className="h-16 w-16 rounded-full bg-cyan text-navy grid place-items-center font-mono font-bold text-xl relative z-10">
                  {s.n}
                </div>
                <h3 className="mt-6 text-white font-semibold text-lg">{s.t}</h3>
                <p className="mt-2 text-white/60 text-sm leading-relaxed">{s.d}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Industries */}
      <section className="py-24 md:py-32 bg-white">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <Reveal><SectionHeading label={t.industriesSection.label} title={t.industriesSection.title} /></Reveal>
          <div className="mt-14 grid grid-cols-2 md:grid-cols-4 gap-4">
            {t.industries.map((it, i) => (
              <Reveal key={i} delay={i * 0.04}>
                <div className="group flex items-center gap-4 rounded-xl border border-lightgray p-5 hover:border-cyan hover:bg-lightgray/30 transition-colors">
                  <Icon name={it.icon} size={26} className="text-teal group-hover:text-cyan transition-colors shrink-0" />
                  <span className="font-medium text-navy text-sm">{it.t}</span>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Why choose - manifesto */}
      <section className="py-24 md:py-32 bg-lightgray/40">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <Reveal><SectionHeading label={t.why.label} title={t.why.title} /></Reveal>
          <div className="mt-14 grid md:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-2">
            {t.why.items.map((w, i) => (
              <Reveal key={i} delay={i * 0.05}>
                <div className="flex gap-5 py-6 border-b border-navy/10">
                  <span className="font-mono text-teal text-sm pt-1">0{i + 1}</span>
                  <div>
                    <h3 className="text-lg font-semibold text-navy">{w.t}</h3>
                    <p className="mt-1 text-slate text-sm">{w.d}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
            {t.counters.map((c, i) => (
              <Reveal key={i} delay={i * 0.1}>
                <div className="text-center md:text-start">
                  <Counter value={c.value} suffix={c.suffix} display={c.display} />
                  <p className="mt-2 text-slate text-sm uppercase tracking-wide">{c.label}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* CTA band */}
      <section className="relative overflow-hidden bg-navy py-20 grain">
        <img src={IMAGES.portSunset} alt="" className="absolute inset-0 w-full h-full object-cover opacity-20" />
        <div className="relative max-w-4xl mx-auto px-6 text-center">
          <Reveal>
            <h2 className="text-3xl md:text-5xl font-bold text-white tracking-tight">{t.ctaBand.title}</h2>
            <p className="mt-5 text-white/70 text-lg">{t.ctaBand.body}</p>
            <Link to="/contact" data-testid="home-cta-band"
              className="mt-8 inline-flex items-center gap-2 rounded-full bg-cyan px-8 py-4 font-semibold text-navy hover:bg-white transition-colors">
              {t.cta.request} <ArrowUpRight size={18} />
            </Link>
          </Reveal>
        </div>
      </section>
    </Layout>
  );
}
