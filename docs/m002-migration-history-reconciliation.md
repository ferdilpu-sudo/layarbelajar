# M-002 — Audit dan rekonsiliasi versi migrasi staging

**Tanggal audit:** 14 Oktober 2026. **Lingkup:** Supabase *staging* project `qfkjcjzwhewsbblgumco` dan sumber Git `main` sebelum PR ini. Tidak ada operasi tulis ke hosted database.

## Temuan terukur

- Sebelum PR: Git `supabase/migrations/20261012060000_profiles_foundation.sql`; hosted `supabase_migrations.schema_migrations`: satu rekaman `20261012154806 / profiles_foundation`.
- SQL lengkap dari kolom `statements[1]` pada histori hosted dibandingkan langsung dengan isi Git: **sama persis (2317 karakter, termasuk whitespace)**. Tidak ditemukan perbedaan isi migrasi.
- Verifikasi read-only terhadap objek aktual: enum `public.app_role` (admin/teacher/student), `public.profiles` (7 kolom), semua 5 constraint termasuk FK cascade, RLS aktif, satu policy SELECT untuk pemilik akun siap/aktif, grants klien SELECT-only, dan helper `private.profile_ready_v1` (SECURITY DEFINER dengan `search_path=''`, tidak dapat dieksekusi oleh anon) sesuai SQL.
- Saat audit: `auth.users=0`, `public.profiles=0`, akun uji `lbqa_win_%=0`, Supabase Security Advisor: 0 temuan.

Audit membuktikan isi migrasi dan sejumlah objek utama yang diperiksa sejalan. Ini **bukan** verifikasi backup/restore, migrasi lintas versi DB yang sudah terisi data, atau izin untuk deploy produksi.

## Perbaikan source-only pada PR ini

Rename tanpa perubahan byte konten:

```text
supabase/migrations/20261012060000_profiles_foundation.sql
    -> supabase/migrations/20261012154806_profiles_foundation.sql
```

**Alasan:** histori hosted sudah mencatat versi baru dengan SQL identik. Menyamakan file sumber dengan histori yang sudah diterapkan lebih minim risiko daripada mengedit `supabase_migrations` atau menjalankan ulang DDL yang telah ada.

**Tidak dilakukan:** `supabase migration repair`, `supabase db push`, `supabase db reset` di hosted, perubahan skema/RLS, penghapusan user, atau penulisan histori hosted. Tidak ada secret dikomit.

## Verifikasi wajib dan batas aman

1. Periksa PR diff: hanya perubahan nama file migrasi (konten identik) dan dokumentasi.
2. Jalankan Foundation CI dan backend Supabase lokal dari clean database pada branch/PR; catat run serta commit. Hasil runtime **NOT RUN** sampai CI benar-benar mengonfirmasi.
3. Setelah merge, di workstation yang terhubung ke **staging** (bukan production), jalankan `supabase migration list` sebagai **read-only**. Pastikan baris `20261012154806` ada di LOCAL dan REMOTE tanpa versi tertinggal. Tidak perlu menjalankan `db push` jika tidak ada migrasi baru.
4. Checkout development lokal yang pernah mencatat versi `20261012060000` akan memiliki histori lokal lama. Jangan memaksa apply ulang migrasi. Audit `supabase migration list --local`; hanya untuk **database lokal yang disposable**, `supabase db reset --local` boleh dipakai untuk menyiapkan state bersih, setelah menyadari bahwa data lokal akan hilang. Jika berisi data yang harus dipertahankan, gunakan strategi backup/reconciliation terpisah.
5. Jika histori/objek remote berbeda dari bukti di atas saat inspeksi ulang: **STOP**. Jangan mengaktifkan deploy migrasi otomatis. Selidiki dulu selisihnya dan siapkan rencana recovery.

Dokumentasi resmi: [database migrations](https://supabase.com/docs/guides/deployment/database-migrations) dan [migration repair](https://supabase.com/docs/reference/cli/supabase-migration-repair). Perintah repair mengubah histori dan **tidak diperlukan** untuk solusi source-only ini.

## Status gate

**Audit kesetaraan SQL dan schema utama: PASS (read-only).** Rename Git: menunggu merge + CI dan verifikasi `migration list` dari workstation. M-002 tetap **IN PROGRESS / NOT VERIFIED** karena Windows bootstrap interaktif, backup/restore, batas layanan dan signoff belum lengkap.