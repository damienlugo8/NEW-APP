"use client";

import * as React from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Camera, ChevronDown, RefreshCw, Check, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { FridgeScanResult, ScannedMeal } from "@/lib/types/fuel";

/**
 * FUEL — fridge scan, the hero AI moment.
 *
 * Tap "Scan your fridge" → camera/file picker → preview + a cycling loader →
 * two buildable high-protein meal cards. Each card logs to meal_logs or gets
 * dismissed. Designed to be screenshot-worthy: tight card, ember protein
 * stat, blunt tagline.
 *
 * Colors here are intentionally hard-coded hex (not theme tokens) so the
 * card looks identical in any theme — it's a shareable artifact, not chrome.
 */

const EMBER = "#FF6B1A";
const CARD_BG = "#1F1F1F";
const CARD_BORDER = "#2A2A2A";
const TEXT_MUTED = "#A1A1A1";
const TEXT_FAINT = "#6B6B6B";
const DANGER = "#EF4444";

const LOADING_PHRASES = [
  "Scanning ingredients...",
  "Building your meals...",
  "Calculating macros...",
];

type Phase = "idle" | "loading" | "results" | "error";

export function FuelFridgeScan({
  userId,
  onLog,
}: {
  userId: string | null;
  /** Logs the chosen meal (server action + optimistic macro bump). */
  onLog: (meal: ScannedMeal) => Promise<{ ok: boolean; error?: string }>;
}) {
  const reduce = useReducedMotion();
  const fileRef = React.useRef<HTMLInputElement>(null);

  const [phase, setPhase] = React.useState<Phase>("idle");
  const [preview, setPreview] = React.useState<string | null>(null);
  const [result, setResult] = React.useState<FridgeScanResult | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [dismissed, setDismissed] = React.useState<Set<number>>(new Set());

  function reset() {
    setPhase("idle");
    setPreview(null);
    setResult(null);
    setError(null);
    setDismissed(new Set());
    if (fileRef.current) fileRef.current.value = "";
  }

  async function handleFile(file: File) {
    setError(null);
    setResult(null);
    setDismissed(new Set());

    // Local preview for the loading card.
    const dataUrl = await readAsDataURL(file).catch(() => null);
    setPreview(dataUrl);
    setPhase("loading");

    try {
      const fd = new FormData();
      fd.append("image", file);
      if (userId) fd.append("userId", userId);

      const res = await fetch("/api/fuel/analyze", { method: "POST", body: fd });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Scan failed.");
      }
      const json = (await res.json()) as FridgeScanResult;
      if (!json.meals?.length) throw new Error("No meals came back.");
      setResult(json);
      setPhase("results");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Scan failed.");
      setPhase("error");
    }
  }

  const visibleMeals =
    result?.meals.map((m, i) => ({ meal: m, index: i })).filter((x) => !dismissed.has(x.index)) ??
    [];

  return (
    <div>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
        }}
      />

      {/* IDLE — the trigger */}
      {phase === "idle" && (
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className={cn(
            "group w-full flex items-center justify-center gap-2.5 rounded-[12px]",
            "h-[60px] px-5 font-semibold text-[16px] text-white",
            "transition-transform active:translate-y-px"
          )}
          style={{
            background: `linear-gradient(180deg, ${EMBER} 0%, #E25A0F 100%)`,
            boxShadow: "0 6px 20px -6px rgba(255,107,26,0.45)",
          }}
        >
          <Camera size={20} strokeWidth={2} />
          Scan your fridge
        </button>
      )}

      {/* LOADING */}
      {phase === "loading" && (
        <LoadingCard preview={preview} reduce={!!reduce} />
      )}

      {/* ERROR */}
      {phase === "error" && <ErrorCard message={error} onRetry={reset} />}

      {/* RESULTS */}
      {phase === "results" && result && (
        <div className="space-y-3">
          {result.ingredients_detected.length > 0 && (
            <p
              className="text-[12px] uppercase tracking-[0.12em]"
              style={{ fontFamily: "var(--font-mono)", color: TEXT_FAINT }}
            >
              Detected: {result.ingredients_detected.slice(0, 6).join(" · ")}
            </p>
          )}

          <AnimatePresence mode="popLayout">
            {visibleMeals.map(({ meal, index }) => (
              <motion.div
                key={index}
                layout
                initial={reduce ? false : { opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: -8 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              >
                <MealCard
                  meal={meal}
                  onLog={() => onLog(meal)}
                  onDismiss={() =>
                    setDismissed((prev) => new Set(prev).add(index))
                  }
                />
              </motion.div>
            ))}
          </AnimatePresence>

          {visibleMeals.length === 0 && (
            <div
              className="rounded-[12px] border px-5 py-6 text-center"
              style={{ background: CARD_BG, borderColor: CARD_BORDER }}
            >
              <p className="text-[15px] text-white font-medium">Meal logged.</p>
              <p className="mt-1 text-[13px]" style={{ color: TEXT_MUTED }}>
                Macros updated. Scan again whenever.
              </p>
            </div>
          )}

          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center gap-1.5 text-[13px] font-medium hover:opacity-80 transition-opacity"
            style={{ color: EMBER }}
          >
            <RefreshCw size={13} strokeWidth={2} />
            Scan again
          </button>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Loading card — preview + cycling Geist Mono phrases
// ─────────────────────────────────────────────────────────────────────────
function LoadingCard({
  preview,
  reduce,
}: {
  preview: string | null;
  reduce: boolean;
}) {
  const [i, setI] = React.useState(0);
  React.useEffect(() => {
    const t = setInterval(() => setI((n) => (n + 1) % LOADING_PHRASES.length), 1500);
    return () => clearInterval(t);
  }, []);

  return (
    <motion.div
      className="relative overflow-hidden rounded-[12px] border"
      style={{ background: CARD_BG, borderColor: CARD_BORDER }}
      animate={reduce ? undefined : { opacity: [1, 0.72, 1] }}
      transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
    >
      {preview && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={preview}
          alt="Your fridge"
          className="h-44 w-full object-cover opacity-60"
        />
      )}
      <div
        className="absolute inset-0"
        style={{ background: "linear-gradient(180deg, transparent 30%, rgba(31,31,31,0.92) 100%)" }}
      />
      <div className="relative px-5 py-5 flex items-center gap-3">
        <span
          className="h-2 w-2 rounded-full shrink-0"
          style={{ background: EMBER, boxShadow: `0 0 12px ${EMBER}` }}
        />
        <AnimatePresence mode="wait">
          <motion.span
            key={i}
            initial={reduce ? false : { opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: -4 }}
            transition={{ duration: 0.3 }}
            className="text-[14px] tracking-wide"
            style={{ fontFamily: "var(--font-mono)", color: "#fff" }}
          >
            {LOADING_PHRASES[i]}
          </motion.span>
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Error card
// ─────────────────────────────────────────────────────────────────────────
function ErrorCard({
  message,
  onRetry,
}: {
  message: string | null;
  onRetry: () => void;
}) {
  return (
    <div
      className="rounded-[12px] border px-5 py-6"
      style={{ background: CARD_BG, borderColor: CARD_BORDER }}
    >
      <div className="flex items-start gap-2.5">
        <AlertTriangle size={18} strokeWidth={2} style={{ color: DANGER }} className="mt-0.5 shrink-0" />
        <div>
          <p className="text-[15px] font-medium text-white">
            Couldn&apos;t read that photo.
          </p>
          <p className="mt-1 text-[13px]" style={{ color: TEXT_MUTED }}>
            {message && message.length < 80 ? message : "Try better lighting or a closer shot."}
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={onRetry}
        className="mt-4 inline-flex items-center gap-1.5 h-9 px-4 rounded-[8px] text-[13px] font-semibold text-white"
        style={{ background: EMBER }}
      >
        <RefreshCw size={13} strokeWidth={2.25} />
        Try again
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Meal card — the screenshot moment
// ─────────────────────────────────────────────────────────────────────────
function MealCard({
  meal,
  onLog,
  onDismiss,
}: {
  meal: ScannedMeal;
  onLog: () => Promise<{ ok: boolean; error?: string }>;
  onDismiss: () => void;
}) {
  const [openIngredients, setOpenIngredients] = React.useState(false);
  const [logging, setLogging] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);
  const reduce = useReducedMotion();

  async function handleLog() {
    setLogging(true);
    setErr(null);
    const res = await onLog();
    setLogging(false);
    if (res.ok) onDismiss();
    else setErr(res.error ?? "Couldn't log it. Try again.");
  }

  return (
    <article
      className="rounded-[8px] border overflow-hidden"
      style={{ background: CARD_BG, borderColor: CARD_BORDER }}
    >
      <div className="px-5 pt-4 pb-3">
        <h3 className="text-[20px] font-bold text-white leading-tight">{meal.name}</h3>
        {meal.tagline && (
          <p className="mt-1 text-[14px] italic" style={{ color: TEXT_MUTED }}>
            {meal.tagline}
          </p>
        )}
      </div>

      {/* Macro strip */}
      <div
        className="px-5 py-3 flex flex-wrap items-baseline gap-x-5 gap-y-1 border-y"
        style={{ borderColor: CARD_BORDER, fontFamily: "var(--font-mono)" }}
      >
        <MacroStat value={meal.macros.calories} label="cal" />
        <MacroStat value={meal.macros.protein_g} label="protein" suffix="g" hero />
        <MacroStat value={meal.macros.carbs_g} label="carbs" suffix="g" />
        <MacroStat value={meal.macros.fat_g} label="fat" suffix="g" />
      </div>

      <div className="px-5 py-3">
        <p
          className="text-[12px]"
          style={{ fontFamily: "var(--font-mono)", color: TEXT_FAINT }}
        >
          ~{meal.prep_minutes} min
        </p>

        {/* Ingredients — collapsible, closed by default */}
        {meal.ingredients.length > 0 && (
          <div className="mt-3">
            <button
              type="button"
              onClick={() => setOpenIngredients((v) => !v)}
              className="flex items-center gap-1.5 text-[13px] font-medium text-white hover:opacity-80 transition-opacity"
            >
              <ChevronDown
                size={14}
                strokeWidth={2}
                style={{
                  color: EMBER,
                  transform: openIngredients ? "rotate(180deg)" : "none",
                  transition: "transform 0.2s",
                }}
              />
              {meal.ingredients.length} ingredients
            </button>
            <AnimatePresence initial={false}>
              {openIngredients && (
                <motion.ul
                  initial={reduce ? false : { height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                  className="overflow-hidden"
                >
                  <div className="pt-2 space-y-1">
                    {meal.ingredients.map((ing, i) => (
                      <li
                        key={i}
                        className="text-[13px] flex gap-2"
                        style={{ color: TEXT_MUTED }}
                      >
                        <span style={{ color: EMBER }}>·</span>
                        {ing}
                      </li>
                    ))}
                  </div>
                </motion.ul>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Steps */}
        {meal.steps.length > 0 && (
          <ol className="mt-3 space-y-1.5">
            {meal.steps.map((step, i) => (
              <li key={i} className="flex gap-2.5 text-[14px]" style={{ color: TEXT_MUTED }}>
                <span
                  className="shrink-0 font-semibold"
                  style={{ color: TEXT_FAINT, fontFamily: "var(--font-mono)" }}
                >
                  {i + 1}.
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        )}

        {err && (
          <p className="mt-3 text-[12px]" style={{ color: DANGER }}>
            {err}
          </p>
        )}

        {/* Actions */}
        <div className="mt-4 flex items-center gap-2">
          <button
            type="button"
            onClick={handleLog}
            disabled={logging}
            className={cn(
              "flex-1 h-11 inline-flex items-center justify-center gap-2 rounded-[8px]",
              "text-[14px] font-semibold text-white disabled:opacity-60 transition-transform active:translate-y-px"
            )}
            style={{ background: EMBER }}
          >
            {logging ? (
              "Logging…"
            ) : (
              <>
                <Check size={15} strokeWidth={2.5} />
                Log this meal
              </>
            )}
          </button>
          <button
            type="button"
            onClick={onDismiss}
            disabled={logging}
            className="h-11 px-4 rounded-[8px] text-[14px] font-medium disabled:opacity-50 transition-colors"
            style={{ color: TEXT_MUTED, border: `1px solid ${CARD_BORDER}` }}
          >
            Not this one
          </button>
        </div>
      </div>
    </article>
  );
}

function MacroStat({
  value,
  label,
  suffix = "",
  hero = false,
}: {
  value: number;
  label: string;
  suffix?: string;
  hero?: boolean;
}) {
  return (
    <span className="inline-flex items-baseline gap-1">
      <span
        className="text-[18px] font-semibold tabular-nums"
        style={{ color: hero ? EMBER : "#fff" }}
      >
        {value}
        {suffix}
      </span>
      <span className="text-[11px] uppercase tracking-wide" style={{ color: TEXT_FAINT }}>
        {label}
      </span>
    </span>
  );
}

function readAsDataURL(f: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onerror = () => reject(new Error("File read failed."));
    r.onload = () => resolve(String(r.result));
    r.readAsDataURL(f);
  });
}
