"use client";

import { useMemo, useState } from "react";
import {
  IconLayoutGrid,
  IconMail,
  IconPhone,
  IconPlus,
  IconSearch,
  IconTrash,
  IconPencil,
  IconX,
  IconHierarchy,
} from "@tabler/icons-react";
import {
  projects,
  teamMembers as mockMembers,
  type TeamMember,
  auditLogs as initialLogs,
  type AuditLog,
} from "@/lib/mock-data";
import {
  Avatar,
  Badge,
  Button,
  Card,
  CardContent,
  Dialog,
  Input,
  Label,
  MultiSelect,
  Select,
} from "@/components/ui";
import { OrgChart, type OrgChartNode } from "@/components/org-chart";

const emptyWorker = (): Omit<TeamMember, "id"> => ({
  name: "",
  role: "",
  email: "",
  phone: "",
  avatarUrl: "",
  status: "active",
  projectIds: [],
});

export function WorkforceView() {
  const [members, setMembers] = useState(mockMembers);
  const [query, setQuery] = useState("");
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [editMember, setEditMember] = useState<TeamMember | null>(null);
  const [form, setForm] = useState(emptyWorker());
  const [editing, setEditing] = useState(false);
  const [viewMode, setViewMode] = useState<"cards" | "orgchart">("cards");
  const [logs, setLogs] = useState(initialLogs);
  const [dialogOpen, setDialogOpen] = useState(false);

  const roles = [...new Set(members.map((m) => m.role))];
  const roleOptions = useMemo(
    () => roles.map((r) => ({ value: r, label: r })),
    [roles],
  );
  const projectOptions = useMemo(
    () => projects.map((p) => ({ value: p.id, label: p.name })),
    [],
  );

  const filtered = useMemo(
    () =>
      members.filter(
        (m) =>
          (selectedRoles.length === 0 || selectedRoles.includes(m.role)) &&
          (selectedProjects.length === 0 ||
            m.projectIds.some((id) => selectedProjects.includes(id))) &&
          (statusFilter === "all" || m.status === statusFilter) &&
          `${m.name} ${m.role}`.toLowerCase().includes(query.toLowerCase()),
      ),
    [query, selectedRoles, selectedProjects, statusFilter, members],
  );

  const orgChartData = useMemo<OrgChartNode[]>(() => {
    const matchingIds = new Set(
      members
        .filter(
          (m) =>
            (selectedRoles.length === 0 || selectedRoles.includes(m.role)) &&
            (selectedProjects.length === 0 ||
              m.projectIds.some((id) => selectedProjects.includes(id))) &&
            (statusFilter === "all" || m.status === statusFilter) &&
            `${m.name} ${m.role}`.toLowerCase().includes(query.toLowerCase()),
        )
        .map((m) => m.id),
    );

    if (
      selectedRoles.length === 0 &&
      selectedProjects.length === 0 &&
      statusFilter === "all" &&
      !query
    ) {
      return members.map((m) => ({
        id: m.id,
        parentId: m.managerId ?? null,
        name: m.name,
        role: m.role,
        email: m.email,
        phone: m.phone,
        status: m.status,
        avatarUrl: m.avatarUrl,
        projectIds: m.projectIds,
      }));
    }

    const includeIds = new Set(matchingIds);
    const memberMap = new Map(members.map((m) => [m.id, m]));
    matchingIds.forEach((id) => {
      let current = memberMap.get(id);
      while (current?.managerId) {
        includeIds.add(current.managerId);
        current = memberMap.get(current.managerId);
      }
    });

    return members
      .filter((m) => includeIds.has(m.id))
      .map((m) => ({
        id: m.id,
        parentId: m.managerId ?? null,
        name: m.name,
        role: m.role,
        email: m.email,
        phone: m.phone,
        status: m.status,
        avatarUrl: m.avatarUrl,
        projectIds: m.projectIds,
      }));
  }, [members, query, selectedRoles, selectedProjects, statusFilter]);

  function log(
    action: AuditLog["action"],
    entity: string,
    entityId: string,
    entityName: string,
    details: string,
  ) {
    const entry: AuditLog = {
      id: `al${Date.now()}`,
      action,
      entity,
      entityId,
      entityName,
      performedBy: "Marcus Chen",
      timestamp: new Date().toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
      details,
    };
    setLogs((prev) => [entry, ...prev]);
  }

  function resetForm() {
    setForm(emptyWorker());
    setEditMember(null);
    setEditing(false);
    setDialogOpen(false);
  }
  function openEdit(member: TeamMember) {
    setEditMember(member);
    setForm({
      name: member.name,
      role: member.role,
      email: member.email,
      phone: member.phone,
      avatarUrl: member.avatarUrl,
      status: member.status,
      projectIds: [...member.projectIds],
    });
    setEditing(true);
    setDialogOpen(true);
  }
  function saveWorker() {
    if (editing && editMember) {
      setMembers((prev) =>
        prev.map((m) => (m.id === editMember.id ? { ...m, ...form } : m)),
      );
      log(
        "updated",
        "worker",
        editMember.id,
        form.name,
        "Worker profile updated.",
      );
    } else {
      const newMember: TeamMember = { id: `tm${Date.now()}`, ...form };
      setMembers((prev) => [...prev, newMember]);
      log(
        "created",
        "worker",
        newMember.id,
        form.name,
        "New worker added to workforce.",
      );
    }
    resetForm();
  }
  function deleteWorker(id: string) {
    const w = members.find((m) => m.id === id);
    if (w) {
      setMembers((prev) => prev.filter((m) => m.id !== id));
      log("deleted", "worker", id, w.name, "Worker removed from workforce.");
    }
    if (editMember?.id === id) resetForm();
  }

  function handleOrgNodeClick(node: OrgChartNode) {
    const member = members.find((m) => m.id === node.id);
    if (member) openEdit(member);
  }

  const statusOptions = [
    { value: "all", label: "All Statuses" },
    { value: "active", label: "Active" },
    { value: "on_leave", label: "On leave" },
  ];

  return (
    <>
      <div className="flex flex-col gap-3 mb-5">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <IconSearch className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <Input
              className="pl-9"
              placeholder="Search workers by name or role..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-0.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
              >
                <IconX className="size-4" />
              </button>
            )}
          </div>
          <Dialog
            trigger={
              <Button>
                <IconPlus className="size-4" />
                Add worker
              </Button>
            }
            title="Add worker profile"
            description="Enter worker details and project assignments."
          >
            <WorkerForm
              form={form}
              setForm={setForm}
              onSave={saveWorker}
              onCancel={resetForm}
              editing={false}
              projectOptions={projectOptions}
            />
          </Dialog>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <MultiSelect
            options={roleOptions}
            selected={selectedRoles}
            onChange={setSelectedRoles}
            placeholder="All Roles"
            className="sm:min-w-[180px]"
          />
          <MultiSelect
            options={projectOptions}
            selected={selectedProjects}
            onChange={setSelectedProjects}
            placeholder="All Projects"
            className="sm:min-w-[200px]"
          />
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="sm:min-w-[150px]"
          >
            {statusOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
          <div className="flex rounded-lg border border-slate-200 p-1">
            <Button
              onClick={() => setViewMode("cards")}
              variant={viewMode === "cards" ? "secondary" : "ghost"}
              size="icon"
              className="size-8"
              title="Cards"
            >
              <IconLayoutGrid className="size-6" />
            </Button>
            <Button
              onClick={() => setViewMode("orgchart")}
              variant={viewMode === "orgchart" ? "secondary" : "ghost"}
              size="icon"
              className="size-8"
              title="Organization Chart"
            >
              <IconHierarchy className="size-6" />
            </Button>
          </div>
        </div>
      </div>

      {viewMode === "orgchart" ? (
        <OrgChart
          data={orgChartData}
          onNodeClick={handleOrgNodeClick}
          searchQuery={query}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {filtered.map((member) => (
            <Card key={member.id} className="transition-shadow hover:shadow-md">
              <CardContent>
                <div className="flex items-start justify-between">
                  <Avatar name={member.name} size="xl" />
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8"
                      onClick={() => openEdit(member)}
                    >
                      <IconPencil className="size-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 text-red-500 hover:bg-red-50 hover:text-red-700"
                      onClick={() => deleteWorker(member.id)}
                    >
                      <IconTrash className="size-3.5" />
                    </Button>
                  </div>
                </div>
                <h3 className="mt-4 font-semibold text-slate-950">
                  {member.name}
                </h3>
                <p className="mt-1 text-sm text-slate-500">{member.role}</p>
                <div className="mt-4 space-y-2 border-t border-slate-100 pt-4 text-xs text-slate-500">
                  <p className="flex items-center gap-2">
                    <IconMail className="size-3.5" />
                    {member.email}
                  </p>
                  <p className="flex items-center gap-2">
                    <IconPhone className="size-3.5" />
                    {member.phone}
                  </p>
                  <p className="flex items-center gap-2">
                    <Badge value={member.status} />
                  </p>
                </div>
                <div className="mt-4 flex flex-wrap gap-1">
                  {member.projectIds.map((id) => (
                    <Badge key={id}>
                      {projects.find((p) => p.id === id)?.name.split(" ")[0]}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      {viewMode === "cards" && filtered.length === 0 && (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white py-20 text-center">
          <p className="font-medium text-slate-800">No workers found</p>
          <p className="mt-1 text-sm text-slate-500">
            Try adjusting your filters.
          </p>
        </div>
      )}
      {viewMode === "orgchart" && orgChartData.length === 0 && (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white py-20 text-center">
          <p className="font-medium text-slate-800">
            No workers match your filters
          </p>
          <p className="mt-1 text-sm text-slate-500">
            Try adjusting your filters.
          </p>
        </div>
      )}

      <Dialog
        open={dialogOpen}
        onOpenChange={(o) => {
          setDialogOpen(o);
          if (!o) resetForm();
        }}
        title="Edit Worker Profile"
        description="Update worker details."
      >
        <WorkerForm
          form={form}
          setForm={setForm}
          onSave={saveWorker}
          onCancel={resetForm}
          editing={!!editMember}
          projectOptions={projectOptions}
        />
      </Dialog>
    </>
  );
}

function WorkerForm({
  form,
  setForm,
  onSave,
  onCancel,
  editing,
  projectOptions,
}: {
  form: Omit<TeamMember, "id">;
  setForm: (f: Omit<TeamMember, "id">) => void;
  onSave: () => void;
  onCancel: () => void;
  editing: boolean;
  projectOptions: { value: string; label: string }[];
}) {
  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        onSave();
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label>Full name</Label>
          <Input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Full name"
          />
        </div>
        <div>
          <Label>Role</Label>
          <Input
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
            placeholder="e.g. Electrician"
          />
        </div>
      </div>
      <div>
        <Label>Email</Label>
        <Input
          type="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          placeholder="name@company.com"
        />
      </div>
      <div>
        <Label>Phone</Label>
        <Input
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
          placeholder="(555) 000-0000"
        />
      </div>
      <div>
        <Label>Status</Label>
        <Select
          value={form.status}
          onChange={(e) =>
            setForm({
              ...form,
              status: e.target.value as "active" | "on_leave",
            })
          }
        >
          <option value="active">Active</option>
          <option value="on_leave">On leave</option>
        </Select>
      </div>
      <div>
        <Label>Assign to project(s)</Label>
        <MultiSelect
          options={projectOptions}
          selected={form.projectIds}
          onChange={(ids) => setForm({ ...form, projectIds: ids })}
          placeholder="Select projects..."
        />
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="outline" type="button" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">{editing ? "Save changes" : "Add worker"}</Button>
      </div>
    </form>
  );
}
