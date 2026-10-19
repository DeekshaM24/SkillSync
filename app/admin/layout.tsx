import { DashboardShell } from "@/components/dashboard-shell";
import { getCurrentProfile } from "@/lib/profile";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const profile = await getCurrentProfile("admin");
  return <DashboardShell profile={profile}>{children}</DashboardShell>;
}
