# Portfolio — Omar Mehawed

> Personal portfolio website with a hidden admin panel and an AI-powered CV updater.
> This file is the single source of truth for the project: scope, stack, data model, routes, security, AI pipeline, design, and roadmap.

---

## 1. Why this project exists

At the Techni Summit expo, Omar only had a PDF CV and a LinkedIn profile to show. He needs a professional, fast, mobile-first website that presents everything in one place and that he can update himself without touching code.

**Goals**
1. A polished public site that opens instantly on a phone (people will scan a QR code and open it standing in front of him).
2. Show every detail from the CV: experience, education, skills, certifications, courses, competitions, projects.
3. Link projects to GitHub and show a short brief for each.
4. A hidden admin area (`/login`) used only by Omar, to add, edit and delete anything.
5. An AI feature: upload an updated CV (PDF) and the system detects what is new and proposes adding it to the portfolio data, for Omar to approve.
6. Social links everywhere: Facebook, Instagram, TikTok, LinkedIn, GitHub.

**Non-goals (for now)**
- Multi-user accounts, public registration, comments, blog, analytics dashboard.
- Auto-publishing AI output without review.

---

## 2. Owner data (seed content, from the current CV)

### Identity
- **Name:** Omar Mehawed
- **Title:** IT Developer
- **Location:** Sidi-Beshr, Alexandria, Egypt
- **Email:** omarmehawed4@gmail.com
- **GitHub:** github.com/omarmehawed
- **LinkedIn:** linkedin.com/in/omar-mehawed-861098249
- **Phone:** shown only if Omar enables it (see privacy notes)
- **Summary:** Detail-oriented IT Developer with a Bachelor in Information Technology and a versatile background in full-stack development, system administration, and technical instruction. Skilled in PHP, React, and cloud technologies; builds scalable solutions, manages complex systems, and communicates clearly with diverse teams.

### Work experience
| Role | Org | Period | Highlights |
|---|---|---|---|
| Public Relations Team Leader | IT Club | Aug 2025 – Current | Led PR team, coordinated club and external organizations, managed partnerships, promoted activities, grew student/tech-community engagement |
| Instructor IOT | CTU (Children Technological University), Alexandria | Jul 2025 – Aug 2026 | Presented educational content interactively, guided hands-on activities, built students' confidence |
| Intern, Full Stack Web Development (PHP Laravel) | Information Technology Institute (ITI), Alexandria | Jul 2025 – Oct 2025 | Refactored legacy PHP, built RESTful APIs with Laravel, secure database design, deployed scalable apps with senior engineers, UI work with Vue.js and Tailwind |
| Training, Linux Red Hat Administration (120 hr) | National Telecommunications Institute (NTI), Alexandria | Jul 2025 – Aug 2025 | Storage (partitions, LVM), file systems, ACLs, SELinux, firewall, containers, RHEL server setup, user accounts and access control |

### Education
- **Bachelor of Information Technology (Network & Software Development)** — Borg Al-Arab Technological University (BATU), Sep 2024 – 2028

### Skills
- **Soft:** problem solving and critical thinking, team collaboration, communication and presentation, time management
- **IT:** Authentication & Authorization, Role-Based Access Control, PHP Laravel, Database Design
- **Technologies:** Cloudflare, Supabase, PostgreSQL, AWS, Git, Docker, TypeScript, React.js, Python (AI), Web Development (HTML/CSS/JS), React Native, Linux (Ubuntu, Red Hat), Networking concepts, Embedded systems
- **Languages:** Arabic, English

### Certifications
Instructor CTU · Arduino (BATU) · Cybersecurity Level 1 (Skills Area) · Cloud Computing (Creativa) · Mobile Application, React Native · AI Fundamentals (BATU) · Front-End Development (BATU) · HP Introductory Cybersecurity · ITI Full Stack PHP · Linux Red Hat Administration

### Courses
- CCNA Level 1 (Cisco Networking Academy) — Sep 2026, in progress
- Front-End Development — Mar–May 2025
- Mobile Application (React Native) — Feb–Apr 2026
- AI Development (Python, Pandas, Jupyter) — Mar–May 2025

