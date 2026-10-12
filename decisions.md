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
