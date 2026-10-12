import { useState, type FormEvent } from 'react';
import { Link, Navigate } from 'react-router';
import { Alert } from '../../../shared/ui/Alert';
import { Button } from '../../../shared/ui/Button';
import { Card } from '../../../shared/ui/Card';
import { Input } from '../../../shared/ui/Input';
import { useIdentity } from '../application/IdentityProvider';
import { functionCall, refreshIdentity } from '../infrastructure/accountApi';

export function ChangePasswordPage() {
  const { session, updateSession } = useIdentity();
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  const [success, setSuccess] = useState(false);
  if (!session) return <Navigate to="/login" replace />;
  if (success) return <Navigate to="/akun" replace />;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    if (newPassword.length < 12 || oldPassword === newPassword) {
      setError('Password baru minimal 12 karakter dan harus berbeda.');
      return;
    }
    setPending(true);
    try {
      await functionCall(session!.accessToken, 'change-password', {
        old_password: oldPassword,
        new_password: newPassword,
      });
      const identity = await refreshIdentity(session!.accessToken);
      updateSession({ accessToken: session!.accessToken, identity });
      setOldPassword('');
      setNewPassword('');
      setSuccess(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Perubahan password gagal.');
    } finally {
      setPending(false);
    }
  }
  return (
    <div className="container">
      <Card className="page-panel">
        <h1>Ganti password</h1>
        <p>
          {session.identity.must_change_password
            ? 'Password sementara harus diganti sebelum mengakses fitur akun.'
            : 'Ubah password dengan memasukkan password lama.'}
        </p>
        <form className="lb-account-form" onSubmit={(event) => void submit(event)}>
          <Input
            label="Password lama"
            type="password"
            autoComplete="current-password"
            required
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
          />
          <Input
            label="Password baru (12 karakter atau lebih)"
            type="password"
            autoComplete="new-password"
            required
            minLength={12}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          {error ? <Alert>{error}</Alert> : null}
          <Button type="submit" disabled={pending} loading={pending}>
            Simpan password baru
          </Button>
        </form>
        <Link to="/akun">← Kembali ke akun</Link>
      </Card>
    </div>
  );
}
