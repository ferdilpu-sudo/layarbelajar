# M-002 — Staging Supabase, runbook non-mutatif

**Status: STAGING PROJECT + EDGE DEPLOYED / HTTP ACCEPTANCE NOT RUN.** Project `qfkjcjzwhewsbblgumco` sudah aktif; kedua fungsi `account-admin` dan `change-password` ACTIVE version 1, `verify_jwt=true`. Ini belum membuktikan hosted login/CORS. Jangan mengulang deployment hanya karena instruksi prasyarat di bawah.

## Prasyarat

1. Buat/otorisasi sebuah project **khusus staging** milik pemilik, terpisah dari database produksi dan data siswa asli. Jangan membuat project berbayar atau mengaktifkan billing otomatis. Gunakan hanya akun uji sintetis saat tahap mutatif berikutnya.
2. **Deploy Edge Functions telah selesai pada 13 Oktober 2026; jangan deploy ulang tanpa perubahan source.** Masih harus konfigurasi `APP_ALLOWED_ORIGINS` pada secret Edge ke **origin HTTPS frontend staging persis**, setelah site staging benar-benar tersedia.
3. Supabase Hosted Auth: disable pendaftaran publik di pengaturan global, namun biarkan email/password sign-in tersedia untuk akun provisioning. Pastikan alias `@accounts.invalid` kompatibel sebelum memasukkan user nyata.
4. Di GitHub repository, siapkan **Environment** bernama `staging`, set protection/reviewer yang sesuai dan nilai berikut di Environment (jangan menaruhnya dalam git atau chat):

| Nama | Jenis | Contoh/batas |
|---|---|---|
| `STAGING_PROJECT_REF` | Variable | Reference Supabase staging, huruf/angka 8–40 |
| `STAGING_SUPABASE_URL` | Variable | `https://<ref>.supabase.co` (tanpa slash tambahan) |
| `STAGING_APP_ORIGIN` | Variable | Origin HTTPS frontend staging, tanpa path/query |
| `STAGING_ANON_KEY` | Secret | JWT legacy dengan role `anon` (BUKAN service_role) |

**Tidak** menambahkan `SUPABASE_SERVICE_ROLE_KEY` sebagai secret workflow preflight. Workflow `.github/workflows/staging-preflight.yml` hanya menggunakan nilai di atas, tanpa identitas guru/siswa, password, atau token admin.

## Jalankan dan nilai hasil

- GitHub → Actions → **M-002 Hosted Staging Preflight (Read Only)** → Run workflow pada `main`. Jika repo belum memiliki environment/values, job akan gagal dengan `STAGING_PREFLIGHT_BLOCKED`; ini **bukan** bukti hosted PASS.
- Script `node scripts/staging-preflight.mjs` memvalidasi ref/HTTPS, tipe public anon JWT, `GET /auth/v1/health`, GET profil anonim (harus 403 atau `[]`), serta OPTIONS CORS origin disetujui dan origin asing untuk dua Edge Functions. Tidak menggunakan POST/PATCH/DELETE, tidak membuat akun, tidak melakukan deployment atau reset data.
- Harus terlihat **4 PASS** dan `STAGING_READONLY_PASS`. Jika CORS/anon RLS gagal, jangan lanjut operasi akun di hosted sampai konfigurasi diperbaiki dan gate diulang.
- Kunci modern `sb_publishable_...` **sengaja ditolak** gate awal: aplikasi sekarang menggunakan bearer anon JWT untuk Edge `verify_jwt=true`. Migrasi ke model key baru harus dibuktikan melalui tes integrasi terpisah; jangan menggunakan service_role key sebagai pengganti.
- Unit `npm run test:staging-preflight` berjalan offline dan **tidak membuktikan staging tersambung**.

## Penerimaan sesudah preflight

Dengan persetujuan pemilik, siapkan akun sintetis staging dan pengujian end-to-end untuk: provisioning admin→guru/siswa, duplikasi, ganti/reset password, akses lintas role, deactivate dan JWT lama, refresh rotation/focus/resume/logout, origin negatif, pemulihan gagal dan rate-limit, serta backup/restore. Uji Windows bootstrap lokal dari terminal pemilik, tanpa mengekspos password. Simpan screenshot/trace yang tidak memuat kredensial; tidak boleh mempublikasikan secret. Reviewer merekam hasil per gate di `docs/m002-hosted-acceptance.md`.

**M-002 tidak boleh dinyatakan Verified dari preflight read-only saja.**

## Evidence deploy / penahan berikutnya (13 Oktober 2026)

- Kode hosted kedua Edge Functions identik dengan `9330e679`, aktif version 1, JWT verification enabled; 0 Auth users dan 0 profiles pada checkpoint.
- Jangan menjalankan `db push` otomatis karena hosted schema migration version `20261012154806` tidak sama dengan file Git `20261012060000`. Review histori lebih dulu.
- **Jangan menganggap manual preflight sudah dijalankan.** Tidak ada HTTPS frontend origin terverifikasi dan izin Auth self-signup hosted belum dicek; isi kedua konfigurasi secara aman sebelum menjalankan workflow manual dan acceptance akun sintetis.

## Public, no-secret staging smoke (13 Oktober 2026)

[GitHub Actions 38334648904](https://github.com/ferdilpu-sudo/layarbelajar/actions/runs/38334648904) menghasilkan 3 offline tests PASS dan 5 actual no-credential GET/OPTIONS checks PASS untuk endpoint staging. Run `node scripts/staging-public-smoke.mjs` tersedia tanpa environment/secret tambahan; workflow `M-002 Hosted Public Smoke (No Credentials)` menyediakan manual dispatch dan PR trigger **hanya ketika kode/script smoke berubah**. Ini **bukan** preflight penuh dengan approved origin, dan bukan hosted Auth acceptance. GoTrue health tanpa API key menghasilkan HTTP 401; jangan tulis GoTrue health 200.
