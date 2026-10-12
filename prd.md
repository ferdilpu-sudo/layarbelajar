# PRD — LayarBelajar

## Status dan tujuan

Spesifikasi v2, 12 Oktober 2026. Pemilik produk: pengguna/admin. Keputusan produk dan stack telah disetujui melalui wawancara. Status proyek: spesifikasi, belum ada aplikasi yang diimplementasikan atau diuji.

Bank materi pribadi yang dapat diakses publik, dipakai guru menjelaskan pelajaran pada IFP (Interactive Flat Panel), dan dipakai siswa mengerjakan latihan/LKPD lewat HP. Admin dapat terus menambah materi dan game HTML baru tanpa mengubah aplikasi. Semua jenjang didukung melalui klasifikasi konten; aplikasi tidak menjanjikan tersedianya materi lengkap untuk semua jenjang saat peluncuran.

## Pengguna dan ruang lingkup

| Peran | Tanggung jawab |
|---|---|
| Pengunjung | Mencari dan membuka konten terbit serta memainkan game tanpa akun |
| Admin | Mengelola akun, klasifikasi, materi, soal, LKPD, game; dapat menjalankan fungsi guru |
| Guru | Mengelola kelas sendiri, menjalankan sesi, menilai uraian dan melihat rekap kelasnya |
| Siswa | Login, bergabung memakai kode sesi, mengerjakan dan melihat hasil sendiri |

Diputuskan: web responsif, IFP sebagai perangkat utama, HP sebagai perangkat pendamping, internet stabil, kurang dari 10 pengguna awal, tanpa biaya bulanan, alamat hosting bawaan. Tidak ada migrasi data lama. Konten publik; identitas, jawaban, dan nilai siswa privat. Satu pengelola konten/admin, bukan marketplace atau sistem banyak sekolah.

MVP mencakup teks, gambar, video tautan, slide internal, PDF, lampiran PPT/PPTX; soal pilihan ganda satu jawaban, isian pendek, mencocokkan, menyeret jawaban, dan uraian; LKPD digital dan cetak; game satu HTML dengan CSS/JS tertanam; sesi kelas langsung berkode; riwayat dan rekap nilai. Seluruh kebutuhan tabel berikut adalah Must untuk rilis, walaupun dikerjakan bertahap.

Di luar cakupan: skor game dalam rekap, AI pembuat materi/penilai, pembayaran, pendaftaran mandiri, chat, konferensi video, offline/sinkronisasi offline, hosting video, konversi PPT otomatis, ZIP game multi-berkas, editor source code IDE, multi-sekolah, SEO lanjutan, tugas asinkron di luar sesi, dan ujian berpengawasan. Membaca materi dan bermain game mandiri tetap tersedia.

## Alur utama

1. Admin login → tambah konten → tentukan jenjang/kelas/mapel/topik → simpan draf → pratinjau → terbitkan. Draf tidak dapat diakses pengunjung. Perbaikan konten terbit menghasilkan revisi baru.
2. Pengunjung mencari topik → buka materi → baca atau tampilkan layar penuh. PDF dibaca langsung; PPT diunduh dan dapat didampingi PDF. Video hanya dimuat saat dipilih.
3. Guru memilih kelas dan latihan/LKPD terbit → membuat sesi → tampilkan kode di IFP → siswa login dan memasukkan kode → guru mulai serta mengendalikan soal → siswa mengirim jawaban → guru menutup sesi.
4. Siswa bergantian menyentuh IFP untuk demonstrasi tanpa nilai individu, atau menjawab dari HP untuk penilaian. Guru memisahkan tampilan presentasi dari dasbor kontrol agar nilai individu tidak diproyeksikan.
5. Jawaban objektif dinilai server; uraian menunggu guru. Guru menyelesaikan penilaian dan siswa melihat hasil sendiri. Guru membuka rekap kelas dan mencetaknya bila diperlukan.
6. Admin unggah/tempel HTML game → pratinjau → terbitkan → pengunjung memainkan dalam halaman aplikasi. Tidak ada pengiriman skor ke database.

