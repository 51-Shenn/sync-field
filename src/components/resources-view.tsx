"use client";

import { useMemo, useRef, useState } from "react";
import {
  IconAlertTriangle,
  IconChartBar,
  IconCurrencyDollar,
  IconGasStation,
  IconInfoCircle,
  IconPencil,
  IconPlus,
  IconSearch,
  IconTool,
  IconTrash,
  IconUpload,
  IconX,
} from "@tabler/icons-react";
import { projects, auditLogs as initialLogs, type AuditLog } from "@/lib/mock-data";
import { filterResources, normalizeResourceType, type Resource } from "@/lib/resource-data";
import { useStoredResources } from "@/lib/use-stored-resources";
import { Badge, Button, Card, CardContent, Dialog, Input, Label, Progress, Select, Table, Td, Th } from "@/components/ui";

type ResourceForm = Omit<Resource, "id">;

const emptyResource = (): ResourceForm => ({ name: "", type: "equipment", allocated: 0, available: 0, projectId: "" });
const projectNames = Object.fromEntries(projects.map((project) => [project.id, project.name]));
const eventDate = () => new Date();
const resourceId = () => `resource-${crypto.randomUUID()}`;

export function ResourcesView() {
  const [resources, setResources] = useStoredResources();
  const [, setLogs] = useState(initialLogs);
  const [query, setQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterProject, setFilterProject] = useState("all");
  const [form, setForm] = useState<ResourceForm>(emptyResource());
  const [editing, setEditing] = useState<Resource | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [formError, setFormError] = useState("");
  const [detail, setDetail] = useState<Resource | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Resource | null>(null);
  const [importMessage, setImportMessage] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(
    () => filterResources(resources, { query, type: filterType, projectId: filterProject }, projectNames),
    [resources, query, filterType, filterProject],
  );
  const hasFilters = Boolean(query.trim()) || filterType !== "all" || filterProject !== "all";

  const totalAllocated = resources.reduce((sum, resource) => sum + resource.allocated, 0);
  const totalAvailable = resources.reduce((sum, resource) => sum + resource.available, 0);
  const overallUtilization = totalAvailable > 0 ? Math.round((totalAllocated / totalAvailable) * 100) : 0;
  const shortageCount = resources.filter((resource) => resource.allocated > resource.available).length;
  const lowStockCount = resources.filter((resource) => resource.type !== "equipment" && resource.allocated >= resource.available * 0.8).length;

  const typeIcon: Record<Resource["type"], typeof IconTool> = {
    equipment: IconTool,
    material: IconCurrencyDollar,
    fuel: IconGasStation,
  };

  function log(action: AuditLog["action"], resource: Resource, details: string) {
    const now = eventDate();
    const entry: AuditLog = {
      id: `al-${resource.id}-${now.getTime()}`,
      action,
      entity: "resource",
      entityId: resource.id,
      entityName: resource.name,
      performedBy: "Marcus Chen",
      timestamp: now.toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" }),
      details,
    };
    setLogs((current) => [entry, ...current]);
  }

  function resetEditor() {
    setForm(emptyResource());
    setEditing(null);
    setFormError("");
  }

  function openCreate() {
    resetEditor();
    setEditorOpen(true);
  }

  function openEdit(resource: Resource) {
    setEditing(resource);
    setForm({ name: resource.name, type: resource.type, allocated: resource.allocated, available: resource.available, projectId: resource.projectId });
    setFormError("");
    setDetail(null);
    setEditorOpen(true);
  }

  function saveResource() {
    if (!form.name.trim() || !form.projectId) {
      setFormError("Resource name and project are required.");
      return;
    }
    const normalized: ResourceForm = {
      ...form,
      name: form.name.trim(),
      allocated: Math.max(0, form.allocated),
      available: Math.max(0, form.available),
    };
    if (editing) {
      const updated = { ...editing, ...normalized };
      setResources((current) => current.map((resource) => resource.id === editing.id ? updated : resource));
      log("updated", updated, "Resource details and allocation updated.");
    } else {
      const created: Resource = { id: resourceId(), ...normalized };
      setResources((current) => [created, ...current]);
      log("created", created, `Resource added (${created.type}).`);
    }
    setEditorOpen(false);
    resetEditor();
  }

  function deleteResource(resource: Resource) {
    setResources((current) => current.filter((item) => item.id !== resource.id));
    log("deleted", resource, "Resource removed from inventory.");
    setPendingDelete(null);
    setDetail(null);
  }

  function clearFilters() {
    setQuery("");
    setFilterType("all");
    setFilterProject("all");
  }

  function handleBulkUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      const text = String(loadEvent.target?.result ?? "");
      const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
      const imported: Resource[] = [];
      let skipped = 0;
      for (const line of lines.slice(1)) {
        const [name = "", rawType = "", rawAllocated = "0", rawAvailable = "0", projectId = ""] = line.split(",").map((column) => column.trim());
        const type = normalizeResourceType(rawType);
        if (!name || !type || !projectNames[projectId]) {
          skipped += 1;
          continue;
        }
        imported.push({
          id: resourceId(),
          name,
          type,
          allocated: Math.max(0, Number(rawAllocated) || 0),
          available: Math.max(0, Number(rawAvailable) || 0),
          projectId,
        });
      }
      if (imported.length) {
        setResources((current) => [...imported, ...current]);
        const summary: Resource = { id: "bulk", name: `${imported.length} imported resources`, type: "material", allocated: 0, available: 0, projectId: imported[0].projectId };
        log("created", summary, `Imported from ${file.name}.`);
      }
      setImportMessage(`${imported.length} imported${skipped ? `, ${skipped} skipped` : ""}.`);
    };
    reader.readAsText(file);
    event.target.value = "";
  }

  return (
    <>
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Total resources" value={String(resources.length)} description="Equipment, materials and fuel" icon={<IconChartBar className="size-5" />} />
        <MetricCard label="Overall utilization" value={`${overallUtilization}%`} description="Allocated against available"><Progress value={overallUtilization} className="mt-3" /></MetricCard>
        <MetricCard label="Shortages" value={String(shortageCount)} description="Allocated above available" danger={shortageCount > 0} icon={shortageCount > 0 ? <IconAlertTriangle className="size-5" /> : undefined} />
        <MetricCard label="Low stock (≥80%)" value={String(lowStockCount)} description="Materials and fuel near capacity" warning={lowStockCount > 0} icon={lowStockCount > 0 ? <IconInfoCircle className="size-5" /> : undefined} />
      </section>

      <Card className="mt-6 overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 p-5">
          <div><h3 className="font-semibold text-slate-950">Resource inventory</h3><p className="mt-1 text-xs text-slate-500">Manage equipment, materials, and fuel across projects</p>{importMessage && <p className="mt-1 text-xs font-medium text-emerald-600">{importMessage}</p>}</div>
          <div className="flex items-center gap-2">
            <input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden" onChange={handleBulkUpload} />
            <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}><IconUpload className="size-4" />Import CSV</Button>
            <Button size="sm" onClick={openCreate}><IconPlus className="size-4" />Add resource</Button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 border-t border-slate-100 px-5 py-3">
          <div className="relative min-w-60 flex-1 sm:max-w-sm">
            <IconSearch className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search name, type, or project..." className="pl-9 pr-8" />
            {query && <button type="button" aria-label="Clear search" onClick={() => setQuery("")} className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"><IconX className="size-4" /></button>}
          </div>
          <Select value={filterType} onChange={(event) => setFilterType(event.target.value)} className="min-w-[140px]"><option value="all">All types</option><option value="equipment">Equipment</option><option value="material">Materials</option><option value="fuel">Fuel</option></Select>
          <Select value={filterProject} onChange={(event) => setFilterProject(event.target.value)} className="min-w-[180px]"><option value="all">All projects</option>{projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}</Select>
          {hasFilters && <Button variant="ghost" size="sm" onClick={clearFilters}><IconX className="size-4" />Clear filters</Button>}
          <span className="ml-auto text-xs text-slate-400">{filtered.length} of {resources.length}</span>
        </div>

        <Table>
          <thead><tr><Th>Resource</Th><Th>Type</Th><Th>Project</Th><Th>Allocated</Th><Th>Available</Th><Th>Utilization</Th><Th></Th></tr></thead>
          <tbody>
            {filtered.map((resource) => {
              const utilization = Math.round((resource.allocated / Math.max(resource.available, 1)) * 100);
              const Icon = typeIcon[resource.type];
              const isShortage = resource.allocated > resource.available;
              return <tr key={resource.id} className="cursor-pointer transition-colors hover:bg-slate-50" onClick={() => setDetail(resource)}>
                <Td><div className="flex items-center gap-3"><span className="flex size-9 items-center justify-center rounded-lg bg-slate-50 text-slate-600"><Icon className="size-4" /></span><span className="font-medium text-slate-900">{resource.name}</span></div></Td>
                <Td><Badge>{resource.type}</Badge></Td>
                <Td>{projectNames[resource.projectId] ?? "Unassigned"}</Td>
                <Td className="font-medium">{resource.allocated}</Td><Td>{resource.available}</Td>
                <Td><div className="flex w-32 items-center gap-2"><Progress value={utilization} indicatorClassName={isShortage ? "bg-red-500" : utilization >= 80 ? "bg-amber-500" : undefined} /><span className="text-xs tabular-nums">{utilization}%</span></div></Td>
                <Td><div className="flex gap-1"><Button variant="ghost" size="icon" className="size-8" aria-label={`Edit ${resource.name}`} onClick={(event) => { event.stopPropagation(); openEdit(resource); }}><IconPencil className="size-3.5" /></Button><Button variant="ghost" size="icon" className="size-8 text-red-500 hover:bg-red-50" aria-label={`Delete ${resource.name}`} onClick={(event) => { event.stopPropagation(); setPendingDelete(resource); }}><IconTrash className="size-3.5" /></Button></div></Td>
              </tr>;
            })}
            {!filtered.length && <tr><Td colSpan={7} className="py-12 text-center"><p className="text-sm font-medium text-slate-600">No resources match these filters</p><Button variant="ghost" size="sm" className="mt-2" onClick={clearFilters}>Clear filters</Button></Td></tr>}
          </tbody>
        </Table>
      </Card>

      <Dialog open={editorOpen} onOpenChange={(open) => { setEditorOpen(open); if (!open) resetEditor(); }} title={editing ? "Edit resource" : "Add resource"} description="Manage equipment, material, or fuel allocation.">
        <form className="space-y-4" onSubmit={(event) => { event.preventDefault(); saveResource(); }}>
          <div><Label>Resource name</Label><Input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="e.g. Structural steel" /></div>
          <div className="grid gap-4 sm:grid-cols-2"><div><Label>Type</Label><Select value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value as Resource["type"] })}><option value="equipment">Equipment</option><option value="material">Material</option><option value="fuel">Fuel</option></Select></div><div><Label>Project</Label><Select value={form.projectId} onChange={(event) => setForm({ ...form, projectId: event.target.value })}><option value="">Select project</option>{projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}</Select></div></div>
          <div className="grid gap-4 sm:grid-cols-2"><div><Label>Allocated</Label><Input type="number" min={0} step="any" value={form.allocated} onChange={(event) => setForm({ ...form, allocated: Math.max(0, Number(event.target.value)) })} /></div><div><Label>Available</Label><Input type="number" min={0} step="any" value={form.available} onChange={(event) => setForm({ ...form, available: Math.max(0, Number(event.target.value)) })} /></div></div>
          {formError && <p className="text-sm font-medium text-red-600">{formError}</p>}
          <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setEditorOpen(false)}>Cancel</Button><Button type="submit">{editing ? "Save changes" : "Add resource"}</Button></div>
        </form>
      </Dialog>

      <Dialog open={Boolean(detail)} onOpenChange={(open) => { if (!open) setDetail(null); }} title={detail?.name ?? "Resource details"} description="Allocation and availability summary.">
        {detail && <div className="space-y-5"><div className="grid gap-4 sm:grid-cols-2"><div><Label>Type</Label><Badge>{detail.type}</Badge></div><div><Label>Project</Label><p className="text-sm font-medium text-slate-900">{projectNames[detail.projectId] ?? "Unassigned"}</p></div></div><div className="grid grid-cols-3 gap-3">{[["Allocated", detail.allocated], ["Available", detail.available], ["Utilization", `${Math.round((detail.allocated / Math.max(detail.available, 1)) * 100)}%`]].map(([label, value]) => <Card key={label}><CardContent className="p-3"><p className="text-[10px] uppercase tracking-wide text-slate-400">{label}</p><p className="mt-1 text-lg font-bold text-slate-950">{value}</p></CardContent></Card>)}</div><Progress value={Math.round((detail.allocated / Math.max(detail.available, 1)) * 100)} indicatorClassName={detail.allocated > detail.available ? "bg-red-500" : detail.allocated >= detail.available * 0.8 ? "bg-amber-500" : undefined} /><div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setDetail(null)}>Close</Button><Button variant="secondary" onClick={() => openEdit(detail)}><IconPencil className="size-4" />Edit</Button><Button variant="danger" onClick={() => { setDetail(null); setPendingDelete(detail); }}><IconTrash className="size-4" />Delete</Button></div></div>}
      </Dialog>

      <Dialog open={Boolean(pendingDelete)} onOpenChange={(open) => { if (!open) setPendingDelete(null); }} title="Delete resource?" description={pendingDelete ? `This will remove ${pendingDelete.name} from resource management.` : undefined}>
        <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setPendingDelete(null)}>Cancel</Button><Button variant="danger" onClick={() => pendingDelete && deleteResource(pendingDelete)}><IconTrash className="size-4" />Delete resource</Button></div>
      </Dialog>
    </>
  );
}

function MetricCard({ label, value, description, icon, children, danger, warning }: { label: string; value: string; description: string; icon?: React.ReactNode; children?: React.ReactNode; danger?: boolean; warning?: boolean }) {
  return <Card><CardContent><div className="flex items-start justify-between gap-3"><div><p className="text-xs text-slate-500">{label}</p><p className={`mt-2 text-2xl font-bold ${danger ? "text-red-600" : warning ? "text-amber-600" : "text-slate-950"}`}>{value}</p></div>{icon && <span className={`flex size-10 items-center justify-center rounded-xl ${danger ? "bg-red-50 text-red-500" : warning ? "bg-amber-50 text-amber-500" : "bg-orange-50 text-orange-600"}`}>{icon}</span>}</div>{children}<p className="mt-2 text-xs text-slate-400">{description}</p></CardContent></Card>;
}
