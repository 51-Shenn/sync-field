"use client";

import { useMemo, useState, type DragEvent } from "react";
import { IconCalendarMonth, IconGripVertical, IconPencil, IconPlus, IconTrash } from "@tabler/icons-react";
import { useOperations } from "@/components/operations-provider";
import { legalTaskTransitions, taskStates, type OperationsTask, type TaskState } from "@/lib/operations-types";
import { Avatar, Badge, Button, Card, CardContent, Dialog, Input, Label, Select } from "@/components/ui";
import { cn } from "@/lib/utils";

const stateStyle: Record<TaskState, { label: string; dot: string }> = {
  LOCKED: { label: "Locked", dot: "bg-slate-400" },
  READY: { label: "Ready", dot: "bg-blue-500" },
  ACTIVE: { label: "Active", dot: "bg-orange-500" },
  BLOCKED: { label: "Blocked", dot: "bg-red-500" },
  REGRESSED: { label: "Regressed", dot: "bg-violet-500" },
  COMPLETE: { label: "Complete", dot: "bg-emerald-500" },
  FAILED: { label: "Failed", dot: "bg-slate-800" },
};

type TaskDraft = Pick<OperationsTask, "title" | "priority" | "assigneeId"> & {
  deadline: string;
  estimatedDurationHours: number;
};

const emptyDraft = (): TaskDraft => ({ title: "", priority: "medium", assigneeId: "", deadline: "", estimatedDurationHours: 2 });

