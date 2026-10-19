export default function Loading() {
  return <main aria-label="Loading SkillSync" className="min-h-screen bg-[var(--background)] px-4 py-8 sm:px-8">
    <div className="mx-auto max-w-6xl animate-pulse">
      <div className="mb-8 h-4 w-32 rounded bg-slate-200 dark:bg-slate-800" />
      <div className="mb-2 h-8 w-64 rounded bg-slate-200 dark:bg-slate-800" />
      <div className="mb-8 h-4 w-80 max-w-full rounded bg-slate-200 dark:bg-slate-800" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{Array.from({ length: 4 }, (_, index) => <div key={index} className="surface h-28 rounded-2xl p-5"><div className="h-3 w-24 rounded bg-slate-200 dark:bg-slate-800" /><div className="mt-4 h-7 w-16 rounded bg-slate-200 dark:bg-slate-800" /></div>)}</div>
      <div className="mt-6 grid gap-6 lg:grid-cols-2"><div className="surface h-72 rounded-2xl" /><div className="surface h-72 rounded-2xl" /></div>
    </div>
  </main>;
}
