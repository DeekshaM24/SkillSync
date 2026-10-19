import { Megaphone, School, UsersRound, UserRoundCheck, ClipboardList, Building2 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/profile";
import { CsvDownload } from "@/components/csv-download";
import { EmptyState, PageTitle, SectionHeading, StatCard } from "@/components/dashboard-ui";
import { assignTrainer, createBatch, publishAnnouncement, removeTrainer } from "@/app/admin/actions";

export default async function AdminDashboard({ searchParams }: { searchParams: Promise<{ notice?: string; error?: string }> }) {
  const { notice, error } = await searchParams;
  const profile = await getCurrentProfile("admin");
  const supabase = await createClient();
  const [institutionResult, studentResult, trainerResult, batchResult, membershipResult, trainerAssignmentResult, announcementResult, companyResult] = await Promise.all([
    profile.institution_id ? supabase.from("institutions").select("name,city").eq("id", profile.institution_id).single() : Promise.resolve({ data: null, error: null }),
    supabase.from("profiles").select("id,full_name,email,department,year_of_study,roll_number,resume_score").eq("institution_id", profile.institution_id ?? "").eq("role", "student").order("full_name"),
    supabase.from("profiles").select("id,full_name,email,department").eq("institution_id", profile.institution_id ?? "").eq("role", "trainer").order("full_name"),
    supabase.from("batches").select("id,name,code,department,created_at").eq("institution_id", profile.institution_id ?? "").order("name"),
    supabase.from("batch_members").select("batch_id,student_id"),
    supabase.from("batch_trainers").select("batch_id,trainer_id").order("batch_id"),
    supabase.from("announcements").select("id,title,body,published_at,created_at").eq("institution_id", profile.institution_id ?? "").order("published_at", { ascending: false }).limit(5),
    supabase.from("companies").select("id,name,category").eq("institution_id", profile.institution_id ?? ""),
  ]);
  const failed = [institutionResult, studentResult, trainerResult, batchResult, membershipResult, trainerAssignmentResult, announcementResult, companyResult].find((result) => result.error);
  if (failed?.error) throw new Error(`Unable to load institution dashboard: ${failed.error.message}`);
  const students = studentResult.data ?? [];
  const trainers = trainerResult.data ?? [];
  const batches = batchResult.data ?? [];
  const batchIds = batches.map((batch) => batch.id);
  const members = (membershipResult.data ?? []).filter((member) => batchIds.includes(member.batch_id));
  const [assignmentResult, resumeAnalysisResult] = await Promise.all([
    batchIds.length ? supabase.from("test_assignments").select("test_id,batch_id").in("batch_id", batchIds) : Promise.resolve({ data: [], error: null }),
    students.length ? supabase.from("resumes").select("id,student_id,resume_analyses(ats_score,created_at)").in("student_id", students.map((student) => student.id)) : Promise.resolve({ data: [], error: null }),
  ]);
  if (assignmentResult.error || resumeAnalysisResult.error) throw new Error(`Unable to load assessment data: ${assignmentResult.error?.message ?? resumeAnalysisResult.error?.message}`);
  const testIds = [...new Set((assignmentResult.data ?? []).map((item) => item.test_id))];
  const attemptResult = testIds.length
    ? await supabase.from("test_attempts").select("student_id,score,max_score,status").in("test_id", testIds).eq("status", "submitted")
    : { data: [], error: null };
  if (attemptResult.error) throw new Error(`Unable to calculate student assessment scores: ${attemptResult.error.message}`);
  const testScores = new Map<string, number[]>();
  for (const attempt of attemptResult.data ?? []) {
    if (attempt.score === null || !attempt.max_score) continue;
    const scores = testScores.get(attempt.student_id) ?? [];
    scores.push(Math.round(Number(attempt.score) / Number(attempt.max_score) * 100));
    testScores.set(attempt.student_id, scores);
  }
  const latestResumeScores = new Map<string, number>();
  for (const resume of resumeAnalysisResult.data ?? []) {
    const analyses = [...(resume.resume_analyses ?? [])].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    const score = analyses[0]?.ats_score;
    if (score !== null && score !== undefined) {
      const current = latestResumeScores.get(resume.student_id);
      if (current === undefined || score > current) latestResumeScores.set(resume.student_id, score);
    }
  }
  const readinessRows = students.map((student) => {
    const assessmentScores = testScores.get(student.id) ?? [];
    const resumeScore = latestResumeScores.get(student.id) ?? student.resume_score;
    const recordedScores = [...assessmentScores, ...(resumeScore === null ? [] : [resumeScore])];
    return { ...student, score: recordedScores.length ? Math.round(recordedScores.reduce((sum, score) => sum + score, 0) / recordedScores.length) : null };
  });
  const assessed = readinessRows.filter((student) => student.score !== null);
  const ready = assessed.filter((student) => (student.score ?? 0) >= 70).length;
  const atRisk = assessed.filter((student) => (student.score ?? 0) < 40).length;
  const needsAssessment = students.length - assessed.length;
  const averageReadiness = assessed.length ? Math.round(assessed.reduce((sum, student) => sum + (student.score ?? 0), 0) / assessed.length) : null;
  const trainerMap = new Map(trainers.map((trainer) => [trainer.id, trainer]));
  const assigned = trainerAssignmentResult.data ?? [];

  return <>
    <PageTitle eyebrow="Institution workspace" title={profile.full_name.split(" ")[0] ? `Welcome, ${profile.full_name.split(" ")[0]}` : "Placement overview"} description={`${institutionResult.data?.name ?? "Your institution"}${institutionResult.data?.city ? ` · ${institutionResult.data.city}` : ""}`} action={<CsvDownload filename="skillsync-institution-students.csv" label="Download report" headers={["Name", "Email", "Department", "Year", "Roll number", "Recorded readiness score"]} rows={readinessRows.map((student) => [student.full_name, student.email, student.department, student.year_of_study, student.roll_number, student.score === null ? "Not assessed" : `${student.score}%`])} />} />
    {notice && <p role="status" className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200">{notice === "batch_created" ? "Batch created." : notice === "trainer_assigned" ? "Trainer assigned to the batch." : notice === "trainer_removed" ? "Trainer removed from the batch." : "Announcement published."}</p>}
    {error && <p role="alert" className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">{error}</p>}
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard label="Students" value={students.length} detail="Profiles at your institution" icon={<UsersRound size={18} />} />
      <StatCard label="Active batches" value={batches.length} detail="Institution-wide batches" icon={<School size={18} />} accent="violet" />
      <StatCard label="Trainers" value={trainers.length} detail="Trainer accounts at your institution" icon={<UserRoundCheck size={18} />} accent="emerald" />
      <StatCard label="Average recorded readiness" value={averageReadiness === null ? "—" : `${averageReadiness}%`} detail={assessed.length ? `From ${assessed.length} assessed students` : "Awaiting student assessment data"} icon={<ClipboardList size={18} />} accent="amber" />
    </section>

    <section className="mt-6 grid gap-6 xl:grid-cols-[1fr_1fr]">
      <div className="surface rounded-2xl p-5 sm:p-6" id="readiness"><SectionHeading title="Placement readiness" subtitle="Assessment and resume scores currently recorded in the database." />
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          <ReadinessTile value={ready} label="Ready · 70%+" tone="emerald" />
          <ReadinessTile value={assessed.length - ready - atRisk} label="Developing" tone="blue" />
          <ReadinessTile value={atRisk} label="At risk · under 40%" tone="rose" />
        </div>
        <div className="mt-4 flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2.5 text-xs text-muted dark:bg-slate-800/60"><ClipboardList size={15} />{needsAssessment} student{needsAssessment === 1 ? "" : "s"} need an assessment before readiness can be measured.</div>
      </div>
      <div className="surface rounded-2xl p-5 sm:p-6"><SectionHeading title="Institution setup" subtitle="Manage the current placement workspace." />
        <div className="grid gap-4 sm:grid-cols-2">
          <form action={createBatch} className="rounded-xl border border-[var(--line)] p-4"><h3 className="mb-3 text-sm font-semibold">Create a batch</h3><label className="block text-xs font-medium">Batch name<input name="name" required maxLength={100} placeholder="e.g. CSE 2027 Cohort" className="mt-1.5 h-10 w-full rounded-lg border border-[var(--line)] bg-transparent px-3 text-xs outline-none focus:border-blue-600" /></label><label className="mt-3 block text-xs font-medium">Batch code<input name="code" required maxLength={30} pattern="[A-Za-z0-9-]+" placeholder="e.g. CSE-27-A" className="mt-1.5 h-10 w-full rounded-lg border border-[var(--line)] bg-transparent px-3 text-xs outline-none focus:border-blue-600" /></label><label className="mt-3 block text-xs font-medium">Department<input name="department" maxLength={100} placeholder="e.g. Computer Science" className="mt-1.5 h-10 w-full rounded-lg border border-[var(--line)] bg-transparent px-3 text-xs outline-none focus:border-blue-600" /></label><button className="mt-3 h-9 w-full rounded-lg bg-blue-800 text-xs font-semibold text-white hover:bg-blue-900">Add batch</button></form>
          <form action={assignTrainer} className="rounded-xl border border-[var(--line)] p-4"><h3 className="mb-3 text-sm font-semibold">Assign a trainer</h3><label className="block text-xs font-medium">Batch<select name="batch_id" required defaultValue="" className="mt-1.5 h-10 w-full rounded-lg border border-[var(--line)] bg-[var(--background)] px-3 text-xs outline-none focus:border-blue-600"><option value="" disabled>Select a batch</option>{batches.map((batch) => <option key={batch.id} value={batch.id}>{batch.name}</option>)}</select></label><label className="mt-3 block text-xs font-medium">Trainer email<input name="email" type="email" required placeholder="trainer@college.edu" className="mt-1.5 h-10 w-full rounded-lg border border-[var(--line)] bg-transparent px-3 text-xs outline-none focus:border-blue-600" /></label><p className="mt-2 text-[10px] leading-4 text-muted">Trainer must already have a SkillSync account at your institution.</p><button disabled={!batches.length} className="mt-[22px] h-9 w-full rounded-lg bg-blue-800 text-xs font-semibold text-white hover:bg-blue-900 disabled:opacity-50">Assign trainer</button></form>
        </div>
      </div>
    </section>

    <section className="mt-6 grid gap-6 xl:grid-cols-[1.2fr_.8fr]">
      <div className="surface overflow-hidden rounded-2xl" id="batches"><div className="p-5 pb-3 sm:p-6 sm:pb-3"><SectionHeading title="Batches and trainers" subtitle="Manage trainer access to placement cohorts." /></div>
        {batches.length ? <div className="divide-y divide-[var(--line)]">{batches.map((batch) => {
          const batchTrainers = assigned.filter((item) => item.batch_id === batch.id);
          const memberCount = members.filter((member) => member.batch_id === batch.id).length;
          return <div key={batch.id} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"><div><div className="flex items-center gap-2"><h3 className="text-sm font-semibold">{batch.name}</h3><span className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-[10px] dark:bg-slate-800">{batch.code}</span></div><p className="mt-1 text-xs text-muted">{batch.department ?? "Department not set"} · {memberCount} students</p></div><div className="flex flex-wrap gap-2">{batchTrainers.length ? batchTrainers.map((item) => <div key={item.trainer_id} className="flex items-center gap-2 rounded-full bg-blue-50 py-1 pl-3 pr-1 text-xs text-blue-800 dark:bg-blue-950/50 dark:text-blue-200"><span>{trainerMap.get(item.trainer_id)?.full_name ?? "Trainer"}</span><form action={removeTrainer}><input type="hidden" name="batch_id" value={batch.id} /><input type="hidden" name="trainer_id" value={item.trainer_id} /><button aria-label={`Remove ${trainerMap.get(item.trainer_id)?.full_name ?? "trainer"} from ${batch.name}`} className="grid size-6 place-items-center rounded-full hover:bg-blue-100 dark:hover:bg-blue-900">×</button></form></div>) : <span className="text-xs text-muted">No trainers assigned</span>}</div></div>;
        })}</div> : <div className="p-5"><EmptyState title="No batches yet" description="Create a batch to organize students and assign trainers." icon={<School size={19} />} /></div>}
      </div>
      <div className="surface rounded-2xl p-5 sm:p-6" id="announcements"><SectionHeading title="Announcements" subtitle="Publish updates to your institution." />
        <form action={publishAnnouncement} className="mb-5 space-y-3 rounded-xl border border-[var(--line)] p-4"><label className="block text-xs font-medium">Title<input name="title" required maxLength={150} placeholder="e.g. Placement drive registration" className="mt-1.5 h-10 w-full rounded-lg border border-[var(--line)] bg-transparent px-3 text-xs outline-none focus:border-blue-600" /></label><label className="block text-xs font-medium">Message<textarea name="body" required maxLength={4000} minLength={5} placeholder="Share an update with students and trainers…" className="mt-1.5 min-h-20 w-full rounded-lg border border-[var(--line)] bg-transparent p-3 text-xs outline-none focus:border-blue-600" /></label><button className="flex h-9 w-full items-center justify-center gap-2 rounded-lg bg-blue-800 text-xs font-semibold text-white hover:bg-blue-900"><Megaphone size={14} />Publish announcement</button></form>
        {(announcementResult.data ?? []).length ? <div className="space-y-3">{(announcementResult.data ?? []).slice(0, 3).map((announcement) => <article key={announcement.id} className="rounded-xl bg-slate-50 p-3.5 dark:bg-slate-800/60"><h3 className="text-sm font-semibold">{announcement.title}</h3><p className="mt-1 line-clamp-2 text-xs leading-5 text-muted">{announcement.body}</p><p className="mt-2 text-[10px] text-muted">{announcement.published_at ? new Date(announcement.published_at).toLocaleDateString() : "Draft"}</p></article>)}</div> : <EmptyState title="No announcements yet" description="Published updates will appear here for your institution." icon={<Megaphone size={18} />} />}
      </div>
    </section>
    <section className="surface mt-6 rounded-2xl p-5 sm:p-6"><SectionHeading title="Company readiness" subtitle="Company-specific scores are available when your institution has active company roadmaps." />
      {(companyResult.data ?? []).length ? <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{(companyResult.data ?? []).map((company) => <div key={company.id} className="rounded-xl border border-[var(--line)] p-4"><div className="flex items-center gap-2"><Building2 size={17} className="text-blue-700 dark:text-blue-300" /><span className="text-sm font-semibold">{company.name}</span></div><p className="mt-1 text-xs text-muted">{company.category ?? "Company"} · Readiness insights appear as students record company-roadmap progress.</p></div>)}</div> : <EmptyState title="No company roadmap data" description="Company-specific readiness will be shown when company roadmaps are configured. No readiness estimates are shown without source data." icon={<Building2 size={18} />} />}
    </section>
  </>;
}

function ReadinessTile({ value, label, tone }: { value: number; label: string; tone: "emerald" | "blue" | "rose" }) {
  const styles = { emerald: "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/35 dark:text-emerald-200", blue: "bg-blue-50 text-blue-800 dark:bg-blue-950/35 dark:text-blue-200", rose: "bg-rose-50 text-rose-800 dark:bg-rose-950/35 dark:text-rose-200" };
  return <div className={`rounded-xl p-3 sm:p-4 ${styles[tone]}`}><p className="text-xl font-bold sm:text-2xl">{value}</p><p className="mt-1 text-[10px] font-medium leading-4 sm:text-xs">{label}</p></div>;
}
