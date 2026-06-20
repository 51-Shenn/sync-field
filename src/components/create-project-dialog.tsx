"use client";

import { useState } from "react";
import { IconPlus } from "@tabler/icons-react";
import { useOperations } from "@/components/operations-provider";
import type { OperationsProject } from "@/lib/operations-types";
import { Button, Dialog, Input, Label, Select, Textarea } from "@/components/ui";

type ProjectForm = Omit<OperationsProject, "id" | "progress" | "siteId">;

const emptyForm = (): ProjectForm => ({
  name: "",
  client: "",
  location: "",
  status: "planning",
  startDate: "",
  endDate: "",
  managerId: "",
  color: "#f97316",
  description: "",
});

export function CreateProjectDialog() {
  const { snapshot, createProject } = useOperations();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<ProjectForm>(emptyForm());
  const [formError, setFormError] = useState("");

  function resetForm() {
    setForm({ ...emptyForm(), managerId: snapshot.technicians[0]?.id ?? "" });
    setFormError("");
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (!form.name.trim() || !form.client.trim() || !form.location.trim() || !form.startDate || !form.endDate) {
      setFormError("Name, client, location, and project dates are required.");
      return;
    }
    if (form.endDate < form.startDate) {
      setFormError("Target completion must be after the start date.");
      return;
    }
    try {
      await createProject(form);
      setOpen(false);
      resetForm();
    } catch (reason) {
      setFormError(reason instanceof Error ? reason.message : "Unable to save project");
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => { setOpen(o); if (!o) resetForm(); }}
      trigger={<Button onClick={() => { resetForm(); setOpen(true); }}><IconPlus className="size-4" />New project</Button>}
      title="Create project"
      description="Project records are stored in the shared operations database."
    >
      <form className="grid gap-4" onSubmit={save}>
        <div>
          <Label>Project name</Label>
          <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Client</Label>
            <Input value={form.client} onChange={(e) => setForm({ ...form, client: e.target.value })} />
          </div>
          <div>
            <Label>Location</Label>
            <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
          </div>
        </div>
        <div>
          <Label>Description</Label>
          <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Start date</Label>
            <Input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
          </div>
          <div>
            <Label>Target completion</Label>
            <Input type="date" min={form.startDate} value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Manager</Label>
            <Select value={form.managerId} onChange={(e) => setForm({ ...form, managerId: e.target.value })}>
              <option value="">Unassigned</option>
              {snapshot.technicians.map((member) => (
                <option key={member.id} value={member.id}>{member.name}</option>
              ))}
            </Select>
          </div>
          <div>
            <Label>Status</Label>
            <Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as ProjectForm["status"] })}>
              <option value="planning">Planning</option>
              <option value="in_progress">In progress</option>
              <option value="on_hold">On hold</option>
              <option value="completed">Completed</option>
            </Select>
          </div>
        </div>
        {formError && <p className="text-sm text-red-600">{formError}</p>}
        <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
          <Button variant="outline" type="button" onClick={() => { setOpen(false); resetForm(); }}>Cancel</Button>
          <Button type="submit">Create project</Button>
        </div>
      </form>
    </Dialog>
  );
}
