"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTheme } from "next-themes";
import * as Tabs from "@radix-ui/react-tabs";
import { ArrowRight, BookOpenCheck, Eye, EyeOff, GraduationCap, Languages, LoaderCircle, Moon, ShieldCheck, Sun, Target, Trophy } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const scenes = [
  "/images/campus.jpg",
  "/images/interview.jpg",
  "/images/coding.jpg",
];

export default function LoginPage() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [scene, setScene] = useState(0);
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [language, setLanguage] = useState<"EN" | "हि">("EN");
  const [mounted, setMounted] = useState(false);
  const hindi = language === "हि";

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    const timer = window.setInterval(() => setScene((current) => (current + 1) % scenes.length), 8000);
    if (new URLSearchParams(window.location.search).get("error") === "auth_callback_failed") {
      setError("Sign-in could not be completed. Check your account configuration and try again.");
      window.history.replaceState({}, "", "/");
    }
    return () => window.clearInterval(timer);
  }, []);
  useEffect(() => {
    document.documentElement.lang = hindi ? "hi" : "en";
  }, [hindi]);

  async function handleAuth(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");
    if (password.length < 8) {
      setError("Use a password with at least 8 characters.");
      return;
    }
    setBusy(true);
    try {
      const supabase = createClient();
      if (mode === "signup") {
        const { data, error: authError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
        });
        if (authError) throw authError;
        if (!data.session) {
          setNotice("Check your email to confirm your account, then come back to sign in.");
          return;
        }
      } else {
        const { error: authError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (authError) throw authError;
      }
      router.push("/onboarding/role");
      router.refresh();
    } catch (authError) {
      setError(authError instanceof Error ? authError.message : "We couldn't sign you in. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function googleSignIn() {
    setBusy(true);
    setError("");
    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}/auth/callback` },
      });
      if (authError) throw authError;
    } catch (authError) {
      setError(authError instanceof Error ? authError.message : "Google sign-in is unavailable right now.");
      setBusy(false);
    }
  }

  async function resetPassword() {
    setError("");
    setNotice("");
    if (!email.trim()) {
      setError("Enter your email address first so we know where to send the reset link.");
      return;
    }
    setBusy(true);
    try {
      const supabase = createClient();
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/auth/callback?next=/auth/reset-password`,
      });
      if (resetError) throw resetError;
      setNotice("If an account exists for that address, a password reset link is on its way.");
    } catch (resetError) {
      setError(resetError instanceof Error ? resetError.message : "Unable to request a password reset.");
    } finally {
      setBusy(false);
    }
  }

  const authContent = <>
    <button onClick={googleSignIn} disabled={busy} className="flex h-12 w-full items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700">
      <GoogleMark /> {hindi ? "Google के साथ जारी रखें" : "Continue with Google"}
    </button>
    <div className="my-5 flex items-center gap-3 text-xs text-slate-400"><span className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />{hindi ? "या ईमेल से जारी रखें" : "or continue with email"}<span className="h-px flex-1 bg-slate-200 dark:bg-slate-700" /></div>
    <form onSubmit={handleAuth} className="space-y-4">
      <label className="block text-sm font-medium">{hindi ? "ईमेल पता" : "Email address"}
        <input type="email" required autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder={hindi ? "आप@कॉलेज.edu" : "you@college.edu"} className="mt-1.5 h-12 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
      </label>
      <label className="block text-sm font-medium">{hindi ? "पासवर्ड" : "Password"}
        <span className="relative mt-1.5 block">
          <input type={visible ? "text" : "password"} required minLength={8} autoComplete={mode === "login" ? "current-password" : "new-password"} value={password} onChange={(event) => setPassword(event.target.value)} placeholder={hindi ? "कम से कम 8 अक्षर" : "At least 8 characters"} className="h-12 w-full rounded-xl border border-slate-200 bg-white px-3.5 pr-12 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
          <button type="button" onClick={() => setVisible(!visible)} aria-label={visible ? "Hide password" : "Show password"} className="absolute inset-y-0 right-0 grid w-12 place-items-center text-slate-400 hover:text-slate-700 dark:hover:text-white">{visible ? <EyeOff size={17} /> : <Eye size={17} />}</button>
        </span>
      </label>
      {mode === "login" && <div className="-mt-1 text-right"><button type="button" disabled={busy} onClick={resetPassword} className="text-xs font-medium text-blue-700 hover:text-blue-900 dark:text-blue-300">{hindi ? "पासवर्ड भूल गए?" : "Forgot password?"}</button></div>}
      {error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-700 dark:bg-red-950/50 dark:text-red-300">{error}</p>}
      {notice && <p role="status" className="rounded-lg bg-emerald-50 px-3 py-2.5 text-sm text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300">{notice}</p>}
      <button type="submit" disabled={busy} className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-800 text-sm font-semibold text-white shadow-lg shadow-blue-900/15 transition hover:bg-blue-900 disabled:cursor-not-allowed disabled:opacity-70">
        {busy ? <LoaderCircle size={18} className="animate-spin" /> : <>{mode === "login" ? (hindi ? "SkillSync में लॉग इन करें" : "Sign in to SkillSync") : (hindi ? "खाता बनाएँ" : "Create account")}<ArrowRight size={17} /></>}
      </button>
    </form>
    <div className="mt-5 flex items-center justify-center gap-1.5 text-xs text-slate-400"><ShieldCheck size={14} />{hindi ? "आपका खाता और प्रगति निजी रहती है।" : "Your account and progress stay private."}</div>
  </>;

  return (
    <main className="relative flex min-h-screen items-stretch overflow-hidden bg-slate-950 text-white">
      {scenes.map((image, index) => (
        <div key={image} aria-hidden="true" className="auth-bg absolute inset-0 transition-opacity duration-[1800ms]" style={{ backgroundImage: `linear-gradient(112deg,rgba(8,20,52,.89),rgba(19,54,119,.72) 50%,rgba(10,20,42,.66)),url("${image}")`, opacity: scene === index ? 1 : 0 }} />
      ))}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950/10 via-transparent to-slate-950/35" />

      <section className="relative z-10 hidden w-1/2 flex-col justify-between p-12 lg:flex xl:p-20" aria-label="SkillSync introduction">
        <Link href="/" className="flex w-fit items-center gap-3" aria-label="SkillSync home">
          <span className="grid size-11 place-items-center rounded-2xl bg-white/15 ring-1 ring-white/25"><GraduationCap size={25} /></span>
          <span className="text-xl font-semibold tracking-tight">SkillSync</span>
        </Link>
        <div className="max-w-xl pb-10">
          <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3.5 py-2 text-xs font-medium tracking-wide text-blue-50 backdrop-blur-md"><span className="size-2 rounded-full bg-emerald-300" />{hindi ? "आपकी प्लेसमेंट यात्रा, एक नज़र में" : "YOUR PLACEMENT JOURNEY, IN FOCUS"}</p>
          <h1 className="text-5xl font-semibold leading-[1.12] tracking-tight xl:text-6xl">{hindi ? <>रिज़्यूमे से<br />ऑफ़र लेटर तक</> : <>From Resume<br />to Offer Letter</>}<span className="text-blue-300">.</span></h1>
          <p className="mt-5 max-w-md text-lg leading-8 text-blue-50/80">{hindi ? "अपने अगले अवसर को पाने के लिए कौशल और आत्मविश्वास विकसित करें।" : "Build the skills, confidence, and momentum to make your next opportunity yours."}</p>
          <div className="mt-11 grid gap-5">
            <Feature icon={<Target size={18} />} title={hindi ? "अपनी तैयारी जानें" : "Know where you stand"} text={hindi ? "अपनी प्रगति और तैयारी को साफ़ तौर पर देखें।" : "See your readiness clearly, with progress that means something."} />
            <Feature icon={<BookOpenCheck size={18} />} title={hindi ? "लक्ष्य के साथ अभ्यास करें" : "Practice with purpose"} text={hindi ? "आपकी सीखने की राह उन कौशलों पर केंद्रित है जिन्हें आप निखारना चाहते हैं।" : "Your learning path adapts to the skills you want to strengthen."} />
            <Feature icon={<Trophy size={18} />} title={hindi ? "हर कदम मायने रखता है" : "Make every step count"} text={hindi ? "नियमित रहें, अपनी जीत का जश्न मनाएँ और आगे बढ़ें।" : "Stay consistent, celebrate wins, and keep moving forward."} />
          </div>
        </div>
        <p className="text-xs text-white/55">Built for your next chapter · © {new Date().getFullYear()} SkillSync</p>
      </section>

      <section className="relative z-10 flex w-full items-center justify-center px-4 py-8 sm:px-8 lg:w-1/2 lg:px-12">
        <div className="absolute right-5 top-5 flex items-center gap-2 sm:right-8 sm:top-8">
          <button onClick={() => setLanguage(hindi ? "EN" : "हि")} className="flex h-10 items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 text-sm text-white backdrop-blur-md hover:bg-white/20" aria-label="Switch language">
            <Languages size={16} />{language}
          </button>
          <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")} className="grid size-10 place-items-center rounded-full border border-white/25 bg-white/10 text-white backdrop-blur-md hover:bg-white/20" aria-label="Toggle color theme">
            {mounted && theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
          </button>
        </div>
        <div className="surface w-full max-w-[440px] rounded-[28px] border-white/25 bg-white/95 p-6 text-slate-900 shadow-[0_25px_90px_rgba(2,8,23,.35)] backdrop-blur-2xl dark:border-slate-700 dark:bg-slate-900/95 dark:text-white sm:p-9">
          <div className="mb-7 lg:hidden">
            <div className="mb-3 flex items-center gap-2.5"><span className="grid size-9 place-items-center rounded-xl bg-blue-700 text-white"><GraduationCap size={21} /></span><span className="font-semibold">SkillSync</span></div>
            <h1 className="text-2xl font-semibold tracking-tight">{hindi ? "आपकी सफलता की अगली सीढ़ी" : "From Resume to Offer Letter"}</h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{hindi ? "प्लेसमेंट की तैयारी, एक ही जगह।" : "Your placement journey starts here."}</p>
          </div>
          <div className="mb-6 hidden lg:block">
            <h2 className="text-2xl font-semibold tracking-tight">{mode === "login" ? (hindi ? "वापस स्वागत है" : "Welcome back") : (hindi ? "अपना खाता बनाएँ" : "Create your account")}</h2>
            <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">{mode === "login" ? (hindi ? "अपनी तैयारी वहीं से शुरू करें जहाँ छोड़ी थी।" : "Pick up where your preparation left off.") : (hindi ? "प्लेसमेंट की ओर अपना रास्ता बनाएँ।" : "Start building your path to placement.")}</p>
          </div>
          <Tabs.Root value={mode} onValueChange={(value) => { if (value === "login" || value === "signup") { setMode(value); setError(""); setNotice(""); } }}>
            <Tabs.List className="mb-5 grid grid-cols-2 rounded-xl bg-slate-100 p-1 dark:bg-slate-800" aria-label="Authentication mode">
              <Tabs.Trigger value="login" className={`rounded-lg py-2.5 text-sm font-medium transition data-[state=active]:bg-white data-[state=active]:text-blue-800 data-[state=active]:shadow-sm dark:data-[state=active]:bg-slate-700 dark:data-[state=active]:text-blue-200 ${mode !== "login" ? "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white" : ""}`}>{hindi ? "लॉग इन" : "Sign in"}</Tabs.Trigger>
              <Tabs.Trigger value="signup" className={`rounded-lg py-2.5 text-sm font-medium transition data-[state=active]:bg-white data-[state=active]:text-blue-800 data-[state=active]:shadow-sm dark:data-[state=active]:bg-slate-700 dark:data-[state=active]:text-blue-200 ${mode !== "signup" ? "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white" : ""}`}>{hindi ? "साइन अप" : "Create account"}</Tabs.Trigger>
            </Tabs.List>
            <Tabs.Content value="login" className="outline-none">{authContent}</Tabs.Content>
            <Tabs.Content value="signup" className="outline-none">{authContent}</Tabs.Content>
          </Tabs.Root>
        </div>
      </section>
    </main>
  );
}

function Feature({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return <div className="flex items-start gap-3"><span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-xl border border-white/15 bg-white/10 text-blue-200">{icon}</span><div><p className="text-sm font-semibold">{title}</p><p className="mt-0.5 text-sm leading-6 text-blue-50/70">{text}</p></div></div>;
}

function GoogleMark() {
  return <svg aria-hidden="true" width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5Z" /><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.93c-.58 2.96-2.25 5.48-4.74 7.18l7.73 6C44.42 37.98 46.98 31.81 46.98 24.55Z" /><path fill="#FBBC05" d="M10.53 28.59a14.45 14.45 0 0 1 0-9.18l-7.98-6.19a23.92 23.92 0 0 0 0 21.56l7.98-6.19Z" /><path fill="#34A853" d="M24 48c6.48 0 11.94-2.13 15.92-5.8l-7.73-6c-2.15 1.45-4.92 2.3-8.19 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48Z" /></svg>;
}
