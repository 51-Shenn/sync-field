export type SiteReport = {
  id: string; projectId: string; title: string; type: "update" | "issue";
  description: string; status: "open" | "resolved"; createdBy: string;
  createdAt: string; attachments: string[];
};
