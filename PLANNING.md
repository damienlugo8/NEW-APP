# NotaryFlow — Foundation Planning

> A planning document written before any code. The goal is to commit to choices that we will not have to re-litigate next session.

---

## 1. Product positioning

NotaryFlow is a mobile-first business management platform for solo mobile notaries and loan signing agents in the U.S. The category already has incumbents: NotaryGadget, NotaryAssist, CloseWise. They cover the table-stakes — journal, appointments, mileage, invoicing.

**Where they all fail:** none has a real **sales pipeline / CRM** for the outreach side of the business (title companies, signing services, law firms). A notary's income is gated by how many companies have them in their roster, not by how well they log signings after the fact. Every working notary keeps this data in a spreadsheet or in their head. We build it into the product.

**Secondary differentiator:** the product feels like it was designed in 2026. Competitors look like 2015 Bootstrap. We compete on craft.

This planning doc covers the **foundation** — auth, billing scaffolding, dashboard shell, design system. CRM, journal, calendar, mileage, invoicing come in later sessions.

---

## 2. Tech stack decisions

### 2.1 Recommendation

Sticking with the proposed defaults, with two refinements:

| Layer | Choice | Why |
|---|---|---|
| Framework | **Next.js 15 (App Router)** | Server Components reduce client JS for marketing pages; Route Handlers + Server Actions cover the API surface without a separate backend. |
| Language | **TypeScript (strict)** | Non-negotiable. `strict: true`, `noUncheckedIndexedAccess: true`. |
| UI | **React 19 + Tailwind v4 + shadcn/ui (heavily customized)** | shadcn is a starting kit, not a finished system. Every primitive gets rewritten against our tokens. |
| Animation | **Framer Motion** | Mature, respects `prefers-reduced-motion` out of the box. |
| DB | **Supabase Postgres** | Postgres is the right call; Supabase bundles auth + storage + RLS + realtime so a solo dev doesn't run three services. |
| ORM | **Drizzle** (chosen over Prisma) | Lighter, no generated client, no `prisma generate` step, SQL-shaped types. Plays well with Supabase's Postgres + edge runtime. Prisma's migration story is nicer; Drizzle's runtime story is better. We pick runtime ergonomics. |
| Auth | **Supabase Auth (email + password, magic link as future option)** | Tight RLS integration. We get email verification, password reset, JWT for free. |
| Payments | **Stripe (Checkout + Customer Portal + webhooks)** | Deferred — see §4. |
| Email | **Resend + `react-email`** | Resend has the cleanest DX. `react-email` keeps templates in the same repo, typed. |
| Hosting | **Vercel** | Best Next.js host. Edge for marketing, Node for webhooks. |
| Rate limit | **Upstash Redis** (free tier) | For auth route abuse protection. |

### 2.2 What we are deliberately *not* doing

- **No tRPC.** Server Actions + Route Handlers cover the same ground for this app's surface area without adding a layer.
- **No state library (Zustand/Redux).** Server Components push most state to the server. Client state stays in `useState` / URL.
- **No monorepo.** One Next.js app. We'll add a `packages/` folder only if/when we ship a mobile app or shared SDK.
- **No headless CMS.** Landing copy lives in `content/` MDX files. Faster to iterate than wiring a CMS for one marketing page.

### 2.3 Why this scales to 10k users without a rewrite

Supabase + Postgres + Vercel comfortably handles 10k MAU. The bottleneck at that scale is almost always a hot query, not the platform — solved with indexes and the read replica we get on Supabase Pro. The escape hatches are intact: Drizzle queries port to any Postgres; Supabase Auth can be swapped for Clerk/Auth.js if we outgrow it; the Next.js app deploys to any Node host.

---

## 3. Data model

Every table is owned by a `user_id` and gated by Row Level Security. The user is the tenant — there is no organization concept in v1.

### Tables

**`profiles`** — extends `auth.users` (Supabase-managed).
| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | FK → `auth.users.id` |
| `email` | `text` | Mirrored from `auth.users` for query convenience |
| `full_legal_name` | `text` |  |
| `business_name` | `text` nullable |  |
| `phone` | `text` nullable | E.164 format |
| `commission_state` | `text` (2-char) | e.g. `NJ` |
| `commission_expires_at` | `date` |  |
| `notary_id_number` | `text` |  |
| `onboarded_at` | `timestamptz` nullable | Null until wizard complete |
| `created_at` / `updated_at` | `timestamptz` |  |

