# M-002 — Staging Supabase, runbook non-mutatif

**Status: hosted positive/negative CORS PASS; key-scoped hosted Auth policy/RLS preflight NOT RUN.** Project `qfkjcjzwhewsbblgumco` sudah aktif; kedua fungsi `account-admin` dan `change-password` ACTIVE version 1, `verify_jwt=true`. Ini belum membuktikan hosted login/CORS. Jangan mengulang deployment hanya karena instruksi prasyarat di bawah.

## Prasyarat

1. Buat/otorisasi sebuah project **khusus staging** milik pemilik, terpisah dari database produksi dan data siswa asli. Jangan membuat project berbayar atau mengaktifkan billing otomatis. Gunakan hanya akun uji sintetis saat tahap mutatif berikutnya.
2. **Deploy Edge Functions telah selesai pada 13 Oktober 2026; jangan deploy ulang tanpa perubahan source.** Masih harus konfigurasi `APP_ALLOWED_ORIGINS` pada secret Edge ke **origin HTTPS frontend staging persis**, setelah site staging benar-benar tersedia.
3. Supabase Hosted Auth: disable pendaftaran publik di pengaturan global, namun biarkan email/password sign-in tersedia untuk akun provisioning. Pastikan alias `@accounts.invalid` kompatibel sebelum memasukkan user nyata.
4. Di GitHub repository **ferdilpu-sudo/layarbelajar** → **Settings → Environments → staging → Environment secrets**, tambahkan satu secret bernama **`STAGING_ANON_KEY`**: legacy JWT public **anon** dari project Supabase staging. Jangan gunakan `service_role` atau `sb_publishable_...`, jangan taruh nilainya pada Variables atau kirim lewat chat. Environment harus bernama **`staging`** (huruf kecil); proteksi/reviewer tetap sesuai kebijakan pemilik.

Tiga konfigurasi **non-rahasia** sudah dipatok langsung dalam workflow dan diperiksa ulang oleh script: `STAGING_PROJECT_REF=qfkjcjzwhewsbblgumco`, `STAGING_SUPABASE_URL=https://qfkjcjzwhewsbblgumco.supabase.co`, dan `STAGING_APP_ORIGIN=https://layarbelajar.pages.dev`. Tidak perlu membuat Environment variables untuk ketiganya. `APP_ALLOWED_ORIGINS` di Supabase Edge adalah **konfigurasi terpisah** dan tidak mengisi GitHub Environment secret.

**Tidak** menambahkan `SUPABASE_SERVICE_ROLE_KEY` sebagai secret workflow preflight. Workflow `.github/workflows/staging-preflight.yml` tidak menggunakan akun siswa/guru, password, atau token admin.

## Jalankan dan nilai hasil

- GitHub → Actions → **M-002 Hosted Staging Preflight (Read Only)** → Run workflow pada `main`. Jika repo belum memiliki environment/values, job akan gagal dengan `STAGING_PREFLIGHT_BLOCKED`; ini **bukan** bukti hosted PASS.
- Script `node scripts/staging-preflight.mjs` memvalidasi ref/HTTPS, tipe public anon JWT, `GET /auth/v1/health`, GET profil anonim (harus 403 atau `[]`), serta OPTIONS CORS origin disetujui dan origin asing untuk dua Edge Functions. Tidak menggunakan POST/PATCH/DELETE, tidak membuat akun, tidak melakukan deployment atau reset data.
- Harus terlihat **5 PASS** dan `STAGING_READONLY_PASS`. Jika CORS/anon RLS gagal, jangan lanjut operasi akun di hosted sampai konfigurasi diperbaiki dan gate diulang.
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

## Cloudflare HTTPS origin deployment preparation

Cloudflare Pages owner-only setup is described in [docs/m002-cloudflare-pages-staging.md](./m002-cloudflare-pages-staging.md). Use `npm run build:pages:staging` and enter a real verified `VITE_APP_URL` before the production build of the *staging-only Pages site*. Never guess a `*.pages.dev` hostname; setting Edge `APP_ALLOWED_ORIGINS` is deliberately postponed until that hostname is verified. Current HTTP public smoke only proves negative no-key/foreign-Origin guards; **positive CORS remains NOT RUN**.

## Next gate after confirmed CORS — 13 October 2026

- [Live smoke 38356097250](https://github.com/ferdilpu-sudo/layarbelajar/actions/runs/38356097250) **5/5 offline PASS and 7/7 hosted HTTP PASS**. Exact Pages Origin is now proven effective in Edge CORS.
- Direct staging SQL read-only inspection: `auth.users=0`, `profiles=0`, RLS enabled, anon SELECT not granted, authenticated SELECT granted, authenticated writes denied; security advisors report **0 lints**. This is database metadata, **not** proof of hosted HTTP access with anon JWT.
- Enhanced `scripts/staging-preflight.mjs` requires the confirmed staging ref/origin, legacy public **anon** JWT from the GitHub `staging` Environment, GET GoTrue `/health` and `/settings` (must be `disable_signup=true`, `external.email=true`), GET anonymous `profiles` and OPTIONS CORS for both functions. **All requests remain GET/OPTIONS without user creation or passwords.**
- This enhanced workflow is **NOT RUN on hosted** until GitHub Environment configuration is present and the owner manually dispatches it from merged `main`. Never paste an API key into Git, issue comments or chat. Any policy mismatch blocks subsequent synthetic account tests. M-002 remains IN PROGRESS.

## Missing configuration incident — 13 Oktober 2026

- Runs [38370408344](https://github.com/ferdilpu-sudo/layarbelajar/actions/runs/38370408344) dan [38409543139](https://github.com/ferdilpu-sudo/layarbelajar/actions/runs/38409543139) **FAIL sebelum koneksi hosted**: seluruh tiga vars dan secret GitHub terdeteksi kosong pada runner, `STAGING_PREFLIGHT_BLOCKED: Required staging configuration is missing`.
- Perbaikan berikutnya mematok tiga nilai publik pada job GitHub Actions dan mempertahankan **satu secret** `STAGING_ANON_KEY` dari environment `staging`. Jika belum tersedia, error spesifik muncul tanpa mencetak nilai secret.
- **Gate hosted Auth policy/RLS tetap NOT RUN**, bukan FAIL dari Supabase; validasi ulang melalui workflow pada `main` setelah perubahan merged dan secret pemilik tersedia. Tidak ada mutasi akun/data.
