# LayarBelajar

Bank materi dan game milik admin untuk pengajaran di IFP serta latihan/LKPD siswa melalui HP, dengan katalog publik dan sesi kelas berkode.

**Status saat ini: M-001 Verified; M-002 In Progress (Auth dan Edge lokal teruji, hosted/staging belum terverifikasi) — 12 Oktober 2026.** Sepuluh dokumen handoff tetap ada. Scaffold React, katalog contoh, Supabase Auth lokal, operasi akun dan UI login telah terimplementasi; deployment belum dikonfirmasi. Spesifikasi disetujui; kesiapan penggunaan nyata harus dibuktikan melalui implementasi dan [testing](./testing.md).

## Mulai di sini — untuk agent berikutnya

Repositori tujuan: https://github.com/ferdilpu-sudo/layarbelajar.git. README adalah pintu masuk; [AGENTS.md](./AGENTS.md) adalah instruksi kerja agent. Baca semua dokumen sesuai urutan berikut sebelum membuat perubahan. Jangan meminta pemilik mengulang wawancara atau mengganti keputusan yang sudah disetujui.

1. [AGENTS.md](./AGENTS.md): batas kerja, definisi selesai dan laporan.
2. [prd.md](./prd.md): fitur yang harus dibuat dan AC penerimaan.
3. [plan.md](./plan.md): milestone/dependensi dan TASK berikutnya.
4. [architecture.md](./architecture.md) → [schema.md](./schema.md): modul, hak akses, data/API dan scoring.
5. [design.md](./design.md): soft brutalism, token, komponen, IFP/HP/cetak.
6. [rules.md](./rules.md) → [testing.md](./testing.md) → [decisions.md](./decisions.md): engineering, uji dan alasan pilihan.

### Status awal yang harus dipahami

| Aspek | Status saat handoff |
|---|---|
| Wawancara, kebutuhan, stack dan arah desain | Selesai; disetujui pemilik |
| Dokumen | Sepuluh Markdown versi 2, API direncanakan tetap v1 |
| Implementasi aplikasi | M-001 Verified; M-002 Auth/Edge dan UI lokal sudah diuji, hosted masih In Progress |
| Build, lint, test aplikasi | PASS main setelah PR #5: format/lint/type/unit/kontras/build/Chromium; Supabase lokal 19 integrasi dan 12 browser Auth PASS; staging NOT RUN |
| Backend/hosting/akun layanan | Supabase Docker lokal sudah diuji; hosted Supabase/Cloudflare dan akun layanan milik pemilik belum diverifikasi |
| Pemeriksaan yang sudah dilakukan | Nama file, link dokumen, pemetaan REQ/AC/TEST, dan kontras token warna |
| Deployment dan domain | Belum ada; jangan mengarang URL aplikasi aktif |

Tabel ini merekam kondisi handoff awal. Ketika melanjutkan di masa depan, periksa kode, git log, git status dan progres plan.md terlebih dahulu. Jika sudah ada implementasi, lanjutkan milestone pertama yang belum Verified; jangan scaffold ulang atau menghapus kode karena README awal mengatakan belum dimulai. Perbarui tabel status ini setelah ada perubahan nyata.

### Eksekusi pertama yang konkret

- TASK-001: inventaris repo dan perubahan belum di-commit; baca instruksi yang berlaku; verifikasi versi tool dan dependensi. Pertahankan sepuluh dokumen di root.
- TASK-002: scaffold React + TypeScript + Vite/Tailwind secara aman pada direktori berisi dokumen; siapkan lint/typecheck/test/build dan lockfile. Bila generator menuntut direktori kosong, scaffold di direktori sementara lalu gabungkan hanya file aplikasi yang diperlukan, tanpa opsi overwrite semua.
- TASK-003/004: buat katalog fixture melalui repository adapter, token soft brutalism, komponen dasar dan shell responsif. Kerjakan TASK-017 setelah TASK-004 sesuai dependensi M-001 meskipun nomornya lebih besar.
- TASK-005: jalankan gate M-001, rekam hasil, lalu lanjut milestone berikutnya sesuai instruksi implementasi pengguna. Login placeholder atau fixture bukan backend selesai.