**`subscriptions`** — Stripe state mirror. One row per user.
| Column | Type | Notes |
|---|---|---|
| `user_id` | `uuid` PK + FK |  |
| `stripe_customer_id` | `text` unique |  |
| `stripe_subscription_id` | `text` nullable |  |
| `status` | `text` | `trialing` / `active` / `past_due` / `canceled` / `incomplete` |
| `plan` | `text` | `free` / `solo` / `pro` |
| `trial_ends_at` | `timestamptz` nullable |  |
| `current_period_end` | `timestamptz` nullable |  |
| `cancel_at_period_end` | `boolean` default false |  |
| `created_at` / `updated_at` | `timestamptz` |  |

**Tables scaffolded but unused until feature sessions** — schemas declared in Drizzle so RLS policies and migrations are ready, but no UI yet:

- **`appointments`** — `id, user_id, title, location, scheduled_at, duration_min, fee, status, notes`
- **`journal_entries`** — `id, user_id, signer_name, document_type, signed_at, location, fee, notes` (PII — see §5)
- **`invoices`** — `id, user_id, client_id, amount, status, issued_at, paid_at`
- **`clients`** — `id, user_id, company_name, contact_name, email, phone, type` (`title_company` / `signing_service` / `law_firm` / `direct`)
- **`pipeline_stages`** — `id, user_id, name, position` (default: Prospect → Contacted → Engaged → Active → Lost)
- **`pipeline_deals`** — `id, user_id, client_id, stage_id, value_estimate, last_contact_at, next_action_at, notes` — **the differentiator**

### Relationships
```
auth.users 1—1 profiles
auth.users 1—1 subscriptions
auth.users 1—* clients
clients    1—* pipeline_deals
auth.users 1—* appointments / journal_entries / invoices
```

### RLS policy pattern (applied to every table)
```sql
create policy "owner can read"   on <table> for select using (auth.uid() = user_id);
create policy "owner can insert" on <table> for insert with check (auth.uid() = user_id);
create policy "owner can update" on <table> for update using (auth.uid() = user_id);
create policy "owner can delete" on <table> for delete using (auth.uid() = user_id);
```

---

## 4. Authentication and payment flow

### 4.1 Auth flow (v1)

