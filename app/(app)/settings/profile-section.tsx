"use client";

import { useActionState, useState } from "react";
import { Pencil } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { updateProfile, type ProfileState } from "./actions";

const GOAL_LABELS: Record<string, string> = {
  cut: "Cut",
  maintain: "Maintain",
  bulk: "Bulk",
  mental: "Mental toughness",
  financial: "Financial",
};

export type ProfileData = {
  display_name?: string | null;
  age?: number | null;
  primary_goal?: string | null;
  starter_program?: string | null;
};

const initial: ProfileState = {};

export function ProfileSection({ profile }: { profile: ProfileData | null }) {
  const [editing, setEditing] = useState(false);
  const [state, action, pending] = useActionState(
    async (prev: ProfileState, fd: FormData) => {
      const res = await updateProfile(prev, fd);
      if (res.ok) setEditing(false);
      return res;
    },
    initial
  );

  const firstName = (profile?.display_name ?? "").split(" ")[0] || "—";

  return (
    <Card
      title="Profile"
      caption="Profile"
      action={
        !editing && (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="inline-flex items-center gap-1.5 h-11 px-4 sm:h-9 sm:px-3 rounded-[var(--radius-sm)] border border-[var(--border-strong)] text-sm text-[var(--text)] hover:bg-[var(--surface-2)] transition duration-200 active:scale-[0.97]"
          >
            <Pencil size={13} strokeWidth={1.5} aria-hidden />
            Edit
          </button>
        )
      }
    >
      {editing ? (
        <form action={action} className="grid gap-4 sm:grid-cols-2">
          <Input
            name="display_name"
            label="Name"
            defaultValue={profile?.display_name ?? ""}
            error={state.fieldErrors?.display_name}
            className="sm:col-span-2"
            autoFocus
          />
          <Input
            name="age"
            label="Age"
            type="number"
            inputMode="numeric"
            min={13}
            max={120}
            defaultValue={profile?.age ?? ""}
            error={state.fieldErrors?.age}
          />
          <div className="flex flex-col gap-1.5">
            <label htmlFor="primary_goal" className="t-caption text-[var(--text-muted)]">
              Goal
            </label>
            <select
              id="primary_goal"
              name="primary_goal"
              defaultValue={profile?.primary_goal ?? ""}
              className="h-11 w-full px-3 bg-[var(--surface)] text-[var(--text)] border border-[var(--border-strong)] rounded-[var(--radius-sm)] transition-colors duration-150 focus:outline-none focus:border-[var(--accent)]"
            >
              <option value="">Not set</option>
              {Object.entries(GOAL_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <Input
            name="starter_program"
            label="Current program"
            defaultValue={profile?.starter_program ?? ""}
            placeholder="e.g. Hard 75"
            className="sm:col-span-2"
          />
          <div className="sm:col-span-2 flex items-center justify-between gap-3 pt-1">
            <p className="text-sm" aria-live="polite">
              {state.error && <span className="text-[var(--danger)]">{state.error}</span>}
            </p>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setEditing(false)}
                disabled={pending}
              >
                Cancel
              </Button>
              <Button type="submit" size="sm" loading={pending}>
                Save changes
              </Button>
            </div>
          </div>
        </form>
      ) : (
        <dl className="grid gap-x-6 gap-y-5 sm:grid-cols-2">
          <Field label="First name" value={firstName} />
          <Field label="Age" value={profile?.age ? String(profile.age) : "—"} mono />
          <Field
            label="Goal"
            value={profile?.primary_goal ? GOAL_LABELS[profile.primary_goal] ?? "—" : "—"}
          />
          <Field label="Current program" value={profile?.starter_program || "—"} />
        </dl>
      )}
    </Card>
  );
}

function Field({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <dt className="t-caption text-[var(--text-subtle)] mb-1">{label}</dt>
      <dd className={`text-[15px] text-[var(--text)]${mono ? " font-mono t-num" : ""}`}>
        {value}
      </dd>
    </div>
  );
}

// Shared card chrome for every settings section.
export function Card({
  title,
  caption,
  action,
  children,
}: {
  title: string;
  caption?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-6">
      <div className="flex items-start justify-between gap-3 mb-5">
        <div className="min-w-0">
          {caption && (
            <p
              className="text-[12px] uppercase tracking-[0.1em] font-medium text-[var(--text-subtle)] mb-1"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              {caption}
            </p>
          )}
          <h2 className="text-[17px] font-semibold text-[var(--text)]">{title}</h2>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}
