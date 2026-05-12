import { notFound } from "next/navigation";
import { ContactDetail } from "@/components/app/contact-detail";
import { ProGate } from "@/components/app/pro-gate";
import { getContact, listActivitiesFor } from "@/lib/db/queries/contacts";
import { getCurrentPlan, planHasPipeline } from "@/lib/auth/plan";

export const metadata = { title: "Contact" };
export const dynamic = "force-dynamic";

export default async function ContactPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [plan, contact, activities] = await Promise.all([
    getCurrentPlan(),
    getContact(id),
    listActivitiesFor(id),
  ]);
  if (!contact) notFound();

  return (
    <ProGate
      active={!planHasPipeline(plan)}
      feature="Sales pipeline"
      reason="This contact view, the activity log, and the email templates are part of the Pro plan."
    >
      <ContactDetail contact={contact} activities={activities} />
    </ProGate>
  );
}
