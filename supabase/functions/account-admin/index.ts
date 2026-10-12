import { backend, bodyObject, dataRecord, failure, getTarget, HttpFailure, identify, methodAndOrigin, normalizedUsername, reply, temporaryPassword, updateProfile } from '../_shared/accounts.ts';

Deno.serve(async (req: Request) => {
  const guard = methodAndOrigin(req, ['POST']);
  if (guard) return guard;
  try {
    await identify(req, true);
    const input = await bodyObject(req);
    const action = input.action;
    if (action === 'provision') {
      const username = normalizedUsername(input.username);
      const displayName = input.display_name;
      const role = input.role;
      if (typeof displayName !== 'string' || displayName.trim() !== displayName || displayName.length < 1 || displayName.length > 80 || (role !== 'teacher' && role !== 'student')) {
        throw new HttpFailure(400, 'VALIDATION_ERROR', 'Nama tampilan atau peran tidak valid.');
      }
      const password = temporaryPassword();
      const created = await backend('/auth/v1/admin/users', {
        service: true, method: 'POST',
        body: { email: username + '@accounts.invalid', email_confirm: true, password },
      });
      if (!created.ok) {
        if (created.status === 422 || created.status === 409) throw new HttpFailure(409, 'CONFLICT', 'Username sudah digunakan.');
        throw new HttpFailure(500, 'INTERNAL_ERROR', 'Akun belum berhasil dibuat.');
      }
      const id = dataRecord(created.data).id;
      if (typeof id !== 'string') throw new HttpFailure(500, 'INTERNAL_ERROR', 'Respons pembuatan akun tidak valid.');
      const profile = await backend('/rest/v1/profiles', {
        service: true, method: 'POST',
        body: { id, username, display_name: displayName, role, active: true, must_change_password: true },
      });
      if (!profile.ok) {
        const rollback = await backend('/auth/v1/admin/users/' + id, { service: true, method: 'DELETE' });
        if (!rollback.ok) console.error('Reconcile orphan Auth user:', id);
        throw new HttpFailure(profile.status === 409 ? 409 : 500, profile.status === 409 ? 'CONFLICT' : 'INTERNAL_ERROR', 'Akun belum berhasil disiapkan.');
      }
      return reply(req, 200, { data: { id, username, role, temporary_password: password } });
    }
    if (action === 'reset-password' || action === 'deactivate') {
      const target = await getTarget(input.user_id);
      if (target.role === 'admin') throw new HttpFailure(403, 'FORBIDDEN', 'Perubahan akun admin harus melalui prosedur pemilik.');
      if (action === 'deactivate') {
        await updateProfile(target.id, { active: false });
        return reply(req, 200, { data: { id: target.id, active: false } });
      }
      if (!target.active) throw new HttpFailure(409, 'CONFLICT', 'Akun sudah dinonaktifkan.');
      // Fail closed: block data before changing Auth password.
      await updateProfile(target.id, { must_change_password: true });
      const password = temporaryPassword();
      const reset = await backend('/auth/v1/admin/users/' + target.id, {
        service: true, method: 'PUT', body: { password },
      });
      if (!reset.ok) throw new HttpFailure(500, 'INTERNAL_ERROR', 'Reset gagal. Akun dikunci untuk keamanan; hubungi admin.');
      return reply(req, 200, { data: { id: target.id, temporary_password: password, must_change_password: true } });
    }
    throw new HttpFailure(400, 'VALIDATION_ERROR', 'Aksi tidak dikenal.');
  } catch (error) { return failure(req, error); }
});
