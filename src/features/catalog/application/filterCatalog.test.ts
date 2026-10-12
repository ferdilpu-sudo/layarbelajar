import { describe, expect, it } from 'vitest';
import { filterPublishedCatalog, parseKind } from './filterCatalog';
import type { CatalogItem } from '../domain/catalog';

const base: CatalogItem = {
  id: '1', slug: 'pecahan', title: 'Pecahan', summary: 'Materi berhitung', kind: 'exercise',
  state: 'published', level: 'SD', grade: 'Kelas 4', subject: 'Matematika', topic: 'Pecahan',
};

describe('filterPublishedCatalog', () => {
  const data: CatalogItem[] = [
    base,
    { ...base, id: '2', slug: 'tata-surya', title: 'Tata Surya', kind: 'material', subject: 'IPA', topic: 'Antariksa' },
    { ...base, id: '3', slug: 'rahasia', title: 'Rahasia Pecahan', state: 'draft' },
    { ...base, id: '4', slug: 'arsip', title: 'Arsip Pecahan', state: 'archived' },
  ];

  it('tidak pernah memunculkan draft dan arsip', () => {
    expect(filterPublishedCatalog(data, { query: '' }).map((x) => x.id)).toEqual(['1', '2']);
  });

  it('menerapkan pencarian dan filter gabungan', () => {
    const result = filterPublishedCatalog(data, { query: '  peCaHan ', kind: 'exercise', level: 'SD', grade: 'Kelas 4', subject: 'Matematika', topic: 'Pecahan' });
    expect(result.map((x) => x.id)).toEqual(['1']);
    expect(filterPublishedCatalog(data, { query: 'tidak-ada' })).toEqual([]);
  });

  it('menolak jenis konten tidak dikenal dari URL', () => {
    expect(parseKind('alien')).toBeUndefined();
    expect(parseKind('game')).toBe('game');
  });
});
