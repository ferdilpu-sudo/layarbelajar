# Instruksi AI Coding Agent — LayarBelajar

## Tujuan dan batas

Implementasikan MVP pada [prd](./prd.md) dengan stack yang telah disetujui. Paket awal adalah spesifikasi, bukan aplikasi jadi. Mulai milestone pertama yang belum Verified pada [plan](./plan.md). Jangan mengklaim sistem siap produksi sebelum seluruh gate rilis terbukti.

Tetap pada React/TypeScript/Vite/Tailwind, Supabase dan Cloudflare Pages. Hanya admin menambah konten; guru mengelola kelas/nilai; siswa mengerjakan melalui sesi berkode; publik membaca konten terbit. Jangan menambah skor game, AI berbayar, registrasi mandiri, multi-sekolah, ZIP game atau konversi PPT otomatis. Tidak ada migrasi konten lama.

## Urutan baca dan otoritas

1. [README](./README.md): status dan perintah.
2. [prd](./prd.md): ruang lingkup, REQ/AC.
3. [plan](./plan.md): milestone dan tugas.
4. [architecture](./architecture.md), [schema](./schema.md), [design](./design.md): batas modul, kontrak data, perilaku UI.
5. [rules](./rules.md), [testing](./testing.md), [decisions](./decisions.md): aturan, bukti penerimaan dan alasan pilihan.

Instruksi pengguna terbaru mengungguli dokumen. PRD memiliki lingkup; schema memiliki field/API/scoring; design memiliki UX; architecture memiliki modul; rules memiliki standar; testing memiliki bukti; plan memiliki urutan. Jika konflik material, laporkan kontradiksi spesifik dan opsi penyelesaian sebelum mengubah kontrak. Asumsi reversibel boleh disesuaikan dengan bukti dan dicatat sebagai ADR.

## Cara bekerja

- Periksa repo yang tersedia sebelum scaffold; pertahankan pekerjaan pengguna. Satu TASK atau potongan fitur kecil setiap iterasi. Jelaskan modul terdampak lalu kerjakan kode, test dan dokumentasi terkait.
- Satu file satu tanggung jawab; ikuti lapisan fitur. Jangan membuat satu komponen besar yang sekaligus mengatur akun, editor, sesi, scoring dan database.
- Verifikasi versi stabil/kompatibilitas pada dokumentasi resmi, kunci dependency; jangan mengklaim versi terbaru dari ingatan. Semua perintah awal berstatus direncanakan sampai diuji.
- Jalankan test pada lapisan yang benar: unit scoring, integrasi RLS/RPC, E2E alur kelas. Test yang tidak dijalankan ditulis NOT RUN beserta alasan.
- Jangan menulis secret ke source/log/dokumen. Jangan menurunkan sandbox/RLS demi membuat test lulus. Untuk akun username, lakukan spike alias lebih awal; bukan menambahkan email siswa secara sepihak.
- Kerjakan lokal dan perubahan reversible dalam lingkup secara mandiri. Bila akses layanan belum tersedia, selesaikan bagian lokal lalu laporkan konfigurasi yang kurang tanpa meminta secret lewat chat. Tidak membeli layanan atau mengaktifkan biaya. Tindakan produksi mengikuti otorisasi pengguna yang berlaku; tidak perlu meminta ulang bila sudah diotorisasi.
- Hentikan langkah yang bergantung keputusan baru hanya untuk konflik produk, kebutuhan berbayar, perubahan model identitas, migrasi destruktif tanpa pemulihan, atau keterbatasan teknis yang mematahkan kontrak. Lanjutkan pekerjaan independen yang masih aman.

## Definition of done

REQ/AC dan TEST terkait terpetakan; format/lint/type/build serta test relevan lulus; error/empty/loading/forbidden dan aksesibilitas hadir; tidak ada secret atau akses lintas peran; migrasi diuji bila berubah; kontrak/dokumen diperbarui; plan memiliki status dan bukti nyata. Verifikasi IFP, print dan backup diwajibkan sebelum M-007 Verified.

Laporan tiap increment: ringkasan perilaku, file yang diubah, TASK/REQ/AC/TEST, perintah dan PASS/FAIL/NOT RUN, risiko/blocker, langkah terkecil berikut. Jangan menyatakan test runtime lulus hanya karena dokumen atau source terlihat benar.

## Mandat upgrade v2

Nama situs adalah LayarBelajar; arah visual adalah soft brutalism pada design.md. Baca token, pemetaan kategori, komponen dan perilaku cetak sebelum TASK-004. Implementasikan token/komponen sejak M-001 dan jalankan TASK-017 sebagai bagian fondasi. REQ-014/AC-014/TEST-014 adalah gate nyata, bukan saran dekorasi.

Gunakan wordmark teks, system font dan aset sederhana yang dapat dibundel; jangan menunggu logo atau menambahkan dependency berbayar. Default angka token dapat disempurnakan dengan bukti kontras/perangkat dan dicatat, tetapi jangan mengganti arah desain secara sepihak. Tema berlaku pada shell game, bukan injeksi ke konten iframe. Dokumen v2 tidak mengubah schema/API v1 maupun status aplikasi yang belum diimplementasikan.
