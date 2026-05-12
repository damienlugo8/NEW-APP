"use client";

import { useMemo, useState, useTransition } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { motion, AnimatePresence } from "framer-motion";
import { KanbanColumn } from "./kanban-column";
import { ContactCard } from "./contact-card";
import { ContactForm } from "./contact-form";
import {
  CONTACT_STAGES,
  type Contact,
  type ContactStage,
} from "@/lib/types/contact";
import { moveContactStageAction } from "@/app/(app)/pipeline/actions";

/**
 * The kanban + slide-in form. We keep an optimistic local copy of `contacts`
 * so the column reflects the drop instantly. The server action runs in the
 * background and triggers a revalidate; the optimistic state is overwritten
 * on the next render.
 */
export function PipelineKanban({ contacts }: { contacts: Contact[] }) {
  const [local, setLocal] = useState<Contact[]>(contacts);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Contact | null>(null);
  const [seedStage, setSeedStage] = useState<ContactStage>("prospect");

  // Re-sync if server data changes (after revalidatePath).
  useMemo(() => setLocal(contacts), [contacts]);

  const sensors = useSensors(
    // Pointer needs ≥ 6px move before drag starts → so taps on inner buttons /
    // links pass through cleanly.
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 180, tolerance: 6 },
    })
  );

  const byStage = useMemo(() => {
    const m = new Map<ContactStage, Contact[]>();
    for (const s of CONTACT_STAGES) m.set(s.value, []);
    for (const c of local) {
      const arr = m.get(c.stage) ?? [];
      arr.push(c);
      m.set(c.stage, arr);
    }
    return m;
  }, [local]);

  const onDragStart = (e: DragStartEvent) => setActiveId(String(e.active.id));

  const onDragEnd = (e: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = e;
    if (!over) return;
    const newStage = over.id as ContactStage;
    const contactId = String(active.id);
    const current = local.find((c) => c.id === contactId);
    if (!current || current.stage === newStage) return;

    // Optimistic update.
    setLocal((prev) =>
      prev.map((c) => (c.id === contactId ? { ...c, stage: newStage } : c))
    );
    startTransition(() => {
      moveContactStageAction(contactId, newStage);
    });
  };

  const openAdd = (stage: ContactStage) => {
    setEditing(null);
    setSeedStage(stage);
    setFormOpen(true);
  };

  const activeCard = activeId ? local.find((c) => c.id === activeId) : null;

  return (
    <>
      <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd}>
        <div className="-mx-5 px-5 lg:mx-0 lg:px-0 overflow-x-auto pb-4">
          <div className="flex gap-4 min-w-max">
            {CONTACT_STAGES.map((s) => (
              <KanbanColumn
                key={s.value}
                stage={s.value}
                label={s.label}
                description={s.description}
                contacts={byStage.get(s.value) ?? []}
                onAdd={openAdd}
              />
            ))}
          </div>
        </div>
        <DragOverlay>
          <AnimatePresence>
            {activeCard && (
              <motion.div
                initial={{ scale: 1 }}
                animate={{ scale: 1.03 }}
                transition={{ duration: 0.12 }}
              >
                <ContactCard contact={activeCard} isOverlay />
              </motion.div>
            )}
          </AnimatePresence>
        </DragOverlay>
      </DndContext>

      <ContactForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        editing={editing}
        defaultStage={seedStage}
      />
    </>
  );
}
