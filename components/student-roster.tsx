"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { saveTrainerFeedback } from "@/app/trainer/actions";

export type RosterStudent = {
  id: string;
  full_name: string;
  email: string | null;
  department: string | null;
  year_of_study: number | null;
  roll_number: string | null;
  score: number | null;
  batch_id: string;
  batch_name: string;
};

export function StudentRoster({ students, classAverage }: { students: RosterStudent[]; classAverage: number | null }) {
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("all");
  const [assessment, setAssessment] = useState("all");
  const departments = useMemo(() => [...new Set(students.map((student) => student.department).filter((value): value is string => Boolean(value)))].sort(), [students]);
  const filtered = students.filter((student) => {
    const matchesSearch = `${student.full_name} ${student.email ?? ""} ${student.roll_number ?? ""}`.toLowerCase().includes(search.toLowerCase());
    const matchesDepartment = department === "all" || student.department === department;
    const matchesAssessment = assessment === "all" || (assessment === "assessed" && student.score !== null) || (assessment === "unassessed" && student.score === null) || (assessment === "at-risk" && student.score !== null && student.score < 40);
    return matchesSearch && matchesDepartment && matchesAssessment;
  });

  return <>
    <div className="mb-4 flex flex-col gap-2 sm:flex-row">
      <label className="relative min-w-0 flex-1"><span className="sr-only">Search students</span><Search size={16} className="absolute left-3 top-3 text-slate-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name, email or roll number" className="h-10 w-full rounded-xl border border-[var(--line)] bg-transparent pl-9 pr-3 text-xs outline-none focus:border-blue-600" /></label>
      <label><span className="sr-only">Filter by department</span><select value={department} onChange={(event) => setDepartment(event.target.value)} className="h-10 w-full rounded-xl border border-[var(--line)] bg-[var(--background)] px-3 text-xs outline-none focus:border-blue-600 sm:w-44"><option value="all">All departments</option>{departments.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
      <label><span className="sr-only">Filter assessment status</span><select value={assessment} onChange={(event) => setAssessment(event.target.value)} className="h-10 w-full rounded-xl border border-[var(--line)] bg-[var(--background)] px-3 text-xs outline-none focus:border-blue-600 sm:w-40"><option value="all">All students</option><option value="assessed">Assessed</option><option value="unassessed">Not assessed</option><option value="at-risk">Below 40%</option></select></label>
    </div>
    <div className="overflow-x-auto"><table className="w-full min-w-[780px] text-left text-xs"><thead className="bg-slate-50 text-[10px] uppercase tracking-wide text-muted dark:bg-slate-800/60"><tr><th className="px-4 py-3 font-semibold">Student</th><th className="px-4 py-3 font-semibold">Department</th><th className="px-4 py-3 font-semibold">Batch</th><th className="px-4 py-3 font-semibold">Assessment average</th><th className="px-4 py-3 font-semibold">vs class average</th><th className="px-4 py-3 font-semibold">Feedback</th></tr></thead><tbody className="divide-y divide-[var(--line)]">{filtered.map((student) => {
      const difference = student.score !== null && classAverage !== null ? student.score - classAverage : null;
      return <tr key={student.id}><td className="px-4 py-3.5"><span className="font-semibold">{student.full_name}</span><span className="mt-0.5 block text-[10px] text-muted">{student.roll_number ?? student.email}</span></td><td className="px-4 py-3.5 text-muted">{student.department ?? "—"}</td><td className="px-4 py-3.5 text-muted">{student.batch_name}</td><td className="px-4 py-3.5">{student.score === null ? <span className="text-muted">Not assessed</span> : <span className={`font-semibold ${student.score < 40 ? "text-rose-600" : "text-emerald-700"}`}>{student.score}%</span>}</td><td className="px-4 py-3.5">{difference === null ? <span className="text-muted">—</span> : <span className={`font-semibold ${difference >= 0 ? "text-emerald-700" : "text-amber-700"}`}>{difference >= 0 ? "+" : ""}{difference} pts</span>}</td><td className="px-4 py-3.5"><details className="group"><summary className="cursor-pointer list-none text-blue-700 hover:underline dark:text-blue-300">Add feedback</summary><form action={saveTrainerFeedback} className="absolute z-10 mt-2 w-64 rounded-xl border border-[var(--line)] bg-white p-3 shadow-xl dark:bg-slate-900"><input type="hidden" name="batch_id" value={student.batch_id} /><input type="hidden" name="student_id" value={student.id} /><textarea name="feedback" required maxLength={2000} placeholder="Write specific, constructive feedback…" className="min-h-20 w-full rounded-lg border border-[var(--line)] bg-transparent p-2 text-xs outline-none focus:border-blue-600" /><button className="mt-2 rounded-lg bg-blue-800 px-3 py-2 text-[10px] font-semibold text-white">Save feedback</button></form></details></td></tr>;
    })}{filtered.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-xs text-muted">No students match these search and filter settings.</td></tr>}</tbody></table></div>
    <p className="mt-3 text-[10px] text-muted">Showing {filtered.length} of {students.length} students. {classAverage === null ? "Class average appears after students submit an assessment." : `Class average: ${classAverage}%.`}</p>
  </>;
}
