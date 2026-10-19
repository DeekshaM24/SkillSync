"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const commonFields = {
  full_name: z.string().trim().min(2).max(100),
  college: z.string().trim().min(2).max(140),
  department: z.string().trim().min(2).max(100).optional(),
};

const studentSchema = z.object({
  role: z.literal("student"),
  ...commonFields,
  department: z.string().trim().min(2).max(100),
  year_of_study: z.coerce.number().int().min(1).max(8),
  roll_number: z.string().trim().min(1).max(40),
  target_role: z.string().trim().min(2).max(100),
  batch_code: z.string().trim().min(2).max(30),
});

const trainerSchema = z.object({
  role: z.literal("trainer"),
  ...commonFields,
  department: z.string().trim().min(2).max(100),
  subjects_taught: z.string().trim().min(2).max(200),
});

const adminSchema = z.object({
  role: z.literal("admin"),
  full_name: commonFields.full_name,
  college: commonFields.college,
  designation: z.string().trim().min(2).max(100),
  institution_code: z.string().trim().min(1).max(100),
});

export async function completeOnboarding(formData: FormData) {
  const role = formData.get("role");
  const raw = Object.fromEntries(formData.entries());
  const parsed =
    role === "student" ? studentSchema.safeParse(raw) :
    role === "trainer" ? trainerSchema.safeParse(raw) :
    role === "admin" ? adminSchema.safeParse(raw) : null;
  if (!parsed?.success) {
    redirect(`/onboarding/role?error=${encodeURIComponent("Please complete each required field.")}`);
  }

  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError) throw new Error(`Unable to verify your session: ${userError.message}`);
  if (!user) redirect("/");

  const admin = createAdminClient();
  const { data: existing, error: existingError } = await admin.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (existingError) throw new Error(`Unable to check your profile: ${existingError.message}`);
  if (existing?.role) redirect(`/${existing.role}`);

  const form = parsed.data;
  const college = form.college.trim();
  let institutionId: string | null = null;
  let studentBatchId: string | null = null;
  if (form.role === "admin") {
    const expectedCode = process.env.PLACEMENT_OFFICER_INSTITUTION_CODE;
    const expectedInstitutionId = process.env.PLACEMENT_OFFICER_INSTITUTION_ID;
    if (!expectedCode || !expectedInstitutionId || form.institution_code !== expectedCode) {
      redirect(`/onboarding/role?error=${encodeURIComponent("The institution code is invalid. Contact your placement office.")}`);
    }
    institutionId = expectedInstitutionId;
    const { data: institution, error: institutionError } = await admin.from("institutions").select("id").eq("id", institutionId).maybeSingle();
    if (institutionError) throw new Error(`Unable to validate your institution: ${institutionError.message}`);
    if (!institution) redirect(`/onboarding/role?error=${encodeURIComponent("This institution code is not configured for a valid institution.")}`);
  } else {
    const { data: institution, error: institutionError } = await admin.from("institutions").select("id").ilike("name", college).maybeSingle();
    if (institutionError) throw new Error(`Unable to look up your institution: ${institutionError.message}`);
    institutionId = institution?.id ?? null;
  }
  if (form.role === "student") {
    const { data: batch, error: batchError } = await admin.from("batches").select("id,institution_id").eq("code", form.batch_code.trim()).maybeSingle();
    if (batchError) throw new Error(`Unable to look up your batch: ${batchError.message}`);
    if (!batch || !institutionId || batch.institution_id !== institutionId) {
      redirect(`/onboarding/role?error=${encodeURIComponent("That batch code doesn’t match the institution entered. Check both details with your trainer.")}`);
    }
    studentBatchId = batch.id;
  }

  const profile = {
    id: user.id,
    role: form.role,
    full_name: form.full_name.trim(),
    email: user.email?.toLowerCase() ?? null,
    institution_id: institutionId,
    department: "department" in form ? form.department?.trim() ?? null : null,
    year_of_study: form.role === "student" ? form.year_of_study : null,
    roll_number: form.role === "student" ? form.roll_number.trim() : null,
    target_role: form.role === "student" ? form.target_role.trim() : null,
    designation: form.role === "admin" ? form.designation.trim() : null,
    subjects_taught: form.role === "trainer" ? form.subjects_taught.split(",").map((subject) => subject.trim()).filter(Boolean) : null,
  };
  const { error: saveError } = await admin.from("profiles").insert(profile);
  if (saveError) {
    if (saveError.code === "23505") redirect(`/${form.role}`);
    throw new Error(`Unable to save your profile: ${saveError.message}`);
  }

  if (form.role === "student") {
    const { error: memberError } = await admin.from("batch_members").insert({ batch_id: studentBatchId!, student_id: user.id });
    if (memberError && memberError.code !== "23505") throw new Error(`Unable to join your batch: ${memberError.message}`);
  }
  redirect(`/${form.role}`);
}
