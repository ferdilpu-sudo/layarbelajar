# Rencana Implementasi — LayarBelajar

Status per 12 Oktober 2026: **M-001 Verified (fondasi + katalog fixture)** berdasarkan CI dan review screenshot; **M-002 In progress / TASK-006**; M-003–M-007 Not started. Verifikasi ini BUKAN klaim autentikasi, Supabase, katalog DB, kelas, penilaian, IFP nyata, atau produksi sudah tersedia. Kerjakan bertahap dengan fitur vertikal yang dapat diuji. Semua Must pada [prd](./prd.md) diperlukan untuk rilis siap pakai, bukan hanya halaman katalog.

## Milestone dan gate

| ID | Tujuan | Dependensi | Deliverable | REQ | Gate keluar |
|---|---|---|---|---|---|
| M-001 | Scaffold dan katalog contoh | Tidak ada | React/Vite/TS/Tailwind, token soft brutalism, komponen dasar, router, query boundary, UI katalog fixture, CI dasar | REQ-001, REQ-014 | Build/lint/type/unit lulus; bagian UI TEST-001 dan token/komponen TEST-014 berjalan; versi tool dicatat |
| M-002 | Identitas dan backend dasar | M-001 | Supabase lokal, profile/RLS, akun username, bootstrap admin, reset/deaktivasi | REQ-002 | TEST-002 lulus termasuk alias spike, RLS negatif dan kegagalan provision |
| M-003 | Katalog nyata dan authoring | M-002 | Taxonomy, revisi, aset, bank soal lima tipe, publish/arsip, katalog DB | REQ-001, REQ-003, REQ-004, REQ-005 | TEST-001/003/004/005 lulus; migrasi bersih/upgrade dan akses publik diverifikasi |
| M-004 | LKPD, game dan IFP | M-003 | LKPD/print, HTML player sandbox, mode presentasi/demo, sentuh | REQ-006, REQ-007, REQ-008 | TEST-006 bagian print, TEST-007/008 lulus; game negative tests dan print QA |
| M-005 | Kelas dan sesi langsung | M-004 | Membership, kode, join, state machine, Realtime/reconnect, submit jawaban | REQ-009, REQ-010, REQ-011 | TEST-009/010 dan concurrency TEST-011 lulus dengan 9 context |
| M-006 | Penilaian dan rekap lengkap | M-005 | Scoring server, uraian manual, riwayat/final score, rekap cetak | REQ-006, REQ-011, REQ-012 | TEST-006 digital, TEST-011/012 lulus; seluruh lima tipe diuji end-to-end |
| M-007 | Operasional dan rilis | M-006 | Pemakaian storage, backup/restore, konfigurasi Free, verifikasi perangkat, deployment berizin | REQ-013, seluruh REQ | TEST-001..014 lulus; IFP nyata, restore dan gate CI berhasil; akses produksi tersedia |

## M-001 — tugas pertama yang dapat dieksekusi

1. TASK-001: baca seluruh dokumen, inventaris repo jika sudah ada. Verifikasi Node LTS serta versi kompatibel framework/tool; catat pada ADR-001 dan lockfile. Jangan membuat akun layanan atau membeli domain.
2. TASK-002: scaffold React/TypeScript/Vite, Tailwind, router, formatter/linter, strict TS, Vitest/Testing Library dan Playwright. Buat scripts README; pastikan npm run build berhasil sebelum fitur berikut.
3. TASK-003: buat catalog domain contract/repository port dan fixture adapter; buat halaman katalog/filter/empty state. Jangan query Supabase dari komponen. Uji pencarian, gabungan filter dan reset sebagai bagian TEST-001.
4. TASK-004: buat token design.md, komponen bersama, wordmark LayarBelajar dan shell soft brutalism responsif 360 px/IFP, login placeholder yang jelas belum aktif, error boundary dan route not-found. Jangan membuat login pura-pura sebagai fitur selesai.
5. TASK-005: jalankan format/lint/type/unit/build dan E2E katalog; catat hasil aktual. Perbarui README dari “direncanakan” hanya untuk perintah yang sudah diuji. M-001 verified belum berarti REQ-001 backend selesai.

