# Rencana Pengujian — LayarBelajar

Versi dokumen 2 — identitas LayarBelajar dan arah soft brutalism.

Status semua test: **NOT RUN — implementasi belum tersedia**. Dokumen ini mendefinisikan penerimaan, bukan bukti aplikasi sudah siap produksi. Penanggung jawab otomatisasi: AI coding agent/developer. Uji perangkat kelas dan penerimaan pembelajaran: pemilik produk.

## Strategi dan lingkungan

Unit untuk scoring/normalisasi/validasi/state machine; integrasi dengan PostgreSQL/Supabase lokal untuk RLS, RPC dan transaksi; E2E browser untuk alur publik/admin/guru/siswa. Mock tidak menggantikan integrasi akses data. Fixture sintetis sesuai schema; tidak memakai data siswa nyata.

| Target | Lingkungan | Cara |
|---|---|---|
| Logika dan API | Local Supabase melalui Docker, role anon/admin/teacher/student | Vitest + SQL/HTTP integration |
| Desktop/IFP simulasi | Chromium 1920×1080 dan 3840×2160, touch emulation | Playwright |
| HP Android | Chromium viewport 360×800 dan perangkat Chrome nyata | Playwright + manual |
| iPhone | WebKit mobile dan Safari perangkat jika tersedia | Otomatis + manual sebelum klaim dukungan penuh |
| IFP aktual | Model/browser pemilik, Wi-Fi kelas | Manual wajib M-007 |
| Cetak | Chromium print A4, print-to-PDF, minimal 3 halaman | Inspect hasil PDF/manual |
| Beban awal | 1 guru + 8 siswa browser context, satu sesi | Skenario lokal/staging tanpa data nyata |

## Matriks penerimaan

| Test | REQ | AC | Tingkat | Input/langkah | Hasil yang harus terbukti |
|---|---|---|---|---|---|
| TEST-001 | REQ-001 | AC-001 | Integrasi/E2E | Seed terbit/draf/arsip; cari judul dan filter berlapis sebagai anon | Hanya revisi terbit; pagination stabil; kosong dapat direset; akses draft ID langsung ditolak |
| TEST-002 | REQ-002 | AC-002 | Integrasi/E2E | Admin buat akun alias, login, wajib ganti password; panggil API admin sebagai siswa; nonaktifkan akun | Login tanpa email siswa; hak terlarang ditolak; token lama tidak dapat baca data setelah deaktivasi |
| TEST-003 | REQ-003 | AC-003 | Integrasi/E2E | Publish draf, buat sesi, edit bank/revisi dan publish baru; dua tab edit version sama | Katalog versi baru, sesi lama tetap snapshot; satu edit konflik; publish tidak lengkap ditolak |
| TEST-004 | REQ-004 | AC-004 | Integrasi/E2E | Tampilkan tiap blok, PDF valid/rusak, PPT dan upload MIME palsu/ukuran lebih | Materi/unduh berjalan, fallback jelas, file tidak valid ditolak; video tidak dimuat sebelum klik |
| TEST-005 | REQ-005 | AC-005 | Unit/Integrasi | Buat lima tipe, key kosong, ID opsi asing; inspeksi API siswa | Schema valid diterima, invalid ditolak; tidak ada kunci/rubrik privat pada payload siswa |
| TEST-006 | REQ-006 | AC-006 | E2E/Manual | LKPD campuran pada HP dan print A4 3 halaman | Jawaban tersimpan; print tanpa tombol/kunci/nilai; soal tidak terpotong buruk |
| TEST-007 | REQ-007 | AC-007 | E2E/Integrasi | Upload game mandiri; coba parent DOM/storage, fetch, popup, top navigation; pantau network/DB | Game normal bekerja, upaya terlarang gagal, tidak ada request eksternal/score DB |
| TEST-008 | REQ-008 | AC-008 | E2E/Manual | Mode IFP touch/keyboard, fullscreen, demo matching/drag dan reset | Kontrol ≥56 px, alternatif tap/keyboard bekerja, tanpa nilai individu atau data privat |
| TEST-009 | REQ-009 | AC-009 | Integrasi | Guru A buat kelas, tambahkan siswa; guru B baca/edit; arsip | Kepemilikan terjaga, daftar privat, arsip melarang sesi baru tanpa menghapus riwayat |
| TEST-010 | REQ-010 | AC-010 | Integrasi/E2E | 8 siswa join; kode salah/expired/bukan anggota; guru start; putus jaringan 10 detik; reconnect | Tidak bocor metadata, state konsisten; target update ≤2 detik di lingkungan uji; reconnect memulihkan soal terkini |
| TEST-011 | REQ-011 | AC-011 | Unit/Integrasi | Submit duplikat, payload score palsu, race close/submit, grade uraian, jawaban kosong | Satu jawaban logis, score klien ditolak, lock konsisten, pending/final dan skor benar |
| TEST-012 | REQ-012 | AC-012 | Integrasi/E2E | Buka riwayat siswa A dengan akun B; guru lihat kelas sendiri; cetak rekap | Isolasi terjaga; skor game/demo tidak ada; rekap akurat dan tanpa kredensial |
| TEST-013 | REQ-013 | AC-013 | Integrasi/Manual | Hitung bytes, hapus unused vs referenced; backup DB/objek, restore lokal; cek konfigurasi Free | Bytes sesuai metadata; referensi aman; pemulihan dapat dibuka; tidak perlu layanan berbayar |
| TEST-014 | REQ-014 | AC-014 | Komponen/E2E/Manual | Audit token/brand, empat viewport, fokus/selected/reduced-motion, IFP dan print | Identitas konsisten; kontras lulus; kontrol tidak terpotong; cetak jelas; sandbox tetap utuh |

