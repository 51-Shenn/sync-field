"use client";

import Image from "next/image";
import { useState } from "react";
import {
  IconAlertTriangle,
  IconArrowRight,
  IconBell,
  IconBrain,
  IconCalendarClock,
  IconCheck,
  IconChevronRight,
  IconClipboardCheck,
  IconFileReport,
  IconHelmet,
  IconLayoutDashboard,
  IconLoader2,
  IconMenu2,
  IconMessageCircleBolt,
  IconSearch,
  IconShieldCheck,
  IconSparkles,
  IconTrendingUp,
  IconUserCheck,
  IconUsers,
  IconX,
} from "@tabler/icons-react";
import { authClient, signInSocial } from "@/lib/auth-client";
import { SplashScreen } from "@/components/splash-screen";

const modules = [
  {
    icon: IconClipboardCheck,
    title: "Project Task Management",
    description: "Plan work through a clear Project → Task → Subtask hierarchy with ownership, priorities, dependencies, due dates, and progress tracking.",
    details: ["Kanban planning", "PIC assignment", "Dependency tracking"],
  },
  {
    icon: IconFileReport,
    title: "Site Reporting",
    description: "Capture daily progress, task updates, photos, documents, and site issues while details are current and actionable.",
    details: ["Daily reports", "Issue escalation", "Photo and document capture"],
  },
  {
    icon: IconUsers,
    title: "Workforce Management",
    description: "See worker skills, roles, availability, supervisors, and assignments so every task is matched with the right capability.",
    details: ["Skill-based search", "Availability tracking", "Org and workforce views"],
  },
  {
    icon: IconLayoutDashboard,
    title: "Control Centre",
    description: "Monitor project progress, DAG task states, workforce capacity, live alerts, and backend activity across the full portfolio.",
    details: ["Portfolio pulse", "Resource summaries", "Alerts and activity logs"],
  },
];

const metrics = [
  { label: "Active projects", value: "3", trend: "4 total", icon: IconHelmet, colors: "bg-orange-50 text-orange-600" },
  { label: "Open DAG tasks", value: "12", trend: "18 complete", icon: IconCalendarClock, colors: "bg-blue-50 text-blue-600" },
  { label: "Open alerts", value: "3", trend: "needs attention", icon: IconAlertTriangle, colors: "bg-violet-50 text-violet-600" },
  { label: "Available crew", value: "24", trend: "31 technicians", icon: IconUsers, colors: "bg-emerald-50 text-emerald-600" },
];

const impact = [
  "Reduced resource wastage across active projects",
  "Improved workforce utilization and productivity",
  "Lower operational and labor costs",
  "Better visibility into resource allocation",
  "More efficient project execution and profitability",
];

function LandingAction({ compact = false }: { compact?: boolean }) {
  const { data: session, isPending } = authClient.useSession();
  const [signingIn, setSigningIn] = useState(false);
  const [splashing, setSplashing] = useState(false);

  if (isPending) return <span className={`${compact ? "h-10 w-28" : "h-12 w-44"} animate-pulse rounded-xl bg-slate-200`} />;
  if (session?.user) return <>
    <button
      onClick={() => setSplashing(true)}
      className={`${compact ? "h-10 px-4 text-sm" : "h-12 px-6"} inline-flex items-center justify-center gap-2 rounded-xl bg-orange-500 font-semibold text-white shadow-lg shadow-orange-500/20 transition hover:bg-orange-600`}
    >Open workspace <IconArrowRight className="size-4" /></button>
    {splashing && <SplashScreen href="/control-centre" onDone={() => setSplashing(false)} />}
  </>;

  return <button
    onClick={async () => {
      setSigningIn(true);
      try { await signInSocial(); } finally { setSigningIn(false); }
    }}
    disabled={signingIn}
    className={`${compact ? "h-10 px-4 text-sm" : "h-12 px-6"} inline-flex items-center justify-center gap-2 rounded-xl bg-orange-500 font-semibold text-white shadow-lg shadow-orange-500/20 transition hover:bg-orange-600 disabled:opacity-60`}
  >
    {signingIn ? <IconLoader2 className="size-4 animate-spin" /> : null}{signingIn ? "Connecting to Google..." : "Open workspace"}{!signingIn && <IconArrowRight className="size-4" />}
  </button>;
}

