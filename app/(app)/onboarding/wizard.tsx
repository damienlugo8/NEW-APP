"use client";

import { useActionState, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { completeOnboarding, type OnboardingState } from "./actions";
import { cn } from "@/lib/utils";
import { ArrowLeft, ArrowRight } from "lucide-react";

const STEPS = [
  { id: "name",       title: "What's your full legal name?", sub: "This appears on your invoices and journal." },
  { id: "commission", title: "Where are you commissioned?",  sub: "Your commission details — we'll keep an eye on expiration." },
  { id: "contact",    title: "How can clients reach you?",   sub: "Phone is required. A business name is optional." },
  { id: "review",     title: "Looks right?",                 sub: "Confirm and we'll get you to the dashboard." },
] as const;

const ease = [0.22, 1, 0.36, 1] as const;
const initial: OnboardingState = {};

export function OnboardingWizard() {
  const [step, setStep] = useState(0);
  const [values, setValues] = useState({
    full_legal_name: "",
    commission_state: "",
    commission_expires_at: "",
    notary_id_number: "",
    phone: "",
    business_name: "",
  });
  const [state, action, pending] = useActionState(completeOnboarding, initial);
  const reduce = useReducedMotion();

  const setField = (k: keyof typeof values) =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setValues((v) => ({ ...v, [k]: e.target.value }));

  function canAdvance() {
    if (step === 0) return values.full_legal_name.length >= 2;
    if (step === 1)
      return (
        values.commission_state.length === 2 &&
        values.commission_expires_at !== "" &&
        values.notary_id_number.length > 0
      );
    if (step === 2) return values.phone.length >= 7;
    return true;
  }

  return (
    <div className="w-full max-w-[520px]">
      {/* Progress */}
      <div className="flex items-center gap-2 mb-10">
        {STEPS.map((s, i) => (
          <div
            key={s.id}
            className={cn(
              "h-1 flex-1 rounded-full transition-colors duration-300",
              i <= step ? "bg-[var(--accent)]" : "bg-[var(--border)]"
            )}
          />
        ))}
      </div>
      <p className="t-caption text-[var(--text-subtle)] mb-3">
        Step {step + 1} of {STEPS.length}
      </p>
      <h1 className="t-h2">{STEPS[step].title}</h1>
      <p className="t-body text-[var(--text-muted)] mt-2">{STEPS[step].sub}</p>

      <form action={action} className="mt-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: reduce ? 0 : 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: reduce ? 0 : -8 }}
            transition={{ duration: 0.28, ease }}
            className="flex flex-col gap-4"
          >
            {step === 0 && (
              <Input
                name="full_legal_name"
                label="Full legal name"
                value={values.full_legal_name}
                onChange={setField("full_legal_name")}
                placeholder="Maria del Carmen Rodríguez"
                error={state.fieldErrors?.full_legal_name}
                autoFocus
              />
            )}
            {step === 1 && (
              <div className="flex flex-col gap-4">
                <Input
                  name="commission_state"
                  label="State of commission"
                  value={values.commission_state}
                  onChange={(e) =>
                    setValues((v) => ({
                      ...v,
                      commission_state: e.target.value.toUpperCase().slice(0, 2),
                    }))
                  }
                  placeholder="NJ"
                  maxLength={2}
                  helper="Two-letter postal code."
                  error={state.fieldErrors?.commission_state}
                />
                <Input
                  name="commission_expires_at"
                  label="Commission expires"
                  type="date"
                  value={values.commission_expires_at}
                  onChange={setField("commission_expires_at")}
                  error={state.fieldErrors?.commission_expires_at}
                />
                <Input
                  name="notary_id_number"
                  label="Notary ID number"
                  value={values.notary_id_number}
                  onChange={setField("notary_id_number")}
                  placeholder="123456789"
                  error={state.fieldErrors?.notary_id_number}
                />
              </div>
            )}
            {step === 2 && (
              <div className="flex flex-col gap-4">
                <Input
                  name="phone"
                  label="Phone"
                  type="tel"
                  value={values.phone}
                  onChange={setField("phone")}
                  placeholder="(201) 555-0134"
                  error={state.fieldErrors?.phone}
                />
                <Input
                  name="business_name"
                  label="Business name (optional)"
                  value={values.business_name}
                  onChange={setField("business_name")}
                  placeholder="Ridge Mobile Notary, LLC"
                />
              </div>
            )}
            {step === 3 && (
              <div className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] divide-y divide-[var(--border)]">
                <Row label="Legal name" value={values.full_legal_name} />
                <Row label="Commission" value={`${values.commission_state} · expires ${values.commission_expires_at}`} />
                <Row label="Notary ID" value={values.notary_id_number} mono />
                <Row label="Phone" value={values.phone} mono />
                {values.business_name && <Row label="Business" value={values.business_name} />}
                {/* Hidden inputs so the server action receives values */}
                {Object.entries(values).map(([k, v]) => (
                  <input key={k} type="hidden" name={k} value={v} />
                ))}
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {state.error && (
          <p className="mt-4 text-sm text-[var(--danger)]">{state.error}</p>
        )}

        <div className="flex items-center justify-between mt-8">
          <Button
            type="button"
            variant="ghost"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
          >
            <ArrowLeft size={15} strokeWidth={1.75} /> Back
          </Button>
          {step < STEPS.length - 1 ? (
            <Button
              type="button"
              onClick={() => setStep((s) => s + 1)}
              disabled={!canAdvance()}
            >
              Continue <ArrowRight size={15} strokeWidth={1.75} />
            </Button>
          ) : (
            <Button type="submit" loading={pending}>
              Finish setup
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="px-5 py-3 flex items-center justify-between gap-4">
      <span className="t-caption text-[var(--text-subtle)]">{label}</span>
      <span className={cn("text-sm text-[var(--text)] truncate", mono && "font-mono")}>{value || "—"}</span>
    </div>
  );
}
