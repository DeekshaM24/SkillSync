"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Eye, EyeOff, GraduationCap, LoaderCircle, LockKeyhole } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function updatePassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      const supabase = createClient();
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;
      setSuccess(true);
      window.setTimeout(() => {
        router.push("/onboarding/role");
        router.refresh();
      }, 1200);
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "Unable to update your password.");
    } finally {
      setBusy(false);
    }
  }

  return <main className="grid min-h-screen place-items-center bg-[linear-gradient(125deg,#09162f,#1e40af)] px-4 py-10 text-slate-900">
    <div className="surface w-full max-w-md rounded-3xl p-7 shadow-2xl sm:p-9">
      <Link href="/" className="mb-8 inline-flex items-center gap-2 text-sm text-blue-800 dark:text-blue-200"><ArrowLeft size={16} />Back to sign in</Link>
      <span className="grid size-11 place-items-center rounded-2xl bg-blue-800 text-white"><GraduationCap size={24} /></span>
      <h1 className="mt-5 text-2xl font-semibold">Set a new password</h1>
      <p className="mt-2 text-sm leading-6 text-muted">Choose a new password for your SkillSync account.</p>
      <form onSubmit={updatePassword} className="mt-6 space-y-4">
        <label className="block text-sm font-medium">New password<span className="relative mt-1.5 block"><LockKeyhole size={16} className="absolute left-3 top-3.5 text-slate-400" /><input type={visible ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} required minLength={8} autoComplete="new-password" placeholder="At least 8 characters" className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-12 text-sm outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 dark:border-slate-700 dark:bg-slate-800" /><button type="button" onClick={() => setVisible(!visible)} aria-label={visible ? "Hide password" : "Show password"} className="absolute inset-y-0 right-0 grid w-11 place-items-center text-slate-400">{visible ? <EyeOff size={17} /> : <Eye size={17} />}</button></span></label>
        {error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-700 dark:bg-red-950/50 dark:text-red-300">{error}</p>}
        {success && <p role="status" className="rounded-lg bg-emerald-50 px-3 py-2.5 text-sm text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300">Password updated. Taking you back to your workspace…</p>}
        <button disabled={busy || success} className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-800 text-sm font-semibold text-white hover:bg-blue-900 disabled:opacity-60">{busy ? <LoaderCircle size={18} className="animate-spin" /> : "Update password"}</button>
      </form>
    </div>
  </main>;
}
