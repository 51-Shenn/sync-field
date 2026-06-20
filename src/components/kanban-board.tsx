"use client";

import { useState, type DragEvent } from "react";
import { CalendarDays, GripVertical, Pencil, Plus, Trash2, X } from "lucide-react";
import type { Subtask, Task, TeamMember } from "@/lib/mock-data";
import { Avatar, Badge, Button, Card, CardContent, Dialog, Dropdown, DropdownContent, DropdownItem, DropdownTrigger, DropdownValue, Input, Label } from "@/components/ui";
import { cn } from "@/lib/utils";

type TaskStatus = Task["status"];

const columns: { key: TaskStatus; label: string; dot: string }[] = [
  { key: "todo", label: "To do", dot: "bg-slate-400" },
  { key: "in_progress", label: "In progress", dot: "bg-orange-500" },
  { key: "review", label: "Review", dot: "bg-violet-500" },
  { key: "done", label: "Done", dot: "bg-emerald-500" },
];

const priorities = ["low", "medium", "high"] as const;

function newId() { return `t${Date.now()}_${Math.random().toString(36).slice(2, 7)}`; }
function toDateInput(value: string) {
  if (!value || /^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const date = new Date(`${value}, ${new Date().getFullYear()}`);
  if (Number.isNaN(date.getTime())) return "";
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function KanbanBoard({ initialTasks, subtasks: initialSubtasks, members, projectId }: { initialTasks: Task[]; subtasks: Subtask[]; members: TeamMember[]; projectId?: string }) {
  const [taskItems, setTaskItems] = useState(initialTasks);
  const [subtaskItems, setSubtaskItems] = useState(initialSubtasks);
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [activeColumn, setActiveColumn] = useState<TaskStatus | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [creatingStatus, setCreatingStatus] = useState<TaskStatus | null>(null);
  const [editingSubtask, setEditingSubtask] = useState<Subtask | null>(null);
  const [addingSubtaskFor, setAddingSubtaskFor] = useState<string | null>(null);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
  const [newSubtaskAssignee, setNewSubtaskAssignee] = useState("");
  const [newSubtaskDueDate, setNewSubtaskDueDate] = useState("");

  // ── Task CRUD ──────────────────────────────────────────────

  function changeStatus(taskId: string, status: TaskStatus) {
    setTaskItems(current => current.map(task => task.id === taskId ? { ...task, status } : task));
    fetch(`/api/tasks/${taskId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) }).catch(() => {});
  }

  function deleteTask(taskId: string) {
    setTaskItems(current => current.filter(task => task.id !== taskId));
    setSubtaskItems(current => current.filter(st => st.taskId !== taskId));
    fetch(`/api/tasks/${taskId}`, { method: "DELETE" }).catch(() => {});
  }

  function saveTask(task: Task) {
    setTaskItems(current => current.some(t => t.id === task.id) ? current.map(t => t.id === task.id ? task : t) : [...current, task]);
    const method = taskItems.some(t => t.id === task.id) ? "PATCH" : "POST";
    const url = method === "PATCH" ? `/api/tasks/${task.id}` : "/api/tasks";
    const body = method === "POST" ? { ...task, projectId } : task;
    fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).catch(() => {});
  }

  // ── Subtask CRUD ───────────────────────────────────────────

  function toggleSubtask(subtaskId: string) {
    setSubtaskItems(current => current.map(st => st.id === subtaskId ? { ...st, status: st.status === "done" ? "todo" as const : "done" as const } : st));
    const updated = subtaskItems.find(st => st.id === subtaskId);
    if (updated) {
      fetch(`/api/subtasks/${subtaskId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: updated.status === "done" ? "todo" : "done" }) }).catch(() => {});
    }
  }

  function deleteSubtask(subtaskId: string) {
    setSubtaskItems(current => current.filter(st => st.id !== subtaskId));
    fetch(`/api/subtasks/${subtaskId}`, { method: "DELETE" }).catch(() => {});
  }

  function addSubtask(taskId: string) {
    if (!newSubtaskTitle.trim()) return;
    const subtask: Subtask = { id: newId(), taskId, title: newSubtaskTitle.trim(), status: "todo", assigneeId: newSubtaskAssignee, dueDate: newSubtaskDueDate };
    setSubtaskItems(current => [...current, subtask]);
    setNewSubtaskTitle("");
    setNewSubtaskAssignee("");
    setNewSubtaskDueDate("");
    setAddingSubtaskFor(null);
    fetch(`/api/tasks/${taskId}/subtasks`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: subtask.title, assigneeId: subtask.assigneeId, dueDate: subtask.dueDate }) }).catch(() => {});
  }

  function saveSubtask(subtask: Subtask) {
    setSubtaskItems(current => current.map(st => st.id === subtask.id ? subtask : st));
    fetch(`/api/subtasks/${subtask.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: subtask.title, assigneeId: subtask.assigneeId, dueDate: subtask.dueDate }) }).catch(() => {});
    setEditingSubtask(null);
  }

  // ── Drag handlers ──────────────────────────────────────────

  function startDragging(event: DragEvent<HTMLDivElement>, taskId: string) {
    if ((event.target as HTMLElement).closest("button, input, [role='combobox'], [role='listbox'], [role='option']")) {
      event.preventDefault();
      return;
    }
    setDraggedTaskId(taskId);
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", taskId);
  }

  function dropTask(event: DragEvent<HTMLDivElement>, status: TaskStatus) {
    event.preventDefault();
    const taskId = event.dataTransfer.getData("text/plain") || draggedTaskId;
    if (taskId) changeStatus(taskId, status);
    setDraggedTaskId(null);
    setActiveColumn(null);
  }

  // ── Dialog helpers ─────────────────────────────────────────

  function openCreate(status: TaskStatus) { setCreatingStatus(status); setEditingTask({ id: newId(), projectId: projectId ?? "", title: "", status, priority: "medium", assigneeId: "", dueDate: "" }); }
  function openEdit(task: Task) { setEditingTask(task); setCreatingStatus(null); }
  function closeDialog() { setEditingTask(null); setCreatingStatus(null); }

  function handleSave() {
    if (!editingTask || !editingTask.title.trim()) return;
    saveTask(editingTask);
    closeDialog();
  }

  // ── Render ─────────────────────────────────────────────────

  const editingTaskSubtasks = editingTask ? subtaskItems.filter(st => st.taskId === editingTask.id) : [];

  return <>
    <div className="overflow-x-auto pb-2">
      <div className="grid min-w-[920px] grid-cols-4 gap-4">
        {columns.map(column => {
          const columnTasks = taskItems.filter(task => task.status === column.key);
          return <div
            key={column.key}
            onDragOver={event => { event.preventDefault(); event.dataTransfer.dropEffect = "move"; setActiveColumn(column.key); }}
            onDragLeave={event => { if (!event.currentTarget.contains(event.relatedTarget as Node)) setActiveColumn(null); }}
            onDrop={event => dropTask(event, column.key)}
            className={cn("min-h-[360px] rounded-xl border border-transparent bg-slate-100/70 p-3 transition-colors", activeColumn === column.key && "border-orange-300 bg-orange-50/70")}
          >
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2"><span className={cn("size-2 rounded-full", column.dot)} /><h3 className="text-sm font-semibold text-slate-800">{column.label}</h3><span className="text-xs text-slate-400">{columnTasks.length}</span></div>
              <button onClick={() => openCreate(column.key)} className="rounded-md p-0.5 text-slate-400 transition hover:bg-slate-200 hover:text-slate-600"><Plus className="size-4" /></button>
            </div>
            <div className="space-y-3">
              {columnTasks.map(task => {
                const assignee = members.find(member => member.id === task.assigneeId);
                const taskSubtasks = subtaskItems.filter(subtask => subtask.taskId === task.id);
                return <div key={task.id} className="group relative">
                  <Card
                    draggable
                    onDragStart={event => startDragging(event, task.id)}
                    onDragEnd={() => { setDraggedTaskId(null); setActiveColumn(null); }}
                    className={cn("cursor-grab shadow-sm transition active:cursor-grabbing hover:border-slate-300 hover:shadow-md", draggedTaskId === task.id && "opacity-40")}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-2"><Badge value={task.priority} /><div className="flex items-center gap-1"><button onClick={() => openEdit(task)} className="rounded p-0.5 text-slate-400 opacity-0 transition hover:bg-slate-100 hover:text-slate-600 group-hover:opacity-100"><Pencil className="size-3.5" /></button><button onClick={() => deleteTask(task.id)} className="rounded p-0.5 text-slate-400 opacity-0 transition hover:bg-red-50 hover:text-red-600 group-hover:opacity-100"><Trash2 className="size-3.5" /></button><GripVertical className="size-4 shrink-0 text-slate-400" aria-hidden="true" /></div></div>
                      <p className="mt-3 text-sm font-semibold leading-5 text-slate-900">{task.title}</p>
                      {taskSubtasks.length > 0 && <div className="mt-3 space-y-1.5 border-t border-slate-100 pt-3">{taskSubtasks.map(subtask => { const subtaskAssignee = members.find(member => member.id === subtask.assigneeId); return <div key={subtask.id} className="group/st flex items-center gap-2 text-xs"><button onClick={() => toggleSubtask(subtask.id)} className="shrink-0"><span className={cn("block size-1.5 rounded-full", subtask.status === "done" ? "bg-emerald-500" : "bg-slate-300")} /></button><span className={cn("min-w-0 flex-1 cursor-pointer", subtask.status === "done" && "text-slate-400 line-through", subtask.status === "todo" && "text-slate-700")} onClick={() => toggleSubtask(subtask.id)}>{subtask.title}</span><span className="shrink-0 text-[10px] text-slate-400">{subtaskAssignee?.name.split(" ")[0]}{subtask.dueDate ? ` · ${subtask.dueDate}` : ""}</span><button onClick={() => setEditingSubtask(subtask)} className="shrink-0 rounded p-0.5 text-slate-400 opacity-0 transition hover:bg-slate-100 hover:text-slate-600 group-hover/st:opacity-100"><Pencil className="size-3" /></button><button onClick={() => deleteSubtask(subtask.id)} className="shrink-0 rounded p-0.5 text-slate-400 opacity-0 transition hover:bg-red-50 hover:text-red-600 group-hover/st:opacity-100"><X className="size-3" /></button></div>; })}</div>}
                      {addingSubtaskFor === task.id ? <div className="mt-3 space-y-2 border-t border-slate-100 pt-3"><Input placeholder="Subtask title..." value={newSubtaskTitle} onChange={e => setNewSubtaskTitle(e.target.value)} onKeyDown={e => { if (e.key === "Enter") addSubtask(task.id); if (e.key === "Escape") { setAddingSubtaskFor(null); setNewSubtaskTitle(""); } }} className="h-7 text-xs" autoFocus /><Input type="date" value={newSubtaskDueDate} onChange={e => setNewSubtaskDueDate(e.target.value)} className="h-7 text-xs" aria-label="Subtask deadline" /><div className="flex items-center gap-2"><Dropdown value={newSubtaskAssignee} onValueChange={setNewSubtaskAssignee}><DropdownTrigger className="h-7 text-xs"><DropdownValue placeholder="Assignee" /></DropdownTrigger><DropdownContent>{members.map(m => <DropdownItem key={m.id} value={m.id}>{m.name}</DropdownItem>)}</DropdownContent></Dropdown><div className="ml-auto flex items-center gap-1"><Button size="sm" onClick={() => addSubtask(task.id)} className="h-7 px-3 text-xs">Add</Button><button onClick={() => { setAddingSubtaskFor(null); setNewSubtaskTitle(""); setNewSubtaskDueDate(""); }} className="rounded p-1 text-slate-400 hover:text-slate-600"><X className="size-3.5" /></button></div></div></div> : <button onClick={() => setAddingSubtaskFor(task.id)} className="mt-3 flex w-full items-center gap-1.5 rounded-md p-1.5 text-xs text-slate-400 transition hover:bg-slate-50 hover:text-slate-600"><Plus className="size-3.5" />Add subtask</button>}
                      <div className="mt-4 flex items-center justify-between gap-3">
                        {assignee ? <Avatar name={assignee.name} size="sm" /> : <span />}
                        <span className="flex items-center gap-1 text-[11px] text-slate-500"><CalendarDays className="size-3" />{task.dueDate}</span>
                      </div>
                      <div className="mt-3 border-t border-slate-100 pt-3">
                        <Label className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Status</Label>
                        <Dropdown value={task.status} onValueChange={value => changeStatus(task.id, value as TaskStatus)}>
                          <DropdownTrigger className="mt-1"><DropdownValue /></DropdownTrigger>
                          <DropdownContent>{columns.map(option => <DropdownItem key={option.key} value={option.key}>{option.label}</DropdownItem>)}</DropdownContent>
                        </Dropdown>
                      </div>
                    </CardContent>
                  </Card>
                </div>;
              })}
              {columnTasks.length === 0 && <div className="flex h-24 items-center justify-center rounded-lg border border-dashed border-slate-300 text-xs text-slate-400">Drop a task here</div>}
            </div>
          </div>;
        })}
      </div>
    </div>

    {/* ── Task Edit/Create Dialog ── */}
    <Dialog open={editingTask !== null} onOpenChange={open => { if (!open) closeDialog(); }} title={creatingStatus ? "Create task" : "Edit task"}>
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
              <DropdownContent>{priorities.map(p => <DropdownItem key={p} value={p}><span className="capitalize">{p}</span></DropdownItem>)}</DropdownContent>
            </Dropdown>
          </div>
          <div>
            <Label>Status</Label>
            <Dropdown value={editingTask.status} onValueChange={value => setEditingTask({ ...editingTask, status: value as TaskStatus })}>
              <DropdownTrigger><DropdownValue /></DropdownTrigger>
              <DropdownContent>{columns.map(c => <DropdownItem key={c.key} value={c.key}>{c.label}</DropdownItem>)}</DropdownContent>
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

        {!creatingStatus && <div className="border-t border-slate-100 pt-4">
          <div className="flex items-center justify-between mb-3"><Label className="mb-0">Subtasks</Label><span className="text-xs text-slate-400">{editingTaskSubtasks.length}</span></div>
          {editingTaskSubtasks.length > 0 && <div className="space-y-2 mb-3">{editingTaskSubtasks.map(subtask => { const stAssignee = members.find(m => m.id === subtask.assigneeId); return <div key={subtask.id} className="group/st flex items-center gap-2 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-xs"><span className={cn("size-1.5 shrink-0 rounded-full", subtask.status === "done" ? "bg-emerald-500" : "bg-slate-300")} /><span className={cn("min-w-0 flex-1", subtask.status === "done" && "text-slate-400 line-through")}>{subtask.title}</span>{stAssignee && <span className="shrink-0 text-slate-400">{stAssignee.name.split(" ")[0]}</span>}<button onClick={() => setEditingSubtask(subtask)} className="shrink-0 rounded p-0.5 text-slate-400 opacity-0 transition hover:bg-slate-200 hover:text-slate-600 group-hover/st:opacity-100"><Pencil className="size-3.5" /></button><button onClick={() => deleteSubtask(subtask.id)} className="shrink-0 rounded p-0.5 text-slate-400 opacity-0 transition hover:bg-red-50 hover:text-red-600 group-hover/st:opacity-100"><Trash2 className="size-3.5" /></button></div>; })}</div>}
          {addingSubtaskFor === editingTask.id ? <div className="space-y-2"><Input placeholder="Subtask title..." value={newSubtaskTitle} onChange={e => setNewSubtaskTitle(e.target.value)} onKeyDown={e => { if (e.key === "Enter") addSubtask(editingTask.id); if (e.key === "Escape") { setAddingSubtaskFor(null); setNewSubtaskTitle(""); } }} className="h-8 text-xs" autoFocus /><Input type="date" value={newSubtaskDueDate} onChange={e => setNewSubtaskDueDate(e.target.value)} className="h-8 text-xs" aria-label="Subtask deadline" /><div className="flex items-center gap-2"><Dropdown value={newSubtaskAssignee} onValueChange={setNewSubtaskAssignee}><DropdownTrigger className="h-8 text-xs"><DropdownValue placeholder="Assignee" /></DropdownTrigger><DropdownContent>{members.map(m => <DropdownItem key={m.id} value={m.id}>{m.name}</DropdownItem>)}</DropdownContent></Dropdown><div className="ml-auto flex items-center gap-1"><Button size="sm" onClick={() => addSubtask(editingTask.id)} className="h-8 px-3 text-xs">Add</Button><button onClick={() => { setAddingSubtaskFor(null); setNewSubtaskTitle(""); setNewSubtaskDueDate(""); }} className="rounded p-1 text-slate-400 hover:text-slate-600"><X className="size-3.5" /></button></div></div></div> : <button onClick={() => setAddingSubtaskFor(editingTask.id)} className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-slate-200 py-2 text-xs text-slate-400 transition hover:border-slate-300 hover:text-slate-600"><Plus className="size-3.5" />Add subtask</button>}
        </div>}

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="outline" onClick={closeDialog}>Cancel</Button>
          <Button onClick={handleSave}>{creatingStatus ? "Create" : "Save"}</Button>
        </div>
      </div>}
    </Dialog>

    {/* ── Subtask Edit Dialog ── */}
    <Dialog open={editingSubtask !== null} onOpenChange={open => { if (!open) setEditingSubtask(null); }} title="Edit subtask">
      {editingSubtask && <div className="space-y-4">
        <div>
          <Label>Title</Label>
          <Input value={editingSubtask.title} onChange={e => setEditingSubtask({ ...editingSubtask, title: e.target.value })} placeholder="Subtask title" autoFocus />
        </div>
        <div>
          <Label>Assignee</Label>
          <Dropdown value={editingSubtask.assigneeId} onValueChange={value => setEditingSubtask({ ...editingSubtask, assigneeId: value })}>
            <DropdownTrigger><DropdownValue placeholder="Unassigned" /></DropdownTrigger>
            <DropdownContent>{members.map(m => <DropdownItem key={m.id} value={m.id}>{m.name}</DropdownItem>)}</DropdownContent>
          </Dropdown>
        </div>
        <div>
          <Label>Deadline</Label>
          <Input type="date" value={toDateInput(editingSubtask.dueDate)} onChange={e => setEditingSubtask({ ...editingSubtask, dueDate: e.target.value })} />
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="outline" onClick={() => setEditingSubtask(null)}>Cancel</Button>
          <Button onClick={() => saveSubtask(editingSubtask)}>Save</Button>
        </div>
      </div>}
    </Dialog>
  </>;
}
