"use client";

import Link from "next/link";
import { CalendarRange } from "lucide-react";
import type { Project } from "@/lib/mock-data";
import { Badge, Card } from "@/components/ui";

const monthWidth = 88;

function parseDate(value: string) {
  const date = /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(`${value}T00:00:00`) : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addMonths(date: Date, amount: number) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

export function ProjectTimeline({ projects }: { projects: Project[] }) {
  const datedProjects = projects.map(project => ({ project, start: parseDate(project.startDate), end: parseDate(project.endDate) })).filter((item): item is { project: Project; start: Date; end: Date } => Boolean(item.start && item.end));

  if (datedProjects.length === 0) return <Card className="flex min-h-72 flex-col items-center justify-center border-dashed p-8 text-center"><CalendarRange className="size-8 text-slate-300" /><p className="mt-3 font-medium text-slate-800">No project dates available</p><p className="mt-1 text-sm text-slate-500">Add start and completion dates to display the timeline.</p></Card>;

  const earliest = startOfMonth(new Date(Math.min(...datedProjects.map(item => item.start.getTime()))));
  const latest = startOfMonth(new Date(Math.max(...datedProjects.map(item => item.end.getTime()))));
  const monthCount = (latest.getFullYear() - earliest.getFullYear()) * 12 + latest.getMonth() - earliest.getMonth() + 1;
  const months = Array.from({ length: monthCount }, (_, index) => addMonths(earliest, index));
  const timelineEnd = addMonths(latest, 1);
  const span = timelineEnd.getTime() - earliest.getTime();
  const today = new Date();
  const todayPosition = ((today.getTime() - earliest.getTime()) / span) * 100;
  const showToday = todayPosition >= 0 && todayPosition <= 100;
  const timelineWidth = months.length * monthWidth;

  return <Card className="overflow-hidden">
    <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
      <div><h3 className="font-semibold text-slate-950">Portfolio timeline</h3><p className="mt-1 text-xs text-slate-500">Project schedules and completion progress across the full portfolio</p></div>
      <span className="hidden items-center gap-2 text-xs text-slate-500 sm:flex"><i className="size-2 rounded-full bg-orange-500" />Today</span>
    </div>
    <div className="overflow-x-auto">
      <div className="grid" style={{ gridTemplateColumns: `240px ${timelineWidth}px`, minWidth: 240 + timelineWidth }}>
        <div className="sticky left-0 z-20 border-b border-r border-slate-200 bg-slate-50 px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">Project</div>
        <div className="grid border-b border-slate-200 bg-slate-50" style={{ gridTemplateColumns: `repeat(${months.length}, ${monthWidth}px)` }}>
          {months.map(month => <div key={month.toISOString()} className="border-r border-slate-200 px-2 py-3 text-center text-[10px] font-bold uppercase tracking-wider text-slate-400"><span className="text-slate-600">{month.toLocaleDateString("en-US", { month: "short" })}</span><span className="ml-1">{month.getFullYear()}</span></div>)}
        </div>
        {datedProjects.map(({ project, start, end }, index) => {
          const left = Math.max(0, ((start.getTime() - earliest.getTime()) / span) * 100);
          const width = Math.max(1.25, ((end.getTime() - start.getTime()) / span) * 100);
          return <div key={project.id} className="contents">
            <div className="sticky left-0 z-20 flex min-h-20 items-center border-b border-r border-slate-200 bg-white px-5">
              <div className="min-w-0"><Link href={`/projects/${project.id}`} className="block truncate text-sm font-semibold text-slate-900 hover:text-orange-600">{project.name}</Link><div className="mt-1.5 flex items-center gap-2"><Badge value={project.status} /><span className="text-[10px] text-slate-400">{project.progress}%</span></div></div>
            </div>
            <div className="relative min-h-20 border-b border-slate-200 bg-white" style={{ backgroundImage: `repeating-linear-gradient(to right, transparent 0, transparent ${monthWidth - 1}px, #e2e8f0 ${monthWidth - 1}px, #e2e8f0 ${monthWidth}px)` }}>
              {showToday && <div className="absolute inset-y-0 z-10 w-px bg-orange-500" style={{ left: `${todayPosition}%` }}>{index === 0 && <span className="absolute -top-px -translate-x-1/2 rounded-b bg-orange-500 px-1 text-[8px] font-bold text-white">TODAY</span>}</div>}
              <div className="absolute top-1/2 h-8 -translate-y-1/2 overflow-hidden rounded-lg shadow-sm" style={{ left: `${left}%`, width: `${Math.min(width, 100 - left)}%`, backgroundColor: `${project.color}33`, border: `1px solid ${project.color}55` }} title={`${project.name}: ${project.startDate} – ${project.endDate}`}>
                <div className="h-full opacity-90" style={{ width: `${project.progress}%`, backgroundColor: project.color }} />
                <span className="absolute inset-0 flex items-center px-2 text-[10px] font-semibold text-slate-800">{project.name}</span>
              </div>
            </div>
          </div>;
        })}
      </div>
    </div>
  </Card>;
}
