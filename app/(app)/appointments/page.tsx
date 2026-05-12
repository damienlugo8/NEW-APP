import { listAppointments } from "@/lib/db/queries/appointments";
import { AppointmentsPageClient } from "@/components/app/appointments-page-client";

export const metadata = { title: "Appointments" };

// Always run on the server — appointments are user-scoped and we want fresh data.
export const dynamic = "force-dynamic";

export default async function AppointmentsPage() {
  const appointments = await listAppointments();
  return <AppointmentsPageClient appointments={appointments} />;
}
