import { contentKinds, type CatalogFilters, type CatalogItem, type ContentKind } from '../domain/catalog';

export function parseKind(value: string | null): ContentKind | undefined {
  return contentKinds.find((kind) => kind === value);
}

export function filterPublishedCatalog(items: readonly CatalogItem[], filters: CatalogFilters): CatalogItem[] {
  const normalizedQuery = filters.query.trim().toLocaleLowerCase('id-ID');
  return items.filter((item) => {
    if (item.state !== 'published') return false;
    if (normalizedQuery && !(item.title + ' ' + item.summary).toLocaleLowerCase('id-ID').includes(normalizedQuery)) return false;
    if (filters.kind && item.kind !== filters.kind) return false;
    if (filters.level && item.level !== filters.level) return false;
    if (filters.grade && item.grade !== filters.grade) return false;
    if (filters.subject && item.subject !== filters.subject) return false;
    if (filters.topic && item.topic !== filters.topic) return false;
    return true;
  });
}
