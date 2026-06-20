"use client";

import { useState } from "react";
import { IconCheck, IconLoader2, IconShieldCheck } from "@tabler/icons-react";
import { GoogleSignInButton } from "@/components/google-sign-in-button";
import { Avatar, Button, Card, CardContent, Input, Label, Select, Skeleton, Tabs, Textarea } from "@/components/ui";
import { authClient } from "@/lib/auth-client";

type GoogleUser = {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image?: string | null;
};

function ProfileSettings({ user }: { user: GoogleUser }) {
  const nameParts = user.name.trim().split(/\s+/);
  const [firstName, setFirstName] = useState(nameParts[0] ?? "");
  const [lastName, setLastName] = useState(nameParts.slice(1).join(" "));
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  async function saveProfile() {
    const name = `${firstName} ${lastName}`.trim();
    if (!name) return;
    setStatus("saving");
    const result = await authClient.updateUser({ name });
    setStatus(result.error ? "error" : "saved");
    if (!result.error) setTimeout(() => setStatus("idle"), 1800);
  }

  return <Card><CardContent className="max-w-2xl">
    <div className="mb-6 flex items-center gap-4">
      <Avatar name={user.name} src={user.image} size="xl" />
      <div><p className="text-sm font-semibold text-slate-900">Google profile photo</p><p className="mt-1 text-xs text-slate-500">Your photo and email are synchronized from your Google account.</p></div>
    </div>
    <div className="grid gap-4 sm:grid-cols-2">
      <div><Label>First name</Label><Input value={firstName} onChange={(event) => setFirstName(event.target.value)} /></div>
      <div><Label>Last name</Label><Input value={lastName} onChange={(event) => setLastName(event.target.value)} /></div>
      <div className="sm:col-span-2"><Label>Email</Label><div className="relative"><Input type="email" value={user.email} readOnly className="bg-slate-50 pr-32 text-slate-500" /><span className="absolute right-3 top-1/2 flex -translate-y-1/2 items-center gap-1 text-[11px] font-semibold text-emerald-600"><IconShieldCheck className="size-3.5" />Google verified</span></div></div>
      <div><Label>Phone</Label><Input placeholder="Add a phone number" /></div>
      <div><Label>Job title</Label><Input defaultValue="Project Director" /></div>
      <div className="sm:col-span-2"><Label>Bio</Label><Textarea defaultValue="Construction operations leader focused on predictable delivery and collaborative field teams." /></div>
    </div>
    <div className="mt-6 flex items-center justify-end gap-3">{status === "error" && <p className="text-xs font-medium text-red-600">Could not update your profile.</p>}<Button onClick={saveProfile} disabled={status === "saving"}>{status === "saving" ? <><IconLoader2 className="size-4 animate-spin" />Saving...</> : status === "saved" ? <><IconCheck className="size-4" />Saved</> : "Save changes"}</Button></div>
  </CardContent></Card>;
}

function SaveButton() {
  const [saved, setSaved] = useState(false);
  return <Button onClick={() => { setSaved(true); setTimeout(() => setSaved(false), 1800); }}>{saved ? <><IconCheck className="size-4" />Saved</> : "Save changes"}</Button>;
}

const company = <Card><CardContent className="max-w-2xl"><div className="grid gap-4 sm:grid-cols-2"><div className="sm:col-span-2"><Label>Company name</Label><Input defaultValue="SyncField Construction Group" /></div><div><Label>Company email</Label><Input defaultValue="operations@syncfield.co" /></div><div><Label>Phone</Label><Input defaultValue="(415) 555-0100" /></div><div className="sm:col-span-2"><Label>Address</Label><Input defaultValue="220 Howard Street, San Francisco, CA 94105" /></div><div><Label>Time zone</Label><Select className="w-full" defaultValue="pacific"><option value="pacific">Pacific Time (PT)</option><option>Mountain Time (MT)</option><option>Central Time (CT)</option></Select></div></div><div className="mt-6 flex justify-end"><SaveButton /></div></CardContent></Card>;

const notifications = <Card><CardContent className="max-w-2xl"><div className="space-y-1">{[{ title: "Task assignments", desc: "When a task is assigned to you" }, { title: "Project updates", desc: "Daily digest for projects you manage" }, { title: "Document activity", desc: "When documents need your review" }, { title: "Daily log reminders", desc: "At 4:00 PM on active site days" }].map((item, index) => <label key={item.title} className="flex cursor-pointer items-center justify-between rounded-lg p-3 hover:bg-slate-50"><div><p className="text-sm font-medium text-slate-900">{item.title}</p><p className="mt-0.5 text-xs text-slate-500">{item.desc}</p></div><input type="checkbox" defaultChecked={index !== 2} className="size-4 accent-orange-500" /></label>)}</div><div className="mt-6 flex justify-end"><SaveButton /></div></CardContent></Card>;

export function SettingsView() {
  const { data: session, isPending } = authClient.useSession();
  if (isPending) return <Card><CardContent className="max-w-2xl space-y-4"><Skeleton className="h-16 w-16 rounded-full" /><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /></CardContent></Card>;
  if (!session?.user) return <Card><CardContent className="max-w-md"><h3 className="font-semibold text-slate-950">Sign in to manage your profile</h3><p className="mt-1 mb-5 text-sm text-slate-500">Connect your Google account to synchronize your name, email, and profile photo.</p><GoogleSignInButton /></CardContent></Card>;
  return <Tabs tabs={[{ value: "profile", label: "Profile", content: <ProfileSettings key={session.user.id} user={session.user} /> }, { value: "company", label: "Company", content: company }, { value: "notifications", label: "Notifications", content: notifications }]} />;
}
