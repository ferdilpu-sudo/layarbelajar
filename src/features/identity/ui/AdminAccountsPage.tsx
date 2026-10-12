import { useState, type FormEvent } from 'react';
import { Link, Navigate } from 'react-router';
import { Alert } from '../../../shared/ui/Alert';
import { Button } from '../../../shared/ui/Button';
import { Card } from '../../../shared/ui/Card';
import { Input } from '../../../shared/ui/Input';
import { useIdentity } from '../application/IdentityProvider';
import { functionCall, type Role } from '../infrastructure/accountApi';

export function AdminAccountsPage() {
  const { session } = useIdentity();
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [role, setRole] = useState<'teacher' | 'student'>('student');
  const [userId, setUserId] = useState('');
  const [action, setAction] = useState<'reset-password' | 'deactivate'>('reset-password');
  const [temporaryPassword, setTemporaryPassword] = useState('');
  const [result, setResult] = useState('');
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  if (!session) return <Navigate to="/login" replace />;
  if (session.identity.must_change_password) return <Navigate to="/ganti-password" replace />;
  if (session.identity.role !== 'admin') return <Navigate to="/akun" replace />;

  async function perform(body: Record<string, unknown>) {
    setPending(true); setError(''); setTemporaryPassword(''); setResult('');
    try {
      const data = await functionCall(session!.accessToken, 'account-admin', body);
      if (typeof data.temporary_password === 'string') setTemporaryPassword(data.temporary_password);
      setResult('Operasi akun berhasil. Simpan password sementara sekarang jika ada; tidak akan ditampilkan ulang.');
      setUserId(typeof data.id === 'string' ? data.id : '');
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Operasi akun gagal.'); }
    finally { setPending(false); }
  }
  function provision(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void perform({ action: 'provision', username, display_name: displayName, role });
  }
  function manage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (action === 'deactivate' && !window.confirm('Nonaktifkan akun ini? Akses data akan diblokir.')) return;
    void perform({ action, user_id: userId });
  }
  return (
    <div className="container lb-admin-accounts">
      <h1>Kelola akun</h1>
      <p>Hanya admin. Password sementara ditampilkan sekali; jangan membagikannya melalui kanal publik.</p>
      <div className="lb-account-columns">
        <Card className="lb-account-panel">
          <h2>Buat akun baru</h2>
          <form className="lb-account-form" onSubmit={provision}>
            <Input label="Username baru" required minLength={3} maxLength={32} value={username} onChange={(e) => setUsername(e.target.value)} />
            <Input label="Nama tampilan" required maxLength={80} value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
            <div className="form-field">
              <label htmlFor="account-role">Peran</label>
              <select id="account-role" className="lb-input" value={role} onChange={(e) => setRole(e.target.value as Role === 'teacher' ? 'teacher' : 'student')}>
                <option value="student">Siswa</option><option value="teacher">Guru</option>
              </select>
            </div>
            <Button type="submit" loading={pending} disabled={pending}>Buat akun</Button>
          </form>
        </Card>
        <Card className="lb-account-panel">
          <h2>Kelola akun berdasarkan ID</h2>
          <p>ID akun tersedia setelah pembuatan. Pencarian daftar pengguna akan disediakan pada pengembangan berikut.</p>
          <form className="lb-account-form" onSubmit={manage}>
            <Input label="ID akun" required value={userId} onChange={(e) => setUserId(e.target.value)} />
            <div className="form-field">
              <label htmlFor="account-action">Tindakan</label>
              <select id="account-action" className="lb-input" value={action} onChange={(e) => setAction(e.target.value === 'deactivate' ? 'deactivate' : 'reset-password')}>
                <option value="reset-password">Reset password sementara</option>
                <option value="deactivate">Nonaktifkan akun</option>
              </select>
            </div>
            <Button type="submit" variant="secondary" disabled={pending} loading={pending}>Jalankan</Button>
          </form>
        </Card>
      </div>
      {error ? <Alert>{error}</Alert> : null}
      {result ? <Alert tone="success">{result}</Alert> : null}
      {temporaryPassword ? (
        <div className="lb-one-time-secret" role="status">
          <p>Password sementara (hanya sekali tampil):</p>
          <code>{temporaryPassword}</code>
          <Button variant="secondary" onClick={() => { void navigator.clipboard?.writeText(temporaryPassword); }}>Salin password</Button>
          <Button variant="text" onClick={() => setTemporaryPassword('')}>Sembunyikan</Button>
        </div>
      ) : null}
      <Link to="/akun">← Kembali ke akun</Link>
    </div>
  );
}
