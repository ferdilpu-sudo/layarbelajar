# Aturan Pengembangan — LayarBelajar

Versi dokumen 2 — identitas LayarBelajar dan arah soft brutalism.

## Modularitas

1. Satu file memiliki satu tanggung jawab utama. Pisahkan layar, use case, validasi, repository, scoring dan operasi akun. Jangan menaruh seluruh katalog/editor/sesi pada App.tsx atau seluruh backend pada satu Edge Function.
2. Susun berdasarkan modul pada [architecture](./architecture.md). UI memanggil application; domain bebas React/Supabase; infrastructure mengimplementasikan port. Tidak boleh circular import.
3. Ukuran 250–350 baris non-kosong memicu review tanggung jawab, bukan batas otomatis. Pecah berdasarkan alasan perubahan; hindari puluhan pembungkus satu baris. Exception kohesif dicatat pada decisions.
4. Shared module baru hanya jika ada lebih dari satu konsumen nyata. State form lokal, server state melalui query layer; jangan menyimpan semua state dalam satu global store.

## Bahasa, struktur dan kontrak

TypeScript strict; hindari any dan type assertion tanpa validasi. Nama domain/data memakai English konsisten dengan schema, teks pengguna Bahasa Indonesia. Komponen PascalCase; fungsi/variabel camelCase; SQL snake_case; test dekat modul yang diuji atau folder integrasi terkait. Boundary menerima unknown lalu memvalidasi dengan schema. Tipe API bukan berarti data runtime otomatis valid.

Kontrak schema adalah sumber nama field. Jangan menambah tipe soal, peran, skor game, integrasi AI atau upload ZIP tanpa memperbarui kebutuhan dan keputusan. Public API modul kecil. Export helper scoring murni dengan input eksplisit agar bisa diuji.

## Kontrol data dan keamanan

- RLS untuk semua tabel API dan Storage; deny-by-default. Cek admin/guru/keanggotaan pada server. Menyembunyikan tombol bukan otorisasi.
- profiles.role/active/must_change_password tidak dapat diedit langsung klien. Admin hanya membuat teacher/student; satu admin awal diprovisi melalui skrip pemilik. Jangan memakai user_metadata sebagai sumber otorisasi.
- Secret Admin API/service role hanya environment backend atau local provisioning, tidak prefix VITE_, log, fixture atau git. Public key frontend aman hanya bila RLS/grants benar; jangan menyebutnya mekanisme proteksi tunggal.
- SQL parameterized; RPC SECURITY DEFINER bila benar-benar diperlukan, fixed search_path dan explicit grants. Test sebagai anon dan JWT tiap peran, bukan semua dengan secret yang melewati RLS.
- Keys/rubrik/grades privat. Endpoint siswa sebelum final tidak memuat poin, correctness atau kunci. Siswa tidak boleh menetapkan waktu, ID aktor atau final_score.
- HTML bebas hanya dalam iframe game dengan kebijakan [schema](./schema.md). Tidak ada dangerouslySetInnerHTML untuk materi/editor. Atribut event/link berbahaya ditolak. Game tidak menerima token atau akses origin induk.
- Validasi tipe/ukuran aset server-side dan browser; nama objek acak. Berkas privat tidak menjadi publik hanya karena pengguna tahu path. Aset publik hanya setelah revisi terbit.
- Rate limit awal: join 5 percobaan/menit/akun, login batas penyedia ditambah pengendalian IP bila proxy digunakan; beri respons generik. Implementasi rate limit harus server-side dan tidak berbasis memori Edge Function saja. Batas join memakai private.rate_buckets sesuai schema; kegagalan validasi kode tetap dihitung.

## Konsistensi dan error

Mutasi bernilai penting memakai request_id dan optimistic version. Retry hanya timeout/kegagalan sementara dengan request_id sama; jangan mengulang mutasi memakai UUID baru secara otomatis. Request sama payload beda adalah konflik. Transisi sesi dan kirim jawaban memakai lock dengan urutan konsisten. Database menentukan waktu dan final score.

Pisahkan error jaringan, validasi, konflik, autentikasi dan akses. Pesan pengguna memberi langkah pemulihan; log hanya kode/request ID. Jangan log password, token, isi jawaban, HTML unggahan atau seluruh response Auth. Konflik edit tidak ditimpa otomatis.

Konten terbit immutable; revisi baru untuk perubahan. Penghapusan default arsip. Migrasi diuji pada DB kosong dan upgrade; backup sebelum mutasi destruktif. Jangan memakai db reset pada produksi. Cadangan database dan objek Storage adalah dua pekerjaan berbeda.

## Perilaku antarmuka

Loading/empty/error/success/forbidden wajib. Tidak ada indikator “tersimpan” sebelum server mengonfirmasi. Setelah reconnect ambil state server dahulu; tampilan lama tidak boleh mengizinkan jawaban soal tertutup. Cleanup listener Realtime saat unmount/logout; tab tersembunyi tidak polling terus.

Interaksi sentuh, keyboard, fokus dan alternatif drag menjadi bagian fitur, bukan polish opsional. Cetak punya stylesheet khusus dan tidak membocorkan nilai/kunci. Gambar punya alt; video tidak autoplay. Font/UI tidak bergantung CDN saat bundling dapat dilakukan.

## Gate pengembangan

Tool yang direncanakan: Prettier, ESLint, TypeScript, Vitest, Testing Library, Playwright, Supabase CLI/SQL integration. Perintah di [README](./README.md) belum dieksekusi karena belum ada scaffold. Saat tersedia: format-check, lint, typecheck, test unit/integrasi relevan, build, E2E alur yang diubah, dan dependency audit. Temuan high/critical runtime harus diperbaiki atau diberi mitigasi tertulis yang ditinjau sebelum rilis.

Perubahan kecil dapat menjalankan test yang relevan; sebelum milestone dinyatakan verified jalankan semua gate milestone. Jangan mengubah test hanya agar lolos tanpa memeriksa perubahan perilaku. Tidak perlu target persentase coverage semu; utamakan scoring, RLS, konkurensi, dan alur kelas.

Review menjelaskan perubahan perilaku, REQ/AC/TEST yang dipenuhi, migrasi dan hasil aktual. Perbarui satu dokumen pemilik kontrak lalu periksa rujukan lintas dokumen. Deviasi dicatat sebagai ADR dengan alasan, risiko dan pemicu tinjau ulang. Protokol agent ada pada [AGENTS](./AGENTS.md).

## Aturan desain v2

REQ-014 wajib: gunakan token design.md melalui CSS variables dan komponen bersama; dilarang membuat salinan hex/shadow/radius per halaman. Nama UI kanonis LayarBelajar; nama enum/API tetap mengikuti schema. Semua chip kategori memiliki label, semua pilihan memiliki indikator selected selain warna, dan outline fokus tidak boleh dihapus demi tampilan.

Hard shadow dan border diterapkan selektif, bukan semua div. State tekan memakai transform tanpa mengubah layout; reduced motion menonaktifkan gerak. Hindari gradient, glass blur dan shadow lembut sebagai gaya utama karena tidak sesuai arah yang diputuskan. Jangan membuat semua teks uppercase atau memakai font dekoratif untuk isi pelajaran.

Review visual mencakup HP, IFP, admin dan cetak. Token overrides cetak menghapus shadow/dekorasi; tema tidak menjadi alasan melemahkan sandbox atau menginjeksi CSS ke game. Jalankan TEST-014 pada komponen/layout yang berubah; ubah screenshot baseline hanya setelah meninjau penyebab perbedaannya. Nilai token kanonis diperbarui di design.md bila hasil QA menuntut penyesuaian.
