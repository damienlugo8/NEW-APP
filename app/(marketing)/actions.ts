"use server";

import { z } from "zod";
import { env } from "@/lib/env";
import { supabaseServer } from "@/lib/supabase/server";

/**
 * Marketing lead capture — "The FORGE Protocol" PDF.
 *
 * Collects an email from the sticky banner and sends a welcome email via the
 * Resend REST API (no SDK dependency). The download link is a placeholder
 * until the actual PDF ships. Best-effort: if Resend isn't configured or the
 * send fails, we still report success to the visitor (we don't show our email
 * plumbing to a prospect) and log server-side for follow-up.
 */

const schema = z.object({ email: z.string().trim().email() });

const FROM = "The FORGE Protocol <protocol@forge.app>";
const DOWNLOAD_URL = `${env.appUrl}/downloads/forge-protocol.pdf`; // placeholder

export async function captureProtocolLead(
  email: string
): Promise<{ ok: boolean; error?: string }> {
  const parsed = schema.safeParse({ email });
  if (!parsed.success) {
    return { ok: false, error: "Enter a valid email." };
  }
  const to = parsed.data.email;

  // 1. Persist the lead FIRST, so an email failure never loses it. Anon insert
  //    is allowed by RLS (protocol_leads). Best-effort: a DB hiccup must not
  //    block the visitor — log and carry on. Duplicate emails hit the unique
  //    index and error harmlessly; we swallow that too.
  try {
    const supabase = await supabaseServer();
    if (supabase) {
      const { error } = await supabase
        .from("protocol_leads")
        .insert({ email: to, source: "landing-page" });
      if (error && error.code !== "23505") {
        // 23505 = unique_violation (already subscribed) — not worth logging loud.
        console.error("[protocol-lead] DB insert failed:", error.message);
      }
    }
  } catch (err) {
    console.error("[protocol-lead] DB insert threw:", err);
  }

  // 2. No provider configured (e.g. local/preview) — lead is saved; accept.
  if (!env.resendKey) return { ok: true };

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM,
        to: [to],
        subject: "Your FORGE Protocol — the 75 Hard guide",
        html: welcomeHtml(),
      }),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      console.error("[protocol-lead] Resend send failed:", res.status, detail);
      // Best-effort: don't block the visitor on our email infra.
      return { ok: true };
    }
    return { ok: true };
  } catch (err) {
    console.error("[protocol-lead] Resend request threw:", err);
    return { ok: true };
  }
}

function welcomeHtml(): string {
  return `
  <div style="background:#0A0A0A;color:#F5F2EC;font-family:Helvetica,Arial,sans-serif;padding:40px 24px;">
    <div style="max-width:480px;margin:0 auto;">
      <p style="font-family:monospace;font-size:13px;letter-spacing:0.18em;color:#FF6B1A;text-transform:uppercase;margin:0 0 24px;">FORGE</p>
      <h1 style="font-size:28px;line-height:1.2;margin:0 0 16px;color:#ffffff;">The FORGE Protocol</h1>
      <p style="font-size:16px;line-height:1.6;color:#A1A1A1;margin:0 0 28px;">
        Here's your 30-page guide to running 75 Hard without quitting on day 9.
        Read it before you start. Then start.
      </p>
      <a href="${DOWNLOAD_URL}"
         style="display:inline-block;background:#FF6B1A;color:#0A0A0A;font-weight:600;
                text-decoration:none;padding:14px 28px;border-radius:10px;font-size:15px;">
        Download the guide
      </a>
      <p style="font-size:13px;color:#6B6B6B;margin:32px 0 0;">
        Forge yourself. Daily.
      </p>
    </div>
  </div>`;
}