## Kasus konkret wajib

- TEST-011 scoring: empat soal masing-masing 10 poin; choice benar 10, isian salah 0, matching benar 10, uraian 5 → final 62,50. Sebelum uraian diberi nilai: final_score null dan pending_review. Tambahkan soal tak dijawab dan pastikan masuk denominator serta mendapat 0 saat sesi ended.
- TEST-011 normalisasi: key “Fotosintesis” menerima “  FOTOSINTESIS ”, tidak menerima “fotosintesa” tanpa key tambahan. Matching urutan array berbeda tetap benar; pasangan duplikat/asing ditolak.
- TEST-011 idempotency: dua request identik dengan request_id sama menghasilkan answer_id/version sama. Payload berbeda dengan ID sama → CONFLICT. Dua update dengan expected_version sama: tepat satu berhasil. Saat close bersaing dengan submit, hasil mengikuti lock; tidak ada jawaban diterima setelah close commit.
- TEST-010 expiry: manipulasi jam klien tidak memperpanjang sesi. Kode dirotasi membuat kode lama tidak berlaku; peserta lama tetap terdaftar. Join sukses berulang tidak membuat attempt baru. Realtime terlambat tidak mengembalikan state ke versi lama.
- TEST-002: siswa mencoba mengganti profiles.role, active, must_change_password; permintaan ditolak. Siswa belum ganti password hanya boleh memakai jalur perubahan password/logout, bukan join sesi. Provision Auth sukses tapi insert profile gagal harus direkonsiliasi tanpa akun yatim berhak akses.
- TEST-003/007: arsip konten menutup akses baru publik pada aset terkait; peserta riwayat yang sah tetap bisa melihat revisi lama. Direct Storage path tidak melewati policy.
- TEST-012: REST query langsung ke private keys/grades atau tabel attempts dengan filter siswa lain tidak memberikan data. Service-role fixture tidak dipakai pada langkah pengujian hak akses.
- TEST-013: restore satu materi bergambar, satu PDF, satu game dan satu sesi bernilai; bandingkan hash aset, count relasi dan nilai final. Cadangan DB tanpa objek dinyatakan gagal.

## Tool, perintah dan CI

**Direncanakan — verifikasi setelah scaffolding.** Script package dibuat pada M-001/M-002 sebelum digunakan sebagai gate:

