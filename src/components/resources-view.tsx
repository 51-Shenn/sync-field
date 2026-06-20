"use client";

import { useMemo, useState, useRef } from "react";
import {
  IconAlertTriangle,
  IconChartBar,
  IconCurrencyDollar,
  IconGasStation,
  IconInfoCircle,
  IconPlus,
  IconSearch,
  IconTool,
  IconTrash,
  IconUpload,
  IconX,
} from "@tabler/icons-react";
import {
  projects,
  auditLogs as initialLogs,
  type AuditLog,
} from "@/lib/mock-data";
import {
  Badge,
  Button,
  Card,
  CardContent,
  Dialog,
  Input,
  Label,
  MultiSelect,
  Progress,
  Select,
  Table,
  Td,
  Th,
} from "@/components/ui";

type Resource = {
  id: string;
  name: string;
  type: "equipment" | "material" | "fuel";
  allocated: number;
  available: number;
  projectId: string;
};
let nextRid = 4;
const defaultResources: Resource[] = [
  { id: "r1", name: "Tower Crane #2", type: "equipment", allocated: 1, available: 1, projectId: "riverside" },
  { id: "r2", name: "Concrete Pump", type: "equipment", allocated: 2, available: 3, projectId: "oakwood" },
  { id: "r3", name: "Rebar #8", type: "material", allocated: 120, available: 400, projectId: "riverside" },
  { id: "r4", name: "Diesel (gallons)", type: "fuel", allocated: 800, available: 2000, projectId: "harbor" },
];

