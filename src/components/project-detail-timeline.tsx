"use client";

import { useMemo } from "react";
import { IconCalendarClock, IconDiamond } from "@tabler/icons-react";
import { useOperations } from "@/components/operations-provider";
import { Badge, Card, Input } from "@/components/ui";

const dayWidth = 38;
function date(value: string | null | undefined) { if (!value) return null; const parsed = new Date(value); return Number.isNaN(parsed.getTime()) ? null : parsed; }
function dayStart(value: Date) { return new Date(value.getFullYear(), value.getMonth(), value.getDate()); }
function addDays(value: Date, days: number) { const next = new Date(value); next.setDate(next.getDate() + days); return next; }
function isoDay(value: string | null | undefined) { return value?.slice(0, 10) ?? ""; }

export function ProjectDetailTimeline({ projectId }: { projectId: string }) {
  const { snapshot, issueCommand, updateSubtask } = useOperations();
  const project = snapshot.projects.find((item) => item.id === projectId);
  const tasks = useMemo(() => snapshot.tasks.filter((task) => task.projectId === projectId), [snapshot.tasks, projectId]);
  const dates = tasks.flatMap((task) => [date(task.scheduledStart), date(task.earliestStart), date(task.deadline)]).filter((item): item is Date => Boolean(item));
  const start = dayStart(date(project?.startDate) ?? (dates.length ? new Date(Math.min(...dates.map((item) => item.getTime()))) : new Date()));
  const endCandidate = date(project?.endDate) ?? (dates.length ? new Date(Math.max(...dates.map((item) => item.getTime()))) : addDays(start, 14));
  const end = addDays(dayStart(endCandidate), 1);
  const days = Math.max(14, Math.ceil((end.getTime() - start.getTime()) / 86_400_000));
  const width = days * dayWidth;
  const labels = Array.from({ length: days }, (_, index) => addDays(start, index));
  const indexFor = (value: Date) => Math.max(0, Math.min(days - 1, Math.floor((dayStart(value).getTime() - start.getTime()) / 86_400_000)));

  if (!project) return <Card className="p-12 text-center text-sm text-slate-500">Loading project timeline…</Card>;
  return <Card className="overflow-hidden"><div className="border-b border-slate-200 p-5"><h3 className="font-semibold text-slate-950">Live project timeline</h3><p className="mt-1 text-xs text-slate-500">Backend schedule, earliest start, deadline, ETA confidence, and checklist milestones.</p></div><div className="overflow-x-auto"><div className="grid" style={{ gridTemplateColumns: `260px ${width}px`, minWidth: 260 + width }}><div className="sticky left-0 z-20 border-b border-r border-slate-200 bg-slate-50 px-5 py-3 text-[10px] font-bold uppercase text-slate-400">Task</div><div className="grid border-b border-slate-200 bg-slate-50" style={{ gridTemplateColumns: `repeat(${days}, ${dayWidth}px)` }}>{labels.map((label) => <div key={label.toISOString()} className="border-r border-slate-200 py-2 text-center text-[9px] text-slate-500"><strong className="block text-slate-700">{label.getDate()}</strong>{label.toLocaleDateString("en-US", { month: "short" })}</div>)}</div>{tasks.map((task) => {
    const taskStart = date(task.scheduledStart) ?? date(task.earliestStart) ?? addDays(date(task.deadline) ?? start, -Math.max(1, Math.ceil(task.estimatedDurationHours / 8)));
    const taskEnd = date(task.deadline) ?? addDays(taskStart, Math.max(1, Math.ceil(task.estimatedDurationHours / 8)));
    const startIndex = indexFor(taskStart); const endIndex = indexFor(taskEnd);
    const subtasks = snapshot.subtasks.filter((item) => item.taskId === task.id);
    return <div key={task.id} className="contents"><div className="sticky left-0 z-20 border-b border-r border-slate-200 bg-white px-5 py-3"><p className="truncate text-sm font-semibold text-slate-900">{task.title}</p><div className="mt-1 flex items-center gap-2"><Badge value={task.state.toLowerCase()} /><span className="text-[10px] text-slate-400">{task.etaConfidence}</span></div><label className="mt-2 flex items-center gap-2 text-[10px] text-slate-500">Deadline<Input type="date" className="h-7 w-32 text-[10px]" value={isoDay(task.deadline)} onChange={(event) => void issueCommand({ commandType: "task.update", taskId: task.id, payload: { deadline: event.target.value || null } })} /></label>{subtasks.map((item) => <label key={item.id} className="mt-2 flex items-center gap-2 pl-3 text-[10px] text-slate-500"><IconCalendarClock className="size-3" /><span className="max-w-24 truncate">{item.title}</span><Input type="date" className="h-7 w-32 text-[10px]" value={isoDay(item.dueDate)} onChange={(event) => void updateSubtask(item.id, { dueDate: event.target.value || null })} /></label>)}</div><div className="relative min-h-24 border-b border-slate-200 bg-white" style={{ backgroundImage: `repeating-linear-gradient(to right, transparent 0, transparent ${dayWidth - 1}px, #e2e8f0 ${dayWidth - 1}px, #e2e8f0 ${dayWidth}px)` }}><div className="absolute top-6 h-7 rounded-md bg-orange-500 px-2 text-[10px] font-semibold leading-7 text-white shadow-sm" style={{ left: startIndex * dayWidth + 4, width: Math.max(dayWidth - 8, (endIndex - startIndex + 1) * dayWidth - 8) }}>{task.title}</div>{subtasks.map((item, index) => { const due = date(item.dueDate); if (!due) return null; return <IconDiamond key={item.id} className="absolute size-4 -translate-x-1/2 fill-violet-500 text-violet-500" style={{ left: indexFor(due) * dayWidth + dayWidth / 2, top: 62 + index * 14 }} />; })}</div></div>;
  })}</div></div></Card>;
}
