"use client";

import { useState } from "react";
import { IconPencil } from "@tabler/icons-react";
import { useTeamMembers } from "@/lib/use-data";
import type { Project } from "@/lib/project-types";
import { Button, Dialog, Input, Label, Select, Textarea } from "@/components/ui";

export function EditProjectDialog({ project }: { project: Project }) {
  const { teamMembers } = useTeamMembers();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Omit<Project, "id">>({
    name: project.name,
    client: project.client,
    location: project.location,
    status: project.status,
    progress: project.progress,
    startDate: project.startDate,
    endDate: project.endDate,
    managerId: project.managerId,
    teamIds: [...project.teamIds],
    color: project.color,
    description: project.description,
  });

  function resetForm() {
    setForm({
      name: project.name,
      client: project.client,
      location: project.location,
      status: project.status,
      progress: project.progress,
      startDate: project.startDate,
      endDate: project.endDate,
      managerId: project.managerId,
      teamIds: [...project.teamIds],
      color: project.color,
      description: project.description,
    });
  }

  function saveProject() {
    setOpen(false);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => { setOpen(o); if (!o) resetForm(); }}
      trigger={<Button variant="outline"><IconPencil className="size-4"/>Edit project</Button>}
      title="Edit project"
      description="Update project details."
    >
      <form className="grid gap-4" onSubmit={e => { e.preventDefault(); saveProject(); }}>
        <div><Label>Project name</Label><Input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Downtown Commons" /></div>
        <div className="grid gap-4 sm:grid-cols-2"><div><Label>Client</Label><Input required value={form.client} onChange={e => setForm({ ...form, client: e.target.value })} placeholder="Client organization" /></div><div><Label>Location</Label><Input required value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} placeholder="City, State" /></div></div>
        <div><Label>Description</Label><Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Short project summary..." /></div>
        <div className="grid gap-4 sm:grid-cols-2"><div><Label>Start date</Label><Input required type="date" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} /></div><div><Label>Target completion</Label><Input required type="date" min={form.startDate} value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} /></div></div>
        <div className="grid gap-4 sm:grid-cols-2"><div><Label>Project manager</Label><Select required value={form.managerId} onChange={e => setForm({ ...form, managerId: e.target.value })}>{teamMembers.map(member => <option key={member.id} value={member.id}>{member.name}</option>)}</Select></div><div><Label>Status</Label><Select value={form.status} onChange={e => setForm({ ...form, status: e.target.value as Project["status"] })}><option value="planning">Planning</option><option value="in_progress">In progress</option><option value="on_hold">On hold</option><option value="completed">Completed</option></Select></div></div>
        <div className="flex justify-end gap-2 pt-2"><Button variant="outline" type="button" onClick={() => { setOpen(false); resetForm(); }}>Cancel</Button><Button type="submit">Save changes</Button></div>
      </form>
    </Dialog>
  );
}