## Tugas milestone berikut

- TASK-006 (M-002): jalankan Supabase lokal, migrasi profiles/grants, bootstrap admin lokal, fixture sintetis dan test alias Auth. Pastikan login username benar-benar bekerja sebelum melanjutkan editor.
- TASK-007 (M-002): Edge provisioning/reset/deactivate/change-password, RLS aktif/role/password flag, UI akun. Uji grant escalation dan akun yatim.
- TASK-008 (M-003): migrasi taxonomy/content/revision/assets, Storage policy, editor blok dan katalog repository nyata. Pertahankan kontrak fixture sebagai test double.
- TASK-009 (M-003): bank lima tipe soal dan keys privat, snapshot revisi, publish atomik, konflik versi. Uji perubahan soal lama tidak mengubah snapshot.
- TASK-010 (M-004): LKPD/cetak, renderer tiap tipe, tampilan slide/PDF/PPT, mode IFP. Periksa print 3 halaman.
- TASK-011 (M-004): upload/tempel HTML, iframe/CSP, error/reset. Uji akses parent/network/navigation ditolak; tidak membuat endpoint skor game.
- TASK-012 (M-005): classes/membership/sessions/codes/participants, RPC transisi dan join, rate limit server. Test guru asing, kode expired dan anggota tidak sah.
- TASK-013 (M-005): attempts/answers/receipts, submit transaction dan optimistic version, Realtime + reconnect/poll fallback. Uji race dan 9 context.
- TASK-014 (M-006): scoring lima tipe, manual rubric, finalisasi/riwayat/rekap. Uji contoh 62,50, unanswered dan final null ketika pending.
- TASK-015 (M-007): storage usage/cleanup, backup dan restore drill lokal, panduan pemilik, review kuota Free, print/touch/performance nyata.
- TASK-016 (M-007): konfigurasi layanan milik pemilik setelah tersedia; migrasi/fungsi/SPA fallback/env, deploy setelah otorisasi produksi. Smoke publik+guru+siswa; simpan hasil dan instruksi pemulihan.

## Risiko dan penanganan

| Risiko | Pemicu | Tindakan |
|---|---|---|
| Alias username tidak diterima Auth | Spike M-002 gagal | Hentikan hanya alur identitas terkait, laporkan alternatif; jangan meminta email siswa diam-diam |
| Konten cepat memenuhi kuota | Penggunaan provider ≥80% | Kompres, hapus unused, video tautan; jangan upgrade berbayar tanpa keputusan pemilik |
| Project dijeda setelah libur | Endpoint tidak tersedia saat cek prakelasan | Pemilik resume melalui dashboard, cek sebelum kelas; UI gagal layanan harus jelas |
| IFP memiliki browser lama | Fullscreen/drag/PDF bermasalah | Fallback tombol tap, PDF unduh, uji browser sebenarnya sebelum klaim siap pakai |
| Jawaban berlomba dengan close | Uji concurrent submit/close | Satu lock order, waktu server dan idempotency |
| Game butuh library eksternal | Pratinjau menolak CDN | Bundel dependency ke HTML sesuai kontrak, jangan melemahkan sandbox |
| Nilai berubah akibat edit materi | Test snapshot gagal | Blok publikasi rilis; perbaiki immutability/relasi |

## Pelacakan dan selesai

Tidak ada milestone yang sudah verified. Agent mengubah status menjadi In progress saat mulai dan Verified hanya setelah gate lulus; sertakan commit dan laporan test. Jika gate tidak dapat dijalankan, status tetap belum verified dengan alasan. Dokumen dapat berkembang mengikuti bukti implementasi; perubahan lingkup memerlukan keputusan pemilik.

