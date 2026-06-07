import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { supabaseServer } from "@/lib/supabase/server";
import { env, anthropicConfigured, supabaseConfigured } from "@/lib/env";
import {
  DEFAULT_SCAN_CALORIE_TARGET,
  DEFAULT_SCAN_PROTEIN_TARGET,
  type FridgeScanResult,
  type ScanTargets,
  type ScannedMeal,
} from "@/lib/types/fuel";

/**
 * POST /api/fuel/analyze — the FUEL fridge-scan meal builder.
 *
 * Multipart form data:
 *   - image:  the uploaded photo (jpg/png/webp, ≤10MB)
 *   - userId: caller's id (targets are pulled from THEIR profile)
 *
 * Flow: auth → read goal+bodyweight → derive macro targets → send the image
 * to Claude with a tight builder prompt → parse the JSON → return it. The
 * image is never persisted; it lives only for the duration of this request.
 *
 * Contract:
 *   - 401 when there's no session (configured mode).
 *   - 400 on a missing / oversized / wrong-type image.
 *   - 500 when the model reply can't be parsed into the meal contract.
 *   - 200 with FridgeScanResult on success.
 *
 * Demo mode (no Anthropic key, or no Supabase): returns a synthetic two-meal
 * result so the UI is fully exercisable without credentials.
 */

export const runtime = "nodejs"; // base64 image payload — node, not edge
export const maxDuration = 30;

const MODEL = "claude-sonnet-4-20250514";
const MAX_BYTES = 10 * 1024 * 1024; // 10MB

const SYSTEM_PROMPT =
  "You are FORGE's nutrition AI. You analyze food photos and fridge contents to build high-protein meals for men trying to hit their macro targets. Be direct and blunt. No fluff. Respond ONLY with valid JSON, no markdown, no preamble.";

type AllowedMedia = "image/jpeg" | "image/png" | "image/webp";

function mediaTypeFor(file: File): AllowedMedia | null {
  const t = (file.type || "").toLowerCase();
  if (t === "image/jpeg" || t === "image/jpg") return "image/jpeg";
  if (t === "image/png") return "image/png";
  if (t === "image/webp") return "image/webp";
  return null;
}

/**
 * Daily targets from goal + bodyweight (lb):
 *   cut      → bw × 12 cal, bw × 1.00 g protein
 *   bulk     → bw × 16 cal, bw × 1.00 g protein
 *   maintain → bw × 14 cal, bw × 0.85 g protein
 * No usable bodyweight → 2200 cal / 160 g protein.
 * Non-body goals (mental/financial) fall back to the maintain formula.
 */
function targetsFor(goal: string | null, weightLb: number | null): ScanTargets {
  if (!weightLb || weightLb <= 0) {
    return {
      calorieTarget: DEFAULT_SCAN_CALORIE_TARGET,
      proteinTarget: DEFAULT_SCAN_PROTEIN_TARGET,
    };
  }
  switch (goal) {
    case "cut":
      return { calorieTarget: Math.round(weightLb * 12), proteinTarget: Math.round(weightLb * 1) };
    case "bulk":
      return { calorieTarget: Math.round(weightLb * 16), proteinTarget: Math.round(weightLb * 1) };
    default: // maintain + mental/financial
      return { calorieTarget: Math.round(weightLb * 14), proteinTarget: Math.round(weightLb * 0.85) };
  }
}

function demoResult(t: ScanTargets): FridgeScanResult {
  return {
    ingredients_detected: ["eggs", "chicken breast", "greek yogurt", "spinach", "rice"],
    meals: [
      {
        name: "Power Scramble",
        tagline: "Five eggs, zero excuses.",
        ingredients: ["5 eggs", "2 cups spinach", "1 cup cooked rice", "1 tbsp olive oil"],
        steps: [
          "Heat oil, wilt the spinach 1 min.",
          "Beat eggs, pour in, scramble on medium.",
          "Plate over warm rice. Salt. Eat.",
        ],
        macros: { calories: Math.min(620, t.calorieTarget), protein_g: Math.max(42, Math.round(t.proteinTarget * 0.3)), carbs_g: 48, fat_g: 28 },
        prep_minutes: 10,
      },
      {
        name: "Cut Bowl",
        tagline: "Lean chicken, no games.",
        ingredients: ["8 oz chicken breast", "1 cup greek yogurt", "2 cups spinach", "hot sauce"],
        steps: [
          "Sear chicken 6 min/side, slice.",
          "Bed of spinach, dollop yogurt.",
          "Top with chicken, drown in hot sauce.",
        ],
        macros: { calories: Math.min(520, t.calorieTarget), protein_g: Math.max(60, Math.round(t.proteinTarget * 0.4)), carbs_g: 14, fat_g: 16 },
        prep_minutes: 14,
      },
    ],
  };
}

