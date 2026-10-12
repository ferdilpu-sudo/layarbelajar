import { backend, bodyObject, dataRecord, failure, HttpFailure, identify, methodAndOrigin, passwordValid, reply, updateProfile } from '../_shared/accounts.ts';

Deno.serve(async (req: Request) => {
  const guard = methodAndOrigin(req, ['GET', 'POST']);
  if (guard) return guard;
  try {
    const profile = await identify(req);
    if (req.method === 'GET') {
      // Authenticated user may read only readiness, including when ordinary profile RLS blocks pending accounts.
      return reply(req, 200, { data: { username: profile.username, role: profile.must_change_password ? null : profile.role, must_change_password: profile.must_change_password } });
    }
    const input = await bodyObject(req);
    if (!passwordValid(input.old_password) || !passwordValid(input.new_password) || input.old_password === input.new_password) {
      throw new HttpFailure(400, 'VALIDATION_ERROR', 'Password baru harus berbeda dan minimal 12 karakter.');
    }
    // Check current secret against GoTrue, never user-supplied id/email or JWT metadata.
    const checked = await backend('/auth/v1/token?grant_type=password', {
      method: 'POST',
      body: { email: profile.username + '@accounts.invalid', password: input.old_password },
    });
    const verifiedId = dataRecord(dataRecord(checked.data).user).id;
    if (!checked.ok || verifiedId !== profile.id) throw new HttpFailure(403, 'FORBIDDEN', 'Password lama tidak sesuai.');
    const changed = await backend('/auth/v1/admin/users/' + profile.id, {
      service: true, method: 'PUT', body: { password: input.new_password },
    });
    if (!changed.ok) throw new HttpFailure(500, 'INTERNAL_ERROR', 'Password gagal diubah.');
    // Keep the account blocked if profile patch fails; never clear flag before Auth succeeds.
    await updateProfile(profile.id, { must_change_password: false });
    return reply(req, 200, { data: { must_change_password: false } });
  } catch (error) { return failure(req, error); }
});
