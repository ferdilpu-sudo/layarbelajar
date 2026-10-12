import { useState, type FormEvent } from 'react';
import { Link, Navigate } from 'react-router';
import { Alert } from '../../../shared/ui/Alert';
import { Button } from '../../../shared/ui/Button';
import { Card } from '../../../shared/ui/Card';
import { Input } from '../../../shared/ui/Input';
import { useIdentity } from '../application/IdentityProvider';

export function LoginPage() {
  const { session, login } = useIdentity();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  if (session)
    return (
      <Navigate to={session.identity.must_change_password ? '/ganti-password' : '/akun'} replace />
    );

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError('');
    try {
      await login(username, password);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Login gagal.');
    } finally {
      setPending(false);
    }
  }
  return (
    <div className="container">
      <Card className="page-panel">
        <h1>Masuk ke LayarBelajar</h1>
        <p>Gunakan username dan password dari admin sekolah. Tidak perlu email pribadi.</p>
        <form className="lb-account-form" onSubmit={(event) => void submit(event)}>
          <Input
            label="Username"
            required
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            autoComplete="username"
            maxLength={32}
          />
          <Input
            label="Password"
            type="password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
          />
          {error ? <Alert>{error}</Alert> : null}
          <Button type="submit" loading={pending} disabled={pending}>
            Masuk
          </Button>
        </form>
        <p className="lb-account-footnote">
          Sesi aktif diperbarui secara aman di tab ini. Memuat ulang halaman akan meminta login
          kembali.
        </p>
        <Link to="/">← Kembali ke katalog</Link>
      </Card>
    </div>
  );
}
