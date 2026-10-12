# Desain Interaksi — LayarBelajar

## Prinsip

Materi mudah dicari, kontrol besar pada IFP, dan siswa selalu tahu apakah jawabannya tersimpan. Bahasa sederhana; jangan menampilkan istilah database, sandbox atau deployment pada alur belajar. Nama tombol: “Mulai kelas”, “Gabung sesi”, “Tampilkan di layar”, “Simpan draf”, “Terbitkan”, “Kirim jawaban”.

Identitas v2 yang diputuskan: **LayarBelajar**, dengan arah **soft brutalism bernuansa alat belajar**. Karakter visual: kartu belajar berwarna pastel, garis arang tegas, bayangan tanpa blur, sudut sedikit membulat, dan tipografi kuat. Arah desain dan nama menggantikan tema generik v1. Angka token di bawah adalah default implementasi yang ditetapkan dalam upgrade ini, dapat disesuaikan bila uji perangkat/kontras memerlukannya. Tagline usulan: “Sentuh layarnya, jelajahi ilmunya.” Tagline bukan syarat fungsional atau teks wajib semua layar.

## Navigasi dan layar

| ID | Rute direncanakan | Aktor | Isi dan aksi utama | Kebutuhan |
|---|---|---|---|---|
| UI-001 | / | Publik | Katalog, cari, filter, kartu jenis konten, reset filter | REQ-001 |
| UI-002 | /konten/:slug | Publik | Judul, klasifikasi, pemutar, unduh/cetak/mainkan | REQ-004, REQ-006, REQ-007 |
| UI-003 | /login | Akun | Username/password, pesan generik, bantuan hubungi admin | REQ-002 |
| UI-004 | /akun | Akun | Ganti password, logout | REQ-002 |
| UI-005 | /admin/konten | Admin | Daftar draf/terbit/arsip dan tambah konten | REQ-003 |
| UI-006 | /admin/konten/:id/edit | Admin | Editor blok, klasifikasi, soal, HTML game, pratinjau | REQ-003, REQ-005, REQ-007 |
| UI-007 | /admin/akun | Admin | Buat akun, nonaktifkan, reset password | REQ-002 |
| UI-008 | /kelas dan /kelas/:id | Guru/admin | Kelas, anggota, pilih latihan/LKPD, rekap | REQ-009, REQ-012 |
| UI-009 | /sesi/:id/kontrol | Pemilik sesi | Lobi, kontrol soal, hitungan jawaban, akhiri | REQ-010 |
| UI-010 | /sesi/:id/layar | Pemilik sesi | Kode, soal aktif, status kelas, demonstrasi | REQ-008, REQ-010 |
| UI-011 | /gabung dan /sesi/:id/ikuti | Siswa | Kode, tunggu guru, jawab, status tersimpan | REQ-010, REQ-011 |
| UI-012 | /sesi/:id/nilai | Pemilik sesi/admin | Uraian, rubrik, poin, rekap dan cetak | REQ-011, REQ-012 |
| UI-013 | /riwayat | Siswa | Sesi sendiri, menunggu/final, rincian hasil | REQ-012 |
| UI-014 | /admin/penyimpanan | Admin | Total berkas, hapus berkas tak dipakai, panduan kuota/cadangan | REQ-013 |

Header publik: Katalog, Gabung sesi, Masuk. Setelah login tampil navigasi sesuai peran. Di HP gunakan menu ringkas yang tetap berlabel. Filter menjadi panel yang bisa ditutup; pilihan tersimpan pada query URL. Tombol kembali memulihkan posisi/filter katalog.

## Editor konten

Pilih jenis: materi, latihan, LKPD atau game. Form metadata memakai jenjang → kelas dan mapel/topik. Jenjang dan kelas dapat ditambah admin, bukan daftar yang terkunci pada SD/SMP/SMA. Admin mengisi tujuan dan petunjuk LKPD; latihan/LKPD memilih soal bank dan menyusun urutan. Editor menampilkan perubahan belum disimpan dan status simpan. Terbit memerlukan pratinjau valid; pesan validasi dekat kolom, fokus pindah ke kesalahan pertama.

