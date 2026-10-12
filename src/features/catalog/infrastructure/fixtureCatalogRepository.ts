import { filterPublishedCatalog } from '../application/filterCatalog';
import type { CatalogItem, CatalogRepository } from '../domain/catalog';

// Hanya fixture sintetis. Jangan gunakan sebagai authorization atau bukti katalog Supabase.
const items: readonly CatalogItem[] = [
  { id: 'demo-01', slug: 'mengenal-tata-surya', title: 'Mengenal Tata Surya', summary: 'Jelajahi planet dan benda langit di sekitar Matahari.', kind: 'material', state: 'published', level: 'SD', grade: 'Kelas 6', subject: 'IPA', topic: 'Antariksa' },
  { id: 'demo-02', slug: 'pecahan-sederhana', title: 'Latihan Pecahan Sederhana', summary: 'Contoh latihan memahami pecahan pada kehidupan sehari-hari.', kind: 'exercise', state: 'published', level: 'SD', grade: 'Kelas 4', subject: 'Matematika', topic: 'Pecahan' },
  { id: 'demo-03', slug: 'lkpd-rantai-makanan', title: 'LKPD Rantai Makanan', summary: 'Contoh lembar aktivitas mengamati ekosistem.', kind: 'worksheet', state: 'published', level: 'SD', grade: 'Kelas 5', subject: 'IPA', topic: 'Ekosistem' },
  { id: 'demo-04', slug: 'game-tebak-kata', title: 'Game Tebak Kata', summary: 'Contoh permainan mengenal kosakata Bahasa Indonesia.', kind: 'game', state: 'published', level: 'SD', grade: 'Kelas 4', subject: 'Bahasa Indonesia', topic: 'Kosakata' },
  { id: 'demo-05', slug: 'energi-dan-perubahannya', title: 'Energi dan Perubahannya', summary: 'Kenali berbagai bentuk energi dan pemanfaatannya.', kind: 'material', state: 'published', level: 'SMP', grade: 'Kelas 7', subject: 'IPA', topic: 'Energi' },
  { id: 'demo-06', slug: 'persamaan-linear', title: 'Latihan Persamaan Linear', summary: 'Latihan pengantar persamaan linear satu variabel.', kind: 'exercise', state: 'published', level: 'SMP', grade: 'Kelas 7', subject: 'Matematika', topic: 'Aljabar' },
  { id: 'draft-only', slug: 'rahasia-draf', title: 'Konten Belum Terbit', summary: 'Harus tersembunyi bagi pengunjung.', kind: 'material', state: 'draft', level: 'SD', grade: 'Kelas 6', subject: 'IPA', topic: 'Antariksa' },
];

export const fixtureCatalogRepository: CatalogRepository = {
  async listPublished(filters) {
    return filterPublishedCatalog(items, filters);
  },
  async getPublishedBySlug(slug) {
    return items.find((item) => item.slug === slug && item.state === 'published') ?? null;
  },
};

export const fixtureTaxonomy = {
  levels: ['SD', 'SMP'],
  grades: ['Kelas 4', 'Kelas 5', 'Kelas 6', 'Kelas 7'],
  subjects: ['Bahasa Indonesia', 'IPA', 'Matematika'],
  topics: ['Aljabar', 'Antariksa', 'Ekosistem', 'Energi', 'Kosakata', 'Pecahan'],
} as const;
