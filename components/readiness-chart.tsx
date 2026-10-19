"use client";

import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip } from "recharts";

export function ReadinessChart({ data }: { data: { area: string; score: number }[] }) {
  if (!data.some((item) => item.score > 0)) {
    return <div className="grid h-[220px] place-items-center text-center text-xs text-muted">Complete practice activities to see your skill profile.</div>;
  }
  return <div className="h-[220px] w-full">
    <ResponsiveContainer width="100%" height="100%">
      <RadarChart data={data} outerRadius="72%">
        <PolarGrid stroke="var(--line)" />
        <PolarAngleAxis dataKey="area" tick={{ fill: "#718096", fontSize: 10 }} />
        <Radar dataKey="score" stroke="#1e40af" fill="#3b82f6" fillOpacity={0.22} strokeWidth={2} />
        <Tooltip formatter={(value) => [`${value}%`, "Progress"]} contentStyle={{ borderRadius: 12, border: "1px solid #e4eaf2", fontSize: 12 }} />
      </RadarChart>
    </ResponsiveContainer>
  </div>;
}
