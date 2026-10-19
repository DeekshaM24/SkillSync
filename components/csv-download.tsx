"use client";

import { Download } from "lucide-react";

export function CsvDownload({ filename, headers, rows, label = "Export CSV" }: { filename: string; headers: string[]; rows: (string | number | null)[][]; label?: string }) {
  function download() {
    const quote = (value: string | number | null) => `"${String(value ?? "").replaceAll('"', '""')}"`;
    const csv = [headers, ...rows].map((row) => row.map(quote).join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }
  return <button onClick={download} disabled={rows.length === 0} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-[var(--line)] bg-white px-3.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"><Download size={15} />{label}</button>;
}
