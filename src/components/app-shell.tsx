"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconBriefcase2, IconChevronDown, IconChevronsLeft, IconChevronsRight, IconLayoutDashboard, IconLogout, IconMenu2, IconDeviceDesktop, IconSearch, IconSettings, IconUsers, IconX } from "@tabler/icons-react";
import { GoogleSignInButton } from "@/components/google-sign-in-button";
import { Avatar, Badge, Button, Dialog, Input, Skeleton } from "@/components/ui";
import { authClient } from "@/lib/auth-client";
import { useProjects } from "@/lib/use-data";
import { cn } from "@/lib/utils";

const nav = [
  { href:"/control-centre", label:"Control Centre", icon:IconLayoutDashboard },
  { href:"/sites", label:"Site Reporting", icon:IconDeviceDesktop },
  { href:"/projects", label:"Project Management", icon:IconBriefcase2 },
  { href:"/workforce", label:"Workforce Management", icon:IconUsers },
];
function Brand({ collapsed = false }: { collapsed?: boolean }) {
  return <Link href="/" className="flex h-16 items-center gap-2.5 overflow-hidden px-3">
    <Image src="/icon.svg" alt="SyncField" width={40} height={40} className="size-10 shrink-0 object-contain" />
    {!collapsed && <span className="whitespace-nowrap text-lg font-bold tracking-tight text-white">Sync<span className="text-orange-400">Field</span></span>}
  </Link>;
}

function SidebarAccount({ collapsed }: { collapsed: boolean }) {
  const { data: session, isPending } = authClient.useSession();
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);
    const result = await authClient.signOut();
    if (result.error) {
      setLoggingOut(false);
      return;
    }
    window.location.replace("/");
  }

  if (isPending) return <div className="p-3"><Skeleton className={cn("h-11 bg-white/10", collapsed ? "w-11" : "w-full")} /></div>;
  if (!session?.user) return <div className="p-3"><GoogleSignInButton compact={collapsed} /></div>;

  const userName = session.user.name || session.user.email || "Account";
  return <div className="p-3">
    <details className="group relative">
      <summary className={cn("flex cursor-pointer list-none items-center gap-3 rounded-lg p-2 hover:bg-white/7", collapsed && "justify-center")}>
        <Avatar name={userName} src={session.user.image} />
        {!collapsed && <><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-white">{userName}</p><p className="truncate text-xs text-slate-400">{session.user.email}</p></div><IconChevronDown className="size-4 transition-transform group-open:rotate-180" /></>}
      </summary>
      <div className="absolute bottom-full left-0 mb-2 w-48 rounded-xl border border-white/20 bg-slate-900/70 p-1.5 text-sm text-white shadow-2xl shadow-slate-950/30 backdrop-blur-xl">
        <Link href="/settings" className="flex items-center gap-2.5 rounded-lg px-3 py-2 hover:bg-white/10"><IconSettings className="size-4" />Settings</Link>
        <button onClick={() => setLogoutOpen(true)} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-red-300 hover:bg-white/10 hover:text-red-200"><IconLogout className="size-4" />Log out</button>
      </div>
    </details>
    <Dialog open={logoutOpen} onOpenChange={setLogoutOpen} title="Log out of SyncField?" description="Are you sure you want to log out of your account?">
      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={() => setLogoutOpen(false)}>Cancel</Button>
        <Button variant="danger" onClick={handleLogout} disabled={loggingOut}>{loggingOut ? "Logging out..." : <><IconLogout className="size-4" />Log out</>}</Button>
      </div>
    </Dialog>
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
    <button onClick={() => setCollapsed(!collapsed)} aria-label="Toggle sidebar" className="absolute -right-3 top-20 flex size-6 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm hover:text-slate-950">{collapsed ? <IconChevronsRight className="size-3.5" /> : <IconChevronsLeft className="size-3.5" />}</button>
  </aside>;
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const { projects } = useProjects();
  const [collapsed, setCollapsed] = useState(false);
  const [mobile, setMobile] = useState(false);
  const [search, setSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const results = useMemo(() => search.length < 2 ? [] : [
    ...nav.map(item => ({ label: item.label, href: item.href, type: "Page" })),
    ...projects.map(project => ({ label: project.name, href: `/projects/${project.id}`, type: "Project" })),
  ].filter(result => result.label.toLowerCase().includes(search.toLowerCase())).slice(0, 6), [search]);

  return <div className="min-h-screen bg-slate-50/70">
    <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
    {mobile && <div className="fixed inset-0 z-50 lg:hidden"><button aria-label="Close menu" onClick={() => setMobile(false)} className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm" /><aside className="absolute inset-y-0 left-0 w-72 shadow-2xl"><SidebarContent collapsed={false} closeMobile={() => setMobile(false)} /><button onClick={() => setMobile(false)} className="absolute right-3 top-3 rounded-md p-2 text-slate-400 hover:bg-white/10"><IconX className="size-5" /></button></aside></div>}
    <div className={cn("transition-[padding] duration-200", collapsed ? "lg:pl-[72px]" : "lg:pl-60")}>
      <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-slate-200/80 bg-white/90 px-4 backdrop-blur-lg sm:px-6">
        <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setMobile(true)} aria-label="Open menu"><IconMenu2 className="size-5" /></Button>
        <div className="ml-auto flex items-center gap-2">
          <div className="relative hidden w-64 md:block"><IconSearch className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" /><Input value={search} onChange={(event) => { setSearch(event.target.value); setSearchOpen(true); }} onFocus={() => setSearchOpen(true)} placeholder="Search projects, tasks..." className="pl-9" />{searchOpen && results.length > 0 && <div className="absolute right-0 top-12 w-80 rounded-xl border border-slate-200 bg-white p-2 shadow-xl">{results.map(result => <Link key={result.href + result.label} href={result.href} onClick={() => { setSearchOpen(false); setSearch(""); }} className="flex items-center justify-between rounded-lg px-3 py-2.5 hover:bg-slate-50"><span className="text-sm font-medium text-slate-800">{result.label}</span><Badge>{result.type}</Badge></Link>)}</div>}</div>
        </div>
      </header>
      <main className="mx-auto max-w-[1600px] p-4 sm:p-6 lg:p-8">{children}</main>
    </div>
  </div>;
}
