"use client";

import Image from "next/image";
import { useState } from "react";
import { ArrowRight, BriefcaseBusiness, GraduationCap, UsersRound } from "lucide-react";
import { completeOnboarding } from "@/app/onboarding/actions";

const choices = [
  { role: "student", label: "Student", description: "Learn, practice and track your readiness", image: "/images/collaboration.jpg", icon: GraduationCap },
  { role: "trainer", label: "Faculty / Trainer", description: "Assign tests, review performance, give feedback", image: "/images/interview.jpg", icon: UsersRound },
  { role: "admin", label: "Placement Officer", description: "Manage batches, content and reports", image: "/images/campus.jpg", icon: BriefcaseBusiness },
];

const inputClass = "mt-1.5 h-11 w-full rounded-xl border border-white/15 bg-slate-950/35 px-3.5 text-sm text-white outline-none placeholder:text-blue-100/45 focus:border-blue-300 focus:ring-4 focus:ring-blue-400/10";

export function OnboardingForm({ error }: { error?: string }) {
  const [role, setRole] = useState("");
  return (
    <>
      {error && <p role="alert" className="mx-auto mt-5 max-w-xl rounded-xl border border-red-200/30 bg-red-950/60 px-4 py-3 text-sm text-red-100">{error}</p>}
      <form action={completeOnboarding} className="mx-auto mt-9 max-w-5xl">
        <div className="grid gap-4 md:grid-cols-3">
          {choices.map(({ role: choiceRole, label, description, image, icon: Icon }) => (
            <label key={choiceRole} className={`group relative cursor-pointer overflow-hidden rounded-2xl border bg-white/10 shadow-xl transition hover:-translate-y-1 hover:bg-white/15 focus-within:ring-2 focus-within:ring-blue-300 ${role === choiceRole ? "border-blue-300 ring-2 ring-blue-300/70" : "border-white/15"}`}>
              <input className="sr-only" type="radio" name="role" value={choiceRole} checked={role === choiceRole} onChange={() => setRole(choiceRole)} required />
              <div className="relative h-40 overflow-hidden">
                <Image src={image} alt="" fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover transition duration-500 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 to-transparent" />
                <span className="absolute bottom-4 left-4 grid size-10 place-items-center rounded-xl border border-white/20 bg-white/15 backdrop-blur"><Icon size={20} /></span>
                <span aria-hidden="true" className={`absolute right-4 top-4 grid size-5 place-items-center rounded-full border ${role === choiceRole ? "border-blue-300 bg-blue-500" : "border-white/70 bg-white/10"}`}>{role === choiceRole && <span className="size-2 rounded-full bg-white" />}</span>
              </div>
              <div className="p-5">
                <h2 className="font-semibold">{label}</h2>
                <p className="mt-1.5 min-h-10 text-sm leading-5 text-blue-100/75">{description}</p>
                <span className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-blue-200">Choose role <ArrowRight size={15} /></span>
              </div>
            </label>
          ))}
        </div>

        {role && (
          <div className="mt-6 rounded-2xl border border-white/15 bg-slate-950/40 p-5 backdrop-blur-xl sm:p-7">
            <div className="mb-5"><h2 className="text-lg font-semibold">A few details to personalize your space</h2><p className="mt-1 text-sm text-blue-100/65">Your information is visible only to the people who support your placement journey.</p></div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Full name"><input className={inputClass} name="full_name" required minLength={2} maxLength={100} placeholder="Your name" autoComplete="name" /></Field>
              <Field label="College / institution"><input className={inputClass} name="college" required minLength={2} maxLength={140} placeholder="e.g. Northstar Institute of Technology" /></Field>
              {role !== "admin" && <Field label="Department"><input className={inputClass} name="department" required minLength={2} maxLength={100} placeholder="e.g. Computer Science" /></Field>}
              {role === "student" && <>
                <Field label="Year of study"><select className={inputClass} name="year_of_study" required defaultValue=""><option value="" disabled>Select your year</option>{[1, 2, 3, 4, 5, 6, 7, 8].map((year) => <option key={year} value={year}>{year}{year === 1 ? "st" : year === 2 ? "nd" : year === 3 ? "rd" : "th"} year</option>)}</select></Field>
                <Field label="Roll number"><input className={inputClass} name="roll_number" required maxLength={40} placeholder="Your college roll number" /></Field>
                <Field label="Target role"><input className={inputClass} name="target_role" required maxLength={100} placeholder="e.g. Software Engineer" /></Field>
                <Field label="Batch code"><input className={inputClass} name="batch_code" required maxLength={30} placeholder="Ask your trainer for the code" /></Field>
              </>}
              {role === "trainer" && <Field label="Subjects taught"><input className={inputClass} name="subjects_taught" required maxLength={200} placeholder="Aptitude, Data Structures, ..." /><span className="mt-1 block text-xs text-blue-100/55">Separate subjects with commas.</span></Field>}
              {role === "admin" && <>
                <Field label="Designation"><input className={inputClass} name="designation" required maxLength={100} placeholder="e.g. Placement Officer" /></Field>
                <Field label="Institution code"><input className={inputClass} name="institution_code" type="password" required autoComplete="off" placeholder="Provided by your institution" /></Field>
              </>}
            </div>
            <button className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-500 px-6 text-sm font-semibold text-white transition hover:bg-blue-400 sm:ml-auto sm:w-auto">Create my workspace <ArrowRight size={17} /></button>
          </div>
        )}
      </form>
      <p className="mt-6 text-center text-xs text-blue-100/55">Your role is assigned once and can’t be changed from your profile.</p>
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block text-sm font-medium text-blue-50">{label}{children}</label>;
}
