import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router';
import { Alert } from '../../../shared/ui/Alert';
import { Badge } from '../../../shared/ui/Badge';
import { Card } from '../../../shared/ui/Card';
import { kindLabels } from '../domain/catalog';
import { fixtureCatalogRepository } from '../infrastructure/fixtureCatalogRepository';

export function ContentDetailPage() {
  const { slug = '' } = useParams();
  const detail = useQuery({
    queryKey: ['published-detail', slug],
    queryFn: () => fixtureCatalogRepository.getPublishedBySlug(slug),
  });

  return <div className="container">
    <Card className="page-panel">
      <Link to="/">← Kembali ke katalog</Link>
      {detail.isPending ? <p role="status">Memuat detail…</p>
      : detail.isError ? <Alert>Detail tidak dapat dimuat. Coba buka kembali katalog.</Alert>
      : !detail.data ? <Alert>Konten tidak ditemukan atau belum diterbitkan.</Alert>
      : <>
        <p><Badge kind={detail.data.kind}>{kindLabels[detail.data.kind]}</Badge></p>
        <h1>{detail.data.title}</h1>
        <p>{detail.data.level} · {detail.data.grade} · {detail.data.subject} · {detail.data.topic}</p>
        <p>{detail.data.summary}</p>
        <Alert tone="success">Ini pratinjau katalog menggunakan data contoh. Isi materi belum tersedia dan tidak ada nilai atau jawaban yang disimpan.</Alert>
      </>}
    </Card>
  </div>;
}
