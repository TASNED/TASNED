// Content-type configuration for the generic CMS manager
export const CMS_TYPES = {
  service: {
    label: "Services", singular: "Service",
    fields: [
      { key: "title_en", label: "Title (EN)", type: "text", required: true },
      { key: "title_ar", label: "العنوان (AR)", type: "text", dir: "rtl" },
      { key: "description_en", label: "Description (EN)", type: "textarea" },
      { key: "description_ar", label: "الوصف (AR)", type: "textarea", dir: "rtl" },
      { key: "icon", label: "Icon Name (lucide-react)", type: "text", placeholder: "Droplets" },
    ],
    list: [{ key: "title_en", label: "Title" }, { key: "icon", label: "Icon" }],
  },
  team_member: {
    label: "Team", singular: "Team Member",
    fields: [
      { key: "name_en", label: "Name (EN)", type: "text", required: true },
      { key: "name_ar", label: "الاسم (AR)", type: "text", dir: "rtl" },
      { key: "role_en", label: "Role / Title (EN)", type: "text" },
      { key: "role_ar", label: "المسمى (AR)", type: "text", dir: "rtl" },
      { key: "bio_en", label: "Bio (EN)", type: "textarea" },
      { key: "bio_ar", label: "نبذة (AR)", type: "textarea", dir: "rtl" },
      { key: "photo", label: "Photo URL", type: "media" },
      { key: "linkedin", label: "LinkedIn URL", type: "text" },
    ],
    list: [{ key: "name_en", label: "Name" }, { key: "role_en", label: "Role" }],
  },
  client: {
    label: "Clients", singular: "Client",
    fields: [
      { key: "name", label: "Client Name", type: "text", required: true },
      { key: "logo", label: "Logo", type: "media" },
      { key: "website", label: "Website URL", type: "text" },
    ],
    list: [{ key: "name", label: "Name" }],
  },
  testimonial: {
    label: "Testimonials", singular: "Testimonial",
    fields: [
      { key: "author_en", label: "Author (EN)", type: "text", required: true },
      { key: "author_ar", label: "الاسم (AR)", type: "text", dir: "rtl" },
      { key: "company", label: "Company", type: "text" },
      { key: "quote_en", label: "Quote (EN)", type: "textarea" },
      { key: "quote_ar", label: "الاقتباس (AR)", type: "textarea", dir: "rtl" },
      { key: "photo", label: "Author Photo", type: "media" },
    ],
    list: [{ key: "author_en", label: "Author" }, { key: "company", label: "Company" }],
  },
  faq: {
    label: "FAQs", singular: "FAQ",
    fields: [
      { key: "question_en", label: "Question (EN)", type: "text", required: true },
      { key: "answer_en", label: "Answer (EN)", type: "textarea" },
      { key: "question_ar", label: "السؤال (AR)", type: "text", dir: "rtl" },
      { key: "answer_ar", label: "الإجابة (AR)", type: "textarea", dir: "rtl" },
    ],
    list: [{ key: "question_en", label: "Question" }],
  },
  homepage_section: {
    label: "Homepage Sections", singular: "Homepage Section",
    fields: [
      { key: "key", label: "Section Key", type: "text", required: true, placeholder: "hero, who, cta_band..." },
      { key: "title_en", label: "Title (EN)", type: "text" },
      { key: "title_ar", label: "العنوان (AR)", type: "text", dir: "rtl" },
      { key: "body_en", label: "Body (EN)", type: "textarea" },
      { key: "body_ar", label: "المحتوى (AR)", type: "textarea", dir: "rtl" },
      { key: "image", label: "Image", type: "media" },
      { key: "cta_label", label: "CTA Label", type: "text" },
      { key: "cta_href", label: "CTA Link", type: "text" },
    ],
    list: [{ key: "key", label: "Section" }, { key: "title_en", label: "Title" }],
  },
};

export const STATUS_OPTIONS = [
  { value: "draft", label: "Draft" },
  { value: "published", label: "Published" },
  { value: "scheduled", label: "Scheduled" },
];