## Kebutuhan dan penerimaan

| ID | Perilaku | Aktor | Penerimaan |
|---|---|---|---|
| REQ-001 | Katalog publik dengan pencarian, filter jenjang/kelas/mapel/topik/jenis | Semua | AC-001 |
| REQ-002 | Akun username/password buatan admin; otorisasi admin/guru/siswa | Akun | AC-002 |
| REQ-003 | Editor konten, revisi, draf, pratinjau, terbit dan arsip | Admin | AC-003 |
| REQ-004 | Pemutar materi multimedia dan lampiran | Semua | AC-004 |
| REQ-005 | Bank soal dengan lima tipe dan kunci penilaian privat | Admin | AC-005 |
| REQ-006 | LKPD berisi tujuan, petunjuk, materi dan soal; digital dan cetak | Admin/guru/siswa | AC-006 |
| REQ-007 | Tambah dan mainkan game satu file HTML/CSS/JS | Admin/semua | AC-007 |
| REQ-008 | Mode IFP sentuh, layar penuh dan demonstrasi tanpa nilai | Guru | AC-008 |
| REQ-009 | Kelas milik guru dan daftar siswa dari akun yang tersedia | Guru/admin | AC-009 |
| REQ-010 | Sesi langsung berkode, soal terkendali guru, pemulihan koneksi | Guru/siswa | AC-010 |
| REQ-011 | Simpan jawaban, penilaian otomatis, penilaian uraian oleh guru | Guru/siswa | AC-011 |
| REQ-012 | Riwayat siswa dan rekap kelas privat, tanpa skor game | Guru/siswa | AC-012 |
| REQ-013 | Kelola pemakaian berkas, cadangan dan pemulihan dengan paket gratis | Admin | AC-013 |
| REQ-014 | Identitas LayarBelajar dan soft brutalism konsisten, terbaca di HP/IFP/cetak | Semua | AC-014 |

### Kriteria penerimaan terukur

- AC-001: tanpa login, pencarian judul dan kombinasi filter mengembalikan hanya revisi terbit; hasil kosong memiliki pesan dan reset filter. Draf/arsip tidak dapat dibaca melalui URL/API publik.
- AC-002: admin membuat guru/siswa; pengguna login tanpa email pribadi, mengganti password sementara, dan logout. Siswa yang memanggil API admin ditolak; guru lain tidak dapat membaca kelas atau nilai yang bukan miliknya. Akun dinonaktifkan kehilangan akses data walau token belum kedaluwarsa.
- AC-003: draf tidak terlihat publik; terbit membutuhkan judul, klasifikasi valid, dan isi lengkap. Perubahan judul/soal tidak mengubah revisi yang sudah dipakai sesi berjalan atau riwayat nilai. Edit bersamaan menghasilkan konflik yang dapat dipahami.
- AC-004: teks/gambar/slide tampil, video dimuat atas tindakan pengguna, PDF memiliki tampilan dan fallback unduh, PPT/PPTX dapat diunduh. Berkas rusak, tipe dilarang dan ukuran berlebih ditolak; tautan video gagal memiliki fallback.
- AC-005: admin membuat satu soal valid untuk setiap tipe; pratinjau sesuai tampilan siswa. Soal objektif tanpa kunci ditolak. Endpoint siswa tidak mengandung kunci, rubrik, atau skor yang belum dirilis.
- AC-006: LKPD dengan campuran soal dapat dikerjakan pada sesi; cetak A4 berisi tujuan, instruksi, soal dan ruang jawaban tanpa tombol, kode sesi, nilai privat, atau kunci. Tampilan cetak diuji minimal tiga halaman tanpa isi terpotong.
- AC-007: HTML mandiri dapat diunggah atau ditempel, dipratinjau dan dimainkan dengan sentuh. Percobaan mengakses cookie/storage induk, navigasi induk, pop-up dan jaringan eksternal diblokir. Tidak ada catatan skor game yang tersimpan.
- AC-008: guru membuka mode presentasi, bernavigasi dan mendemonstrasikan jawaban dengan sentuh; mode tersebut tidak mencatat nilai individu atau menampilkan data akun privat. Tersedia tombol alternatif untuk aktivitas seret.
- AC-009: guru membuat kelas, menambahkan akun siswa aktif dan mengarsipkan kelas. Daftar anggota tidak publik; guru lain tidak dapat mengubah kelas tersebut. Pengarsipan tidak menghapus riwayat.
- AC-010: siswa anggota kelas memasukkan kode aktif lalu masuk lobi; bukan anggota/kode kedaluwarsa ditolak tanpa membocorkan kelas. Guru membuka/menutup soal. Dalam uji 1 guru + 8 siswa, perubahan diterima semua perangkat dalam target 2 detik pada koneksi stabil. Setelah putus 10 detik, klien mengambil keadaan terkini, bukan mengulang keadaan lama.
- AC-011: kiriman ganda menghasilkan satu jawaban logis; jawaban sesudah soal dikunci ditolak; server menghitung nilai objektif tanpa menerima nilai dari klien. Uraian berstatus menunggu hingga guru memberi poin/rubrik. Nilai akhir berada pada 0–100 dan tidak dianggap final sebelum seluruh uraian dinilai.
- AC-012: siswa hanya melihat riwayatnya; guru/admin melihat rekap yang diizinkan berisi kelas, sesi, materi, waktu dan nilai/status. Data demonstrasi dan game tidak muncul. Rekap dapat dicetak dan tidak memuat password/kunci soal.
- AC-013: admin melihat total ukuran berkas tercatat dan panduan memeriksa kuota layanan; latihan pemulihan cadangan database serta objek berhasil pada lingkungan lokal. Rilis tidak membutuhkan langganan, domain berbayar atau API berbayar.

