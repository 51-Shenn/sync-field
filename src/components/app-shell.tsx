"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, BriefcaseBusiness, ChevronDown, ChevronsLeft, ChevronsRight, Fuel, LayoutDashboard, Menu, Monitor, Search, Users, X } from "lucide-react";
import { GoogleSignInButton } from "@/components/google-sign-in-button";
import { Avatar, Badge, Button, Input, Skeleton } from "@/components/ui";
import { authClient } from "@/lib/auth-client";
import { projects } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

const nav = [
  { href:"/control-centre", label:"Control Centre", icon:LayoutDashboard },
  { href:"/sites", label:"Site Reporting", icon:Monitor },
  { href:"/projects", label:"Project Management", icon:BriefcaseBusiness },
  { href:"/workforce", label:"Workforce Management", icon:Users },
  { href:"/resources", label:"Resource Management", icon:Fuel },
];
const titles: Record<string,string> = { "/":"Control Centre", "/control-centre":"Control Centre", "/sites":"Site Reporting", "/projects":"Project Management", "/workforce":"Workforce Management", "/resources":"Resource Management" };

function Brand({ collapsed = false }: { collapsed?: boolean }) {
  return <Link href="/" className="flex h-16 items-center gap-2.5 overflow-hidden px-3">
    <Image src="/icon.svg" alt="SyncField" width={40} height={40} className="size-10 shrink-0 object-contain" />
    {!collapsed && <span className="whitespace-nowrap text-lg font-bold tracking-tight text-white">Sync<span className="text-orange-400">Field</span></span>}
  </Link>;
}

