import { Link } from 'react-router';
import { Card } from '../../../shared/ui/Card';

export function LoginPlaceholder({ join = false }: { join?: boolean }) {
  return (
    <div className="container">
      <Card className="page-panel">
        <h1>{join ? 'Gabung sesi kelas' : 'Masuk ke LayarBelajar'}</h1>
        <p>
          Fitur akun dan sesi baru akan tersedia setelah integrasi Supabase pada M-002 dan M-005.
        </p>
        <p>
          Tampilan ini hanya penanda fitur yang belum aktif. Belum ada formulir login atau kode sesi
          yang diproses.
        </p>
        <Link to="/">← Kembali ke katalog</Link>
      </Card>
    </div>
  );
}