1. **Sign up** → email + password → Supabase sends verification email (template overridden via Resend SMTP integration so it doesn't say "supabase").
2. **Verify email** → click link → land on `/onboarding`.
3. **Onboarding wizard** → 4 steps, progress bar, can't skip. On completion, set `profiles.onboarded_at` and redirect to `/dashboard`.
4. **Login** → email + password → if `onboarded_at` is null, route to `/onboarding`, else `/dashboard`.
5. **Forgot password** → Supabase recovery email → reset form → login.
6. **Logout** → server action clears session.

**Magic link** is wired in the Supabase config but the UI doesn't expose it yet. Adding the button later is one line.

### 4.2 Stripe flow (deferred this session)

The user asked to defer billing until the product is mostly built. So:

- Schema for `subscriptions` is **created**.
- `.env.example` includes the Stripe keys.
- `/api/stripe/webhook` route exists and is **stubbed** — it parses the event signature and logs, but doesn't mutate state until we wire products in Stripe.
- The pricing section on the landing page CTA is hooked to `/auth/sign-up?plan=solo` (carries intent through) rather than to Checkout. When billing is enabled, we swap that for a Checkout redirect.
- Trial logic in the schema is ready: `status = 'trialing'` is set when a user signs up.

**Planned trial UX (for the session we wire Stripe):** card-required 14-day trial via Stripe Checkout in subscription mode with `trial_period_days: 14`. Higher quality of intent, simpler to enforce, no awkward dead-end on day 14.

---

## 5. Top security risks and mitigations

NotaryFlow stores three flavors of sensitive data: identity (notary ID, commission), payment (Stripe), and signing records (PII of third-party signers under various state notary statutes).

### Risk 1 — Cross-tenant data leak (a notary sees another notary's signers)
This is the showstopper failure mode for any multi-tenant app. A single missing `where user_id = ?` and you're on the front page of HN.

**Mitigations from day one:**
- **RLS on every table** with the four-policy pattern above. RLS is the floor, not a feature.
- App-layer Drizzle queries also scope by `user_id` (defense in depth).
- A `ban-on-import` ESLint rule forbids the Supabase service-role client outside `app/api/**` and `lib/server/admin.ts`.
- Integration test that creates two users and asserts user A cannot read user B's `journal_entries` via the public API.

### Risk 2 — PII in the notary journal
Some states require journal retention for 10 years. We store signer names, ID types, dates. This is regulated PII.

**Mitigations from day one:**
- Journal data lives in Postgres, not in logs. Logger config strips known PII fields (`signer_name`, `id_number`, `email`, `phone`) before emit. A simple `redact()` helper in `lib/log.ts`.
- HTTPS-only cookies, `SameSite=Lax`, `Secure`, `HttpOnly` on the session cookie.
- Supabase encryption at rest is on by default. We document the data subject deletion path in the README for GDPR/CCPA, even though the U.S. compliance bar is lower.
- No PII in URL paths or query strings — IDs only.

### Risk 3 — Auth route abuse (credential stuffing, signup spam)
The signup and password-reset endpoints are the most-attacked surfaces of any SaaS.

**Mitigations from day one:**
- Upstash rate limit middleware on `/auth/*` and `/api/auth/*`: 5 attempts per 15 min per IP for login and reset; 3 signups per hour per IP.
- Passwords ≥ 10 chars, checked against a small Have-I-Been-Pwned hash prefix at signup (no network call for free tier — bundle top-10k breached list as JSON).
- Stripe webhook verifies the signature with `STRIPE_WEBHOOK_SECRET` before doing anything; replay-protected via the timestamp tolerance Stripe enforces.
- All secrets in `.env`; `.env*` gitignored except `.env.example`.

---

## 6. File structure

```
notaryflow/
├── app/
│   ├── (marketing)/
│   │   ├── layout.tsx              # marketing chrome (nav, footer)
│   │   ├── page.tsx                # /
│   │   ├── pricing/page.tsx
│   │   └── legal/
│   │       ├── privacy/page.tsx
│   │       └── terms/page.tsx
│   ├── (auth)/
│   │   ├── layout.tsx              # split-screen auth layout
│   │   ├── sign-up/page.tsx
│   │   ├── login/page.tsx
│   │   ├── forgot-password/page.tsx
│   │   ├── reset-password/page.tsx
│   │   └── verify/page.tsx
│   ├── (app)/
│   │   ├── layout.tsx              # authed shell (sidebar, top bar, user menu)
│   │   ├── dashboard/page.tsx
│   │   ├── onboarding/page.tsx
│   │   └── settings/
│   │       ├── page.tsx            # profile
│   │       └── billing/page.tsx
│   ├── api/
│   │   ├── stripe/webhook/route.ts # stubbed
│   │   └── health/route.ts
│   ├── layout.tsx                  # root: fonts, theme provider, metadata
│   ├── globals.css                 # tokens + Tailwind layers
│   ├── opengraph-image.tsx         # generated OG card
│   └── icon.tsx                    # favicon
├── components/
│   ├── ui/                         # customized shadcn primitives
│   ├── marketing/                  # hero, pricing-card, mock-app, etc.
│   ├── auth/                       # auth forms
│   ├── app/                        # dashboard widgets, sidebar
│   └── motion/                     # FadeIn, Reveal, Stagger wrappers
├── lib/
│   ├── supabase/
│   │   ├── client.ts               # browser
│   │   ├── server.ts               # server components / actions
│   │   └── admin.ts                # service-role (never import client-side)
│   ├── db/
│   │   ├── schema.ts               # Drizzle schema
│   │   ├── index.ts                # db client
│   │   └── migrations/             # generated SQL
│   ├── auth/
│   │   ├── session.ts              # getSession(), requireUser()
│   │   └── rate-limit.ts
│   ├── stripe/
│   │   └── client.ts               # lazy — only init if STRIPE_SECRET_KEY set
│   ├── design/
│   │   ├── tokens.ts               # exported tokens (colors, motion)
│   │   └── fonts.ts                # next/font config
│   ├── utils.ts                    # cn(), formatters
│   └── log.ts                      # redacting logger
├── content/                        # MDX for marketing copy
├── public/                         # favicons, icons
├── drizzle.config.ts
├── tailwind.config.ts              # references tokens.ts
├── next.config.ts
├── tsconfig.json
├── .env.example
├── .env.local                      # gitignored
├── README.md
└── PLANNING.md                     # this file
```

Route groups (`(marketing)`, `(auth)`, `(app)`) let each section have its own layout without polluting the URL.

---

## 7. Design system

This is the section that decides whether the product looks like 2026 or 2015. Every value below is a commitment, not a suggestion.

### 7.1 Brand voice

Confident, plain-spoken, faintly editorial. We don't say "all-in-one platform." We don't say "supercharge." We say what the product does in the words a notary would use.

Sample hero candidates (final choice in the build):
- **"Run the entire signing business from your phone."**
- **"The notary tool that finally takes outreach seriously."**
- **"Stop chasing title companies in a spreadsheet."**

### 7.2 Typography

| Role | Face | Notes |
|---|---|---|
| Display / headings | **Geist Sans** (variable) | Modern geometric sans, free, ships via `next/font`. Reads as more refined than Inter, less corporate than Söhne. |
| Body | **Geist Sans** | Same family for consistency; we shift weight + tracking instead of switching face. |
| Mono accent | **Geist Mono** | Used for: pricing numerals, table data, dashboard metrics, code in docs. Adds editorial texture (à la Stripe, Vercel) without a third typeface. |
| Display weights | 500 (most heads), 600 (h1 only), regular 400 (long-form) | We avoid heavy 700/800 — looks bloggy. |

**Type scale** (rem, intentional non-uniform jumps):

| Token | Size | Line | Tracking | Weight | Use |
|---|---|---|---|---|---|
| `display` | 4.5rem (72px) | 1.02 | -0.025em | 600 | Hero h1 |
| `h1` | 3rem (48px) | 1.08 | -0.02em | 500 | Section title |
| `h2` | 2rem (32px) | 1.15 | -0.015em | 500 |  |
| `h3` | 1.375rem (22px) | 1.3 | -0.01em | 500 |  |
| `body-lg` | 1.125rem (18px) | 1.55 | 0 | 400 | Lead paragraphs |
| `body` | 1rem (16px) | 1.6 | 0 | 400 |  |
| `small` | 0.875rem (14px) | 1.5 | 0 | 400 |  |
| `caption` | 0.75rem (12px) | 1.4 | 0.04em | 500 (mono) | Eyebrow, labels |

Mobile down-shifts: `display` → 2.75rem; `h1` → 2.25rem.

### 7.3 Color — light mode

Built on warm off-whites and near-blacks, not Tailwind's cool slate. **Deep emerald** is the single accent.

| Token | Hex | Use |
|---|---|---|
| `--bg`           | `#FAFAF7` | App background. Warm off-white. |
| `--surface`      | `#FFFFFF` | Cards, popovers. |
| `--surface-2`    | `#F2F1EC` | Recessed surfaces, hover. |
| `--border`       | `#E6E4DC` | Hairline borders. |
| `--border-strong`| `#D1CEC2` |  |
| `--text`         | `#0E1410` | Primary text. Near-black with a green undertone. |
| `--text-muted`   | `#5C6360` |  |
| `--text-subtle`  | `#8A8F8B` |  |
| `--accent`       | `#0F5132` | **Deep emerald.** Primary brand. |
| `--accent-hover` | `#0B4128` |  |
| `--accent-soft`  | `#E4EFE7` | Accent-tinted surface. |
| `--accent-fg`    | `#FAFAF7` | Text on accent. |
| `--success`      | `#2F7A4E` |  |
| `--warning`      | `#B7791F` |  |
| `--danger`       | `#A1281C` |  |

### 7.4 Color — dark mode (designed, not inverted)

| Token | Hex | Use |
|---|---|---|
| `--bg`           | `#0B0F0C` | True app background — green-shifted near-black. |
| `--surface`      | `#11161300` over bg | Card. Subtle elevation. |
| `--surface-2`    | `#161C18` |  |
| `--border`       | `#22281F` |  |
| `--border-strong`| `#2E342B` |  |
| `--text`         | `#ECEEE9` |  |
| `--text-muted`   | `#9CA39E` |  |
| `--text-subtle`  | `#6D746F` |  |
| `--accent`       | `#3CCB7F` | Lighter emerald for dark — pure `#0F5132` is too dim against `#0B0F0C`. |
| `--accent-hover` | `#54D88E` |  |
| `--accent-soft`  | `#15281D` |  |
| `--accent-fg`    | `#08110B` |  |

Dark mode rationale: the bg/text contrast hits WCAG AA at all type sizes; the accent shifts up in luminance because emerald at 18% lightness looks gray on a near-black bg.

### 7.5 Spacing scale

```
0.25rem  4px    --space-1   (icon padding, gap-tight)
0.5rem   8px    --space-2   (inline gaps)
0.75rem  12px   --space-3
1rem     16px   --space-4   (default block gap)
1.5rem   24px   --space-5
2rem     32px   --space-6   (card padding)
3rem     48px   --space-7
4rem     64px   --space-8   (section breath)
6rem     96px   --space-9   (large section padding)
8rem    128px   --space-10  (landing section vertical rhythm)
```

Section vertical padding on landing: **`py-24 md:py-32`** as the default. Premium products breathe. Default Tailwind `py-16` is the tell.

### 7.6 Radius

**One principle: 6px / 10px / 16px — and that's it.** No `rounded-full` except on avatars and pills. No `rounded-3xl`. Sharp-leaning, Linear-adjacent.

| Token | Value | Use |
|---|---|---|
| `--radius-sm` | 6px | Inputs, small buttons |
| `--radius` | 10px | Cards, primary buttons |
| `--radius-lg` | 16px | Modals, hero panels |

### 7.7 Motion

- All easing uses **`cubic-bezier(0.22, 1, 0.36, 1)`** (a gentle ease-out-quint). Linear and the default cubic are banned.
- **Hover transitions:** 150ms on color, 200ms on transform.
- **Page transitions:** 280ms fade + 4px y-translate on enter, no exit.
- **Scroll reveals:** Framer Motion `whileInView` with `once: true`, 24px y-translate, opacity 0→1, 600ms, staggered by 60ms.
- **Reduce motion:** `useReducedMotion()` from Framer Motion. When true, all transforms become 0 and durations clamp to 0ms; opacity transitions stay (they help orientation).
- Buttons get a 1px y-translate on `:active` for tactile feedback — that's it.

### 7.8 Elevation

Mostly **flat with hairline borders** (Linear move). Two shadows total:

- `--shadow-sm`: `0 1px 0 rgba(14, 20, 16, 0.04), 0 1px 2px rgba(14, 20, 16, 0.04)` — cards.
- `--shadow-md`: `0 8px 24px -8px rgba(14, 20, 16, 0.12), 0 2px 6px rgba(14, 20, 16, 0.06)` — popovers, modals.

In dark mode, shadows fade and we lean on `border` for separation.

### 7.9 Layout grid

- **Content max-width:** `1200px` for landing; `1440px` for app shell.
- **Gutters:** 24px mobile, 40px tablet, 64px desktop.
- **Editorial rhythm on landing:** alternate full-bleed and constrained sections. Never run six sections all the same width centered — that's the template tell.

### 7.10 Iconography

**Lucide**, stroke 1.5, never filled. We override the default 2px stroke. Icons are `1em` and inherit color from text.

### 7.11 Forms

- Input height: 44px (mobile-friendly tap target).
- Label sits **above** the input, 13px caption mono, `--text-muted`.
- Focus ring: 2px `--accent` outline, 2px offset, never a glow.
- Error: 1px `--danger` border + helper text below in danger color. No red shake animation.

### 7.12 What we will never ship

A reminder list, taped to the wall:

1. Purple-to-blue gradient anything.
2. "Trusted by" logo cloud directly under the hero.
3. Three feature cards with colored-circle icons.
4. "Get started for free →" with the arrow.
5. Glowing orbs in the background.
6. Cartoon people illustrations.
7. Centered everything, every section.
8. Inter as the only font.
9. Default shadcn purple.
10. Stat cards saying "10k+ users / 99.9% uptime / 4.9★".

---

## 8. What this session delivers vs. defers

**Delivered:**
- Working Next.js app, `npm run dev`.
- Landing page (hero, product mock, "why notaries switch", pricing, footer).
- Auth flow: signup → email verify → login → forgot/reset → logout, with rate limiting.
- Onboarding wizard (4 steps).
- Dashboard with designed empty states.
- Settings (profile edit, subscription view).
- Drizzle schema + Supabase migration SQL for all v1 tables, RLS policies included.
- Stripe webhook scaffold + subscription schema (deferred wiring).
- Dark mode toggle.
- `.env.example`, `README.md`.

**Deferred (next sessions):**
- Stripe Checkout + Customer Portal wiring (no keys yet).
- The actual CRM / pipeline UI (the differentiator).
- Calendar, journal, mileage, invoicing features.
- Resend email templates (currently using Supabase defaults).
- Upstash rate limit (stub middleware in place; needs Upstash creds).
- Integration tests for cross-tenant isolation.
- Mobile app wrapper (Expo or Capacitor — decide after web is solid).

---

End of plan. Building from here.

---

# Session 2 — Landing rewrite + the three core features

> Appended after session 1. Decisions that change foundation values are explicitly called out.

## S2.1 What we're shipping this session

1. **Landing rewrite** — new copy, new typography pairing, FAQ + features sections, sharper competitive positioning.
2. **Appointments** — full CRUD, calendar grid + list view, today widget on dashboard.
3. **Notary Journal** — append-only entries with signature canvas, list + detail.
4. **Sales Pipeline (the differentiator)** — kanban + list, contact detail panel with activity log, email templates, follow-up reminders.

Feature order is deliberate: Appointments → Journal → Pipeline. The Journal links to Appointments. The Pipeline is the differentiator and gets the most design love.

## S2.2 Decisions made this session

### S2.2.1 Typography — upgraded
Adding **Instrument Serif** for editorial display headlines (hero, section h1/h2 on the landing page). Geist Sans stays as the body + UI face. Geist Mono stays for small details. Rationale:

- Instrument Serif is free (Google Fonts), variable, and currently on-trend in premium SaaS (Attio uses similar; Vercel and Linear lean into sans-serif geometric but the rest of the field is moving toward serif accents in headlines).
- Sans-only is "tech." Sans + editorial serif is "considered." Notaries are middle-aged women, often coming from paper-and-pen workflows — a hint of serif signals seriousness and craft without making the UI feel old.
- The serif is **landing-page-only**. Dashboard headlines stay sans for legibility at small sizes and in a fast-moving operational context.

Updated type roles:

| Role | Face | Use |
|---|---|---|
| Display (landing only) | **Instrument Serif** | hero h1, major section h1/h2 |
| Display (app) | Geist Sans 600/500 | dashboard headlines |
| Body | Geist Sans 400 | everywhere |
| Caption / detail | Geist Mono 500 | timestamps, status, version |

### S2.2.2 Trial UX — confirmed no-card
14-day free trial with **no credit card required**. Reasoning:

- Stripe isn't wired yet — we don't have keys.
- Customer profile (50-year-old notary in NJ, in her car, on her phone) is friction-allergic. Adding a card up front cuts signups disproportionately for this audience.
- The product is sticky once they log a signing — the journal lives in our DB and they're not going to retype 14 days of entries elsewhere.
- We add card requirement later if churn at day 14 is too high.

Documented for the eventual Stripe wiring: when we turn billing on, we keep no-card-trial — start subscription in `trialing` status with no `payment_method`; require card to convert to `active` on day 14.

### S2.2.3 Pipeline Pro-gating
- Trial gives access to everything (including Pipeline).
- After trial: Solo plan ($19) does not include Pipeline. Visiting `/pipeline` shows a designed upgrade overlay over a blurred preview of the kanban — not a full block. They see what they're missing.
- Pro plan ($39) unlocks Pipeline.

### S2.2.4 Library choices
- **Calendar:** custom grid (no react-big-calendar). RBC's CSS is hard to override without it looking like RBC; we want a Linear-feeling month view. A simple grid + day cells is ~150 lines and matches our type system.
- **Drag and drop:** `@dnd-kit/core` + `@dnd-kit/sortable`. Modern, accessible, RSC-friendly.
- **Signature canvas:** `signature_pad` directly (no React wrapper). Smaller; we control the lifecycle.
- **PDF export:** deferred this session. Stub a "Download PDF" button that prints a styled HTML page (`window.print()` with a print stylesheet) — looks identical, no dep, no extra work. Real `@react-pdf/renderer` next session.

### S2.2.5 Copy voice
Landing copy gets rewritten in plain English. No "all-in-one platform." No "streamline." No "seamlessly." Every section is one idea, one sentence to anchor it, one supporting paragraph.

Banned words: *seamlessly, robust, solutions, unlock, leverage, empower, supercharge, transform.* If I catch myself reaching for one, the section needs rewriting.

## S2.3 Schema additions

Migration `0002_features.sql` is additive — no breaking changes to foundation tables.

### Update to `appointments` (the table from session 1)
Add columns to match the richer form:

| Column | Type | Notes |
|---|---|---|
| `client_name` | text | the company or person being notarized for |
| `location_address` / `location_city` / `location_state` / `location_zip` | text | split for map/sort |
| `document_type` | text | "Loan signing", "POA", "Will", etc. |

`location` (single text) is dropped in favor of the four split columns. `title` becomes optional and is derived as `document_type — client_name`.

### Update to `journal_entries`
Add the legally-relevant columns:

| Column | Type | Notes |
|---|---|---|
| `appointment_id` | uuid nullable | link from form auto-fill |
| `signer_address` | text |  |
| `id_type` | text | "Driver's license" / "Passport" / etc. |
| `id_number_last4` | text | **only last 4 stored** — never the full number |
| `id_issuing_state` | text |  |
| `witness_name` | text nullable |  |
| `signature_svg` | text | the captured signature as SVG path data |
| `fee_charged_cents` | integer | (rename of `fee_cents`) |

**Immutability:** RLS restricts journal entries to INSERT and SELECT — there is no UPDATE policy. The DB enforces append-only at the row level, not the app layer. This is the legally important property.

### New table — `contacts`
Replaces the session-1 `clients` table. Same idea, fuller schema.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK |  |
| `user_id` | uuid FK |  |
| `company_name` | text |  |
| `contact_name` | text |  |
| `contact_role` | text | "Closing coordinator", "Paralegal", etc. |
| `phone` / `email` / `address` | text |  |
| `stage` | enum | `prospect` / `contacted` / `following_up` / `active_client` / `inactive` |
| `notes` | text |  |
| `last_contacted_at` / `next_followup_at` | timestamptz |  |

### New table — `contact_activities`
One row per touch. Surfaces in the contact detail panel and powers reminders.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK |  |
| `contact_id` | uuid FK ON DELETE CASCADE |  |
| `user_id` | uuid | denormalized for RLS |
| `activity_type` | enum | `email` / `call` / `meeting` / `note` |
| `activity_date` | timestamptz |  |
| `summary` | text |  |

RLS pattern: same owner-only policies as everywhere else.

## S2.4 Mobile information architecture

- Desktop: left sidebar (Dashboard, Appointments, Journal, Pipeline, Settings).
- Mobile (< 1024px): bottom tab bar with the same five items. Sidebar collapses entirely. The bottom bar is fixed, 64px tall, safe-area-aware (iOS notch).

## S2.5 What stays "next session"

- Real PDF export for journal (currently print stylesheet).
- Stripe wiring + Pro-paywall conversion flow (currently just an upgrade CTA).
- Mileage tracker (planned but not in this session).
- Invoicing CRUD (table existed in v1; UI deferred).
- Resend templates, Upstash rate limit, cross-tenant integration test (unchanged from session 1).

End of session 2 plan. Building from here.

