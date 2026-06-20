export type DocumentFile = {
  id: string; name: string; type: "pdf" | "image" | "doc" | "spreadsheet";
  projectId: string; uploadedBy: string; uploadedAt: string; sizeKb: number;
};
