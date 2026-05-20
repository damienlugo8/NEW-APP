# NotaryFlow — Handoff Brief for a New Claude Session

This is a self-contained briefing on the project so a fresh Claude can pick up where the previous one left off. Read this once, then look at `README.md` and `PLANNING.md` if you need the long versions.

**Repo:** https://github.com/damienlugo8/NEW-APP (branch `main`)
**Local clone:** `/Users/damienlugo/Developer/notaryflow`
**Latest commit:** `3124149` — "Ship landing rewrite + Appointments, Journal, Pipeline (session 2)"

---

## 1. What this product is

**NotaryFlow** is a mobile-first SaaS for solo US mobile notaries and loan signing agents. The wedge: it's the only notary platform with a real **sales pipeline CRM** for outreach to title companies, signing services, and law firms. Competitors (Notary Gadget, NotaryAssist, Jurat) only help notaries log work *after* they've been hired. NotaryFlow helps them find clients in the first place.

**Target user:** 1-person notary business, runs on their phone between signings, $50–200 per signing, drives 100–300 miles/week, juggles 5–20 active client relationships.

**Pricing model (designed, not yet wired to Stripe):**
- Solo: $19/mo — appointments, journal, invoices
- Pro: $39/mo — adds the pipeline CRM (the differentiator)
- 14-day free trial, no card required

---

## 2. Tech stack

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js 16.2.6 (App Router, Turbopack) | Server components, server actions, fast |
| UI | React 19.2.4, TypeScript strict | — |
| Styling | Tailwind v4 (@theme inline) | Design tokens as CSS vars |
| DB / Auth | Supabase (Postgres + Auth + RLS) via `@supabase/ssr` | Free tier, RLS is non-negotiable for legal data |
| ORM | Drizzle | Types + raw SQL migrations |
| Validation | Zod | Server-action input |
| Animation | Framer Motion (`motion`) | Reveal/Stagger primitives, slide-in panels |
| Icons | `lucide-react` ^1.14.0 | Note: this is a real version, not 0.x |
| DnD | `@dnd-kit/core` + `sortable` + `utilities` | Pipeline kanban |
| Signatures | `signature_pad` (vanilla, wrapped in React) → SVG | No PDF library needed |
| Dates | `date-fns` | — |
| Variants | `class-variance-authority` | Button variants |
| Billing | Stripe — **deferred** (webhook stub only) | Wired in a future session |

---

## 3. What's been built (the two sessions)

### Session 1 (commit `46ed922`) — Foundation
- Marketing site (`/`) — hero, features, pricing, FAQ, footer, legal pages
- Auth (`/sign-up`, `/login`, `/forgot-password`, `/reset-password`, `/verify`)
- Onboarding wizard (`/onboarding`) — captures legal name, commission state/expiration/ID, phone, business name
- App shell — sidebar, topbar, settings pages, dashboard skeleton
- Demo-mode pattern — every Supabase-touching helper falls back gracefully so the app runs without env keys
- Stripe webhook stub at `/api/stripe/webhook` (signature-verified, no event handling yet)
- Migration `0001_init.sql` — profiles, subscriptions, appointments, journal_entries, RLS, triggers
- Design tokens (deep emerald accent — `#0F5132` light, `#3CCB7F` dark), Tailwind v4 theme

### Session 2 (commit `3124149`) — Features
- **Landing rewrite** — editorial serif hero, "Why notaries switch" comparison, 4 product feature blocks, three-tier pricing, FAQ
- **Appointments** at `/appointments` — custom month calendar grid (7×6, date-fns), day list, slide-in form panel with structured address + status + fee, framer-motion entry
- **Journal** at `/journal`, `/journal/new`, `/journal/[id]` — **append-only at DB level** (RLS has no UPDATE/DELETE policy), on-screen signature capture (signature_pad → SVG), ID last-4 only, print-as-PDF via system print dialog + print stylesheet
- **Pipeline CRM** at `/pipeline` — 5-stage kanban with @dnd-kit drag-and-drop, list view toggle, contact detail with activity timeline, 3 email templates with mailto: integration, smart follow-up heuristics (7/14/60-day windows by stage). **Pro-gated** — Solo users see a blurred preview overlay
- **Mobile bottom nav** — 5-tab fixed bar with `env(safe-area-inset-bottom)` for iOS, hidden on `lg+` and print
- **Real dashboard data** — today's signings, month-to-date earnings, locked journal count, overdue follow-up nudges, quick-add panel, hour-based greeting
- **Migration `0002_features.sql`** — appointment + journal column extensions, `contacts` and `contact_activities` tables, journal append-only RLS lockdown, `bump_last_contacted` trigger

---

## 4. File map (what lives where)

