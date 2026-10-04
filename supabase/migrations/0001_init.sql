-- Phase 1 portfolio schema. Contact fields and social_links are intentionally empty.
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


insert into profile (id, full_name, title, summary, location, email, phone, show_phone, photo_url, cv_public_url)
values (
  'a0000000-0000-4000-8000-000000000001',
  'Omar Mehawed',
  'IT Developer',
  'Detail-oriented IT student at Borg Al-Arab Technological University (2024–2028), with a versatile background in full-stack development, system administration, and technical instruction. Skilled in PHP, React, and cloud technologies; builds scalable solutions, manages complex systems, and communicates clearly with diverse teams. Founder of The Knower OS, a freelance software agency, and OppStore, a clothing brand.',
  'Sidi-Beshr, Alexandria, Egypt',
  null,
  null,
  false,
  null,
  null
);

insert into experiences (id, role, organization, location, start_date, end_date, is_current, bullets, sort_order, visible)
values
  ('10000000-0000-4000-8000-000000000001', 'Public Relations Team Leader', 'IT Club', 'Alexandria, Egypt', '2025-08-01', null, true, array['Led the public relations team', 'Coordinated the club and external organizations', 'Managed partnerships and promoted activities', 'Grew student and tech-community engagement']::text[], 0, true),
  ('10000000-0000-4000-8000-000000000002', 'Instructor IOT', 'Children Technological University (CTU)', 'Alexandria, Egypt', '2025-07-01', '2026-08-01', false, array['Presented educational content interactively', 'Guided hands-on activities', 'Built students'' confidence']::text[], 1, true),
  ('10000000-0000-4000-8000-000000000003', 'Intern, Full Stack Web Development (PHP Laravel)', 'Information Technology Institute (ITI)', 'Alexandria, Egypt', '2025-07-01', '2025-10-01', false, array['Refactored legacy PHP', 'Built RESTful APIs with Laravel', 'Worked on secure database design', 'Deployed scalable apps with senior engineers', 'Built UI with Vue.js and Tailwind']::text[], 2, true),
  ('10000000-0000-4000-8000-000000000004', 'Training, Linux Red Hat Administration (120 hr)', 'National Telecommunications Institute (NTI)', 'Alexandria, Egypt', '2025-07-01', '2025-08-01', false, array['Storage: partitions and LVM', 'File systems, ACLs, and SELinux', 'Firewall, containers, and RHEL server setup', 'User accounts and access control']::text[], 3, true);

insert into education (id, degree, institution, start_date, end_date, details, sort_order, visible)
values
  ('20000000-0000-4000-8000-000000000001', 'Bachelor of Information Technology (Network & Software Development)', 'Borg Al-Arab Technological University (BATU)', '2024-09-01', '2028-01-01', 'Current student.', 0, true);

