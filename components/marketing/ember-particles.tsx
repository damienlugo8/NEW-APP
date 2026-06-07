"use client";

import { motion, useReducedMotion } from "framer-motion";

/**
 * Ember particles — 10 small embers drifting slowly upward behind the hero.
 * Not a video, not an image. Deterministic config (no Math.random at render)
 * so SSR and client markup match. Opacity capped at 0.3, slow drift, gentle
 * horizontal sway. Silenced entirely under prefers-reduced-motion.
 */

interface Particle {
  left: number; // %
  size: number; // px
  duration: number; // s
  delay: number; // s
  drift: number; // px horizontal sway amplitude
  opacity: number;
}

const PARTICLES: Particle[] = [
  { left: 8, size: 3, duration: 17, delay: 0, drift: 14, opacity: 0.28 },
  { left: 18, size: 2, duration: 22, delay: 3, drift: -10, opacity: 0.2 },
  { left: 27, size: 4, duration: 15, delay: 6, drift: 18, opacity: 0.3 },
  { left: 39, size: 2, duration: 24, delay: 1.5, drift: -12, opacity: 0.18 },
  { left: 48, size: 3, duration: 19, delay: 8, drift: 10, opacity: 0.26 },
  { left: 58, size: 2, duration: 21, delay: 4, drift: -16, opacity: 0.22 },
  { left: 67, size: 4, duration: 16, delay: 10, drift: 12, opacity: 0.3 },
  { left: 76, size: 3, duration: 23, delay: 2, drift: -8, opacity: 0.24 },
  { left: 85, size: 2, duration: 18, delay: 7, drift: 14, opacity: 0.2 },
  { left: 93, size: 3, duration: 20, delay: 5, drift: -14, opacity: 0.26 },
];

export function EmberParticles() {
  const reduce = useReducedMotion();
  if (reduce) return null;

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
    >
      {PARTICLES.map((p, i) => (
        <motion.span
          key={i}
          className="absolute rounded-full"
          style={{
            left: `${p.left}%`,
            bottom: -8,
            width: p.size,
            height: p.size,
            background: "#FF6B1A",
            boxShadow: "0 0 6px 1px rgba(255,107,26,0.6)",
          }}
          initial={{ y: 0, x: 0, opacity: 0 }}
          animate={{
            y: ["0vh", "-92vh"],
            x: [0, p.drift, 0],
            opacity: [0, p.opacity, p.opacity, 0],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: "linear",
            times: [0, 0.1, 0.85, 1],
          }}
        />
      ))}
    </div>
  );
}
