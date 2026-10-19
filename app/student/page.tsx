import { Award, CalendarDays, Code2, Flame, GraduationCap, Target, Timer, TrendingUp } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/profile";
import { ActionHint, DueLabel, EmptyState, PageTitle, ProgressRing, SectionHeading, StatCard } from "@/components/dashboard-ui";
import { ReadinessChart } from "@/components/readiness-chart";

type ActivityItem = { label: string; date: string; kind: string };

export default async function StudentDashboard() {
  const profile = await getCurrentProfile("student");
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Your session expired. Please sign in again.");

  const [membershipResult, attemptResult, streakResult, pointResult, badgeResult, resumeResult, interviewResult, submissionResult, progressResult, lessonResult] = await Promise.all([
    supabase.from("batch_members").select("batch_id,batches(name,code)").eq("student_id", user.id),
    supabase.from("test_attempts").select("score,max_score,submitted_at,status,test_id").eq("student_id", user.id).eq("status", "submitted").order("submitted_at", { ascending: false }),
    supabase.from("streaks").select("current_streak,longest_streak,last_activity_date").eq("student_id", user.id).maybeSingle(),
    supabase.from("points_ledger").select("points").eq("student_id", user.id),
    supabase.from("user_badges").select("badge_id,badges(name,description)").eq("student_id", user.id),
    supabase.from("resumes").select("id").eq("student_id", user.id).order("created_at", { ascending: false }).limit(5),
    supabase.from("interviews").select("id").eq("student_id", user.id),
    supabase.from("submissions").select("id,status,created_at,problem_id").eq("student_id", user.id).order("created_at", { ascending: false }),
    supabase.from("lesson_progress").select("lesson_id,completed_at").eq("student_id", user.id),
    supabase.from("lessons").select("id"),
  ]);
  const results = [membershipResult, attemptResult, streakResult, pointResult, badgeResult, resumeResult, interviewResult, submissionResult, progressResult, lessonResult];
  const failed = results.find((result) => result.error);
  if (failed?.error) throw new Error(`Unable to load your dashboard: ${failed.error.message}`);

  const resumeIds = (resumeResult.data ?? []).map((resume) => resume.id);
  const interviewIds = (interviewResult.data ?? []).map((interview) => interview.id);
  const [resumeAnalysisResult, interviewReportResult] = await Promise.all([
    resumeIds.length ? supabase.from("resume_analyses").select("ats_score,created_at").in("resume_id", resumeIds).order("created_at", { ascending: false }).limit(1) : Promise.resolve({ data: [], error: null }),
    interviewIds.length ? supabase.from("interview_reports").select("overall_score,created_at").in("interview_id", interviewIds).order("created_at", { ascending: false }) : Promise.resolve({ data: [], error: null }),
  ]);
  if (resumeAnalysisResult.error || interviewReportResult.error) throw new Error(`Unable to load your placement scores: ${resumeAnalysisResult.error?.message ?? interviewReportResult.error?.message}`);

  const batches = (membershipResult.data ?? []).map((member) => member.batches).filter(Boolean);
  const firstBatch = Array.isArray(batches[0]) ? batches[0][0] : batches[0];
  const batchIds = (membershipResult.data ?? []).map((member) => member.batch_id);
  const assignmentResult = batchIds.length
    ? await supabase.from("test_assignments").select("id,test_id,batch_id,due_at,starts_at,tests(title,duration_minutes)").in("batch_id", batchIds).order("due_at", { ascending: true })
    : { data: [], error: null };
  if (assignmentResult.error) throw new Error(`Unable to load assigned tests: ${assignmentResult.error.message}`);
  const assignments = assignmentResult.data ?? [];

  const attempts = attemptResult.data ?? [];
  const testAccuracy = attempts.length
    ? Math.round(attempts.reduce((sum, attempt) => sum + (attempt.max_score ? Number(attempt.score ?? 0) / Number(attempt.max_score) : 0), 0) / attempts.length * 100)
    : 0;
  const acceptedProblems = new Set((submissionResult.data ?? []).filter((submission) => submission.status === "accepted").map((submission) => submission.problem_id)).size;
  const codingScore = Math.min(100, acceptedProblems * 10);
  const interviewReports = interviewReportResult.data ?? [];
  const interviewScore = interviewReports.length ? Math.round(interviewReports.reduce((sum, item) => sum + Number(item.overall_score ?? 0), 0) / interviewReports.length) : 0;
  const resumeScore = Number(resumeAnalysisResult.data?.[0]?.ats_score ?? profile.resume_score ?? 0);
  const completedLessons = new Set((progressResult.data ?? []).filter((item) => item.completed_at).map((item) => item.lesson_id)).size;
  const courseScore = (lessonResult.data?.length ?? 0) ? Math.round(completedLessons / lessonResult.data!.length * 100) : 0;
  const skillData = [
    { area: "Assessments", score: testAccuracy },
    { area: "Coding", score: codingScore },
    { area: "Interviews", score: interviewScore },
    { area: "Resume", score: resumeScore },
    { area: "Learning", score: courseScore },
  ];
  const readiness = Math.round(skillData.reduce((sum, item) => sum + item.score, 0) / skillData.length);
  const totalPoints = (pointResult.data ?? []).reduce((sum, item) => sum + item.points, 0);

  const testIds = [...new Set(attempts.map((attempt) => attempt.test_id))];
  const [testTitleResult, rankResult] = await Promise.all([
    testIds.length ? supabase.from("tests").select("id,title").in("id", testIds) : Promise.resolve({ data: [], error: null }),
    batchIds.length ? supabase.rpc("get_batch_leaderboard", { target_batch: batchIds[0] }) : Promise.resolve({ data: [], error: null }),
  ]);
  if (testTitleResult.error || rankResult.error) throw new Error(`Unable to load your activity summary: ${testTitleResult.error?.message ?? rankResult.error?.message}`);
  const testTitles = new Map((testTitleResult.data ?? []).map((test) => [test.id, test.title]));
  const rank = (rankResult.data ?? []).find((entry: { student_id: string }) => entry.student_id === user.id);

  const activities: ActivityItem[] = [
    ...attempts.slice(0, 3).map((attempt) => ({ label: `Completed ${testTitles.get(attempt.test_id) ?? "a practice test"}`, date: attempt.submitted_at ?? "", kind: "test" })),
    ...(submissionResult.data ?? []).slice(0, 2).map((submission) => ({ label: `Practiced a coding problem · ${submission.status.replaceAll("_", " ")}`, date: submission.created_at, kind: "code" })),
    ...(progressResult.data ?? []).filter((item) => item.completed_at).slice(0, 2).map((item) => ({ label: "Completed a learning lesson", date: item.completed_at ?? "", kind: "lesson" })),
  ].filter((item) => item.date).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);

  const lowestAreas = [...skillData].sort((a, b) => a.score - b.score).slice(0, 2);
  const hasAnyScore = attempts.length + acceptedProblems + interviewReports.length + resumeIds.length + completedLessons > 0;

  return <>
    <PageTitle eyebrow="Student workspace" title={`Good to see you, ${profile.full_name.split(" ")[0]}`} description={`${firstBatch?.name ?? "Your placement journey"} · Here’s how you’re progressing.`} />
    <section className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
      <div className="surface rounded-2xl p-5 sm:p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <div className="flex items-center gap-5 sm:w-[47%]"><ProgressRing value={readiness} label="Readiness" /><div><p className="text-sm font-semibold">Your placement readiness</p><p className="mt-1.5 max-w-48 text-xs leading-5 text-muted">Calculated from recorded assessments, coding, interview, resume, and course progress.</p>{!hasAnyScore && <p className="mt-2 text-xs font-medium text-blue-700 dark:text-blue-300">Start your first activity to establish a baseline.</p>}</div></div>
          <div className="hidden h-20 w-px bg-[var(--line)] sm:block" />
          <div className="grid flex-1 grid-cols-2 gap-x-4 gap-y-3">{skillData.map((item) => <div key={item.area}><div className="mb-1 flex justify-between text-[11px]"><span className="text-muted">{item.area}</span><span className="font-semibold">{item.score}%</span></div><div className="h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800"><div className="h-full rounded-full bg-blue-700 transition-all" style={{ width: `${item.score}%` }} /></div></div>)}</div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3"><StatCard label="Current streak" value={`${streakResult.data?.current_streak ?? 0} days`} detail={streakResult.data?.longest_streak ? `Best: ${streakResult.data.longest_streak} days` : "Record a learning activity"} icon={<Flame size={18} />} accent="amber" /><StatCard label="Points earned" value={totalPoints.toLocaleString()} detail="From completed activities" icon={<Award size={18} />} accent="violet" /><StatCard label="Problems solved" value={acceptedProblems} detail="Unique accepted solutions" icon={<Code2 size={18} />} accent="emerald" /><StatCard label="Tests completed" value={attempts.length} detail="Submitted assessments" icon={<Target size={18} />} /></div>
    </section>

    <section className="mt-6 grid gap-6 xl:grid-cols-[1.35fr_1fr]">
      <div className="surface rounded-2xl p-5 sm:p-6" id="tests">
        <SectionHeading title="Upcoming assigned tests" subtitle="Keep an eye on your next checkpoints." />
        {assignments.length ? <div className="divide-y divide-[var(--line)]">{assignments.slice(0, 4).map((assignment) => {
          const test = assignment.tests?.[0] ?? null;
          const completed = attempts.some((attempt) => attempt.test_id === assignment.test_id);
          return <div key={assignment.id} className="flex items-center gap-3 py-3.5 first:pt-1 last:pb-0"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-200"><CalendarDays size={18} /></span><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{test?.title ?? "Assigned assessment"}</p><p className="mt-1 flex items-center gap-2 text-xs text-muted"><Timer size={13} />{test?.duration_minutes ?? "—"} min <span>·</span><DueLabel date={assignment.due_at} /></p></div><span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${completed ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300" : "bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-200"}`}>{completed ? "Completed" : "Upcoming"}</span></div>;
        })}</div> : <EmptyState title="No tests assigned yet" description="When your trainer assigns a test to your batch, it will appear here." icon={<CalendarDays size={19} />} />}
      </div>
      <div className="surface rounded-2xl p-5 sm:p-6"><SectionHeading title="Your skill snapshot" subtitle="Built from your saved SkillSync activity." /><ReadinessChart data={skillData} /></div>
    </section>

    <section className="mt-6 grid gap-6 xl:grid-cols-3">
      <div className="surface rounded-2xl p-5 sm:p-6" id="learning"><SectionHeading title="Recommended next actions" subtitle="Start with the areas that need the most practice." />
        {hasAnyScore ? <div className="space-y-3">{lowestAreas.map((area) => <ActionHint key={area.area} title={area.score ? `Strengthen ${area.area.toLowerCase()}` : `Start ${area.area.toLowerCase()} practice`} detail={area.score ? `Your recorded progress is ${area.score}%. A focused practice session can help build consistency.` : `There’s no ${area.area.toLowerCase()} activity yet, so this is a good place to begin.`} />)}</div> : <ActionHint title="Take your first assessment" detail="Your test scores establish the baseline for personalized next steps." href="/student#tests" />}
      </div>
      <div className="surface rounded-2xl p-5 sm:p-6"><SectionHeading title="This week" subtitle="Days with recorded placement activity." />
        <div className="grid grid-cols-7 gap-1.5">{Array.from({ length: 7 }, (_, index) => {
          const date = new Date(); date.setDate(date.getDate() - (6 - index));
          const key = date.toISOString().slice(0, 10);
          const active = activities.some((activity) => activity.date.slice(0, 10) === key);
          return <div key={key} className="text-center"><div className={`mx-auto mb-2 grid size-8 place-items-center rounded-lg ${active ? "bg-blue-700 text-white" : "bg-slate-100 text-slate-400 dark:bg-slate-800"}`}>{active ? <span className="size-1.5 rounded-full bg-white" /> : <span className="size-1.5 rounded-full bg-slate-300 dark:bg-slate-600" />}</div><span className="text-[10px] text-muted">{new Intl.DateTimeFormat("en", { weekday: "short" }).format(date)}</span></div>;
        })}</div><p className="mt-4 text-xs text-muted">Your activity streak is <strong className="font-semibold text-[var(--foreground)]">{streakResult.data?.current_streak ?? 0} days</strong> today.</p>
      </div>
      <div className="surface rounded-2xl p-5 sm:p-6"><SectionHeading title="Batch standing" subtitle={firstBatch?.name ?? "Your batch"} />
        {rank ? <div className="flex items-center gap-3 rounded-xl bg-blue-50 p-4 dark:bg-blue-950/40"><span className="grid size-11 place-items-center rounded-xl bg-white text-blue-800 dark:bg-slate-800 dark:text-blue-200"><TrendingUp size={21} /></span><div><p className="text-lg font-bold">#{rank.rank}</p><p className="text-xs text-muted">of {rank.total_students} students · ranked by earned points</p></div></div> : <EmptyState title="Batch rank not available yet" description="Join your batch and earn points from completed activities to appear in the leaderboard." icon={<GraduationCap size={19} />} />}
        <div className="mt-4 border-t border-[var(--line)] pt-4"><SectionHeading title="Recent activity" />
          {activities.length ? <div className="space-y-3">{activities.slice(0, 3).map((activity, index) => <div key={`${activity.kind}-${activity.date}`} className="flex items-center gap-2.5"><span className={`size-2 rounded-full ${index === 0 ? "bg-blue-600" : "bg-slate-300 dark:bg-slate-600"}`} /><div className="min-w-0 flex-1 truncate text-xs font-medium">{activity.label}</div><span className="shrink-0 text-[10px] text-muted">{new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(new Date(activity.date))}</span></div>)}</div> : <p className="text-xs text-muted">Your completed work will show here.</p>}
        </div>
      </div>
    </section>
    <p className="mt-5 text-center text-[10px] text-muted">Readiness indicators are calculated from your saved activity and update as you progress. {badgeResult.data?.length ? `${badgeResult.data.length} badge${badgeResult.data.length === 1 ? "" : "s"} earned.` : ""}</p>
  </>;
}
