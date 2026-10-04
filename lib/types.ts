export const platforms = [
  "facebook",
  "instagram",
  "tiktok",
  "linkedin",
  "github",
  "whatsapp",
  "phone",
  "email",
  "other",
] as const;

export type Platform = (typeof platforms)[number];

export type Profile = {
  id: string;
  full_name: string;
  title: string;
  summary: string | null;
  location: string | null;
  photo_url: string | null;
  cover_url: string | null;
  cv_public_url: string | null;
  updated_at: string | null;
};

export type SocialLink = {
  id: string;
  platform: Platform;
  label: string | null;
  value: string;
  sort_order: number;
  visible: boolean;
};

export type Experience = {
  id: string;
  role: string;
  organization: string;
  location: string | null;
  start_date: string | null;
  end_date: string | null;
  is_current: boolean;
  bullets: string[];
  sort_order: number;
  visible: boolean;
};

export type Education = {
  id: string;
  degree: string;
  institution: string;
  start_date: string | null;
  end_date: string | null;
  details: string | null;
  sort_order: number;
  visible: boolean;
};

export type Project = {
  id: string;
  slug: string;
  title: string;
  kind: "software" | "hardware";
  brief: string | null;
  description: string | null;
  start_date: string | null;
  end_date: string | null;
  tech: string[];
  github_repo: string | null;
  live_url: string | null;
  cover_url: string | null;
  is_private: boolean;
  featured: boolean;
  sort_order: number;
  visible: boolean;
};

export type Skill = {
  id: string;
  name: string;
  category: "technical" | "soft" | "language" | "tool";
  level: number | null;
  sort_order: number;
  visible: boolean;
};

export type Certification = {
  id: string;
  title: string;
  issuer: string | null;
  issued_on: string | null;
  credential_url: string | null;
  sort_order: number;
  visible: boolean;
};

export type Course = {
  id: string;
  title: string;
  provider: string | null;
  start_date: string | null;
  end_date: string | null;
  status: "completed" | "in_progress";
  description: string | null;
  sort_order: number;
  visible: boolean;
};

export type Achievement = {
  id: string;
  title: string;
  event: string | null;
  achieved_on: string | null;
  details: string | null;
  sort_order: number;
  visible: boolean;
};

export type Portfolio = {
  profile: Profile;
  socialLinks: SocialLink[];
  experiences: Experience[];
  education: Education[];
  projects: Project[];
  skills: Skill[];
  certifications: Certification[];
  courses: Course[];
  achievements: Achievement[];
};

export type ContentSection =
  | "experience"
  | "education"
  | "project"
  | "skill"
  | "certification"
  | "course"
  | "achievement";
