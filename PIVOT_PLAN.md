# NotaryFlow → FORGE — Pivot Plan

> Written before any code changes. This document is the contract between
> what we keep, what we rename, what we rebuild, and what we delete.
> Read this first if you're picking the project up cold.

---

## 0. Why this isn't a rewrite

The bones of the previous product — auth, RLS, Stripe scaffolding, the
Next.js app shell, the design tokens infrastructure, the onboarding
wizard primitive, the kanban primitive, the calendar primitive, every
custom UI primitive built in session 3 (Sparkline, Stat tile,
SectionCard, EmptyState, PageHeader, severity dots, sidebar/topbar
chrome, mobile nav with safe-area inset) — these are reusable
infrastructure. The notary-specific *flesh* (signer names, journal
entries, title companies, deep emerald accent, Instrument Serif warmth)
is what gets replaced.

**Estimated reusable code: ~70%. Replaced: ~30%.**

The single biggest design-language change is tonal: warm + considered +
maternal → cold + direct + masculine. Every retained primitive needs a
re-tune of palette, type, copy, and iconography weight — but not a
rebuild.

---

## 1. Keep — infrastructure that transfers as-is

| Layer | What | Why it transfers |
|---|---|---|
| **Auth** | Supabase email+pw, callback route, middleware session refresh, `/sign-up`, `/login`, `/forgot-password`, `/reset-password`, `/verify` | Same flow. New users sign up; nothing changes mechanically. |
| **Profiles + subscriptions** | `profiles` table, `subscriptions` table, plan enum, sub-status enum | We replace *columns* on profiles (notary fields → body stats + goal), not the table. |
| **Stripe scaffolding** | `/api/stripe/webhook` signature-verified stub, env keys, schema | Add `lifetime` to plan enum; create new products in Stripe ($9.99/mo, $79/yr, $199 lifetime). |
| **RLS pattern** | Owner-only policies on every table, journal append-only pattern | Reused verbatim. The append-only pattern moves from journal → `meal_logs` (one accountability journal stays). |
| **Layout shell** | `app/(app)/layout.tsx`, sidebar + topbar + mobile-nav split | Same chrome. New nav labels (Daily / Fuel / Block / Squad / Forge 75 / Settings). |
| **Design primitives** (session 3 build) | `SectionCard`, `Stat`, `Sparkline`, `EmptyState`, `PageHeader`, severity-dot pattern, brand-wash class, calendar grid, kanban draggable cards | All transfer. Sparkline → streak history. Stat tile → macros. Calendar grid → Apple-Fitness-style ring history. ContactCard draggable → SquadMemberCard. |
| **Demo mode** | `supabaseConfigured` fallback in every query, `<ConfigureBanner>` | Same pattern. Reduces friction during dev. |
| **Print stylesheet pattern** | `@media print` in globals.css | Reused for FORGE 75 "Day 75 Receipt" share image. |
| **Pro gating** | `<ProGate>` blur overlay, `lib/auth/plan.ts` | Reused for BLOCK (Pro-only) and unlimited squads (Pro-only). |

---

## 2. Rename — same shape, new name

| Old route / table | New route / table | What it becomes |
|---|---|---|
| `/dashboard` | `/daily` (default landing) | Today's habit checklist + rating + streak |
| `/appointments` | `/daily` (merged in) — calendar lives at `/daily/history` | Habit logs over time |
| `/journal` | `/fuel` | Photo-to-meal AI + macro tracker + meal log |
| `/pipeline` | `/squad` | Anonymous 5-person leaderboard + respect points |
| `appointments` (table) | `habit_logs` | One row per habit completion per day |
| `journal_entries` (table) | `meal_logs` (and `progress_photos` separately) | Append-only meal log (RLS pattern transfers); progress pics get their own table for retention rules |
| `contacts` (table) | `squad_members` + `squads` | 5-person rosters, no DMs |
| `contact_activities` | DELETE — replaced by `respect_grants` | Respect points only, no comment/like/DM |
| `clients` (table, unused) | DELETE | Was never wired to UI |
| `pipeline_stages` / `pipeline_deals` (unused) | DELETE | Were never wired to UI |
| `invoices` (table, unused) | DELETE | Out of scope |

