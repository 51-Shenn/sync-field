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
  status: "active" | "on_leave"; projectIds: string[]; managerId?: string;
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
  { id: "tm1", name: "Ahmad Faiz Rahman", role: "Project Director", email: "ahmad.faiz.rahman@syncfield.my", phone: "+60 12-3456-7890", avatarUrl: "", status: "active", projectIds: ["klcc-tower", "pj-residences"] },
  { id: "tm2", name: "Pravin Wong", role: "MEP Engineer", email: "pravin.wong219@syncfield.my", phone: "+60 12-1481-3189", avatarUrl: "", status: "on_leave", projectIds: ["klcc-tower", "subang-commercial"], managerId: "tm1" },
  { id: "tm3", name: "Syafiq Patel", role: "Construction Worker", email: "syafiq.patel547@syncfield.my", phone: "+60 19-4230-6075", avatarUrl: "", status: "active", projectIds: ["jb-logistics-hub", "klcc-tower", "cyberjaya-techpark"], managerId: "tm1" },
  { id: "tm4", name: "Vignesh Razak", role: "Finance Executive", email: "vignesh.razak936@syncfield.my", phone: "+60 11-5616-3577", avatarUrl: "", status: "active", projectIds: ["subang-commercial", "penang-waterfront", "cyberjaya-techpark"], managerId: "tm1" },
  { id: "tm5", name: "Chee Meng Lee", role: "Construction Worker", email: "cheemeng.lee560@syncfield.my", phone: "+60 13-8218-3605", avatarUrl: "", status: "on_leave", projectIds: ["shah-alam-industrial"], managerId: "tm1" },
  { id: "tm6", name: "Aqil Lee", role: "Construction Worker", email: "aqil.lee346@syncfield.my", phone: "+60 17-4964-3993", avatarUrl: "", status: "active", projectIds: ["subang-commercial", "klcc-tower"], managerId: "tm1" },
  { id: "tm7", name: "Jun Hao Raj", role: "Site Manager", email: "junhao.raj173@syncfield.my", phone: "+60 10-6478-1712", avatarUrl: "", status: "active", projectIds: ["penang-waterfront", "kl-sentral-expansion", "pj-residences"], managerId: "tm1" },
  { id: "tm8", name: "Yu Xuan Rahman", role: "Foreman", email: "yuxuan.rahman920@syncfield.my", phone: "+60 11-5224-2852", avatarUrl: "", status: "active", projectIds: ["klcc-tower", "jb-logistics-hub", "cyberjaya-techpark"], managerId: "tm7" },
  { id: "tm9", name: "Hafiz Anuar", role: "Construction Worker", email: "hafiz.anuar604@syncfield.my", phone: "+60 12-3378-9845", avatarUrl: "", status: "active", projectIds: ["jb-logistics-hub"], managerId: "tm1" },
  { id: "tm10", name: "Ganesh Lim", role: "Civil Engineer", email: "ganesh.lim887@syncfield.my", phone: "+60 13-3355-2984", avatarUrl: "", status: "active", projectIds: ["shah-alam-industrial", "subang-commercial", "penang-waterfront"], managerId: "tm7" },
  { id: "tm11", name: "Surya Tan", role: "Quantity Surveyor", email: "surya.tan113@syncfield.my", phone: "+60 14-2053-4167", avatarUrl: "", status: "active", projectIds: ["kl-sentral-expansion", "jb-logistics-hub"], managerId: "tm7" },
  { id: "tm12", name: "Aqil Razak", role: "Site Engineer", email: "aqil.razak158@syncfield.my", phone: "+60 14-4612-6575", avatarUrl: "", status: "active", projectIds: ["subang-commercial", "shah-alam-industrial", "penang-waterfront"], managerId: "tm8" },
  { id: "tm13", name: "Syafiq Chong", role: "Safety Officer", email: "syafiq.chong609@syncfield.my", phone: "+60 10-2779-2291", avatarUrl: "", status: "active", projectIds: ["kl-sentral-expansion", "pj-residences"], managerId: "tm1" },
  { id: "tm14", name: "Siti Anuar", role: "Foreman", email: "siti.anuar962@syncfield.my", phone: "+60 18-2789-7869", avatarUrl: "", status: "active", projectIds: ["cyberjaya-techpark", "penang-waterfront", "klcc-tower"], managerId: "tm8" },
  { id: "tm15", name: "Prem Teoh", role: "Site Engineer", email: "prem.teoh513@syncfield.my", phone: "+60 12-4391-2057", avatarUrl: "", status: "active", projectIds: ["penang-waterfront", "cyberjaya-techpark"], managerId: "tm14" },
  { id: "tm16", name: "Prem Razak", role: "Construction Worker", email: "prem.razak88@syncfield.my", phone: "+60 10-4758-1238", avatarUrl: "", status: "active", projectIds: ["jb-logistics-hub"], managerId: "tm7" },
  { id: "tm17", name: "Raj Subramaniam", role: "Plumber", email: "raj.subramaniam267@syncfield.my", phone: "+60 12-2519-1965", avatarUrl: "", status: "active", projectIds: ["cyberjaya-techpark", "subang-commercial", "shah-alam-industrial"], managerId: "tm1" },
  { id: "tm18", name: "Raj Tan", role: "MEP Engineer", email: "raj.tan51@syncfield.my", phone: "+60 12-7449-5494", avatarUrl: "", status: "active", projectIds: ["shah-alam-industrial", "cyberjaya-techpark", "jb-logistics-hub"], managerId: "tm14" },
  { id: "tm19", name: "Yu Xuan Kumar", role: "Civil Engineer", email: "yuxuan.kumar508@syncfield.my", phone: "+60 12-4859-2215", avatarUrl: "", status: "active", projectIds: ["klcc-tower", "penang-waterfront"], managerId: "tm7" },
  { id: "tm20", name: "Siti Salleh", role: "Structural Engineer", email: "siti.salleh234@syncfield.my", phone: "+60 17-7892-8331", avatarUrl: "", status: "active", projectIds: ["klcc-tower", "kl-sentral-expansion", "subang-commercial"], managerId: "tm1" },
  { id: "tm21", name: "Arun Wong", role: "Site Engineer", email: "arun.wong296@syncfield.my", phone: "+60 18-5977-4254", avatarUrl: "", status: "active", projectIds: ["cyberjaya-techpark", "shah-alam-industrial", "klcc-tower"], managerId: "tm1" },
  { id: "tm22", name: "Ganesh Subramaniam", role: "Safety Officer", email: "ganesh.subramaniam253@syncfield.my", phone: "+60 13-5373-8295", avatarUrl: "", status: "active", projectIds: ["pj-residences"], managerId: "tm1" },
  { id: "tm23", name: "Kok Leong Lim", role: "Machinery Operator", email: "kokleong.lim108@syncfield.my", phone: "+60 19-9699-3045", avatarUrl: "", status: "active", projectIds: ["jb-logistics-hub"], managerId: "tm7" },
  { id: "tm24", name: "Hafiz Hassan", role: "Construction Worker", email: "hafiz.hassan444@syncfield.my", phone: "+60 16-4455-1888", avatarUrl: "", status: "active", projectIds: ["penang-waterfront", "subang-commercial", "klcc-tower"], managerId: "tm14" },
  { id: "tm25", name: "Syafiq Hamdan", role: "Site Supervisor", email: "syafiq.hamdan864@syncfield.my", phone: "+60 12-8282-3962", avatarUrl: "", status: "active", projectIds: ["subang-commercial", "pj-residences"], managerId: "tm7" },
  { id: "tm26", name: "Khairul Rahman", role: "Site Manager", email: "khairul.rahman228@syncfield.my", phone: "+60 14-5841-9311", avatarUrl: "", status: "active", projectIds: ["cyberjaya-techpark", "kl-sentral-expansion", "penang-waterfront"], managerId: "tm1" },
  { id: "tm27", name: "Nabila Nair", role: "Plumber", email: "nabila.nair79@syncfield.my", phone: "+60 17-1970-9013", avatarUrl: "", status: "active", projectIds: ["pj-residences", "klcc-tower"], managerId: "tm26" },
  { id: "tm28", name: "Firdaus Ng", role: "Electrician", email: "firdaus.ng161@syncfield.my", phone: "+60 19-8707-1530", avatarUrl: "", status: "active", projectIds: ["cyberjaya-techpark"], managerId: "tm14" },
  { id: "tm29", name: "Siti Kumar", role: "Construction Worker", email: "siti.kumar913@syncfield.my", phone: "+60 17-7193-5811", avatarUrl: "", status: "active", projectIds: ["klcc-tower", "subang-commercial", "kl-sentral-expansion"], managerId: "tm26" },
  { id: "tm30", name: "Farah Ng", role: "Construction Worker", email: "farah.ng753@syncfield.my", phone: "+60 13-6846-7940", avatarUrl: "", status: "active", projectIds: ["cyberjaya-techpark", "penang-waterfront"], managerId: "tm25" },
  { id: "tm31", name: "Danish Tan", role: "Structural Engineer", email: "danish.tan875@syncfield.my", phone: "+60 11-5309-7634", avatarUrl: "", status: "active", projectIds: ["subang-commercial"], managerId: "tm25" },
  { id: "tm32", name: "Hafiz Yusof", role: "Procurement Officer", email: "hafiz.yusof461@syncfield.my", phone: "+60 17-8102-4404", avatarUrl: "", status: "active", projectIds: ["penang-waterfront"], managerId: "tm25" },
  { id: "tm33", name: "Aisyah Anuar", role: "Finance Executive", email: "aisyah.anuar629@syncfield.my", phone: "+60 14-3172-9830", avatarUrl: "", status: "active", projectIds: ["subang-commercial", "klcc-tower"], managerId: "tm25" },
  { id: "tm34", name: "Izzati Yusof", role: "Structural Engineer", email: "izzati.yusof599@syncfield.my", phone: "+60 10-8477-5959", avatarUrl: "", status: "active", projectIds: ["cyberjaya-techpark"], managerId: "tm14" },
  { id: "tm35", name: "Jia Xin Tan", role: "Quantity Surveyor", email: "jiaxin.tan379@syncfield.my", phone: "+60 14-3524-8193", avatarUrl: "", status: "active", projectIds: ["subang-commercial", "jb-logistics-hub"], managerId: "tm25" },
  { id: "tm36", name: "Amirul Raj", role: "HR Executive", email: "amirul.raj284@syncfield.my", phone: "+60 18-3047-1553", avatarUrl: "", status: "active", projectIds: ["subang-commercial"], managerId: "tm26" },
  { id: "tm37", name: "Hafiz Rahman", role: "Electrician", email: "hafiz.rahman625@syncfield.my", phone: "+60 18-3002-3701", avatarUrl: "", status: "active", projectIds: ["subang-commercial"], managerId: "tm26" },
  { id: "tm38", name: "Pravin Rahman", role: "Site Supervisor", email: "pravin.rahman1@syncfield.my", phone: "+60 12-8353-3767", avatarUrl: "", status: "active", projectIds: ["jb-logistics-hub", "pj-residences", "klcc-tower"], managerId: "tm1" },
  { id: "tm39", name: "Hakim Ismail", role: "Site Engineer", email: "hakim.ismail199@syncfield.my", phone: "+60 12-2559-2095", avatarUrl: "", status: "active", projectIds: ["jb-logistics-hub", "klcc-tower", "subang-commercial"], managerId: "tm8" },
  { id: "tm40", name: "Siti Salleh", role: "Construction Worker", email: "siti.salleh12@syncfield.my", phone: "+60 11-5990-7141", avatarUrl: "", status: "active", projectIds: ["cyberjaya-techpark", "jb-logistics-hub"], managerId: "tm25" },
  { id: "tm41", name: "Jia Xin Rahman", role: "Foreman", email: "jiaxin.rahman133@syncfield.my", phone: "+60 16-2064-8568", avatarUrl: "", status: "active", projectIds: ["pj-residences", "jb-logistics-hub"], managerId: "tm1" },
  { id: "tm42", name: "Amirul Salleh", role: "Machinery Operator", email: "amirul.salleh267@syncfield.my", phone: "+60 17-3227-7942", avatarUrl: "", status: "active", projectIds: ["kl-sentral-expansion", "shah-alam-industrial", "klcc-tower"], managerId: "tm38" },
  { id: "tm43", name: "Jia Xin Rahman", role: "Construction Worker", email: "jiaxin.rahman61@syncfield.my", phone: "+60 10-5754-2953", avatarUrl: "", status: "active", projectIds: ["pj-residences"], managerId: "tm38" },
  { id: "tm44", name: "Nurul Tan", role: "Civil Engineer", email: "nurul.tan910@syncfield.my", phone: "+60 12-7681-2440", avatarUrl: "", status: "active", projectIds: ["penang-waterfront", "cyberjaya-techpark"], managerId: "tm14" },
  { id: "tm45", name: "Kok Leong Zulkifli", role: "Site Engineer", email: "kokleong.zulkifli35@syncfield.my", phone: "+60 10-1019-6300", avatarUrl: "", status: "active", projectIds: ["jb-logistics-hub", "cyberjaya-techpark"], managerId: "tm14" },
  { id: "tm46", name: "Jia Xin Hamdan", role: "Project Manager", email: "jiaxin.hamdan800@syncfield.my", phone: "+60 12-1568-3078", avatarUrl: "", status: "active", projectIds: ["shah-alam-industrial", "kl-sentral-expansion"], managerId: "tm26" },
  { id: "tm47", name: "Hakim Patel", role: "Structural Engineer", email: "hakim.patel253@syncfield.my", phone: "+60 13-9868-4187", avatarUrl: "", status: "on_leave", projectIds: ["kl-sentral-expansion", "jb-logistics-hub"], managerId: "tm26" },
  { id: "tm48", name: "Khairul Anuar", role: "Site Manager", email: "khairul.anuar234@syncfield.my", phone: "+60 16-5887-6956", avatarUrl: "", status: "active", projectIds: ["kl-sentral-expansion", "jb-logistics-hub"], managerId: "tm26" },
  { id: "tm49", name: "Danish Kumar", role: "Construction Worker", email: "danish.kumar920@syncfield.my", phone: "+60 12-7293-6580", avatarUrl: "", status: "active", projectIds: ["subang-commercial", "klcc-tower", "penang-waterfront"], managerId: "tm1" },
  { id: "tm50", name: "Khairul Subramaniam", role: "Construction Worker", email: "khairul.subramaniam900@syncfield.my", phone: "+60 14-9415-5293", avatarUrl: "", status: "active", projectIds: ["kl-sentral-expansion", "pj-residences", "cyberjaya-techpark"], managerId: "tm41" },
  { id: "tm51", name: "Syazana Low", role: "Construction Worker", email: "syazana.low219@syncfield.my", phone: "+60 16-9820-8488", avatarUrl: "", status: "active", projectIds: ["klcc-tower", "subang-commercial"], managerId: "tm14" },
  { id: "tm52", name: "Chee Meng Anuar", role: "Foreman", email: "cheemeng.anuar471@syncfield.my", phone: "+60 14-3157-5850", avatarUrl: "", status: "on_leave", projectIds: ["cyberjaya-techpark", "jb-logistics-hub"], managerId: "tm38" },
  { id: "tm53", name: "Xin Yi Singh", role: "Electrician", email: "xinyi.singh885@syncfield.my", phone: "+60 14-8878-7277", avatarUrl: "", status: "active", projectIds: ["penang-waterfront", "subang-commercial", "pj-residences"], managerId: "tm25" },
  { id: "tm54", name: "Arun Ng", role: "Electrician", email: "arun.ng253@syncfield.my", phone: "+60 11-8137-5105", avatarUrl: "", status: "active", projectIds: ["shah-alam-industrial", "kl-sentral-expansion", "jb-logistics-hub"], managerId: "tm46" },
  { id: "tm55", name: "Wei Jian Zulkifli", role: "Construction Worker", email: "weijian.zulkifli319@syncfield.my", phone: "+60 14-1570-3978", avatarUrl: "", status: "active", projectIds: ["klcc-tower"], managerId: "tm14" },
  { id: "tm56", name: "Harith Yusof", role: "Civil Engineer", email: "harith.yusof666@syncfield.my", phone: "+60 16-2040-3304", avatarUrl: "", status: "active", projectIds: ["jb-logistics-hub", "pj-residences", "cyberjaya-techpark"], managerId: "tm1" },
  { id: "tm57", name: "Nabila Anuar", role: "Project Manager", email: "nabila.anuar338@syncfield.my", phone: "+60 18-2825-4219", avatarUrl: "", status: "active", projectIds: ["shah-alam-industrial"], managerId: "tm25" },
  { id: "tm58", name: "Syazana Anuar", role: "Foreman", email: "syazana.anuar665@syncfield.my", phone: "+60 17-3340-7654", avatarUrl: "", status: "active", projectIds: ["cyberjaya-techpark"], managerId: "tm26" },
  { id: "tm59", name: "Siti Raj", role: "Quantity Surveyor", email: "siti.raj770@syncfield.my", phone: "+60 11-4885-2868", avatarUrl: "", status: "active", projectIds: ["klcc-tower"], managerId: "tm41" },
  { id: "tm60", name: "Syazana Hamdan", role: "Civil Engineer", email: "syazana.hamdan853@syncfield.my", phone: "+60 19-8682-3530", avatarUrl: "", status: "active", projectIds: ["penang-waterfront", "shah-alam-industrial", "subang-commercial"], managerId: "tm58" },
  { id: "tm61", name: "Ahmad Wong", role: "Electrician", email: "ahmad.wong558@syncfield.my", phone: "+60 19-5652-2018", avatarUrl: "", status: "active", projectIds: ["pj-residences"], managerId: "tm38" },
  { id: "tm62", name: "Amirul Singh", role: "Construction Worker", email: "amirul.singh176@syncfield.my", phone: "+60 19-5903-1857", avatarUrl: "", status: "active", projectIds: ["cyberjaya-techpark", "pj-residences", "kl-sentral-expansion"], managerId: "tm57" },
  { id: "tm63", name: "Ahmad Singh", role: "Construction Worker", email: "ahmad.singh949@syncfield.my", phone: "+60 19-7856-2449", avatarUrl: "", status: "active", projectIds: ["klcc-tower"], managerId: "tm38" },
  { id: "tm64", name: "Xin Yi Lim", role: "Civil Engineer", email: "xinyi.lim93@syncfield.my", phone: "+60 14-1949-7278", avatarUrl: "", status: "active", projectIds: ["jb-logistics-hub"], managerId: "tm41" },
  { id: "tm65", name: "Chee Meng Zulkifli", role: "Construction Worker", email: "cheemeng.zulkifli491@syncfield.my", phone: "+60 12-2740-8439", avatarUrl: "", status: "active", projectIds: ["pj-residences"], managerId: "tm46" },
  { id: "tm66", name: "Syazana Raj", role: "Project Manager", email: "syazana.raj648@syncfield.my", phone: "+60 19-5940-5016", avatarUrl: "", status: "active", projectIds: ["kl-sentral-expansion", "shah-alam-industrial"], managerId: "tm25" },
  { id: "tm67", name: "Izzati Hamdan", role: "Construction Worker", email: "izzati.hamdan476@syncfield.my", phone: "+60 14-4801-4313", avatarUrl: "", status: "active", projectIds: ["cyberjaya-techpark", "subang-commercial"], managerId: "tm25" },
  { id: "tm68", name: "Danish Mahmud", role: "Foreman", email: "danish.mahmud578@syncfield.my", phone: "+60 19-1700-2408", avatarUrl: "", status: "on_leave", projectIds: ["penang-waterfront", "subang-commercial"], managerId: "tm25" },
  { id: "tm69", name: "Nurul Rahman", role: "Construction Worker", email: "nurul.rahman183@syncfield.my", phone: "+60 11-5086-3879", avatarUrl: "", status: "on_leave", projectIds: ["shah-alam-industrial", "subang-commercial", "penang-waterfront"], managerId: "tm48" },
  { id: "tm70", name: "Izzati Hamdan", role: "HR Executive", email: "izzati.hamdan58@syncfield.my", phone: "+60 17-7613-2653", avatarUrl: "", status: "active", projectIds: ["pj-residences", "jb-logistics-hub", "penang-waterfront"], managerId: "tm8" },
  { id: "tm71", name: "Azlan Singh", role: "Safety Officer", email: "azlan.singh650@syncfield.my", phone: "+60 19-2958-3234", avatarUrl: "", status: "active", projectIds: ["subang-commercial"], managerId: "tm57" },
  { id: "tm72", name: "Hakim Anuar", role: "Construction Worker", email: "hakim.anuar973@syncfield.my", phone: "+60 17-8757-5380", avatarUrl: "", status: "active", projectIds: ["shah-alam-industrial", "pj-residences"], managerId: "tm8" },
  { id: "tm73", name: "Jun Hao Hassan", role: "Construction Worker", email: "junhao.hassan312@syncfield.my", phone: "+60 17-3186-9069", avatarUrl: "", status: "active", projectIds: ["cyberjaya-techpark", "penang-waterfront"], managerId: "tm58" },
  { id: "tm74", name: "Kumar Anuar", role: "Construction Worker", email: "kumar.anuar348@syncfield.my", phone: "+60 14-1879-1769", avatarUrl: "", status: "on_leave", projectIds: ["shah-alam-industrial", "cyberjaya-techpark", "klcc-tower"], managerId: "tm25" },
  { id: "tm75", name: "Kumar Raj", role: "Electrician", email: "kumar.raj81@syncfield.my", phone: "+60 13-7257-2253", avatarUrl: "", status: "active", projectIds: ["jb-logistics-hub", "penang-waterfront", "klcc-tower"], managerId: "tm41" },
  { id: "tm76", name: "Wen Jie Anuar", role: "Site Supervisor", email: "wenjie.anuar571@syncfield.my", phone: "+60 16-4407-2114", avatarUrl: "", status: "active", projectIds: ["klcc-tower", "kl-sentral-expansion", "penang-waterfront"], managerId: "tm52" },
  { id: "tm77", name: "Hakim Patel", role: "Quantity Surveyor", email: "hakim.patel750@syncfield.my", phone: "+60 16-2352-4619", avatarUrl: "", status: "active", projectIds: ["klcc-tower", "kl-sentral-expansion"], managerId: "tm38" },
  { id: "tm78", name: "Vignesh Hassan", role: "Site Supervisor", email: "vignesh.hassan236@syncfield.my", phone: "+60 17-8194-2402", avatarUrl: "", status: "active", projectIds: ["subang-commercial", "kl-sentral-expansion", "klcc-tower"], managerId: "tm8" },
  { id: "tm79", name: "Hakim Tan", role: "Construction Worker", email: "hakim.tan787@syncfield.my", phone: "+60 18-8493-2763", avatarUrl: "", status: "on_leave", projectIds: ["subang-commercial", "kl-sentral-expansion"], managerId: "tm25" },
  { id: "tm80", name: "Kumar Salleh", role: "Document Controller", email: "kumar.salleh844@syncfield.my", phone: "+60 14-2282-8984", avatarUrl: "", status: "active", projectIds: ["klcc-tower", "subang-commercial"], managerId: "tm38" },
  { id: "tm81", name: "Roslan Hamdan", role: "Construction Worker", email: "roslan.hamdan136@syncfield.my", phone: "+60 14-3185-5823", avatarUrl: "", status: "active", projectIds: ["penang-waterfront", "kl-sentral-expansion"], managerId: "tm41" },
  { id: "tm82", name: "Arun Razak", role: "Electrician", email: "arun.razak783@syncfield.my", phone: "+60 14-6278-8257", avatarUrl: "", status: "on_leave", projectIds: ["klcc-tower", "shah-alam-industrial", "subang-commercial"], managerId: "tm1" },
  { id: "tm83", name: "Syafiq Razak", role: "Construction Worker", email: "syafiq.razak413@syncfield.my", phone: "+60 13-5948-2752", avatarUrl: "", status: "active", projectIds: ["pj-residences"], managerId: "tm25" },
  { id: "tm84", name: "Harith Ng", role: "Site Supervisor", email: "harith.ng892@syncfield.my", phone: "+60 13-5176-7413", avatarUrl: "", status: "active", projectIds: ["klcc-tower"], managerId: "tm76" },
  { id: "tm85", name: "Pravin Low", role: "Site Supervisor", email: "pravin.low881@syncfield.my", phone: "+60 13-2085-1159", avatarUrl: "", status: "active", projectIds: ["klcc-tower", "subang-commercial", "jb-logistics-hub"], managerId: "tm48" },
  { id: "tm86", name: "Wei Jian Ng", role: "Site Supervisor", email: "weijian.ng459@syncfield.my", phone: "+60 11-3605-5883", avatarUrl: "", status: "active", projectIds: ["klcc-tower", "kl-sentral-expansion", "cyberjaya-techpark"], managerId: "tm66" },
  { id: "tm87", name: "Izzati Low", role: "Site Engineer", email: "izzati.low267@syncfield.my", phone: "+60 10-5942-7193", avatarUrl: "", status: "active", projectIds: ["subang-commercial", "kl-sentral-expansion", "pj-residences"], managerId: "tm38" },
  { id: "tm88", name: "Amirul Chong", role: "Safety Officer", email: "amirul.chong390@syncfield.my", phone: "+60 11-2977-8354", avatarUrl: "", status: "active", projectIds: ["penang-waterfront"], managerId: "tm84" },
  { id: "tm89", name: "Wei Jian Kumar", role: "Construction Worker", email: "weijian.kumar999@syncfield.my", phone: "+60 12-5244-5328", avatarUrl: "", status: "active", projectIds: ["shah-alam-industrial", "cyberjaya-techpark", "klcc-tower"], managerId: "tm58" },
  { id: "tm90", name: "Ahmad Salleh", role: "Civil Engineer", email: "ahmad.salleh904@syncfield.my", phone: "+60 17-4701-1377", avatarUrl: "", status: "active", projectIds: ["penang-waterfront", "pj-residences"], managerId: "tm78" },
  { id: "tm91", name: "Azlan Tan", role: "Site Manager", email: "azlan.tan308@syncfield.my", phone: "+60 14-5668-9216", avatarUrl: "", status: "active", projectIds: ["pj-residences", "subang-commercial", "penang-waterfront"], managerId: "tm8" },
  { id: "tm92", name: "Wei Jian Ong", role: "Procurement Officer", email: "weijian.ong177@syncfield.my", phone: "+60 13-3164-7754", avatarUrl: "", status: "active", projectIds: ["pj-residences", "klcc-tower", "kl-sentral-expansion"], managerId: "tm41" },
  { id: "tm93", name: "Xin Yi Wong", role: "HR Executive", email: "xinyi.wong617@syncfield.my", phone: "+60 19-2307-7278", avatarUrl: "", status: "active", projectIds: ["subang-commercial", "shah-alam-industrial", "jb-logistics-hub"], managerId: "tm85" },
  { id: "tm94", name: "Surya Yap", role: "Civil Engineer", email: "surya.yap78@syncfield.my", phone: "+60 17-8209-3707", avatarUrl: "", status: "active", projectIds: ["penang-waterfront"], managerId: "tm76" },
  { id: "tm95", name: "Muhammad Patel", role: "Construction Worker", email: "muhammad.patel52@syncfield.my", phone: "+60 14-9597-3362", avatarUrl: "", status: "active", projectIds: ["klcc-tower", "subang-commercial"], managerId: "tm86" },
  { id: "tm96", name: "Vignesh Hamdan", role: "Project Manager", email: "vignesh.hamdan185@syncfield.my", phone: "+60 13-3345-1368", avatarUrl: "", status: "active", projectIds: ["pj-residences", "kl-sentral-expansion"], managerId: "tm38" },
  { id: "tm97", name: "Xin Yi Yap", role: "Construction Worker", email: "xinyi.yap950@syncfield.my", phone: "+60 17-1283-3990", avatarUrl: "", status: "active", projectIds: ["pj-residences", "jb-logistics-hub", "cyberjaya-techpark"], managerId: "tm46" },
  { id: "tm98", name: "Xin Yi Yap", role: "Site Engineer", email: "xinyi.yap850@syncfield.my", phone: "+60 16-4808-6249", avatarUrl: "", status: "active", projectIds: ["subang-commercial"], managerId: "tm84" },
  { id: "tm99", name: "Kok Leong Raj", role: "Construction Worker", email: "kokleong.raj973@syncfield.my", phone: "+60 13-6241-7034", avatarUrl: "", status: "active", projectIds: ["shah-alam-industrial"], managerId: "tm14" },
  { id: "tm100", name: "Arun Ng", role: "Civil Engineer", email: "arun.ng724@syncfield.my", phone: "+60 17-1848-4341", avatarUrl: "", status: "active", projectIds: ["jb-logistics-hub", "cyberjaya-techpark", "klcc-tower"], managerId: "tm1" },
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
