export type ProjectStatus = "planning" | "in_progress" | "on_hold" | "completed";
export type Project = {
  id: string; name: string; client: string; location: string; status: ProjectStatus;
  progress: number; startDate: string; endDate: string;
  managerId: string; teamIds: string[]; color: string; description: string;
};
export type Task = {
  id: string; projectId: string; title: string; status: "todo" | "in_progress" | "review" | "done";
  priority: "low" | "medium" | "high"; assigneeId: string; dueDate: string;
};
export type TeamMember = {
  id: string; name: string; role: string; email: string; phone: string; avatarUrl: string;
  status: "active" | "on_leave"; projectIds: string[];
};
export type DocumentFile = {
  id: string; name: string; type: "pdf" | "image" | "doc" | "spreadsheet";
  projectId: string; uploadedBy: string; uploadedAt: string; sizeKb: number;
};
export type Subtask = {
  id: string; taskId: string; title: string; status: "todo" | "done";
  assigneeId: string; dueDate: string;
};
export type SiteReport = {
  id: string; projectId: string; title: string; type: "update" | "issue";
  description: string; status: "open" | "resolved"; createdBy: string;
  createdAt: string; attachments: string[];
};
export type AuditLog = {
  id: string; action: "created" | "updated" | "deleted"; entity: string;
  entityId: string; entityName: string; performedBy: string; timestamp: string; details: string;
};

export const teamMembers: TeamMember[] = [
  { id: "tm1", name: "Marcus Chen", role: "Project Director", email: "marcus@syncfield.co", phone: "(415) 555-0183", avatarUrl: "", status: "active", projectIds: ["riverside", "oakwood"] },
  { id: "tm2", name: "Elena Rodriguez", role: "Site Manager", email: "elena@syncfield.co", phone: "(415) 555-0117", avatarUrl: "", status: "active", projectIds: ["riverside"] },
  { id: "tm3", name: "James Wilson", role: "Civil Engineer", email: "james@syncfield.co", phone: "(510) 555-0199", avatarUrl: "", status: "active", projectIds: ["harbor", "metro"] },
  { id: "tm4", name: "Priya Shah", role: "Architect", email: "priya@syncfield.co", phone: "(510) 555-0146", avatarUrl: "", status: "active", projectIds: ["oakwood", "crestline"] },
  { id: "tm5", name: "Noah Williams", role: "Safety Officer", email: "noah@syncfield.co", phone: "(650) 555-0128", avatarUrl: "", status: "on_leave", projectIds: ["riverside", "harbor"] },
  { id: "tm6", name: "Ava Thompson", role: "Cost Estimator", email: "ava@syncfield.co", phone: "(415) 555-0153", avatarUrl: "", status: "active", projectIds: ["riverside", "oakwood", "metro"] },
  { id: "tm7", name: "Daniel Kim", role: "MEP Engineer", email: "daniel@syncfield.co", phone: "(650) 555-0172", avatarUrl: "", status: "active", projectIds: ["harbor", "crestline"] },
  { id: "tm8", name: "Sofia Patel", role: "Foreperson", email: "sofia@syncfield.co", phone: "(510) 555-0134", avatarUrl: "", status: "active", projectIds: ["riverside", "summit"] },
  { id: "tm9", name: "Liam O'Connor", role: "Electrician", email: "liam@syncfield.co", phone: "(415) 555-0168", avatarUrl: "", status: "active", projectIds: ["oakwood", "metro"] },
  { id: "tm10", name: "Maya Brooks", role: "Document Controller", email: "maya@syncfield.co", phone: "(650) 555-0191", avatarUrl: "", status: "active", projectIds: ["riverside", "harbor", "oakwood"] },
];

