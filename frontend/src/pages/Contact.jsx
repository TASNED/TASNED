import React, { useState } from "react";
import Layout from "../components/site/Layout";
import { Reveal, PageHero } from "../components/site/Shared";
import { useApp } from "../context/AppContext";
import { IMAGES } from "../content";
import api from "../lib/api";
import { toast } from "sonner";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Button } from "../components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { MapPin, Mail, Globe, Clock, ArrowRight } from "lucide-react";

const empty = { name: "", company: "", email: "", phone: "", vessel_name: "", imo_number: "", port: "", requested_service: "", preferred_date: "", message: "" };

export default function Contact() {
  const { t } = useApp();
  const f = t.contact.form;
  const [form, setForm] = useState(empty);
  const [loading, setLoading] = useState(false);
  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/contact", form);
      toast.success(t.contact.success);
      setForm(empty);
    } catch {
      toast.error(t.contact.error);
    } finally { setLoading(false); }
  };

  const field = (k, type = "text") => (
    <div>
      <label className="block text-xs font-medium text-navy mb-1.5">{f[k]}</label>
      <Input type={type} value={form[k]} onChange={set(k)} data-testid={`contact-${k}`} className="bg-white border-lightgray focus-visible:ring-cyan" />
    </div>
  );

  return (
    <Layout title={t.contact.label} description={t.contact.intro}>
      <PageHero eyebrow={t.contact.label} title={t.contact.title} image={IMAGES.portSunset} crumbs={[t.nav.home, t.contact.label]} />
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6 md:px-12 grid lg:grid-cols-[1.4fr_1fr] gap-14">
          <Reveal>
            <p className="text-lg text-slate leading-relaxed mb-8">{t.contact.intro}</p>
            <form onSubmit={submit} data-testid="contact-form" className="grid sm:grid-cols-2 gap-5">
              {field("name")}{field("company")}
              {field("email", "email")}{field("phone", "tel")}
              {field("vessel_name")}{field("imo_number")}
              {field("port")}
              <div>
                <label className="block text-xs font-medium text-navy mb-1.5">{f.requested_service}</label>
                <Select value={form.requested_service} onValueChange={(v) => setForm((p) => ({ ...p, requested_service: v }))}>
                  <SelectTrigger data-testid="contact-service" className="bg-white border-lightgray"><SelectValue placeholder={f.selectService} /></SelectTrigger>
                  <SelectContent>
                    {t.services.map((s, i) => <SelectItem key={i} value={s.t}>{s.t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              {field("preferred_date", "date")}
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-navy mb-1.5">{f.message}</label>
                <Textarea rows={5} value={form.message} onChange={set("message")} data-testid="contact-message" className="bg-white border-lightgray focus-visible:ring-cyan" />
              </div>
              <div className="sm:col-span-2">
                <Button type="submit" disabled={loading} data-testid="contact-submit"
                  className="w-full sm:w-auto rounded-full bg-cyan text-navy hover:bg-navy hover:text-white font-semibold px-8 py-6 text-base">
                  {loading ? t.cta.sending : t.cta.send} <ArrowRight size={18} className="ms-2" />
                </Button>
              </div>
            </form>
          </Reveal>

          <Reveal delay={0.1}>
            <div className="rounded-2xl bg-navy text-white p-8 shadow-lift">
              <h3 className="text-xl font-semibold">{t.contact.info.title}</h3>
              <ul className="mt-6 space-y-5 text-sm">
                <li className="flex gap-3"><MapPin className="text-cyan shrink-0" size={20} /><div><p className="text-white/50 text-xs uppercase tracking-wide">{t.contact.info.addressTitle}</p><p>{t.contact.info.address}</p></div></li>
                <li className="flex gap-3"><Mail className="text-cyan shrink-0" size={20} /><div><p className="text-white/50 text-xs uppercase tracking-wide">{t.contact.info.emailTitle}</p><p>info@tasned.sa</p></div></li>
                <li className="flex gap-3"><Globe className="text-cyan shrink-0" size={20} /><div><p className="text-white/50 text-xs uppercase tracking-wide">{t.contact.info.webTitle}</p><p>www.tasned.sa</p></div></li>
                <li className="flex gap-3"><Clock className="text-cyan shrink-0" size={20} /><div><p className="text-white/50 text-xs uppercase tracking-wide">{t.contact.info.hoursTitle}</p><p>{t.contact.info.hours}</p></div></li>
              </ul>
            </div>
            <div className="mt-6 rounded-2xl overflow-hidden shadow-soft border border-lightgray">
              <p className="px-5 py-3 text-xs font-medium text-navy bg-lightgray/40">{t.contact.info.mapTitle}</p>
              <iframe title="map" data-testid="contact-map" className="w-full h-64 grayscale-[0.2]"
                src="https://www.google.com/maps?q=Yanbu,Saudi Arabia&output=embed" loading="lazy" />
            </div>
          </Reveal>
        </div>
      </section>
    </Layout>
  );
}