```
app/
  (marketing)/   landing page, legal pages
    page.tsx                        — landing
    legal/{privacy,terms}/page.tsx
  (auth)/        sign-up, login, forgot-password, reset-password, verify
  (app)/         authenticated app — layout.tsx wraps in Sidebar/TopBar/MobileNav
    dashboard/page.tsx              — real data, greeting, today, stats, follow-ups
    onboarding/page.tsx             — wizard
    appointments/
      page.tsx                      — server component
      actions.ts                    — save/complete/cancel/delete server actions
    journal/
      page.tsx, new/page.tsx, [id]/page.tsx
      actions.ts                    — saveJournalEntryAction ONLY (no edit/delete by design)
    pipeline/
      page.tsx, [id]/page.tsx       — both wrap content in <ProGate>
      actions.ts                    — save/move/delete contact, logActivity
    settings/{page,billing/page}.tsx
  api/
    stripe/webhook/route.ts         — signature-verified stub
    health/route.ts
  auth/
    actions.ts, callback/route.ts

components/
  marketing/   hero, product-mock, why-switch, features, pricing, faq, nav, footer
  auth/        forms
  app/         sidebar, topbar, mobile-nav, configure-banner,
               calendar-grid, appointment-form, appointment-list, appointments-page-client,
               journal-form, journal-list, journal-detail, signature-pad,
               contact-card, contact-form, contact-detail, contact-list,
               kanban-column, pipeline-kanban, pipeline-page-client,
               activity-log, email-templates, pro-gate
  ui/          button, input, select, textarea, badge, card
  motion/      Reveal, Stagger
  brand/       logo

lib/
  supabase/    browser.ts, server.ts, admin.ts (server-only)
  auth/        session.ts (getProfile, getUser), plan.ts (planHasPipeline)
  db/
    schema.ts                       — Drizzle table defs
    migrations/
      0001_init.sql                 — base tables + RLS + triggers
      0002_features.sql             — feature columns + contacts + journal lockdown
    queries/                        — typed query helpers (appointments, journal, contacts)
  types/       appointment.ts, journal.ts, contact.ts
  constants/   states.ts (51 US state codes)
  templates/   email.ts (3 outreach templates with {{vars}})
  env.ts                            — typed env access w/ graceful fallbacks
  utils.ts                          — cn(), usd(), usdCents()
```

---

## 5. Critical patterns to know (don't break these)

### Demo mode
Every Supabase helper returns empty arrays / null when env keys are missing. The app fully renders without a DB — sidebar shows `not-configured@localhost`, a yellow banner explains setup. This is intentional so the user can browse the design before wiring Supabase.

Look at `lib/env.ts` (`supabaseConfigured` flag) and `app/(app)/layout.tsx` (branches on it).

### Row Level Security
Every table has owner-only RLS. There is no path to read another user's data short of leaking `SUPABASE_SERVICE_ROLE_KEY` (which is `server-only`'d).

### Journal is append-only AT THE DATABASE
Migration 0002 drops every UPDATE and DELETE policy from `journal_entries`. There is **no** `editJournalEntryAction` and there must never be one. A notary journal that can be silently edited isn't legally valid. The UI reinforces this with a yellow warning ("This entry locks the moment you save it").

### Print as PDF
No PDF library, no server round-trip. Journal detail has a `@media print` stylesheet in `globals.css` that hides chrome and forces black-on-white. "Print / save PDF" calls `window.print()`. The system print dialog on every modern OS (incl. iOS/Android) offers "Save as PDF."

### Pipeline drag-and-drop tuning
`@dnd-kit` is tuned for mobile + desktop coexistence:
- `PointerSensor` with `activationConstraint: { distance: 6 }` — taps under 6px don't trigger drag, so the inner "Open →" link works
- `TouchSensor` with `activationConstraint: { delay: 180, tolerance: 5 }` — finger scrolling doesn't trigger false drags
- Optimistic state update: card moves instantly, server action persists

### Pro gating
`lib/auth/plan.ts` → `planHasPipeline(plan)` returns true for `trial` and `pro`. In demo mode it returns `"pro"`. The pipeline pages wrap content in `<ProGate active={!planHasPipeline(plan)}>` which renders the real UI underneath but blurs it (`pointer-events-none select-none blur-[3px]`) and overlays an "Upgrade to Pro" card.

### Mobile bottom nav
`components/app/mobile-nav.tsx`. Visible below `lg`, hidden in print. Uses `env(safe-area-inset-bottom)` so it sits above the iOS home indicator. Five tabs: Home / Calendar / Journal / Pipeline / Settings. The desktop `Sidebar` has more items (Clients + Invoices marked "soon"); the mobile nav is the prioritized 5.

### Greeting
`app/(app)/dashboard/page.tsx` shows a different greeting based on hour of day ("Late night" / "Good morning" / "Good afternoon" / "Good evening") + first name from the profile.

---

