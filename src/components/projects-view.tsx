"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { IconCalendarMonth, IconLayoutGrid, IconList, IconMapPin, IconSearch, IconTrash } from "@tabler/icons-react";
import { useOperations } from "@/components/operations-provider";
import type { OperationsProject } from "@/lib/operations-types";
import { Avatar, Badge, Button, Card, CardContent, Dialog, Input, Label, Progress, Select, Table, Td, Textarea, Th } from "@/components/ui";
import { CreateProjectDialog } from "@/components/create-project-dialog";
import { ProjectTimeline } from "@/components/project-timeline";

type ProjectForm = Omit<OperationsProject, "id" | "progress" | "siteId">;

export function ProjectsView() {
  const { snapshot, loading, error, updateProject, deleteProject } = useOperations();
  const [view, setView] = useState<"grid" | "table" | "timeline">("grid");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [form, setForm] = useState<ProjectForm>({ name: "", client: "", location: "", status: "planning", startDate: "", endDate: "", managerId: "", color: "#f97316", description: "" });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [formError, setFormError] = useState("");

  const filtered = useMemo(() => snapshot.projects.filter((project) =>
    (status === "all" || project.status === status) &&
    `${project.name} ${project.client} ${project.location}`.toLowerCase().includes(query.toLowerCase())
  ), [snapshot.projects, status, query]);

  function openEdit(project: OperationsProject) {
    setEditingId(project.id);
    setForm({ name: project.name, client: project.client, location: project.location, status: project.status, startDate: project.startDate, endDate: project.endDate, managerId: project.managerId, color: project.color, description: project.description });
    setFormError(""); setOpen(true);
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (!editingId) return;
    if (!form.name.trim() || !form.client.trim() || !form.location.trim() || !form.startDate || !form.endDate) {
      setFormError("Name, client, location, and project dates are required."); return;
    }
    if (form.endDate < form.startDate) { setFormError("Target completion must be after the start date."); return; }
    try {
      await updateProject(editingId, form);
      setOpen(false);
    } catch (reason) { setFormError(reason instanceof Error ? reason.message : "Unable to save project"); }
  }

  if (loading) return <Card className="p-10 text-center text-sm text-slate-500">Loading live projects…</Card>;

  return <>
    {error && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
    <div className="mb-5 flex flex-col justify-between gap-3 lg:flex-row lg:items-center"><div className="flex flex-1 flex-wrap gap-2"><div className="relative min-w-56 flex-1 lg:max-w-sm"><IconSearch className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" /><Input className="pl-9" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search projects" /></div><Select value={status} onChange={(event) => setStatus(event.target.value)}><option value="all">All statuses</option><option value="planning">Planning</option><option value="in_progress">In progress</option><option value="on_hold">On hold</option><option value="completed">Completed</option></Select></div><div className="flex gap-2"><div className="flex rounded-lg border border-slate-200 bg-white p-1">{[["grid", IconLayoutGrid], ["table", IconList], ["timeline", IconCalendarMonth]].map(([value, Icon]) => <Button key={String(value)} size="icon" variant={view === value ? "secondary" : "ghost"} onClick={() => setView(value as typeof view)}><Icon className="size-4" /></Button>)}</div><CreateProjectDialog /></div></div>

    {view === "timeline" ? <ProjectTimeline projects={filtered} /> : view === "grid" ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{filtered.map((project) => { const manager = snapshot.technicians.find((item) => item.id === project.managerId); return <Card key={project.id} className="group"><CardContent className="p-5"><div className="flex items-start justify-between"><Link href={`/projects/${project.id}`} className="min-w-0"><h3 className="truncate font-semibold text-slate-950 hover:text-orange-600">{project.name}</h3><p className="mt-1 text-xs text-slate-500">{project.client}</p></Link><Badge value={project.status} /></div><p className="mt-4 flex items-center gap-1.5 text-xs text-slate-500"><IconMapPin className="size-3.5" />{project.location}</p><div className="mt-5"><div className="mb-1.5 flex justify-between text-xs"><span className="text-slate-500">Progress</span><span className="font-semibold">{project.progress}%</span></div><Progress value={project.progress} /></div><div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4"><div className="flex items-center gap-2">{manager && <Avatar name={manager.name} size="sm" />}<span className="max-w-28 truncate text-xs text-slate-500">{manager?.name || "Unassigned"}</span></div><div className="flex gap-1"><Button size="sm" variant="ghost" onClick={() => openEdit(project)}>Edit</Button><Button size="icon" variant="ghost" className="text-red-500" onClick={() => { if (window.confirm(`Delete ${project.name}?`)) void deleteProject(project.id); }}><IconTrash className="size-4" /></Button></div></div></CardContent></Card>; })}</div> : <Card className="overflow-hidden"><Table><thead><tr><Th>Project</Th><Th>Status</Th><Th>Progress</Th><Th>Manager</Th><Th>Timeline</Th><Th /></tr></thead><tbody>{filtered.map((project) => { const manager = snapshot.technicians.find((item) => item.id === project.managerId); return <tr key={project.id}><Td><Link href={`/projects/${project.id}`} className="font-semibold text-slate-900 hover:text-orange-600">{project.name}</Link><p className="mt-1 text-xs text-slate-500">{project.location}</p></Td><Td><Badge value={project.status} /></Td><Td><div className="w-32"><span className="text-xs">{project.progress}%</span><Progress value={project.progress} /></div></Td><Td>{manager?.name || "Unassigned"}</Td><Td>{project.startDate} – {project.endDate}</Td><Td><Button size="sm" variant="ghost" onClick={() => openEdit(project)}>Edit</Button></Td></tr>; })}</tbody></Table></Card>}
    {!filtered.length && <Card className="border-dashed p-16 text-center text-sm text-slate-500">No matching projects.</Card>}

    <Dialog open={open} onOpenChange={setOpen} title="Edit project" description="Project records are stored in the shared operations database."><form className="grid gap-4" onSubmit={save}><div><Label>Project name</Label><Input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></div><div className="grid grid-cols-2 gap-4"><div><Label>Client</Label><Input value={form.client} onChange={(event) => setForm({ ...form, client: event.target.value })} /></div><div><Label>Location</Label><Input value={form.location} onChange={(event) => setForm({ ...form, location: event.target.value })} /></div></div><div><Label>Description</Label><Textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></div><div className="grid grid-cols-2 gap-4"><div><Label>Start date</Label><Input type="date" value={form.startDate} onChange={(event) => setForm({ ...form, startDate: event.target.value })} /></div><div><Label>Target completion</Label><Input type="date" min={form.startDate} value={form.endDate} onChange={(event) => setForm({ ...form, endDate: event.target.value })} /></div></div><div className="grid grid-cols-2 gap-4"><div><Label>Manager</Label><Select value={form.managerId} onChange={(event) => setForm({ ...form, managerId: event.target.value })}><option value="">Unassigned</option>{snapshot.technicians.map((member) => <option key={member.id} value={member.id}>{member.name}</option>)}</Select></div><div><Label>Status</Label><Select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as ProjectForm["status"] })}><option value="planning">Planning</option><option value="in_progress">In progress</option><option value="on_hold">On hold</option><option value="completed">Completed</option></Select></div></div>{formError && <p className="text-sm text-red-600">{formError}</p>}<div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button type="submit">Save changes</Button></div></form></Dialog>
  </>;
}
