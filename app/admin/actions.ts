"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const batchSchema = z.object({
  name: z.string().trim().min(2).max(100),
  code: z.string().trim().min(2).max(30).regex(/^[A-Za-z0-9-]+$/),
  department: z.string().trim().max(100).optional(),
});

export async function createBatch(formData: FormData) {
  const parsed = batchSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) redirect("/admin?error=Enter+a+valid+batch+name+and+code");
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/");
  const { data: profile, error: profileError } = await supabase.from("profiles").select("role,institution_id").eq("id", user.id).single();
  if (profileError) throw new Error(`Unable to verify placement officer account: ${profileError.message}`);
  if (profile.role !== "admin" || !profile.institution_id) throw new Error("A placement officer profile with an institution is required to create a batch.");
  const { error } = await supabase.from("batches").insert({
    institution_id: profile.institution_id,
    created_by: user.id,
    name: parsed.data.name,
    code: parsed.data.code.toUpperCase(),
    department: parsed.data.department?.trim() || null,
  });
  if (error) {
    if (error.code === "23505") redirect("/admin?error=That+batch+code+is+already+in+use");
    throw new Error(`Unable to create batch: ${error.message}`);
  }
  redirect("/admin?notice=batch_created");
}

const trainerAssignmentSchema = z.object({ batch_id: z.string().uuid(), email: z.string().trim().email() });

export async function assignTrainer(formData: FormData) {
  const parsed = trainerAssignmentSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) redirect("/admin?error=Choose+a+batch+and+enter+a+valid+trainer+email");
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/");
  const { data: profile, error: profileError } = await supabase.from("profiles").select("role,institution_id").eq("id", user.id).single();
  if (profileError) throw new Error(`Unable to verify placement officer account: ${profileError.message}`);
  if (profile.role !== "admin" || !profile.institution_id) throw new Error("An institution administrator is required to assign trainers.");
  const { data: trainer, error: trainerError } = await supabase.from("profiles").select("id").eq("email", parsed.data.email.toLowerCase()).eq("role", "trainer").eq("institution_id", profile.institution_id).maybeSingle();
  if (trainerError) throw new Error(`Unable to find the trainer: ${trainerError.message}`);
  if (!trainer) redirect("/admin?error=No+trainer+account+was+found+for+that+email+at+your+institution");
  const { error } = await supabase.from("batch_trainers").insert({ batch_id: parsed.data.batch_id, trainer_id: trainer.id });
  if (error) {
    if (error.code === "23505") redirect("/admin?error=That+trainer+is+already+assigned+to+the+batch");
    throw new Error(`Unable to assign trainer: ${error.message}`);
  }
  redirect("/admin?notice=trainer_assigned");
}

const removalSchema = z.object({ batch_id: z.string().uuid(), trainer_id: z.string().uuid() });

export async function removeTrainer(formData: FormData) {
  const parsed = removalSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) redirect("/admin?error=Invalid+trainer+assignment");
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/");
  const { error } = await supabase.from("batch_trainers").delete().eq("batch_id", parsed.data.batch_id).eq("trainer_id", parsed.data.trainer_id);
  if (error) throw new Error(`Unable to remove trainer assignment: ${error.message}`);
  redirect("/admin?notice=trainer_removed");
}

const announcementSchema = z.object({ title: z.string().trim().min(3).max(150), body: z.string().trim().min(5).max(4000) });

export async function publishAnnouncement(formData: FormData) {
  const parsed = announcementSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) redirect("/admin?error=Enter+an+announcement+title+and+message");
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/");
  const { data: profile, error: profileError } = await supabase.from("profiles").select("role,institution_id").eq("id", user.id).single();
  if (profileError) throw new Error(`Unable to verify placement officer account: ${profileError.message}`);
  if (profile.role !== "admin" || !profile.institution_id) throw new Error("An institution administrator is required to publish announcements.");
  const { error } = await supabase.from("announcements").insert({
    institution_id: profile.institution_id,
    created_by: user.id,
    title: parsed.data.title,
    body: parsed.data.body,
    published_at: new Date().toISOString(),
  });
  if (error) throw new Error(`Unable to publish announcement: ${error.message}`);
  redirect("/admin?notice=announcement_published");
}
