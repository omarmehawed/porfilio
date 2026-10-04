import type { ContentSection } from "@/lib/types";

export type FieldDef = {
  name: string;
  label: string;
  kind: "text" | "textarea" | "date" | "checkbox" | "select" | "lines" | "url" | "image";
  options?: { value: string; label: string }[];
  placeholder?: string;
};

export const sectionFields: Record<
  ContentSection,
  { title: string; description: string; primary: string; secondary?: string; fields: FieldDef[] }
> = {
  experience: {
    title: "Experience",
    description: "Roles, training, and what you did in each.",
    primary: "role",
    secondary: "organization",
    fields: [
      { name: "role", label: "Role", kind: "text" },
      { name: "organization", label: "Organization", kind: "text" },
      { name: "location", label: "Location", kind: "text" },
      { name: "start_date", label: "Start", kind: "date" },
      { name: "end_date", label: "End", kind: "date" },
      { name: "is_current", label: "Current role", kind: "checkbox" },
      { name: "bullets", label: "Highlights", kind: "lines", placeholder: "One highlight per line" },
      { name: "visible", label: "Visible on the site", kind: "checkbox" },
    ],
  },
  education: {
    title: "Education",
    description: "Degrees and schools.",
    primary: "degree",
    secondary: "institution",
    fields: [
      { name: "degree", label: "Degree", kind: "text" },
      { name: "institution", label: "Institution", kind: "text" },
      { name: "start_date", label: "Start", kind: "date" },
      { name: "end_date", label: "End", kind: "date" },
      { name: "details", label: "Details", kind: "textarea" },
      { name: "visible", label: "Visible on the site", kind: "checkbox" },
    ],
  },
  project: {
    title: "Projects",
    description: "Software and hardware work. Leave GitHub and live URL empty for a client project.",
    primary: "title",
    secondary: "kind",
    fields: [
      { name: "title", label: "Title", kind: "text" },
      { name: "slug", label: "Slug", kind: "text", placeholder: "auto from title if empty" },
      {
        name: "kind",
        label: "Kind",
        kind: "select",
        options: [
          { value: "software", label: "Software" },
          { value: "hardware", label: "Hardware" },
        ],
      },
      { name: "brief", label: "Card brief", kind: "textarea" },
      { name: "description", label: "Detail page", kind: "textarea" },
      { name: "start_date", label: "Start", kind: "date" },
      { name: "end_date", label: "End", kind: "date" },
      { name: "tech", label: "Tech", kind: "lines", placeholder: "One technology per line" },
      { name: "github_repo", label: "GitHub repo", kind: "text", placeholder: "owner/repo" },
      { name: "live_url", label: "Live URL", kind: "url" },
      { name: "cover_url", label: "Cover image", kind: "image" },
      { name: "is_private", label: "Client project", kind: "checkbox" },
      { name: "featured", label: "Featured", kind: "checkbox" },
      { name: "visible", label: "Visible on the site", kind: "checkbox" },
    ],
  },
  skill: {
    title: "Skills",
    description: "Grouped on the public site by category.",
    primary: "name",
    secondary: "category",
    fields: [
      { name: "name", label: "Name", kind: "text" },
      {
        name: "category",
        label: "Category",
        kind: "select",
        options: [
          { value: "technical", label: "IT" },
          { value: "tool", label: "Technology" },
          { value: "soft", label: "Soft skill" },
          { value: "language", label: "Language" },
        ],
      },
      { name: "level", label: "Level (1–5, optional)", kind: "text", placeholder: "Leave empty" },
      { name: "visible", label: "Visible on the site", kind: "checkbox" },
    ],
  },
  certification: {
    title: "Certifications",
    description: "Certificates and short credentials.",
    primary: "title",
    secondary: "issuer",
    fields: [
      { name: "title", label: "Title", kind: "text" },
      { name: "issuer", label: "Issuer", kind: "text" },
      { name: "issued_on", label: "Issued on", kind: "date" },
      { name: "credential_url", label: "Credential URL", kind: "url" },
      { name: "visible", label: "Visible on the site", kind: "checkbox" },
    ],
  },
  course: {
    title: "Courses",
    description: "Courses and their status.",
    primary: "title",
    secondary: "provider",
    fields: [
      { name: "title", label: "Title", kind: "text" },
      { name: "provider", label: "Provider", kind: "text" },
      { name: "start_date", label: "Start", kind: "date" },
      { name: "end_date", label: "End", kind: "date" },
      {
        name: "status",
        label: "Status",
        kind: "select",
        options: [
          { value: "completed", label: "Completed" },
          { value: "in_progress", label: "In progress" },
        ],
      },
      { name: "description", label: "Description", kind: "textarea" },
      { name: "visible", label: "Visible on the site", kind: "checkbox" },
    ],
  },
  achievement: {
    title: "Achievements",
    description: "Competitions and other results.",
    primary: "title",
    secondary: "event",
    fields: [
      { name: "title", label: "Title", kind: "text" },
      { name: "event", label: "Event", kind: "text" },
      { name: "achieved_on", label: "Date", kind: "date" },
      { name: "details", label: "Details", kind: "textarea" },
      { name: "visible", label: "Visible on the site", kind: "checkbox" },
    ],
  },
};

export const adminNav = [
  ["Dashboard", "/admin"],
  ["Profile", "/admin/profile"],
  ["Links and contact", "/admin/socials"],
  ["Experience", "/admin/experience"],
  ["Education", "/admin/education"],
  ["Projects", "/admin/projects"],
  ["Skills", "/admin/skills"],
  ["Certifications", "/admin/certifications"],
  ["Courses", "/admin/courses"],
  ["Achievements", "/admin/achievements"],
  ["CV updates", "/admin/cv"],
] as const;

export const routeSections = {
  experience: "experience",
  education: "education",
  projects: "project",
  skills: "skill",
  certifications: "certification",
  courses: "course",
  achievements: "achievement",
} as const;

export type AdminRoute = keyof typeof routeSections;
