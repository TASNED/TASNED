import React from "react";
import { Link } from "react-router-dom";
import Layout from "../components/site/Layout";
import { Reveal } from "../components/site/Shared";
import { useApp } from "../context/AppContext";

export default function NotFound() {
  const { t } = useApp();
  return (
    <Layout title="Page Not Found" description="The page you are looking for does not exist.">
      <section className="py-32 bg-white min-h-[70vh]">
        <div className="max-w-4xl mx-auto px-6 md:px-12 text-center">
          <Reveal>
            <p className="text-sm uppercase tracking-[0.3em] text-teal">404</p>
            <h1 className="mt-6 text-4xl md:text-5xl font-bold text-navy">Page not found</h1>
            <p className="mt-6 text-lg text-slate leading-relaxed">
              The page you requested was not found. Please use the navigation or return to the homepage.
            </p>
            <Link to="/" className="mt-10 inline-flex items-center justify-center rounded-full bg-cyan px-8 py-4 font-semibold text-navy hover:bg-navy hover:text-white transition-colors">
              Return Home
            </Link>
          </Reveal>
        </div>
      </section>
    </Layout>
  );
}
