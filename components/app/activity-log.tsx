"use client";

import { useActionState, useState } from "react";
import { motion } from "framer-motion";
import {
  CalendarDays,
  Mail,
  Phone,
  MessageSquare,
  StickyNote,
  Plus,
} from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  logActivityAction,
  type ContactFormState,
} from "@/app/(app)/pipeline/actions";
import {
  ACTIVITY_TYPES,
  type ActivityType,
  type ContactActivity,
} from "@/lib/types/contact";

const initial: ContactFormState = {};

function ActivityIcon({ type }: { type: ActivityType }) {
  const props = { size: 14, strokeWidth: 1.75 } as const;
  if (type === "email") return <Mail {...props} />;
  if (type === "call") return <Phone {...props} />;
  if (type === "meeting") return <MessageSquare {...props} />;
  return <StickyNote {...props} />;
}

export function ActivityLog({
  contactId,
  activities,
}: {
  contactId: string;
  activities: ContactActivity[];
}) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(logActivityAction, initial);

  // Close the inline form after a successful log.
  if (state.ok && open) setOpen(false);

  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
      <div className="px-5 py-4 border-b border-[var(--border)] flex items-center justify-between">
        <div>
          <p className="t-caption text-[var(--text-subtle)] mb-1">Activity</p>
          <p className="text-sm text-[var(--text-muted)]">
            Every email, call, and meeting in one timeline.
          </p>
        </div>
        <Button
          size="sm"
          variant={open ? "ghost" : "secondary"}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? "Cancel" : (<><Plus size={13} strokeWidth={2} /> Log activity</>)}
        </Button>
      </div>

      {open && (
        <motion.form
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          transition={{ duration: 0.2 }}
          action={action}
          className="px-5 py-4 border-b border-[var(--border)] bg-[var(--surface-2)] flex flex-col gap-3"
        >
          <input type="hidden" name="contact_id" value={contactId} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select name="activity_type" label="What happened?" defaultValue="email">
              {ACTIVITY_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </Select>
            <Input
              name="activity_date"
              type="datetime-local"
              label="When"
              defaultValue={format(new Date(), "yyyy-MM-dd'T'HH:mm")}
            />
          </div>
          <Textarea
            name="summary"
            label="Notes"
            rows={3}
            placeholder="What you talked about, what to follow up on."
          />
          {state.error && <p className="text-sm text-[var(--danger)]">{state.error}</p>}
          <div className="flex justify-end">
            <Button type="submit" size="sm" loading={pending}>
              Log it
            </Button>
          </div>
        </motion.form>
      )}

      {activities.length === 0 ? (
        <div className="px-5 py-10 text-center">
          <CalendarDays
            size={20}
            strokeWidth={1.5}
            className="mx-auto text-[var(--text-subtle)]"
          />
          <p className="mt-3 text-sm text-[var(--text)]">No activity yet.</p>
          <p className="mt-1 text-xs text-[var(--text-subtle)]">
            Tap “Log activity” after any call or email.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-[var(--border)]">
          {activities.map((a) => (
            <li key={a.id} className="px-5 py-3.5 flex items-start gap-3">
              <span className="shrink-0 h-7 w-7 rounded-full inline-flex items-center justify-center bg-[var(--accent-soft)] text-[var(--accent)] mt-0.5">
                <ActivityIcon type={a.activity_type} />
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-[var(--text)] capitalize">
                    {a.activity_type}
                  </p>
                  <span className="t-caption text-[var(--text-subtle)]">
                    {format(new Date(a.activity_date), "MMM d, h:mm a")}
                  </span>
                </div>
                {a.summary && (
                  <p className="mt-1 text-sm text-[var(--text-muted)] whitespace-pre-wrap">
                    {a.summary}
                  </p>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
