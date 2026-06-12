"use client";

import type { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";

/**
 * Route-level page transition for the app shell. A single quiet fade-rise —
 * 200ms, the FORGE ease — re-runs on every navigation (template, not layout).
 * Kept minimal on purpose so it composes with per-page header animations.
 * Under reduced motion the initial state is skipped entirely.
 */
export default function Template({ children }: { children: ReactNode }) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}
