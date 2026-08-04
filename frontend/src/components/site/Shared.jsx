import React, { useRef, useEffect, useState } from "react";
import { motion, useInView, useScroll, useTransform } from "framer-motion";
import Marquee from "react-fast-marquee";

export const Reveal = ({ children, delay = 0, y = 28, className = "" }) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

export const Eyebrow = ({ children, light = false }) => (
  <span className={`inline-flex items-center gap-2 text-xs font-mono tracking-[0.25em] uppercase ${light ? "text-cyan" : "text-teal"}`}>
    <span className={`h-px w-8 ${light ? "bg-cyan/60" : "bg-teal/50"}`} />
    {children}
  </span>
);

export const SectionHeading = ({ label, title, light = false, center = false, className = "" }) => (
  <div className={`${center ? "text-center mx-auto max-w-3xl" : "max-w-3xl"} ${className}`}>
    <Eyebrow light={light}>{label}</Eyebrow>
    <h2 className={`mt-4 text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight leading-[1.05] ${light ? "text-white" : "text-navy"}`}>
      {title}
    </h2>
  </div>
);

export const BrandMarquee = ({ text }) => (
  <div className="bg-navy text-white py-5 border-y border-white/10 overflow-hidden">
    <Marquee autoFill speed={45} gradient={false}>
      {[0, 1].map((i) => (
        <span key={i} className="text-lg md:text-2xl font-medium tracking-tight px-2 flex items-center">
          {text}<span className="text-cyan mx-3">✦</span>
        </span>
      ))}
    </Marquee>
  </div>
);

export const Counter = ({ value, suffix = "", display }) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!inView || display) return;
    let start = 0; const dur = 1400; const t0 = performance.now();
    const step = (now) => {
      const p = Math.min((now - t0) / dur, 1);
      setN(Math.floor(p * value));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [inView, value, display]);
  return (
    <span ref={ref} className="font-mono text-4xl md:text-6xl font-bold text-cyan">
      {display || `${n}${suffix}`}
    </span>
  );
};

export const PageHero = ({ eyebrow, title, image, crumbs }) => {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "22%"]);
  return (
    <section ref={ref} className="relative overflow-hidden bg-navy pt-36 pb-20 md:pt-44 md:pb-28 grain">
      <motion.div style={{ y }} className="absolute inset-0 opacity-30">
        <img src={image} alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-navy/70" />
      </motion.div>
      <div className="relative max-w-7xl mx-auto px-6 md:px-12">
        {crumbs && (
          <nav className="mb-6 text-xs font-mono tracking-wider text-white/50 flex gap-2 flex-wrap" aria-label="Breadcrumb">
            {crumbs.map((c, i) => (
              <span key={i} className={i === crumbs.length - 1 ? "text-cyan" : ""}>
                {c}{i < crumbs.length - 1 && <span className="mx-2 text-white/30">/</span>}
              </span>
            ))}
          </nav>
        )}
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}>
          <Eyebrow light>{eyebrow}</Eyebrow>
          <h1 className="mt-4 text-4xl md:text-5xl lg:text-6xl font-bold text-white tracking-tight leading-[1.03] max-w-4xl text-balance">
            {title}
          </h1>
        </motion.div>
      </div>
    </section>
  );
};