Otorisasi upload/push dokumentasi ini tidak berarti aplikasi sudah diimplementasikan. Ketika diminta membangun aplikasi, jalankan milestone di atas; ketika hanya diminta mengubah dokumentasi, jangan melakukan implementasi atau deployment tanpa permintaan itu.

### Keputusan yang jangan diubah diam-diam

Nama LayarBelajar; gaya soft brutalism sesuai design.md; stack React/Vite/TypeScript/Tailwind + Supabase + Cloudflare Pages; biaya bulanan nol; katalog publik; hanya admin menambah konten; guru mengelola kelas/nilai; siswa login dan gabung sesi berkode. Game satu HTML/CSS/JS terisolasi tanpa skor tersimpan. PDF tampil, PPT diunduh, video tautan dan LKPD cetak browser. Kunci jawaban privat, penilaian server, revisi materi immutable. Tidak ada migrasi konten lama.

File yang berwenang: PRD untuk lingkup, schema untuk kontrak, design untuk visual, architecture untuk modul. README hanya merangkum; konflik material dilaporkan secara spesifik. Nilai default yang ditandai asumsi boleh disesuaikan berdasarkan bukti dan dicatat pada decisions.md. Jangan mengganti requirement agar test mudah lulus.

### Jika akses atau alat belum tersedia

Tetap selesaikan pekerjaan lokal yang tidak tergantung layanan: scaffold, komponen, domain, fixture dan unit test. Jika Docker/Supabase lokal tidak tersedia, laporkan test integrasi NOT RUN dan jangan menandai gate terkait Verified. Jika akun cloud belum tersedia, siapkan konfigurasi/nama env dan petunjuk yang dapat dijalankan pemilik. Jangan meminta secret melalui chat, membuat backend palsu yang diklaim selesai, memakai layanan berbayar, atau mengganti stack hanya untuk menghindari penghambat.

### Checkpoint sebelum agent berhenti

Perbarui plan.md dengan milestone/TASK terakhir, status Not started/In progress/Verified, hasil test dan langkah tepat berikutnya. Perbarui README bila status atau perintah aktual berubah; kontrak data/UX diperbarui pada dokumen pemiliknya. Gunakan laporan berikut pada akhir sesi atau entri progres plan.md, isi dengan hasil nyata:

- Tanggal, branch dan commit terakhir bila ada; sebutkan perubahan belum di-commit.
- TASK selesai dan REQ/AC/TEST terkait; bedakan implementasi dari verifikasi.
- Perintah yang dijalankan dan PASS/FAIL/NOT RUN, beserta alasan kegagalan/belum dijalankan.
- File/modul yang masih dikerjakan serta penghambat konkret.
- TASK berikut, prasyaratnya, file yang perlu dibuka dan gate penerimaannya.

Jangan menyatakan commit sudah dipush sebelum remote terverifikasi. Jangan menandai milestone Verified bila gate belum berjalan. Simpan progres pada plan.md agar agent berikutnya bisa melanjutkan tanpa mengandalkan percakapan sebelumnya.

## Stack

React + TypeScript + Vite dan Tailwind CSS untuk web; Supabase PostgreSQL/Auth/Storage/Realtime/Edge Functions untuk backend; Cloudflare Pages untuk hosting statis. Akun dibuat admin memakai username/password; guru mengelola kelas dan nilai; publik membaca materi. Game HTML mandiri terisolasi tanpa rekap skor. Rincian: [architecture](./architecture.md) dan [decisions](./decisions.md).

## Peta dokumen

