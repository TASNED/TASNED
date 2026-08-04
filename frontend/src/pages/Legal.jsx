import React from "react";
import Layout from "../components/site/Layout";
import { PageHero } from "../components/site/Shared";
import { useApp } from "../context/AppContext";
import { IMAGES } from "../content";

export default function Legal({ kind }) {
  const { t } = useApp();
  const title = kind === "terms" ? t.footer.terms : t.footer.privacy;
  return (
    <Layout title={title}>
      <PageHero eyebrow={t.footer.legal} title={title} image={IMAGES.oceanSurface} crumbs={[t.nav.home, title]} />
      <section className="py-24 bg-white">
        <div className="max-w-3xl mx-auto px-6 md:px-12 text-slate leading-relaxed space-y-6">
          <p>{t.footer.disclaimer}</p>
          <p>
            {kind === "terms"
              ? "By using this website you agree to use the information provided for lawful purposes related to ballast water testing enquiries. TASNED INTEGRATED provides inspection, sampling and laboratory analysis services only."
              : "We respect your privacy. Information submitted through our contact form is used solely to respond to inspection and testing enquiries and is handled with professional confidentiality."}
          </p>
          <p>For any questions regarding this policy, contact us at info@tasned.sa.</p>
        </div>
      </section>
    </Layout>
  );
}
