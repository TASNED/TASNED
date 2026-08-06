import React, { useRef, useState } from "react";
import Layout from "../components/site/Layout";
import { Reveal, PageHero } from "../components/site/Shared";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Button } from "../components/ui/button";
import { useApp } from "../context/AppContext";
import { IMAGES } from "../content";
import api from "../lib/api";
import { toast } from "sonner";
import { Upload, FileCheck2, User, Briefcase, PenLine, ArrowRight } from "lucide-react";

const empty = {
  full_name: "", mobile: "", email: "", city: "", nationality: "",
  current_job: "", experience: "", sector: "", qualification: "", bio: "",
};

const ALLOWED = [".pdf", ".doc", ".docx"];

export default function Careers() {
  const { t } = useApp();
  const c = t.careers;
  const f = c.form;
  const [form, setForm] = useState(empty);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const fileRef = useRef(null);
  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  const onFile = (e) => {
    const fl = e.target.files && e.target.files[0];
    if (!fl) return;
    const ext = "." + fl.name.split(".").pop().toLowerCase();
    if (!ALLOWED.includes(ext)) { toast.error(f.invalidType); return; }
    if (fl.size > 10 * 1024 * 1024) { toast.error(f.tooLarge); return; }
    setFile(fl);
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!file) return toast.error(f.cvRequired);
    setLoading(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      fd.append("cv", file);
      await api.post("/careers", fd, { headers: { "Content-Type": "multipart/form-data" } });
      toast.success(f.success);
      setForm(empty); setFile(null);
      if (fileRef.current) fileRef.current.value = "";
    } catch (err) {
      const d = err.response?.data?.detail;
      toast.error(typeof d === "string" ? d : f.error);
    } finally { setLoading(false); }
  };

  const field = (k, opts = {}) => (
    <div>
      <label className="block text-xs font-medium text-navy mb-1.5">
        {f[k]} {opts.required && <span className="text-cyan">*</span>}
      </label>
      <Input type={opts.type || "text"} value={form[k]} onChange={set(k)}
        required={opts.required} data-testid={`career-${k}`}
        className="bg-white border-lightgray focus-visible:ring-cyan" />
    </div>
  );

  const SectionHeader = ({ icon: Icon, title, num }) => (
    <div className="flex items-center gap-3 mt-10 mb-5">
      <span className="font-mono text-cyan text-sm">0{num}</span>
      <Icon size={20} className="text-teal" />
      <h2 className="text-xl font-semibold text-navy">{title}</h2>
      <span className="flex-1 h-px bg-lightgray" />
    </div>
  );

  return (
    <Layout title={c.label} description={c.intro}>
      <PageHero eyebrow={c.label} title={c.title} image={IMAGES.portSunset} crumbs={[t.nav.home, c.label]} />
      <section className="py-24 bg-white">
        <div className="max-w-4xl mx-auto px-6 md:px-12">
          <Reveal>
            <p className="text-lg text-slate leading-relaxed mb-6">{c.intro}</p>
          </Reveal>

          <form onSubmit={submit} data-testid="careers-form" className="mt-8">
            <SectionHeader icon={User} title={c.sections.personal} num={1} />
            <div className="grid sm:grid-cols-2 gap-5">
              {field("full_name", { required: true })}
              {field("mobile", { required: true, type: "tel" })}
              {field("email", { required: true, type: "email" })}
              {field("city", { required: true })}
              <div className="sm:col-span-2">{field("nationality")}</div>
            </div>

            <SectionHeader icon={Briefcase} title={c.sections.professional} num={2} />
            <div className="grid sm:grid-cols-2 gap-5">
              {field("current_job")}
              {field("experience", { required: true, type: "number" })}
              {field("sector")}
              {field("qualification")}
            </div>

            <SectionHeader icon={PenLine} title={c.sections.bioSection} num={3} />
            <div>
              <label className="block text-xs font-medium text-navy mb-1.5">{f.bio}</label>
              <Textarea rows={6} value={form.bio} onChange={set("bio")}
                placeholder={f.bioPlaceholder} data-testid="career-bio"
                className="bg-white border-lightgray focus-visible:ring-cyan" />
            </div>

            <SectionHeader icon={Upload} title={c.sections.uploadSection} num={4} />
            <label className={`flex items-center justify-between gap-4 rounded-xl border-2 border-dashed p-6 cursor-pointer transition-colors ${file ? "border-teal bg-teal/5" : "border-lightgray hover:border-cyan bg-lightgray/30"}`}>
              <div className="flex items-center gap-4 min-w-0">
                {file ? <FileCheck2 className="text-teal shrink-0" size={28} /> : <Upload className="text-slate shrink-0" size={28} />}
                <div className="min-w-0">
                  <p className="font-semibold text-navy truncate">{f.cv} <span className="text-cyan">*</span></p>
                  <p className="text-xs text-slate mt-0.5">{file ? `${file.name} · ${(file.size / 1024).toFixed(0)} KB` : f.cvHint}</p>
                </div>
              </div>
              <span className="text-xs font-mono px-4 py-2 rounded-full border border-navy/15 text-navy hover:bg-navy hover:text-white transition-colors whitespace-nowrap">
                {file ? f.chooseFile : f.chooseFile}
              </span>
              <input ref={fileRef} type="file" accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                onChange={onFile} data-testid="career-cv" className="hidden" />
            </label>

            <div className="mt-10">
              <Button type="submit" disabled={loading} data-testid="careers-submit"
                className="w-full sm:w-auto rounded-full bg-cyan text-navy hover:bg-navy hover:text-white font-semibold px-8 py-6 text-base">
                {loading ? f.sending : f.submit} <ArrowRight size={18} className="ms-2" />
              </Button>
            </div>
          </form>
        </div>
      </section>
    </Layout>
  );
}