### Achievements
- **ECPC 2026**, Collegiate Programming Competition — ranked 7th among BATU teams (Aug 2026)

### Software projects
| Project | Period | Brief |
|---|---|---|
| The Knower System | Jul–Sep 2026 | Flagship management platform of The Knower OS agency. Laravel + React, deployed on Render with MySQL on Aiven, custom domain theknowersystem.shop. Includes a Sales & Digital Marketing module |
| Wali El-Ahd Hospital Management System | Sep–Oct 2026 | Full system for an exclusive OB/GYN maternity hospital. API-first Laravel backend, React web client, future mobile/desktop. Online booking with queue numbers, pregnancy/delivery records, newborn/NICU files, lab, radiology, pharmacy and supplies inventory, itemized inpatient billing with e-invoices, WhatsApp result delivery, Google login and Telegram integration planned |
| Teaching Management System | Aug–Sep 2026 | Platform for teachers to publish documents and videos in a copy-protected environment, with student subscriptions, WhatsApp notifications and financial tracking |
| Pharmacy Management System | May–Aug 2026 | Multi-branch pharmacy platform with a call-center flow for phone orders and a React mobile app |
| Law Firm Management System | May–Jun 2026 | Multi-platform system for law offices and clients: Laravel API, React web, React mobile and desktop apps, full ERD, role/permission matrix, phased roadmap |
| Infinity Crew: ICPC / Technical Training Platform | May–Jun 2026 | Training platform for ICPC-style competitive programming preparation |
| Restaurant / Café Ordering System | Feb–Apr 2026 | QR-based ordering, multi-tenant, realtime updates via Laravel Reverb, multi-platform |
| LMS School Management System | Jan–Feb 2026 | School management and learning platform, 30+ database tables, four user roles |
| BATU Project Management System | Dec 2025–Jan 2026 | Graduation-project management platform for students, supervisors and admins |
| Katalog (mobile app) | Dec 2025–Sep 2026 | Digital legacy platform for continuous content delivery beyond a person's lifetime |

### Hardware projects
- **Smart robotic hand (2nd-year graduation project, Sep 2025–Jun 2026):** wearable prototype with embedded control, motion actuation, sensor integration and wireless connectivity; responsive movement and real-time feedback.
- **Medical robot (1st-year graduation project):** preliminary diagnosis for infectious diseases, reducing doctor contact; temperature and heart-rate sensors with remote data transmission. Skills: Arduino, medical sensors, mechanical design, teamwork.

### Other
- Founder of **The Knower OS** (freelance software agency) and **OppStore** (clothing brand) — confirm whether Omar wants these shown publicly.

### Content cleanup before launch
- Fix typos: "Childern" → "Children", "Egptian" → "Egyptian".
- Summary says "Bachelor" but Omar is a current student (2024–2028): reword to "IT student" to stay accurate.
- Some date ranges overlap or end in the future (e.g. Katalog to Sep 2026, Instructor IOT to Aug 2026): decide whether each is ongoing or finished.
- The CV shows date of birth: do **not** publish it on the website.

---

## 3. Tech stack

| Layer | Choice | Reason |
|---|---|---|
| Framework | **Next.js (App Router) + TypeScript** | Fast, SEO-friendly, server routes for admin and AI in one codebase |
| Styling | **Tailwind CSS** + shadcn/ui components | Fast, consistent, easy dark mode |
| Animation | Framer Motion (light use) | Smooth sections without hurting performance |
| Hosting | **Vercel** | Instant loads, no cold-start sleep, free tier is enough |
| Database | **Supabase (PostgreSQL)** | Relational data, Row Level Security, built-in auth and storage |
| Auth | **Supabase Auth**, a single admin user, signups disabled, TOTP MFA | No custom auth code |
| File storage | Supabase Storage (public bucket for images, private bucket for CV PDFs) | One place for media |
| AI | **Gemini API**, called only from server routes | Omar already uses it; key never reaches the browser |
| PDF handling | Send the PDF directly to Gemini, with a text-extraction fallback | Keeps layout context |
| Validation | **Zod** | Validates AI output and every admin form |
| Rate limiting | Upstash Redis (or a DB-backed counter) | Protects login and AI endpoints |
| GitHub data | GitHub REST API with ISR caching | Live repo info without hitting rate limits |

