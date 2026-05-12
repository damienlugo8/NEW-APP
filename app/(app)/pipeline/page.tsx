import { PipelinePageClient } from "@/components/app/pipeline-page-client";
import { ProGate } from "@/components/app/pro-gate";
import { listContacts, listOverdueContacts } from "@/lib/db/queries/contacts";
import { getCurrentPlan, planHasPipeline } from "@/lib/auth/plan";

export const metadata = { title: "Pipeline" };
export const dynamic = "force-dynamic";

export default async function PipelinePage() {
  const [plan, contacts, overdue] = await Promise.all([
    getCurrentPlan(),
    listContacts(),
    listOverdueContacts(),
  ]);

  const locked = !planHasPipeline(plan);

  return (
    <ProGate
      active={locked}
      feature="Sales pipeline"
      reason="Upgrade to Pro to turn the work you do into the work you'll have. Drag-and-drop contacts, ready-to-send emails, and follow-up reminders."
    >
      <PipelinePageClient contacts={contacts} overdueCount={overdue.length} />
    </ProGate>
  );
}