export async function POST(req: Request) {
  // ── Parse the multipart body ──────────────────────────────────────────
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Expected multipart form data." }, { status: 400 });
  }

  const image = form.get("image");
  const userId = (form.get("userId") as string | null) ?? null;

  if (!(image instanceof File) || image.size === 0) {
    return NextResponse.json({ error: "No image uploaded." }, { status: 400 });
  }
  if (image.size > MAX_BYTES) {
    return NextResponse.json({ error: "Image too large. Keep it under 10MB." }, { status: 400 });
  }
  const mediaType = mediaTypeFor(image);
  if (!mediaType) {
    return NextResponse.json(
      { error: "Unsupported format. Use JPG, PNG, or WebP." },
      { status: 400 }
    );
  }

  // ── Auth + targets ────────────────────────────────────────────────────
  // Configured mode requires a real session. Demo mode (no Supabase) skips
  // auth so the feature works without an account.
  let targets: ScanTargets = {
    calorieTarget: DEFAULT_SCAN_CALORIE_TARGET,
    proteinTarget: DEFAULT_SCAN_PROTEIN_TARGET,
  };

  if (supabaseConfigured) {
    const sb = await supabaseServer();
    if (!sb) {
      return NextResponse.json({ error: "Auth unavailable." }, { status: 401 });
    }
    const { data: auth } = await sb.auth.getUser();
    if (!auth.user) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }

    // Always resolve targets from the *authenticated* user, not the posted
    // userId — the client value is advisory and never trusted for reads.
    const lookupId = userId && userId === auth.user.id ? userId : auth.user.id;
    const { data: p } = await sb
      .from("profiles")
      .select("primary_goal,weight_lb")
      .eq("id", lookupId)
      .maybeSingle();

    targets = targetsFor(
      (p?.primary_goal as string | null) ?? null,
      (p?.weight_lb as number | null) ?? null
    );
  }

  // ── Demo fallback (no model key) ──────────────────────────────────────
  if (!anthropicConfigured) {
    return NextResponse.json(demoResult(targets));
  }

  // ── Base64 the image (then let it fall out of scope — never stored) ───
  const base64 = Buffer.from(await image.arrayBuffer()).toString("base64");

  const userText = `Analyze what you see. Build 2 meal options using only these ingredients (or a subset of them). Each meal must:
- Hit at least ${targets.proteinTarget}g protein
- Stay under ${targets.calorieTarget} calories
- Take under 15 minutes to prepare
- Use 5 ingredients or fewer

Respond with this exact JSON structure, nothing else:
{
  "ingredients_detected": ["item1", "item2"],
  "meals": [
    {
      "name": "meal name",
      "tagline": "one sentence, FORGE tone, blunt",
      "ingredients": ["item + amount"],
      "steps": ["step 1", "step 2", "step 3"],
      "macros": {
        "calories": 0,
        "protein_g": 0,
        "carbs_g": 0,
        "fat_g": 0
      },
      "prep_minutes": 0
    }
  ]
}`;

  let rawText: string;
  try {
    const client = new Anthropic({ apiKey: env.anthropicKey! });
    const msg = await client.messages.create({
      model: MODEL,
      max_tokens: 1500,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: { type: "base64", media_type: mediaType, data: base64 },
            },
            { type: "text", text: userText },
          ],
        },
      ],
    });
    rawText = msg.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("")
      .trim();
  } catch (e) {
    const message = e instanceof Error ? e.message : "Vision request failed.";
    return NextResponse.json({ error: message }, { status: 502 });
  }

  const result = parseScan(rawText);
  if (!result) {
    return NextResponse.json(
      { error: "Couldn't read that photo. Try better lighting or a closer shot." },
      { status: 500 }
    );
  }

  return NextResponse.json(result);
}

/** Pull the first {...} object out of the model text and shape it into a
 *  FridgeScanResult. Defensive: clamps numbers, trims strings, caps lengths,
 *  and guarantees at least one well-formed meal or returns null. */
function parseScan(text: string): FridgeScanResult | null {
  const cleaned = text.replace(/```json\s*|```/g, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start < 0 || end <= start) return null;

  let raw: unknown;
  try {
    raw = JSON.parse(cleaned.slice(start, end + 1));
  } catch {
    return null;
  }
  if (!raw || typeof raw !== "object") return null;
  const obj = raw as Record<string, unknown>;

  const toInt = (v: unknown): number => {
    const n = typeof v === "number" ? v : parseInt(String(v ?? ""), 10);
    return Number.isFinite(n) ? Math.max(0, Math.round(n)) : 0;
  };
  const toStr = (v: unknown): string => String(v ?? "").trim();
  const toStrArr = (v: unknown): string[] =>
    Array.isArray(v) ? v.map(toStr).filter(Boolean).slice(0, 12) : [];

  const mealsIn = Array.isArray(obj.meals) ? obj.meals : [];
  const meals: ScannedMeal[] = mealsIn
    .slice(0, 2)
    .map((m): ScannedMeal | null => {
      if (!m || typeof m !== "object") return null;
      const mm = m as Record<string, unknown>;
      const name = toStr(mm.name).slice(0, 60);
      if (!name) return null;
      const macros = (mm.macros ?? {}) as Record<string, unknown>;
      return {
        name,
        tagline: toStr(mm.tagline).slice(0, 120),
        ingredients: toStrArr(mm.ingredients),
        steps: toStrArr(mm.steps),
        macros: {
          calories: toInt(macros.calories),
          protein_g: toInt(macros.protein_g),
          carbs_g: toInt(macros.carbs_g),
          fat_g: toInt(macros.fat_g),
        },
        prep_minutes: toInt(mm.prep_minutes),
      };
    })
    .filter((m): m is ScannedMeal => m !== null);

  if (meals.length === 0) return null;

  return {
    ingredients_detected: toStrArr(obj.ingredients_detected),
    meals,
  };
}
