import { writeFileSync } from "node:fs";
import { emptyContactSeed, seedPortfolio } from "../lib/content/seed.ts";

const data = seedPortfolio();

function text(value: string | null) {
  if (value === null) return "null";
  return `'${value.replaceAll("'", "''")}'`;
}

function date(value: string | null) {
  return value ? `'${value}'` : "null";
}

function bool(value: boolean) {
  return value ? "true" : "false";
}

function textArray(values: string[]) {
  if (values.length === 0) return "'{}'::text[]";
  return `array[${values.map((value) => text(value)).join(", ")}]::text[]`;
}

const schema = `-- Phase 1 portfolio schema. Contact fields and social_links are intentionally empty.
-- cv_uploads and cv_proposals exist for Phase 2 and are unused here.

create extension if not exists pgcrypto;

create table profile (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  title text not null,
  summary text,
  location text,
  email text,
  phone text,
  show_phone boolean default false,
  photo_url text,
  cv_public_url text,
  updated_at timestamptz default now()
);

create table social_links (
  id uuid primary key default gen_random_uuid(),
  platform text not null check (platform in ('facebook', 'instagram', 'tiktok', 'linkedin', 'github', 'whatsapp', 'phone', 'email', 'other')),
  label text,
  value text not null,
  sort_order int default 0,
  visible boolean default true,
  constraint social_links_other_label check (platform <> 'other' or (label is not null and char_length(btrim(label)) > 0))
);

create table experiences (
  id uuid primary key default gen_random_uuid(),
  role text not null,
  organization text not null,
  location text,
  start_date date,
  end_date date,
  is_current boolean default false,
  bullets text[] default '{}',
  sort_order int default 0,
  visible boolean default true
);

create table education (
  id uuid primary key default gen_random_uuid(),
  degree text not null,
  institution text not null,
  start_date date,
  end_date date,
  details text,
  sort_order int default 0,
  visible boolean default true
);

create table projects (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  kind text default 'software' check (kind in ('software', 'hardware')),
  brief text,
  description text,
  start_date date,
  end_date date,
  tech text[] default '{}',
  github_repo text,
  live_url text,
  cover_url text,
  is_private boolean default false,
  featured boolean default false,
  sort_order int default 0,
  visible boolean default true
);

create table skills (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text check (category in ('technical', 'soft', 'language', 'tool')),
  level int check (level is null or level between 1 and 5),
  sort_order int default 0,
  visible boolean default true
);

create table certifications (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  issuer text,
  issued_on date,
  credential_url text,
  sort_order int default 0,
  visible boolean default true
);

create table courses (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  provider text,
  start_date date,
  end_date date,
  status text default 'completed' check (status in ('completed', 'in_progress')),
  description text,
  sort_order int default 0,
  visible boolean default true
);

create table achievements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  event text,
  achieved_on date,
  details text,
  sort_order int default 0,
  visible boolean default true
);

create table cv_uploads (
  id uuid primary key default gen_random_uuid(),
  file_path text not null,
  status text default 'pending' check (status in ('pending', 'parsed', 'reviewed', 'applied', 'failed')),
  parsed_json jsonb,
  created_at timestamptz default now()
);

create table cv_proposals (
  id uuid primary key default gen_random_uuid(),
  upload_id uuid references cv_uploads(id) on delete cascade,
  entity text not null,
  action text not null check (action in ('add', 'update')),
  target_id uuid,
  payload jsonb not null,
  diff jsonb,
  decision text default 'pending' check (decision in ('pending', 'approved', 'rejected'))
);

create table login_attempts (
  id bigserial primary key,
  ip text,
  success boolean,
  created_at timestamptz default now()
);

create index login_attempts_ip_created_idx on login_attempts (ip, created_at desc);

alter table profile enable row level security;
alter table social_links enable row level security;
alter table experiences enable row level security;
alter table education enable row level security;
alter table projects enable row level security;
alter table skills enable row level security;
alter table certifications enable row level security;
alter table courses enable row level security;
alter table achievements enable row level security;
alter table cv_uploads enable row level security;
alter table cv_proposals enable row level security;
alter table login_attempts enable row level security;

create policy "public read profile" on profile for select to anon using (true);
create policy "public read visible social links" on social_links for select to anon using (visible = true);
create policy "public read visible experiences" on experiences for select to anon using (visible = true);
create policy "public read visible education" on education for select to anon using (visible = true);
create policy "public read visible projects" on projects for select to anon using (visible = true);
create policy "public read visible skills" on skills for select to anon using (visible = true);
create policy "public read visible certifications" on certifications for select to anon using (visible = true);
create policy "public read visible courses" on courses for select to anon using (visible = true);
create policy "public read visible achievements" on achievements for select to anon using (visible = true);

revoke all on profile, social_links, experiences, education, projects, skills, certifications, courses, achievements, cv_uploads, cv_proposals, login_attempts from anon, authenticated;
grant select (id, full_name, title, summary, location, photo_url, cv_public_url, updated_at) on profile to anon;
grant select on social_links, experiences, education, projects, skills, certifications, courses, achievements to anon;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('media', 'media', true, 10485760, array['image/jpeg', 'image/png', 'image/webp', 'application/pdf']),
  ('cv-private', 'cv-private', false, 10485760, array['application/pdf'])
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "public read media" on storage.objects;
create policy "public read media" on storage.objects for select to anon using (bucket_id = 'media');
`;

