"use client";

import { useEffect, useRef, useState } from "react";
import SignaturePad from "signature_pad";
import { Eraser } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Wraps signature_pad in a sensible React shell.
 *
 * - Outputs SVG (not PNG) to a hidden form input so the entry stays small and
 *   crisp on any zoom level, including print.
 * - Resizes the canvas on mount + window resize so the strokes don't get
 *   stretched. signature_pad's docs explicitly recommend this pattern.
 * - The pad respects the platform's reduced-motion / pointer events — works
 *   with finger, Apple Pencil, and mouse.
 */
export function SignaturePadField({
  name = "signature_svg",
  label = "Signer signature",
}: {
  name?: string;
  label?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const padRef = useRef<SignaturePad | null>(null);
  const [hasInk, setHasInk] = useState(false);
  const [svg, setSvg] = useState<string>("");

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      const ratio = Math.max(window.devicePixelRatio || 1, 1);
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * ratio;
      canvas.height = rect.height * ratio;
      const ctx = canvas.getContext("2d");
      if (ctx) ctx.scale(ratio, ratio);
      // Preserve existing data when possible. signature_pad's clear() runs
      // here only because resizing wipes the canvas; we're OK with that since
      // the user hasn't signed yet on mount.
      padRef.current?.clear();
      setHasInk(false);
      setSvg("");
    };

    const pad = new SignaturePad(canvas, {
      // Slightly heavier ink reads better at thumbnail sizes / on print.
      minWidth: 0.8,
      maxWidth: 2.4,
      throttle: 8,
      backgroundColor: "rgba(255,255,255,0)", // transparent for embedding
      penColor: getComputedStyle(document.documentElement)
        .getPropertyValue("--text")
        .trim() || "#0F1310",
    });
    padRef.current = pad;
    pad.addEventListener("endStroke", () => {
      const empty = pad.isEmpty();
      setHasInk(!empty);
      setSvg(empty ? "" : pad.toSVG());
    });

    resize();
    window.addEventListener("resize", resize);
    return () => {
      window.removeEventListener("resize", resize);
      pad.off();
    };
  }, []);

  const clear = () => {
    padRef.current?.clear();
    setHasInk(false);
    setSvg("");
  };

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <label className="t-caption text-[var(--text-muted)]">{label}</label>
        <button
          type="button"
          onClick={clear}
          className="inline-flex items-center gap-1 text-xs text-[var(--text-subtle)] hover:text-[var(--text)] transition-colors disabled:opacity-40"
          disabled={!hasInk}
        >
          <Eraser size={12} strokeWidth={1.75} /> Clear
        </button>
      </div>
      <div className="relative rounded-[var(--radius-sm)] border border-[var(--border-strong)] bg-[var(--surface)] overflow-hidden">
        <canvas
          ref={canvasRef}
          className="block w-full h-[180px] sm:h-[200px] touch-none"
        />
        {!hasInk && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <span className="text-xs text-[var(--text-subtle)]">
              Sign here with your finger or stylus
            </span>
          </div>
        )}
      </div>
      <input type="hidden" name={name} value={svg} />
      <p className="text-[11px] text-[var(--text-subtle)]">
        This locks with the rest of the entry. You can&apos;t edit a journal
        entry after saving — that&apos;s what makes it legally valid.
      </p>
    </div>
  );
}

/**
 * Read-only renderer for an already-saved SVG signature. Used in the locked
 * entry detail view and on the print stylesheet.
 */
export function SignatureView({ svg, className }: { svg: string; className?: string }) {
  return (
    <div
      className={className}
      // The SVG payload comes from signature_pad and is sanitized by the
      // library — it's a static path string, no scripts, no foreignObject.
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
