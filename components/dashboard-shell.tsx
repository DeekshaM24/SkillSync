"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { createClient } from "@/lib/supabase/client";
import { cn, initials } from "@/lib/utils";
import type { Profile, Role } from "@/lib/types";
import { Activity, Bell, BookOpen, Building2, CalendarDays, ChartNoAxesCombined, GraduationCap, LayoutDashboard, LogOut, Menu, Moon, Sun, UsersRound, X } from "lucide-react";

const nav: Record<Role, { label: string; href: string; icon: typeof LayoutDashboard }[]> = {
  student: [
    { label: "Overview", href: "/student", icon: LayoutDashboard },
    { label: "My learning", href: "/student#learning", icon: BookOpen },
    { label: "Test schedule", href: "/student#tests", icon: CalendarDays },
    { label: "Activity", href: "/student#activity", icon: Activity },
  ],
  trainer: [
    { label: "Overview", href: "/trainer", icon: LayoutDashboard },
    { label: "My batches", href: "/trainer#batches", icon: UsersRound },
    { label: "Students", href: "/trainer#students", icon: GraduationCap },
    { label: "Reviews", href: "/trainer#reviews", icon: ChartNoAxesCombined },
  ],
  admin: [
    { label: "Overview", href: "/admin", icon: LayoutDashboard },
    { label: "Batches", href: "/admin#batches", icon: UsersRound },
    { label: "Readiness", href: "/admin#readiness", icon: ChartNoAxesCombined },
    { label: "Announcements", href: "/admin#announcements", icon: Bell },
  ],
};

const roleLabel: Record<Role, string> = { student: "Student workspace", trainer: "Trainer workspace", admin: "Placement office" };

export function DashboardShell({ profile, children }: { profile: Profile; children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [mobileMenu, setMobileMenu] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [mounted, setMounted] = useState(false);
  const links = nav[profile.role];
  useEffect(() => setMounted(true), []);
  async function signOut() {
    setSigningOut(true);
    const { error } = await createClient().auth.signOut();
    if (error) {
      setSigningOut(false);
      window.alert(`Couldn't sign you out: ${error.message}`);
      return;
    }
    router.push("/");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[250px] border-r border-[var(--line)] bg-white px-4 py-5 dark:bg-[#101a2a] lg:flex lg:flex-col">
        <Link href={`/${profile.role}`} className="mb-9 flex items-center gap-3 px-2">
          <span className="grid size-10 place-items-center rounded-xl bg-blue-800 text-white"><GraduationCap size={22} /></span>
          <span><span className="block text-base font-bold tracking-tight">SkillSync</span><span className="block text-[10px] font-medium uppercase tracking-[.17em] text-muted">{roleLabel[profile.role]}</span></span>
        </Link>
        <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[.18em] text-slate-400">Workspace</p>
        <nav className="space-y-1" aria-label="Main navigation">
          {links.map(({ label, href, icon: Icon }) => <NavLink key={href} href={href} active={pathname === href}><Icon size={18} />{label}</NavLink>)}
        </nav>
        <div className="mt-auto space-y-1 border-t border-[var(--line)] pt-4">
          {profile.institution_id && <div className="mb-3 flex items-center gap-2.5 rounded-xl bg-slate-50 px-3 py-3 text-xs text-muted dark:bg-slate-800/60"><Building2 size={16} /><span className="truncate">Institution workspace</span></div>}
          <button onClick={signOut} disabled={signingOut} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-500 hover:bg-slate-100 hover:text-slate-900 disabled:opacity-50 dark:text-slate-300 dark:hover:bg-slate-800"><LogOut size={17} />{signingOut ? "Signing out…" : "Sign out"}</button>
        </div>
      </aside>
      {mobileMenu && <div className="fixed inset-0 z-50 bg-slate-950/50 lg:hidden" onClick={() => setMobileMenu(false)}>
        <aside className="flex h-full w-[min(82vw,300px)] flex-col bg-white px-4 py-5 text-slate-900 dark:bg-[#101a2a] dark:text-white" onClick={(event) => event.stopPropagation()}>
          <div className="mb-8 flex items-center justify-between"><Link href={`/${profile.role}`} className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-blue-800 text-white"><GraduationCap size={22} /></span><span className="font-bold">SkillSync</span></Link><button onClick={() => setMobileMenu(false)} aria-label="Close navigation"><X /></button></div>
          <nav className="space-y-1" aria-label="Mobile navigation">{links.map(({ label, href, icon: Icon }) => <Link key={href} href={href} onClick={() => setMobileMenu(false)} className={cn("flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium", pathname === href ? "bg-blue-50 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200" : "text-slate-500 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800")} aria-current={pathname === href ? "page" : undefined}><Icon size={18} />{label}</Link>)}</nav>
          <button onClick={signOut} disabled={signingOut} className="mt-auto flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-slate-500 disabled:opacity-50"><LogOut size={17} />{signingOut ? "Signing out…" : "Sign out"}</button>
        </aside>
      </div>}
      <div className="lg:pl-[250px]">
        <header className="sticky top-0 z-20 flex h-[70px] items-center justify-between border-b border-[var(--line)] bg-white/90 px-4 backdrop-blur-xl dark:bg-[#101a2a]/90 sm:px-7">
          <button onClick={() => setMobileMenu(true)} className="grid size-10 place-items-center rounded-xl text-slate-600 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800 lg:hidden" aria-label="Open navigation"><Menu size={21} /></button>
          <div className="hidden text-sm text-muted sm:block">{profile.institution_id ? "Your progress, all in one place" : "Your personal learning space"}</div>
          <div className="ml-auto flex items-center gap-3">
            <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")} className="grid size-9 place-items-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800" aria-label="Toggle color theme">{mounted && theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}</button>
            <span className="hidden h-8 w-px bg-[var(--line)] sm:block" />
            <div className="flex items-center gap-2.5">
              <span className="hidden text-right sm:block"><span className="block max-w-40 truncate text-sm font-semibold">{profile.full_name}</span><span className="block text-xs capitalize text-muted">{profile.role === "admin" ? "Placement Officer" : profile.role}</span></span>
              <span className="grid size-9 place-items-center rounded-full bg-blue-100 text-xs font-bold text-blue-800 dark:bg-blue-900/70 dark:text-blue-100">{initials(profile.full_name)}</span>
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-[1450px] px-4 pb-24 pt-7 sm:px-7 sm:pt-9 lg:px-10 lg:pb-10">{children}</main>
        <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 border-t border-[var(--line)] bg-white/95 px-2 pb-[max(env(safe-area-inset-bottom),8px)] pt-2 backdrop-blur-lg dark:bg-[#101a2a]/95 lg:hidden" aria-label="Mobile bottom navigation">
          {links.map(({ label, href, icon: Icon }) => <Link key={href} href={href} className={cn("flex min-h-12 flex-col items-center justify-center gap-1 rounded-lg text-[10px] font-medium", pathname === href ? "text-blue-700 dark:text-blue-300" : "text-slate-400")}><Icon size={19} /><span>{label}</span></Link>)}
        </nav>
      </div>
    </div>
  );
}

function NavLink({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return <Link href={href} className={cn("flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition", active ? "bg-blue-50 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200" : "text-slate-500 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800")} aria-current={active ? "page" : undefined}>{children}</Link>;
}
