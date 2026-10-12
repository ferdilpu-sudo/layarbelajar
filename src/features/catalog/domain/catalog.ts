export const contentKinds = ['material', 'exercise', 'worksheet', 'game'] as const;
export type ContentKind = (typeof contentKinds)[number];
export type ContentState = 'draft' | 'published' | 'archived';

export interface CatalogItem {
  id: string;
  slug: string;
  title: string;
  summary: string;
  kind: ContentKind;
  state: ContentState;
  level: string;
  grade: string;
  subject: string;
  topic: string;
}

export interface CatalogFilters {
  query: string;
  kind?: ContentKind;
  level?: string;
  grade?: string;
  subject?: string;
  topic?: string;
}

export interface CatalogRepository {
  listPublished(filters: CatalogFilters): Promise<readonly CatalogItem[]>;
  getPublishedBySlug(slug: string): Promise<CatalogItem | null>;
}

export const kindLabels: Record<ContentKind, string> = {
  material: 'Materi',
  exercise: 'Latihan',
  worksheet: 'LKPD',
  game: 'Game',
};

export const kindSymbols: Record<ContentKind, string> = {
  material: '📖',
  exercise: '✏️',
  worksheet: '📋',
  game: '🧩',
};