| File | Kegunaan |
|---|---|
| [prd.md](./prd.md) | Tujuan, ruang lingkup, REQ dan penerimaan |
| [design.md](./design.md) | Layar, alur sentuh/HP, cetak dan keadaan UI |
| [architecture.md](./architecture.md) | Stack, modul, backend, keamanan dan deployment |
| [schema.md](./schema.md) | Tabel, kontrak soal/API, akses dan scoring |
| [decisions.md](./decisions.md) | Alasan pilihan, asumsi dan batas paket gratis |
| [rules.md](./rules.md) | Konvensi engineering dan quality gates |
| [testing.md](./testing.md) | Kasus uji dan pemetaan REQ/AC/TEST |
| [plan.md](./plan.md) | Milestone, tugas, dependensi dan gate |
| [AGENTS.md](./AGENTS.md) | Instruksi operasional AI coding agent |

## Prasyarat implementasi

Git, Node.js LTS + npm, Docker untuk Supabase lokal, Supabase CLI dan browser Chromium. Agent memverifikasi versi kompatibel pada M-001 lalu mengunci lockfile. Untuk rilis diperlukan akun Supabase Free dan Cloudflare Free milik pemilik; tidak perlu domain berbayar. Jangan meminta password layanan/API secret melalui percakapan atau menaruhnya di dokumen.

Environment yang direncanakan:

| Nama | Tempat | Isi/fungsi |
|---|---|---|
| VITE_SUPABASE_URL | Frontend build | URL proyek Supabase milik pemilik |
| VITE_SUPABASE_PUBLISHABLE_KEY | Frontend build | Public/publishable key, bukan service role |
| VITE_APP_URL | Frontend build | Origin aplikasi untuk navigasi/konfigurasi |
| SUPABASE_URL | Backend/local scripts | URL backend |
| SUPABASE_SERVICE_ROLE_KEY | Edge/local provisioning secret | Admin API; tidak boleh masuk bundel browser |
| SUPABASE_DB_URL | Migrasi/backup lokal/CI secret | Koneksi database sesuai lingkungan |

Domain alias akun adalah konstanta internal `accounts.invalid`, bukan domain email yang perlu dibeli. Verifikasi Auth sesuai ADR-002. Bootstrap admin melalui skrip lokal yang dibuat M-002; input password secara aman dan jangan commit kredensial. Aktifkan kewajiban ganti password untuk akun guru/siswa. Akun layanan belum dikonfigurasi.

## Mulai bekerja

1. Ekstrak sepuluh Markdown ini ke root proyek baru. Baca AGENTS, PRD, dan plan sebelum menulis aplikasi.
2. Kerjakan M-001: scaffold aplikasi dalam root tersebut tanpa menimpa dokumen; buat scripts di bawah dan lockfile. Gunakan fixture sintetis untuk katalog pertama.
3. Pada M-002 jalankan backend lokal, migrasi dan bootstrap. Buat file env lokal dari template yang dihasilkan agent; pastikan masuk gitignore. Sambungkan repository adapter ke backend.
4. Lanjutkan setiap milestone sampai gate rilis, lalu konfigurasi produksi dengan otorisasi pemilik.

**Direncanakan — verifikasi setelah scaffolding.** Perintah berikut baru berlaku setelah package.json dan script terkait dibuat; belum dijalankan pada paket ini:

```bash
npm install
npm run dev
npm run format:check
npm run lint
npm run typecheck
npm run test:unit
npm run test:integration
npm run test:e2e
npm run build
npm run preview
```

Setelah lockfile tersedia gunakan `npm ci` pada CI. Integrasi memerlukan Supabase lokal dan fixture; detail startup/migrasi harus ditambahkan agent setelah CLI aktual terverifikasi. Jangan menjalankan db reset terhadap URL produksi.

## Operasi awal

Admin menambah taxonomy → materi/soal/LKPD/game → pratinjau → terbit. Guru membuat kelas dan menambahkan akun siswa → buka sesi → bagikan kode. Siswa login dan join; nilai objektif otomatis, uraian dinilai guru. Detail implementasi tidak ditampilkan dalam alur pengguna.

