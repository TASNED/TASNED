import React, { useEffect, useState } from "react";
import api from "../lib/api";
import { toast } from "sonner";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Button } from "../components/ui/button";
import { Save } from "lucide-react";

const SECTIONS = [
  { title: "Site Identity", fields: [
    { k: "site_name", label: "Site Name", type: "text" },
    { k: "tagline_en", label: "Tagline (EN)", type: "text" },
    { k: "tagline_ar", label: "الوسم (AR)", type: "text", dir: "rtl" },
    { k: "logo_url", label: "Logo URL", type: "text" },
  ]},
  { title: "Contact Information", fields: [
    { k: "contact_email", label: "Public Email", type: "email" },
    { k: "contact_phone", label: "Public Phone", type: "text" },
    { k: "contact_address_en", label: "Address (EN)", type: "text" },
    { k: "contact_address_ar", label: "العنوان (AR)", type: "text", dir: "rtl" },
    { k: "commercial_registration", label: "Commercial Registration", type: "text" },
    { k: "linkedin_url", label: "LinkedIn URL", type: "text" },
  ]},
  { title: "Default SEO", fields: [
    { k: "seo_title", label: "Default Meta Title", type: "text" },
    { k: "seo_description", label: "Default Meta Description", type: "textarea" },
    { k: "seo_keywords", label: "Default Keywords (comma-separated)", type: "text" },
    { k: "og_image", label: "Default Open Graph Image URL", type: "text" },
    { k: "canonical_base", label: "Canonical Base URL", type: "text", placeholder: "https://tasned.sa" },
    { k: "robots_default", label: "Default robots meta", type: "text", placeholder: "index, follow" },
  ]},
  { title: "Google & Analytics", fields: [
    { k: "google_verification", label: "Google Search Console Verification Code", type: "text" },
    { k: "ga4_measurement_id", label: "GA4 Measurement ID", type: "text", placeholder: "G-XXXXXXXXXX" },
    { k: "gtm_id", label: "Google Tag Manager ID", type: "text", placeholder: "GTM-XXXXXX" },
  ]},
  { title: "Business Hours", fields: [
    { k: "business_hours_en", label: "Availability (EN)", type: "text" },
    { k: "business_hours_ar", label: "التوفر (AR)", type: "text", dir: "rtl" },
  ]},
];

export default function SettingsManager() {
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get("/settings").then(({ data }) => { setData(data || {}); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const set = (k, v) => setData((p) => ({ ...p, [k]: v }));

  const save = async () => {
    setSaving(true);
    try { await api.put("/admin/settings", data); toast.success("Settings saved. Changes are live."); }
    catch (err) { toast.error(err.response?.data?.detail || "Save failed"); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="p-10">Loading...</div>;

  return (
    <div className="px-8 py-8 max-w-3xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-navy">Site Settings</h1>
          <p className="text-sm text-slate">Global site configuration. Changes apply immediately.</p>
        </div>
        <Button onClick={save} disabled={saving} data-testid="settings-save" className="bg-cyan text-navy hover:bg-navy hover:text-white font-semibold">
          <Save size={15} className="mr-1" /> {saving ? "Saving..." : "Save all"}
        </Button>
      </div>

      {SECTIONS.map((sec) => (
        <div key={sec.title} className="bg-white rounded-xl shadow-soft p-6 mb-6">
          <h2 className="text-lg font-semibold text-navy border-b border-lightgray pb-2 mb-4">{sec.title}</h2>
          <div className="grid gap-4">
            {sec.fields.map((f) => (
              <div key={f.k}>
                <label className="block text-xs font-medium text-navy mb-1">{f.label}</label>
                {f.type === "textarea" ? (
                  <Textarea rows={3} value={data[f.k] || ""} onChange={(e) => set(f.k, e.target.value)} dir={f.dir} data-testid={`s-${f.k}`} />
                ) : (
                  <Input type={f.type} value={data[f.k] || ""} onChange={(e) => set(f.k, e.target.value)}
                    dir={f.dir} placeholder={f.placeholder} data-testid={`s-${f.k}`} />
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
