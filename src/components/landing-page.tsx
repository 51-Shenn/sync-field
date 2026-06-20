"use client";

import Image from "next/image";
import { useState } from "react";
import {
  IconArrowRight,
  IconChartBar,
  IconChevronRight,
  IconCircleCheck,
  IconClipboardCheck,
  IconGasStation,
  IconHelmet,
  IconLayoutDashboard,
  IconLoader2,
  IconMenu2,
  IconShieldCheck,
  IconUsers,
  IconX,
} from "@tabler/icons-react";
import { authClient, signInSocial } from "@/lib/auth-client";
import { SplashScreen } from "@/components/splash-screen";

const capabilities = [
  { icon: IconLayoutDashboard, title: "One operational view", description: "See project health, schedules, budgets, crews, and open issues without chasing updates." },
  { icon: IconClipboardCheck, title: "Field reporting", description: "Capture daily progress and site issues in a consistent workflow built for the field." },
  { icon: IconUsers, title: "Workforce coordination", description: "Know who is available, where crews are assigned, and where capacity is getting tight." },
  { icon: IconGasStation, title: "Resource control", description: "Track equipment, materials, fuel, and budget allocation across your entire portfolio." },
];

const metrics = [
  { label: "Active projects", value: "12", trend: "+1 this month", color: "bg-orange-500" },
  { label: "Tasks due", value: "24", trend: "6 completed", color: "bg-blue-500" },
  { label: "Open issues", value: "3", trend: "Needs attention", color: "bg-violet-500" },
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
    onClick={async () => { setSigningIn(true); await signInSocial(); setSigningIn(false); }}
    disabled={signingIn}
    className={`${compact ? "h-10 px-4 text-sm" : "h-12 px-6"} inline-flex items-center justify-center gap-2 rounded-xl bg-orange-500 font-semibold text-white shadow-lg shadow-orange-500/20 transition hover:bg-orange-600 disabled:opacity-60`}
  >
    {signingIn ? <IconLoader2 className="size-4 animate-spin" /> : null}{signingIn ? "Connecting to Google..." : "Open workspace"}{!signingIn && <IconArrowRight className="size-4" />}
  </button>;
}

function ProductPreview() {
  return <div className="relative mx-auto mt-14 max-w-6xl">
    <div className="absolute -inset-8 -z-10 rounded-[3rem] bg-orange-400/10 blur-3xl" />
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#101d30] shadow-2xl shadow-slate-950/30">
      <div className="flex h-11 items-center gap-2 border-b border-white/10 px-4"><i className="size-2.5 rounded-full bg-red-400" /><i className="size-2.5 rounded-full bg-amber-400" /><i className="size-2.5 rounded-full bg-emerald-400" /><span className="ml-3 text-[10px] font-medium text-slate-500">app.syncfield.co/control-centre</span></div>
      <div className="grid min-h-[430px] md:grid-cols-[190px_1fr]">
        <aside className="hidden border-r border-white/10 bg-[#132238] p-4 md:block">
          <div className="flex items-center gap-2"><Image src="/icon.svg" alt="" width={34} height={34} /><span className="font-bold text-white">Sync<span className="text-orange-400">Field</span></span></div>
          <div className="mt-9 space-y-2 text-xs text-slate-400">
            {[[IconLayoutDashboard,"Control Centre"],[IconClipboardCheck,"Site Reporting"],[IconHelmet,"Projects"],[IconUsers,"Workforce"],[IconGasStation,"Resources"]].map(([Icon,label], index) => { const IconComponent = Icon as typeof IconLayoutDashboard; return <div key={String(label)} className={`flex items-center gap-2.5 rounded-lg px-3 py-2.5 ${index === 0 ? "bg-orange-500 text-white" : ""}`}><IconComponent className="size-4" />{String(label)}</div>; })}
          </div>
        </aside>
        <div className="bg-slate-50">
          <div className="h-12 border-b border-slate-200 bg-white" />
          <div className="p-5 sm:p-7">
            <p className="text-[10px] font-bold uppercase tracking-[.18em] text-orange-600">Command</p>
            <h3 className="mt-1 text-xl font-bold text-slate-950">Control Centre</h3>
            <p className="mt-1 text-xs text-slate-500">Everything happening across your jobsites today.</p>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">{metrics.map(metric => <div key={metric.label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"><i className={`mb-4 block size-8 rounded-lg ${metric.color}`} /><p className="text-2xl font-bold text-slate-950">{metric.value}</p><p className="text-xs font-medium text-slate-600">{metric.label}</p><p className="mt-2 text-[10px] text-slate-400">{metric.trend}</p></div>)}</div>
            <div className="mt-4 grid gap-3 lg:grid-cols-[1.4fr_1fr]">
              <div className="rounded-xl border border-slate-200 bg-white p-4"><div className="flex items-center justify-between"><p className="text-xs font-semibold text-slate-900">Project progress</p><IconChartBar className="size-4 text-slate-400" /></div><div className="mt-5 space-y-4">{[["Harbour Residences",78],["Northbank Offices",61],["Civic Arts Centre",44]].map(([name,value]) => <div key={String(name)}><div className="mb-1.5 flex justify-between text-[10px] text-slate-500"><span>{name}</span><span>{value}%</span></div><div className="h-1.5 rounded-full bg-slate-100"><div className="h-full rounded-full bg-orange-500" style={{width:`${value}%`}} /></div></div>)}</div></div>
              <div className="rounded-xl border border-slate-200 bg-white p-4"><p className="text-xs font-semibold text-slate-900">Today on site</p><div className="mt-4 space-y-3">{["Concrete pour completed","Safety walk signed off","RFI #184 submitted"].map(item => <div key={item} className="flex gap-2 text-[10px] text-slate-500"><IconCircleCheck className="size-3.5 shrink-0 text-emerald-500" />{item}</div>)}</div></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>;
}

