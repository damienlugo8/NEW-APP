import { NextResponse } from "next/server";
import { env, anthropicConfigured } from "@/lib/env";
import type { AnalyzedMeal } from "@/lib/types/fuel";

/**
 * POST /api/fuel/analyze
 *
 * Body: { image: data:image/...;base64,... }
 * Returns: AnalyzedMeal JSON
 *
 * Calls Claude Sonnet with the vision input and a tight prompt: return ONE
 * JSON object with the macro estimates and a single-line FORGE verdict in
 * a blunt, masculine, no-coddling voice. No coaching, no calorie-shaming,
 * no medical advice — just the numbers and a one-liner.
 *
 * Demo mode (no key): returns a synthetic response so the UI can be tested
 * without an Anthropic account.
 */

export const runtime = "nodejs";          // base64 payload — node, not edge
export const maxDuration = 30;            // Vercel safety margin

const SYSTEM_PROMPT = `You are FUEL — the macro estimator for FORGE, a discipline app.

Your job: look at the photo and estimate calories, protein, carbs, fat for the WHOLE plate (not per-100g). Be blunt and direct. No coaching. No calorie-shaming. No medical disclaimers. Just the numbers and a one-line verdict.

Voice rules:
- Verdict is one sentence, max 12 words.
- Talk like a gym friend who calls things what they are. "Pizza. Bro." or "Eggs and oats — clean." or "Wings and beer. Be honest with yourself."
- Never apologize. Never add "estimate" hedges in the verdict — the user already knows it's an estimate.
- Never recommend a doctor or therapist.

Output ONLY a JSON object, no prose, no markdown fence, this exact shape:
{
  "mealName": "short name, 2-5 words, e.g. 'Chicken, rice, broccoli'",
  "calories": <integer kcal for the whole plate>,
  "proteinG": <integer grams>,
  "carbsG": <integer grams>,
  "fatG": <integer grams>,
  "verdict": "your one-line take"
}`;

interface AnthropicMessagesResponse {
  content?: Array<{ type: string; text?: string }>;
  error?: { message?: string };
}

export async function POST(req: Request) {
  let body: { image?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const image = body.image;
  if (!image || !image.startsWith("data:image/")) {
    return NextResponse.json(
      { error: "Send a data URL: image/jpeg, image/png, image/webp." },
      { status: 400 }
    );
  }

  // Demo fallback — no API key configured.
  if (!anthropicConfigured) {
    const fake: AnalyzedMeal = {
      mealName: "Eggs, oats, banana",
      calories: 540,
      proteinG: 34,
      carbsG: 64,
      fatG: 17,
      verdict: "Clean plate. Keep going.",
    };
    return NextResponse.json(fake);
  }

  // Split the data URL into media type + base64 data
  const match = image.match(/^data:(image\/(?:jpeg|jpg|png|webp|heic|heif));base64,(.+)$/);
  if (!match) {
    return NextResponse.json(
      { error: "Unsupported image format." },
      { status: 400 }
    );
  }
  const mediaType = match[1].replace("image/jpg", "image/jpeg");
  const data = match[2];

  // Heic isn't supported by Claude — reject early.
  if (mediaType === "image/heic" || mediaType === "image/heif") {
    return NextResponse.json(
      { error: "HEIC isn't supported here. Use JPG or PNG." },
      { status: 400 }
    );
  }

  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": env.anthropicKey!,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-5",
        max_tokens: 400,
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image",
                source: {
                  type: "base64",
                  media_type: mediaType,
                  data,
                },
              },
              {
                type: "text",
                text: "Estimate macros for this plate. Return only the JSON.",
              },
            ],
          },
        ],
      }),
    });

    const json = (await r.json()) as AnthropicMessagesResponse;
    if (!r.ok) {
      return NextResponse.json(
        { error: json.error?.message ?? "Vision call failed." },
        { status: 502 }
      );
    }

    const text = json.content?.find((c) => c.type === "text")?.text ?? "";
    const meal = parseAnalyzedMeal(text);
    if (!meal) {
      return NextResponse.json(
        { error: "Couldn't read the response. Try a clearer shot." },
        { status: 502 }
      );
    }
    return NextResponse.json(meal);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Network error." },
      { status: 502 }
    );
  }
}

/** Pull the first {...} JSON object out of the model's text, parse it,
 *  and shape it into AnalyzedMeal. Defensive: clamps numbers to integers,
 *  trims strings, no NaN slips through. */
function parseAnalyzedMeal(text: string): AnalyzedMeal | null {
  // Strip code fences if the model added any.
  const cleaned = text.replace(/```json\s*|```/g, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start < 0 || end < 0 || end <= start) return null;
  let raw: Record<string, unknown>;
  try {
    raw = JSON.parse(cleaned.slice(start, end + 1));
  } catch {
    return null;
  }

  const toInt = (v: unknown): number => {
    const n = typeof v === "number" ? v : parseInt(String(v ?? ""), 10);
    return Number.isFinite(n) ? Math.max(0, Math.round(n)) : 0;
  };
  const toStr = (v: unknown): string => String(v ?? "").trim();

  const name = toStr(raw.mealName);
  if (!name) return null;
  return {
    mealName: name.slice(0, 60),
    calories: toInt(raw.calories),
    proteinG: toInt(raw.proteinG),
    carbsG: toInt(raw.carbsG),
    fatG: toInt(raw.fatG),
    verdict: toStr(raw.verdict).slice(0, 140) || "Logged.",
  };
}