function SidebarAccount({ collapsed }: { collapsed: boolean }) {
  const { data: session, isPending } = authClient.useSession();

  if (isPending) return <div className="border-t border-white/8 p-3"><Skeleton className={cn("h-11 bg-white/10", collapsed ? "w-11" : "w-full")} /></div>;
  if (!session?.user) return <div className="border-t border-white/8 p-3"><GoogleSignInButton compact={collapsed} /></div>;

  const userName = session.user.name || session.user.email || "Account";
  return <div className="border-t border-white/8 p-3">
    <details className="group relative">
      <summary className={cn("flex cursor-pointer list-none items-center gap-3 rounded-lg p-2 hover:bg-white/7", collapsed && "justify-center")}>
        <Avatar name={userName} />
        {!collapsed && <><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-white">{userName}</p><p className="truncate text-xs text-slate-400">{session.user.email}</p></div><ChevronDown className="size-4 transition-transform group-open:rotate-180" /></>}
      </summary>
      <div className="absolute bottom-full left-0 mb-2 w-48 rounded-lg border border-slate-200 bg-white p-1 text-sm text-slate-700 shadow-xl">
        <button className="w-full rounded-md px-3 py-2 text-left hover:bg-slate-50">Profile</button>
        <Link href="/settings" className="block rounded-md px-3 py-2 hover:bg-slate-50">Settings</Link>
        <button onClick={() => authClient.signOut()} className="w-full rounded-md px-3 py-2 text-left text-red-600 hover:bg-red-50">Log out</button>
      </div>
    </details>
  </div>;
}

function SidebarContent({ collapsed, closeMobile }: { collapsed: boolean; closeMobile?: () => void }) {
  const pathname = usePathname();
  return <div className="flex h-full flex-col bg-[#132238] text-slate-300">
    <Brand collapsed={collapsed} />
    <div className="px-3 py-3">
      {!collapsed && <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[.16em] text-slate-500">Workspace</p>}
      <nav className="space-y-1">{nav.map(({ href, label, icon: Icon }) => {
        const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
        return <Link href={href} onClick={closeMobile} key={href} title={collapsed ? label : undefined} className={cn("group flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors", active ? "bg-orange-500 text-white shadow-lg shadow-orange-950/10" : "hover:bg-white/7 hover:text-white", collapsed && "justify-center px-0")}><Icon className="size-[18px] shrink-0" />{!collapsed && <span>{label}</span>}</Link>;
      })}</nav>
    </div>
    <div className="mt-auto"><SidebarAccount collapsed={collapsed} /></div>
  </div>;
}

export function Sidebar({ collapsed, setCollapsed }: { collapsed: boolean; setCollapsed: (value: boolean) => void }) {
  return <aside className={cn("fixed inset-y-0 left-0 z-40 hidden border-r border-slate-800 transition-[width] duration-200 lg:block", collapsed ? "w-[72px]" : "w-60")}>
    <SidebarContent collapsed={collapsed} />
    <button onClick={() => setCollapsed(!collapsed)} aria-label="Toggle sidebar" className="absolute -right-3 top-20 flex size-6 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm hover:text-slate-950">{collapsed ? <ChevronsRight className="size-3.5" /> : <ChevronsLeft className="size-3.5" />}</button>
  </aside>;
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobile, setMobile] = useState(false);
  const [search, setSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const title = pathname.startsWith("/projects/") ? projects.find(project => pathname.endsWith(project.id))?.name ?? "Project details" : titles[pathname] ?? "SyncField";
  const results = useMemo(() => search.length < 2 ? [] : [
    ...nav.map(item => ({ label: item.label, href: item.href, type: "Page" })),
    ...projects.map(project => ({ label: project.name, href: `/projects/${project.id}`, type: "Project" })),
  ].filter(result => result.label.toLowerCase().includes(search.toLowerCase())).slice(0, 6), [search]);

  return <div className="min-h-screen bg-slate-50/70">
    <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
    {mobile && <div className="fixed inset-0 z-50 lg:hidden"><button aria-label="Close menu" onClick={() => setMobile(false)} className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm" /><aside className="absolute inset-y-0 left-0 w-72 shadow-2xl"><SidebarContent collapsed={false} closeMobile={() => setMobile(false)} /><button onClick={() => setMobile(false)} className="absolute right-3 top-3 rounded-md p-2 text-slate-400 hover:bg-white/10"><X className="size-5" /></button></aside></div>}
    <div className={cn("transition-[padding] duration-200", collapsed ? "lg:pl-[72px]" : "lg:pl-60")}>
      <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-slate-200/80 bg-white/90 px-4 backdrop-blur-lg sm:px-6">
        <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setMobile(true)} aria-label="Open menu"><Menu className="size-5" /></Button>
        <div className="min-w-0"><p className="text-[11px] font-medium text-slate-400">SyncField / <span className="text-slate-500">{title}</span></p><h1 className="truncate text-lg font-semibold tracking-tight text-slate-950">{title}</h1></div>
        <div className="ml-auto flex items-center gap-2">
          <div className="relative hidden w-64 md:block"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" /><Input value={search} onChange={(event) => { setSearch(event.target.value); setSearchOpen(true); }} onFocus={() => setSearchOpen(true)} placeholder="Search projects, tasks..." className="pl-9" />{searchOpen && results.length > 0 && <div className="absolute right-0 top-12 w-80 rounded-xl border border-slate-200 bg-white p-2 shadow-xl">{results.map(result => <Link key={result.href + result.label} href={result.href} onClick={() => { setSearchOpen(false); setSearch(""); }} className="flex items-center justify-between rounded-lg px-3 py-2.5 hover:bg-slate-50"><span className="text-sm font-medium text-slate-800">{result.label}</span><Badge>{result.type}</Badge></Link>)}</div>}</div>
          <Button variant="ghost" size="icon" className="relative" aria-label="Notifications"><Bell className="size-5" /><span className="absolute right-1.5 top-1.5 flex size-4 items-center justify-center rounded-full bg-orange-500 text-[9px] font-bold text-white ring-2 ring-white">4</span></Button>
        </div>
      </header>
      <main className="mx-auto max-w-[1600px] p-4 sm:p-6 lg:p-8">{children}</main>
    </div>
  </div>;
}
