# NotaryFlow

The notary platform built for solo mobile signing agents — and the only one with a real sales pipeline CRM for outreach to title companies, signing services, and law firms.

See [PLANNING.md](./PLANNING.md) for the full architectural reasoning, design system, and what comes next.

---

## Quick start

```bash
# 1. install dependencies
npm install

# 2. copy env and fill in the keys you have (it runs without them in demo mode)
cp .env.example .env.local

# 3. start dev server
npm run dev
```

Open <http://localhost:3000>. The landing page works out of the box. Auth, dashboard, appointments, journal, and pipeline all work in **demo mode** (a banner explains how to wire real auth) until you set the Supabase variables.

> Node 20+ recommended. This project uses Next.js 16, React 19, Tailwind v4, and Turbopack.

---

## What's in the box

### Marketing
- **Landing** at `/` — editorial serif hero, "Why notaries switch" comparison, product features (Appointments / Journal / Invoices / Pipeline), three-tier pricing, FAQ, footer, legal pages.
- **Minimal nav** — Sign in + Start free trial only, no clutter.

### Auth & onboarding
- **Auth** at `/sign-up`, `/login`, `/forgot-password`, `/reset-password`, `/verify` — Supabase email + password.
- **Onboarding wizard** at `/onboarding` — captures legal name, commission state + expiration + ID number, phone, business name.

### App
- **Dashboard** at `/dashboard` — real today's signings, month-to-date earnings, locked journal count, follow-up nudges from the pipeline, quick-add panel.
- **Appointments** at `/appointments` — custom month calendar + day list, slide-in form panel for new/edit with structured address + status + fee, mobile-first.
- **Journal** at `/journal`, `/journal/new`, `/journal/[id]` — append-only entries with on-screen signature capture (signature_pad → SVG), identity verification fields, locked state UI, **print-as-PDF** view via the system print dialog.
- **Pipeline** at `/pipeline` — drag-and-drop kanban across 5 stages (@dnd-kit), list view toggle, contact detail with activity timeline, three starter email templates with mailto: integration, smart follow-up heuristics. **Pro-gated** — Solo plan users see a blurred preview.
- **Mobile bottom nav** — 5-tab tab bar with `env(safe-area-inset-bottom)` on phones; sidebar on lg+.
- **Settings** at `/settings` and `/settings/billing`.
- **Dark mode** — designed for dark, not inverted.

### Infrastructure
- **Stripe webhook** at `/api/stripe/webhook` — signature-verified stub. Billing wiring deferred.
- **Health check** at `/api/health`.

---

## Setup — Supabase

1. Create a free project at <https://supabase.com>.
2. In **Project Settings → API**, copy:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` (server only — never expose)
3. In **SQL Editor**, run the migrations **in order**:
   - [`lib/db/migrations/0001_init.sql`](./lib/db/migrations/0001_init.sql) — tables, RLS, profile + subscription trigger.
   - [`lib/db/migrations/0002_features.sql`](./lib/db/migrations/0002_features.sql) — appointment + journal extensions, `contacts` and `contact_activities` for the pipeline, **journal append-only RLS** (no UPDATE / DELETE policies), `bump_last_contacted` trigger.

   Both migrations are idempotent — safe to re-run.
4. In **Authentication → URL Configuration**, set Site URL to `http://localhost:3000` (and your production URL when deployed). Add `/auth/callback` as an allowed redirect URL.
5. Restart `npm run dev`. The demo-mode banner disappears.

Every table has Row Level Security. There is no path to read another user's data short of leaking the service-role key. The journal table goes further — it has **INSERT and SELECT policies only**, so an app bug cannot edit or delete a signed entry.

---

## Setup — Stripe (deferred)

The webhook handler and subscription schema are already in place; keys aren't wired yet. When you're ready:

1. Create a Stripe account and switch to **test mode**.
2. **Products → +Add product** — create two recurring products:
   - **Solo** — $19 / month
   - **Pro** — $39 / month (unlocks the pipeline)

   Copy the **price IDs** (`price_xxx`) into `STRIPE_PRICE_SOLO` and `STRIPE_PRICE_PRO`.
3. **Developers → API keys** — copy the secret key into `STRIPE_SECRET_KEY`.
4. **Developers → Webhooks** — add an endpoint pointing at `https://<your-domain>/api/stripe/webhook`. Subscribe to:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`

   Copy the signing secret into `STRIPE_WEBHOOK_SECRET`.
5. A future session swaps the webhook stub for real event handlers and wires `/sign-up?plan=…` to Stripe Checkout (subscription mode, `trial_period_days: 14`, no card required).

For local webhook testing: `stripe listen --forward-to http://localhost:3000/api/stripe/webhook`.

---

## Setup — Resend (optional)

Supabase's default auth emails ship from a `supabase.io` domain. To send from your own:

