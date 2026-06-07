"use client";

import { useEffect, useRef } from "react";
import { useInView, useMotionValue, animate } from "framer-motion";

/**
 * Count-up ticker. Animates 0 → value once, the first time it scrolls into
 * view. Writes textContent directly off the motion value so the parent never
 * re-renders mid-count. Formats with locale grouping + tabular nums (the span
 * is set in Geist Mono by the caller).
 */
export function NumberTicker({
  value,
  duration = 2,
}: {
  value: number;
  duration?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const mv = useMotionValue(0);

  useEffect(() => {
    if (!inView) return;
    const controls = animate(mv, value, {
      duration,
      ease: [0.16, 1, 0.3, 1],
    });
    const unsub = mv.on("change", (v) => {
      if (ref.current) {
        ref.current.textContent = Math.round(v).toLocaleString("en-US");
      }
    });
    return () => {
      controls.stop();
      unsub();
    };
  }, [inView, value, duration, mv]);

  return (
    <span ref={ref} className="tabular-nums">
      0
    </span>
  );
}