---

## 4. Architecture

```
Browser ──► Next.js on Vercel ──► Supabase (Postgres + Auth + Storage)
                │
                ├──► GitHub REST API   (repo info, cached)
                └──► Gemini API        (CV parsing, brief generation)
```

- **Public pages** are server-rendered/ISR and read data with the public (anon) key through read-only RLS policies.
- **Admin pages** and all writes go through server actions/route handlers that verify the Supabase session and MFA level first, then write with the service-role key (server only).
- **Nothing sensitive** (service key, Gemini key, GitHub token) ever ships to the client.

### Folder structure
```
portfolio/
├─ app/
│  ├─ (public)/
│  │  ├─ page.tsx                # Home: hero + all sections
│  │  └─ projects/[slug]/page.tsx # Project detail
│  ├─ login/page.tsx             # Hidden: not linked anywhere
│  ├─ admin/
│  │  ├─ layout.tsx              # Auth + MFA guard
│  │  ├─ page.tsx                # Dashboard
│  │  ├─ profile/ experience/ education/ projects/
│  │  ├─ skills/ certifications/ courses/ achievements/ socials/
│  │  └─ cv/                     # Upload + review AI proposals
│  └─ api/
│     ├─ cv/upload/route.ts
│     ├─ cv/apply/route.ts
│     └─ github/sync/route.ts
├─ components/                   # UI + section components
├─ lib/
│  ├─ supabase/ (server.ts, client.ts, admin.ts)
│  ├─ ai/ (gemini.ts, cv-schema.ts, diff.ts)
│  ├─ github.ts
│  ├─ ratelimit.ts
│  └─ validators.ts
├─ middleware.ts                 # Protects /admin, adds security headers
├─ supabase/migrations/          # SQL schema
└─ .env.local
```

---

## 5. Database schema (PostgreSQL / Supabase)

```sql
-- Single-row profile
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
  platform text not null,          -- facebook | instagram | tiktok | linkedin | github | other
  url text not null,
  sort_order int default 0,
  visible boolean default true
);

create table experiences (
  id uuid primary key default gen_random_uuid(),
  role text not null,
  organization text not null,
  location text,
  start_date date,
  end_date date,                   -- null = current
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
  visible boolean default true
);

create table projects (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  kind text default 'software',    -- software | hardware
  brief text,                      -- 2-3 lines for the card
  description text,                -- long form for detail page
  start_date date,
  end_date date,
  tech text[] default '{}',
  github_repo text,                -- "owner/repo", null if private/client
  live_url text,
  cover_url text,
  is_private boolean default false,-- client/private project badge
  featured boolean default false,
  sort_order int default 0,
  visible boolean default true
);

create table skills (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text,                   -- technical | soft | language | tool
  level int,                       -- optional 1-5
  sort_order int default 0,
  visible boolean default true
);

create table certifications (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  issuer text,
  issued_on date,
  credential_url text,
  visible boolean default true
);

create table courses (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  provider text,
  start_date date,
  end_date date,
  status text default 'completed', -- completed | in_progress
  description text,
  visible boolean default true
);

create table achievements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  event text,
  achieved_on date,
  details text,
  visible boolean default true
);

-- AI CV pipeline
create table cv_uploads (
  id uuid primary key default gen_random_uuid(),
  file_path text not null,         -- private storage path
  status text default 'pending',   -- pending | parsed | reviewed | applied | failed
  parsed_json jsonb,
  created_at timestamptz default now()
);

create table cv_proposals (
  id uuid primary key default gen_random_uuid(),
  upload_id uuid references cv_uploads(id) on delete cascade,
  entity text not null,            -- experience | project | skill | ...
  action text not null,            -- add | update
  target_id uuid,                  -- existing row for updates
  payload jsonb not null,          -- proposed values
  diff jsonb,                      -- field-level before/after for updates
  decision text default 'pending'  -- pending | approved | rejected
);

create table login_attempts (
  id bigserial primary key,
  ip text,
  success boolean,
  created_at timestamptz default now()
);
```