export function KanbanBoard({ projectId }: { projectId: string }) {
  const { snapshot, issueCommand, createSubtask, updateSubtask, deleteSubtask } = useOperations();
  const tasks = useMemo(() => snapshot.tasks.filter((task) => task.projectId === projectId), [snapshot.tasks, projectId]);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [activeColumn, setActiveColumn] = useState<TaskState | null>(null);
  const [editing, setEditing] = useState<OperationsTask | null>(null);
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState<TaskDraft>(emptyDraft());
  const [subtaskTitle, setSubtaskTitle] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");

  async function transition(task: OperationsTask, target: TaskState) {
    if (!legalTaskTransitions[task.state].includes(target)) {
      setMessage(`${task.state} cannot transition directly to ${target}.`);
      return;
    }
    setMessage(`Queued ${task.title}: ${task.state} → ${target}`);
    try {
      await issueCommand({ commandType: "task.transition", taskId: task.id, payload: { state: target, technicianId: task.assigneeId || undefined } });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to queue transition");
    }
  }

  async function saveTask() {
    if (!draft.title.trim()) return;
    if (!editing) {
      await issueCommand({ commandType: "task.create", projectId, payload: { ...draft, state: "READY" } });
    } else {
      await issueCommand({ commandType: "task.update", taskId: editing.id, payload: {
        title: draft.title, priority: draft.priority, deadline: draft.deadline || null,
        estimatedDurationHours: draft.estimatedDurationHours,
      } });
      if (draft.assigneeId !== editing.assigneeId) {
        await issueCommand({ commandType: "task.assign", taskId: editing.id, payload: { technicianId: draft.assigneeId || null } });
      }
    }
    setEditing(null); setCreating(false); setDraft(emptyDraft()); setMessage("Task command queued.");
  }

  function openEdit(task: OperationsTask) {
    setEditing(task); setCreating(false);
    setDraft({ title: task.title, priority: task.priority, assigneeId: task.assigneeId, deadline: task.deadline?.slice(0, 10) ?? "", estimatedDurationHours: task.estimatedDurationHours });
  }

  async function addChecklist(taskId: string) {
    const title = subtaskTitle[taskId]?.trim();
    if (!title) return;
    await createSubtask({ taskId, title, status: "todo" });
    setSubtaskTitle((current) => ({ ...current, [taskId]: "" }));
  }

  function drop(event: DragEvent<HTMLDivElement>, target: TaskState) {
    event.preventDefault();
    const id = event.dataTransfer.getData("text/plain") || draggedId;
    const task = tasks.find((item) => item.id === id);
    if (task && task.state !== target) void transition(task, target);
    setDraggedId(null); setActiveColumn(null);
  }

  const recentFailure = snapshot.commands.find((command) => command.status === "failed" && (!command.projectId || command.projectId === projectId));

  return <>
    {(message || recentFailure) && <div className={cn("mb-4 rounded-lg border px-4 py-3 text-sm", recentFailure ? "border-red-200 bg-red-50 text-red-700" : "border-blue-200 bg-blue-50 text-blue-700")}>{recentFailure?.error || message}</div>}
    <div className="overflow-x-auto pb-3">
      <div className="grid min-w-[1680px] grid-cols-7 gap-3">
        {taskStates.map((state) => {
          const columnTasks = tasks.filter((task) => task.state === state);
          return <div key={state} onDragOver={(event) => { event.preventDefault(); setActiveColumn(state); }} onDragLeave={() => setActiveColumn(null)} onDrop={(event) => drop(event, state)} className={cn("min-h-[420px] rounded-xl border border-transparent bg-slate-100/70 p-3", activeColumn === state && "border-orange-300 bg-orange-50/70")}>
            <div className="mb-3 flex items-center justify-between"><div className="flex items-center gap-2"><span className={cn("size-2 rounded-full", stateStyle[state].dot)} /><h3 className="text-sm font-semibold text-slate-800">{stateStyle[state].label}</h3><span className="text-xs text-slate-400">{columnTasks.length}</span></div>{state === "READY" && <button onClick={() => { setCreating(true); setEditing(null); setDraft(emptyDraft()); }} aria-label="Add task" className="rounded p-1 text-slate-400 hover:bg-white hover:text-orange-600"><IconPlus className="size-4" /></button>}</div>
            <div className="space-y-3">{columnTasks.map((task) => {
              const assignee = snapshot.technicians.find((member) => member.id === task.assigneeId);
              const checklist = snapshot.subtasks.filter((item) => item.taskId === task.id);
              return <Card key={task.id} draggable onDragStart={(event) => { setDraggedId(task.id); event.dataTransfer.setData("text/plain", task.id); }} onDragEnd={() => { setDraggedId(null); setActiveColumn(null); }} className={cn("group cursor-grab shadow-sm", draggedId === task.id && "opacity-40")}><CardContent className="p-4">
                <div className="flex items-start justify-between gap-2"><Badge value={task.priority} /><div className="flex gap-1"><button onClick={() => openEdit(task)} className="rounded p-1 text-slate-400 hover:bg-slate-100"><IconPencil className="size-3.5" /></button><button onClick={() => void issueCommand({ commandType: "task.delete", taskId: task.id })} className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600"><IconTrash className="size-3.5" /></button><IconGripVertical className="size-4 text-slate-400" /></div></div>
                <p className="mt-3 text-sm font-semibold text-slate-900">{task.title}</p>
                {task.deadline && <p className="mt-2 flex items-center gap-1 text-[11px] text-slate-500"><IconCalendarMonth className="size-3" />{new Date(task.deadline).toLocaleDateString()}</p>}
                {checklist.length > 0 && <div className="mt-3 space-y-2 border-t border-slate-100 pt-3">{checklist.map((item) => <div key={item.id} className="flex items-center gap-2 text-xs"><button onClick={() => void updateSubtask(item.id, { status: item.status === "done" ? "todo" : "done" })} className={cn("size-2 rounded-full", item.status === "done" ? "bg-emerald-500" : "bg-slate-300")} /><span className={cn("min-w-0 flex-1", item.status === "done" && "text-slate-400 line-through")}>{item.title}</span><button onClick={() => void deleteSubtask(item.id)} className="text-slate-300 hover:text-red-500"><IconTrash className="size-3" /></button></div>)}</div>}
                <div className="mt-3 flex gap-1"><Input value={subtaskTitle[task.id] ?? ""} onChange={(event) => setSubtaskTitle((current) => ({ ...current, [task.id]: event.target.value }))} onKeyDown={(event) => { if (event.key === "Enter") void addChecklist(task.id); }} placeholder="Add checklist item" className="h-7 text-xs" /><Button size="sm" variant="ghost" onClick={() => void addChecklist(task.id)}><IconPlus className="size-3" /></Button></div>
                <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3"><span className="text-[10px] text-slate-400">{task.etaConfidence} ETA</span>{assignee ? <div className="flex items-center gap-1.5"><Avatar name={assignee.name} size="sm" /><span className="max-w-20 truncate text-[10px] text-slate-500">{assignee.name}</span></div> : <span className="text-[10px] text-slate-400">Unassigned</span>}</div>
              </CardContent></Card>;
            })}</div>
          </div>;
        })}
      </div>
    </div>

    <Dialog open={creating || Boolean(editing)} onOpenChange={(open) => { if (!open) { setCreating(false); setEditing(null); } }} title={editing ? "Edit task" : "Create task"} description="Changes are validated and processed by the operations worker.">
      <div className="space-y-4"><div><Label>Task title</Label><Input value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} /></div><div className="grid grid-cols-2 gap-4"><div><Label>Priority</Label><Select value={draft.priority} onChange={(event) => setDraft({ ...draft, priority: event.target.value as TaskDraft["priority"] })}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></Select></div><div><Label>Duration (hours)</Label><Input type="number" min={0.5} step={0.5} value={draft.estimatedDurationHours} onChange={(event) => setDraft({ ...draft, estimatedDurationHours: Number(event.target.value) })} /></div></div><div className="grid grid-cols-2 gap-4"><div><Label>Assignee</Label><Select value={draft.assigneeId} onChange={(event) => setDraft({ ...draft, assigneeId: event.target.value })}><option value="">Unassigned</option>{snapshot.technicians.map((member) => <option key={member.id} value={member.id}>{member.name}</option>)}</Select></div><div><Label>Deadline</Label><Input type="date" value={draft.deadline} onChange={(event) => setDraft({ ...draft, deadline: event.target.value })} /></div></div><div className="flex justify-end gap-2"><Button variant="outline" onClick={() => { setCreating(false); setEditing(null); }}>Cancel</Button><Button onClick={() => void saveTask()}>Queue {editing ? "update" : "task"}</Button></div></div>
    </Dialog>
  </>;
}
