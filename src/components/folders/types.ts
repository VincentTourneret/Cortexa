export type ViewMode = "list" | "grid";

export interface Folder {
  id: string;
  name: string;
  parentId: string | null;
  order: number;
  color?: string | null;
  children?: Folder[];
}

export interface KnowledgeCardSummary {
  id: string;
  title: string;
  summary: string | null;
  createdAt: string;
  updatedAt: string;
  sectionsCount: number;
  color?: string | null;
}