1. Create a Resend account and verify your domain.
2. Add `RESEND_API_KEY` to `.env.local`.
3. In Supabase → **Authentication → Email Templates**, override the SMTP settings with Resend's relay.

---

## Deploying to Vercel

```bash
npx vercel
```

Then in the Vercel dashboard:

1. **Settings → Environment Variables** — add everything in `.env.example` (production values).
2. **Settings → Domains** — point your custom domain.
3. **Settings → Functions** — defaults are fine; the Stripe webhook needs Node runtime.
4. Run both SQL migrations in Supabase if you haven't.

Vercel auto-deploys from `main`. Push and you're live.

---

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the dev server on `http://localhost:3000` |
| `npm run build` | Production build |
| `npm start` | Run the production build |
| `npm run lint` | ESLint |

---

## File structure (abridged)

See [PLANNING.md §6](./PLANNING.md) for the full reasoning.

```
app/
  (marketing)/   — landing, pricing, legal
  (auth)/        — sign-up, login, forgot, reset, verify
  (app)/         — dashboard, onboarding, settings, appointments, journal, pipeline
  api/           — stripe/webhook, health
  auth/          — server actions + callback route
components/
  marketing/     — hero, product-mock, why-switch, features, pricing, faq, nav, footer
  auth/          — forms
  app/           — sidebar, topbar, mobile-nav, configure-banner,
                   calendar-grid, appointment-form, appointment-list,
                   appointments-page-client, journal-form, journal-list,
                   journal-detail, signature-pad, contact-card, contact-form,
                   contact-detail, contact-list, kanban-column,
                   pipeline-kanban, pipeline-page-client, activity-log,
                   email-templates, pro-gate
  ui/            — button, input, select, textarea, badge, card
  motion/        — Reveal, Stagger
  brand/         — logo
lib/
  supabase/      — browser/server/admin clients
  auth/          — session helpers + plan helper
  db/            — Drizzle schema + SQL migrations + typed query helpers
  types/         — appointment, journal, contact
  constants/     — US states
  templates/     — email templates
  env.ts         — typed env access with graceful fallbacks
  utils.ts       — cn(), usd(), usdCents()
```

---

## Feature mechanics worth knowing

### Journal append-only
Migration 0002 drops every UPDATE and DELETE policy from `journal_entries` and only keeps INSERT + SELECT. There is no `editJournalEntryAction`. This is on purpose — a notary journal that can be silently edited isn't legally valid. The app reinforces this with a yellow warning above the entry form ("This entry locks the moment you save it").

### Print as PDF
Journal detail pages have a print stylesheet (`@media print` in `globals.css`). Tapping "Print / save PDF" calls `window.print()`. The system print dialog on every modern OS — including iOS and Android — lets the user save the printable view as a PDF. No PDF library, no server round-trip.

### Pipeline drag-and-drop
`@dnd-kit/core` with a 6px pointer activation distance (so taps on the inner "Open →" link don't trigger drag) and a 180ms touch hold delay for finger scrolling without false drags. The card move is optimistic — the kanban updates instantly while the server action persists.

### Pro gating
`lib/auth/plan.ts` reads `subscriptions.plan`. The pipeline pages wrap themselves in `<ProGate active={!planHasPipeline(plan)}>`, which renders the real UI underneath but blurs it and overlays an "Upgrade to Pro" card. Trial users see the full pipeline (taste during the trial); Solo plan users see the blur.

### Mobile bottom nav
`components/app/mobile-nav.tsx`. Visible below `lg`, hidden in print. Uses `env(safe-area-inset-bottom)` so it sits above the iOS home indicator. Five tabs: Home, Calendar, Journal, Pipeline, Settings.

---

## What's incomplete

- **Stripe wiring** — Checkout, customer portal, real webhook event handlers.
- **Mileage tracking** — trip log + IRS-rate calculator (tied into appointment completion).
- **Invoicing** — invoice CRUD, Stripe payment links, sent/paid/overdue states.
- **Clients table UI** — separate from pipeline contacts.
- **Custom Resend email templates** — replacing Supabase's defaults.
- **Upstash rate limit** — middleware on `/auth/*` and `/api/auth/*`.
- **Cross-tenant integration test** — proving user A cannot read user B's journal.
- **Native mobile shell** — Expo or Capacitor, decided after the web product is solid.

---

## Security notes

This product handles three flavors of sensitive data — see [PLANNING.md §5](./PLANNING.md) for the full risk register. Day-one mitigations:

- Every table has Row Level Security with an **owner-only** policy pattern. The journal goes further: **append-only** at the DB.
- The service-role key is server-only (`lib/supabase/admin.ts` has `import "server-only"`).
- The Stripe webhook verifies the signature before doing anything.
- All secrets live in `.env.local`. `.env*` is gitignored except `.env.example`.
- The journal stores only **last 4** of any government ID — never the full number.

---

© NotaryFlow, Inc.