insert into projects (id, slug, title, kind, brief, description, start_date, end_date, tech, github_repo, live_url, cover_url, is_private, featured, sort_order, visible)
values
  ('30000000-0000-4000-8000-000000000001', 'wali-el-ahd-hospital-management-system', 'Wali El-Ahd Hospital Management System', 'software', 'Full system for an exclusive OB/GYN maternity hospital, with an API-first Laravel backend and a React web client.', 'Full system for an exclusive OB/GYN maternity hospital. API-first Laravel backend, React web client, with future mobile and desktop clients. Online booking with queue numbers, pregnancy and delivery records, newborn and NICU files, lab, radiology, pharmacy and supplies inventory, itemized inpatient billing with e-invoices, and WhatsApp result delivery. Google login and Telegram integration are planned.', '2026-09-01', '2026-10-01', array['Laravel', 'React']::text[], null, null, null, true, true, 0, true),
  ('30000000-0000-4000-8000-000000000002', 'the-knower-system', 'The Knower System', 'software', 'Flagship management platform of The Knower OS agency, built with Laravel and React, including a Sales and Digital Marketing module.', 'Flagship management platform of The Knower OS agency. Laravel and React, deployed on Render with MySQL on Aiven, and a custom domain. Includes a Sales and Digital Marketing module.', '2026-07-01', '2026-09-01', array['Laravel', 'React', 'MySQL']::text[], null, null, null, false, true, 1, true),
  ('30000000-0000-4000-8000-000000000003', 'teaching-management-system', 'Teaching Management System', 'software', 'Platform for teachers to publish documents and videos in a copy-protected environment, with subscriptions and financial tracking.', 'Platform for teachers to publish documents and videos in a copy-protected environment, with student subscriptions, WhatsApp notifications, and financial tracking.', '2026-08-01', '2026-09-01', '{}'::text[], null, null, null, true, false, 2, true),
  ('30000000-0000-4000-8000-000000000004', 'katalog', 'Katalog', 'software', 'Mobile app and digital legacy platform for continuous content delivery beyond a person''s lifetime.', 'Digital legacy platform for continuous content delivery beyond a person''s lifetime. Built as a mobile app.', '2025-12-01', '2026-09-01', '{}'::text[], null, null, null, false, false, 3, true),
  ('30000000-0000-4000-8000-000000000005', 'pharmacy-management-system', 'Pharmacy Management System', 'software', 'Multi-branch pharmacy platform with a call-center flow for phone orders and a React mobile app.', 'Multi-branch pharmacy platform with a call-center flow for phone orders and a React mobile app.', '2026-05-01', '2026-08-01', array['React']::text[], null, null, null, true, false, 4, true),
  ('30000000-0000-4000-8000-000000000006', 'smart-robotic-hand', 'Smart robotic hand', 'hardware', 'Second-year graduation project: a wearable prototype with embedded control, motion, sensors, and wireless feedback.', 'Second-year graduation project (Sep 2025–Jun 2026). Wearable prototype with embedded control, motion actuation, sensor integration, and wireless connectivity, with responsive movement and real-time feedback.', '2025-09-01', '2026-06-01', array['Embedded systems']::text[], null, null, null, false, true, 5, true),
  ('30000000-0000-4000-8000-000000000007', 'law-firm-management-system', 'Law Firm Management System', 'software', 'Multi-platform system for law offices and clients, with a Laravel API, React clients, and a role and permission matrix.', 'Multi-platform system for law offices and clients: Laravel API, React web, React mobile, and desktop apps, with a full ERD, a role and permission matrix, and a phased roadmap.', '2026-05-01', '2026-06-01', array['Laravel', 'React']::text[], null, null, null, true, false, 6, true),
  ('30000000-0000-4000-8000-000000000008', 'infinity-crew', 'Infinity Crew', 'software', 'Training platform for ICPC-style competitive programming preparation.', 'ICPC and technical training platform for competitive programming preparation.', '2026-05-01', '2026-06-01', '{}'::text[], null, null, null, false, false, 7, true),
  ('30000000-0000-4000-8000-000000000009', 'restaurant-cafe-ordering-system', 'Restaurant / Café Ordering System', 'software', 'QR-based, multi-tenant ordering with realtime updates via Laravel Reverb, across multiple platforms.', 'QR-based ordering, multi-tenant, with realtime updates via Laravel Reverb, built as a multi-platform system.', '2026-02-01', '2026-04-01', array['Laravel', 'Laravel Reverb']::text[], null, null, null, true, false, 8, true),
  ('30000000-0000-4000-8000-000000000010', 'lms-school-management-system', 'LMS School Management System', 'software', 'School management and learning platform with more than 30 database tables and four user roles.', 'School management and learning platform, with more than 30 database tables and four user roles.', '2026-01-01', '2026-02-01', '{}'::text[], null, null, null, true, false, 9, true),
  ('30000000-0000-4000-8000-000000000011', 'batu-project-management-system', 'BATU Project Management System', 'software', 'Graduation-project management platform for students, supervisors, and admins.', 'Graduation-project management platform for students, supervisors, and admins at BATU.', '2025-12-01', '2026-01-01', '{}'::text[], null, null, null, true, false, 10, true),
  ('30000000-0000-4000-8000-000000000012', 'medical-robot', 'Medical robot', 'hardware', 'First-year graduation project for preliminary diagnosis of infectious diseases, using temperature and heart-rate sensors.', 'First-year graduation project. Preliminary diagnosis for infectious diseases, reducing doctor contact. Temperature and heart-rate sensors with remote data transmission. Skills used: Arduino, medical sensors, mechanical design, and teamwork.', null, null, array['Arduino']::text[], null, null, null, false, false, 11, true);