function PortfolioPulseMock() {
  return <svg viewBox="0 0 440 132" className="mt-3 h-28 w-full" role="img" aria-label="Planned versus actual project progress chart">
    <defs>
      <linearGradient id="landing-chart-fill" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#f97316" stopOpacity=".22" />
        <stop offset="1" stopColor="#f97316" stopOpacity="0" />
      </linearGradient>
    </defs>
    {[24, 52, 80, 108].map((y) => <line key={y} x1="26" x2="428" y1={y} y2={y} stroke="#e2e8f0" strokeWidth="1" />)}
    <path d="M28 102 C95 90 130 83 188 72 S280 51 330 42 S390 26 426 20" fill="none" stroke="#cbd5e1" strokeWidth="2" strokeDasharray="5 5" />
    <path d="M28 110 C82 98 125 94 188 78 S274 66 330 49 S390 39 426 28 L426 118 L28 118 Z" fill="url(#landing-chart-fill)" />
    <path d="M28 110 C82 98 125 94 188 78 S274 66 330 49 S390 39 426 28" fill="none" stroke="#f97316" strokeWidth="3" strokeLinecap="round" />
    {[[28,110],[108,94],[188,78],[268,66],[346,45],[426,28]].map(([x,y]) => <circle key={`${x}-${y}`} cx={x} cy={y} r="3.5" fill="white" stroke="#f97316" strokeWidth="2" />)}
  </svg>;
}