export function ResourcesView() {
  const [resources, setResources] = useState(defaultResources);
  const [logs, setLogs] = useState(initialLogs);
  const [query, setQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterProject, setFilterProject] = useState<string>("all");
  const [form, setForm] = useState({ name: "", type: "equipment" as Resource["type"], allocated: 0, available: 0, projectId: "" });
  const [detail, setDetail] = useState<Resource | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const typeOptions = [
    { value: "equipment", label: "Equipment" },
    { value: "material", label: "Material" },
    { value: "fuel", label: "Fuel" },
  ];
  const projectOptions = projects.map((p) => ({ value: p.id, label: p.name }));

  function log(action: AuditLog["action"], entity: string, entityId: string, entityName: string, details: string) {
    const entry: AuditLog = {
      id: `al${Date.now()}`, action, entity, entityId, entityName,
      performedBy: "Marcus Chen",
      timestamp: new Date().toLocaleString("en-US", {
        month: "short", day: "numeric", year: "numeric",
        hour: "2-digit", minute: "2-digit",
      }),
      details,
    };
    setLogs((prev) => [entry, ...prev]);
  }

  function addResource() {
    if (!form.name) return;
    const newRes: Resource = { id: `r${nextRid++}`, ...form };
    setResources((prev) => [...prev, newRes]);
    log("created", "resource", newRes.id, form.name, `Resource added (${form.type}).`);
    setForm({ name: "", type: "equipment", allocated: 0, available: 0, projectId: "" });
  }

  function deleteResource(id: string) {
    const r = resources.find((x) => x.id === id);
    if (r) {
      setResources((prev) => prev.filter((x) => x.id !== id));
      log("deleted", "resource", id, r.name, "Resource removed.");
    }
  }

  function handleBulkUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const lines = text.split("\n").filter(Boolean);
      const newResources: Resource[] = [];
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(",").map((c) => c.trim());
        if (cols.length < 5) continue;
        const [name, type, allocated, available, projectId] = cols;
        if (!name || !type || !projectId) continue;
        newResources.push({
          id: `r${nextRid++}`,
          name,
          type: type as Resource["type"],
          allocated: Number(allocated) || 0,
          available: Number(available) || 0,
          projectId,
        });
      }
      if (newResources.length > 0) {
        setResources((prev) => [...prev, ...newResources]);
        log("created", "resource", "bulk", `${newResources.length} resources`, `Bulk upload from ${file.name}`);
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  const filtered = useMemo(
    () =>
      resources.filter((r) => {
        if (filterType !== "all" && r.type !== filterType) return false;
        if (filterProject !== "all" && r.projectId !== filterProject) return false;
        if (query && !r.name.toLowerCase().includes(query.toLowerCase())) return false;
        return true;
      }),
    [resources, filterType, filterProject, query],
  );

  const typeIcon: Record<string, typeof IconTool> = {
    equipment: IconTool,
    material: IconCurrencyDollar,
    fuel: IconGasStation,
  };

  const totalAllocated = resources.reduce((s, r) => s + r.allocated, 0);
  const totalAvailable = resources.reduce((s, r) => s + r.available, 0);
  const overallUtilization = totalAvailable > 0 ? Math.round((totalAllocated / totalAvailable) * 100) : 0;
  const shortageCount = resources.filter((r) => r.allocated > r.available).length;
  const lowStockCount = resources.filter((r) => r.type !== "equipment" && r.allocated >= r.available * 0.8).length;

  return (
    <>
      <section className="grid gap-4 sm:grid-cols-4">
        <Card>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500">Total resources</p>
                <p className="mt-2 text-2xl font-bold text-slate-950">{resources.length}</p>
              </div>
              <span className="flex size-10 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
                <IconChartBar className="size-5" />
              </span>
            </div>
            <p className="mt-2 text-xs text-slate-400">Equipment, materials &amp; fuel across all projects</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <p className="text-xs text-slate-500">Overall utilization</p>
            <p className="mt-2 text-2xl font-bold text-slate-950">{overallUtilization}%</p>
            <Progress value={overallUtilization} className="mt-2" />
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500">Shortages</p>
                <p className="mt-2 text-2xl font-bold text-red-600">{shortageCount}</p>
              </div>
              {shortageCount > 0 && (
                <span className="flex size-10 items-center justify-center rounded-xl bg-red-50 text-red-500">
                  <IconAlertTriangle className="size-5" />
                </span>
              )}
            </div>
            <p className="mt-1 text-xs text-slate-400">Resources with allocated &gt; available</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500">Low stock (≥80%)</p>
                <p className="mt-2 text-2xl font-bold text-amber-600">{lowStockCount}</p>
              </div>
              {lowStockCount > 0 && (
                <span className="flex size-10 items-center justify-center rounded-xl bg-amber-50 text-amber-500">
                  <IconInfoCircle className="size-5" />
                </span>
              )}
            </div>
            <p className="mt-1 text-xs text-slate-400">Materials &amp; fuel nearing full allocation</p>
          </CardContent>
        </Card>
      </section>

      <Card className="mt-6 overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 p-5">
          <div>
            <h3 className="font-semibold text-slate-950">Resource Inventory</h3>
            <p className="mt-1 text-xs text-slate-500">Equipment, materials, and fuel across projects</p>
          </div>
          <div className="flex items-center gap-2">
            <input
              ref={fileRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              className="hidden"
              onChange={handleBulkUpload}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileRef.current?.click()}
            >
              <IconUpload className="size-4" />
              Import CSV
            </Button>
            <Dialog
              trigger={
                <Button size="sm">
                  <IconPlus className="size-4" />
                  Add resource
                </Button>
              }
              title="Add resource"
              description="Track equipment, materials, or fuel allocation."
            >
              <form
                className="space-y-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  addResource();
                }}
              >
                <div>
                  <Label>Resource name</Label>
                  <Input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. Tower Crane #3"
                  />
                </div>
                <div>
                  <Label>Type</Label>
                  <Select
                    value={form.type}
                    onChange={(e) =>
                      setForm({ ...form, type: e.target.value as Resource["type"] })
                    }
                  >
                    <option value="equipment">Equipment</option>
                    <option value="material">Material</option>
                    <option value="fuel">Fuel</option>
                  </Select>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label>Allocated</Label>
                    <Input
                      type="number"
                      min={0}
                      value={form.allocated}
                      onChange={(e) =>
                        setForm({ ...form, allocated: Math.max(0, Number(e.target.value)) })
                      }
                    />
                  </div>
                  <div>
                    <Label>Available</Label>
                    <Input
                      type="number"
                      min={0}
                      value={form.available}
                      onChange={(e) =>
                        setForm({ ...form, available: Math.max(0, Number(e.target.value)) })
                      }
                    />
                  </div>
                </div>
                <div>
                  <Label>Project</Label>
                  <Select
                    value={form.projectId}
                    onChange={(e) => setForm({ ...form, projectId: e.target.value })}
                  >
                    <option value="">Select project</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </Select>
                </div>
                <Button type="submit" className="w-full">
                  Add resource
                </Button>
              </form>
            </Dialog>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 border-t border-slate-100 px-5 py-3">
          <div className="relative flex-1 sm:max-w-xs">
            <IconSearch className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search resources..."
              className="pl-9 pr-8"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <IconX className="size-4" />
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="min-w-[140px]"
            >
              <option value="all">All types</option>
              <option value="equipment">Equipment</option>
              <option value="material">Material</option>
              <option value="fuel">Fuel</option>
            </Select>
            <Select
              value={filterProject}
              onChange={(e) => setFilterProject(e.target.value)}
              className="min-w-[160px]"
            >
              <option value="all">All projects</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </Select>
          </div>
        </div>

        <Table>
          <thead>
            <tr>
              <Th>Resource</Th>
              <Th>Type</Th>
              <Th>Project</Th>
              <Th>Allocated</Th>
              <Th>Available</Th>
              <Th>Utilization</Th>
              <Th></Th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => {
              const pct = Math.round((r.allocated / Math.max(r.available, 1)) * 100);
              const Icon = typeIcon[r.type];
              const project = projects.find((p) => p.id === r.projectId);
              const isShortage = r.allocated > r.available;
              return (
                <tr
                  key={r.id}
                  className="cursor-pointer transition-colors hover:bg-slate-50"
                  onClick={() => setDetail(r)}
                >
                  <Td>
                    <div className="flex items-center gap-3">
                      <span className="flex size-9 items-center justify-center rounded-lg bg-slate-50 text-slate-600">
                        <Icon className="size-4" />
                      </span>
                      <span className="font-medium text-slate-900">{r.name}</span>
                    </div>
                  </Td>
                  <Td>
                    <Badge>{r.type}</Badge>
                  </Td>
                  <Td>
                    <span className="text-sm text-slate-600">
                      {project?.name ?? "—"}
                    </span>
                  </Td>
                  <Td className="font-medium">{r.allocated}</Td>
                  <Td>{r.available}</Td>
                  <Td>
                    <div className="flex w-28 items-center gap-2">
                      <Progress
                        value={pct}
                        indicatorClassName={
                          isShortage
                            ? "bg-red-500"
                            : pct >= 80
                              ? "bg-amber-500"
                              : undefined
                        }
                      />
                      <span className="text-xs">{pct}%</span>
                    </div>
                  </Td>
                  <Td>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 text-red-500 hover:bg-red-50"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteResource(r.id);
                      }}
                    >
                      <IconTrash className="size-3.5" />
                    </Button>
                  </Td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <Td colSpan={7} className="py-12 text-center text-sm text-slate-400">
                  No resources match your filters.
                </Td>
              </tr>
            )}
          </tbody>
        </Table>
      </Card>

      <Dialog
        open={!!detail}
        onOpenChange={(o) => { if (!o) setDetail(null); }}
        title={detail?.name ?? ""}
        description="Resource details and allocation summary"
      >
        {detail && (
          <div className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Type</Label>
                <Badge>{detail.type}</Badge>
              </div>
              <div>
                <Label>Project</Label>
                <p className="text-sm font-medium text-slate-900">
                  {projects.find((p) => p.id === detail.projectId)?.name ?? "—"}
                </p>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <Card>
                <CardContent>
                  <p className="text-xs text-slate-500">Allocated</p>
                  <p className="mt-1 text-lg font-bold text-slate-950">
                    {detail.allocated}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent>
                  <p className="text-xs text-slate-500">Available</p>
                  <p className="mt-1 text-lg font-bold text-slate-950">
                    {detail.available}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent>
                  <p className="text-xs text-slate-500">Utilization</p>
                  <p className="mt-1 text-lg font-bold text-slate-950">
                    {Math.round((detail.allocated / Math.max(detail.available, 1)) * 100)}%
                  </p>
                </CardContent>
              </Card>
            </div>
            <div>
              <Label>Utilization trend</Label>
              <Progress
                value={Math.round(
                  (detail.allocated / Math.max(detail.available, 1)) * 100,
                )}
                className="mt-1"
                indicatorClassName={
                  detail.allocated > detail.available
                    ? "bg-red-500"
                    : detail.allocated >= detail.available * 0.8
                      ? "bg-amber-500"
                      : undefined
                }
              />
              <p className="mt-2 text-xs text-slate-500">
                {detail.allocated > detail.available
                  ? "⚠ This resource overallocated — consider rebalancing."
                  : detail.allocated >= detail.available * 0.8
                    ? "⚠ Nearing capacity — reorder soon."
                    : "✓ Healthy allocation level."}
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDetail(null)}>
                Close
              </Button>
              <Button
                variant="danger"
                onClick={() => {
                  deleteResource(detail.id);
                  setDetail(null);
                }}
              >
                <IconTrash className="size-4" />
                Delete resource
              </Button>
            </div>
          </div>
        )}
      </Dialog>
    </>
  );
}
