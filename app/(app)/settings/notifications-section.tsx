"use client";

import { useState, useTransition } from "react";
import { Card } from "./profile-section";
import { saveNotifications, type NotificationsPrefs } from "./actions";

const ROWS: { key: keyof NotificationsPrefs; label: string; desc: string }[] = [
  {
    key: "daily_checkin",
    label: "Daily morning check-in",
    desc: "A nudge each morning to log your habits before the day gets you.",
  },
  {
    key: "squad_alerts",
    label: "Squad activity alerts",
    desc: "When someone in your five posts, falls behind, or sends respect.",
  },
  {
    key: "streak_milestones",
    label: "Streak milestone alerts",
    desc: "Hit 7, 30, 75 days — we'll mark the moment.",
  },
];

const DEFAULTS: NotificationsPrefs = {
  daily_checkin: true,
  squad_alerts: true,
  streak_milestones: true,
};

export function NotificationsSection({
  prefs,
}: {
  prefs: Partial<NotificationsPrefs> | null;
}) {
  const [state, setState] = useState<NotificationsPrefs>({ ...DEFAULTS, ...(prefs ?? {}) });
  const [pending, start] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggle(key: keyof NotificationsPrefs) {
    const next = { ...state, [key]: !state[key] };
    setState(next);
    setSaved(false);
    setError(null);
    start(async () => {
      const res = await saveNotifications(next);
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 1800);
      } else {
        setError(res.error ?? "Couldn't save.");
        setState(state); // revert on failure
      }
    });
  }

  return (
    <Card title="Notifications" caption="Email">
      <ul className="flex flex-col divide-y divide-[var(--border-soft)]">
        {ROWS.map((row) => (
          <li
            key={row.key}
            className="flex items-start justify-between gap-4 py-4 first:pt-0 last:pb-0"
          >
            <div className="min-w-0">
              <p className="text-[15px] text-[var(--text)]">{row.label}</p>
              <p className="text-sm text-[var(--text-subtle)] mt-0.5">{row.desc}</p>
            </div>
            <Toggle
              checked={state[row.key]}
              onChange={() => toggle(row.key)}
              disabled={pending}
              label={row.label}
            />
          </li>
        ))}
      </ul>
      <p className="mt-4 h-4 text-xs" aria-live="polite">
        {error ? (
          <span className="text-[var(--danger)]">{error}</span>
        ) : saved ? (
          <span className="text-[var(--text-subtle)]">Saved.</span>
        ) : null}
      </p>
    </Card>
  );
}

function Toggle({
  checked,
  onChange,
  disabled,
  label,
}: {
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={onChange}
      disabled={disabled}
      className={[
        // after:* pseudo-element extends the touch target to ≥44px without
        // changing the 24px visual height of the switch.
        "relative shrink-0 h-6 w-11 rounded-full transition-[background-color,border-color,transform] duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] active:scale-[0.97] disabled:opacity-60",
        "after:absolute after:-inset-x-2 after:-inset-y-2.5 after:content-['']",
        checked ? "bg-[var(--accent)]" : "bg-[var(--surface-2)] border border-[var(--border-strong)]",
      ].join(" ")}
    >
      <span
        className={[
          "absolute top-1/2 -translate-y-1/2 h-4 w-4 rounded-full bg-[var(--text)] transition-[left] duration-200 ease-[cubic-bezier(0.16,1,0.3,1)]",
          checked ? "left-[24px]" : "left-[3px]",
        ].join(" ")}
        aria-hidden
      />
    </button>
  );
}
