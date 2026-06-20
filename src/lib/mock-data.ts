export type ProjectStatus = "planning" | "in_progress" | "on_hold" | "completed";
export type Project = {
  id: string; name: string; client: string; location: string; status: ProjectStatus;
  progress: number; budget: number; spent: number; startDate: string; endDate: string;
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
  { id: "riverside", name: "Riverside Tower", client: "Axis Development", location: "Oakland, CA", status: "in_progress", progress: 68, budget: 12400000, spent: 7860000, startDate: "Jan 15, 2025", endDate: "Oct 30, 2026", managerId: "tm2", teamIds: ["tm1","tm2","tm5","tm6","tm8","tm10"], color: "#f97316", description: "A 22-story mixed-use tower with 184 residential units, ground-floor retail, and two levels of underground parking." },
  { id: "oakwood", name: "Oakwood Residences", client: "Northline Living", location: "San Jose, CA", status: "in_progress", progress: 42, budget: 8200000, spent: 3440000, startDate: "Mar 03, 2025", endDate: "Feb 18, 2027", managerId: "tm1", teamIds: ["tm1","tm4","tm6","tm9","tm10"], color: "#2563eb", description: "A sustainable residential community of six buildings centered on landscaped communal courtyards." },
  { id: "harbor", name: "Harbor Point Offices", client: "Beacon Properties", location: "San Francisco, CA", status: "on_hold", progress: 31, budget: 9600000, spent: 3120000, startDate: "Feb 10, 2025", endDate: "Dec 12, 2026", managerId: "tm3", teamIds: ["tm3","tm5","tm7","tm10"], color: "#8b5cf6", description: "A flexible waterfront office campus designed for hybrid teams and high environmental performance." },
  { id: "metro", name: "Metro Transit Hub", client: "Bay Transit Authority", location: "Berkeley, CA", status: "planning", progress: 14, budget: 15800000, spent: 1380000, startDate: "Aug 20, 2025", endDate: "May 06, 2028", managerId: "tm3", teamIds: ["tm3","tm6","tm9"], color: "#14b8a6", description: "Transit interchange modernization with expanded platforms, retail concourse, and improved accessibility." },
  { id: "crestline", name: "Crestline Medical Center", client: "Pacifica Health", location: "Palo Alto, CA", status: "in_progress", progress: 83, budget: 18700000, spent: 15320000, startDate: "Sep 12, 2024", endDate: "Aug 22, 2026", managerId: "tm4", teamIds: ["tm4","tm7"], color: "#ef4444", description: "A technically advanced outpatient medical center with imaging, surgical, and rehabilitation suites." },
  { id: "summit", name: "Summit School Expansion", client: "Summit Unified", location: "Walnut Creek, CA", status: "completed", progress: 100, budget: 4100000, spent: 3980000, startDate: "Jun 01, 2024", endDate: "May 28, 2026", managerId: "tm8", teamIds: ["tm8","tm2"], color: "#22c55e", description: "A new science wing and gymnasium for a growing K-12 campus." },
  { id: "market", name: "Market Street Retrofit", client: "Kinetic Retail", location: "San Francisco, CA", status: "planning", progress: 9, budget: 2800000, spent: 184000, startDate: "Jul 08, 2026", endDate: "Apr 19, 2027", managerId: "tm2", teamIds: ["tm2","tm5","tm7"], color: "#eab308", description: "Seismic retrofit and tenant improvements for a landmark urban retail property." },
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

export const budgetTrend = [
  { month:"Jan", budgeted:4.2, spent:3.6 }, { month:"Feb", budgeted:5.0, spent:4.4 },
  { month:"Mar", budgeted:5.4, spent:5.1 }, { month:"Apr", budgeted:6.1, spent:5.6 },
  { month:"May", budgeted:6.8, spent:6.2 }, { month:"Jun", budgeted:7.4, spent:6.9 },
];

export const activities = [
  { person:"John", action:"uploaded a permit to", target:"Riverside Tower", time:"18 min ago" },
  { person:"Elena", action:"completed the daily log for", target:"Riverside Tower", time:"42 min ago" },
  { person:"Priya", action:"approved Landscape Package for", target:"Oakwood Residences", time:"2 hr ago" },
  { person:"James", action:"commented on a drawing in", target:"Metro Transit Hub", time:"3 hr ago" },
  { person:"Sofia", action:"closed 3 punch items at", target:"Summit School", time:"Yesterday" },
];

export const costItems = [
  { category:"General conditions", budgeted:980000, actual:824000 },
  { category:"Concrete", budgeted:2180000, actual:2254000 },
  { category:"Structural steel", budgeted:1940000, actual:1812000 },
  { category:"Building envelope", budgeted:1620000, actual:1420000 },
  { category:"Mechanical / Electrical", budgeted:2810000, actual:1260000 },
  { category:"Interiors", budgeted:1780000, actual:290000 },
];