Definition of done setiap increment: perilaku sesuai REQ/AC, test bermakna, error/accessibility states, migration bila perlu, lint/type/build lulus, dokumentasi kontrak diperbarui, tidak ada secret/akses lintas peran. Langkah pertama: TASK-001 lalu TASK-002, bukan langsung membangun seluruh fitur dalam satu file. Prosedur agent ada pada [AGENTS](./AGENTS.md).

## Integrasi upgrade visual v2 ke milestone

REQ-014 dikerjakan lintas milestone, bukan fase redesign setelah aplikasi selesai. Pada M-001 jalankan TASK-004 termasuk tokens.css, komponen dan brand.ts. M-003 memakai komponen tersebut pada editor/katalog nyata; M-004 menerapkan mode IFP, wrapper game dan print tanpa shadow; M-005/M-006 menerapkan opsi jawaban, status tersimpan, penilaian dan tabel yang rapi; M-007 menuntaskan TEST-014 semua layar/perangkat.

TASK-017 (bagian M-001, bergantung TASK-004): buat fixture komponen semua state, hitung kontras token, cek mapping jenis konten dan snapshot awal yang direview. TASK-018 (bagian M-007, bergantung TASK-015): audit TEST-014 end-to-end di HP/IFP/cetak, catat bukti sebelum rilis. Nomor tugas bukan urutan eksekusi; dependensi milestone menentukan urutan. TASK-001 sudah melakukan inventaris dan riset kompatibilitas; TASK-002/003/004 In progress pada branch fitur; TASK-005/017 belum Verified.

## Checkpoint 12 Oktober 2026 — M-001 In progress

- Baseline main `9411632ab4730b55ca1d9342cd05433dedcb002c`, seluruh 10 dokumen spesifikasi tetap dipertahankan.
- TASK-001: dokumen, struktur dan dependensi dibaca; Node.js 24 Active LTS dan rilis Vite 8.3.4, Vitest 5.0.3 diverifikasi dari sumber resmi. Node lokal 22.16.0 dan npm 10.9.2 terdeteksi. Seluruh versi dependency yang terpasang **belum** diverifikasi.
- TASK-002: scaffold React/Vite/TS/Tailwind, konfigurasi strict type, ESLint/Prettier, Vitest/Playwright, Cloudflare SPA fallback dan CI awal tersedia di branch. `package-lock.json` **belum ada** karena akses DNS `registry.npmjs.org` gagal pada lingkungan penulis. CI sementara membuat candidate lock dan artefak, bukan pengganti committed lock. `npm ci`, build, lint, format, typecheck, unit dan E2E: **NOT RUN** pada lingkungan penulis.
- TASK-003: domain dan repository port katalog, fixture sintetis, pencarian dan kombinasi filter, reset, loading/error/empty dan test awal telah ditulis. Integrasi Supabase/RLS TEST-001 belum dimulai.
- TASK-004: token design.md, komponen bersama, wordmark, shell responsif, focus/reduced motion dan print dasar telah ditulis. TEST-014 HP/IFP/aksesibilitas belum dijalankan. Halaman login dan gabung hanya placeholder, bukan autentikasi/sesi aktif.
- TASK-005 dan TASK-017: **NOT STARTED** untuk gate lengkap dan audit visual. **M-001 NOT VERIFIED**; M-002 dan seterusnya tidak dimulai.

**Next:** pada lingkungan dengan npm registry, jalankan `npm install` lalu commit `package-lock.json`, hilangkan langkah generate-lock sementara dari CI, gunakan `npm ci`, jalankan format-check/lint/typecheck/unit/build/E2E, perbaiki semua kegagalan, lalu jalankan TASK-017 sebelum gate M-001.

### Checkpoint terverifikasi berikutnya — 12 Oktober 2026

