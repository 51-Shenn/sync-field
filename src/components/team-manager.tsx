"use client";

import { useState } from "react";
import { Pencil, Plus, Trash2, X } from "lucide-react";
import type { TeamMember } from "@/lib/mock-data";
import { Avatar, Button, Card, CardContent, Dialog, Dropdown, DropdownContent, DropdownItem, DropdownTrigger, DropdownValue, Input, Label } from "@/components/ui";

function newId() { return `tm${Date.now()}_${Math.random().toString(36).slice(2, 5)}`; }

export function TeamManager({ initialMembers, allMembers, projectId }: { initialMembers: TeamMember[]; allMembers: TeamMember[]; projectId: string }) {
  const [members, setMembers] = useState(initialMembers);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [existingId, setExistingId] = useState("");
  const [newName, setNewName] = useState("");
  const [newRole, setNewRole] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPhone, setNewPhone] = useState("");

  const availableMembers = allMembers.filter(m => !members.some(pm => pm.id === m.id));

  function removeMember(id: string) {
    setMembers(prev => prev.filter(m => m.id !== id));
  }

  function saveMember(updated: TeamMember) {
    setMembers(prev => prev.map(m => m.id === updated.id ? updated : m));
    setEditingMember(null);
  }

  function addExisting() {
    if (!existingId) return;
    const toAdd = allMembers.find(m => m.id === existingId);
    if (toAdd && !members.some(m => m.id === toAdd.id)) {
      setMembers(prev => [...prev, toAdd]);
    }
    setExistingId("");
    setShowAdd(false);
  }

  function createNew() {
    if (!newName.trim() || !newRole.trim()) return;
    const member: TeamMember = {
      id: newId(),
      name: newName.trim(),
      role: newRole.trim(),
      email: newEmail.trim() || `${newName.trim().toLowerCase().replace(/\s+/g, ".")}@syncfield.co`,
      phone: newPhone.trim(),
      avatarUrl: "",
      status: "active" as const,
      projectIds: [projectId],
      managerId: undefined,
    };
    setMembers(prev => [...prev, member]);
    setNewName("");
    setNewRole("");
    setNewEmail("");
    setNewPhone("");
    setShowAdd(false);
  }

  return <>
    <div className="mb-4 flex items-center justify-between">
      <p className="text-xs text-slate-500">{members.length} member{members.length !== 1 ? "s" : ""} on this project</p>
      <Button size="sm" onClick={() => setShowAdd(true)}><Plus className="size-3.5" />Add Member</Button>
    </div>
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {members.map(member => (
        <Card key={member.id} className="group relative">
          <CardContent className="flex items-center gap-4">
            <Avatar name={member.name} size="lg" />
            <div className="min-w-0 flex-1">
              <h3 className="truncate font-semibold text-slate-950">{member.name}</h3>
              <p className="mt-1 text-sm text-slate-500">{member.role}</p>
              <p className="mt-2 truncate text-xs text-slate-400">{member.email}</p>
            </div>
            <div className="flex flex-col gap-1.5 opacity-0 transition group-hover:opacity-100">
              <button onClick={() => setEditingMember({ ...member })} className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"><Pencil className="size-3.5" /></button>
              <button onClick={() => removeMember(member.id)} className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600"><Trash2 className="size-3.5" /></button>
            </div>
          </CardContent>
        </Card>
      ))}
      {members.length === 0 && <div className="col-span-full flex h-32 items-center justify-center rounded-xl border border-dashed border-slate-200 text-sm text-slate-400">No team members assigned yet.</div>}
    </div>

    {/* ── Edit Member Dialog ── */}
    <Dialog open={editingMember !== null} onOpenChange={open => { if (!open) setEditingMember(null); }} title="Edit team member">
      {editingMember && <div className="space-y-4">
        <div>
          <Label>Name</Label>
          <Input value={editingMember.name} onChange={e => setEditingMember({ ...editingMember, name: e.target.value })} placeholder="Full name" autoFocus />
        </div>
        <div>
          <Label>Role</Label>
          <Input value={editingMember.role} onChange={e => setEditingMember({ ...editingMember, role: e.target.value })} placeholder="e.g. Site Manager" />
        </div>
        <div>
          <Label>Email</Label>
          <Input value={editingMember.email} onChange={e => setEditingMember({ ...editingMember, email: e.target.value })} placeholder="email@example.com" />
        </div>
        <div>
          <Label>Phone</Label>
          <Input value={editingMember.phone} onChange={e => setEditingMember({ ...editingMember, phone: e.target.value })} placeholder="(555) 555-0123" />
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="outline" onClick={() => setEditingMember(null)}>Cancel</Button>
          <Button onClick={() => editingMember && saveMember(editingMember)}>Save</Button>
        </div>
      </div>}
    </Dialog>

    {/* ── Add Member Dialog ── */}
    <Dialog open={showAdd} onOpenChange={open => { if (!open) { setShowAdd(false); setExistingId(""); setNewName(""); setNewRole(""); setNewEmail(""); setNewPhone(""); } }} title="Add team member">
      <div className="space-y-4">
        {availableMembers.length > 0 && <>
          <div>
            <Label>Add existing member</Label>
            <Dropdown value={existingId} onValueChange={setExistingId}>
              <DropdownTrigger><DropdownValue placeholder="Select a team member..." /></DropdownTrigger>
              <DropdownContent>{availableMembers.map(m => <DropdownItem key={m.id} value={m.id}>{m.name} — {m.role}</DropdownItem>)}</DropdownContent>
            </Dropdown>
          </div>
          <div className="flex justify-end">
            <Button size="sm" variant="outline" onClick={addExisting} disabled={!existingId}>Add to project</Button>
          </div>
          <div className="border-t border-slate-100 pt-4"><p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Or create new</p></div>
        </>}
        <div>
          <Label>Name</Label>
          <Input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Full name" autoFocus={availableMembers.length === 0} />
        </div>
        <div>
          <Label>Role</Label>
          <Input value={newRole} onChange={e => setNewRole(e.target.value)} placeholder="e.g. Site Manager" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Email</Label>
            <Input value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="email@example.com" />
          </div>
          <div>
            <Label>Phone</Label>
            <Input value={newPhone} onChange={e => setNewPhone(e.target.value)} placeholder="(555) 555-0123" />
          </div>
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="outline" onClick={() => { setShowAdd(false); setExistingId(""); setNewName(""); setNewRole(""); setNewEmail(""); setNewPhone(""); }}>Cancel</Button>
          <Button onClick={createNew} disabled={!newName.trim() || !newRole.trim()}>Create & add</Button>
        </div>
      </div>
    </Dialog>
  </>;
}