PDF tampil langsung, PPT/PPTX unduhan dengan PDF pendamping manual, video berupa tautan, dan cetak melalui browser. Paket gratis mempunyai batas dan potensi jeda ketika tidak aktif; jadwalkan pemeriksaan sebelum kelas dan backup manual sebagaimana ADR-007. Tidak ada biaya yang telah diaktifkan dan tidak ada klaim uptime.

Langkah berikut untuk AI coding agent: mulai **M-002 / TASK-006**, lihat checkpoint penutup M-001 di plan.md. Nama LayarBelajar dan arah soft brutalism sudah ditetapkan. Perangkat IFP aktual dan kredensial layanan dapat dilengkapi kemudian; tidak perlu mengulang wawancara fitur yang sudah diputuskan.

## Pembaruan v2

Seluruh sepuluh dokumen kini memakai nama **LayarBelajar** dan arah **soft brutalism**: krem/pastel, garis arang, bayangan tegas, sudut lembut dan kontrol sentuh besar. [design.md](./design.md) menjadi acuan warna, ukuran, komponen, states, HP/IFP dan cetak. REQ-014/AC-014/TEST-014 serta ADR-009 mengikat penerapannya ke plan dan quality gates.

Nilai warna/ukuran adalah default implementasi terdefinisi, bukan aset mockup atau UI yang sudah dibangun. Wordmark teks cukup untuk mulai; tagline bersifat opsional. Schema API tetap v1, dokumen v2 tidak berarti API breaking change. Gunakan sepuluh file paket terbaru bersama-sama agar tidak mencampur instruksi visual v1 dengan v2.

## Menjalankan implementasi awal (branch M-001)

Source React/Vite berada di branch `feat/m001-foundation-catalog`. Katalog menggunakan data **fixture saja**; detail konten merupakan contoh, sementara login/gabung belum aktif. `/login` dan `/gabung` bukan formulir yang benar-benar memproses akun.

Setelah komputer dapat mengakses npm registry dan memakai Node.js 24 LTS, jalankan:

```bash
npm install
npm run format
npm run format:check
npm run lint
npm run typecheck
npm run test:unit
npm run build
npx playwright install chromium
npm run test:e2e
```

Commit `package-lock.json` setelah `npm install`, dan ubah CI agar menggunakan `npm ci` murni. `npm run test:integration` sengaja gagal dengan status NOT RUN sampai Supabase lokal dan migrasi tersedia pada M-002. Tidak ada tes atau perintah di atas yang dapat dinyatakan PASS berdasarkan dokumen saja.

**Update CI 12 Oktober 2026:** `package-lock.json` kini telah di-commit di branch melalui GitHub Actions. CI awal membuktikan `npm ci`, lint, typecheck, 3 unit, 12 kontras token, build dan 4 browser E2E PASS: https://github.com/ferdilpu-sudo/layarbelajar/actions/runs/38205275969. Workflow final memakai `npm ci` saja. Pengujian penuh TEST-001..014, IFP aktual dan backend belum dinyatakan lulus.

### Bukti penutupan M-001 dan langkah lanjutan

