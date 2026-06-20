"use client";

import { useState } from "react";
import { IconCurrencyDollar, IconGasStation, IconPlus, IconTrash, IconTool } from "@tabler/icons-react";
import { projects, auditLogs as initialLogs, type AuditLog } from "@/lib/mock-data";
import { Badge, Button, Card, CardContent, Dialog, Input, Label, Progress, Table, Td, Th } from "@/components/ui";

type Resource = { id: string; name: string; type: "equipment" | "material" | "fuel"; allocated: number; available: number; projectId: string };
let nextRid = 4;
const defaultResources: Resource[] = [
  { id: "r1", name: "Tower Crane #2", type: "equipment", allocated: 1, available: 1, projectId: "riverside" },
  { id: "r2", name: "Concrete Pump", type: "equipment", allocated: 2, available: 3, projectId: "oakwood" },
  { id: "r3", name: "Rebar #8", type: "material", allocated: 120, available: 400, projectId: "riverside" },
  { id: "r4", name: "Diesel (gallons)", type: "fuel", allocated: 800, available: 2000, projectId: "harbor" },
];

export function ResourcesView() {
  const [resources, setResources] = useState(defaultResources);
  const [form, setForm] = useState({ name: "", type: "equipment" as Resource["type"], allocated: 0, available: 0, projectId: "" });
  const [logs, setLogs] = useState(initialLogs);

  function log(action: AuditLog["action"], entity: string, entityId: string, entityName: string, details: string) {
    const entry: AuditLog = { id: `al${Date.now()}`, action, entity, entityId, entityName, performedBy: "Marcus Chen", timestamp: new Date().toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" }), details };
    setLogs(prev => [entry, ...prev]);
  }

  function addResource() {
    const newRes: Resource = { id: `r${nextRid++}`, ...form };
    setResources(prev => [...prev, newRes]);
    log("created", "resource", newRes.id, form.name, `Resource added (${form.type}).`);
    setForm({ name: "", type: "equipment", allocated: 0, available: 0, projectId: "" });
  }
  function deleteResource(id: string) {
    const r = resources.find(x => x.id === id);
    if (r) { setResources(prev => prev.filter(x => x.id !== id)); log("deleted", "resource", id, r.name, "Resource removed."); }
  }

  const typeIcon = { equipment: IconTool, material: IconCurrencyDollar, fuel: IconGasStation };

  return <>
    <section className="grid gap-4 sm:grid-cols-3">
      <Card><CardContent><p className="text-xs text-slate-500">Total resources tracked</p><p className="mt-2 text-2xl font-bold text-slate-950">{resources.length}</p><p className="mt-1 text-xs text-slate-400">Equipment, materials &amp; fuel</p></CardContent></Card>
      <Card><CardContent><p className="text-xs text-slate-500">Active equipment</p><p className="mt-2 text-2xl font-bold text-slate-950">{resources.filter(r => r.type === "equipment").length}</p><p className="mt-1 text-xs text-slate-400">Across all projects</p></CardContent></Card>
      <Card><CardContent><p className="text-xs text-slate-500">Materials &amp; fuel</p><p className="mt-2 text-2xl font-bold text-slate-950">{resources.filter(r => r.type !== "equipment").length}</p><p className="mt-1 text-xs text-slate-400">Stocked on site</p></CardContent></Card>
    </section>

    <Card className="mt-6 overflow-hidden">
      <div className="flex items-center justify-between p-5">
        <div><h3 className="font-semibold text-slate-950">Allocated resources</h3><p className="mt-1 text-xs text-slate-500">Equipment, materials, and fuel across projects</p></div>
        <Dialog trigger={<Button><IconPlus className="size-4" />Add resource</Button>} title="Add resource" description="Track equipment, materials, or fuel allocation.">
          <form className="space-y-4" onSubmit={e => { e.preventDefault(); addResource(); }}>
            <div><Label>Resource name</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Tower Crane #3" /></div>
            <div><Label>Type</Label><select className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-orange-400" value={form.type} onChange={e => setForm({ ...form, type: e.target.value as Resource["type"] })}><option value="equipment">Equipment</option><option value="material">Material</option><option value="fuel">Fuel</option></select></div>
            <div className="grid gap-4 sm:grid-cols-2"><div><Label>Allocated</Label><Input type="number" value={form.allocated || ""} onChange={e => setForm({ ...form, allocated: Number(e.target.value) })} /></div><div><Label>Available</Label><Input type="number" value={form.available || ""} onChange={e => setForm({ ...form, available: Number(e.target.value) })} /></div></div>
            <div><Label>Project</Label><select className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-orange-400" value={form.projectId} onChange={e => setForm({ ...form, projectId: e.target.value })}><option value="">Select project</option>{projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
            <Button type="submit" className="w-full">Add resource</Button>
          </form>
        </Dialog>
      </div>
      <Table><thead><tr><Th>Resource</Th><Th>Type</Th><Th>Project</Th><Th>Allocated</Th><Th>Available</Th><Th>Utilization</Th><Th></Th></tr></thead><tbody>{resources.map(r => { const pct = Math.round(r.allocated / Math.max(r.available, 1) * 100); const Icon = typeIcon[r.type]; const project = projects.find(p => p.id === r.projectId); return <tr key={r.id}><Td><div className="flex items-center gap-3"><span className="flex size-9 items-center justify-center rounded-lg bg-slate-50 text-slate-600"><Icon className="size-4" /></span><span className="font-medium text-slate-900">{r.name}</span></div></Td><Td><Badge>{r.type}</Badge></Td><Td><span className="text-sm text-slate-600">{project?.name ?? "—"}</span></Td><Td className="font-medium">{r.allocated}</Td><Td>{r.available}</Td><Td><div className="flex w-28 items-center gap-2"><Progress value={pct} /><span className="text-xs">{pct}%</span></div></Td><Td><Button variant="ghost" size="icon" className="size-8 text-red-500 hover:bg-red-50" onClick={() => deleteResource(r.id)}><IconTrash className="size-3.5" /></Button></Td></tr> })}</tbody></Table>
    </Card>
  </>;
}