```bash
npm run format:check
npm run lint
npm run typecheck
npm run test:unit
npm run test:integration
npm run test:e2e
npm run build
npm audit --omit=dev
```

Integrasi memerlukan Supabase lokal berjalan dan migrasi/fixture terpasang. Playwright memasang browser pada runner. Jangan menjalankan test destruktif dengan URL produksi. CI menolak build yang mengandung secret. Unit cepat pada setiap perubahan; integrasi untuk schema/RPC/access; E2E alur inti sebelum merge/rilis. Test rate limit dan Storage harus menggunakan backend nyata lokal, bukan hanya mock fungsi yang mengembalikan true.

## Gate rilis dan laporan

Seluruh TEST-001..014 lulus; tidak ada blocker otorisasi, nilai, kehilangan jawaban atau pemutaran IFP; lint/type/build lulus; migrasi dan restore diuji; perangkat IFP nyata diverifikasi. Ukur latensi dari aksi host sampai render tiap klien, laporkan maksimum dan p95 minimal 20 pergantian soal; target 2 detik adalah sasaran, bukan benchmark yang sudah tercapai. Uji aksesibilitas keyboard, kontras, zoom 200%, touch, print dan lebar 360 px.

Catat pada laporan milestone: tanggal, commit, lingkungan/browser/perangkat, perintah, TEST IDs, PASS/FAIL/NOT RUN, bukti screenshot/trace bila membantu, bug dan langkah berikut. Test yang belum dijalankan tetap NOT RUN. Spesifikasi ini hanya telah diperiksa sebagai dokumen; tidak menggantikan gate aplikasi. Rujuk [plan](./plan.md).

## Prosedur visual v2 — TEST-014

1. Render komponen Button, Card, Input, FilterChip, AnswerOption, Alert dan Dialog pada default/focus/selected/loading/disabled/error. Ambil screenshot deterministik dengan fixture tetap dan animasi dimatikan; tinjau baseline pertama secara manual sebelum menjadikannya pembanding.
2. Periksa halaman katalog, detail materi, login, editor admin, kontrol guru, layar IFP, soal siswa dan hasil pada lebar 360/768/1280/1920 px. Nama LayarBelajar konsisten; judul panjang tidak menutup badge/tombol. Tidak ada horizontal overflow pada body; tabel boleh punya wrapper scroll.
3. Hitung kontras teks ink pada seluruh pastel dan surface/canvas, muted pada surface/canvas, serta pasangan success/error pada design.md. Target teks biasa ≥4,5:1; kontrol/fokus ≥3:1 terhadap bidang relevan. Periksa pula keadaan disabled/loading dan thumbnail yang berbeda, bukan hanya token default.
4. Emulasi keyboard/touch dan reduced motion. Selected tetap terbaca dalam grayscale melalui centang/teks; tombol IFP ≥56 px dan HP ≥44 px; transform active tidak memindahkan susunan kartu atau menutupi elemen sebelah.
5. Cetak LKPD tiga halaman dengan print background mati. Shadow/dekorasi hilang, tulisan/border bermakna tetap terlihat dan header memakai LayarBelajar. Konten privat tidak ikut tercetak.
6. Jalankan TEST-007 bersama audit shell game: gaya baru tidak mengubah sandbox, CSP, perilaku fullscreen atau akses token. Isi game boleh berbeda gaya tanpa membuat test visual shell gagal.

Status tetap NOT RUN untuk seluruh pengujian UI aplikasi sampai implementasi tersedia. Validasi hitung kontras token pada dokumen bukan bukti bahwa layout dan aksesibilitas runtime sudah lulus.

## Checkpoint M-001: status pengujian awal (12 Oktober 2026)

Source unit test filter katalog dan Playwright E2E fixture sudah ditulis di branch fitur, tetapi **belum dieksekusi** karena dependency install terhambat DNS registry npm. Lint/typecheck/build/format/test serta audit kontras, viewport IFP, dan RLS tetap **NOT RUN**. CI baru menyediakan percobaan awal, bukan bukti PASS. TEST-001 belum lengkap (belum ada DB/RLS), dan TEST-014 belum memenuhi gate perangkat/komponen.