Materi terdiri atas blok teks terstruktur, gambar berteks alternatif, tautan video, slide (kelompok blok per halaman), PDF, dan lampiran. PPT/PPTX diberi label “Unduh PowerPoint”; unggah PDF pendamping adalah langkah manual. Tidak menjanjikan konversi. Gambar/video memiliki lazy loading. Jangan render HTML bebas pada blok teks.

Game menerima file .html atau tempel HTML, maksimal sesuai schema. Setelah validasi tampil petunjuk bahwa game harus mandiri tanpa CDN/aset eksternal. Pratinjau berjalan dengan pembatasan sama seperti pemutar publik; tersedia reset dan layar penuh pada pembungkus. Kesalahan JavaScript tampil sebagai “Game belum dapat dijalankan” dengan informasi teknis hanya untuk admin.

## Kelas dan sesi

Guru membuat kelas, memilih siswa yang sudah dibuat admin, lalu memilih revisi latihan/LKPD. Pada lobi, kode besar dan tombol salin tersedia. Kode saja tidak memberi akses data: siswa tetap login dan harus anggota kelas. Guru dapat menambah anggota melalui layar kelas ketika diperlukan.

Siswa masuk → melihat judul sesi dan menunggu → soal dibuka → memilih/menulis jawaban → “Kirim jawaban” → “Jawaban tersimpan”. Jawaban dapat diperbarui selama soal terbuka. Saat ditutup, kontrol terkunci dan siswa menunggu soal berikutnya. Urutan guru: buka soal → tutup soal → berikutnya → akhiri sesi. Tidak menghapus jawaban bila siswa me-refresh atau kehilangan jaringan.

Mode IFP memakai font isi 28–40 px dan kontrol minimal 56 px sebagai default yang bisa diuji ulang pada perangkat nyata. Presentasi menyembunyikan menu admin, anggota dan nilai pribadi. Kontrol guru dapat dibuka pada tab/perangkat lain dengan akun guru; layar IFP tetap memerlukan sesi guru, bukan URL publik berisi akses khusus. Demonstrasi menggunakan state sementara lokal dan tombol reset; label “Mode latihan bersama — tanpa nilai”.

HP: satu soal per layar, tombol kirim terlihat tanpa menutupi jawaban, ukuran teks minimal 16 px. Isian tidak mengunci keyboard tertentu yang menghalangi rumus/teks. Menyeret memiliki alternatif “Pilih jawaban → pilih tempat” dan dapat digunakan dengan keyboard.

## Penilaian dan cetak

Guru melihat daftar uraian belum dinilai, rubrik, rentang poin dan kolom catatan. Simpan memakai versi agar perubahan guru pada tab lain tidak tertimpa. Nilai akhir tampil setelah sesi berakhir dan semua uraian siswa tersebut dinilai; sebelum itu label “Menunggu penilaian”. Rekap kelas memakai tabel responsif dan tampilan kartu di HP.

Cetak LKPD memakai CSS print A4, margin sekitar 15 mm, judul, identitas kosong, tujuan/petunjuk dan ruang jawaban. Hindari pemisahan soal dengan pilihan jawabannya. Video/game menjadi tautan teks/aktivitas alternatif, bukan screenshot kosong. Cetak LKPD selalu lembar kosong tanpa kunci; cetak rekap adalah aksi terpisah khusus guru/admin. Browser “Simpan sebagai PDF” tersedia tanpa layanan konversi berbayar.

## Keadaan wajib dan aksesibilitas

Semua layar data memiliki loading, kosong, gagal, berhasil dan akses ditolak. Jaringan putus menampilkan banner dan menonaktifkan pengiriman; isi belum terkirim dipertahankan di memori tab, bukan dijanjikan tersimpan lintas restart. Setelah tersambung, ambil status server sebelum menawarkan kirim ulang. Hindari perubahan diam-diam pada jawaban yang telah terkunci.

