"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { IconCalendarMonth, IconLayoutGrid, IconList, IconMapPin, IconPlus, IconSearch, IconTrash } from "@tabler/icons-react";
import { projects as mockProjects, teamMembers, type Project, auditLogs as initialLogs, type AuditLog } from "@/lib/mock-data";
import { ProjectCard } from "@/components/page-elements";
import { Avatar, AvatarStack, Badge, Button, Dialog, Input, Label, Progress, Select, Table, Td, Textarea, Th } from "@/components/ui";

const emptyProject = (): Omit<Project, "id"> => ({
  name: "", client: "", location: "", status: "planning", progress: 0,
  startDate: "", endDate: "", managerId: "", teamIds: [], color: "#f97316", description: "",
});

export function ProjectsView() {
  const [projects, setProjects] = useState(mockProjects);
  const [view, setView] = useState<"grid" | "table">("grid");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [form, setForm] = useState(emptyProject());
  const [editProject, setEditProject] = useState<Project | null>(null);
  const [logs, setLogs] = useState(initialLogs);

  const filtered = useMemo(() => projects.filter(p => (status === "all" || p.status === status) && `${p.name} ${p.client} ${p.location}`.toLowerCase().includes(query.toLowerCase())), [query, status, projects]);

  function resetForm() { setForm(emptyProject()); setEditProject(null); }
  function openEdit(p: Project) { setEditProject(p); setForm({ name: p.name, client: p.client, location: p.location, status: p.status, progress: p.progress, startDate: p.startDate, endDate: p.endDate, managerId: p.managerId, teamIds: [...p.teamIds], color: p.color, description: p.description }); }
  function log(action: AuditLog["action"], entity: string, entityId: string, entityName: string, details: string) {
    const entry: AuditLog = { id: `al${Date.now()}`, action, entity, entityId, entityName, performedBy: "Marcus Chen", timestamp: new Date().toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" }), details };
    setLogs(prev => [entry, ...prev]);
  }
  function saveProject() {
    if (editProject) {
      setProjects(prev => prev.map(p => p.id === editProject.id ? { ...p, ...form } : p));
      log("updated", "project", editProject.id, form.name, "Project details updated.");
    } else {
      const newProject: Project = { id: `proj${Date.now()}`, ...form };
      setProjects(prev => [...prev, newProject]);
      log("created", "project", newProject.id, form.name, "Project created.");
    }
    resetForm();
  }
  function deleteProject(id: string) {
    const p = projects.find(x => x.id === id);
    if (p) { setProjects(prev => prev.filter(x => x.id !== id)); log("deleted", "project", id, p.name, "Project deleted."); }
  }

  return <><div className="mb-5 flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm sm:flex-row sm:items-center">
    <div className="relative flex-1"><IconSearch className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" /><Input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search projects, clients, locations..." className="border-0 bg-slate-50 pl-9 focus:bg-white" /></div>
    <Select value={status} onChange={e => setStatus(e.target.value)}><option value="all">All statuses</option><option value="planning">Planning</option><option value="in_progress">In progress</option><option value="on_hold">On hold</option><option value="completed">Completed</option></Select>
    <div className="flex rounded-lg border border-slate-200 p-1"><Button onClick={() => setView("grid")} variant={view === "grid" ? "secondary" : "ghost"} size="icon" className="size-8"><IconLayoutGrid className="size-4" /></Button><Button onClick={() => setView("table")} variant={view === "table" ? "secondary" : "ghost"} size="icon" className="size-8"><IconList className="size-4" /></Button></div>
    <Dialog trigger={<Button><IconPlus className="size-4" />New project</Button>} title="Create a new project" description="Add the core project details.">
      <ProjectForm form={form} setForm={setForm} onSave={saveProject} onCancel={resetForm} editing={false} />
    </Dialog>
  </div>
    <div className="mb-4 flex items-center justify-between text-xs text-slate-500"><span>{filtered.length} projects</span></div>
    {view === "grid" ? <div className="grid gap-5 md:grid-cols-2 2xl:grid-cols-3">{filtered.map(p => <div key={p.id} className="group relative"><div className="absolute right-3 top-3 z-10 hidden gap-1 group-hover:flex"><Dialog trigger={<Button variant="secondary" size="icon" className="size-8 bg-white shadow-sm"><svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg></Button>} title="Edit project" description="Update project details.">
      <ProjectForm form={form} setForm={setForm} onSave={() => { if (editProject) { setProjects(prev => prev.map(p => p.id === editProject.id ? { ...p, ...form } : p)); log("updated", "project", editProject.id, form.name, "Project details updated."); resetForm(); } }} onCancel={resetForm} editing={true} />
    </Dialog><Button variant="danger" size="icon" className="size-8 bg-white shadow-sm" onClick={() => deleteProject(p.id)}><IconTrash className="size-3.5" /></Button></div><ProjectCard project={p} /></div>)}</div> : <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <Table><thead><tr><Th>Project</Th><Th>Status</Th><Th>Progress</Th><Th>Manager & team</Th><Th>Timeline</Th><Th></Th></tr></thead><tbody>{filtered.map(p => { const manager = teamMembers.find(m => m.id === p.managerId)!; const names = p.teamIds.map(id => teamMembers.find(m => m.id === id)!.name); return <tr key={p.id} className="hover:bg-slate-50/70"><Td><Link href={`/projects/${p.id}`} className="block"><p className="font-semibold text-slate-900 hover:text-orange-600">{p.name}</p><p className="mt-1 flex items-center gap-1 text-xs"><IconMapPin className="size-3" />{p.location}</p></Link></Td><Td><Badge value={p.status} /></Td><Td><div className="w-32"><div className="mb-1 flex justify-between text-xs"><span>{p.progress}%</span></div><Progress value={p.progress} /></div></Td><Td><div className="flex items-center gap-3"><Avatar name={manager.name} size="sm" /><AvatarStack names={names} limit={3} /></div></Td><Td><p className="flex items-center gap-1.5 text-xs"><IconCalendarMonth className="size-3.5" />{p.endDate}</p></Td><Td><div className="flex gap-1"><Dialog trigger={<Button variant="ghost" size="icon" className="size-8"><svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg></Button>} title="Edit project" description="Update project details."><ProjectForm form={form} setForm={setForm} onSave={() => { openEdit(p); saveProject(); }} onCancel={resetForm} editing={true} /></Dialog><Button variant="ghost" size="icon" className="size-8 text-red-500 hover:bg-red-50" onClick={() => deleteProject(p.id)}><IconTrash className="size-3.5" /></Button></div></Td></tr> })}</tbody></Table></div>}
    {filtered.length === 0 && <div className="rounded-xl border border-dashed border-slate-300 bg-white py-20 text-center"><p className="font-medium text-slate-800">No matching projects</p><p className="mt-1 text-sm text-slate-500">Try a different search or filter.</p></div>}</>;
}

function ProjectForm({ form, setForm, onSave, onCancel, editing }: { form: Omit<Project, "id">; setForm: (f: Omit<Project, "id">) => void; onSave: () => void; onCancel: () => void; editing: boolean }) {
  return <form className="grid gap-4" onSubmit={e => { e.preventDefault(); onSave(); }}>
    <div><Label>Project name</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Downtown Commons" /></div>
    <div className="grid gap-4 sm:grid-cols-2"><div><Label>Client</Label><Input value={form.client} onChange={e => setForm({ ...form, client: e.target.value })} placeholder="Client organization" /></div><div><Label>Location</Label><Input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} placeholder="City, State" /></div></div>
    <div><Label>Description</Label><Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Short project summary..." /></div>
    <div className="grid gap-4 sm:grid-cols-2"><div><Label>Start date</Label><Input type="date" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} /></div><div><Label>Target completion</Label><Input type="date" value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} /></div></div>
    <div><Label>Status</Label><Select value={form.status} onChange={e => setForm({ ...form, status: e.target.value as Project["status"] })}><option value="planning">Planning</option><option value="in_progress">In progress</option><option value="on_hold">On hold</option><option value="completed">Completed</option></Select></div>
    <div className="flex justify-end gap-2 pt-2"><Button variant="outline" type="button" onClick={onCancel}>Cancel</Button><Button type="submit">{editing ? "Save changes" : "Create project"}</Button></div>
  </form>;
}
