import Link from "next/link";
import { ArrowLeft, Sparkles } from "lucide-react";
import { OnboardingForm } from "@/components/onboarding-form";

export default async function RoleOnboarding({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#09162f] px-4 py-10 text-white sm:px-8">
      <div className="absolute inset-0 bg-[linear-gradient(125deg,rgba(8,18,42,.94),rgba(15,44,98,.82))] bg-cover bg-center" style={{ backgroundImage: "linear-gradient(125deg,rgba(8,18,42,.94),rgba(15,44,98,.82)),url('/images/campus.jpg')" }} />
      <div className="relative mx-auto max-w-6xl">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-blue-100/80 hover:text-white"><ArrowLeft size={16} /> Back</Link>
        <div className="mx-auto mt-8 max-w-3xl text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-medium text-blue-100"><Sparkles size={14} /> YOUR JOURNEY STARTS HERE</span>
          <h1 className="mt-5 text-3xl font-semibold tracking-tight sm:text-4xl">How will you use SkillSync?</h1>
          <p className="mt-3 text-sm text-blue-100/75 sm:text-base">Choose your role to set up a workspace made for you.</p>
        </div>
        <OnboardingForm error={error} />
      </div>
    </main>
  );
}
