"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Mail, Copy, Send, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  EMAIL_TEMPLATES,
  mailtoHref,
  renderTemplate,
} from "@/lib/templates/email";
import type { Contact } from "@/lib/types/contact";
import { cn } from "@/lib/utils";

/**
 * Renders the 3 starter templates with copy + mailto buttons. We render the
 * template inline (collapsed) and let the user expand each for a preview.
 * The actual send is delegated to the user's mail client via mailto: — the
 * simplest, most universal path.
 */
export function EmailTemplates({ contact }: { contact: Contact }) {
  const first = (contact.contact_name ?? "").trim().split(/\s+/)[0] || "there";
  const [openId, setOpenId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
      <div className="px-5 py-4 border-b border-[var(--border)]">
        <p className="t-caption text-[var(--text-subtle)] mb-1">Send a note</p>
        <p className="text-sm text-[var(--text-muted)]">
          Three starter messages. Pick one, tap send — opens in your mail app
          with {contact.email ? "the address pre-filled." : "a blank to field."}
        </p>
      </div>
      <ul className="divide-y divide-[var(--border)]">
        {EMAIL_TEMPLATES.map((tpl) => {
          const open = openId === tpl.id;
          const rendered = renderTemplate(tpl, {
            company: contact.company_name,
            contact_first_name: first,
          });
          const href = mailtoHref({
            to: contact.email,
            subject: rendered.subject,
            body: rendered.body,
          });
          return (
            <li key={tpl.id}>
              <button
                type="button"
                onClick={() => setOpenId(open ? null : tpl.id)}
                className="w-full px-5 py-4 flex items-center justify-between gap-4 text-left hover:bg-[var(--surface-2)] transition-colors"
              >
                <div>
                  <p className="text-sm font-medium text-[var(--text)]">
                    {tpl.label}
                  </p>
                  <p className="text-xs text-[var(--text-subtle)] mt-0.5">
                    {tpl.description}
                  </p>
                </div>
                <ChevronDown
                  size={15}
                  strokeWidth={1.75}
                  className={cn(
                    "shrink-0 text-[var(--text-subtle)] transition-transform duration-200",
                    open && "rotate-180"
                  )}
                />
              </button>
              <AnimatePresence initial={false}>
                {open && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.22 }}
                    className="overflow-hidden bg-[var(--surface-2)]"
                  >
                    <div className="px-5 pb-5 pt-1">
                      <p className="t-caption text-[var(--text-subtle)] mt-2">Subject</p>
                      <p className="text-sm text-[var(--text)] mb-3">{rendered.subject}</p>
                      <p className="t-caption text-[var(--text-subtle)]">Body</p>
                      <pre className="text-[13px] text-[var(--text)] whitespace-pre-wrap font-sans mt-1 max-w-[68ch]">
                        {rendered.body}
                      </pre>
                      <div className="flex items-center gap-2 mt-4">
                        <a href={href}>
                          <Button size="sm">
                            <Send size={13} strokeWidth={1.75} />
                            {contact.email ? "Send in mail app" : "Open mail app"}
                          </Button>
                        </a>
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          onClick={async () => {
                            await navigator.clipboard.writeText(
                              `Subject: ${rendered.subject}\n\n${rendered.body}`
                            );
                            setCopiedId(tpl.id);
                            setTimeout(() => setCopiedId(null), 1500);
                          }}
                        >
                          {copiedId === tpl.id ? (
                            <>
                              <Check size={13} strokeWidth={1.75} /> Copied
                            </>
                          ) : (
                            <>
                              <Copy size={13} strokeWidth={1.75} /> Copy
                            </>
                          )}
                        </Button>
                        {contact.email && (
                          <span className="text-[11px] text-[var(--text-subtle)] inline-flex items-center gap-1 ml-auto">
                            <Mail size={11} strokeWidth={1.75} /> {contact.email}
                          </span>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