Keyboard: fokus terlihat, urutan logis, dialog mengembalikan fokus, Esc menutup dialog aman. Label semantik untuk form, live region untuk status simpan dan soal berubah tanpa membacakan setiap keystroke. Kontras target WCAG AA (4,5:1 teks normal); hormati reduced motion; zoom 200%; hindari gerak dekoratif. Dukungan native Android/Windows tidak berlaku karena produk browser.

Validasi pada [testing](./testing.md). Detail data mengikuti [schema](./schema.md), bukan label visual. Model IFP sebenarnya masih terbuka dan diverifikasi pemilik sebelum rilis.

## Sistem visual v2 — sumber token kanonis

Gunakan token semantik berikut. Semua warna teks normal memakai ink atau muted yang diuji kontrasnya; warna pastel adalah bidang/latar, bukan warna teks pada putih.

| Token CSS | Nilai | Pemakaian |
|---|---|---|
| --lb-canvas | #FFF9F0 | Latar krem utama |
| --lb-surface | #FFFFFF | Area baca, editor dan form |
| --lb-ink | #242424 | Teks utama, border, bayangan keras |
| --lb-muted | #595959 | Teks pendamping pada canvas/surface |
| --lb-material | #BFDBFE | Kategori Materi dan bidang tombol utama |
| --lb-worksheet | #BFE8D5 | Kategori LKPD |
| --lb-exercise | #FDE68A | Kategori Latihan |
| --lb-game | #DDD6FE | Kategori Game |
| --lb-success-bg | #DCFCE7 | Pesan berhasil, disertai teks/ikon |
| --lb-success-text | #166534 | Teks/ikon berhasil pada success-bg |
| --lb-error-bg | #FEE2E2 | Pesan gagal, disertai teks/ikon |
| --lb-error-text | #991B1B | Teks/ikon gagal pada error-bg |
| --lb-focus | #1D4ED8 | Outline fokus 3 px dengan offset 3 px |
| --lb-border | 2px solid var(--lb-ink) | Kontrol, kartu dan panel utama |
| --lb-radius-control | 12px | Tombol, input dan pilihan jawaban |
| --lb-radius-card | 16px | Kartu materi/panel |
| --lb-shadow | 4px 4px 0 var(--lb-ink) | Tombol dan kartu interaktif |
| --lb-shadow-emphasis | 6px 6px 0 var(--lb-ink) | Panel penting di katalog/lobi |
| --lb-shadow-mobile | 2px 2px 0 var(--lb-ink) | Kartu/tombol pada HP |

Tidak semua container diberi border/shadow. Utamakan panel isi putih yang lapang; satu kartu tidak memerlukan banyak panel berbayangan di dalamnya. Warna jenis konten tidak berarti jawaban benar/salah. Chip kategori selalu memiliki label Materi/LKPD/Latihan/Game dan ikon bila membantu.

### Tipografi, ukuran dan tata letak

Default font stack: system-ui, -apple-system, BlinkMacSystemFont, “Segoe UI”, sans-serif. Wordmark LayarBelajar dan judul memakai weight 700–800, isi 400–500. Tidak membutuhkan font eksternal berbayar/CDN; font kustom baru memerlukan verifikasi lisensi dan bundling lokal. Body 16–18 px dengan line-height 1,5–1,7. Judul halaman 32–48 px desktop, 28–32 px HP. Mode IFP: judul 40–64 px, isi 28–40 px, label tombol ≥24 px. Nama panjang boleh membungkus, jangan memotong instruksi penting.

Spacing skala 4/8/12/16/24/32/48 px. Konten katalog max-width 1280 px; padding horizontal 16 px HP dan 24–32 px desktop. Grid kartu: satu kolom di bawah 640 px, dua pada 640–1023 px, tiga pada ≥1024 px; layar sangat lebar tetap mempertahankan lebar baca. Mode IFP memenuhi viewport dan tidak sekadar memperbesar grid katalog. Breakpoint adalah default uji, bukan deteksi perangkat IFP; pengguna menyalakan mode presentasi secara eksplisit.