export const projects: Project[] = [
  { id: "riverside", name: "Riverside Tower", client: "Axis Development", location: "Oakland, CA", status: "in_progress", progress: 68, startDate: "Jan 15, 2025", endDate: "Oct 30, 2026", managerId: "tm2", teamIds: ["tm1","tm2","tm5","tm6","tm8","tm10"], color: "#f97316", description: "A 22-story mixed-use tower with 184 residential units, ground-floor retail, and two levels of underground parking." },
  { id: "oakwood", name: "Oakwood Residences", client: "Northline Living", location: "San Jose, CA", status: "in_progress", progress: 42, startDate: "Mar 03, 2025", endDate: "Feb 18, 2027", managerId: "tm1", teamIds: ["tm1","tm4","tm6","tm9","tm10"], color: "#2563eb", description: "A sustainable residential community of six buildings centered on landscaped communal courtyards." },
  { id: "harbor", name: "Harbor Point Offices", client: "Beacon Properties", location: "San Francisco, CA", status: "on_hold", progress: 31, startDate: "Feb 10, 2025", endDate: "Dec 12, 2026", managerId: "tm3", teamIds: ["tm3","tm5","tm7","tm10"], color: "#8b5cf6", description: "A flexible waterfront office campus designed for hybrid teams and high environmental performance." },
  { id: "metro", name: "Metro Transit Hub", client: "Bay Transit Authority", location: "Berkeley, CA", status: "planning", progress: 14, startDate: "Aug 20, 2025", endDate: "May 06, 2028", managerId: "tm3", teamIds: ["tm3","tm6","tm9"], color: "#14b8a6", description: "Transit interchange modernization with expanded platforms, retail concourse, and improved accessibility." },
  { id: "crestline", name: "Crestline Medical Center", client: "Pacifica Health", location: "Palo Alto, CA", status: "in_progress", progress: 83, startDate: "Sep 12, 2024", endDate: "Aug 22, 2026", managerId: "tm4", teamIds: ["tm4","tm7"], color: "#ef4444", description: "A technically advanced outpatient medical center with imaging, surgical, and rehabilitation suites." },
  { id: "summit", name: "Summit School Expansion", client: "Summit Unified", location: "Walnut Creek, CA", status: "completed", progress: 100, startDate: "Jun 01, 2024", endDate: "May 28, 2026", managerId: "tm8", teamIds: ["tm8","tm2"], color: "#22c55e", description: "A new science wing and gymnasium for a growing K-12 campus." },
  { id: "market", name: "Market Street Retrofit", client: "Kinetic Retail", location: "San Francisco, CA", status: "planning", progress: 9, startDate: "Jul 08, 2026", endDate: "Apr 19, 2027", managerId: "tm2", teamIds: ["tm2","tm5","tm7"], color: "#eab308", description: "Seismic retrofit and tenant improvements for a landmark urban retail property." },
];

export const tasks: Task[] = [
  { id:"t1", projectId:"riverside", title:"Level 14 concrete pour", status:"in_progress", priority:"high", assigneeId:"tm8", dueDate:"Jun 23" },
  { id:"t2", projectId:"riverside", title:"Review curtain wall submittal", status:"review", priority:"medium", assigneeId:"tm2", dueDate:"Jun 24" },
  { id:"t3", projectId:"riverside", title:"MEP riser inspection", status:"todo", priority:"high", assigneeId:"tm7", dueDate:"Jun 26" },
  { id:"t4", projectId:"riverside", title:"Update site logistics plan", status:"done", priority:"low", assigneeId:"tm2", dueDate:"Jun 18" },
  { id:"t5", projectId:"oakwood", title:"Building C foundations", status:"in_progress", priority:"high", assigneeId:"tm1", dueDate:"Jun 25" },
  { id:"t6", projectId:"oakwood", title:"Landscape package approval", status:"review", priority:"medium", assigneeId:"tm4", dueDate:"Jun 27" },
  { id:"t7", projectId:"oakwood", title:"Electrical shop drawings", status:"todo", priority:"medium", assigneeId:"tm9", dueDate:"Jul 01" },
  { id:"t8", projectId:"harbor", title:"Resolve coastal permit comments", status:"todo", priority:"high", assigneeId:"tm3", dueDate:"Jun 30" },
  { id:"t9", projectId:"harbor", title:"Reprice structural steel", status:"in_progress", priority:"high", assigneeId:"tm6", dueDate:"Jul 02" },
  { id:"t10", projectId:"metro", title:"Complete 60% design review", status:"in_progress", priority:"medium", assigneeId:"tm3", dueDate:"Jul 05" },
  { id:"t11", projectId:"metro", title:"Utility relocation survey", status:"todo", priority:"high", assigneeId:"tm9", dueDate:"Jul 08" },
  { id:"t12", projectId:"crestline", title:"Commission imaging suite", status:"review", priority:"high", assigneeId:"tm7", dueDate:"Jun 24" },
  { id:"t13", projectId:"crestline", title:"Punch list — Level 2", status:"in_progress", priority:"medium", assigneeId:"tm4", dueDate:"Jun 25" },
  { id:"t14", projectId:"crestline", title:"Final fire alarm test", status:"todo", priority:"high", assigneeId:"tm7", dueDate:"Jun 28" },
  { id:"t15", projectId:"summit", title:"Closeout warranty package", status:"done", priority:"low", assigneeId:"tm10", dueDate:"Jun 16" },
  { id:"t16", projectId:"market", title:"Existing conditions scan", status:"in_progress", priority:"medium", assigneeId:"tm2", dueDate:"Jun 29" },
  { id:"t17", projectId:"market", title:"Submit seismic concept", status:"todo", priority:"high", assigneeId:"tm7", dueDate:"Jul 11" },
  { id:"t18", projectId:"riverside", title:"Safety toolbox talk", status:"done", priority:"low", assigneeId:"tm5", dueDate:"Jun 20" },
];

