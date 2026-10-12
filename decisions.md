# Log Keputusan — LayarBelajar

Tanggal seluruh keputusan: 12 Oktober 2026. Pemilik keputusan produk: pengguna/admin. “Diputuskan” berarti disetujui saat wawancara; “Asumsi teknik” adalah detail implementasi reversibel yang harus diuji, bukan pernyataan bahwa pengguna memilih setiap library atau batas angka.

| ADR | Status | Keputusan | Terkait | Evaluasi ulang |
|---|---|---|---|---|
| ADR-001 | Diputuskan | React/Vite/TypeScript + Tailwind, Supabase, Cloudflare Pages | REQ-001, REQ-010 | SEO per materi atau kebutuhan server kompleks |
| ADR-002 | Diputuskan + detail teknik | Akun dibuat admin, username/password, tanpa email siswa | REQ-002 | Registrasi mandiri/SSO diminta atau alias Auth gagal |
| ADR-003 | Diputuskan | Konten terbit publik; konten hanya admin; guru mengelola kelas/nilai | REQ-001, REQ-003, REQ-009 | Banyak pengelola konten/sekolah |
| ADR-004 | Diputuskan + detail teknik | Game HTML mandiri pada iframe terisolasi, tanpa skor | REQ-007 | Game perlu aset ZIP, API atau skor terintegrasi |
| ADR-005 | Diputuskan + detail teknik | Sesi berkode, revisi immutable, penilaian server | REQ-005, REQ-010, REQ-011, REQ-012 | Tugas asinkron atau ujian berbeda model |
| ADR-006 | Diputuskan | PDF tampil, PPT unduh, video tautan, cetak browser | REQ-004, REQ-006 | Konversi otomatis benar-benar diperlukan |
| ADR-007 | Diputuskan + detail operasional | Biaya bulanan nol, kuota dipantau, backup manual | REQ-013 | Kuota mendekati batas atau uptime wajib |
| ADR-008 | Diputuskan; detail perangkat asumsi | Soft brutalism terang, mode IFP dan ukuran sentuh | REQ-008, REQ-014 | Uji IFP nyata menunjukkan ketidakcocokan |
| ADR-009 | Diputuskan; token adalah default implementasi | Nama LayarBelajar dan sistem visual soft brutalism | REQ-014 | Uji keterbacaan/aksesibilitas atau perubahan brand |

## ADR-001 — Stack sederhana untuk interaksi kelas

Konteks: pengguna kurang dari 10, web IFP/HP, realtime, konten terus ditambah, paket gratis. Pilihan: React/Vite + managed backend; Next.js fullstack; Laravel + hosting server. React/Vite dipilih karena interaksi browser dominan dan frontend dapat dihosting statis. Next.js memberi SSR/SEO lebih kuat tetapi belum dibutuhkan; Laravel cocok bila tersedia pengelola server, yang belum ada.

Konsekuensi: autentikasi, database dan penyimpanan bergantung Supabase; migrasi vendor memerlukan adapter/Auth migration. UI tidak dapat bergantung rahasia backend. Struktur modular dan PostgreSQL SQL menjaga perpindahan data tetap memungkinkan. Detail ada di [architecture](./architecture.md). Versi dependency dikunci saat M-001, bukan ditebak dalam spesifikasi.

## ADR-002 — Username tanpa email pribadi

Konteks: admin membuat sedikit akun, siswa tidak wajib memiliki email. Pilihan: email nyata, OAuth sekolah, atau username yang diterjemahkan ke alias Auth. Dipilih pengalaman username/password; detail alias `@accounts.invalid` adalah asumsi teknik. Supabase password API native menggunakan email atau nomor telepon, sehingga perlu adapter; bukan klaim dukungan username native.

Admin API membuat alias confirmed, signup publik nonaktif, email tidak dikirim. Reset melalui admin dan wajib ganti password. Password tidak disimpan sendiri. Konsekuensi: pemulihan akun bergantung admin; lakukan spike alias pada M-002 sebelum membangun semua layar login. Jika gagal, laporkan opsi backend username/proxy dengan mapping internal tanpa mewajibkan email siswa secara sepihak.