function ProductPreview() {
  return <div className="relative mx-auto mt-14 max-w-6xl text-left">
    <div className="absolute -inset-8 -z-10 rounded-[3rem] bg-orange-400/10 blur-3xl" />
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#101d30] shadow-2xl shadow-slate-950/30">
      <div className="flex h-11 items-center gap-2 border-b border-white/10 px-4">
        <i className="size-2.5 rounded-full bg-red-400" /><i className="size-2.5 rounded-full bg-amber-400" /><i className="size-2.5 rounded-full bg-emerald-400" />
        <span className="ml-3 text-[10px] font-medium text-slate-500">app.syncfield.co/control-centre</span>
      </div>
      <div className="grid min-h-[590px] md:grid-cols-[190px_1fr]">
        <aside className="hidden border-r border-white/10 bg-[#132238] md:block">
          <div className="flex h-16 items-center gap-2 px-4"><Image src="/icon.svg" alt="" width={36} height={36} /><span className="font-bold text-white">Sync<span className="text-orange-400">Field</span></span></div>
          <p className="mt-4 px-5 text-[8px] font-semibold uppercase tracking-[.16em] text-slate-500">Workspace</p>
          <div className="mt-2 space-y-1 px-3 text-[10px] text-slate-400">
            {[[IconLayoutDashboard,"Control Centre"],[IconFileReport,"Site Reporting"],[IconClipboardCheck,"Project Management"],[IconUsers,"Workforce Management"]].map(([Icon,label], index) => {
              const IconComponent = Icon as typeof IconLayoutDashboard;
              return <div key={String(label)} className={`flex items-center gap-2.5 rounded-lg px-3 py-2.5 ${index === 0 ? "bg-orange-500 text-white shadow-lg shadow-orange-950/10" : ""}`}><IconComponent className="size-3.5" />{String(label)}</div>;
            })}
          </div>
          <div className="mt-[325px] flex items-center gap-2 border-t border-white/5 p-4"><div className="flex size-7 items-center justify-center rounded-full bg-orange-500 text-[8px] font-bold text-white">AM</div><div><p className="text-[9px] font-semibold text-white">Alex Morgan</p><p className="text-[7px] text-slate-500">Operations lead</p></div></div>
        </aside>
        <div className="bg-slate-50">
          <div className="flex h-12 items-center justify-end gap-3 border-b border-slate-200 bg-white px-5">
            <div className="hidden h-7 w-44 items-center gap-2 rounded-md border border-slate-200 px-2 text-[8px] text-slate-400 sm:flex"><IconSearch className="size-3" />Search projects, tasks...</div>
            <div className="relative text-slate-500"><IconBell className="size-4" /><span className="absolute -right-1.5 -top-1.5 flex size-3 items-center justify-center rounded-full bg-orange-500 text-[6px] font-bold text-white">4</span></div>
          </div>
          <div className="p-4 sm:p-6">
            <div>
              <p className="text-[8px] font-bold uppercase tracking-[.16em] text-orange-600">Command</p>
              <h3 className="mt-1 text-lg font-bold text-slate-950">Control Centre</h3>
              <p className="mt-1 text-[9px] text-slate-500">Real-time overview of project health, crew status, budget performance, and open issues.</p>
            </div>
            <div className="mt-4 flex items-end justify-between gap-4">
              <div><p className="text-[8px] font-semibold uppercase tracking-[.14em] text-orange-600">Friday, June 20</p><p className="mt-1 text-sm font-bold text-slate-950">Good morning, <span className="text-orange-600">Alex</span></p><p className="mt-1 text-[8px] text-slate-500">Live project, DAG, workforce, alert, and Telegram pipeline status.</p></div>
              <div className="hidden gap-1.5 sm:flex"><span className="rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-[8px] font-semibold text-slate-600">Refresh</span><span className="rounded-md bg-orange-500 px-2.5 py-1.5 text-[8px] font-semibold text-white">Create report</span></div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2 lg:grid-cols-4">
              {metrics.map(({label,value,trend,icon:Icon,colors}) => <div key={label} className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm"><div className="flex items-start justify-between gap-2"><span className={`flex size-7 items-center justify-center rounded-lg ${colors}`}><Icon className="size-3.5" /></span><span className="text-[7px] font-semibold text-emerald-600">{trend}</span></div><p className="mt-3 text-lg font-bold text-slate-950">{value}</p><p className="mt-0.5 text-[8px] font-medium text-slate-500">{label}</p></div>)}
            </div>
            <div className="mt-3 grid gap-3 lg:grid-cols-[1.6fr_1fr]">
              <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
                <p className="text-[9px] font-semibold text-slate-900">Portfolio pulse</p><p className="mt-0.5 text-[7px] text-slate-400">Planned versus actual progress from project dates and completed DAG nodes.</p>
                <PortfolioPulseMock />
                <div className="flex justify-center gap-4 text-[7px] text-slate-400"><span className="flex items-center gap-1"><i className="size-1.5 rounded-sm bg-orange-500" />Actual</span><span className="flex items-center gap-1"><i className="size-1.5 rounded-sm bg-slate-300" />Planned</span></div>
              </div>
              <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
                <p className="text-[9px] font-semibold text-slate-900">DAG distribution</p><p className="mt-0.5 text-[7px] text-slate-400">All canonical workflow states.</p>
                <div className="mx-auto mt-6 flex size-24 items-center justify-center rounded-full [background:conic-gradient(#10b981_0_42%,#f97316_42%_63%,#3b82f6_63%_79%,#94a3b8_79%_91%,#8b5cf6_91%_100%)]"><div className="flex size-14 flex-col items-center justify-center rounded-full bg-white"><span className="text-lg font-bold text-slate-950">18</span><span className="text-[7px] text-slate-400">completed</span></div></div>
                <div className="mt-5 flex flex-wrap justify-center gap-x-2 gap-y-1 text-[6px] text-slate-400"><span>● Locked</span><span className="text-blue-500">● Ready</span><span className="text-orange-500">● Active</span><span className="text-emerald-500">● Complete</span></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>;
}

export function LandingPage() {
  const [mobileOpen, setMobileOpen] = useState(false);
  return <div id="top" className="min-h-screen overflow-hidden bg-[#f8fafc] text-slate-950">
    <header className="fixed inset-x-0 top-0 z-50 border-b border-slate-200/70 bg-white/85 backdrop-blur-xl">
      <nav className="mx-auto flex h-16 max-w-7xl items-center px-5 lg:px-8">
        <a href="#top" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: "smooth" }); }} className="flex items-center gap-2.5"><Image src="/icon.svg" alt="SyncField" width={38} height={38} /><span className="text-lg font-bold tracking-tight text-[#132238]">Sync<span className="text-orange-500">Field</span></span></a>
        <div className="ml-auto hidden items-center gap-7 text-sm font-medium text-slate-600 md:flex"><a href="#platform" className="hover:text-slate-950">Platform</a><a href="#automation" className="hover:text-slate-950">AI automation</a><a href="#impact" className="hover:text-slate-950">Impact</a><a href="#security" className="hover:text-slate-950">Security</a><LandingAction compact /></div>
        <button className="ml-auto rounded-lg p-2 text-slate-700 md:hidden" onClick={() => setMobileOpen(!mobileOpen)} aria-expanded={mobileOpen} aria-label="Toggle navigation">{mobileOpen ? <IconX /> : <IconMenu2 />}</button>
      </nav>
      {mobileOpen && <div className="border-t border-slate-200 bg-white px-5 py-5 md:hidden"><div className="flex flex-col gap-4 text-sm font-medium text-slate-700"><a href="#platform" onClick={() => setMobileOpen(false)}>Platform</a><a href="#automation" onClick={() => setMobileOpen(false)}>AI automation</a><a href="#impact" onClick={() => setMobileOpen(false)}>Impact</a><a href="#security" onClick={() => setMobileOpen(false)}>Security</a><LandingAction compact /></div></div>}
    </header>

    <main>
      <section className="relative bg-[#132238] px-5 pb-24 pt-36 text-white lg:px-8 lg:pb-32 lg:pt-44">
        <div className="absolute inset-0 opacity-20 [background-image:linear-gradient(rgba(255,255,255,.06)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.06)_1px,transparent_1px)] [background-size:44px_44px] [mask-image:linear-gradient(to_bottom,black,transparent_85%)]" />
        <div className="absolute left-[12%] top-28 size-72 rounded-full bg-orange-500/10 blur-3xl" />
        <div className="relative mx-auto max-w-7xl text-center">
          <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-orange-400/25 bg-orange-400/10 px-3 py-1.5 text-xs font-semibold text-orange-300"><IconHelmet className="size-3.5" />Built for teams that build</div>
          <h1 className="mx-auto mt-7 max-w-4xl text-4xl font-bold leading-[1.05] tracking-[-.04em] sm:text-6xl lg:text-7xl">Run every jobsite from <span className="text-orange-400">one clear view.</span></h1>
          <p className="mx-auto mt-6 max-w-3xl text-base leading-7 text-slate-300 sm:text-lg">SyncField helps construction companies optimize workforce utilization, reduce resource wastage, and improve project efficiency through connected operations and AI-powered decision support.</p>
          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row"><LandingAction /><a href="#platform" className="inline-flex h-12 items-center gap-2 rounded-xl border border-white/15 px-6 font-semibold text-white transition hover:bg-white/10">Explore the platform <IconChevronRight className="size-4" /></a></div>
          <p className="mt-4 text-xs text-slate-500">Secure Google sign-in. No credit card required.</p>
          <ProductPreview />
        </div>
      </section>

      <section className="border-b border-slate-200 bg-white px-5 py-16 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[.75fr_1.25fr] lg:items-center">
          <div><p className="text-xs font-bold uppercase tracking-[.18em] text-orange-600">The challenge</p><h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Manpower waste is a planning problem.</h2></div>
          <div className="grid gap-3 sm:grid-cols-3">{[
            ["Underused crews", "Available workers sit idle while other sites remain short-staffed."],
            ["Poor skill matching", "Tasks are assigned without a current view of skills and availability."],
            ["Late visibility", "Schedule pressure becomes a delay before decision-makers can respond."],
          ].map(([title,description]) => <div key={title} className="rounded-2xl bg-slate-50 p-5"><p className="text-sm font-bold text-slate-900">{title}</p><p className="mt-2 text-xs leading-5 text-slate-500">{description}</p></div>)}</div>
        </div>
      </section>

      <section id="platform" className="px-5 py-24 lg:px-8 lg:py-32">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl"><p className="text-xs font-bold uppercase tracking-[.18em] text-orange-600">Four connected modules</p><h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 sm:text-5xl">Manage the plan, the field, and the workforce together.</h2><p className="mt-5 max-w-2xl leading-7 text-slate-600">Unlike traditional project trackers, SyncField is built around resource efficiency. Every module contributes to a current view of where people are needed and how work is progressing.</p></div>
          <div className="mt-14 grid gap-5 md:grid-cols-2">{modules.map(({icon:Icon,title,description,details}) => <article key={title} className="group rounded-2xl border border-slate-200 bg-white p-7 shadow-sm transition hover:-translate-y-1 hover:border-orange-200 hover:shadow-xl hover:shadow-slate-200/60"><div className="flex size-11 items-center justify-center rounded-xl bg-orange-50 text-orange-600 transition group-hover:bg-orange-500 group-hover:text-white"><Icon className="size-5" /></div><h3 className="mt-6 text-lg font-bold">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-600">{description}</p><div className="mt-5 flex flex-wrap gap-2">{details.map((detail) => <span key={detail} className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold text-slate-600">{detail}</span>)}</div></article>)}</div>
        </div>
      </section>

      <section id="automation" className="bg-white px-5 py-24 lg:px-8 lg:py-32">
        <div className="mx-auto grid max-w-7xl gap-14 lg:grid-cols-[.8fr_1.2fr] lg:items-center">
          <div><div className="flex size-12 items-center justify-center rounded-xl bg-orange-500 text-white"><IconBrain /></div><p className="mt-6 text-xs font-bold uppercase tracking-[.18em] text-orange-600">AI-powered decision support</p><h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-5xl">Move from resource data to the next best action.</h2><p className="mt-5 leading-7 text-slate-600">SyncField does more than report what happened. It helps teams rebalance people, respond to risk, and keep work moving when the plan changes.</p></div>
          <div className="space-y-4">{[
            [IconUserCheck,"Smart Scheduler","Recommends worker assignments by skill and availability, balances resources across tasks, and considers task dependencies when schedules change."],
            [IconSparkles,"Resource Optimization","Surfaces under- and over-utilization, suggests crew reallocation, and highlights opportunities to reduce idle time and duplicated effort."],
            [IconMessageCircleBolt,"AI Auto Messaging","Sends timely alerts for shortages, reassignments, overdue tasks, and issue escalations through system and messaging channels."],
          ].map(([Icon,title,description]) => { const ItemIcon = Icon as typeof IconUserCheck; return <div key={String(title)} className="flex gap-5 rounded-2xl border border-slate-200 bg-slate-50 p-6"><span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-white text-orange-600 shadow-sm"><ItemIcon className="size-5" /></span><div><h3 className="font-bold">{String(title)}</h3><p className="mt-1 text-sm leading-6 text-slate-600">{String(description)}</p></div></div>; })}</div>
        </div>
      </section>

      <section className="px-5 py-24 lg:px-8 lg:py-32">
        <div className="mx-auto max-w-7xl"><div className="mx-auto max-w-3xl text-center"><p className="text-xs font-bold uppercase tracking-[.18em] text-orange-600">A closed operational loop</p><h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-5xl">From project setup to corrective action.</h2></div><div className="mt-14 grid gap-4 md:grid-cols-2 lg:grid-cols-4">{[
          ["01","Plan","Create projects, break work into dependent tasks, and define required skills."],
          ["02","Assign","Match workers to tasks based on capability, availability, and workload."],
          ["03","Monitor","Track site reports, progress, crew allocation, alerts, and schedule health."],
          ["04","Optimize","Review AI recommendations and take action to reduce waste and delay."],
        ].map(([number,title,description]) => <div key={number} className="rounded-2xl border border-slate-200 bg-white p-6"><span className="text-sm font-bold text-orange-500">{number}</span><h3 className="mt-6 font-bold">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-600">{description}</p></div>)}</div></div>
      </section>

      <section id="impact" className="bg-[#132238] px-5 py-24 text-white lg:px-8 lg:py-28">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[.9fr_1.1fr] lg:items-center"><div><div className="flex size-12 items-center justify-center rounded-xl bg-orange-500"><IconTrendingUp /></div><p className="mt-6 text-xs font-bold uppercase tracking-[.18em] text-orange-400">Expected impact</p><h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-5xl">Make every workforce decision count.</h2><p className="mt-5 max-w-xl leading-7 text-slate-300">A clearer view of people, work, and risk helps construction teams use existing resources more effectively and protect project margins.</p></div><div className="grid gap-3 sm:grid-cols-2">{impact.map((item,index) => <div key={item} className={`${index === impact.length - 1 ? "sm:col-span-2" : ""} flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-5`}><IconCheck className="size-5 shrink-0 text-emerald-400" /><p className="text-sm font-medium text-slate-200">{item}</p></div>)}</div></div>
      </section>

      <section id="security" className="px-5 py-24 lg:px-8"><div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-10 rounded-3xl bg-white p-8 shadow-sm ring-1 ring-slate-200 sm:p-12 lg:flex-row lg:items-center"><div className="max-w-2xl"><div className="flex size-12 items-center justify-center rounded-xl bg-orange-500 text-white"><IconShieldCheck /></div><h2 className="mt-6 text-3xl font-bold tracking-tight">Your operation, in one protected workspace.</h2><p className="mt-3 leading-7 text-slate-600">Google authentication keeps sign-in simple while protected routes keep project, workforce, and operational data behind your team’s workspace access.</p></div><LandingAction /></div></section>
    </main>

    <footer className="border-t border-slate-200 bg-white px-5 py-8 lg:px-8"><div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 text-xs text-slate-500 sm:flex-row"><div className="flex items-center gap-2"><Image src="/icon.svg" alt="" width={28} height={28} /><span className="font-bold text-slate-800">SyncField</span></div><p>Construction operations, synchronized.</p><p>© 2026 SyncField</p></div></footer>
  </div>;
}
