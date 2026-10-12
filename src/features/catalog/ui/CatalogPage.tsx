import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router';
import { useMemo } from 'react';
import { parseKind } from '../application/filterCatalog';
import { contentKinds, kindLabels, type CatalogFilters } from '../domain/catalog';
import { fixtureCatalogRepository, fixtureTaxonomy } from '../infrastructure/fixtureCatalogRepository';
import { ContentCard } from './ContentCard';
import { Button } from '../../../shared/ui/Button';
import { Alert } from '../../../shared/ui/Alert';
import { FilterChip } from '../../../shared/ui/FilterChip';

type FilterField = 'query' | 'kind' | 'level' | 'grade' | 'subject' | 'topic';

export function CatalogPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const filters = useMemo<CatalogFilters>(() => ({
    query: searchParams.get('query') ?? '',
    kind: parseKind(searchParams.get('kind')),
    level: searchParams.get('level') || undefined,
    grade: searchParams.get('grade') || undefined,
    subject: searchParams.get('subject') || undefined,
    topic: searchParams.get('topic') || undefined,
  }), [searchParams]);

  const catalog = useQuery({
    queryKey: ['published-catalog', filters],
    queryFn: () => fixtureCatalogRepository.listPublished(filters),
  });

  function setFilter(field: FilterField, value: string) {
    setSearchParams((previous) => {
      const next = new URLSearchParams(previous);
      if (value) next.set(field, value);
      else next.delete(field);
      return next;
    }, { replace: true });
  }

  return (
    <div className="container">
      <section className="hero" aria-labelledby="catalog-title">
        <span className="featured-label">✦ Jelajahi pengetahuan</span>
        <h1 id="catalog-title">Mau belajar apa hari ini?</h1>
        <p>Materi, latihan, LKPD, dan game edukatif dalam satu tempat.</p>
      </section>
      <div className="filters" role="search" aria-label="Pencarian dan filter katalog">
        <div className="form-field search-field">
          <label htmlFor="catalog-query">Cari materi atau topik</label>
          <input id="catalog-query" type="search" className="lb-input" placeholder="Contoh: tata surya, pecahan..." value={filters.query} onChange={(e) => setFilter('query', e.target.value)} />
        </div>
        {([
          ['level', 'Jenjang', fixtureTaxonomy.levels],
          ['grade', 'Kelas', fixtureTaxonomy.grades],
          ['subject', 'Mata pelajaran', fixtureTaxonomy.subjects],
          ['topic', 'Topik', fixtureTaxonomy.topics],
        ] as const).map(([key, label, options]) => (
          <div className="form-field" key={key}>
            <label htmlFor={'catalog-' + key}>{label}</label>
            <select id={'catalog-' + key} className="lb-input" value={filters[key] ?? ''} onChange={(e) => setFilter(key, e.target.value)}>
              <option value="">Semua {label.toLowerCase()}</option>
              {options.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </div>
        ))}
      </div>
      <div className="filter-heading">
        <h2>Jelajahi koleksi</h2>
        <Button variant="text" onClick={() => setSearchParams({})}>Reset filter</Button>
      </div>
      <div className="chips" role="group" aria-label="Jenis konten">
        <FilterChip active={!filters.kind} onClick={() => setFilter('kind', '')}>Semua</FilterChip>
        {contentKinds.map((kind) => (
          <FilterChip key={kind} active={filters.kind === kind} onClick={() => setFilter('kind', kind)}>{kindLabels[kind]}</FilterChip>
        ))}
      </div>
      {catalog.isPending ? <p role="status">Memuat koleksi contoh…</p>
      : catalog.isError ? <Alert>Gagal memuat katalog. <Button variant="text" onClick={() => void catalog.refetch()}>Coba lagi</Button></Alert>
      : catalog.data.length === 0 ? (
        <div className="empty-state" role="status">
          <h3>Belum ada konten yang cocok</h3>
          <p>Coba kata kunci lain atau hapus beberapa filter.</p>
          <Button onClick={() => setSearchParams({})}>Tampilkan semua</Button>
        </div>
      ) : (
        <>
          <p role="status" aria-live="polite">{catalog.data.length} contoh konten ditemukan.</p>
          <div className="catalog-grid">{catalog.data.map((item) => <ContentCard key={item.id} item={item} />)}</div>
        </>
      )}
    </div>
  );
}