const profile = data.profile;
const inserts = `
insert into profile (id, full_name, title, summary, location, email, phone, show_phone, photo_url, cv_public_url)
values (
  '${profile.id}',
  ${text(profile.full_name)},
  ${text(profile.title)},
  ${text(profile.summary)},
  ${text(profile.location)},
  ${text(emptyContactSeed.email)},
  ${text(emptyContactSeed.phone)},
  ${bool(emptyContactSeed.show_phone)},
  null,
  null
);

insert into experiences (id, role, organization, location, start_date, end_date, is_current, bullets, sort_order, visible)
values
${data.experiences
  .map(
    (row) => `  ('${row.id}', ${text(row.role)}, ${text(row.organization)}, ${text(row.location)}, ${date(row.start_date)}, ${date(row.end_date)}, ${bool(row.is_current)}, ${textArray(row.bullets)}, ${row.sort_order}, ${bool(row.visible)})`,
  )
  .join(",\n")};

insert into education (id, degree, institution, start_date, end_date, details, sort_order, visible)
values
${data.education
  .map(
    (row) => `  ('${row.id}', ${text(row.degree)}, ${text(row.institution)}, ${date(row.start_date)}, ${date(row.end_date)}, ${text(row.details)}, ${row.sort_order}, ${bool(row.visible)})`,
  )
  .join(",\n")};

insert into projects (id, slug, title, kind, brief, description, start_date, end_date, tech, github_repo, live_url, cover_url, is_private, featured, sort_order, visible)
values
${data.projects
  .map(
    (row) => `  ('${row.id}', ${text(row.slug)}, ${text(row.title)}, ${text(row.kind)}, ${text(row.brief)}, ${text(row.description)}, ${date(row.start_date)}, ${date(row.end_date)}, ${textArray(row.tech)}, null, null, null, ${bool(row.is_private)}, ${bool(row.featured)}, ${row.sort_order}, ${bool(row.visible)})`,
  )
  .join(",\n")};

insert into skills (id, name, category, level, sort_order, visible)
values
${data.skills
  .map(
    (row) => `  ('${row.id}', ${text(row.name)}, ${text(row.category)}, null, ${row.sort_order}, ${bool(row.visible)})`,
  )
  .join(",\n")};

insert into certifications (id, title, issuer, issued_on, credential_url, sort_order, visible)
values
${data.certifications
  .map(
    (row) => `  ('${row.id}', ${text(row.title)}, ${text(row.issuer)}, null, null, ${row.sort_order}, ${bool(row.visible)})`,
  )
  .join(",\n")};

insert into courses (id, title, provider, start_date, end_date, status, description, sort_order, visible)
values
${data.courses
  .map(
    (row) => `  ('${row.id}', ${text(row.title)}, ${text(row.provider)}, ${date(row.start_date)}, ${date(row.end_date)}, ${text(row.status)}, ${text(row.description)}, ${row.sort_order}, ${bool(row.visible)})`,
  )
  .join(",\n")};

insert into achievements (id, title, event, achieved_on, details, sort_order, visible)
values
${data.achievements
  .map(
    (row) => `  ('${row.id}', ${text(row.title)}, ${text(row.event)}, ${date(row.achieved_on)}, ${text(row.details)}, ${row.sort_order}, ${bool(row.visible)})`,
  )
  .join(",\n")};
`;

writeFileSync(new URL("../supabase/migrations/0001_init.sql", import.meta.url), `${schema}\n${inserts}`);
console.log("wrote supabase/migrations/0001_init.sql");
