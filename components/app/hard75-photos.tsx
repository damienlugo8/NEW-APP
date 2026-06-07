"use client";

import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Camera, Check, X, Loader2, ImageOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { uploadPhotoAction } from "@/app/(app)/hard-75/actions";
import type { ProgressPhoto } from "@/lib/db/queries/photos";

/**
 * Hard 75 — daily progress photos.
 *
 * Three pieces, top to bottom:
 *   1. Today's Photo — prompt card (capture) when none, thumbnail + check
 *      when shot. Tapping a shot opens the full-screen viewer.
 *   2. A horizontal 7-day strip (most recent days). Each cell is a day with
 *      its thumbnail or an empty placeholder. Tapping a populated day opens
 *      the side-by-side comparison vs Day 1.
 *
 * Photos arrive pre-signed (1h) from the server. Upload posts the raw File
 * to a server action which writes to the private bucket and auto-completes
 * the day's "photo" task; we router.refresh() to pull the fresh signed URL.
 */
const ease = [0.16, 1, 0.3, 1] as const;

export function Hard75Photos({
  enrollmentId,
  currentDay,
  photos,
}: {
  enrollmentId: string;
  currentDay: number;
  photos: ProgressPhoto[];
}) {
  const reduce = useReducedMotion();
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  // Full-screen single viewer
  const [viewing, setViewing] = useState<ProgressPhoto | null>(null);
  // Side-by-side comparison (selected day vs Day 1)
  const [comparing, setComparing] = useState<ProgressPhoto | null>(null);

  const byDay = new Map<number, ProgressPhoto>();
  for (const p of photos) if (p.dayNumber != null) byDay.set(p.dayNumber, p);

  const today = byDay.get(currentDay) ?? null;
  const dayOne = byDay.get(1) ?? null;

  // Last 7 days, newest first.
  const stripDays: number[] = [];
  for (let d = currentDay; d >= 1 && stripDays.length < 7; d--) stripDays.push(d);

  function pickFile() {
    setError(null);
    fileRef.current?.click();
  }

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file
    if (!file) return;
    const fd = new FormData();
    fd.set("file", file);
    fd.set("enrollmentId", enrollmentId);
    fd.set("dayNumber", String(currentDay));
    startTransition(async () => {
      const res = await uploadPhotoAction(fd);
      if (!res.ok) {
        setError(res.error ?? "Upload failed. Try again.");
        return;
      }
      router.refresh();
    });
  }

  return (
    <section className="mb-5">
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={onFile}
      />

      {/* ── Today's Photo ─────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-1 mb-2">
        <p className="t-caption text-[var(--text-subtle)]">Today&apos;s photo</p>
        {today && (
          <span className="t-caption inline-flex items-center gap-1 text-[var(--molten)]">
            <Check size={12} strokeWidth={2.5} /> Documented
          </span>
        )}
      </div>

      {today ? (
        <button
          type="button"
          onClick={() => setViewing(today)}
          className="group relative block w-full overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)] aspect-[4/3]"
        >
          <PhotoImg photo={today} sizes="(max-width: 760px) 100vw, 760px" priority />
          <span className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
          <span className="absolute left-3 bottom-3 t-num-mono text-xs text-white/90">
            DAY {today.dayNumber}
          </span>
          <span className="absolute right-3 top-3 h-7 w-7 rounded-full bg-[var(--molten)] inline-flex items-center justify-center shadow-[var(--shadow-md)]">
            <Check size={15} strokeWidth={3} className="text-black" />
          </span>
          <button
            type="button"
            onClick={(ev) => {
              ev.stopPropagation();
              pickFile();
            }}
            disabled={pending}
            className="absolute right-3 bottom-3 t-caption rounded-full bg-black/55 px-3 py-1.5 text-white/90 backdrop-blur-sm hover:bg-black/70 transition-colors"
          >
            {pending ? "Replacing…" : "Retake"}
          </button>
        </button>
      ) : (
        <button
          type="button"
          onClick={pickFile}
          disabled={pending}
          className={cn(
            "group relative flex w-full flex-col items-center justify-center gap-3 rounded-[var(--radius-lg)] border border-dashed border-[var(--border-strong)] bg-[var(--surface)] aspect-[4/3] text-center transition-colors",
            "hover:border-[var(--molten)] hover:bg-[color-mix(in_oklab,var(--molten)_6%,transparent)]"
          )}
        >
          <span className="h-12 w-12 rounded-full inline-flex items-center justify-center bg-[color-mix(in_oklab,var(--molten)_14%,transparent)] text-[var(--molten)]">
            {pending ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              <Camera size={20} strokeWidth={1.75} />
            )}
          </span>
          <span className="px-6">
            <span className="block t-day-serif text-[1.35rem] leading-tight text-[var(--text)]">
              {pending ? "Uploading…" : "Document the work."}
            </span>
            <span className="block t-caption text-[var(--text-subtle)] mt-1">
              One photo, daily.
            </span>
          </span>
        </button>
      )}

      {error && <p className="mt-2 px-1 text-xs text-[var(--danger)]">{error}</p>}

      {/* ── 7-day strip ───────────────────────────────────────────── */}
      {currentDay > 1 && (
        <>
          <p className="t-caption text-[var(--text-subtle)] px-1 mt-5 mb-2">
            Last 7 days
          </p>
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {stripDays.map((d) => {
              const p = byDay.get(d) ?? null;
              return (
                <button
                  key={d}
                  type="button"
                  disabled={!p}
                  onClick={() => p && setComparing(p)}
                  className={cn(
                    "relative shrink-0 w-[72px] aspect-[3/4] overflow-hidden rounded-[var(--radius)] border transition-colors",
                    p
                      ? "border-[var(--border)] hover:border-[var(--molten)]"
                      : "border-dashed border-[var(--border)] bg-[var(--surface)]"
                  )}
                >
                  {p ? (
                    <PhotoImg photo={p} sizes="72px" />
                  ) : (
                    <span className="absolute inset-0 flex items-center justify-center text-[var(--text-subtle)]/50">
                      <ImageOff size={16} strokeWidth={1.5} />
                    </span>
                  )}
                  <span
                    className={cn(
                      "absolute left-1 bottom-1 t-num-mono text-[10px] px-1 rounded",
                      p ? "bg-black/55 text-white/90" : "text-[var(--text-subtle)]"
                    )}
                  >
                    D{d}
                  </span>
                </button>
              );
            })}
          </div>
        </>
      )}

      {/* ── Full-screen single viewer ─────────────────────────────── */}
      <AnimatePresence>
        {viewing && (
          <Overlay onClose={() => setViewing(null)} reduce={!!reduce}>
            <div className="relative w-full max-w-[520px]">
              <div className="relative w-full aspect-[3/4] overflow-hidden rounded-[var(--radius-lg)]">
                <PhotoImg photo={viewing} sizes="(max-width: 520px) 100vw, 520px" />
              </div>
              <p className="mt-3 text-center t-num-mono text-sm text-white/80">
                DAY {viewing.dayNumber} · {viewing.photoDate}
              </p>
            </div>
          </Overlay>
        )}
      </AnimatePresence>

      {/* ── Side-by-side comparison vs Day 1 ──────────────────────── */}
      <AnimatePresence>
        {comparing && (
          <Overlay onClose={() => setComparing(null)} reduce={!!reduce}>
            <div className="w-full max-w-[640px]">
              <div className="grid grid-cols-2 gap-3">
                <ComparePane
                  photo={comparing}
                  label={`DAY ${comparing.dayNumber}`}
                />
                <ComparePane
                  photo={
                    dayOne && dayOne.dayNumber !== comparing.dayNumber
                      ? dayOne
                      : null
                  }
                  label="DAY 1"
                />
              </div>
              <p className="mt-3 text-center t-caption text-white/55">
                {dayOne ? "Then and now." : "No Day 1 photo to compare."}
              </p>
            </div>
          </Overlay>
        )}
      </AnimatePresence>
    </section>
  );
}