export const documents: DocumentFile[] = [
  { id:"d1", name:"Issued for Construction Set.pdf", type:"pdf", projectId:"riverside", uploadedBy:"tm10", uploadedAt:"Jun 20, 2026", sizeKb:18420 },
  { id:"d2", name:"Building Permit — Revision 04.pdf", type:"pdf", projectId:"riverside", uploadedBy:"tm2", uploadedAt:"Jun 19, 2026", sizeKb:2840 },
  { id:"d3", name:"Level 14 Progress Photos.zip", type:"image", projectId:"riverside", uploadedBy:"tm8", uploadedAt:"Jun 18, 2026", sizeKb:48200 },
  { id:"d4", name:"Curtain Wall Submittal.pdf", type:"pdf", projectId:"riverside", uploadedBy:"tm7", uploadedAt:"Jun 17, 2026", sizeKb:9200 },
  { id:"d5", name:"Civil Grading Plan.pdf", type:"pdf", projectId:"oakwood", uploadedBy:"tm3", uploadedAt:"Jun 16, 2026", sizeKb:12500 },
  { id:"d6", name:"Cost Report — May.xlsx", type:"spreadsheet", projectId:"oakwood", uploadedBy:"tm6", uploadedAt:"Jun 14, 2026", sizeKb:864 },
  { id:"d7", name:"Coastal Commission Comments.docx", type:"doc", projectId:"harbor", uploadedBy:"tm10", uploadedAt:"Jun 12, 2026", sizeKb:540 },
  { id:"d8", name:"Structural Steel Bid Comparison.xlsx", type:"spreadsheet", projectId:"harbor", uploadedBy:"tm6", uploadedAt:"Jun 11, 2026", sizeKb:392 },
  { id:"d9", name:"Transit Hub Design Narrative.docx", type:"doc", projectId:"metro", uploadedBy:"tm3", uploadedAt:"Jun 09, 2026", sizeKb:1180 },
  { id:"d10", name:"Utility Survey.pdf", type:"pdf", projectId:"metro", uploadedBy:"tm9", uploadedAt:"Jun 08, 2026", sizeKb:7800 },
  { id:"d11", name:"Medical Equipment Schedule.xlsx", type:"spreadsheet", projectId:"crestline", uploadedBy:"tm7", uploadedAt:"Jun 07, 2026", sizeKb:724 },
  { id:"d12", name:"Commissioning Photos.zip", type:"image", projectId:"crestline", uploadedBy:"tm4", uploadedAt:"Jun 04, 2026", sizeKb:64300 },
  { id:"d13", name:"Certificate of Occupancy.pdf", type:"pdf", projectId:"summit", uploadedBy:"tm10", uploadedAt:"May 28, 2026", sizeKb:1200 },
  { id:"d14", name:"Existing Conditions Photos.zip", type:"image", projectId:"market", uploadedBy:"tm2", uploadedAt:"Jun 20, 2026", sizeKb:31500 },
];