- AC-014: nama LayarBelajar tampil pada shell publik, login, panel guru/admin dan header cetak. Komponen menggunakan token design.md; label jenis Materi/LKPD/Latihan/Game konsisten dengan warna. Uji pada 360, 768, 1280 dan 1920 px tidak memotong kontrol/isi utama; mode IFP tetap bertombol ≥56 px. Teks normal minimal 4,5:1, fokus terlihat, pilihan tidak ditandai warna saja, reduced motion dipatuhi, dan print grayscale tidak memuat shadow/dekorasi. Tema tidak mengubah akses atau CSS internal game.

## Target kualitas dan asumsi

Target teknik, belum terbukti: navigasi utama siap berinteraksi ≤3 detik pada Wi-Fi kelas; pembaruan sesi ≤2 detik; titik sentuh IFP ≥56 CSS px dan HP ≥44 CSS px; tanpa scroll horizontal pada lebar 360 px. Uji penerimaan memakai 9 akun bersamaan, bukan batas akun produk. Browser modern Chromium pada IFP dan Chrome Android; Safari iOS diuji sebagai kompatibilitas tambahan.

Asumsi reversibel: UI Bahasa Indonesia, tanggal Asia/Jakarta, soft brutalism pastel sesuai design.md, tanpa dark mode awal; kode berlaku 8 jam atau sampai sesi ditutup; satu attempt per siswa per sesi; setiap sesi memakai satu revisi latihan/LKPD. Batas berkas dan aturan skor di [schema](./schema.md). Nilai individu dirilis setelah sesi selesai dan penilaian lengkap.

Terbuka operasional: model/browser IFP sebenarnya dan akun penyedia hosting belum tersedia. Pemilik memvalidasi perangkat pada M-007. Tidak menghalangi implementasi lokal, tetapi harus diperiksa sebelum penggunaan kelas. Tidak ada jaminan uptime paket gratis; layanan dapat dijeda ketika tidak aktif. Kebijakan teknis ada di [decisions](./decisions.md).

Jejak penerimaan: [testing](./testing.md), urutan pengerjaan: [plan](./plan.md), interaksi: [design](./design.md).
