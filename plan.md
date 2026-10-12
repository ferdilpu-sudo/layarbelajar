# Rencana Implementasi — LayarBelajar

Status: seluruh milestone **Not started**. Paket ini handoff spesifikasi; belum ada source aplikasi, akun layanan atau deployment. Kerjakan bertahap dengan fitur vertikal yang dapat diuji. Semua Must pada [prd](./prd.md) diperlukan untuk rilis siap pakai, bukan hanya halaman katalog.

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

TASK-017 (bagian M-001, bergantung TASK-004): buat fixture komponen semua state, hitung kontras token, cek mapping jenis konten dan snapshot awal yang direview. TASK-018 (bagian M-007, bergantung TASK-015): audit TEST-014 end-to-end di HP/IFP/cetak, catat bukti sebelum rilis. Nomor tugas bukan urutan eksekusi; dependensi milestone menentukan urutan. Semua tugas implementasi tetap Not started.