Profile columns:
| Old | New |
|---|---|
| `full_legal_name` | `display_name` (single field; anonymous handle in `squad_handle`) |
| `business_name` | DROP |
| `commission_state` | DROP |
| `commission_expires_at` | DROP |
| `notary_id_number` | DROP |
| `phone` | KEEP (referral SMS + 2FA later) |
| — | ADD: `age`, `height_in`, `weight_lb`, `body_fat_pct?`, `primary_goal` enum (cut/maintain/bulk/mental/financial), `starter_program` enum, `vices` text[], `apple_health_connected` bool, `squad_handle` (unique) |

---

## 3. Rebuild — same building, new architecture

These are existing files that get gutted and rewritten:

### `app/globals.css` — tokens
- DELETE: emerald accent, warm off-white bg, Instrument Serif loading.
- ADD: **FORGED STEEL** palette (recommended; awaiting Q2 ratification),
  Geist Mono with `font-feature-settings: 'tnum', 'cv11'`, PP Editorial
  New display serif loaded landing-only, film-grain noise layer (6% on
  dark surfaces).
- KEEP: spacing scale, radius scale, motion ease curve (we already use
  `cubic-bezier(0.22, 1, 0.36, 1)` — the brief's `(0.16, 1, 0.3, 1)` is
  a near-identical premium ease-out; we adopt the brief's value).

### `app/(marketing)/page.tsx` and `components/marketing/*`
Complete rebuild. Editorial display headlines, stats band with
huge tabular-mono numbers, "what FORGE replaces" four-phone
consolidation visual, five-pillar full-width sections (not three-column
cards), 75 Hard direct-comparison section, programs gallery, pricing
with $199 lifetime highlighted, FAQ, "Stop being soft" punchline CTA,
press kit route at `/press`, FORGE Protocol PDF email-capture connected
to Resend.

### `app/(app)/onboarding/wizard.tsx`
Existing wizard structure stays (4-step progress rail, motion
transitions, validation). Questions rewrite:
1. Name + age
2. Body stats (height, weight, body fat optional)
3. Primary goal (cut/maintain/bulk/mental/financial)
4. Vices multi-select (phone/porn/nicotine/alcohol/junk food/oversleep/negative self-talk)
5. Starter program (75 Hard / Monk Mode 30 / Cold Plunge January /
   No-Scroll September / Strength Foundations / FORGE Custom)
6. Optional Apple Health (mobile only — gray-out on web v1)
7. Squad match — auto-match into a 5-person squad at similar level, or skip

### `app/(app)/dashboard/page.tsx` → `app/(app)/daily/page.tsx`
The serif-italic greeting moment + day-line synthesis pattern survives,
copy hardens. "Good evening, Damien." → "Day 23. Lock in." The hero
SectionCard becomes today's habit checklist with giant tap targets. The
month-over-month earnings card becomes a streak counter with fire/ember
animation. The Stat tiles become protein/calories/water rings (Apple
Fitness rings, not bars).

### `components/app/sidebar.tsx`, `topbar.tsx`, `mobile-nav.tsx`
Chrome stays exactly as built. Nav labels swap:
Dashboard → **Daily** · Appointments → (merged into Daily) ·
Journal → **Fuel** · Pipeline → **Squad** · *new:* **Forge 75** · *new:* **Block** · Settings.
Active-state accent rail keeps the idiom; color swaps to forge orange.

### `components/brand/logo.tsx`
Current mark is a circle + checkmark (notarial seal). New mark: an
anvil silhouette + ember mark, or wordmark in geometric sans with
tightened tracking. **Designing this is a separate moment — first pass
is wordmark-only in Geist + display serif accent.**

---

## 4. Build new — features without precedent in the codebase

| Tab / feature | Files to create | Notes |
|---|---|---|
| **DAILY** | `app/(app)/daily/page.tsx`, `app/(app)/daily/history/page.tsx`, `components/app/habit-row.tsx`, `components/app/streak-flame.tsx`, `components/app/day-rating.tsx`, `lib/types/habit.ts`, `lib/db/queries/habits.ts` | Big tap-targets, S/A/B/C/D/F rating computed from % completion, ember animation on streak count. |
| **FORGE 75** | `app/(app)/forge-75/page.tsx`, `app/(app)/forge-75/receipt/page.tsx`, `components/app/five-task-tracker.tsx`, `components/app/progress-photo-timeline.tsx`, `components/app/hard-reset-dialog.tsx`, `components/app/day-75-receipt.tsx`, `lib/types/forge75.ts`, `lib/db/queries/forge75.ts` | THE wedge feature. Receipt is gold-foil-on-black, shareable to IG story. |
| **FUEL** | `app/(app)/fuel/page.tsx`, `app/(app)/fuel/scan/page.tsx`, `app/api/fuel/scan/route.ts`, `components/app/macro-ring.tsx`, `components/app/meal-card.tsx`, `components/app/fridge-uploader.tsx`, `lib/ai/vision.ts`, `lib/db/queries/fuel.ts` | Photo → AI vision → 3 meal cards. Photos deleted after analysis. |
| **SQUAD** | `app/(app)/squad/page.tsx`, `app/(app)/squad/global/page.tsx`, `components/app/squad-roster.tsx`, `components/app/respect-grant.tsx`, `components/app/leaderboard-row.tsx`, `lib/db/queries/squad.ts` | Anonymous handles only. No DMs, no comments. Weekly recap shareable. |
| **BLOCK** | `app/(app)/block/page.tsx`, `components/app/block-schedule.tsx` | UI mockup only for v1 web. "Coming to iOS" badge on real blocking. |
| **Virality** | `components/app/share-today-card.tsx`, `components/app/milestone-celebration.tsx`, `app/api/share/route.ts` (image gen), `app/api/referrals/route.ts`, `app/(app)/referrals/page.tsx` | Share Today exports a clean visual. Milestones at day 7/21/75/100/365. |
| **Email** | `lib/email/resend.ts`, `lib/email/templates/daily.tsx`, `lib/email/templates/milestone.tsx`, `app/api/cron/daily-email/route.ts` | Resend + react-email. Daily morning email. |
| **Press kit** | `app/(marketing)/press/page.tsx`, `public/press/*` | Brand assets download, affiliate link generator. |
| **FORGE Protocol PDF** | `public/forge-protocol.pdf` (to be designed externally or via Claude), email-capture form on landing connected to Resend audience | Lead magnet. |

---

## 5. Delete — notary-specific, not coming back

Files to remove outright:
- `components/app/appointment-form.tsx`, `appointment-list.tsx`, `appointments-page-client.tsx`
- `components/app/journal-form.tsx`, `journal-list.tsx`, `journal-detail.tsx`, `signature-pad.tsx`
- `components/app/contact-form.tsx`, `contact-list.tsx`, `contact-detail.tsx`, `contact-card.tsx`, `kanban-column.tsx`, `pipeline-kanban.tsx`, `pipeline-page-client.tsx`, `activity-log.tsx`, `email-templates.tsx`
- `lib/types/appointment.ts`, `journal.ts`, `contact.ts`
- `lib/db/queries/appointments.ts`, `journal.ts`, `contacts.ts`, `earnings.ts`
- `lib/constants/us-states.ts` (notary commission state)
- `lib/templates/*` (notary email templates to title companies)
- `app/(app)/appointments/*`, `journal/*`, `pipeline/*`
- All marketing components (`hero.tsx`, `why-switch.tsx`, `features.tsx`, `pricing.tsx`, `faq.tsx`, `product-mock.tsx`) — rebuilt from scratch
- `HANDOFF.md` and `setup.sh` (notary-specific instructions; rewrite)

Database — *additive* migration `0003_pivot.sql` will:
- DROP tables: `appointments`, `journal_entries`, `contacts`, `contact_activities`, `clients`, `pipeline_stages`, `pipeline_deals`, `invoices` (all in one transaction, with `cascade` since FKs)
- ALTER `profiles`: drop notary columns, add body/goal/squad columns
- ALTER `subscriptions`: add `lifetime` to plan enum
- CREATE: `habits`, `habit_logs`, `programs`, `program_enrollments`, `meal_logs`, `progress_photos`, `squads`, `squad_members`, `respect_grants`, `referrals`, `email_subscribers`
- All with owner-only RLS; `meal_logs` and `progress_photos` append-only (the journal pattern).

The destructive parts are gated behind a single migration file checked
into source. **A git commit on the notary state lands before any of
this runs.**

---

## 6. Design language pivot — the visible delta

| Dimension | NotaryFlow (now) | FORGE (target) |
|---|---|---|
| Accent | Deep emerald `#0F5132` / `#3CCB7F` | **Forge orange `#FF4500`** (recommendation — awaiting Q2) |
| Background (light) | Warm `#FAFAF7` | KILL light mode (recommendation — awaiting Q5) |
| Background (dark) | Green-shifted `#0B0F0C` | Near-black `#0A0A0A` |
| Surface (dark) | `#121815` warm | `#161616` warm-iron |
| Display face | Instrument Serif (warm editorial) | PP Editorial New / Bodoni Moda — landing only, big editorial moments |
| UI face | Geist Sans | Geist Sans — keep |
| Numerals | mixed | Geist Mono everywhere a number lives (streak, macros, rating, timestamps) with `tnum` |
| Tone | "Calendar's clear and nobody's overdue. Good day to chase one new title company." | "Day 23. Three habits left. Lock in." |
| Iconography stroke | 1.5 | 1.5 — keep |
| Shadow language | Soft warm shadow on cards | Flat hairline + 1px borders only; shadow reserved for floating panels |
| Texture | None | 6% film grain noise on dark surfaces |
| Empty state language | "A clean ledger." (italic serif) | "No streak. Start one." (geometric sans, all caps mono on the verb) |
| Hero greeting | "Good evening, Damien." | "Day 23. Lock in." |

---

## 7. What we already built that's *better* than I expected for FORGE

Session 3 polish work transfers brilliantly. Specifically:

1. **Severity dot system** (`calm` / `warn` / `hot` with ring halo on hot)
   already exists. Reuse for vice-tracking: clean / slipping / relapsed.
   The ring-halo treatment on `hot` is exactly what we want on a relapse
   warning.

2. **Sparkline component** is data-agnostic. Plug streak history,
   macro history, or weight curve.

3. **`brand-wash` radial gradient class** drives the hero SectionCard.
   Swap emerald → orange and it's the FORGE 75 hero card.

4. **`t-num-display` + `t-num-mono` typography classes** already use
   tabular numerals. Made for FORGE's big-numbers-are-the-hero aesthetic.

5. **Sidebar left-edge accent rail + mobile-nav top-edge accent rail**
   is exactly the Linear-feeling treatment FORGE wants. No rebuild.

6. **The brand-new-user dashboard branch** in `app/(app)/dashboard/page.tsx`
   uses a page-variant EmptyState with italic serif. The structure
   transfers; the copy + serif gets retuned ("A blank page. Let's put
   your first signing on it." → "Day zero. Lock in.").

7. **Print stylesheet pattern** — gold-foil Day 75 Receipt uses it for
   the same window.print() → PDF trick. Zero deps.

---

## 8. Order of operations (session-by-session)

This session ships **Phase 1 + a usable Phase 2 + Phase 3 wedge**.
Anything past that is honestly multi-session work.

**This session:**
1. Git commit current state (preserve the notary build)
2. Brand rename throughout (NotaryFlow → FORGE)
3. Fonts: install Geist Mono + PP Editorial New (or Bodoni Moda); remove Instrument Serif
4. Palette: apply FORGED STEEL + #FF4500 (pending Q2)
5. Schema migration `0003_pivot.sql` (table drops + new tables)
6. Layout shell: nav labels, accent recolor
7. Onboarding wizard: new questions
8. Landing page rebuild (editorial, lead capture, press route)
9. DAILY tab v1 (habit checklist + streak + rating)
10. FORGE 75 tab v1 (5-task tracker + reset + Day 75 Receipt)

**Session 5:** FUEL (AI vision pipeline)
**Session 6:** SQUAD (matching + leaderboard + respect)
**Session 7:** BLOCK (mockup) + virality (share cards, milestones, referrals)
**Session 8:** Email infra (Resend daily send + FORGE Protocol PDF capture)

The 16-item full-deliverable list is a 4-session arc. I won't ship it
shallow in one session — that's how you get AI slop instead of craft.

---

## 9. Open decisions blocking start

See companion message — five questions need answers before any code
changes ship.

End of plan.
