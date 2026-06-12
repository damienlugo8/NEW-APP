"use client";

import * as React from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Camera, Pencil, X, Loader2, Sparkles, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { AnalyzedMeal, MealInput } from "@/lib/types/fuel";

/**
 * FUEL — "Log a meal" bottom sheet.
 *
 * Two paths:
 *   A) CAMERA — file input (capture=environment on mobile) → POST the
 *      base64 to /api/fuel/estimate → Claude vision returns macros + a
 *      blunt one-liner verdict. User confirms or edits before saving.
 *   B) MANUAL — five fields (name, kcal, P, C, F) + notes.
 *
 * The sheet is a single component because both paths converge on the same
 * commit handler (an MealInput passed to onSubmit). One sheet, one mental
 * model — Camera or Type, hit Save.
 */
export type LogMealSheetProps = {
  open: boolean;
  onClose: () => void;
  onSubmit: (input: MealInput) => Promise<{ ok: boolean; error?: string }>;
};

type Mode = "choose" | "camera" | "manual";

export function FuelLogMealSheet({ open, onClose, onSubmit }: LogMealSheetProps) {
  const reduce = useReducedMotion();
  const [mode, setMode] = React.useState<Mode>("choose");
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Reset on close
  React.useEffect(() => {
    if (!open) {
      // small delay so the panel slide-out doesn't flicker mid-content swap
      const t = setTimeout(() => {
        setMode("choose");
        setError(null);
        setSubmitting(false);
      }, 200);
      return () => clearTimeout(t);
    }
  }, [open]);

  // Escape closes
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  async function handleSubmit(input: MealInput) {
    setSubmitting(true);
    setError(null);
    const res = await onSubmit(input);
    setSubmitting(false);
    if (!res.ok) {
      setError(res.error ?? "Couldn't save. Try again.");
      return;
    }
    onClose();
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end sm:items-center sm:justify-center"
          initial={reduce ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
        >
          {/* Scrim */}
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="absolute inset-0 bg-black/55 backdrop-blur-[2px]"
          />

          {/* Panel */}
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Log a meal"
            initial={reduce ? false : { y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={reduce ? { opacity: 0 } : { y: 40, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className={cn(
              "relative w-full sm:max-w-[480px]",
              "bg-[var(--surface)] border border-[var(--border)]",
              "rounded-t-[var(--radius-lg)] sm:rounded-[var(--radius-lg)]",
              "shadow-[var(--shadow-md)]",
              "pb-[env(safe-area-inset-bottom)]"
            )}
          >
            <header className="flex items-center justify-between pl-5 pr-2 sm:pr-3 h-14 sm:h-12 border-b border-[var(--border-soft)]">
              <p className="text-sm font-medium text-[var(--text)]">
                {mode === "choose" && "Log a meal"}
                {mode === "camera" && "Snap it"}
                {mode === "manual" && "Type it in"}
              </p>
              <button
                type="button"
                onClick={onClose}
                className="h-11 w-11 sm:h-8 sm:w-8 inline-flex items-center justify-center rounded-[var(--radius-sm)] text-[var(--text-subtle)] hover:bg-[var(--surface-2)] hover:text-[var(--text)] transition active:scale-[0.97]"
                aria-label="Close"
              >
                <X size={15} strokeWidth={1.5} />
              </button>
            </header>

            <div className="p-5">
              {mode === "choose" && (
                <ChoosePane onPickCamera={() => setMode("camera")} onPickManual={() => setMode("manual")} />
              )}
              {mode === "camera" && (
                <CameraPane
                  submitting={submitting}
                  error={error}
                  onError={setError}
                  onSubmit={handleSubmit}
                  onBack={() => setMode("choose")}
                />
              )}
              {mode === "manual" && (
                <ManualPane
                  submitting={submitting}
                  error={error}
                  onSubmit={handleSubmit}
                  onBack={() => setMode("choose")}
                />
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function ChoosePane({
  onPickCamera,
  onPickManual,
}: {
  onPickCamera: () => void;
  onPickManual: () => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-2">
      <ChoiceButton
        icon={<Camera size={17} strokeWidth={1.5} />}
        title="Snap it"
        sub="Camera → AI macros in a few seconds"
        onClick={onPickCamera}
      />
      <ChoiceButton
        icon={<Pencil size={17} strokeWidth={1.5} />}
        title="Type it in"
        sub="You already know the numbers"
        onClick={onPickManual}
      />
    </div>
  );
}

function ChoiceButton({
  icon,
  title,
  sub,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  sub: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-4 py-3 rounded-[var(--radius)]",
        "border border-[var(--border)] bg-[var(--bg)] text-left",
        "hover:bg-[var(--surface-2)] transition active:scale-[0.97]"
      )}
    >
      <span className="h-9 w-9 inline-flex items-center justify-center rounded-full bg-[var(--accent-soft)] text-[var(--accent)]">
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-medium text-[var(--text)]">{title}</span>
        <span className="block text-[12px] leading-snug text-[var(--text-subtle)] mt-0.5">{sub}</span>
      </span>
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Camera path
// ─────────────────────────────────────────────────────────────────────────

function CameraPane({
  submitting,
  error,
  onError,
  onSubmit,
  onBack,
}: {
  submitting: boolean;
  error: string | null;
  onError: (msg: string | null) => void;
  onSubmit: (m: MealInput) => Promise<void>;
  onBack: () => void;
}) {
  const fileRef = React.useRef<HTMLInputElement>(null);
  const [analyzing, setAnalyzing] = React.useState(false);
  const [analyzed, setAnalyzed] = React.useState<AnalyzedMeal | null>(null);
  const [preview, setPreview] = React.useState<string | null>(null);

  async function handleFile(f: File) {
    onError(null);
    setAnalyzing(true);
    try {
      const dataUrl = await readAsDataURL(f);
      setPreview(dataUrl);
      const res = await fetch("/api/fuel/estimate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ image: dataUrl }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Analyzer failed.");
      }
      const meal = (await res.json()) as AnalyzedMeal;
      setAnalyzed(meal);
    } catch (e) {
      onError(e instanceof Error ? e.message : "Analyzer failed.");
    } finally {
      setAnalyzing(false);
    }
  }

  if (!analyzed) {
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

        {analyzing ? (
          <div className="flex flex-col items-center justify-center py-10 gap-3">
            {preview && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={preview}
                alt="Your meal"
                className="h-32 w-32 object-cover rounded-[var(--radius)] border border-[var(--border)]"
              />
            )}
            <div className="flex items-center gap-2 text-[var(--text-subtle)] text-sm">
              <Loader2 size={14} className="animate-spin" />
              Reading the plate…
            </div>
          </div>
        ) : (
          <>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className={cn(
                "w-full h-40 rounded-[var(--radius)] border-2 border-dashed border-[var(--border)]",
                "flex flex-col items-center justify-center gap-2",
                "text-[var(--text-subtle)] hover:text-[var(--text)] hover:border-[var(--accent)]",
                "transition-colors"
              )}
            >
              <Camera size={22} strokeWidth={1.5} />
              <span className="text-sm">Tap to capture</span>
              <span className="t-caption">JPG / PNG / HEIC</span>
            </button>
            {error && <ErrorRow msg={error} />}
            <button
              type="button"
              onClick={onBack}
              className="mt-2 -ml-2 px-2 h-11 sm:h-9 inline-flex items-center t-caption text-[var(--text-subtle)] hover:text-[var(--text)] transition-colors"
            >
              ← back
            </button>
          </>
        )}
      </div>
    );
  }

  // Confirm pane — show the analyzed numbers + verdict, editable.
  return (
    <ConfirmAnalyzed
      analyzed={analyzed}
      preview={preview}
      submitting={submitting}
      error={error}
      onSubmit={onSubmit}
      onRetry={() => {
        setAnalyzed(null);
        setPreview(null);
        onError(null);
      }}
    />
  );
}

function ConfirmAnalyzed({
  analyzed,
  preview,
  submitting,
  error,
  onSubmit,
  onRetry,
}: {
  analyzed: AnalyzedMeal;
  preview: string | null;
  submitting: boolean;
  error: string | null;
  onSubmit: (m: MealInput) => Promise<void>;
  onRetry: () => void;
}) {
  const [name, setName] = React.useState(analyzed.mealName);
  const [kcal, setKcal] = React.useState(String(analyzed.calories));
  const [p, setP] = React.useState(String(analyzed.proteinG));
  const [c, setC] = React.useState(String(analyzed.carbsG));
  const [f, setF] = React.useState(String(analyzed.fatG));

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({
          mealName: name.trim() || analyzed.mealName,
          calories: toInt(kcal),
          proteinG: toInt(p),
          carbsG: toInt(c),
          fatG: toInt(f),
          aiGenerated: true,
        });
      }}
      className="space-y-3"
    >
      {preview && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={preview}
          alt="Your meal"
          className="h-28 w-full object-cover rounded-[var(--radius)] border border-[var(--border)]"
        />
      )}

      <div className="rounded-[var(--radius)] bg-[var(--accent-soft)] px-3 py-2.5 flex gap-2">
        <Sparkles size={13} className="text-[var(--accent)] mt-0.5 shrink-0" />
        <p className="text-[13px] leading-snug text-[var(--text)]">
          {analyzed.verdict}
        </p>
      </div>

      <FormField label="Name">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={fieldClass}
          required
        />
      </FormField>

      <div className="grid grid-cols-4 gap-2">
        <FormField label="kcal" compact>
          <input value={kcal} onChange={(e) => setKcal(e.target.value)} className={numFieldClass} inputMode="numeric" />
        </FormField>
        <FormField label="P (g)" compact>
          <input value={p} onChange={(e) => setP(e.target.value)} className={numFieldClass} inputMode="numeric" />
        </FormField>
        <FormField label="C (g)" compact>
          <input value={c} onChange={(e) => setC(e.target.value)} className={numFieldClass} inputMode="numeric" />
        </FormField>
        <FormField label="F (g)" compact>
          <input value={f} onChange={(e) => setF(e.target.value)} className={numFieldClass} inputMode="numeric" />
        </FormField>
      </div>

      {error && <ErrorRow msg={error} />}

      <div className="flex items-center justify-between gap-3 pt-1">
        <button
          type="button"
          onClick={onRetry}
          className="-ml-2 px-2 h-11 sm:h-9 inline-flex items-center t-caption text-[var(--text-subtle)] hover:text-[var(--text)] transition-colors"
        >
          ← re-snap
        </button>
        <Button type="submit" disabled={submitting} className="active:scale-[0.97]">
          {submitting ? "Saving…" : "Log meal"}
        </Button>
      </div>
    </form>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Manual path
// ─────────────────────────────────────────────────────────────────────────

function ManualPane({
  submitting,
  error,
  onSubmit,
  onBack,
}: {
  submitting: boolean;
  error: string | null;
  onSubmit: (m: MealInput) => Promise<void>;
  onBack: () => void;
}) {
  const [name, setName] = React.useState("");
  const [kcal, setKcal] = React.useState("");
  const [p, setP] = React.useState("");
  const [c, setC] = React.useState("");
  const [f, setF] = React.useState("");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!name.trim()) return;
        onSubmit({
          mealName: name.trim(),
          calories: toInt(kcal),
          proteinG: toInt(p),
          carbsG: toInt(c),
          fatG: toInt(f),
          aiGenerated: false,
        });
      }}
      className="space-y-3"
    >
      <FormField label="Meal">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={fieldClass}
          placeholder="Chicken, rice, broccoli"
          autoFocus
          required
        />
      </FormField>

      <div className="grid grid-cols-4 gap-2">
        <FormField label="kcal" compact>
          <input value={kcal} onChange={(e) => setKcal(e.target.value)} className={numFieldClass} inputMode="numeric" />
        </FormField>
        <FormField label="P (g)" compact>
          <input value={p} onChange={(e) => setP(e.target.value)} className={numFieldClass} inputMode="numeric" />
        </FormField>
        <FormField label="C (g)" compact>
          <input value={c} onChange={(e) => setC(e.target.value)} className={numFieldClass} inputMode="numeric" />
        </FormField>
        <FormField label="F (g)" compact>
          <input value={f} onChange={(e) => setF(e.target.value)} className={numFieldClass} inputMode="numeric" />
        </FormField>
      </div>

      {error && <ErrorRow msg={error} />}

      <div className="flex items-center justify-between gap-3 pt-1">
        <button
          type="button"
          onClick={onBack}
          className="-ml-2 px-2 h-11 sm:h-9 inline-flex items-center t-caption text-[var(--text-subtle)] hover:text-[var(--text)] transition-colors"
        >
          ← back
        </button>
        <Button
          type="submit"
          disabled={submitting || !name.trim()}
          className="active:scale-[0.97]"
        >
          {submitting ? "Saving…" : "Log meal"}
        </Button>
      </div>
    </form>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// shared bits
// ─────────────────────────────────────────────────────────────────────────

const fieldClass = cn(
  "w-full h-11 sm:h-9 px-3 rounded-[var(--radius-sm)] bg-[var(--bg)]",
  "border border-[var(--border)] text-sm text-[var(--text)]",
  "focus:outline-none focus:border-[var(--accent)] transition-colors"
);

// Numeric fields (kcal / P / C / F) render in Geist Mono with tabular figures
// so the digits line up with the dashboard numbers they feed.
const numFieldClass = cn(fieldClass, "font-mono t-num");

function FormField({
  label,
  compact = false,
  children,
}: {
  label: string;
  compact?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span
        className={cn(
          "block t-caption text-[var(--text-subtle)]",
          compact ? "mb-0.5" : "mb-1"
        )}
      >
        {label}
      </span>
      {children}
    </label>
  );
}

function ErrorRow({ msg }: { msg: string }) {
  return (
    <div
      className="flex items-center gap-2 px-3 py-2 rounded-[var(--radius-sm)] text-[12px]"
      style={{
        background: "color-mix(in oklab, var(--danger) 18%, transparent)",
        color: "var(--danger)",
      }}
    >
      <AlertTriangle size={13} strokeWidth={1.75} />
      <span>{msg}</span>
    </div>
  );
}

function toInt(s: string): number | null {
  const n = parseInt(s, 10);
  return Number.isFinite(n) ? n : null;
}

function readAsDataURL(f: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onerror = () => reject(new Error("File read failed."));
    r.onload = () => resolve(String(r.result));
    r.readAsDataURL(f);
  });
}
