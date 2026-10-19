import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Profile, Role } from "@/lib/types";

export async function getCurrentProfile(requiredRole?: Role): Promise<Profile> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError) throw new Error(`Unable to verify your session: ${authError.message}`);
  if (!user) redirect("/");
  const { data, error } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  if (error) throw new Error(`Unable to load your profile: ${error.message}`);
  if (!data?.role) redirect("/onboarding/role");
  const profile = data as Profile;
  if (requiredRole && profile.role !== requiredRole) redirect(`/${profile.role}`);
  return profile;
}