### Komponen dan keadaan

| Komponen | Default | Interaksi/keadaan |
|---|---|---|
| Button | Border 2 px, biru pastel + ink, shadow 4 px, tinggi ≥48 px | Active translate 2px/2px dan shadow 2px; focus outline terpisah; disabled tanpa gerak, label tetap terbaca |
| ContentCard | Surface putih, thumbnail 16:9, badge jenis, judul, metadata | Link utama jelas, focus-within; hindari link yang membungkus tombol lain |
| FilterChip | Surface putih + border, tanpa shadow besar | Selected isi warna lembut + ikon centang + aria-pressed; bukan warna saja |
| Input/Select | Surface putih, border 2 px, label di atas | Error punya pesan dan aria-describedby; fokus tidak dihapus |
| AnswerOption | Bidang luas dengan label, border dan shadow kecil | Selected centang + aria state; status tersimpan terpisah dari status benar |
| Alert | Success/error semantic colors | Ikon dan teks; role/live region sesuai urgensi; tidak mengubah fokus tiba-tiba |
| Dialog | Surface putih, border arang, shadow tegas | Focus trap, label, tombol batal, kembali fokus ke pemicu |
| DataTable | Garis pemisah tipis, header netral | Tidak memberi tiap sel shadow; scroll hanya wrapper tabel atau kartu di HP |

Hover hanya enhancement untuk pointer presisi. Active tidak menggeser layout karena memakai transform; target sentuh tetap ≥44 px HP dan ≥56 px IFP. Loading menjaga lebar tombol, memakai aria-busy dan mencegah klik ganda. Default transisi 100–150 ms untuk warna/transform; prefers-reduced-motion menonaktifkan perpindahan/animasi. Tidak memakai animasi dekoratif berulang atau efek berkedip.

### Komposisi layar khas LayarBelajar

Katalog: header wordmark + navigasi → sapaan/judul pendek “Mau belajar apa hari ini?” → pencarian lebar → filter → grid koleksi. Jangan memasukkan hero sangat tinggi yang mendorong materi jauh ke bawah. Satu atau dua aksen geometris cukup dan diberi aria-hidden. Nama situs ditulis LayarBelajar; wordmark teks cukup untuk v2, logo gambar tidak menjadi ketergantungan.

Mode IFP: latar krem atau putih, satu panel soal besar, opsi jawaban kontras, tombol sebelumnya/berikutnya dan status sesi yang jelas. Kurangi ornamen dan bayangan pada area materi; kode sesi mendapat panel kuning dengan teks arang. Nilai pribadi tetap di kontrol guru. Mode HP mempertahankan identitas namun memakai shadow-mobile, satu kolom, dan ruang aman di sekitar tombol bawah.

Admin: gunakan komponen yang sama, tetapi warna pastel cukup pada header/aksi/badge. Editor dan tabel mengutamakan ruang kerja bersih. Hasil siswa memakai status teks, bukan pesta animasi atau leaderboard baru.

Print: override canvas/surface putih, teks hitam, hilangkan shadow, dekorasi, sticky controls dan transform. Border perlu tetap terbaca dalam cetak grayscale tanpa bergantung pengaturan print background. Header cetak memuat LayarBelajar dan judul LKPD; jangan mencetak tagline berulang di setiap soal.

### Batas penerapan ke konten tertanam

Tema berlaku pada shell/pembungkus game dan PDF, bukan CSS yang diinjeksi ke iframe atau PDF. Template game baru boleh mengikuti token secara mandiri tanpa membuka akses ke parent. Game lama/unggahan tidak otomatis bertema; sandbox tetap berlaku. Screenshot referensi UI bukan syarat deliverable ini: aturan/token dan perilaku di atas menjadi acuan implementasi awal.
