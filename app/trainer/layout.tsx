import { DashboardShell } from "@/components/dashboard-shell";
import { getCurrentProfile } from "@/lib/profile";

export const dynamic = "force-dynamic";

export default async function TrainerLayout({ children }: { children: React.ReactNode }) {
  const profile = await getCurrentProfile("trainer");
  return <DashboardShell profile={profile}>{children}</DashboardShell>;
}
