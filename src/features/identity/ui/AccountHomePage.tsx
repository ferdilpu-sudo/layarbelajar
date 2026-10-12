import { Link, Navigate } from 'react-router';
import { Button } from '../../../shared/ui/Button';
import { Card } from '../../../shared/ui/Card';
import { useIdentity } from '../application/IdentityProvider';

export function AccountHomePage() {
  const { session, logout } = useIdentity();
  if (!session) return <Navigate to="/login" replace />;
  if (session.identity.must_change_password) return <Navigate to="/ganti-password" replace />;
  return (
    <div className="container">
      <Card className="page-panel">
        <h1>Halo, {session.identity.username}</h1>
        <p>Role: {session.identity.role === 'admin' ? 'Admin' : session.identity.role === 'teacher' ? 'Guru' : 'Siswa'}.</p>
        <p>Fitur kelas dan sesi belum tersedia (M-005). Akun Anda berhasil diautentikasi.</p>
        <div className="lb-account-links">
          {session.identity.role === 'admin' ? <Link to="/admin/akun">Kelola akun guru dan siswa</Link> : null}
          <Link to="/ganti-password">Ganti password</Link>
          <Button variant="secondary" onClick={logout}>Keluar</Button>
        </div>
      </Card>
    </div>
  );
}