// ── Building blocks ─────────────────────────────────────────────────────

function PhotoImg({
  photo,
  sizes,
  priority,
}: {
  photo: ProgressPhoto;
  sizes: string;
  priority?: boolean;
}) {
  if (!photo.url) {
    return (
      <span className="absolute inset-0 flex items-center justify-center bg-[var(--surface-2)] text-[var(--text-subtle)]">
        <ImageOff size={18} strokeWidth={1.5} />
      </span>
    );
  }
  return (
    <Image
      src={photo.url}
      alt={`Progress photo, day ${photo.dayNumber ?? "?"}`}
      fill
      sizes={sizes}
      priority={priority}
      className="object-cover"
      unoptimized
    />
  );
}

function ComparePane({
  photo,
  label,
}: {
  photo: ProgressPhoto | null;
  label: string;
}) {
  return (
    <div className="relative aspect-[3/4] overflow-hidden rounded-[var(--radius)] border border-white/10 bg-white/5">
      {photo ? (
        <PhotoImg photo={photo} sizes="(max-width: 640px) 50vw, 320px" />
      ) : (
        <span className="absolute inset-0 flex items-center justify-center text-white/30">
          <ImageOff size={20} strokeWidth={1.5} />
        </span>
      )}
      <span className="absolute left-2 bottom-2 t-num-mono text-[11px] px-1.5 py-0.5 rounded bg-black/55 text-white/90">
        {label}
      </span>
    </div>
  );
}

function Overlay({
  children,
  onClose,
  reduce,
}: {
  children: React.ReactNode;
  onClose: () => void;
  reduce: boolean;
}) {
  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-5"
      initial={reduce ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
    >
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-black/85 backdrop-blur-sm"
      />
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="absolute top-4 right-4 z-10 h-9 w-9 inline-flex items-center justify-center rounded-full bg-white/10 text-white/90 hover:bg-white/20 transition-colors"
      >
        <X size={18} strokeWidth={1.75} />
      </button>
      <motion.div
        className="relative z-[1]"
        initial={reduce ? false : { scale: 0.96, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={reduce ? { opacity: 0 } : { scale: 0.96, opacity: 0 }}
        transition={{ duration: 0.24, ease }}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}