export function LandingPage() {
  const [mobileOpen, setMobileOpen] = useState(false);
  return <div className="min-h-screen overflow-hidden bg-[#f8fafc] text-slate-950">
    <header className="fixed inset-x-0 top-0 z-50 border-b border-slate-200/70 bg-white/85 backdrop-blur-xl">
      <nav className="mx-auto flex h-16 max-w-7xl items-center px-5 lg:px-8">
        <a href="#top" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: "smooth" }); }} className="flex items-center gap-2.5"><Image src="/icon.svg" alt="SyncField" width={38} height={38} /><span className="text-lg font-bold tracking-tight text-[#132238]">Sync<span className="text-orange-500">Field</span></span></a>
        <div className="ml-auto hidden items-center gap-7 text-sm font-medium text-slate-600 md:flex"><a href="#platform" className="hover:text-slate-950">Platform</a><a href="#workflow" className="hover:text-slate-950">How it works</a><a href="#security" className="hover:text-slate-950">Security</a><LandingAction compact /></div>
        <button className="ml-auto rounded-lg p-2 text-slate-700 md:hidden" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Toggle navigation">{mobileOpen ? <IconX /> : <IconMenu2 />}</button>
      </nav>
      {mobileOpen && <div className="border-t border-slate-200 bg-white px-5 py-5 md:hidden"><div className="flex flex-col gap-4 text-sm font-medium text-slate-700"><a href="#platform" onClick={() => setMobileOpen(false)}>Platform</a><a href="#workflow" onClick={() => setMobileOpen(false)}>How it works</a><a href="#security" onClick={() => setMobileOpen(false)}>Security</a><LandingAction compact /></div></div>}
    </header>

    <main>
      <section className="relative bg-[#132238] px-5 pb-24 pt-36 text-white lg:px-8 lg:pb-32 lg:pt-44">
        <div className="absolute inset-0 opacity-20 [background-image:linear-gradient(rgba(255,255,255,.06)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.06)_1px,transparent_1px)] [background-size:44px_44px] [mask-image:linear-gradient(to_bottom,black,transparent_85%)]" />
        <div className="absolute left-[12%] top-28 size-72 rounded-full bg-orange-500/10 blur-3xl" />
        <div className="relative mx-auto max-w-7xl text-center">
          <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-orange-400/25 bg-orange-400/10 px-3 py-1.5 text-xs font-semibold text-orange-300"><IconHelmet className="size-3.5" />Built for teams that build</div>
          <h1 className="mx-auto mt-7 max-w-4xl text-4xl font-bold leading-[1.05] tracking-[-.04em] sm:text-6xl lg:text-7xl">Run every jobsite from <span className="text-orange-400">one clear view.</span></h1>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">SyncField brings project reporting, workforce planning, resource tracking, and portfolio oversight into one construction operations workspace.</p>
          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row"><LandingAction /><a href="#platform" className="inline-flex h-12 items-center gap-2 rounded-xl border border-white/15 px-6 font-semibold text-white transition hover:bg-white/10">Explore the platform <IconChevronRight className="size-4" /></a></div>
          <p className="mt-4 text-xs text-slate-500">Secure Google sign-in. No credit card required.</p>
          <ProductPreview />
        </div>
      </section>

      <section id="platform" className="px-5 py-24 lg:px-8 lg:py-32">
        <div className="mx-auto max-w-7xl"><div className="max-w-2xl"><p className="text-xs font-bold uppercase tracking-[.18em] text-orange-600">Connected operations</p><h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 sm:text-5xl">Less chasing. More building.</h2><p className="mt-5 leading-7 text-slate-600">Give office and field teams the same operational picture, so decisions happen with current information.</p></div>
          <div className="mt-14 grid gap-5 md:grid-cols-2">{capabilities.map(({icon:Icon,title,description}) => <article key={title} className="group rounded-2xl border border-slate-200 bg-white p-7 shadow-sm transition hover:-translate-y-1 hover:border-orange-200 hover:shadow-xl hover:shadow-slate-200/60"><div className="flex size-11 items-center justify-center rounded-xl bg-orange-50 text-orange-600 transition group-hover:bg-orange-500 group-hover:text-white"><Icon className="size-5" /></div><h3 className="mt-6 text-lg font-bold">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-600">{description}</p></article>)}</div>
        </div>
      </section>

      <section id="workflow" className="bg-white px-5 py-24 lg:px-8 lg:py-32"><div className="mx-auto grid max-w-7xl gap-14 lg:grid-cols-[.8fr_1.2fr] lg:items-center"><div><p className="text-xs font-bold uppercase tracking-[.18em] text-orange-600">A practical workflow</p><h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-5xl">From site update to portfolio decision.</h2><p className="mt-5 leading-7 text-slate-600">SyncField keeps operational information moving without adding another reporting burden.</p></div><div className="space-y-4">{[["01","Capture from the field","Log progress, issues, photos, and daily activity while details are fresh."],["02","Coordinate the response","Assign crews and resources with clear ownership across every active project."],["03","Act with confidence","See risk, delivery, and budget signals together in the Control Centre."]].map(([number,title,description]) => <div key={number} className="flex gap-5 rounded-2xl border border-slate-200 bg-slate-50 p-6"><span className="text-sm font-bold text-orange-500">{number}</span><div><h3 className="font-bold">{title}</h3><p className="mt-1 text-sm leading-6 text-slate-600">{description}</p></div></div>)}</div></div></section>

      <section id="security" className="px-5 py-24 lg:px-8"><div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-10 rounded-3xl bg-[#132238] p-8 text-white sm:p-12 lg:flex-row lg:items-center"><div className="max-w-2xl"><div className="flex size-12 items-center justify-center rounded-xl bg-orange-500"><IconShieldCheck /></div><h2 className="mt-6 text-3xl font-bold tracking-tight">Your workspace. Your access.</h2><p className="mt-3 leading-7 text-slate-300">Google authentication keeps sign-in simple while SyncField maintains a clear, private workspace for your operating team.</p></div><LandingAction /></div></section>
    </main>

    <footer className="border-t border-slate-200 bg-white px-5 py-8 lg:px-8"><div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 text-xs text-slate-500 sm:flex-row"><div className="flex items-center gap-2"><Image src="/icon.svg" alt="" width={28} height={28} /><span className="font-bold text-slate-800">SyncField</span></div><p>Construction operations, synchronized.</p><p>© 2026 SyncField</p></div></footer>
  </div>;
}