**Row Level Security**
- Every content table: `select` allowed for `anon` only where `visible = true`.
- No `insert/update/delete` policies for `anon` or `authenticated`: all writes happen server-side with the service-role key after the session and MFA checks.
- `cv_uploads`, `cv_proposals`, `login_attempts`: no public access at all.

---

## 6. Routes

### Public
| Route | Purpose |
|---|---|
| `/` | Single-page portfolio: Hero, About, Experience, Projects, Skills, Certifications and Courses, Achievements, Contact |
| `/projects/[slug]` | Project detail: brief, tech, GitHub link, screenshots |

### Hidden / admin
| Route | Purpose |
|---|---|
| `/login` | Not linked anywhere, `noindex`. Email + password, then TOTP |
| `/admin` | Dashboard: counts, last CV upload, quick links |
| `/admin/{section}` | CRUD for each content type, with a visible toggle and drag-to-reorder |
| `/admin/cv` | Upload CV, review AI proposals, approve/reject per item |

`robots.txt` disallows `/login` and `/admin`; both pages also send `X-Robots-Tag: noindex`.

---

## 7. Security

Hiding `/login` only avoids casual discovery. It is **not** a security measure, so real protection is required:

1. **Single admin user.** Supabase signups disabled; the account is created manually in the Supabase dashboard.
2. **Strong password** (20+ characters, from a password manager).
3. **TOTP 2FA** (Supabase MFA). `/admin` requires AAL2, not just a password session.
4. **Rate limiting** on `/login`: for example 5 attempts per 15 minutes per IP, with a growing delay. Log each attempt in `login_attempts`.
5. **No register or "forgot password" route** exposed in the UI.
6. **Middleware guard** on all `/admin/*` and `/api/cv/*` routes; server actions re-verify the session themselves (never rely on middleware alone).
7. **Secure cookies:** HttpOnly, Secure, SameSite=Lax; short session lifetime.
8. **Security headers:** CSP, `X-Frame-Options: DENY`, `Referrer-Policy`, `X-Content-Type-Options`.
9. **Uploads:** accept PDF only, max 10 MB, verify the MIME type server-side, store CVs in a **private** bucket.
10. **Secrets:** service-role key, Gemini key and GitHub token only in Vercel environment variables.
11. **Generic error messages** on failed login (do not reveal whether the email exists).

---

## 8. AI CV updater (Phase 2)

**Principle: AI proposes, Omar approves. Nothing is applied or deleted automatically.**

### Flow
1. Omar uploads a PDF at `/admin/cv`.
2. The server saves it to the private bucket and creates a `cv_uploads` row.
3. The server sends the PDF to Gemini with a strict prompt and a JSON schema (Zod-validated) covering: profile, experiences, education, projects, skills, certifications, courses, achievements.
4. The result is validated. On a schema failure, retry once; if it still fails, mark the upload `failed` and show the error.
5. `lib/ai/diff.ts` compares the parsed data with the current database.
   - **Matching keys:** experiences = role + organization + start date; projects = normalized title; skills and certifications = normalized name; courses = title + provider.
   - **New** → proposal with `action = add`.
   - **Matched but different** → proposal with `action = update`, with a field-level diff.
   - **In DB but missing from the CV** → **ignored** (never proposes deletion; the CV may simply be shorter).
6. `/admin/cv` shows the proposals grouped by section, with before/after for updates. Omar can approve, reject or edit each one.
7. `POST /api/cv/apply` applies only the approved items, inside a transaction.
8. The upload is marked `applied`.

### Prompt rules for Gemini
- Extract only what is written in the document; never invent or infer facts.
- Return dates as `YYYY-MM` or null; mark ongoing roles as `is_current`.
- Preserve the original wording of bullets; only fix obvious typos.
- Return JSON only, matching the schema.

### Extra AI helpers (optional, later)
- "Generate brief" button on a project: summarizes the GitHub README into a 2–3 line card brief (editable before saving).
- "Suggest summary" for the About section.

### Cost and abuse controls
- Rate limit `/api/cv/upload` (e.g. 10 per hour).
- Cap the file size and the number of pages sent.
- Log the model name and token usage per upload.

