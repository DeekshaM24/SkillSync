"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const testSchema = z.object({
  title: z.string().trim().min(3).max(120),
  batch_id: z.string().uuid(),
  duration_minutes: z.coerce.number().int().min(5).max(240),
});

export async function createAndAssignTest(formData: FormData) {
  const parsed = testSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) redirect("/trainer?error=Check+the+test+details+and+try+again");
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/");
  const { data: profile, error: profileError } = await supabase.from("profiles").select("role,institution_id").eq("id", user.id).single();
  if (profileError) throw new Error(`Unable to verify trainer account: ${profileError.message}`);
  if (profile.role !== "trainer" || !profile.institution_id) throw new Error("A trainer profile with an institution is required to create tests.");

  const { data: questions, error: questionError } = await supabase.from("questions").select("id").eq("institution_id", profile.institution_id).eq("type", "mcq").limit(10);
  if (questionError) throw new Error(`Unable to load questions for your test: ${questionError.message}`);
  if (!questions?.length) redirect("/trainer?error=There+are+no+MCQs+available+for+your+institution+yet");

  const { data: test, error: testError } = await supabase.from("tests").insert({
    title: parsed.data.title,
    created_by: user.id,
    institution_id: profile.institution_id,
    duration_minutes: parsed.data.duration_minutes,
    published: false,
  }).select("id").single();
  if (testError) throw new Error(`Unable to create your test: ${testError.message}`);
  const { error: questionsError } = await supabase.from("test_questions").insert(questions.map((question, position) => ({ test_id: test.id, question_id: question.id, position, points: 1 })));
  if (questionsError) throw new Error(`Test draft was created, but its questions could not be attached: ${questionsError.message}`);
  const { error: assignmentError } = await supabase.from("test_assignments").insert({
    test_id: test.id,
    batch_id: parsed.data.batch_id,
    assigned_by: user.id,
  });
  if (assignmentError) throw new Error(`Test draft was created, but assignment failed: ${assignmentError.message}`);
  const { error: publishError } = await supabase.from("tests").update({ published: true }).eq("id", test.id);
  if (publishError) throw new Error(`Test was assigned, but publishing failed: ${publishError.message}`);
  redirect("/trainer?notice=test_created");
}

const feedbackSchema = z.object({
  batch_id: z.string().uuid(),
  student_id: z.string().uuid(),
  feedback: z.string().trim().min(1).max(2000),
});

export async function saveTrainerFeedback(formData: FormData) {
  const parsed = feedbackSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) redirect("/trainer?error=Feedback+must+be+between+1+and+2000+characters");
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/");
  const { error } = await supabase.from("trainer_feedback").insert({ ...parsed.data, trainer_id: user.id });
  if (error) throw new Error(`Unable to save student feedback: ${error.message}`);
  redirect("/trainer?notice=feedback_saved");
}
