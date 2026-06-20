"use client";

import { useMemo, useState } from "react";
import { IconPhoto, IconFileDescription, IconPaperclip, IconPlus, IconSearch, IconTrash } from "@tabler/icons-react";
import { projects, teamMembers, type SiteReport, auditLogs as initialLogs, type AuditLog } from "@/lib/mock-data";
import { Avatar, Badge, Button, Card, CardContent, Dialog, Input, Label, Select, Textarea } from "@/components/ui";
import { useStoredReports } from "@/lib/use-stored-reports";

const emptyReport = (): Omit<SiteReport, "id" | "createdAt"> => ({ projectId: "", title: "", type: "update", description: "", status: "open", createdBy: "", attachments: [] });
const eventId = (prefix: string) => `${prefix}${Date.now()}`;
const eventDate = () => new Date();

export function SitesView() {
  const [reports, setReports] = useStoredReports();
  const [query, setQuery] = useState("");
  const [projectId, setProjectId] = useState("all");
  const [form, setForm] = useState(emptyReport());
  const [attachInput, setAttachInput] = useState("");
  const [, setLogs] = useState(initialLogs);

  const filtered = useMemo(() => reports.filter(r => (projectId === "all" || r.projectId === projectId) && r.title.toLowerCase().includes(query.toLowerCase())), [query, projectId, reports]);

  function log(action: AuditLog["action"], entity: string, entityId: string, entityName: string, details: string) {
    const entry: AuditLog = { id: eventId("al"), action, entity, entityId, entityName, performedBy: "Marcus Chen", timestamp: eventDate().toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" }), details };
    setLogs(prev => [entry, ...prev]);
  }

  function resetForm() { setForm(emptyReport()); setAttachInput(""); }
  function addReport() {
    const newReport: SiteReport = { id: eventId("sr"), createdAt: eventDate().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }), ...form };
    setReports(prev => [newReport, ...prev]);
    log("created", "report", newReport.id, form.title, `${form.type === "update" ? "Site update" : "Issue"} report created.`);
    resetForm();
  }
  function deleteReport(id: string) {
    const r = reports.find(x => x.id === id);
    if (r) { setReports(prev => prev.filter(x => x.id !== id)); log("deleted", "report", id, r.title, "Report deleted."); }
  }
  function toggleStatus(id: string) {
    const r = reports.find(x => x.id === id);
    if (r) {
      const newStatus = r.status === "open" ? "resolved" : "open";
      setReports(prev => prev.map(x => x.id === id ? { ...x, status: newStatus } : x));
      log("updated", "report", id, r.title, `Report status changed to ${newStatus}.`);
    }
  }
  function addAttachment() { if (attachInput.trim()) { setForm({ ...form, attachments: [...form.attachments, attachInput.trim()] }); setAttachInput(""); } }

  return <>
    <div className="mb-5 flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-3 sm:flex-row">
      <div className="relative flex-1"><IconSearch className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" /><Input className="pl-9" placeholder="Search reports..." value={query} onChange={e => setQuery(e.target.value)} /></div>
      <Select value={projectId} onChange={e => setProjectId(e.target.value)}><option value="all">All projects</option>{projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</Select>
      <Dialog trigger={<Button><IconPlus className="size-4" />New report</Button>} title="Create site report" description="Log an update or issue with optional attachments.">
        <form className="space-y-4" onSubmit={e => { e.preventDefault(); addReport(); }}>
          <div><Label>Report type</Label><div className="flex gap-2"><button type="button" onClick={() => setForm({ ...form, type: "update" })} className={`flex-1 rounded-lg border px-4 py-3 text-sm font-medium text-center ${form.type === "update" ? "border-orange-400 bg-orange-50 text-orange-700" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}>Update</button><button type="button" onClick={() => setForm({ ...form, type: "issue" })} className={`flex-1 rounded-lg border px-4 py-3 text-sm font-medium text-center ${form.type === "issue" ? "border-orange-400 bg-orange-50 text-orange-700" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}>Issue</button></div></div>
          <div><Label>Title</Label><Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Brief summary" /></div>
          <div><Label>Project</Label><Select value={form.projectId} onChange={e => setForm({ ...form, projectId: e.target.value })}><option value="">Select project</option>{projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</Select></div>
          <div><Label>Description</Label><Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Detailed description of the update or issue..." /></div>
          <div><Label>Attachments</Label><div className="flex gap-2"><Input value={attachInput} onChange={e => setAttachInput(e.target.value)} placeholder="Filename or URL" /><Button type="button" variant="outline" onClick={addAttachment}><IconPaperclip className="size-4" /></Button></div>{form.attachments.length > 0 && <div className="mt-2 space-y-1">{form.attachments.map((a, i) => <div key={i} className="flex items-center gap-2 rounded-md bg-slate-50 px-3 py-1.5 text-xs text-slate-600"><IconFileDescription className="size-3.5" />{a}</div>)}</div>}</div>
          <Button type="submit" className="w-full">Create report</Button>
        </form>
      </Dialog>
    </div>
    <div className="space-y-4">{filtered.map(report => { const project = projects.find(p => p.id === report.projectId); const author = teamMembers.find(m => m.id === report.createdBy); return <Card key={report.id} className="transition-shadow hover:shadow-md"><CardContent><div className="flex items-start justify-between gap-4"><div className="flex-1"><div className="flex items-center gap-2"><Badge>{report.type}</Badge><Badge value={report.status} /><span className="text-xs text-slate-400">{report.createdAt}</span></div><h3 className="mt-3 font-semibold text-slate-950">{report.title}</h3><p className="mt-2 text-sm leading-6 text-slate-600">{report.description}</p><div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-slate-500">{project && <span className="flex items-center gap-1.5"><span className="size-2 rounded-full" style={{ backgroundColor: project.color }} />{project.name}</span>}{author && <span className="flex items-center gap-1.5"><Avatar name={author.name} size="sm" />{author.name}</span>}</div>{report.attachments.length > 0 && <div className="mt-4 flex flex-wrap gap-2">{report.attachments.map((att, i) => <span key={i} className="inline-flex items-center gap-1.5 rounded-md bg-slate-50 px-2.5 py-1 text-xs text-slate-600"><IconPhoto className="size-3.5" />{att}</span>)}</div>}</div><div className="flex flex-col gap-1"><Button variant={report.status === "open" ? "secondary" : "outline"} size="sm" onClick={() => toggleStatus(report.id)}>{report.status === "open" ? "Resolve" : "Reopen"}</Button><Button variant="ghost" size="icon" className="size-8 text-red-500 hover:bg-red-50" onClick={() => deleteReport(report.id)}><IconTrash className="size-3.5" /></Button></div></div></CardContent></Card>})}</div>
    {filtered.length === 0 && <div className="rounded-xl border border-dashed border-slate-300 bg-white py-20 text-center"><p className="font-medium text-slate-800">No reports found</p><p className="mt-1 text-sm text-slate-500">Create a new site report to get started.</p></div>}
  </>;
}
