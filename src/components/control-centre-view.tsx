"use client";

import { useMemo, useState } from "react";
import { IconCalendarClock, IconClipboardCheck, IconHelmet, IconDots, IconAlertTriangle, IconUsers } from "@tabler/icons-react";
import { activities, auditLogs as initialLogs, projects, siteReports, tasks, teamMembers } from "@/lib/mock-data";
import { Avatar, Badge, Button, Card, CardContent, Progress } from "@/components/ui";
import { StatCard } from "@/components/page-elements";

export function ControlCentreView() {
  const [logs, setLogs] = useState(initialLogs);
  const openIssues = siteReports.filter(r => r.status === "open").length;
  const activeProjects = projects.filter(p => p.status === "in_progress").length;
  const totalCrew = teamMembers.filter(m => m.status === "active").length;
  const pendingTasks = tasks.filter(t => t.status !== "done").length;
  const active = projects.filter(p => p.status === "in_progress");

  return <>
    <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div>
        <p className="mb-1 text-xs font-semibold uppercase tracking-[.15em] text-orange-600">Friday, June 20</p>
        <h2 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">Good morning, Marcus</h2>
        <p className="mt-1 max-w-2xl text-sm text-slate-500">Here&apos;s what&apos;s happening across your jobsites today.</p>
      </div>
      <Button><IconClipboardCheck className="size-4" />Create report</Button>
    </div>

    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard label="Active projects" value={String(activeProjects)} trend="+1 this month" icon={<IconHelmet className="size-5" />} />
      <StatCard label="Tasks due this week" value={String(pendingTasks)} trend="6 completed" icon={<IconCalendarClock className="size-5" />} accent="blue" />
      <StatCard label="Open issues" value={String(openIssues)} trend={openIssues > 0 ? "needs attention" : "all clear"} icon={<IconAlertTriangle className="size-5" />} accent={openIssues > 0 ? "violet" : "emerald"} />
      <StatCard label="Crew on site" value={String(totalCrew)} trend="active today" icon={<IconUsers className="size-5" />} accent="emerald" />
    </section>

    <section className="mt-6 grid gap-6 xl:grid-cols-[1.5fr_1fr]">
      <Card>
        <div className="p-5 pb-2">
          <h3 className="font-semibold text-slate-950">Project progress</h3>
          <p className="mt-1 text-xs text-slate-500">Live progress across active sites</p>
        </div>
        <CardContent className="space-y-5 pt-3">
          {active.map(project => (
            <div key={project.id} className="group grid gap-3 rounded-xl border border-slate-100 p-4 transition-colors hover:bg-slate-50/70 sm:grid-cols-[1fr_150px_44px] sm:items-center">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-lg text-xs font-bold text-white" style={{ backgroundColor: project.color }}>
                  {project.name.split(" ").map(n => n[0]).join("")}
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">{project.name}</p>
                  <p className="mt-0.5 text-xs text-slate-500">{project.client} &middot; Due {project.endDate}</p>
                </div>
              </div>
              <div>
                <div className="mb-1.5 flex justify-between text-[11px] text-slate-500">
                  <span>{project.progress}% complete</span>
                </div>
                <Progress value={project.progress} />
              </div>
              <Button variant="ghost" size="icon" className="hidden sm:flex"><IconDots className="size-4" /></Button>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <div className="p-5 pb-2">
          <h3 className="font-semibold text-slate-950">Upcoming deadlines</h3>
          <p className="mt-1 text-xs text-slate-500">Next 10 days</p>
        </div>
        <CardContent className="space-y-1 pt-3">
          {tasks.filter(t => t.status !== "done").slice(0, 6).map((task, i) => {
            const project = projects.find(p => p.id === task.projectId)!;
            return (
              <div key={task.id} className="flex gap-3 rounded-lg px-2 py-3 hover:bg-slate-50">
                <div className={`flex size-10 shrink-0 flex-col items-center justify-center rounded-lg ${i < 2 ? "bg-orange-50 text-orange-700" : "bg-slate-100 text-slate-600"}`}>
                  <span className="text-[9px] font-bold uppercase">Jun</span>
                  <span className="text-sm font-bold">{task.dueDate.split(" ")[1]}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-900">{task.title}</p>
                  <p className="mt-1 truncate text-xs text-slate-500">
                    <i className="mr-1.5 inline-block size-2 rounded-full" style={{ backgroundColor: project.color }} />
                    {project.name}
                  </p>
                </div>
                <Badge value={task.priority} />
              </div>
            );
          })}
        </CardContent>
      </Card>
    </section>

    <section className="mt-6 grid gap-6 xl:grid-cols-[1fr_1fr]">
      <Card>
        <div className="p-5 pb-2">
          <h3 className="font-semibold text-slate-950">Recent activity</h3>
          <p className="mt-1 text-xs text-slate-500">Updates from your team</p>
        </div>
        <CardContent className="pt-3">
          {activities.map((item, i) => (
            <div key={i} className="relative flex gap-3 pb-5 last:pb-0">
              <div className="absolute bottom-0 left-[17px] top-9 w-px bg-slate-100 last:hidden" />
              <Avatar name={item.person + " Team"} />
              <div className="pt-0.5 text-sm leading-5 text-slate-600">
                <span className="font-semibold text-slate-900">{item.person}</span> {item.action} <span className="font-medium text-slate-800">{item.target}</span>
                <p className="mt-1 text-[11px] text-slate-400">{item.time}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <div className="p-5 pb-2">
          <h3 className="font-semibold text-slate-950">Audit trail</h3>
          <p className="mt-1 text-xs text-slate-500">Recent CRUD actions across the platform</p>
        </div>
        <CardContent className="space-y-2 pt-3">
          {logs.slice(0, 8).map(log => (
            <div key={log.id} className="flex items-start gap-3 rounded-lg border border-slate-100 p-2.5">
              <div className={`mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white ${log.action === "created" ? "bg-emerald-500" : log.action === "deleted" ? "bg-red-500" : "bg-orange-500"}`}>
                {log.action === "created" ? "+" : log.action === "deleted" ? "–" : "~"}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-slate-900">
                  <span className="capitalize">{log.action}</span> {log.entity} <span className="font-normal text-slate-600">&ldquo;{log.entityName}&rdquo;</span>
                </p>
                <p className="mt-0.5 text-[10px] text-slate-400">{log.details}</p>
                <p className="mt-0.5 text-[10px] text-slate-400">{log.performedBy} &middot; {log.timestamp}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </section>
  </>;
}
