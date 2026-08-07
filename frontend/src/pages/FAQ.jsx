import React, { useEffect, useState } from "react";
import Layout from "../components/site/Layout";
import { Reveal, PageHero } from "../components/site/Shared";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../components/ui/accordion";
import { useApp } from "../context/AppContext";
import { IMAGES, FAQS } from "../content";
import api from "../lib/api";

export default function FAQ() {
  const { t, lang } = useApp();
  const [cmsFaqs, setCmsFaqs] = useState(null);
  useEffect(() => {
    api.get("/cms/faq").then(({ data }) => setCmsFaqs(data)).catch(() => setCmsFaqs([]));
  }, []);
  const faqs = cmsFaqs && cmsFaqs.length > 0
    ? cmsFaqs.map((it) => [it.data?.question_en || "", it.data?.answer_en || "", it.data?.question_ar || "", it.data?.answer_ar || ""])
    : FAQS;

  // Emit FAQPage JSON-LD from the currently rendered Q&A set for Google rich results.
  useEffect(() => {
    document.querySelectorAll('script[data-jsonld-faq]').forEach((el) => el.remove());
    const items = faqs
      .filter((f) => f[0] && f[1])
      .map((f) => ({
        "@type": "Question",
        "name": f[0],
        "acceptedAnswer": { "@type": "Answer", "text": f[1] },
      }));
    if (items.length === 0) return;
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.setAttribute("data-jsonld-faq", "1");
    script.text = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": items,
    });
    document.head.appendChild(script);
    return () => { script.remove(); };
  }, [faqs]);

  return (
    <Layout title={t.faqLabel} description={t.faqIntro}>
      <PageHero eyebrow={t.faqLabel} title={t.faqTitle} image={IMAGES.labScientist} crumbs={[t.nav.home, t.faqLabel]} />
      <section className="py-24 bg-white">
        <div className="max-w-4xl mx-auto px-6 md:px-12">
          <Reveal><p className="text-lg text-slate leading-relaxed mb-10">{t.faqIntro}</p></Reveal>
          <Accordion type="single" collapsible className="w-full" data-testid="faq-accordion">
            {faqs.map((f, i) => {
              const q = lang === "ar" ? f[2] : f[0];
              const a = lang === "ar" ? f[3] : f[1];
              return (
                <AccordionItem key={i} value={`item-${i}`} data-testid={`faq-item-${i}`} className="border-lightgray">
                  <AccordionTrigger className="text-start text-navy font-semibold hover:text-teal py-5">
                    <span className="flex gap-3"><span className="font-mono text-cyan text-sm pt-0.5">{String(i + 1).padStart(2, "0")}</span>{q}</span>
                  </AccordionTrigger>
                  <AccordionContent className="text-slate leading-relaxed ps-9 pb-5">{a}</AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        </div>
      </section>
    </Layout>
  );
}
