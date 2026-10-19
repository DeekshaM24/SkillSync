import { ArrowUpRight, Check, CircleDashed, Clock3, Sparkles } from "lucide-react";
import Link from "next/link";

export function PageTitle({ eyebrow, title, description, action }: { eyebrow?: string; title: string; description?: string; action?: React.ReactNode }) {
  return <div className="mb-7 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between"><div>{eyebrow && <p className="mb-1.5 text-xs font-semibold uppercase tracking-[.15em] text-blue-700 dark:text-blue-300">{eyebrow}</p>}<h1 className="text-2xl font-semibold tracking-tight sm:text-[30px]">{title}</h1>{description && <p className="mt-1.5 text-sm text-muted">{description}</p>}</div>{action}</div>;
}

export function SectionHeading({ title, subtitle, href, action }: { title: string; subtitle?: string; href?: string; action?: string }) {
  return <div className="mb-4 flex items-end justify-between"><div><h2 className="text-base font-semibold">{title}</h2>{subtitle && <p className="mt-1 text-xs text-muted">{subtitle}</p>}</div>{href && <Link href={href} className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 hover:text-blue-900 dark:text-blue-300">{action ?? "View all"}<ArrowUpRight size={14} /></Link>}</div>;
}

export function StatCard({ label, value, detail, icon, accent = "blue" }: { label: string; value: string | number; detail?: string; icon: React.ReactNode; accent?: "blue" | "violet" | "emerald" | "amber" }) {
  const colors = { blue: "bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-200", violet: "bg-violet-50 text-violet-700 dark:bg-violet-950/50 dark:text-violet-200", emerald: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-200", amber: "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-200" };
  return <div className="surface rounded-2xl p-4 sm:p-5"><div className="flex items-start justify-between"><div><p className="text-xs font-medium text-muted">{label}</p><p className="mt-2 text-2xl font-semibold tracking-tight">{value}</p></div><span className={`grid size-9 place-items-center rounded-xl ${colors[accent]}`}>{icon}</span></div>{detail && <p className="mt-2 text-xs text-muted">{detail}</p>}</div>;
}

export function EmptyState({ title, description, icon = <CircleDashed size={20} /> }: { title: string; description: string; icon?: React.ReactNode }) {
  return <div className="flex min-h-36 flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--line)] px-5 py-7 text-center"><span className="mb-3 grid size-10 place-items-center rounded-full bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300">{icon}</span><p className="text-sm font-semibold">{title}</p><p className="mt-1 max-w-sm text-xs leading-5 text-muted">{description}</p></div>;
}

export function ProgressRing({ value, label }: { value: number; label: string }) {
  const bounded = Math.max(0, Math.min(value, 100));
  const circumference = 2 * Math.PI * 43;
  return <div className="relative grid size-[120px] place-items-center" aria-label={`${label}: ${bounded}%`}>
    <svg viewBox="0 0 100 100" className="absolute inset-0 size-full -rotate-90"><circle cx="50" cy="50" r="43" fill="none" stroke="currentColor" strokeWidth="8" className="text-slate-100 dark:text-slate-800" /><circle cx="50" cy="50" r="43" fill="none" stroke="currentColor" strokeWidth="8" strokeLinecap="round" strokeDasharray={`${(bounded / 100) * circumference} ${circumference}`} className="text-blue-700 dark:text-blue-300" /></svg>
    <div className="text-center"><p className="text-2xl font-bold">{bounded}%</p><p className="text-[10px] text-muted">{label}</p></div>
  </div>;
}

export function ActionHint({ title, detail, href = "/student#learning" }: { title: string; detail: string; href?: string }) {
  return <Link href={href} className="group flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50/65 p-3.5 transition hover:border-blue-200 hover:bg-blue-50 dark:border-blue-900/60 dark:bg-blue-950/25 dark:hover:bg-blue-950/40"><span className="mt-0.5 text-blue-700 dark:text-blue-300"><Sparkles size={17} /></span><span className="flex-1"><span className="block text-sm font-semibold">{title}</span><span className="mt-1 block text-xs leading-5 text-muted">{detail}</span></span><span className="mt-1 text-slate-400 group-hover:text-blue-700"><Check size={15} /></span></Link>;
}

export function DueLabel({ date }: { date: string | null }) {
  if (!date) return <span className="text-xs text-muted">No due date</span>;
  const remaining = new Date(date).getTime() - Date.now();
  const label = remaining <= 0 ? "Past due" : remaining < 86_400_000 ? "Due today" : `Due ${new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(new Date(date))}`;
  return <span className={`inline-flex items-center gap-1 text-xs ${remaining <= 0 ? "text-rose-600" : "text-muted"}`}><Clock3 size={13} />{label}</span>;
}