export const subtasks: Subtask[] = [
  { id:"st1", taskId:"t1", title:"Mobilize pump crew", status:"done", assigneeId:"tm8", dueDate:"Jun 22" },
  { id:"st2", taskId:"t1", title:"Test slump", status:"done", assigneeId:"tm8", dueDate:"Jun 22" },
  { id:"st3", taskId:"t1", title:"Finish screed", status:"todo", assigneeId:"tm8", dueDate:"Jun 23" },
  { id:"st4", taskId:"t2", title:"Check elevations", status:"todo", assigneeId:"tm2", dueDate:"Jun 23" },
  { id:"st5", taskId:"t2", title:"Verify anchor embedment", status:"todo", assigneeId:"tm7", dueDate:"Jun 24" },
];

export const siteReports: SiteReport[] = [
  { id:"sr1", projectId:"riverside", title:"Level 14 rebar issue", type:"issue", description:"Some rebar splices are out of tolerance as per ACI 318.", status:"open", createdBy:"tm2", createdAt:"Jun 19, 2026", attachments:["rebar_photo_01.jpg"] },
  { id:"sr2", projectId:"riverside", title:"Weekly progress update", type:"update", description:"Concrete pour complete. Plumbing rough-in on schedule.", status:"resolved", createdBy:"tm8", createdAt:"Jun 18, 2026", attachments:["progress_report_w24.pdf"] },
  { id:"sr3", projectId:"oakwood", title:"Building C foundation pour", type:"update", description:"Foundation pour completed successfully.", status:"resolved", createdBy:"tm1", createdAt:"Jun 17, 2026", attachments:["cylinder_break_report.pdf"] },
  { id:"sr4", projectId:"harbor", title:"Coastal permit non-conformance", type:"issue", description:"Erosion control measures not per approved plan.", status:"open", createdBy:"tm3", createdAt:"Jun 20, 2026", attachments:["erosion_control_photo.jpg","ncr_001.pdf"] },
];

export const activities = [
  { person:"John", action:"uploaded a permit to", target:"Riverside Tower", time:"18 min ago" },
  { person:"Elena", action:"completed the daily log for", target:"Riverside Tower", time:"42 min ago" },
  { person:"Priya", action:"approved Landscape Package for", target:"Oakwood Residences", time:"2 hr ago" },
  { person:"James", action:"commented on a drawing in", target:"Metro Transit Hub", time:"3 hr ago" },
  { person:"Sofia", action:"closed 3 punch items at", target:"Summit School", time:"Yesterday" },
];

export const auditLogs: AuditLog[] = [
  { id:"al1", action:"created", entity:"project", entityId:"riverside", entityName:"Riverside Tower", performedBy:"Marcus Chen", timestamp:"Jun 15, 2026 09:14", details:"Project created with 6 team members." },
  { id:"al2", action:"updated", entity:"worker", entityId:"tm5", entityName:"Noah Williams", performedBy:"Marcus Chen", timestamp:"Jun 16, 2026 11:32", details:"Status changed to on_leave." },
  { id:"al3", action:"created", entity:"report", entityId:"sr3", entityName:"Building C foundation pour", performedBy:"Priya Shah", timestamp:"Jun 17, 2026 08:05", details:"Site update report created." },
  { id:"al4", action:"updated", entity:"project", entityId:"oakwood", entityName:"Oakwood Residences", performedBy:"Elena Rodriguez", timestamp:"Jun 18, 2026 14:20", details:"Progress updated to 42%." },
  { id:"al5", action:"deleted", entity:"resource", entityId:"old_r1", entityName:"Concrete Mixer #3", performedBy:"Marcus Chen", timestamp:"Jun 19, 2026 10:47", details:"Resource decommissioned and removed." },
  { id:"al6", action:"created", entity:"report", entityId:"sr1", entityName:"Level 14 rebar issue", performedBy:"Elena Rodriguez", timestamp:"Jun 19, 2026 15:30", details:"Site issue report created." },
  { id:"al7", action:"created", entity:"worker", entityId:"tm11", entityName:"Carlos Mendez", performedBy:"Marcus Chen", timestamp:"Jun 20, 2026 07:12", details:"New electrician added to workforce." },
  { id:"al8", action:"updated", entity:"report", entityId:"sr2", entityName:"Weekly progress update", performedBy:"Sofia Patel", timestamp:"Jun 20, 2026 09:44", details:"Report status changed to resolved." },
];
