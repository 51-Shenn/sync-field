"use client";

import { useMemo, useState } from "react";
import { GitBranch, HardHat, Mail, Phone, Plus, Search, Shield, Trash2, Pencil, Users, Wrench } from "lucide-react";
import { projects, teamMembers as mockMembers, type TeamMember, auditLogs as initialLogs, type AuditLog } from "@/lib/mock-data";
import { Avatar, Badge, Button, Card, CardContent, Dialog, Input, Label, Select } from "@/components/ui";

const emptyWorker = (): Omit<TeamMember, "id"> => ({ name: "", role: "", email: "", phone: "", avatarUrl: "", status: "active", projectIds: [] });

const roleHierarchy = ["Project Director", "Site Manager", "Civil Engineer", "Architect", "MEP Engineer", "Safety Officer", "Cost Estimator", "Document Controller", "Foreperson", "Electrician"];

const roleIcons: Record<string, typeof Users> = {
  "Project Director": Users, "Site Manager": Shield, "Foreperson": HardHat, "Electrician": Wrench,
};

const statusColors: Record<string, string> = { active: "bg-emerald-500", on_leave: "bg-amber-500" };

export function WorkforceView() {
  const [members, setMembers] = useState(mockMembers);
  const [query, setQuery] = useState("");
  const [role, setRole] = useState("all");
  const [editMember, setEditMember] = useState<TeamMember | null>(null);
  const [form, setForm] = useState(emptyWorker());
  const [editing, setEditing] = useState(false);
  const [viewMode, setViewMode] = useState<"cards" | "orgchart">("cards");
  const [logs, setLogs] = useState(initialLogs);
  const roles = [...new Set(members.map(m => m.role))];
  const filtered = useMemo(() => members.filter(m => (role === "all" || m.role === role) && `${m.name} ${m.role}`.toLowerCase().includes(query.toLowerCase())), [query, role, members]);

  const orgTree = useMemo(() => {
    const byRole: Record<string, TeamMember[]> = {};
    const roleOrder = roleHierarchy.filter(r => members.some(m => m.role === r));
    roleOrder.forEach(r => { byRole[r] = members.filter(m => m.role === r); });
    return { roleOrder, byRole };
  }, [members]);

  function log(action: AuditLog["action"], entity: string, entityId: string, entityName: string, details: string) {
    const entry: AuditLog = { id: `al${Date.now()}`, action, entity, entityId, entityName, performedBy: "Marcus Chen", timestamp: new Date().toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" }), details };
    setLogs(prev => [entry, ...prev]);
  }

  function resetForm() { setForm(emptyWorker()); setEditMember(null); setEditing(false); }
  function openEdit(member: TeamMember) { setEditMember(member); setForm({ name: member.name, role: member.role, email: member.email, phone: member.phone, avatarUrl: member.avatarUrl, status: member.status, projectIds: [...member.projectIds] }); setEditing(true); }
  function saveWorker() {
    if (editing && editMember) {
      setMembers(prev => prev.map(m => m.id === editMember.id ? { ...m, ...form } : m));
      log("updated", "worker", editMember.id, form.name, "Worker profile updated.");
    } else {
      const newMember: TeamMember = { id: `tm${Date.now()}`, ...form };
      setMembers(prev => [...prev, newMember]);
      log("created", "worker", newMember.id, form.name, "New worker added to workforce.");
    }
    resetForm();
  }
  function deleteWorker(id: string) {
    const w = members.find(m => m.id === id);
    if (w) { setMembers(prev => prev.filter(m => m.id !== id)); log("deleted", "worker", id, w.name, "Worker removed from workforce."); }
    if (editMember?.id === id) resetForm();
  }

  const orgChartView = <div className="space-y-10 py-4">
    {orgTree.roleOrder.map((roleName, ri) => {
      const people = orgTree.byRole[roleName];
      const IconComp = roleIcons[roleName] || GitBranch;
      return <div key={roleName}>
        <div className="mb-4 flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-lg bg-orange-50 text-orange-600"><IconComp className="size-4" /></div>
          <h3 className="font-semibold text-slate-800">{roleName}</h3>
          <span className="text-xs text-slate-400">({people.length})</span>
        </div>
        {ri > 0 && <div className="mb-4 ml-1 flex items-center gap-2 text-[10px] text-slate-400"><svg className="size-3 text-slate-300" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>reports to {orgTree.roleOrder[ri - 1]}</div>}
        <div className="relative">
          {ri > 0 && <div className="absolute -top-4 left-[19px] h-4 w-px bg-slate-200" />}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {people.map(person => {
              const projectNames = person.projectIds.map(id => projects.find(p => p.id === id)?.name.split(" ")[0]).filter(Boolean).join(", ");
              return <div key={person.id} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm transition-shadow hover:shadow-md">
                <div className="relative">
                  <Avatar name={person.name} size="md" />
                  <span className={`absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full border-2 border-white ${statusColors[person.status] || "bg-slate-300"}`} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-900">{person.name}</p>
                  <p className="truncate text-xs text-slate-500">{person.email}</p>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="text-[10px] font-medium capitalize text-slate-400">{person.status.replace("_", " ")}</span>
                    {projectNames && <span className="truncate text-[10px] text-slate-400">&middot; {projectNames}</span>}
                  </div>
                </div>
              </div>;
            })}
          </div>
        </div>
      </div>;
    })}
  </div>;

  return <>
    <div className="mb-5 flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-3 sm:flex-row">
      <div className="relative flex-1"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" /><Input className="pl-9" placeholder="Search workers..." value={query} onChange={e => setQuery(e.target.value)} /></div>
      <Select value={role} onChange={e => setRole(e.target.value)}><option value="all">All roles</option>{roles.map(r => <option key={r}>{r}</option>)}</Select>
      <div className="flex rounded-lg border border-slate-200 p-1">
        <Button onClick={() => setViewMode("cards")} variant={viewMode === "cards" ? "secondary" : "ghost"} size="sm" className="h-8">Cards</Button>
        <Button onClick={() => setViewMode("orgchart")} variant={viewMode === "orgchart" ? "secondary" : "ghost"} size="sm" className="h-8">Org Chart</Button>
      </div>
      <Dialog trigger={<Button><Plus className="size-4" />Add worker</Button>} title="Add worker profile" description="Enter worker details and project assignments.">
        <WorkerForm form={form} setForm={setForm} onSave={saveWorker} onCancel={resetForm} editing={false} />
      </Dialog>
    </div>

    {viewMode === "orgchart" ? orgChartView : (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {filtered.map(member => <Card key={member.id} className="transition-shadow hover:shadow-md">
          <CardContent>
            <div className="flex items-start justify-between">
              <Avatar name={member.name} size="xl" />
              <div className="flex gap-1">
                <Dialog trigger={<Button variant="ghost" size="icon" className="size-8"><Pencil className="size-3.5" /></Button>} title="Edit worker profile" description="Update worker details.">
                  <WorkerForm form={form} setForm={setForm} onSave={saveWorker} onCancel={resetForm} editing={true} />
                </Dialog>
                <Button variant="ghost" size="icon" className="size-8 text-red-500 hover:bg-red-50 hover:text-red-700" onClick={() => deleteWorker(member.id)}><Trash2 className="size-3.5" /></Button>
              </div>
            </div>
            <h3 className="mt-4 font-semibold text-slate-950">{member.name}</h3>
            <p className="mt-1 text-sm text-slate-500">{member.role}</p>
            <div className="mt-4 space-y-2 border-t border-slate-100 pt-4 text-xs text-slate-500">
              <p className="flex items-center gap-2"><Mail className="size-3.5" />{member.email}</p>
              <p className="flex items-center gap-2"><Phone className="size-3.5" />{member.phone}</p>
              <p className="flex items-center gap-2"><Badge value={member.status} /></p>
            </div>
            <div className="mt-4 flex flex-wrap gap-1">{member.projectIds.map(id => <Badge key={id}>{projects.find(p => p.id === id)?.name.split(" ")[0]}</Badge>)}</div>
          </CardContent>
        </Card>)}
      </div>
    )}
    {viewMode === "cards" && filtered.length === 0 && <div className="rounded-xl border border-dashed border-slate-300 bg-white py-20 text-center"><p className="font-medium text-slate-800">No workers found</p><p className="mt-1 text-sm text-slate-500">Try a different search or add a new worker.</p></div>}
  </>;
}

function WorkerForm({ form, setForm, onSave, onCancel, editing }: { form: Omit<TeamMember, "id">; setForm: (f: Omit<TeamMember, "id">) => void; onSave: () => void; onCancel: () => void; editing: boolean }) {
  return <form className="space-y-4" onSubmit={e => { e.preventDefault(); onSave(); }}>
    <div className="grid gap-4 sm:grid-cols-2">
      <div><Label>Full name</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Full name" /></div>
      <div><Label>Role / trade</Label><Input value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} placeholder="e.g. Electrician" /></div>
    </div>
    <div><Label>Email</Label><Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="name@company.com" /></div>
    <div><Label>Phone</Label><Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="(555) 000-0000" /></div>
    <div><Label>Status</Label><Select value={form.status} onChange={e => setForm({ ...form, status: e.target.value as "active" | "on_leave" })}><option value="active">Active</option><option value="on_leave">On leave</option></Select></div>
    <div><Label>Assign to project</Label><Select value={form.projectIds[0] ?? ""} onChange={e => setForm({ ...form, projectIds: e.target.value ? [e.target.value] : [] })}><option value="">— None —</option>{projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</Select></div>
    <div className="flex justify-end gap-2"><Button variant="outline" type="button" onClick={onCancel}>Cancel</Button><Button type="submit">{editing ? "Save changes" : "Add worker"}</Button></div>
  </form>;
}
