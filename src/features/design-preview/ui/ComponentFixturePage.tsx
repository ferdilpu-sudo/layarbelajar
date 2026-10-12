import { useState } from 'react';
import { Alert } from '../../../shared/ui/Alert';
import { AnswerOption } from '../../../shared/ui/AnswerOption';
import { Button } from '../../../shared/ui/Button';
import { Dialog } from '../../../shared/ui/Dialog';
import { FilterChip } from '../../../shared/ui/FilterChip';
import { Input } from '../../../shared/ui/Input';
import { ContentCard } from '../../catalog/ui/ContentCard';
import type { CatalogItem, ContentKind } from '../../catalog/domain/catalog';

const examples: { kind: ContentKind; title: string }[] = [
  { kind: 'material', title: 'Materi mengenal energi dan kehidupan sehari-hari' },
  { kind: 'exercise', title: 'Latihan Matematika' },
  { kind: 'worksheet', title: 'LKPD IPA' },
  { kind: 'game', title: 'Game Kosakata' },
];

function exampleItem(kind: ContentKind, title: string): CatalogItem {
  return {
    id: kind,
    slug: 'fixture-' + kind,
    title,
    summary: 'Pratinjau komponen — data sintetis tanpa penyimpanan.',
    kind,
    state: 'published',
    level: 'SD',
    grade: 'Kelas 4',
    subject: 'IPA',
    topic: 'Percobaan',
  };
}

export function ComponentFixturePage() {
  const [filterSelected, setFilterSelected] = useState(true);
  const [answerSelected, setAnswerSelected] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <div className="container lb-fixture" data-testid="ui-fixture">
      <div className="hero">
        <span className="featured-label">Hanya lingkungan pengembangan</span>
        <h1>Uji komponen LayarBelajar</h1>
        <p>Fixture untuk memeriksa tampilan dan aksesibilitas; bukan materi atau sesi sungguhan.</p>
      </div>
      <section className="lb-fixture-section" aria-labelledby="button-states">
        <h2 id="button-states">Tombol dan status</h2>
        <div className="lb-fixture-row">
          <Button>Utama</Button>
          <Button variant="secondary">Sekunder</Button>
          <Button disabled>Nonaktif</Button>
          <Button loading>Memproses</Button>
          <Button onClick={() => setDialogOpen(true)}>Buka dialog</Button>
        </div>
      </section>
      <section className="lb-fixture-section" aria-labelledby="form-states">
        <h2 id="form-states">Kolom, chip, dan pilihan</h2>
        <div className="lb-fixture-fields">
          <Input label="Judul materi" placeholder="Masukkan judul" />
          <Input label="Judul wajib" error="Judul wajib diisi" placeholder="Wajib diisi" />
        </div>
        <div className="lb-fixture-row">
          <FilterChip active={filterSelected} onClick={() => setFilterSelected(!filterSelected)}>Materi</FilterChip>
          <AnswerOption selected={answerSelected} onClick={() => setAnswerSelected(!answerSelected)}>Pilihan A</AnswerOption>
          <AnswerOption selected={false} disabled onClick={() => undefined}>Pilihan nonaktif</AnswerOption>
        </div>
      </section>
      <section className="lb-fixture-section" aria-labelledby="alert-states">
        <h2 id="alert-states">Notifikasi</h2>
        <div className="lb-fixture-alerts">
          <Alert tone="success">Berhasil menyimpan contoh (fixture).</Alert>
          <Alert>Gagal memuat contoh (fixture).</Alert>
        </div>
      </section>
      <section className="lb-fixture-section" aria-labelledby="card-states">
        <h2 id="card-states">Pemetaan kategori</h2>
        <div className="catalog-grid lb-fixture-grid">
          {examples.map(({ kind, title }) => <ContentCard key={kind} item={exampleItem(kind, title)} />)}
        </div>
      </section>
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} title="Contoh dialog">
        <p>Tekan Escape atau tombol Tutup untuk kembali ke pemicu.</p>
      </Dialog>
    </div>
  );
}
