import { Link } from 'react-router';
import { Card } from '../shared/ui/Card';

export function NotFoundPage() {
  return <div className="container"><Card className="page-panel">
    <h1>Halaman tidak ditemukan</h1>
    <p>Alamat yang dibuka tidak tersedia.</p>
    <Link to="/">Kembali ke katalog</Link>
  </Card></div>;
}