Sumber resmi: [signInWithPassword](https://supabase.com/docs/reference/javascript/auth-signinwithpassword), [createUser](https://supabase.com/docs/reference/javascript/auth-admin-createuser), diakses 12 Oktober 2026. Kunci Admin API hanya pada server.

## ADR-003 — Satu bank milik admin

Alternatif: setiap guru mengunggah konten atau admin tunggal. Pengguna memilih admin tunggal. Guru mengelola kelas sendiri, membuka sesi dan menilai; publik dapat melihat materi terbit. Konsekuensi: model lebih kecil dan moderasi tidak dibutuhkan, tetapi guru perlu meminta admin menambah materi. Akses nilai tetap privat dan terpisah dari katalog publik. Tidak ada konsep tenant/sekolah pada MVP.

## ADR-004 — Game terisolasi tanpa integrasi skor

Alternatif: komponen React native yang memerlukan perubahan kode aplikasi, HTML bebas pada DOM utama, atau iframe sandbox. Dipilih iframe agar admin dapat menambah game tanpa rebuild dan tanpa memberi game akses akun. Tidak ada migrasi game lama. Satu file HTML dengan CSS/JS tertanam sesuai format awal; eksternal CDN/aset ditolak agar game konsisten dan tidak membuat jalur akses ke layanan lain.

Konsekuensi: game yang bergantung localStorage, fetch, CDN atau banyak berkas perlu disesuaikan. Sandbox dan CSP harus diuji dengan payload negatif. Skor tidak disimpan, tidak ada leaderboard game. Batas 2 MiB adalah asumsi teknik awal.

## ADR-005 — Hasil belajar stabil

Alternatif: soal mutable langsung dipakai sesi vs revisi snapshot; nilai dari klien vs nilai server. Dipilih snapshot dan nilai server agar edit bank soal tidak mengubah riwayat dan klien tidak menentukan skor. Kode sesi melengkapi login dan keanggotaan, bukan menggantikannya.

Objektif otomatis, uraian manual. Asumsi: satu attempt tiap sesi, jawaban bisa diganti ketika soal terbuka, semua pasangan matching/drag harus tepat untuk poin penuh, isian cocok teks ternormalisasi, final dirilis per siswa setelah sesi selesai dan semua penilaiannya lengkap. Realtime hanya notifikasi; database tetap sumber keadaan. Konsekuensi: lebih banyak tabel/revisi, tetapi perilaku dapat diuji dan dipulihkan setelah reconnect.

## ADR-006 — Berkas dan cetak tanpa konversi berbayar

Alternatif: render/konversi Office server-side, embed layanan pihak ketiga, atau PDF pendamping dan unduh PPT. Pengguna menyetujui PDF tampil + PPT unduh; video tautan; print CSS. Konsekuensi: admin menyiapkan PDF sendiri, video memerlukan koneksi dan ketersediaan penyedia. Default awal adapter YouTube HTTPS adalah asumsi teknik yang dapat ditambah tanpa mengubah model materi. Print browser tidak menghasilkan dokumen layout identik di semua printer; lakukan QA A4.

## ADR-007 — Operasi paket gratis

Pemilik memilih biaya bulanan nol dan domain bawaan. Alternatif: VPS/managed berbayar memberi kapasitas dan kontrol lebih tinggi, tetapi tidak sesuai anggaran awal. Supabase Free dan Cloudflare Pages Free dipilih; jangan mengaktifkan upgrade otomatis atau fitur berbayar.

Verifikasi 12 Oktober 2026: [Supabase Pricing](https://supabase.com/pricing) menyebut database 500 MB, file storage 1 GB, egress 5 GB serta cached egress 5 GB, 200 koneksi Realtime puncak, dan project Free dijeda setelah satu minggu tidak aktif. Kuota dapat berubah; cek ulang saat deployment. [Cloudflare Pages limits](https://developers.cloudflare.com/pages/platform/limits/) menyebut 500 build/bulan, 20.000 file dan maksimum 25 MiB tiap asset situs pada Free. Konten dinamis disimpan di Supabase sehingga penambahan materi tidak memerlukan build Pages.

Konsekuensi: sedikit akun tidak membatasi jumlah pengunjung publik atau bandwidth; jangan menjanjikan gratis tanpa batas. Gunakan video tautan dan kompres gambar. Dashboard penyimpanan aplikasi hanya estimasi bytes aset; admin mengecek dashboard penyedia untuk total kuota. Saat mencapai 80% storage/database/egress, bersihkan aset tak dipakai atau atur konten sebelum mempertimbangkan biaya. Backup manual mingguan adalah asumsi operasi; lakukan drill dan periksa layanan sebelum mengajar setelah libur. Tidak menggunakan ping buatan untuk menghindari jeda.

## ADR-008 — Mode belajar dan arah visual v2

Pilihan: UI padat desktop atau mode presentasi khusus. Dipilih mode IFP terpisah dari kontrol guru, tombol sentuh besar, HP responsif, Bahasa Indonesia dan tema terang. Soft brutalism dan nama LayarBelajar diputuskan pada upgrade v2; dark mode tetap di luar MVP. Konsekuensi: desain diuji di browser nyata, bukan hanya screenshot desktop. Model IFP, versi browser dan resolusi adalah Terbuka operasional milik pemilik produk, diverifikasi M-007.

## Hal terbuka yang tidak menghalangi coding

Nama akun layanan/URL proyek dan perangkat IFP nyata belum tersedia. Nama LayarBelajar serta arah soft brutalism sudah diputuskan; token implementasi ada di design.md dan logo awal memakai wordmark teks. Gunakan konfigurasi env; jangan mengarang URL deployment atau mengklaim layanan tersambung. Tidak ada keputusan fitur kritis yang masih menunggu jawaban. Detail asumsi lain berada pada [prd](./prd.md) dan [schema](./schema.md).

## ADR-009 — Identitas LayarBelajar / soft brutalism

Diputuskan dari permintaan pengguna untuk meng-upgrade sepuluh dokumen setelah membahas nama dan soft brutalism. Pilihan yang dibandingkan: antarmuka biru-putih generik, brutalism keras dengan warna mencolok/dekorasi dominan, dan soft brutalism pastel. Dipilih soft brutalism bernuansa kartu/alat belajar untuk memberi identitas dan kontrol sentuh yang jelas, tetap cocok untuk semua jenjang.

Nama tampilan: LayarBelajar. Tagline “Sentuh layarnya, jelajahi ilmunya.” tetap usulan opsional. Palet krem, arang, biru/mint/kuning/ungu pastel; border tegas, shadow tanpa blur, sudut 12–16 px dan system font adalah default teknik yang ditetapkan di design.md. Detail angka belum dipilih satu per satu oleh pengguna dan boleh dikoreksi berdasarkan uji nyata.

Konsekuensi: komponen dan token harus dibangun sejak M-001, tidak ditambahkan sebagai dekorasi akhir. Area baca dan tabel tidak diberi bayangan berlebihan; cetak memakai warna netral dan tanpa dekorasi. Fokus/kontras/touch diuji sebagai TEST-014. Game tetap terisolasi dan tema hanya membungkusnya. Tidak menambah fitur produk, layanan berbayar, kebutuhan database tema atau perubahan stack. Evaluasi ulang jika uji IFP, grayscale atau aksesibilitas gagal. Ketersediaan domain/merek nama belum diperiksa; tidak ada klaim registrasi.

## ADR-010 — Toolchain kandidat M-001 (12 Oktober 2026)

**Provisional:** Node 24 Active LTS menjadi pilihan CI; Vite 8.3.4 dan Vitest 5.0.3 sudah memiliki rilis stabil. React/TypeScript/Tailwind/React Router tetap mengikuti ADR-001. Versi lengkap belum dapat di-resolve atau dikunci karena registry npm tidak dapat diakses di lingkungan penulis. Paket dipasang, lockfile diperiksa, dan compatibility gate harus lulus sebelum ADR ini final. Referensi: https://github.com/nodejs/Release , https://vite.dev/guide/ , https://github.com/vitejs/vite/releases , https://github.com/vitest-dev/vitest/releases , https://tailwindcss.com/docs/installation/using-vite .

**Pembaruan ADR-010:** npm berhasil resolve dependensi melalui GitHub Actions dan mencatat `package-lock.json` pada branch M-001. Node 24, Vite 8.3.4 dan Vitest 5.0.3 lulus build/unit/E2E CI awal; masih harus mempertahankan lockfile pada pipeline final dan menilai dependency audit sebelum rilis.

**Finalisasi ADR-010 untuk M-001:** kompatibilitas Node 24 + toolchain terkunci di `package-lock.json` telah dibuktikan oleh CI run 38210031678 (format/lint/typecheck/unit/build/browser). Runtime dependency audit `--omit=dev --audit-level=high` menghasilkan 0 vulnerabilities saat gate. Versi dapat ditinjau ulang jika advisory atau persyaratan Node/Vite berubah; perubahan wajib memperbarui lockfile dan gate, bukan mengabaikan advisory.

## ADR-011 — Fondasi identitas M-002 lokal (sementara)

Tetap memakai Supabase Auth email/password dengan alias internal `username@accounts.invalid` dan `profiles` sebagai sumber peran/aktif. Tidak membuat alamat pribadi, tidak mengaktifkan signup, dan tidak mengandalkan `user_metadata` untuk otorisasi. RLS SELECT milik sendiri hanya untuk `active=true` dan `must_change_password=false`; tidak ada izin tulis klien. Pembaca yang masih diwajibkan mengganti password perlu memakai endpoint perubahan password khusus TASK-007 (bukan membaca profil secara langsung). Helper `private.profile_ready_v1` SECURITY DEFINER berada di schema tidak terekspos dengan fixed empty search_path. Admin pertama hanya diprovisi secara lokal dan ada rollback Auth jika insert profile gagal.

Keputusan alias berstatus **pending compatibility spike** terhadap Auth lokal dan penyedia sebelum production; ketidakcocokan bukan izin mengganti metode login diam-diam. Supabase CLI pada integrasi CI dipin `2.84.2`, tanpa membeli/menautkan proyek cloud. Rujukan: https://supabase.com/docs/guides/local-development/cli-workflows dan https://supabase.com/docs/guides/database/postgres/row-level-security .

**Hasil ADR-011 / compatibility spike:** pada [CI run 38212349563](https://github.com/ferdilpu-sudo/layarbelajar/actions/runs/38212349563), admin-created `username@accounts.invalid` diterima dan sign-in password mengembalikan sesi; tidak perlu mengubah keputusan alias. `auth.email.enable_signup=false` mematikan provider login, jadi gunakan global `auth.enable_signup=false` dan provider email `enable_signup=true`. Kesimpulan baru berlaku untuk stack lokal CLI 2.84.2; kompatibilitas project cloud harus dibuktikan sebelum rilis. Tidak memberi izin signup publik atau email pribadi siswa.

## ADR-012 — Edge account operations dan browser session M-002

Gunakan dua Supabase Edge Functions: `account-admin` (provision teacher/student, list 50, reset password, deactivate) dan `change-password` (status siap/pending serta ganti sandi). Keduanya memakai `verify_jwt=true`, validasi GoTrue user JWT per request dan profile ber-service-role; role admin hanya berasal dari database, bukan metadata JWT yang bisa diedit pengguna. `APP_ALLOWED_ORIGINS` allowlist frontend diwajibkan untuk hosted; pada lokal hanya loopback. Service role tetap server-only dan output JSON `Cache-Control: no-store`. Password sementara dibuat dengan secure randomness, tidak dicetak/log/dimasukkan ke tabel profile.

Auth user creation dan insert profile tidak atomik lintas layanan. Insert profile gagal → rollback Auth, jika rollback gagal tandai ID internal untuk rekonsiliasi manual. Reset harus mengunci akses via `must_change_password=true` sebelum Auth update; gagal Auth berarti akun tetap terkunci, bukan memberi akses tanpa password valid. Ganti password: Auth update terlebih dulu, baru flag dilepas; login ulang dengan password baru jika token sebelumnya dicabut GoTrue (dibuktikan pada pengujian lokal).

Sementara, session browser hanya di memori tab dan logout meminta pencabutan refresh token secara best-effort; ini mengurangi persistensi tetapi belum memenuhi usability sesi yang tahan reload/refresh dan expiry. Risiko dan solusi refresh session ditunda ke gate M-002 berikutnya; tidak boleh menganggap seluruh AC-002 lengkap. Dokumen ini adalah keputusan sementara yang dapat diganti dengan SDK Supabase setelah dependency/lockfile dan tes keseluruhan siap.

## ADR-013 — Otomasi UI Auth lokal dan kerahasiaan fixture

Auth/browser E2E tidak dimock. Backend CI menyiapkan Docker Supabase lokal dan Edge Functions lalu memulai Vite dengan env publik saja, menggunakan Playwright pada 360/768/1280/1920. Test Node melakukan create/delete fixture account via local service role tetapi tidak menyematkan key ke bundle frontend. Setiap viewport memakai username acak untuk menghindari konflik saat proyek Playwright paralel. Aturan jangan ambil trace/screenshot/video ketika kata sandi sementara mungkin masih terlihat, termasuk pada failure artifact.

Sesi klien sementara tetap in-memory sehingga reload memicu login ulang. Tujuannya fail closed sampai refresh token teruji; ini bukan pola final UX sekolah. Browser navigation E2E memakai client-side route, bukan reload tak disengaja. Rencana berikut: penyegaran token di memori, revalidasi profil/server role setelah refresh, token revoked/inactive tidak boleh tetap mengakses backend; tidak menambahkan penyimpanan password/refresh token permanen.

## ADR-014 — Refresh session only in memory

LayarBelajar memilih GoTrue refresh-token rotation berbasis API yang tetap hanya hidup di React provider/tab, tanpa penyimpanan persisten untuk siswa. `expires_in` dipetakan ke deadline lokal dan refresh proaktif (90 detik sebelum expiry), diserialkan per tab (single-flight), dilakukan saat foreground serta pengecekan 60 detik untuk active/role/pending. Setelah token direfresh, Edge GET `change-password` memeriksa ulang status profil. Kegagalan refresh atau revalidasi memutus sesi lokal, bukannya membiarkan state peran lama. Tombol admin dan update password menggunakan token yang sudah divalidasi.

Rotating refresh tokens yang dipakai lebih dari sekali dapat ditolak/dimaknai reuse oleh GoTrue: jangan melakukan refresh paralel lintas komponen. Desain ini tidak melakukan cross-tab persistensi/sinkronisasi atau login otomatis setelah reload; untuk UX produk nanti boleh diubah hanya dengan ADR dan uji ancaman/session baru. Browser test memaksa expiry singkat **hanya di persepsi klien** dan memverifikasi server nyata tetap merotasi; tidak memberi izin melewati expiry production.

**Gate terbuka:** Supabase hosted, HTTPS/CORS allowlist, operasional rate/backup dan Windows bootstrap manual harus dibuktikan secara terpisah; M-002 belum production Verified. Ref dokumentasi Supabase: https://supabase.com/docs/guides/auth/sessions .

## ADR-015 — Manual, read-only preflight sebelum hosted mutation

Proyek belum mempunyai bukti deployment cloud milik pemilik. Untuk mencegah salah target/prod dan pembocoran credential, preflight hosted pertama **hanya** memakai GitHub environment `staging` (dispatch manual, `contents: read`) dengan `STAGING_PROJECT_REF`, `STAGING_SUPABASE_URL`, `STAGING_APP_ORIGIN`, `STAGING_ANON_KEY`. URL harus HTTPS `<ref>.supabase.co` persis dan origin frontend HTTPS terpisah. Hanya legacy `anon` JWT diizinkan sebagai public key pada gate ini karena Edge `verify_jwt=true` dan implementasi saat ini belum menerima `sb_publishable_` opaque key pada bearer header. Pindah ke publishable-key model baru membutuhkan ADR dan integrasi test khusus; jangan menurunkan verifikasi JWT hanya agar lulus.
- Probe menggunakan GET/OPTIONS tanpa membuat user, memakai service role atau mengubah database. Validasi hanya health, anon RLS, positive/negative CORS. Penolakan atau kebutuhan setup baru meninggalkan M-002 **NOT VERIFIED**, bukan alasan memakai produksi sebagai staging.
- Lanjut hosted full acceptance hanya dengan project staging milik pemilik dan bukti eksplisit sesuai `docs/m002-hosted-acceptance.md` serta `docs/m002-staging-runbook.md`; jangan mencampur contract-test offline dengan hasil staging.
