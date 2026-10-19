"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(error); }, [error]);
  return <main className="grid min-h-screen place-items-center bg-[var(--background)] px-4 text-[var(--foreground)]"><div className="surface max-w-md rounded-2xl p-8 text-center"><span className="mx-auto grid size-12 place-items-center rounded-full bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-300"><AlertTriangle /></span><h1 className="mt-4 text-xl font-semibold">We hit a snag</h1><p className="mt-2 text-sm leading-6 text-muted">Your data is safe. Try loading this page again, or check your connection and account setup.</p><button onClick={reset} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-800 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-900"><RotateCcw size={16} />Try again</button></div></main>;
}
