"use client";

import { useMemo, useState } from "react";
import { CalendarClock, Diamond, Pencil } from "lucide-react";
import type { Project, Subtask, Task, TeamMember } from "@/lib/mock-data";
import { Badge, Button, Card, Dialog, Dropdown, DropdownContent, DropdownItem, DropdownTrigger, DropdownValue, Input, Label } from "@/components/ui";
import { cn } from "@/lib/utils";

const dayWidth = 44;
const inferredYear = new Date().getFullYear();

function parseDate(value: string) {
  if (!value) return null;
  const date = /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(`${value}T00:00:00`) : new Date(`${value}, ${inferredYear}`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function inputDate(value: string) {
  const date = parseDate(value);
  if (!date) return "";
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function addDays(date: Date, amount: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
}

function dayStart(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function ProjectDetailTimeline({ project, tasks, initialSubtasks, members }: { project: Project; tasks: Task[]; initialSubtasks: Subtask[]; members: TeamMember[] }) {
  const [taskItems, setTaskItems] = useState(tasks);
  const [subtasks, setSubtasks] = useState(initialSubtasks);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const deadlines = useMemo(() => [...taskItems.map(task => parseDate(task.dueDate)), ...subtasks.map(subtask => parseDate(subtask.dueDate))].filter((date): date is Date => Boolean(date)), [taskItems, subtasks]);

  if (deadlines.length === 0) return <Card className="flex min-h-72 flex-col items-center justify-center border-dashed p-8 text-center"><CalendarClock className="size-8 text-slate-300" /><p className="mt-3 font-medium text-slate-800">No deadlines available</p><p className="mt-1 text-sm text-slate-500">Add deadlines to tasks and subtasks to build this timeline.</p></Card>;

  const start = addDays(dayStart(new Date(Math.min(...deadlines.map(date => date.getTime())))), -7);
  const end = addDays(dayStart(new Date(Math.max(...deadlines.map(date => date.getTime())))), 4);
  const dayCount = Math.round((end.getTime() - start.getTime()) / 86400000) + 1;
  const days = Array.from({ length: dayCount }, (_, index) => addDays(start, index));
  const chartWidth = days.length * dayWidth;
  const todayIndex = Math.round((dayStart(new Date()).getTime() - start.getTime()) / 86400000);
  const showToday = todayIndex >= 0 && todayIndex < dayCount;
  const indexFor = (date: Date) => Math.max(0, Math.min(dayCount - 1, Math.round((dayStart(date).getTime() - start.getTime()) / 86400000)));

  function updateDeadline(subtaskId: string, dueDate: string) {
    setSubtasks(current => current.map(subtask => subtask.id === subtaskId ? { ...subtask, dueDate } : subtask));
    fetch(`/api/subtasks/${subtaskId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ dueDate }) }).catch(() => {});
  }

  function saveTask(task: Task) {
    setTaskItems(current => current.map(t => t.id === task.id ? task : t));
    fetch(`/api/tasks/${task.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(task) }).catch(() => {});
    setEditingTask(null);
  }

  return <Card className="overflow-hidden">
    <div className="flex flex-col justify-between gap-3 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center"><div><h3 className="font-semibold text-slate-950">{project.name} timeline</h3><p className="mt-1 text-xs text-slate-500">Task durations and editable subtask deadlines</p></div><div className="flex gap-4 text-[11px] text-slate-500"><span className="flex items-center gap-1.5"><i className="size-2 rounded-full" style={{ backgroundColor: project.color }} />Task</span><span className="flex items-center gap-1.5"><Diamond className="size-3 fill-orange-500 text-orange-500" />Subtask deadline</span></div></div>
    <div className="overflow-x-auto">
      <div className="grid" style={{ gridTemplateColumns: `320px ${chartWidth}px`, minWidth: 320 + chartWidth }}>
        <div className="sticky left-0 z-30 border-b border-r border-slate-200 bg-slate-50 px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">Work item</div>
        <div className="grid border-b border-slate-200 bg-slate-50" style={{ gridTemplateColumns: `repeat(${days.length}, ${dayWidth}px)` }}>{days.map(day => <div key={day.toISOString()} className={cn("border-r border-slate-200 py-2 text-center", [0, 6].includes(day.getDay()) && "bg-slate-100")}><p className="text-[9px] font-bold uppercase text-slate-400">{day.toLocaleDateString("en-US", { weekday: "short" }).slice(0, 2)}</p><p className="mt-0.5 text-[11px] font-semibold text-slate-700">{day.getDate()}</p></div>)}</div>
        {taskItems.flatMap(task => {
          const deadline = parseDate(task.dueDate) ?? end;
          const childSubtasks = subtasks.filter(subtask => subtask.taskId === task.id);
          const childDates = childSubtasks.map(subtask => parseDate(subtask.dueDate)).filter((date): date is Date => Boolean(date));
          const taskStart = childDates.length ? addDays(new Date(Math.min(...childDates.map(date => date.getTime()))), -3) : addDays(deadline, -7);
          const startIndex = indexFor(taskStart);
          const deadlineIndex = indexFor(deadline);
          const gridBackground = { backgroundImage: `repeating-linear-gradient(to right, transparent 0, transparent ${dayWidth - 1}px, #e2e8f0 ${dayWidth - 1}px, #e2e8f0 ${dayWidth}px)` };
          const rows = [
            <div key={`${task.id}-label`} className="sticky left-0 z-20 flex min-h-16 items-center border-b border-r border-slate-200 bg-white px-5"><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-slate-900">{task.title}</p><div className="mt-1.5 flex items-center gap-2"><Badge value={task.status} /><span className="text-[10px] text-slate-400">Due {task.dueDate}</span></div></div><button onClick={() => setEditingTask(task)} className="shrink-0 rounded p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"><Pencil className="size-3.5" /></button></div>,
            <div key={`${task.id}-chart`} className="relative min-h-16 border-b border-slate-200 bg-white" style={gridBackground}>{showToday && <div className="absolute inset-y-0 z-10 w-px bg-orange-400" style={{ left: todayIndex * dayWidth + dayWidth / 2 }} />}<button onClick={() => setEditingTask(task)} className="absolute top-1/2 h-7 -translate-y-1/2 overflow-hidden rounded-md px-2 text-[10px] font-semibold leading-7 text-white shadow-sm cursor-pointer transition hover:brightness-90" style={{ left: startIndex * dayWidth + 5, width: Math.max(dayWidth - 10, (deadlineIndex - startIndex + 1) * dayWidth - 10), backgroundColor: project.color }}>{task.title}</button></div>,
          ];
          childSubtasks.forEach(subtask => {
            const subtaskDate = parseDate(subtask.dueDate);
            const subtaskIndex = subtaskDate ? indexFor(subtaskDate) : deadlineIndex;
            rows.push(<div key={`${subtask.id}-label`} className="sticky left-0 z-20 flex min-h-14 items-center border-b border-r border-slate-200 bg-slate-50/60 py-2 pl-9 pr-4"><div className="min-w-0 flex-1"><p className="truncate text-xs font-medium text-slate-700">{subtask.title}</p><label className="mt-1 flex items-center gap-1.5 text-[10px] text-slate-400"><CalendarClock className="size-3" />Deadline<Input type="date" value={inputDate(subtask.dueDate)} onChange={event => updateDeadline(subtask.id, event.target.value)} className="h-6 w-32 px-1.5 text-[10px]" /></label></div></div>);
            rows.push(<div key={`${subtask.id}-chart`} className="relative min-h-14 border-b border-slate-200 bg-slate-50/30" style={gridBackground}>{showToday && <div className="absolute inset-y-0 z-10 w-px bg-orange-400" style={{ left: todayIndex * dayWidth + dayWidth / 2 }} />}<div className="absolute top-1/2 h-1 -translate-y-1/2 rounded-full bg-orange-200" style={{ left: startIndex * dayWidth + dayWidth / 2, width: Math.max(2, (subtaskIndex - startIndex) * dayWidth) }} /><Diamond className="absolute top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 fill-orange-500 text-orange-500" style={{ left: subtaskIndex * dayWidth + dayWidth / 2 }} /></div>);
          });
          return rows;
        })}
      </div>
    </div>

    <Dialog open={editingTask !== null} onOpenChange={open => { if (!open) setEditingTask(null); }} title="Edit task">
      {editingTask && <div className="space-y-4">
        <div>
          <Label>Title</Label>
          <Input value={editingTask.title} onChange={e => setEditingTask({ ...editingTask, title: e.target.value })} placeholder="Task title" autoFocus />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Priority</Label>
            <Dropdown value={editingTask.priority} onValueChange={value => setEditingTask({ ...editingTask, priority: value as Task["priority"] })}>
              <DropdownTrigger><DropdownValue /></DropdownTrigger>
              <DropdownContent>{(["low", "medium", "high"] as const).map(p => <DropdownItem key={p} value={p}><span className="capitalize">{p}</span></DropdownItem>)}</DropdownContent>
            </Dropdown>
          </div>
          <div>
            <Label>Status</Label>
            <Dropdown value={editingTask.status} onValueChange={value => setEditingTask({ ...editingTask, status: value as Task["status"] })}>
              <DropdownTrigger><DropdownValue /></DropdownTrigger>
              <DropdownContent>{(["todo", "in_progress", "review", "done"] as const).map(s => <DropdownItem key={s} value={s}><span>{s.replace("_", " ")}</span></DropdownItem>)}</DropdownContent>
            </Dropdown>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Assignee</Label>
            <Dropdown value={editingTask.assigneeId} onValueChange={value => setEditingTask({ ...editingTask, assigneeId: value })}>
              <DropdownTrigger><DropdownValue placeholder="Unassigned" /></DropdownTrigger>
              <DropdownContent>{members.map(m => <DropdownItem key={m.id} value={m.id}>{m.name}</DropdownItem>)}</DropdownContent>
            </Dropdown>
          </div>
          <div>
            <Label>Due date</Label>
            <Input value={editingTask.dueDate} onChange={e => setEditingTask({ ...editingTask, dueDate: e.target.value })} placeholder="e.g. Jun 30" />
          </div>
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="outline" onClick={() => setEditingTask(null)}>Cancel</Button>
          <Button onClick={() => saveTask(editingTask)}>Save</Button>
        </div>
      </div>}
    </Dialog>
  </Card>;
}