Fondasi diuji pada [CI run 38210031678](https://github.com/ferdilpu-sudo/layarbelajar/actions/runs/38210031678): npm ci, dependency audit 0 temuan, format, lint, TypeScript, 3 unit tests, kontras token, build dan 20 Playwright E2E PASS. Screenshot visual empat viewport sudah ditinjau, bukan baseline yang auto-approved melalui perubahan buta. Fixture state komponen tersedia pada `/__ui` **hanya dalam mode development**; rute produksi mengembalikan not-found.

M-001 Verified **tidak** menutup keseluruhan TEST-001/014: Supabase/RLS belum dibangun, dan layar admin, game/IFP, LKPD/print nyata serta perangkat aktual masih harus dites pada milestone masing-masing. Mulai TASK-006 dengan Supabase lokal, akun username alias dan migrasi role/RLS tanpa menambahkan email pribadi siswa secara sepihak.

### M-002: memulai backend lokal (TASK-006)

M-002 **In progress** di branch `feat/m002-auth-profile-foundation`. Siapkan Docker dan Supabase CLI versi yang direkam di workflow (`2.84.2`), jalankan `supabase start`, `supabase db reset --local`, lalu `npm run test:integration`. Kode migrasi dan test memakai Supabase lokal sungguhan, bukan backend cloud atau akun siswa nyata. Jika pengguna ingin mem-bootstrap admin lokal: `npm run bootstrap:admin -- <username> "<display name>"` lalu input password 12+ karakter secara tersembunyi di terminal. Jangan pernah memasukkan password ke argumen atau commit.

**TASK-007 sedang dikerjakan di PR #3**: Edge Functions provisioning/reset/deaktivasi/ganti password dan UI login/admin sudah dibuat. Namun uji browser dengan backend nyata, CLI bootstrap-admin interaktif, dan session refresh produksi belum selesai. Status ujinya dilacak di `plan.md`/`testing.md`; aplikasi belum siap dipakai kelas.

**Update TASK-006:** GoTrue + PostgREST lokal benar-benar diuji dan **9/9 integrasi PASS** pada [CI run 38212349563](https://github.com/ferdilpu-sudo/layarbelajar/actions/runs/38212349563). Konfigurasi local Auth mematikan signup global tetapi mempertahankan provider email/password aktif; alias `@accounts.invalid` berhasil digunakan pada login. Ini belum login aplikasi melalui UI, belum Auth cloud, dan belum selesai M-002. Langkah berikutnya TASK-007 serta verifikasi CLI bootstrap admin pada terminal yang aman.

### M-002 / TASK-007 — menjalankan login dan admin lokal

Frontend membutuhkan `.env.local` (tidak dikomit) berisi `VITE_SUPABASE_URL` = `API_URL` keluaran lokal `supabase status -o env`, serta `VITE_SUPABASE_PUBLISHABLE_KEY` = `ANON_KEY` dari stack lokal. **Jangan gunakan `SERVICE_ROLE_KEY` di frontend.** Jalankan Docker/Supabase CLI, `supabase start`, `supabase db reset --local`, `supabase functions serve`, lalu `npm run dev`. Bootstrap admin melalui `npm run bootstrap:admin -- <username> "<nama>"` hanya di terminal pribadi (password tersembunyi, 12+ karakter). Setelah itu login lewat `/login`, ganti sandi jika diwajibkan, dan gunakan `/admin/akun` untuk membuat guru/siswa. Backend CI otomatis menguji operasi akun dengan data uji sintetis.

Hosted Edge Functions mewajibkan konfigurasi secret `APP_ALLOWED_ORIGINS` berisi origin HTTPS frontend persis, terpisah koma jika diperlukan. Pada stack lokal `localhost:5173` dan `127.0.0.1:5173` diizinkan; origin lain ditolak. Tidak ada URL/credential Supabase cloud atau domain produksi yang dipasang. Token browser hanya disimpan di memori dan hilang ketika reload. **Belum siap rilis** sampai uji sesi/refresh dan hak akses pada proyek hosted dilakukan. Bukti backend: [CI 38242757335](https://github.com/ferdilpu-sudo/layarbelajar/actions/runs/38242757335), 18 integrasi PASS.

### Browser-auth integration gate (M-002)

Setelah `supabase start`, `supabase db reset --local` dan `supabase functions serve`, jalankan `npm run test:e2e:auth:local` dengan Chromium Playwright terpasang. Launcher membaca status lokal; hanya `VITE_SUPABASE_URL` dan anon/publishable key diteruskan ke browser, sedangkan service key dipakai oleh test Node untuk membuat fixture yang dihapus sesudah pengujian. Empat viewport (360/768/1280/1920) menjalankan login nyata, role gate, account provisioning, password change, reset, deactivate dan incorrect password; trace/screenshot/video sengaja dimatikan agar password sementara tidak masuk artifact. [GitHub Actions run 38247733972](https://github.com/ferdilpu-sudo/layarbelajar/actions/runs/38247733972) PASS untuk **8 browser tests**. Sesi masih in-memory dan **belum refresh saat token expired**; jangan klaim produk siap dipakai guru sepanjang hari.

### M-002 — Refresh sesi dan verifikasi bootstrap

PR [#5](https://github.com/ferdilpu-sudo/layarbelajar/pull/5) mengimplementasikan refresh token **in-memory** (tanpa localStorage/sessionStorage), pergantian token GoTrue secara serial, refresh saat token mendekati expiry dan saat tab aktif kembali, serta revalidasi profil sebelum akses privilese. Jika refresh/validasi ditolak, UI menghapus sesi; reload tab tetap meminta login ulang. Password bootstrap dapat ditempel dengan aman pada terminal tanpa echo karena input kini diproses per karakter meskipun diterima satu chunk.

CI Supabase lokal [run 38253731459](https://github.com/ferdilpu-sudo/layarbelajar/actions/runs/38253731459): **19 integrasi + 12 browser E2E PASS**, termasuk bootstrap admin dari PTY Linux dan masa hidup token singkat. Jangan menyalahartikan bukti Linux/PTy tersebut sebagai bukti perintah bootstrap sudah dijalankan di terminal Windows pemilik. Untuk hosting, periksa `docs/m002-hosted-acceptance.md` dan jangan pernah menyimpan service-role secret ke Vite/frontend atau mengirimkannya melalui chat.

### M-002 / staging preflight (read-only; manual)

Sesudah PR #5 digabung, Foundation CI main [run 38259216276](https://github.com/ferdilpu-sudo/layarbelajar/actions/runs/38259216276) **PASS**; branch fitur fondasi session sudah di `main` commit `7707d472`. Gate staging tetap **BLOCKED / NOT RUN** sampai konfigurasi project staging tersedia.

Preflight `npm run test:staging-preflight` adalah **unit contract offline** tanpa network; `node scripts/staging-preflight.mjs` adalah pemeriksaan hosted sungguhan yang membaca environment staging dan memakai hanya `GET`/`OPTIONS`. Workflow manual **M-002 Hosted Staging Preflight (Read Only)** tidak berjalan pada push/PR, dan tidak membuat user, mendeploy fungsi, mengubah database atau menjalankan reset. Setup dan batas bukti terdapat di [staging runbook](./docs/m002-staging-runbook.md). Jangan menyuplai service-role credentials ke workflow tersebut atau menandai M-002 Verified hanya dari preflight PASS.

### Staging deployment checkpoint — 13 Oktober 2026

Supabase Free staging `qfkjcjzwhewsbblgumco` aktif, database `profiles` kosong/RLS enabled dan Edge `account-admin` serta `change-password` **ACTIVE v1, verify_jwt=true**; deployed code matches main commit `9330e679`. **Ini baru bukti deployment, bukan hosted HTTP Auth/CORS/E2E PASS**. Lihat [hosted acceptance](./docs/m002-hosted-acceptance.md) dan [staging runbook](./docs/m002-staging-runbook.md) sebelum mengisi origins/keys di lingkungan pemilik. Migration history drift `20261012154806` vs Git `20261012060000` tetap harus diaudit. M-002 In Progress; jangan mulai M-003 dengan asumsi Auth hosted Verified.

### Cloudflare Pages — M-002 staging deployment preparation (13 October 2026)

The repository now provides `npm run build:pages:staging` and the offline `npm run test:pages:staging`. The build gate strictly checks the intended **Free staging Supabase ref**, HTTPS frontend origin, and `anon` JWT role; `npm run build` remains unchanged for local/CI. See [Cloudflare Pages staging runbook](./docs/m002-cloudflare-pages-staging.md). **No Cloudflare Pages site or HTTPS origin has been verified or deployed yet.** Hosted positive CORS and full Auth remain NOT RUN; M-002 In Progress.