## 6. How to run it locally

```bash
cd ~/Developer/notaryflow
npm install            # if you haven't
npm run dev            # starts on http://localhost:3000
```

Node 20+. Uses Turbopack so the first request is fast.

**Without Supabase keys**, the app runs in demo mode — every page works visually, but data doesn't persist and sign-up is a no-op.

---

## 7. How to wire real Supabase auth + DB

1. Create free project at https://supabase.com → name it `notaryflow`.
2. Settings → API. Copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role key** → `SUPABASE_SERVICE_ROLE_KEY`
3. `cp .env.example .env.local`, paste them in.
4. In Supabase SQL Editor, run **in order**:
   - `lib/db/migrations/0001_init.sql`
   - `lib/db/migrations/0002_features.sql`
   Both are idempotent.
5. Authentication → URL Configuration:
   - Site URL: `http://localhost:3000`
   - Add `http://localhost:3000/auth/callback` to redirect URLs
6. Restart `npm run dev`. Yellow banner disappears.

---

## 8. What's intentionally NOT built yet (the backlog)

In rough priority order:

1. **Stripe wiring** — Checkout (`/sign-up?plan=…`), customer portal, real webhook event handlers swapping the stub. Schema and webhook signature verification are already in place; just need to flesh out event handling and connect Checkout.
2. **Mileage tracking** — trip log + IRS-rate calculator, tied into appointment completion. Notaries care about this for taxes.
3. **Invoicing** — invoice CRUD, Stripe payment links, sent/paid/overdue states.
4. **Clients table UI** — separate from pipeline contacts (a "client" is a company that has actually paid you; a "contact" is a prospect).
5. **Custom Resend email templates** — replacing Supabase's defaults that ship from `supabase.io`.
6. **Upstash rate limit** — middleware on `/auth/*` and `/api/auth/*`.
7. **Cross-tenant integration test** — proving user A cannot read user B's journal even with a tampered request.
8. **Native mobile shell** — Expo or Capacitor, decided after the web product is solid.

---

## 9. Design system at a glance

- **Accent:** deep emerald `#0F5132` (light) / `#3CCB7F` (dark)
- **Surfaces:** `--bg`, `--surface`, `--surface-2`, `--border`
- **Text:** `--text`, `--text-muted`, `--text-subtle`
- **Type:** `.t-h1`, `.t-h2`, `.t-h3`, `.t-body`, `.t-caption` utility classes (defined in `app/globals.css`)
- **Radius:** `--radius` (8px-ish), `--radius-lg` (12-14px-ish)
- **Designed for dark mode** (not inverted from light)
- **No emoji in UI**, no clutter, editorial typography on marketing

---

## 10. Conventions and gotchas

- **Server actions** live in colocated `actions.ts` files next to the route they serve. They return `{ ok: true }` or `{ ok: false, error }` and use `useActionState` on the client.
- **Form validation** uses zod with an `optionalString` preprocessor (empty string → undefined) so `<input>`s that come back as `""` don't fail required-field checks.
- **`force-dynamic` on every authenticated page** so user-scoped data isn't statically cached.
- **Don't add `editJournalEntryAction`** — see "append-only" above.
- **PATH on macOS:** Homebrew node is at `/opt/homebrew/bin`; if shelling out, `export PATH="/opt/homebrew/bin:$PATH"` first.
- **The shell working directory is volatile** in some environments — always `cd /Users/damienlugo/Developer/notaryflow` (or use absolute paths) at the start of each bash command.
- **Lucide-react is on `^1.14.0`** — this looks weird (most projects are on 0.x), but it's the published version and works.
- The user prefers **direct, screenshot-grounded instructions** over apologetic walls of text when explaining how to do something. They are not a developer.

---

## 11. Deploying to Vercel (when ready)

```bash
cd ~/Developer/notaryflow
npx vercel
```

Then in Vercel dashboard:
1. Settings → Environment Variables — paste everything from `.env.local`.
2. Settings → Domains — point custom domain.
3. Run both migrations in production Supabase if not done.
4. Update Supabase Auth → URL Configuration with the production URL.

Vercel auto-deploys from `main`.

---

## 12. The user's actual situation right now

- Has the code cloned at `~/Developer/notaryflow`.
- Has run it locally — landing page works.
- Tried to sign up — got told they need Supabase. (This is correct demo-mode behavior.)
- Has **not yet** created a Supabase project.
- Has **not yet** deployed to Vercel.
- Wants to actually use the app for real, not just demo-browse.

**Next step for them:** walk through Section 7 above (Supabase setup). Offer to handle the `.env.local` file creation once they paste the 3 keys. Then they can sign up for real, run the 2 SQL migrations, and have a working app.

---

End of brief. Open `PLANNING.md` for design reasoning and `README.md` for user-facing setup. The code is the source of truth.
