"use client";

import * as React from "react";
import { Download, Share2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { tierForStreak, type SquadMember } from "@/lib/types/squad";

/**
 * SQUAD — weekly recap, shareable.
 *
 * Renders a 1080×1920 IG-story PNG entirely on an offscreen canvas: pure
 * black, Bodoni "SQUAD RECAP" lockup, Geist Mono rankings with tier marks.
 * No screenshots, no chrome — a clean asset built to be posted. Uses the
 * Web Share API where available (mobile), falls back to a direct download.
 *
 * Fonts are pulled from the app's CSS custom properties (next/font injects
 * generated family names there), so the canvas matches the live UI exactly.
 */
const W = 1080;
const H = 1920;

export function SquadRecapCard({
  squadName,
  members,
}: {
  squadName: string;
  members: SquadMember[];
}) {
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const ranked = React.useMemo(
    () => [...members].sort((a, b) => b.currentStreak - a.currentStreak),
    [members]
  );

  async function build(): Promise<Blob | null> {
    const canvas = document.createElement("canvas");
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    const css = getComputedStyle(document.documentElement);
    const serif =
      css.getPropertyValue("--font-display-serif").trim() ||
      'Georgia, "Times New Roman", serif';
    const mono =
      css.getPropertyValue("--font-geist-mono").trim() ||
      "ui-monospace, monospace";

    // Make sure both faces are rasterized before we paint.
    try {
      await Promise.all([
        document.fonts.load(`700 96px ${serif}`),
        document.fonts.load(`italic 700 120px ${serif}`),
        document.fonts.load(`600 48px ${mono}`),
        document.fonts.load(`700 56px ${mono}`),
        document.fonts.ready,
      ]);
    } catch {
      /* fall through to system fallbacks */
    }

    const EMBER = "#E8703A";
    const INK = "#FFFFFF";
    const MUTED = "#8A8A8A";
    const FAINT = "#3A3A3A";

    // Background — true black with a faint ember glow at the top.
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, W, H);
    const glow = ctx.createRadialGradient(W / 2, 120, 0, W / 2, 120, 900);
    glow.addColorStop(0, "rgba(232,112,58,0.16)");
    glow.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, W, 1100);

    const PAD = 96;
    ctx.textBaseline = "alphabetic";

    // Eyebrow — squad name in mono caps.
    ctx.font = `600 34px ${mono}`;
    ctx.fillStyle = EMBER;
    ctx.textAlign = "center";
    ctx.fillText(squadName.toUpperCase(), W / 2, 300);

    // Title lockup — Bodoni, two lines.
    ctx.fillStyle = INK;
    ctx.font = `700 132px ${serif}`;
    ctx.fillText("SQUAD", W / 2, 470);
    ctx.font = `italic 700 132px ${serif}`;
    ctx.fillText("RECAP", W / 2, 610);

    // Date range.
    ctx.font = `500 30px ${mono}`;
    ctx.fillStyle = MUTED;
    ctx.fillText(weekRangeLabel(), W / 2, 690);

    // Divider.
    ctx.strokeStyle = FAINT;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(PAD, 770);
    ctx.lineTo(W - PAD, 770);
    ctx.stroke();

    // Ranked rows.
    const rowH = 150;
    let y = 770 + 130;
    ctx.textAlign = "left";

    ranked.slice(0, 5).forEach((m, i) => {
      const rank = i + 1;
      const isTop = rank === 1;

      // Rank numeral.
      ctx.font = `600 64px ${mono}`;
      ctx.fillStyle = isTop ? EMBER : FAINT;
      ctx.textAlign = "left";
      ctx.fillText(String(rank), PAD, y + 22);

      // Handle.
      ctx.font = `${m.isYou ? "700" : "500"} 52px ${mono}`;
      ctx.fillStyle = m.isYou ? EMBER : INK;
      ctx.fillText(m.handle, PAD + 110, y + 22);

      // "YOU" tag.
      if (m.isYou) {
        const hw = ctx.measureText(m.handle).width;
        ctx.font = `600 26px ${mono}`;
        ctx.fillStyle = MUTED;
        ctx.fillText("YOU", PAD + 110 + hw + 24, y + 16);
      }

      // Tier badge + streak (right aligned).
      const tier = tierForStreak(m.currentStreak);
      ctx.textAlign = "right";
      ctx.font = `700 56px ${mono}`;
      ctx.fillStyle = INK;
      ctx.fillText(String(m.currentStreak), W - PAD - 96, y + 22);

      ctx.font = `600 40px ${serif}`;
      ctx.fillStyle = isTop ? EMBER : MUTED;
      ctx.fillText(tier, W - PAD, y + 22);

      // Row separator.
      if (i < Math.min(ranked.length, 5) - 1) {
        ctx.strokeStyle = "#1A1A1A";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(PAD, y + rowH - 56);
        ctx.lineTo(W - PAD, y + rowH - 56);
        ctx.stroke();
      }

      y += rowH;
    });

    // Footer wordmark.
    ctx.textAlign = "center";
    ctx.font = `600 30px ${mono}`;
    ctx.fillStyle = MUTED;
    ctx.fillText("FORGE — Forge yourself. Daily.", W / 2, H - 130);

    return await new Promise<Blob | null>((resolve) =>
      canvas.toBlob((b) => resolve(b), "image/png")
    );
  }

  async function handleShare() {
    setBusy(true);
    setError(null);
    try {
      const blob = await build();
      if (!blob) {
        setError("Couldn't render the recap.");
        return;
      }
      const file = new File([blob], "squad-recap.png", { type: "image/png" });

      // Native share sheet (mobile) — preferred.
      const nav = navigator as Navigator & {
        canShare?: (d: { files: File[] }) => boolean;
      };
      if (nav.canShare?.({ files: [file] }) && navigator.share) {
        await navigator.share({
          files: [file],
          title: "SQUAD RECAP",
          text: `${squadName} — this week.`,
        });
        return;
      }

      // Fallback — download.
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "squad-recap.png";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      // AbortError = user dismissed the share sheet; not an error.
      if ((e as Error)?.name !== "AbortError") {
        setError("Share failed. Try again.");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] px-5 py-4 sm:px-6 flex items-center justify-between gap-4">
      <div className="min-w-0">
        <p className="text-sm font-medium text-[var(--text)]">Weekly recap</p>
        <p className="t-caption text-[var(--text-subtle)] mt-0.5">
          {error ?? "Export the board as a story. Post it. Let them see."}
        </p>
      </div>
      <button
        type="button"
        onClick={handleShare}
        disabled={busy}
        className={cn(
          "shrink-0 inline-flex items-center gap-2 h-11 sm:h-9 px-4 sm:px-3.5 rounded-[var(--radius)]",
          "bg-[var(--accent)] text-[var(--accent-fg)] text-sm font-medium",
          "hover:bg-[var(--accent-hover)] active:scale-[0.97] transition duration-200 disabled:opacity-50"
        )}
      >
        {busy ? (
          <Loader2 size={15} strokeWidth={2} className="animate-spin" />
        ) : canNativeShare() ? (
          <Share2 size={15} strokeWidth={1.75} />
        ) : (
          <Download size={15} strokeWidth={1.75} />
        )}
        {busy ? "Rendering…" : "Share"}
      </button>
    </div>
  );
}

function canNativeShare(): boolean {
  if (typeof navigator === "undefined") return false;
  return typeof navigator.share === "function";
}

function weekRangeLabel(): string {
  const now = new Date();
  const start = new Date(now);
  start.setDate(now.getDate() - 6);
  const fmt = (d: Date) =>
    d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return `${fmt(start)} – ${fmt(now)}`.toUpperCase();
}
