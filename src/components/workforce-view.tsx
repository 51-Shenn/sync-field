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
import { useProjects, useTeamMembers } from "@/lib/use-data";
import type { TeamMember } from "@/lib/team-types";
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
  const { projects, loading: projectsLoading } = useProjects();
  const { teamMembers, loading: membersLoading } = useTeamMembers();
  const loading = projectsLoading || membersLoading;
  const [query, setQuery] = useState("");
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [editMember, setEditMember] = useState<TeamMember | null>(null);
  const [form, setForm] = useState(emptyWorker());
  const [editing, setEditing] = useState(false);
  const [viewMode, setViewMode] = useState<"cards" | "orgchart">("cards");
  const [dialogOpen, setDialogOpen] = useState(false);

  function clearAllFilters() {
    setQuery("");
    setSelectedRoles([]);
    setSelectedProjects([]);
    setStatusFilter("all");
  }

  const roles = [...new Set(teamMembers.map((m) => m.role))];
  const roleOptions = useMemo(
    () => roles.map((r) => ({ value: r, label: r })),
    [roles],
  );
  const projectOptions = useMemo(
    () => projects.map((p) => ({ value: p.id, label: p.name })),
    [projects],
  );

  const filtered = useMemo(
    () =>
      teamMembers.filter(
        (m) =>
          (selectedRoles.length === 0 || selectedRoles.includes(m.role)) &&
          (selectedProjects.length === 0 ||
            m.projectIds.some((id) => selectedProjects.includes(id))) &&
          (statusFilter === "all" || m.status === statusFilter) &&
          `${m.name} ${m.role}`.toLowerCase().includes(query.toLowerCase()),
      ),
    [query, selectedRoles, selectedProjects, statusFilter, teamMembers],
  );

  const orgChartData = useMemo<OrgChartNode[]>(() => {
    const matchingIds = new Set(
      teamMembers
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

    const toNode = (m: TeamMember) => ({
      id: m.id,
      parentId: m.managerId ?? null,
      name: m.name,
      role: m.role,
      email: m.email,
      phone: m.phone,
      status: m.status,
      avatarUrl: m.avatarUrl,
      projectIds: m.projectIds,
    });

    const build = (items: TeamMember[]) => {
      const nodes = items.map(toNode);
      const roots = nodes.filter((n) => n.parentId === null);
      if (roots.length <= 1) return nodes;
      const rootId = "__org_root__";
      nodes.push({
        id: rootId,
        parentId: null,
        name: "Organization",
        role: "",
        email: "",
        phone: "",
        status: "active",
        avatarUrl: "",
        projectIds: [],
      });
      roots.forEach((r) => (r.parentId = rootId));
      return nodes;
    };

    if (
      selectedRoles.length === 0 &&
      selectedProjects.length === 0 &&
      statusFilter === "all" &&
      !query
    ) {
      return build(teamMembers);
    }

    const includeIds = new Set(matchingIds);
    const memberMap = new Map(teamMembers.map((m) => [m.id, m]));
    matchingIds.forEach((id) => {
      let current = memberMap.get(id);
      while (current?.managerId) {
        includeIds.add(current.managerId);
        current = memberMap.get(current.managerId);
      }
    });

    return build(teamMembers.filter((m) => includeIds.has(m.id)));
  }, [teamMembers, query, selectedRoles, selectedProjects, statusFilter]);

  function resetForm() {
    setForm(emptyWorker());
    setEditMember(null);
    setEditing(false);
    setDialogOpen(false);
  }
  function openAdd() {
    setForm(emptyWorker());
    setEditMember(null);
    setEditing(false);
    setDialogOpen(true);
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
    resetForm();
  }
  function deleteWorker(_id: string) {
    if (editMember?.id === _id) resetForm();
  }

  function handleOrgNodeClick(node: OrgChartNode) {
    const member = teamMembers.find((m) => m.id === node.id);
    if (member) openEdit(member);
  }

  const statusOptions = [
    { value: "all", label: "All Statuses" },
    { value: "active", label: "Active" },
    { value: "on_leave", label: "On leave" },
  ];

  if (loading) return <Card className="p-16 text-center text-sm text-slate-500">Loading workforce data…</Card>;

  return (
    <>
      <div className="flex flex-wrap items-center gap-3 mb-5 xl:flex-nowrap">
        <div className="relative min-w-[180px] flex-1 sm:w-[200px]">
          <IconSearch className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <Input
            className="pl-9" 
            placeholder="Search workers..."
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
        <MultiSelect
          options={roleOptions}
          selected={selectedRoles}
          onChange={setSelectedRoles}
          placeholder="All Roles"
          className="sm:min-w-[150px]"
        />
        <MultiSelect
          options={projectOptions}
          selected={selectedProjects}
          onChange={setSelectedProjects}
          placeholder="All Projects"
          className="sm:min-w-[170px]"
        />
        <Select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="!w-[140px] shrink-0"
        >
          {statusOptions.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </Select>
        {(query || selectedRoles.length > 0 || selectedProjects.length > 0 || statusFilter !== "all") && (
          <Button variant="ghost" onClick={clearAllFilters}>
            <IconX className="size-4" />Clear
          </Button>
        )}
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
        <Button onClick={openAdd}>
          <IconPlus className="size-4" />
          Add worker
        </Button>
        <Dialog
          open={dialogOpen}
          onOpenChange={(o) => {
            setDialogOpen(o);
            if (!o) resetForm();
          }}
          title={editing ? "Edit Worker Profile" : "Add worker profile"}
          description={editing ? "Update worker details." : "Enter worker details and project assignments."}
          onInteractOutside={(e) => {
            const target = e.target as HTMLElement;
            if (target.closest('[role="listbox"]') || target.closest('[role="option"]')) {
              e.preventDefault();
            }
          }}
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
            placeholder="Full Name"
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
          placeholder="+601234567890"
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
        <Label>Assign to project</Label>
        <Select
          value={form.projectIds[0] ?? ""}
          onChange={(e) =>
            setForm({
              ...form,
              projectIds: e.target.value ? [e.target.value] : [],
            })
          }
        >
          <option value="">Unassigned</option>
          {projectOptions.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </Select>
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