---

## 9. GitHub integration

- Each project can store `github_repo` (`owner/repo`).
- A server helper fetches repo metadata (description, languages, stars, last update, README) through the GitHub REST API with an optional personal access token for higher rate limits.
- Results are cached with ISR (`revalidate` ≈ 1 hour) plus a manual **Sync** button in the admin.
- Many projects are client or private systems, so they have no public repo: they show a **"Client project"** badge, with a brief written by hand or by the AI helper.
- A "Latest from GitHub" strip on the home page (top public repos) is optional.

---

## 10. Design direction

- **Vibe:** modern, clean, confident: a developer who builds real systems, not a template.
- **Theme:** dark by default with a light toggle; one strong accent colour (suggest the deep burgundy from the CV as a brand tie-in, balanced with a neutral palette).
- **Typography:** one geometric sans for headings, one readable sans for body; support Arabic text (RTL-ready) in case an Arabic version is added later.
- **Hero:** photo, name, title, one-line pitch, buttons: *View projects*, *Download CV*, *Contact*; social icons row.
- **Projects:** card grid with cover, brief, tech chips, GitHub/live icons; filter by Software / Hardware.
- **Experience:** vertical timeline.
- **Mobile-first:** the expo audience will open it from a QR code on a phone. Target Lighthouse 90+ on mobile.
- **QR code:** generate one pointing to the final domain, ready to print for events.
- **SEO and sharing:** title, description, Open Graph image, JSON-LD `Person` schema.

---

## 11. Environment variables

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=        # server only
GEMINI_API_KEY=                   # server only
GEMINI_MODEL=                     # configurable, not hard-coded
GITHUB_TOKEN=                     # optional, server only
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
NEXT_PUBLIC_SITE_URL=
```

---

## 12. Roadmap

### Phase 1: Site + admin (MVP)
1. Create the Next.js project, Tailwind and shadcn/ui; connect Supabase.
2. Run the SQL migrations and RLS policies; seed data from Section 2.
3. Build public sections: Hero, About, Experience, Projects (+ detail page), Skills, Certifications and Courses, Achievements, Contact and socials.
4. Build `/login` with password + TOTP, rate limiting and the middleware guard.
5. Build admin CRUD for every section, with image upload and visibility toggle.
6. SEO, Open Graph, `robots.txt`, favicon; deploy to Vercel; connect a custom domain.
7. Generate the QR code.

### Phase 2: AI and GitHub
1. GitHub repo sync and README-based briefs.
2. CV upload pipeline: parse, diff, proposals, review UI, apply.
3. Error handling, usage logging, rate limits.

### Phase 3: Polish (optional)
- Arabic/English toggle, blog or case studies, privacy-friendly analytics, "Hire me" contact form (with spam protection), downloadable auto-generated CV from the database.

---

## 13. Acceptance checklist

**Phase 1**
- [ ] Public site loads in under 2 s on mobile data and scores 90+ on Lighthouse.
- [ ] All content from Section 2 is visible and correct.
- [ ] `/login` is not linked anywhere and returns `noindex`.
- [ ] `/admin` is unreachable without password **and** TOTP.
- [ ] 6th failed login in the window is blocked.
- [ ] Every section can be added, edited, deleted, reordered and hidden from the admin.
- [ ] No secret appears in the client bundle.
- [ ] Date of birth is not published; phone is shown only if enabled.

**Phase 2**
- [ ] Uploading a new CV produces proposals for only new/changed items.
- [ ] Nothing is written to the database before approval.
- [ ] Items missing from the CV are never deleted.
- [ ] Invalid AI output is rejected and reported, not saved.

---

## 14. Open items (need Omar's input)

1. Final **domain name** for the portfolio.
2. Handles/URLs for **Facebook, Instagram and TikTok**.
3. Which **GitHub repos** are public and should be linked to which projects.
4. Show **The Knower OS** and **OppStore** on the site? (Probably yes: they strengthen the story.)
5. Show **phone number** publicly or only email/WhatsApp?
6. Preferred **accent colour** and a high-quality photo for the hero.
7. Arabic version now or later?