insert into skills (id, name, category, level, sort_order, visible)
values
  ('40000000-0000-4000-8000-000000000001', 'Problem solving and critical thinking', 'soft', null, 0, true),
  ('40000000-0000-4000-8000-000000000002', 'Team collaboration', 'soft', null, 1, true),
  ('40000000-0000-4000-8000-000000000003', 'Communication and presentation', 'soft', null, 2, true),
  ('40000000-0000-4000-8000-000000000004', 'Time management', 'soft', null, 3, true),
  ('40000000-0000-4000-8000-000000000005', 'Authentication & Authorization', 'technical', null, 4, true),
  ('40000000-0000-4000-8000-000000000006', 'Role-Based Access Control', 'technical', null, 5, true),
  ('40000000-0000-4000-8000-000000000007', 'PHP Laravel', 'technical', null, 6, true),
  ('40000000-0000-4000-8000-000000000008', 'Database Design', 'technical', null, 7, true),
  ('40000000-0000-4000-8000-000000000009', 'Cloudflare', 'tool', null, 8, true),
  ('40000000-0000-4000-8000-000000000010', 'Supabase', 'tool', null, 9, true),
  ('40000000-0000-4000-8000-000000000011', 'PostgreSQL', 'tool', null, 10, true),
  ('40000000-0000-4000-8000-000000000012', 'AWS', 'tool', null, 11, true),
  ('40000000-0000-4000-8000-000000000013', 'Git', 'tool', null, 12, true),
  ('40000000-0000-4000-8000-000000000014', 'Docker', 'tool', null, 13, true),
  ('40000000-0000-4000-8000-000000000015', 'TypeScript', 'tool', null, 14, true),
  ('40000000-0000-4000-8000-000000000016', 'React.js', 'tool', null, 15, true),
  ('40000000-0000-4000-8000-000000000017', 'Python (AI)', 'tool', null, 16, true),
  ('40000000-0000-4000-8000-000000000018', 'Web Development (HTML/CSS/JS)', 'tool', null, 17, true),
  ('40000000-0000-4000-8000-000000000019', 'React Native', 'tool', null, 18, true),
  ('40000000-0000-4000-8000-000000000020', 'Linux (Ubuntu, Red Hat)', 'tool', null, 19, true),
  ('40000000-0000-4000-8000-000000000021', 'Networking concepts', 'tool', null, 20, true),
  ('40000000-0000-4000-8000-000000000022', 'Embedded systems', 'tool', null, 21, true),
  ('40000000-0000-4000-8000-000000000023', 'Arabic', 'language', null, 22, true),
  ('40000000-0000-4000-8000-000000000024', 'English', 'language', null, 23, true);

insert into certifications (id, title, issuer, issued_on, credential_url, sort_order, visible)
values
  ('50000000-0000-4000-8000-000000000001', 'Instructor CTU', 'Children Technological University', null, null, 0, true),
  ('50000000-0000-4000-8000-000000000002', 'Arduino', 'Borg Al-Arab Technological University', null, null, 1, true),
  ('50000000-0000-4000-8000-000000000003', 'Cybersecurity Level 1', 'Skills Area', null, null, 2, true),
  ('50000000-0000-4000-8000-000000000004', 'Cloud Computing', 'Creativa', null, null, 3, true),
  ('50000000-0000-4000-8000-000000000005', 'Mobile Application, React Native', null, null, null, 4, true),
  ('50000000-0000-4000-8000-000000000006', 'AI Fundamentals', 'Borg Al-Arab Technological University', null, null, 5, true),
  ('50000000-0000-4000-8000-000000000007', 'Front-End Development', 'Borg Al-Arab Technological University', null, null, 6, true),
  ('50000000-0000-4000-8000-000000000008', 'HP Introductory Cybersecurity', 'HP', null, null, 7, true),
  ('50000000-0000-4000-8000-000000000009', 'ITI Full Stack PHP', 'Information Technology Institute', null, null, 8, true),
  ('50000000-0000-4000-8000-000000000010', 'Linux Red Hat Administration', 'National Telecommunications Institute', null, null, 9, true);

insert into courses (id, title, provider, start_date, end_date, status, description, sort_order, visible)
values
  ('60000000-0000-4000-8000-000000000001', 'CCNA Level 1', 'Cisco Networking Academy', '2026-09-01', null, 'in_progress', null, 0, true),
  ('60000000-0000-4000-8000-000000000002', 'Mobile Application (React Native)', null, '2026-02-01', '2026-04-01', 'completed', null, 1, true),
  ('60000000-0000-4000-8000-000000000003', 'Front-End Development', null, '2025-03-01', '2025-05-01', 'completed', null, 2, true),
  ('60000000-0000-4000-8000-000000000004', 'AI Development', null, '2025-03-01', '2025-05-01', 'completed', 'Python, Pandas, and Jupyter.', 3, true);

insert into achievements (id, title, event, achieved_on, details, sort_order, visible)
values
  ('70000000-0000-4000-8000-000000000001', 'Ranked 7th among BATU teams', 'ECPC 2026, Collegiate Programming Competition', '2026-08-01', null, 0, true);
