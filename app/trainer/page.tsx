import { ArrowUpRight, ClipboardCheck, GraduationCap, Layers3, UsersRound } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/profile";
import { CsvDownload } from "@/components/csv-download";
import { EmptyState, PageTitle, SectionHeading, StatCard } from "@/components/dashboard-ui";
import { StudentRoster } from "@/components/student-roster";
import { createAndAssignTest } from "@/app/trainer/actions";

export default async function TrainerDashboard({ searchParams }: { searchParams: Promise<{ notice?: string; error?: string }> }) {
  const { notice, error } = await searchParams;
  const profile = await getCurrentProfile("trainer");
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Your session expired. Please sign in again.");

  const { data: trainerBatches, error: batchesError } = await supabase.from("batch_trainers").select("batch_id").eq("trainer_id", user.id);
  if (batchesError) throw new Error(`Unable to load your batches: ${batchesError.message}`);
  const batchIds = (trainerBatches ?? []).map((item) => item.batch_id);
  const [batchResult, memberResult, feedbackResult] = await Promise.all([
    batchIds.length ? supabase.from("batches").select("id,name,code,department,start_date,end_date").in("id", batchIds) : Promise.resolve({ data: [], error: null }),
    batchIds.length ? supabase.from("batch_members").select("batch_id,student_id").in("batch_id", batchIds) : Promise.resolve({ data: [], error: null }),
    batchIds.length ? supabase.from("trainer_feedback").select("id,student_id,feedback,created_at,batch_id").eq("trainer_id", user.id).order("created_at", { ascending: false }).limit(10) : Promise.resolve({ data: [], error: null }),
  ]);
  const failed = [batchResult, memberResult, feedbackResult].find((result) => result.error);
  if (failed?.error) throw new Error(`Unable to load trainer workspace: ${failed.error.message}`);
  const batches = batchResult.data ?? [];
  const memberRows = memberResult.data ?? [];
  const studentIds = [...new Set(memberRows.map((member) => member.student_id))];
  const [studentResult, assignmentResult] = await Promise.all([
    studentIds.length ? supabase.from("profiles").select("id,full_name,email,department,year_of_study,roll_number").in("id", studentIds).order("full_name") : Promise.resolve({ data: [], error: null }),
    batchIds.length ? supabase.from("test_assignments").select("id,test_id,batch_id,tests(title)").in("batch_id", batchIds) : Promise.resolve({ data: [], error: null }),
  ]);
  if (studentResult.error || assignmentResult.error) throw new Error(`Unable to load student records: ${studentResult.error?.message ?? assignmentResult.error?.message}`);
  const testIds = [...new Set((assignmentResult.data ?? []).map((item) => item.test_id))];
  const [{ data: attemptData, error: attemptError }, { data: testQuestions, error: testQuestionError }] = await Promise.all([
    testIds.length ? supabase.from("test_attempts").select("id,test_id,student_id,score,max_score,status,submitted_at").in("test_id", testIds) : Promise.resolve({ data: [], error: null }),
    testIds.length ? supabase.from("test_questions").select("test_id,question_id").in("test_id", testIds) : Promise.resolve({ data: [], error: null }),
  ]);
  if (attemptError || testQuestionError) throw new Error(`Unable to load class performance: ${attemptError?.message ?? testQuestionError?.message}`);
  const attempts = attemptData ?? [];
  const pendingReviews = attempts.filter((attempt) => attempt.status === "submitted").length;
  const scoresByStudent = new Map<string, number[]>();
  for (const attempt of attempts) {
    if (attempt.score === null || !attempt.max_score) continue;
    const values = scoresByStudent.get(attempt.student_id) ?? [];
    values.push(Math.round(Number(attempt.score) / Number(attempt.max_score) * 100));
    scoresByStudent.set(attempt.student_id, values);
  }
  const roster = (studentResult.data ?? []).map((student) => {
    const scores = scoresByStudent.get(student.id) ?? [];
    const membership = memberRows.find((member) => member.student_id === student.id);
    const batch = batches.find((item) => item.id === membership?.batch_id);
    return { ...student, score: scores.length ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length) : null, batch_id: membership?.batch_id ?? "", batch_name: batch?.name ?? "—" };
  });
  const assessedScores = roster.filter((student) => student.score !== null).map((student) => student.score as number);
  const classAverage = assessedScores.length ? Math.round(assessedScores.reduce((sum, score) => sum + score, 0) / assessedScores.length) : null;
  const batchForTest = new Map((assignmentResult.data ?? []).map((item) => [item.test_id, item.batch_id]));
  const batchForAttempt = new Map(attempts.map((attempt) => [attempt.id, batchForTest.get(attempt.test_id)]));
  const topicCounts = new Map<string, { total: number; incorrect: number }>();
  if (attempts.length) {
    const { data: answerRows, error: answerError } = await supabase.from("attempt_answers").select("attempt_id,question_id,is_correct").in("attempt_id", attempts.map((item) => item.id));
    if (answerError) throw new Error(`Unable to calculate topic progress: ${answerError.message}`);
    const questionIds = [...new Set((testQuestions ?? []).map((item) => item.question_id))];
    const { data: questions, error: questionError } = questionIds.length
      ? await supabase.from("questions").select("id,topic").in("id", questionIds)
      : { data: [], error: null };
    if (questionError) throw new Error(`Unable to load question topics: ${questionError.message}`);
    const questionTopics = new Map((questions ?? []).map((question) => [question.id, question.topic]));
    for (const answer of answerRows ?? []) {
      const topic = questionTopics.get(answer.question_id);
      const batchId = batchForAttempt.get(answer.attempt_id);
      if (!topic || !batchId) continue;
      const current = topicCounts.get(`${batchId}:${topic}`) ?? { total: 0, incorrect: 0 };
      current.total += 1;
      if (!answer.is_correct) current.incorrect += 1;
      topicCounts.set(`${batchId}:${topic}`, current);
    }
  }
  const topics = [...topicCounts.entries()].sort((a, b) => b[1].incorrect / b[1].total - a[1].incorrect / a[1].total).slice(0, 5);

  return <>
    <PageTitle eyebrow="Trainer workspace" title={`Welcome, ${profile.full_name.split(" ")[0]}`} description="Your batches, student progress, and reviews at a glance." action={<CsvDownload filename="skillsync-student-progress.csv" headers={["Name", "Email", "Department", "Year", "Roll number", "Average test score"]} rows={roster.map((student) => [student.full_name, student.email, student.department, student.year_of_study, student.roll_number, student.score === null ? "Not assessed" : `${student.score}%`])} />} />
    {notice && <p role="status" className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200">{notice === "test_created" ? "Your test is published and assigned to the selected batch." : "Feedback saved for the student."}</p>}
    {error && <p role="alert" className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">{error}</p>}
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5"><StatCard label="My batches" value={batches.length} detail="Assigned to your trainer account" icon={<Layers3 size={18} />} /><StatCard label="Students" value={roster.length} detail="Across assigned batches" icon={<GraduationCap size={18} />} accent="violet" /><StatCard label="Pending reviews" value={pendingReviews} detail="Submitted tests to review" icon={<ClipboardCheck size={18} />} accent="amber" /><StatCard label="Tests assigned" value={(assignmentResult.data ?? []).length} detail="Across your batches" icon={<UsersRound size={18} />} accent="emerald" /><StatCard label="Class average" value={classAverage === null ? "—" : `${classAverage}%`} detail={classAverage === null ? "Awaiting assessments" : "Submitted assessment scores"} icon={<GraduationCap size={18} />} accent="blue" /></section>

    <section className="mt-6 grid gap-6 xl:grid-cols-[1.2fr_.8fr]">
      <div className="surface rounded-2xl p-5 sm:p-6" id="batches"><SectionHeading title="My batches" subtitle="Only the batches assigned to your trainer account." />
        {batches.length ? <div className="grid gap-3 sm:grid-cols-2">{batches.map((batch) => <div key={batch.id} className="rounded-xl border border-[var(--line)] p-4"><div className="flex items-start justify-between"><div><p className="font-semibold">{batch.name}</p><p className="mt-1 text-xs text-muted">{batch.department ?? "Department not set"}</p></div><span className="rounded-md bg-slate-100 px-2 py-1 font-mono text-[10px] dark:bg-slate-800">{batch.code}</span></div><p className="mt-4 text-xs text-muted">{memberRows.filter((member) => member.batch_id === batch.id).length} students · {(assignmentResult.data ?? []).filter((item) => item.batch_id === batch.id).length} tests assigned</p></div>)}</div> : <EmptyState title="No batches assigned" description="Ask your placement office to assign your trainer account to a batch." icon={<UsersRound size={19} />} />}
      </div>
      <div className="surface rounded-2xl p-5 sm:p-6" id="reviews"><SectionHeading title="Create and assign a test" subtitle="Choose from the MCQs available for your institution." />
        {batches.length ? <form action={createAndAssignTest} className="space-y-3">
          <label className="block text-xs font-medium">Test title<input name="title" required minLength={3} maxLength={120} placeholder="e.g. Week 2 aptitude practice" className="mt-1.5 h-10 w-full rounded-xl border border-[var(--line)] bg-transparent px-3 text-sm outline-none focus:border-blue-600" /></label>
          <div className="grid grid-cols-2 gap-3"><label className="block text-xs font-medium">Batch<select name="batch_id" required className="mt-1.5 h-10 w-full rounded-xl border border-[var(--line)] bg-transparent px-3 text-sm outline-none focus:border-blue-600">{batches.map((batch) => <option key={batch.id} value={batch.id}>{batch.name}</option>)}</select></label><label className="block text-xs font-medium">Duration (minutes)<input name="duration_minutes" type="number" required min={5} max={240} defaultValue={20} className="mt-1.5 h-10 w-full rounded-xl border border-[var(--line)] bg-transparent px-3 text-sm outline-none focus:border-blue-600" /></label></div>
          <button className="flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-blue-800 text-xs font-semibold text-white hover:bg-blue-900">Create test and assign <ArrowUpRight size={15} /></button>
        </form> : <EmptyState title="Assign a batch first" description="When an administrator assigns you a batch, you can create tests here." />}
      </div>
    </section>

    <section className="mt-6 grid gap-6 xl:grid-cols-[1.3fr_.7fr]">
      <div className="surface overflow-hidden rounded-2xl" id="students"><div className="p-5 pb-3 sm:p-6 sm:pb-3"><SectionHeading title="Student progress" subtitle="Assessment performance compared with the trainer-wide class average." /></div>
        {roster.length ? <div className="px-4 pb-5 sm:px-5"><StudentRoster students={roster} classAverage={classAverage} /></div> : <div className="px-5 pb-5"><EmptyState title="No students in your batches" description="Student profiles appear here once they join one of your assigned batches." /></div>}
      </div>
      <div className="surface rounded-2xl p-5 sm:p-6"><SectionHeading title="Topics to revisit" subtitle="Based on incorrect answers in submitted attempts." />
        {topics.length ? <div className="space-y-4">{topics.map(([topicKey, counts]) => {
          const pct = counts.total ? Math.round(counts.incorrect / counts.total * 100) : 0;
          const [batchId, topic] = topicKey.split(":");
          const batchName = batches.find((item) => item.id === batchId)?.name ?? "Batch";
          return <div key={topicKey}><div className="mb-1.5 flex justify-between gap-2 text-xs"><span className="truncate font-medium">{topic}</span><span className="shrink-0 text-muted">{pct}% incorrect</span></div><div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800"><div className={`h-full rounded-full ${pct >= 60 ? "bg-rose-500" : "bg-amber-500"}`} style={{ width: `${pct}%` }} /></div><p className="mt-1 text-[10px] text-muted">{batchName} · {counts.incorrect} of {counts.total} recorded responses</p></div>;
        })}</div> : <EmptyState title="No topic data yet" description="Topic insights become available once students submit tests that include answered questions." />}
        <div className="mt-5 border-t border-[var(--line)] pt-4"><SectionHeading title="Recent feedback" />
          {(feedbackResult.data ?? []).length ? <div className="space-y-3">{(feedbackResult.data ?? []).slice(0, 3).map((feedback) => <div key={feedback.id} className="rounded-lg bg-slate-50 p-3 text-xs dark:bg-slate-800/60"><p className="leading-5">{feedback.feedback}</p><p className="mt-1.5 text-[10px] text-muted">{roster.find((student) => student.id === feedback.student_id)?.full_name ?? "Student"} · {new Date(feedback.created_at).toLocaleDateString()}</p></div>)}</div> : <p className="text-xs text-muted">Feedback you leave for students will appear here.</p>}
        </div>
      </div>
    </section>
  </>;
}
