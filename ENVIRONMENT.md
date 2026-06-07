# Environment Variables

FORGE reads every secret through `lib/env.ts`, which returns `undefined` for
anything missing so the app **builds and runs without credentials** — each
feature degrades to a demo/disabled state instead of crashing. Copy
`.env.example` → `.env.local` and fill in what you need.

| Variable | Required? | Used by | Notes |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_APP_URL` | Recommended | Stripe redirects, links | Defaults to `http://localhost:3000`. |
| `NEXT_PUBLIC_SUPABASE_URL` | For real data | Supabase clients | Without it the app runs in demo mode (synthetic state). |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | For real data | Supabase (browser/server) | Pairs with the URL above. |
| `SUPABASE_SERVICE_ROLE_KEY` | For admin writes | Stripe webhook, delete account | Server-only. Bypasses RLS — never expose. |
| `DATABASE_URL` | Optional | Drizzle migrations | Direct Postgres connection string. |
| `STRIPE_SECRET_KEY` | For billing | Checkout / portal / cancel | Billing UI shows "not connected" when blank. |
| `STRIPE_WEBHOOK_SECRET` | For billing sync | `/api/stripe/webhook` | Signature verification; required for plan sync. |
| `STRIPE_PRICE_SOLO` | For billing | Checkout | Stripe Price ID. |
| `STRIPE_PRICE_PRO` | For billing | Pro checkout | Stripe Price ID. |
| `RESEND_API_KEY` | Optional | Transactional email | Only when overriding Supabase auth emails. |
| `ANTHROPIC_API_KEY` | For FUEL AI | `/api/fuel/analyze`, `/api/fuel/estimate` | Powers the fridge-scan meal builder + single-plate macro estimator. Falls back to a synthetic demo meal when blank. |

## FUEL AI vision

The FUEL tab's "Scan your fridge" feature and the camera macro estimator both
call Claude. They need:

```bash
ANTHROPIC_API_KEY=sk-ant-...
```

Get one at <https://console.anthropic.com/settings/keys>. The fridge-scan
route (`/api/fuel/analyze`) uses model `claude-sonnet-4-20250514` with vision.
Uploaded images are base64-encoded for the request only and are **never
stored** — they fall out of scope as soon as the response returns.

Without the key, both routes return a deterministic demo meal so the UI is
fully testable offline.
