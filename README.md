# NotaryFlow

The notary platform built for solo mobile signing agents — and the only one with a real sales pipeline CRM for outreach to title companies, signing services, and law firms.

This repo contains the **foundation** built in session 1. See [PLANNING.md](./PLANNING.md) for the full architectural reasoning, design system, and what comes next.

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

Open <http://localhost:3000>. The landing page works out of the box. Auth and the dashboard work in **demo mode** (a banner explains how to wire real auth) until you set the Supabase variables.

> Node 20+ recommended. This project uses Next.js 16, React 19, Tailwind v4, and Turbopack.

---

## What's in the box

- **Landing page** at `/` — hero, product mock, "why notaries switch" with comparison table, pricing, footer, legal pages.
- **Auth flow** at `/sign-up`, `/login`, `/forgot-password`, `/reset-password`, `/verify` — Supabase email + password, email verification, password reset.
- **Onboarding wizard** at `/onboarding` — 4 steps, framer-motion transitions, captures the notary's legal name, commission, contact, business.
- **Dashboard** at `/dashboard` — designed empty states for today's signings, monthly earnings, invoices, journal.
- **Settings** at `/settings` (profile) and `/settings/billing` (subscription view + cancel).
- **Stripe webhook** at `/api/stripe/webhook` — signature-verified stub. Billing is deferred until a future session.
- **Health check** at `/api/health`.
- **Dark mode** toggle in the top nav and the app top bar — designed for dark, not inverted.

---

## Setup — Supabase

1. Create a free project at <https://supabase.com>.
2. In **Project Settings → API**, copy:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` (server only — never expose)
3. In **SQL Editor**, paste and run [`lib/db/migrations/0001_init.sql`](./lib/db/migrations/0001_init.sql). This creates every table, enables RLS, adds the policies, and installs the trigger that auto-creates a profile + trial subscription when a user signs up.
4. In **Authentication → URL Configuration**, set the Site URL to `http://localhost:3000` (and your production URL when deployed). Add `/auth/callback` as an allowed redirect URL.
5. Restart `npm run dev`. The demo-mode banner will disappear.

Everything reads/writes via Supabase's JS client with RLS enforced at the database — there is no path to read another user's data short of leaking the service-role key.

---

## Setup — Stripe (deferred)

The webhook handler and subscription schema are already in place; keys aren't wired yet. When you're ready:

1. Create a Stripe account and switch to **test mode**.
2. **Products → +Add product** — create two recurring products:
   - **Solo** — $19 / month
   - **Pro** — $39 / month

   Copy the **price IDs** (`price_xxx`) into `STRIPE_PRICE_SOLO` and `STRIPE_PRICE_PRO`.
3. **Developers → API keys** — copy the secret key into `STRIPE_SECRET_KEY`.
4. **Developers → Webhooks** — add an endpoint pointing at `https://<your-domain>/api/stripe/webhook`. Subscribe to:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`

   Copy the signing secret into `STRIPE_WEBHOOK_SECRET`.
5. The next coding session swaps the webhook stub for real event handlers and wires `/sign-up?plan=…` to Stripe Checkout (subscription mode, `trial_period_days: 14`).

For local webhook testing: `stripe listen --forward-to http://localhost:3000/api/stripe/webhook`.

---

## Setup — Resend (optional)

Supabase's default auth emails ship from a `supabase.io` domain. To send from your own:

1. Create a Resend account and verify your domain.
2. Add `RESEND_API_KEY` to `.env.local`.
3. In Supabase → **Authentication → Email Templates**, override the SMTP settings with Resend's relay (or move to a custom transactional flow we'll add next session).

---

## Deploying to Vercel

```bash
npx vercel
```

Then in the Vercel dashboard:

1. **Settings → Environment Variables** — add everything in `.env.example` (production values).
2. **Settings → Domains** — point your custom domain.
3. **Settings → Functions** — leave defaults; the Stripe webhook needs Node runtime, which is the default for route handlers.
4. Re-run the database migration once in Supabase if you haven't.

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
  (app)/         — dashboard, onboarding, settings, settings/billing
  api/           — stripe/webhook, health
  auth/          — server actions + callback route
components/
  marketing/     — hero, product-mock, why-switch, pricing, nav, footer
  auth/          — forms
  app/           — sidebar, top bar, configure-banner
  ui/            — button, input, card, badge (our customized primitives)
  motion/        — Reveal, Stagger
  brand/         — logo
lib/
  supabase/      — browser/server/admin clients
  auth/          — session helpers
  db/            — Drizzle schema + SQL migrations
  env.ts         — typed env access with graceful fallbacks
```

---

## What's incomplete — and what comes next session

The foundation is in. These are deferred by design:

- **Stripe wiring** — Checkout, customer portal, real webhook logic.
- **Pipeline / CRM UI** — the product's differentiator. Drag-and-drop board, last-contact reminders, revenue by referrer.
- **Calendar** — appointment CRUD, day/week views, ICS export.
- **Journal** — state-aware compliant entries, search, export.
- **Mileage** — trip log, IRS-rate calculator.
- **Invoicing** — invoice CRUD, Stripe payment links, sent/paid/overdue states.
- **Custom Resend email templates** — replacing Supabase's defaults.
- **Upstash rate limit** — middleware on `/auth/*` and `/api/auth/*`.
- **Cross-tenant integration test** — the test that proves user A cannot read user B's journal.
- **Mobile wrapper** — Expo or Capacitor, decided after the web product is solid.

Order of attack next session: **Pipeline CRM first**. That's the differentiator and shapes the rest of the data model.

---

## Security notes

This product handles three flavors of sensitive data — see [PLANNING.md §5](./PLANNING.md) for the full risk register. Day-one mitigations:

- Every table has Row Level Security with an **owner-only** policy pattern. No request leaves the database carrying another user's row.
- The service-role key is server-only (`lib/supabase/admin.ts` has `import "server-only"`).
- The Stripe webhook verifies the signature before doing anything.
- All secrets live in `.env.local`. `.env*` is gitignored except `.env.example`.

---

© NotaryFlow, Inc.
