"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, Users, User } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  GOALS,
  VICES,
  PROGRAMS,
  type GoalKey,
  type ViceKey,
  type ProgramKey,
} from "@/lib/types/onboarding";
import { completeOnboarding } from "./actions";

/**
 * FORGE onboarding wizard.
 *
 * Six steps, one question per screen, a single ember progress bar pinned
 * flush to the top of the screen. All step state lives here; on finish we
 * hand a typed payload to completeOnboarding (no FormData). Bodoni
 * headlines, Geist body, Geist Mono numerals, var(--accent) + var(--accent-soft)
 * for every selected state.
 */

const TOTAL = 6;
const ease = [0.16, 1, 0.3, 1] as const;

export function OnboardingWizard() {
  const router = useRouter();
  const reduce = useReducedMotion();
  const [step, setStep] = React.useState(0);
  const [dir, setDir] = React.useState(1);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Step 1 — identity
  const [firstName, setFirstName] = React.useState("");
  const [age, setAge] = React.useState("");
  // Step 2 — body
  const [feet, setFeet] = React.useState("");
  const [inches, setInches] = React.useState("");
  const [weight, setWeight] = React.useState("");
  const [bodyFat, setBodyFat] = React.useState("");
  const [bfSkipped, setBfSkipped] = React.useState(false);
  // Step 3 — goal
  const [goal, setGoal] = React.useState<GoalKey | null>(null);
  // Step 4 — vices
  const [vices, setVices] = React.useState<ViceKey[]>([]);
  // Step 5 — program
  const [program, setProgram] = React.useState<ProgramKey | null>(null);
  // Step 6 — squad
  const [joinSquad, setJoinSquad] = React.useState<boolean | null>(null);

  const heightIn =
    feet || inches ? Number(feet || 0) * 12 + Number(inches || 0) : null;

  function canAdvance(): boolean {
    switch (step) {
      case 0:
        return firstName.trim().length >= 1 && Number(age) >= 13 && Number(age) <= 100;
      case 1:
        return heightIn !== null && heightIn >= 36 && Number(weight) >= 60;
      case 2:
        return goal !== null;
      case 3:
        return true; // vices optional
      case 4:
        return program !== null;
      case 5:
        return joinSquad !== null;
      default:
        return false;
    }
  }

  function go(next: number) {
    setError(null);
    setDir(next > step ? 1 : -1);
    setStep(next);
  }

  function toggleVice(k: ViceKey) {
    setVices((v) => (v.includes(k) ? v.filter((x) => x !== k) : [...v, k]));
  }

  async function finish() {
    if (!canAdvance()) return;
    setSubmitting(true);
    setError(null);
    const res = await completeOnboarding({
      first_name: firstName.trim(),
      age: age ? Number(age) : null,
      height_in: heightIn,
      weight_lb: weight ? Number(weight) : null,
      body_fat_pct: bfSkipped || !bodyFat ? null : Number(bodyFat),
      goal,
      vices,
      program,
      join_squad: joinSquad === true,
    });
    if (!res.ok) {
      setSubmitting(false);
      setError(res.error ?? "Something broke. Try again.");
      return;
    }
    router.push("/daily");
  }

  const isLast = step === TOTAL - 1;
  const progress = ((step + 1) / TOTAL) * 100;

  return (
    <div className="w-full max-w-[520px]">
      {/* Progress bar — pinned flush to the very top of the screen, edge to edge */}
      <div className="fixed inset-x-0 top-0 z-50 h-1 bg-[var(--border)]">
        <motion.div
          className="h-full"
          style={{ background: "var(--accent)" }}
          initial={false}
          animate={{ width: `${progress}%` }}
          transition={{ duration: reduce ? 0 : 0.4, ease }}
        />
      </div>
      <p className="t-caption t-num text-[var(--text-subtle)] mb-8 text-center">
        Step {step + 1} of {TOTAL}
      </p>

      <AnimatePresence mode="wait" custom={dir}>
        <motion.div
          key={step}
          custom={dir}
          initial={reduce ? false : { opacity: 0, x: dir * 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={reduce ? { opacity: 0 } : { opacity: 0, x: dir * -24 }}
          transition={{ duration: reduce ? 0.15 : 0.3, ease }}
        >
          {step === 0 && (
            <Step headline="What do we call you?">
              <div className="flex flex-col gap-5">
                <Input
                  label="First name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Damien"
                  autoFocus
                  maxLength={40}
                />
                <div>
                  <p className="t-caption text-[var(--text-muted)] mb-1.5">How old are you?</p>
                  <Input
                    type="number"
                    inputMode="numeric"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    placeholder="24"
                    className="font-mono tabular-nums max-w-[140px]"
                    min={13}
                    max={100}
                  />
                </div>
              </div>
            </Step>
          )}

          {step === 1 && (
            <Step headline="Let's baseline you." sub="Numbers now mean progress later.">
              <div className="flex flex-col gap-5">
                <div>
                  <p className="t-caption text-[var(--text-muted)] mb-1.5">Height</p>
                  <div className="flex items-end gap-3">
                    <UnitInput value={feet} onChange={setFeet} unit="ft" placeholder="5" max={8} />
                    <UnitInput value={inches} onChange={setInches} unit="in" placeholder="10" max={11} />
                  </div>
                </div>
                <div>
                  <p className="t-caption text-[var(--text-muted)] mb-1.5">Weight</p>
                  <UnitInput value={weight} onChange={setWeight} unit="lbs" placeholder="180" max={700} wide />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="t-caption text-[var(--text-muted)]">Body fat %</p>
                    <button
                      type="button"
                      onClick={() => {
                        setBfSkipped((s) => !s);
                        setBodyFat("");
                      }}
                      className={cn(
                        "t-caption transition-colors inline-flex items-center px-2 -mx-2 py-4 -my-4",
                        bfSkipped
                          ? "text-[var(--accent)]"
                          : "text-[var(--text-subtle)] hover:text-[var(--text-muted)]"
                      )}
                    >
                      {bfSkipped ? "skipped — tap to enter" : "skip"}
                    </button>
                  </div>
                  {!bfSkipped && (
                    <UnitInput value={bodyFat} onChange={setBodyFat} unit="%" placeholder="15" max={70} />
                  )}
                </div>
              </div>
            </Step>
          )}

          {step === 2 && (
            <Step headline="What are you actually here for?">
              <div className="flex flex-col gap-2.5">
                {GOALS.map((g) => (
                  <SelectCard
                    key={g.key}
                    selected={goal === g.key}
                    onClick={() => setGoal(g.key)}
                    icon={<g.icon size={20} strokeWidth={1.75} />}
                    title={g.label}
                    blurb={g.blurb}
                  />
                ))}
              </div>
            </Step>
          )}

          {step === 3 && (
            <Step
              headline="What's holding you back?"
              sub="Pick everything that applies."
            >
              <div className="grid grid-cols-2 gap-2.5">
                {VICES.map((v) => {
                  const on = vices.includes(v.key);
                  return (
                    <button
                      key={v.key}
                      type="button"
                      onClick={() => toggleVice(v.key)}
                      className={cn(
                        "flex min-h-[64px] items-center gap-2.5 rounded-[var(--radius)] border px-4 py-3 text-left transition-all active:scale-[0.97]",
                        !on && "border-[var(--border)] hover:border-[var(--border-strong)]"
                      )}
                      style={
                        on
                          ? { borderColor: "var(--accent)", background: "var(--accent-soft)" }
                          : undefined
                      }
                    >
                      <v.icon
                        size={17}
                        strokeWidth={1.75}
                        style={{ color: on ? "var(--accent)" : "var(--text-subtle)" }}
                      />
                      <span className="text-sm font-medium text-[var(--text)]">
                        {v.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </Step>
          )}

          {step === 4 && (
            <Step headline="Pick your first program.">
              <div className="flex flex-col gap-2.5">
                {PROGRAMS.map((p) => (
                  <SelectCard
                    key={p.key}
                    selected={program === p.key}
                    onClick={() => setProgram(p.key)}
                    icon={<p.icon size={20} strokeWidth={1.75} />}
                    title={p.label}
                    blurb={p.blurb}
                    featured={p.featured}
                  />
                ))}
              </div>
            </Step>
          )}

          {step === 5 && (
            <Step
              headline="Accountability or solo?"
              sub="Your call. You can change this later."
            >
              <div className="flex flex-col gap-2.5">
                <SelectCard
                  selected={joinSquad === true}
                  onClick={() => setJoinSquad(true)}
                  icon={<Users size={20} strokeWidth={1.75} />}
                  title="Match me with a squad"
                  blurb="Four others chasing the same standard. Anonymous."
                />
                <SelectCard
                  selected={joinSquad === false}
                  onClick={() => setJoinSquad(false)}
                  icon={<User size={20} strokeWidth={1.75} />}
                  title="Skip for now"
                  blurb="Go solo. Join a squad whenever you're ready."
                />
              </div>
            </Step>
          )}
        </motion.div>
      </AnimatePresence>

      {error && <p className="mt-5 text-sm text-[var(--danger)]">{error}</p>}

      {/* Nav */}
      <div className="mt-9 flex items-center justify-between">
        <Button
          type="button"
          variant="ghost"
          onClick={() => go(Math.max(0, step - 1))}
          disabled={step === 0 || submitting}
          className={step === 0 ? "invisible" : undefined}
        >
          <ArrowLeft size={15} strokeWidth={1.75} /> Back
        </Button>

        {isLast ? (
          <Button type="button" onClick={finish} loading={submitting} disabled={!canAdvance()}>
            {!submitting && <Check size={15} strokeWidth={2} />}
            {submitting ? "Forging…" : "Enter FORGE"}
          </Button>
        ) : (
          <Button type="button" onClick={() => go(step + 1)} disabled={!canAdvance()}>
            Continue <ArrowRight size={15} strokeWidth={1.75} />
          </Button>
        )}
      </div>
    </div>
  );
}

// ── Building blocks ───────────────────────────────────────────────────────

function Step({
  headline,
  sub,
  children,
}: {
  headline: string;
  sub?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h1 className="font-serif text-[32px] sm:text-[40px] leading-[1.12] text-[var(--text)] text-center text-balance">
        {headline}
      </h1>
      {sub && <p className="t-body text-[var(--text-muted)] mt-3 text-center">{sub}</p>}
      <div className="mt-8">{children}</div>
    </div>
  );
}

function SelectCard({
  selected,
  onClick,
  icon,
  title,
  blurb,
  featured,
}: {
  selected: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
  blurb: string;
  featured?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group relative flex min-h-[64px] items-center gap-3.5 w-full rounded-[var(--radius)] border px-5 py-4 text-left transition-all active:scale-[0.97]",
        !selected &&
          (featured
            ? "border-[var(--border-strong)] hover:border-[var(--accent)]"
            : "border-[var(--border)] hover:border-[var(--border-strong)]")
      )}
      style={
        selected
          ? {
              borderColor: "var(--accent)",
              background: "var(--accent-soft)",
              boxShadow:
                "0 0 0 1px var(--accent), 0 0 24px -8px var(--accent)",
            }
          : undefined
      }
    >
      <span
        className="shrink-0 inline-flex h-10 w-10 items-center justify-center rounded-full transition-colors"
        style={{
          background: selected
            ? "color-mix(in oklab, var(--accent) 20%, transparent)"
            : "var(--surface-2)",
          color: selected ? "var(--accent)" : "var(--text-subtle)",
        }}
      >
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="text-[15px] font-semibold tracking-[-0.01em] text-[var(--text)]">
            {title}
          </span>
          {featured && !selected && (
            <span
              className="t-caption px-1.5 py-0.5 rounded-full"
              style={{
                color: "var(--accent)",
                background: "color-mix(in oklab, var(--accent) 16%, transparent)",
              }}
            >
              Featured
            </span>
          )}
        </span>
        <span className="block text-xs leading-snug text-[var(--text-muted)] mt-1">
          {blurb}
        </span>
      </span>
      <span
        className={cn(
          "shrink-0 h-5 w-5 rounded-full border inline-flex items-center justify-center transition-colors",
          selected ? "border-transparent" : "border-[var(--border-strong)]"
        )}
        style={selected ? { background: "var(--accent)" } : undefined}
        aria-hidden
      >
        {selected && <Check size={13} strokeWidth={3} className="text-white" />}
      </span>
    </button>
  );
}

function UnitInput({
  value,
  onChange,
  unit,
  placeholder,
  max,
  wide,
}: {
  value: string;
  onChange: (v: string) => void;
  unit: string;
  placeholder?: string;
  max?: number;
  wide?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center rounded-[var(--radius-sm)] border border-[var(--border-strong)] bg-[var(--surface)]",
        "focus-within:border-[var(--accent)] transition-colors",
        wide ? "w-[160px]" : "w-[110px]"
      )}
    >
      <input
        type="number"
        inputMode="numeric"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        max={max}
        min={0}
        className="w-full h-11 bg-transparent px-3 text-[var(--text)] font-mono tabular-nums placeholder:text-[var(--text-subtle)] focus:outline-none"
      />
      <span className="px-3 text-sm text-[var(--text-subtle)] select-none">{unit}</span>
    </div>
  );
}
