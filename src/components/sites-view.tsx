"use client";

import { useMemo, useState } from "react";
import {
  IconAlertTriangle,
  IconClipboardCheck,
  IconEye,
  IconFileDescription,
  IconPaperclip,
  IconPencil,
  IconPhoto,
  IconPlus,
  IconSearch,
  IconTrash,
  IconX,
} from "@tabler/icons-react";
import { useProjects, useTeamMembers, useSiteReports } from "@/lib/use-data";
import { filterSiteReports, summarizeSiteReports } from "@/lib/site-report-data";
import type { SiteReport } from "@/lib/report-types";
import { Avatar, Badge, Button, Card, CardContent, Dialog, Input, Label, Select, Textarea } from "@/components/ui";

type ReportForm = Omit<SiteReport, "id" | "createdAt">;

const emptyReport = (): ReportForm => ({
  projectId: "",
  title: "",
  type: "update",
  description: "",
  status: "open",
  createdBy: "",
  attachments: [],
});

export function SitesView() {
  const { projects } = useProjects();
  const { teamMembers } = useTeamMembers();
  const { reports, createReport: pushReport } = useSiteReports();
  const [query, setQuery] = useState("");
  const [projectId, setProjectId] = useState("all");
  const [type, setType] = useState("all");
  const [status, setStatus] = useState("all");
  const [form, setForm] = useState<ReportForm>(emptyReport());
  const [editing, setEditing] = useState<SiteReport | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [formError, setFormError] = useState("");
  const [attachInput, setAttachInput] = useState("");
  const [detail, setDetail] = useState<SiteReport | null>(null);
  const [pendingDelete, setPendingDelete] = useState<SiteReport | null>(null);

  const projectNames = Object.fromEntries(projects.map((p) => [p.id, p.name]));

  const filtered = useMemo(
    () => filterSiteReports(reports, { query, projectId, type, status }, projectNames),
    [reports, query, projectId, type, status, projectNames],
  );
  const summary = summarizeSiteReports(reports);
  const hasFilters = Boolean(query.trim()) || projectId !== "all" || type !== "all" || status !== "all";

  function resetEditor() {
    setForm(emptyReport());
    setEditing(null);
    setAttachInput("");
    setFormError("");
  }

  function openCreate() {
    resetEditor();
    setEditorOpen(true);
  }

  function openEdit(report: SiteReport) {
    setEditing(report);
    setForm({
      projectId: report.projectId,
      title: report.title,
      type: report.type,
      description: report.description,
      status: report.status,
      createdBy: report.createdBy,
      attachments: [...report.attachments],
    });
    setAttachInput("");
    setFormError("");
    setDetail(null);
    setEditorOpen(true);
  }

  function saveReport() {
    if (!form.title.trim() || !form.projectId || !form.description.trim()) {
      setFormError("Title, project, and description are required.");
      return;
    }
    pushReport(form);
    setEditorOpen(false);
    resetEditor();
  }

  function addAttachment() {
    const attachment = attachInput.trim();
    if (!attachment || form.attachments.includes(attachment)) return;
    setForm({ ...form, attachments: [...form.attachments, attachment] });
    setAttachInput("");
  }

  function removeAttachment(index: number) {
    setForm({ ...form, attachments: form.attachments.filter((_, i) => i !== index) });
  }

  function clearFilters() {
    setQuery("");
    setProjectId("all");
    setType("all");
    setStatus("all");
  }

  return (
    <>
      <section className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard label="Total reports" value={summary.total} icon={<IconFileDescription className="size-5" />} />
        <SummaryCard label="Open issues" value={summary.openIssues} icon={<IconAlertTriangle className="size-5" />} tone="red" />
        <SummaryCard label="Site updates" value={summary.updates} icon={<IconClipboardCheck className="size-5" />} tone="blue" />
        <SummaryCard label="Resolved" value={summary.resolved} icon={<IconClipboardCheck className="size-5" />} tone="green" />
      </section>

      <Card className="mb-5">
        <CardContent className="p-3">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
            <div className="relative min-w-60 flex-1">
              <IconSearch className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <Input className="pl-9 pr-8" placeholder="Search title, description, project, attachment..." value={query} onChange={(e) => setQuery(e.target.value)} />
              {query && <button type="button" aria-label="Clear search" onClick={() => setQuery("")} className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-slate-400 hover:bg-slate-100"><IconX className="size-4" /></button>}
            </div>
            <div className="flex flex-wrap gap-2">
              <Select value={projectId} onChange={(e) => setProjectId(e.target.value)} className="min-w-[180px]"><option value="all">All projects</option>{projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</Select>
              <Select value={type} onChange={(e) => setType(e.target.value)} className="min-w-[130px]"><option value="all">All types</option><option value="update">Updates</option><option value="issue">Issues</option></Select>
              <Select value={status} onChange={(e) => setStatus(e.target.value)} className="min-w-[130px]"><option value="all">All statuses</option><option value="open">Open</option><option value="resolved">Resolved</option></Select>
              {hasFilters && <Button variant="ghost" onClick={clearFilters}><IconX className="size-4" />Clear</Button>}
              <Button onClick={openCreate}><IconPlus className="size-4" />New report</Button>
            </div>
          </div>
          <p className="mt-2 px-1 text-xs text-slate-400">Showing {filtered.length} of {reports.length} reports</p>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {filtered.map((report) => {
          const project = projects.find((p) => p.id === report.projectId);
          const author = teamMembers.find((m) => m.id === report.createdBy);
          return <Card key={report.id} className="transition-shadow hover:shadow-md"><CardContent><div className="flex flex-col gap-5 lg:flex-row lg:items-start"><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><Badge>{report.type}</Badge><Badge value={report.status} /><span className="text-xs text-slate-400">{report.createdAt}</span></div><h3 className="mt-3 font-semibold text-slate-950">{report.title}</h3><p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">{report.description}</p><div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-slate-500">{project && <span className="flex items-center gap-1.5"><span className="size-2 rounded-full" style={{ backgroundColor: project.color }} />{project.name}</span>}{author && <span className="flex items-center gap-1.5"><Avatar name={author.name} size="sm" />{author.name}</span>}{report.attachments.length > 0 && <span className="flex items-center gap-1.5"><IconPaperclip className="size-3.5" />{report.attachments.length} attachment{report.attachments.length === 1 ? "" : "s"}</span>}</div></div><div className="flex shrink-0 flex-wrap gap-1"><Button variant="ghost" size="sm" onClick={() => setDetail(report)}><IconEye className="size-4" />View</Button><Button variant="ghost" size="sm" onClick={() => openEdit(report)}><IconPencil className="size-4" />Edit</Button></div></div></CardContent></Card>;
        })}
      </div>

      {!filtered.length && <div className="rounded-xl border border-dashed border-slate-300 bg-white py-20 text-center"><p className="font-medium text-slate-800">No reports found</p><p className="mt-1 text-sm text-slate-500">{hasFilters ? "Try clearing or changing the filters." : "Create a site update or issue report to get started."}</p>{hasFilters ? <Button variant="ghost" className="mt-3" onClick={clearFilters}>Clear filters</Button> : <Button className="mt-4" onClick={openCreate}><IconPlus className="size-4" />New report</Button>}</div>}

      <Dialog open={editorOpen} onOpenChange={(open) => { setEditorOpen(open); if (!open) resetEditor(); }} title={editing ? "Edit site report" : "Create site report"} description="Log an update or issue with optional attachments.">
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); saveReport(); }}>
          <div><Label>Report type</Label><div className="grid grid-cols-2 gap-2"><Button type="button" variant={form.type === "update" ? "secondary" : "outline"} onClick={() => setForm({ ...form, type: "update" })}>Site update</Button><Button type="button" variant={form.type === "issue" ? "secondary" : "outline"} onClick={() => setForm({ ...form, type: "issue" })}>Issue</Button></div></div>
          <div><Label>Title</Label><Input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Brief summary" /></div>
          <div className="grid gap-4 sm:grid-cols-2"><div><Label>Project</Label><Select value={form.projectId} onChange={(e) => setForm({ ...form, projectId: e.target.value })}><option value="">Select project</option>{projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</Select></div><div><Label>Status</Label><Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as SiteReport["status"] })}><option value="open">Open</option><option value="resolved">Resolved</option></Select></div></div>
          <div><Label>Description</Label><Textarea required value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Detailed description of the update or issue..." /></div>
          <div><Label>Attachments</Label><div className="flex gap-2"><Input value={attachInput} onChange={(e) => setAttachInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addAttachment(); } }} placeholder="Filename or URL" /><Button type="button" variant="outline" onClick={addAttachment} aria-label="Add attachment"><IconPaperclip className="size-4" /></Button></div>{form.attachments.length > 0 && <div className="mt-2 space-y-1">{form.attachments.map((a, i) => <div key={`${a}-${i}`} className="flex items-center gap-2 rounded-md bg-slate-50 px-3 py-2 text-xs text-slate-600"><IconFileDescription className="size-3.5" /><span className="min-w-0 flex-1 truncate">{a}</span><button type="button" aria-label={`Remove ${a}`} onClick={() => removeAttachment(i)} className="rounded p-0.5 text-slate-400 hover:bg-slate-200 hover:text-red-600"><IconX className="size-3.5" /></button></div>)}</div>}</div>
          {formError && <p className="text-sm font-medium text-red-600">{formError}</p>}
          <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setEditorOpen(false)}>Cancel</Button><Button type="submit">{editing ? "Save changes" : "Create report"}</Button></div>
        </form>
      </Dialog>

      <Dialog open={Boolean(detail)} onOpenChange={(open) => { if (!open) setDetail(null); }} title={detail?.title ?? "Report details"} description={detail ? `${projectNames[detail.projectId] ?? "Unknown project"} · ${detail.createdAt}` : undefined}>
        {detail && <div className="space-y-5"><div className="flex flex-wrap gap-2"><Badge>{detail.type}</Badge><Badge value={detail.status} /></div><p className="text-sm leading-6 text-slate-600">{detail.description}</p>{detail.attachments.length > 0 && <div><Label>Attachments</Label><div className="space-y-2">{detail.attachments.map((a, i) => <div key={`${a}-${i}`} className="flex items-center gap-2 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-sm text-slate-600"><IconPhoto className="size-4 text-orange-500" /><span className="min-w-0 flex-1 truncate">{a}</span></div>)}</div></div>}<div className="flex flex-wrap justify-end gap-2"><Button variant="outline" onClick={() => setDetail(null)}>Close</Button><Button variant="secondary" onClick={() => openEdit(detail)}><IconPencil className="size-4" />Edit</Button></div></div>}
      </Dialog>
    </>
  );
}

function SummaryCard({ label, value, icon, tone = "orange" }: { label: string; value: number; icon: React.ReactNode; tone?: "orange" | "red" | "blue" | "green" }) {
  const colors = { orange: "bg-orange-50 text-orange-600", red: "bg-red-50 text-red-600", blue: "bg-blue-50 text-blue-600", green: "bg-emerald-50 text-emerald-600" };
  return <Card><CardContent><div className="flex items-center justify-between"><div><p className="text-xs text-slate-500">{label}</p><p className="mt-2 text-2xl font-bold text-slate-950">{value}</p></div><span className={`flex size-10 items-center justify-center rounded-xl ${colors[tone]}`}>{icon}</span></div></CardContent></Card>;
}