- Branch fitur menerima lockfile yang dihasilkan npm melalui workflow, dan source otomatis diformat (kedua perubahan masuk commit pada branch). Langkah generate-lock/format sekali saja kemudian dicabut dari workflow; CI akhir menggunakan `npm ci` dan permission `contents: read`.
- GitHub Actions run [38205275969](https://github.com/ferdilpu-sudo/layarbelajar/actions/runs/38205275969): **PASS** npm ci, lint, typecheck, 3 unit test, 12 pasang warna token, production build Vite, dan 4 tes Playwright Chromium (360 px dan 1280 px). Bukti ini untuk katalog fixture saja.
- Run [38205430420](https://github.com/ferdilpu-sudo/layarbelajar/actions/runs/38205430420): format-check, lint, typecheck, unit, kontras, build telah PASS saat dicatat; E2E masih berjalan ketika checkpoint ini ditulis. Jangan mengubah hasil yang belum diketahui menjadi PASS.
- TASK-002: source+lockfile sudah tersedia dan CI penting pernah PASS. TASK-003/004: UI fixture teruji terbatas. TASK-005: **IN PROGRESS** sampai CI akhir setelah pembersihan workflow dan seluruh gate M-001 tercatat. TASK-017: **TODO**, buat fixture seluruh state, screenshot baseline dan verifikasi 360/768/1280/1920; IFP aktual tetap M-007.
- Semua TEST-001/014 penuh, Supabase/RLS dan integrasi kelas tetap **NOT RUN**. M-001 tetap belum Verified.

### Final gate otomatis setelah normalisasi CI — 12 Oktober 2026

- Commit kode terakhir untuk gate: `f542fc4cb6caeab1f715c6bfc86b4fd1ef0ba616`.
- GitHub Actions [run 38205529972](https://github.com/ferdilpu-sudo/layarbelajar/actions/runs/38205529972): **PASS** `npm ci`, `npm run format:check`, `npm run lint`, `npm run typecheck`, `npm run test:unit` (3), `npm run test:tokens` (12), `npm run build` dan `npm run test:e2e` (4 tes). CI sekarang read-only dan lockfile terkunci di git.
- TASK-005 **PASS untuk otomatisasi fixture yang tersedia**, bukan acceptance penuh M-001. TASK-017 **TODO**: fixture seluruh state komponen, baseline visual yang direview, viewport 768/1920, audit kontrol/fokus/selected dan kontras terhadap thumbnail. M-001 tetap **In progress / NOT VERIFIED**. Tidak ada implementasi atau pengujian integrasi Supabase pada checkpoint ini.

## M-001 Verified — checkpoint penutup 12 Oktober 2026

- Implementasi PR [#1](https://github.com/ferdilpu-sudo/layarbelajar/pull/1), commit sumber untuk gate `d9699a740f4c22f2e1c31ff236988cc73b93e7bc`.
- GitHub Actions [run 38210031678](https://github.com/ferdilpu-sudo/layarbelajar/actions/runs/38210031678): **PASS** `npm ci`, `npm audit --omit=dev --audit-level=high` (0 vulnerabilities), `npm run format:check`, lint, typecheck, **3 Vitest**, token contrast (12 pasangan), production build, dan **20 Chromium Playwright E2E** pada 360/768/1280/1920 px. Screenshot setiap viewport berhasil diambil sebagai artifact `m001-ui-review-screenshots`.
- TASK-001 **Done**: inventaris spec dan pilihan Node 24; TASK-002 **Done**: React/Vite/TS/Tailwind scaffolding + lockfile + CI; TASK-003 **Done untuk fixture**: repository port, filter gabungan, empty/error/loading, test UI; TASK-004 **Done untuk shell**: brand/tokens/components; TASK-005 **Done**: gate otomatis berjalan; TASK-017 **Done untuk state komponen M-001**: fixture dev-only, Button/Input/AnswerOption/FilterChip/Alert/Dialog, selected/error/disabled/loading/focus, preview empat kategori, screenshot 4 viewport ditinjau visual.
- Review manusia terhadap screenshot hasil CI: 360/768/1280/1920 px tidak memperlihatkan overlap/teks terpotong/overflow; wordmark, warna, label dan hard shadow sesuai arah design.md. Perilaku modal Tab/Escape dan kembalinya fokus diuji E2E; disabled text memakai pasangan `--lb-muted`/`--lb-canvas` yang telah lolos kontras. Print/reduced motion diuji melalui computed styles pada fixture.
- **Lingkup bukti**: TEST-001 sebagian **PASS pada katalog fixture saja**; tidak ada RLS/DB. TEST-014 sebagian **PASS pada komponen/shell M-001**; layout layar admin/IFP/hasil, touch real-device, dan cetak LKPD nyata masih **NOT RUN**. Tidak ada klaim seluruh REQ/AC/TEST production complete.
- Risiko operasional: login dan gabung tetap placeholder; backend, akun, data nyata, Storage, restore, dan deployment belum dikerjakan. Fitur dev fixture `/__ui` tersedia hanya saat `import.meta.env.DEV`; tidak ditautkan di navigasi.
- **Next: M-002 / TASK-006**. Mulai Supabase lokal, migrasi `profiles` dan peran, bootstrap admin, uji username alias `@accounts.invalid` dengan Auth sesungguhnya dan RLS negatif. Jika Docker/Supabase local tidak tersedia, sediakan migrasi dan test tanpa memalsukan PASS integrasi. Jangan meminta kredensial lewat chat.

## M-002 / TASK-006 — checkpoint 12 Oktober 2026 (branch `feat/m002-auth-profile-foundation`)

- Baseline `main`: `ef129427509ce0ab0638aaf599f6c3b89263164c`; M-001 Verified dan tidak diubah.
- TASK-006 **In progress**: menambahkan `supabase/config.toml` untuk proyek lokal tanpa self-signup, migrasi `profiles` / `app_role` / grants / deny-by-default RLS / helper di schema private, serta seed tanpa password. Username alias `@accounts.invalid` divalidasi oleh domain helper.
- Bootstrap admin lokal: `scripts/bootstrap-admin.mjs`, password tersembunyi lewat terminal, membuat Auth user dan profile dari service role lokal, menghapus Auth user jika penyimpanan profile gagal. Tidak ada endpoint bootstrap publik.
- `tests/integration/auth-profile.test.mjs` memakai akun sintetis acak sementara, Auth nyata dan REST ber-JWT user, mencakup login alias, signup disabled, pemisahan role, mutasi terlarang, akun Auth yatim, must-change-password, dan deaktivasi token lama. Terdapat workflow CI `backend.yml` untuk Docker/Supabase lokal. **Hasil belum diverifikasi pada saat commit awal**; status TEST-002 tetap NOT RUN sampai job benar-benar lulus.
- TASK-007 (provision/reset/deactivate/change-password Edge Functions + UI) **In progress**. M-002 **Not Verified** dan belum ada koneksi Supabase produksi. Jangan mengubah domain alias jika spike gagal; laporkan hasil dan alternatif keputusan pemilik.
- Kunci service role tidak pernah dikomit dan tidak boleh masuk prefiks `VITE_`. `supabase db reset --local` hanya untuk DB development; dilarang menjalankan reset pada proyek cloud.

### TASK-006 — bukti integrasi 12 Oktober 2026 (checkpoint setelah perbaikan)

- GitHub Actions [run 38212349563](https://github.com/ferdilpu-sudo/layarbelajar/actions/runs/38212349563) **PASS**: Supabase CLI 2.84.2 menjalankan stack lokal, menerapkan migrasi pada `start`, kemudian `supabase db reset --local` sukses pada DB bersih. Node integration dengan GoTrue + PostgREST asli: **9 PASS / 0 FAIL**.
- Login username alias `@accounts.invalid` terbukti bekerja **pada Auth lokal** melalui Admin API create-user (email_confirm true) dan password grant. Self-signup HTTP ditolak, profil orang lain tidak terbaca, insert/update/delete `profiles` ditolak bagi JWT siswa, akun orphan tidak mendapat akses, must-change-password dan deactivate menyembunyikan profil bahkan dengan JWT yang telah diterbitkan.
- Konfigurasi benar: `[auth].enable_signup=false` menutup pendaftaran publik; `[auth.email].enable_signup=true` tetap mengaktifkan provider login email/password. Provider false sebelumnya menyebabkan kegagalan login. Lihat [Supabase issue #40582](https://github.com/supabase/supabase/issues/40582).
- [Foundation CI run 38212576937](https://github.com/ferdilpu-sudo/layarbelajar/actions/runs/38212576937) PASS (format/lint/type/unit/build/browser). Setelah finalisasi dokumen, PR akan dicek lagi.
- **TASK-006 code + Auth/RLS spike PASS**; bootstrap admin dari terminal interaktif belum diuji manual dan harus diperiksa saat tersedia terminal Windows lokal. **TASK-007 belum dimulai**, M-002 **IN PROGRESS / NOT VERIFIED**. Tidak ada koneksi Auth hosted, tidak ada akun produksi. Jangan mempromosikan status TEST-002 keseluruhan menjadi PASS.
- Selanjutnya: TASK-007 Edge Functions untuk provision/reset/deactivate/change-password dengan transaksi kompensasi, gate akses server, lalu UI peran dan RLS negatif end-to-end.

## M-002 / TASK-007 — checkpoint 12 Oktober 2026

- PR [#3](https://github.com/ferdilpu-sudo/layarbelajar/pull/3) berisi Edge Functions `account-admin` dan `change-password`, helper Auth server-side, frontend login/ganti password/panel admin, serta tes negatif. Semua request privileged memakai GoTrue user verification + role/profile dari database ber-service-role; tidak percaya user_metadata. `private` schema dan service key tidak pernah masuk browser.
- Provision hanya boleh teacher/student; password sementara dibuat dengan crypto RNG dan dikirim **sekali saja** ke admin. Saat profile insert gagal, akun Auth dihapus sebagai rollback; jika rollback juga gagal, ID internal diberi log rekonsiliasi. Reset menyalakan `must_change_password=true` sebelum mengganti sandi; deactivate menyalakan `active=false`; token lama kehilangan akses database sesuai RLS.
- `change-password` tetap tersedia saat pending, memverifikasi password lama terhadap GoTrue Auth lalu mengganti Auth password sebelum melepas flag. **GoTrue dapat membatalkan token lama setelah password berubah**, maka klien harus login ulang dengan password baru untuk memperoleh token segar. E2E backend memverifikasi ini.
- Admin dapat melihat maksimal 50 profil guru/siswa, memilih akun berdasarkan ID, lalu reset atau deaktivasi. Username, display name, role/status saja ditampilkan; tidak ada password atau email. Login dan sesi dalam tab memakai token **in-memory** (reload meminta login lagi); logout menghapus token client segera dan meminta logout Auth best-effort. Ini bukan solusi session persistence/refresh produksi.
- [GitHub Actions backend run 38242757335](https://github.com/ferdilpu-sudo/layarbelajar/actions/runs/38242757335): **18/18 PASS** untuk Auth lokal + REST + Edge, termasuk penyalahgunaan role, user disabled/pending, reset dan login ulang. [Foundation CI run 38242748741](https://github.com/ferdilpu-sudo/layarbelajar/actions/runs/38242748741): **PASS** format, lint, typecheck, unit, build, E2E browser fixture + halaman login nonkonfigurasi. Gate ulang commit final tetap harus hijau sebelum merge.
- **M-002 masih In progress / NOT VERIFIED** sampai integrasi login UI pada backend nyata, pengujian terminal bootstrap-admin interaktif, session expiration/refresh, dan validasi deployment hosted terhadap konfigurasi/keamanan tersedia. Tidak ada credentials atau URL cloud yang dikarang.
- **Next:** uji browser login admin/guru/siswa terhadap Supabase lokal, verifikasi role redirect/pending/invalid credentials, cek 360/768/1280/1920 dan session-expiry, audit operasi admin concurrency/kompensasi, lalu tentukan gate M-002. Jangan memulai M-003 dengan asumsi login produksi siap.

## M-002 — Browser Auth nyata, checkpoint 12 Oktober 2026

- PR [#4](https://github.com/ferdilpu-sudo/layarbelajar/pull/4) menyediakan `playwright.auth.config.ts`, tes `tests/auth-e2e/identity-live.spec.mjs` dan launcher yang mengambil hanya API URL + public anon key dari Supabase lokal untuk frontend.
- [GitHub Actions run 38247733972](https://github.com/ferdilpu-sudo/layarbelajar/actions/runs/38247733972): **backend PASS**; existing GoTrue/PostgREST/Edge 18 integrasi PASS dan **8 browser E2E autentikasi PASS** (4 viewport × 2 alur). Fixture admin/teacher memakai username/password sintetis acak dan dihapus. Browser trace/video/screenshot credential **OFF**; tidak ada service-role secret prefiks `VITE_`.
- Browser berhasil: admin login; provision guru dengan password sementara sekali tampil; pending wajib ganti password; guru tidak boleh mengakses halaman admin; setelah ganti password baru login sukses; reload sign-out sesuai desain sementara; admin reset dan deaktivasi guru; akun nonaktif tertolak; password login salah tidak membuka dasbor.
- Terdapat dua koreksi tes nyata: beberapa viewport berbagi backend sehingga selector nama guru perlu dipersempit dengan username unik; navigasi internal SPA harus memakai router/popstate, bukan `page.goto` (reload sengaja menghapus sesi memory-only). Ini bukan alasan memalsukan bukti autentikasi.
- **M-002 masih In progress/NOT VERIFIED:** belum ada refresh access token saat kedaluwarsa, bootstrap owner interaktif manual belum diverifikasi, integrasi hosted dengan origin/secret konfigurasi pemilik belum dilaksanakan. Pengujian IFP nyata berada pada M-007. Setelah gate commit terakhir lulus, merge PR #4; selanjutnya desain session refresh in-memory dan test token expired tanpa penyimpanan browser permanen.

## M-002 — Session refresh + bootstrap gate, 12 Oktober 2026

- PR [#5](https://github.com/ferdilpu-sudo/layarbelajar/pull/5): `accountApi` sekarang mempertahankan access token, rotated refresh token dan kedaluwarsa **hanya dalam memori tab**. `IdentityProvider` memeriksa JWT mendekati expiry, melindungi pembaruan bersamaan dengan satu in-flight Promise, memvalidasi status/peran lewat Edge setelah refresh, melakukan periodic/foreground revalidation dan **fail-closed** saat perpanjangan/status gagal. Setiap operasi akun admin dan ganti password mengambil sesi terbaru melalui `authorizedCall`. Reload masih keluar (sengaja, belum ada persistence).
- Bootstrap admin: `scripts/bootstrap-admin.mjs` diperbaiki memproses input terminal multi-karakter (paste), memasang listener sebelum menampilkan prompt, dan tetap tanpa echo password. `tests/integration/bootstrap-admin.test.mjs` memakai driver PTY Linux standar Python, secret via pipe privat, verifikasi pembuatan akun admin/login serta cleanup; bukan simulasi mock Auth.
- **Bukti Supabase Docker lokal:** [GitHub Actions run 38253731459](https://github.com/ferdilpu-sudo/layarbelajar/actions/runs/38253731459): `npm run test:integration` **19/19 PASS** termasuk pseudo-terminal bootstrap; `npm run test:e2e:auth:local` **12/12 PASS** (360/768/1280/1920 × tiga skenario). Browser E2E mengurangi expiry yang terlihat oleh klien untuk memaksa refresh GoTrue nyata; setelah akun dinonaktifkan, refresh/revalidasi menyebabkan logout dan tidak ada token di storage. Trace/video/screenshot credentials tetap OFF.
- Foundation CI [run 38253731483](https://github.com/ferdilpu-sudo/layarbelajar/actions/runs/38253731483) **PASS** format, lint, TS, unit, tokens, build, regular Chromium. Sebelum penggabungan, workflow sementara pemformatan wajib dipulihkan ke `contents: read`; commit final harus melewati ulang Foundation gate.
- **TASK-006 dan TASK-007 local functional/security slices PASS. M-002 masih IN PROGRESS / NOT VERIFIED untuk production**: belum diuji pada hosted Supabase project, environment HTTPS/CORS, session/refresh config cloud dan operasi admin asli di Windows terminal pemilik. Tidak mengasumsikan sebaran pengguna, backup/restorasi dan batas rate/kuota. Dokumen hosted checklist ada di `docs/m002-hosted-acceptance.md` dan memerlukan infrastruktur serta review pemilik tanpa membagikan secret dalam chat.
- NEXT gate: bila deployment hosted diotorisasi, lakukan pengujian end-to-end role/disabled/refresh pada proyek staging dan catat hasil; jika hosted belum tersedia, milestone tidak dinaikkan ke Verified secara fiktif. M-003 tidak boleh dimulai dengan asumsi otorisasi cloud telah lolos.

## M-002 — PR #5 merged, staging preflight increment (12 Oktober 2026)

- [PR #5](https://github.com/ferdilpu-sudo/layarbelajar/pull/5) **MERGED** ke main (squash `7707d472a4549406c0b2be47b9f1e95e3af39523`); Foundation CI main [run 38259216276](https://github.com/ferdilpu-sudo/layarbelajar/actions/runs/38259216276) **PASS**. Local backend sebelumnya 19/19, browser Auth 12/12 PASS. TASK-006/TASK-007 selesai untuk lingkup *local*; jangan menghapus gate cloud dari M-002.
- Branch `feat/m002-hosted-readonly-gate`: script `scripts/staging-preflight.mjs`, kontrak tes offline, dan workflow `workflow_dispatch` read-only dengan environment `staging`; config yang perlu disiapkan pemilik tercatat di `docs/m002-staging-runbook.md`. Tidak ada service key di workflow; URL dibatasi ke project ref Supabase staging. Probe **GET/OPTIONS saja**, mengecek health GoTrue, anon RLS, origin HTTPS yang diizinkan serta CORS origin tidak dikenal pada Edge Functions.
- **Staging preflight dan hosted acceptance NOT RUN** sampai project staging/konfigurasi GitHub environment tersedia. Contract tests offline tidak membuktikan staging. Full hosted login/provision/refresh/deactivate tetap perlu synthetic account dan owner-authorized test terpisah.
- M-002 **IN PROGRESS / NOT VERIFIED**. Langkah aman berikut: merge PR ini setelah lint/format/type/unit/CI PASS; pemilik menyiapkan project staging dan environment values; jalankan preflight manual; evaluasi hasil, baru rencanakan acceptance staging mutatif dengan snapshot/cleanup dan approval.

### Staging preflight offline gate (PR #6, source checkpoint)

- `npm run test:staging-preflight` **PASS** dalam Foundation CI [run 38260925930](https://github.com/ferdilpu-sudo/layarbelajar/actions/runs/38260925930), termasuk penolakan key service_role, URL non-hosted, origin non-HTTPS, kebocoran RLS anonim dan CORS origin asing. Ini **unit contract dengan mock fetch**, tidak pernah menyentuh staging asli.
- Workflow preflight hosted **manual saja** dan tetap **NOT RUN**, karena tidak ada konfigurasi `staging` yang terverifikasi. M-002 **IN PROGRESS / NOT VERIFIED**. Temporary code formatter sudah dibersihkan dan workflow kembali ke `permissions: contents: read`.
