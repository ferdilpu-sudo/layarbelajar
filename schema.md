# Kontrak Data — LayarBelajar

## Konvensi dan kepemilikan

PostgreSQL adalah sumber kebenaran. File biner/HTML berada di Supabase Storage privat. Schema ini spesifikasi migrasi yang harus dibuat, bukan database yang sudah ada. Semua primary key UUID acak kecuali tabel penghubung dengan kunci komposit. Semua waktu `timestamptz` UTC; UI Asia/Jakarta. Kolom wajib kecuali ditandai `?`; `created_at` default now, `version` integer default 1 untuk objek mutable. ID aktor selalu dari auth.uid(), bukan dipercaya dari payload klien.

## Entitas

| ID | Tabel | Kolom utama dan relasi | Kebutuhan |
|---|---|---|---|
| ENT-001 | profiles | id PK/FK auth.users; username text unique; display_name text; role admin/teacher/student; active boolean=true; must_change_password boolean=true; created_at | REQ-002 |
| ENT-002 | taxonomy | id; kind level/grade/subject/topic; name; parent_id? FK taxonomy; sort_order int; active boolean=true | REQ-001, REQ-003 |
| ENT-003 | contents | id; slug unique; kind material/exercise/worksheet/game; state draft/published/archived; published_revision_id? FK revisions; created_by FK profiles; version; created_at | REQ-003 |
| ENT-004 | revisions | id; content_id FK contents; revision_no int; title; summary; blocks jsonb; objectives text?; instructions text?; state draft/published; created_at; version; unique(content_id,revision_no) | REQ-003, REQ-004, REQ-006 |
| ENT-005 | revision_taxonomy | revision_id FK revisions; taxonomy_id FK taxonomy; PK kedua kolom | REQ-001 |
| ENT-006 | assets | id; object_path unique; filename; mime; size_bytes bigint; sha256; uploaded_by FK profiles; created_at | REQ-004, REQ-007, REQ-013 |
| ENT-007 | revision_assets | revision_id FK revisions; asset_id FK assets; purpose image/pdf/attachment/game; PK kedua ID dan purpose | REQ-004, REQ-007 |
| ENT-008 | questions | id; title; type choice/short_text/matching/drag_drop/essay; prompt jsonb; options jsonb; max_points numeric(6,2); version; archived boolean=false | REQ-005 |
| ENT-009 | private.question_keys | question_id PK/FK questions; answer_key jsonb; rubric text? | REQ-005 |
| ENT-010 | revision_questions | id; revision_id FK revisions; source_question_id?; position int; type; prompt jsonb; options jsonb; max_points numeric(6,2); unique(revision_id,position) | REQ-005, REQ-006 |
| ENT-011 | private.revision_keys | revision_question_id PK/FK revision_questions; answer_key jsonb; rubric text? | REQ-005, REQ-011 |
| ENT-012 | classes | id; name; teacher_id FK profiles; archived boolean=false; created_at; version | REQ-009 |
| ENT-013 | class_members | class_id FK classes; student_id FK profiles; active boolean=true; joined_at; PK(class_id,student_id) | REQ-009 |
| ENT-014 | sessions | id; class_id FK classes; host_id FK profiles; revision_id FK revisions; state lobby/running/ended; current_question_id? FK revision_questions; question_open boolean=false; expires_at; created_at; started_at?; ended_at?; version | REQ-010 |
| ENT-015 | private.session_codes | session_id PK/FK sessions; code_hash unique; encrypted code tidak diperlukan; created_at | REQ-010 |
| ENT-016 | session_participants | session_id FK sessions; student_id FK profiles; joined_at; PK(session_id,student_id) | REQ-010 |
| ENT-017 | attempts | id; session_id; student_id; state in_progress/pending_review/final; max_points numeric; final_score numeric(5,2)?; finalized_at?; unique(session_id,student_id); FK pasangan ke session_participants | REQ-011, REQ-012 |
| ENT-018 | answers | id; attempt_id FK attempts; revision_question_id FK revision_questions; response jsonb; submitted_at; version; unique(attempt_id,revision_question_id) | REQ-011 |
| ENT-019 | private.answer_grades | answer_id PK/FK answers; points numeric(6,2)?; mode automatic/manual; feedback text?; graded_by? FK profiles; graded_at?; version | REQ-011 |
| ENT-020 | private.request_receipts | actor_id; operation; request_id UUID; payload_hash; result jsonb; created_at; PK(actor_id,operation,request_id) | REQ-010, REQ-011 |
| ENT-021 | private.rate_buckets | actor_id; operation; window_start timestamptz; count int; PK(actor_id,operation,window_start) | REQ-010 |

`private` tidak diekspos melalui Data API. Foreign key `source_question_id` hanya jejak asal; salinan soal dan kunci pada revisi tidak mengikuti perubahan bank soal. Menyimpan revisi draft membangun ulang snapshot beserta kunci dalam satu transaksi. Setelah terbit, isi, relasi taxonomy/aset, soal dan kunci revisi immutable. Edit membuat revisi baru. `contents.published_revision_id` menunjuk revisi aktif; revisi lama dapat tetap diakses pemilik/peserta sesi untuk riwayat, tidak otomatis publik.

## Validasi kolom dan batas aplikasi

- Username normalisasi lowercase + trim, pola `[a-z0-9_]{3,32}`, immutable setelah dibuat. Display name 1–80 karakter; tidak meminta NISN, alamat rumah atau tanggal lahir. Password minimum 12 karakter; password sementara dihasilkan acak dan ditampilkan sekali, tidak disimpan dalam tabel aplikasi.
- Alias Auth `username@accounts.invalid`; email pribadi tidak diwajibkan. Domain alias harus konsisten di provision/login. Status active dan must_change_password diperiksa server, tidak hanya UI. Perubahan password lewat endpoint yang memverifikasi password lama lalu memperbarui Auth dan flag; kegagalan parsial tidak boleh membuka akses sebelum perubahan berhasil.
- Judul 1–160, summary ≤500, slug lowercase huruf/angka/tanda hubung 3–100. Minimal satu taxonomy level dan subject; grade harus punya parent level yang ikut dipilih; topic punya parent subject. Nama taxonomy 1–80; unique(kind,parent_id,name) dengan perlakuan null yang eksplisit. Jenjang tanpa kelas tertentu boleh hanya level.
- Nama kelas 1–100; guru pemilik harus active dengan role teacher/admin; siswa anggota harus role student. Semua relasi diperiksa server, termasuk bahwa soal aktif milik revision_id sesi.
- Limits asumsi: gambar ≤5 MiB (JPEG/PNG/WebP), PDF/PPT/PPTX ≤20 MiB, game HTML UTF-8 ≤2 MiB. Total blocks per revisi ≤100, soal ≤50; semua teks terstruktur total ≤500 KiB. SVG, executable, arsip ZIP, file bermakro PPTM dan upload video ditolak.
- HTML game self-contained; boleh inline CSS/JS dan data URI gambar/audio. Tidak boleh fetch/CDN/iframe eksternal. CSP game: default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data: blob:; media-src data: blob:; connect-src 'none'; font-src data:; frame-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'. Sandbox hanya allow-scripts, tanpa allow-same-origin. Parent juga menetapkan CSP yang sesuai dan menguji bahwa meta CSP dipasang sebelum isi game.
- MIME dari ekstensi saja tidak cukup: validasi signature tipe berkas, parse HTML sebagai data dan validasi UTF-8, cek ukuran sebelum upload dan saat commit metadata. Nama objek UUID, nama pengguna hanya untuk label. PPTX diperiksa sebagai format Office yang sesuai, bukan ZIP game.
- `max_points` >0 dan ≤100. Nilai grade 0..max_points. Posisi soal berurutan dari 1; revision latihan/LKPD wajib ≥1 soal; game wajib tepat satu aset purpose game. Materi wajib ≥1 blok. Worksheet wajib tujuan dan petunjuk.
- Kode sesi delapan karakter uppercase dari alfabet tanpa karakter rancu, dibuat cryptographic RNG; unique hash dengan retry collision. Kode ditampilkan sekali saat create; guru dapat rotate bila lupa tanpa mengeluarkan peserta lama. Simpan kode di memori tab guru, jangan di URL/log. Default berlaku 8 jam; sesi berakhir eksplisit atau dipastikan ended oleh RPC saat kedaluwarsa. Realtime tidak dipakai sebagai jam otoritatif.

## Blok materi dan kontrak soal

`blocks` adalah array discriminated union, bukan HTML mentah: text {doc}, image {asset_id,alt,caption?}, video {url,title}, pdf {asset_id}, attachment {asset_id,label}, slide {title,children}. children tidak boleh berisi slide lagi. `doc` mendukung paragraf, heading, daftar, bold/italic dan link HTTPS; seluruh node divalidasi. Video awal hanya URL YouTube HTTPS valid yang diubah menjadi embed privacy-enhanced, tanpa HTML embed bebas. Penyedia lain perlu adapter dan uji baru.

| Tipe | options publik | response | answer_key privat | Penilaian |
|---|---|---|---|---|
| choice | items [{id,label}], 2–6 pilihan | {option_id} | {correct_option_id} | Poin penuh bila cocok, selain itu 0 |
| short_text | {} | {text}, ≤500 karakter | {accepted_answers:[string]} | Unicode NFKC, trim, collapse whitespace, lowercase; cocok persis ke salah satu, tanpa fuzzy |
| matching | left/right [{id,label}], 2–10 tiap sisi | {pairs:[{left_id,right_id}]} | {pairs:[...]} | Semua pasangan tepat = penuh; lainnya 0 |
| drag_drop | tokens/targets [{id,label}], 2–10 | {placements:[{token_id,target_id}]} | {placements:[...]} | Semua penempatan tepat = penuh; lainnya 0 |
| essay | {} | {text}, ≤5000 karakter | {rubric} | Guru memberi 0..max_points |

Matching/drag_drop MVP satu-ke-satu; ID unik dan semua ID harus milik soal. Urutan array tidak memengaruhi hasil; tidak menerima duplikasi target. Semua aturan adalah default teknik yang dapat direvisi sebelum konten nyata dibuat. Sistem menolak jawaban dengan field tak dikenal seperti `score`/`is_correct`.

Total maksimum attempt = jumlah max_points seluruh soal revisi. Saat sesi berakhir, soal belum dijawab mendapat 0 (termasuk uraian kosong); uraian terisi menunggu guru. Final = round(100 × total points / total max_points, 2), hanya setelah semua jawaban dinilai. Sebelum final, final_score null. Tidak ada tabel skor game. Guru dapat koreksi nilai final dengan versi dan catatan; siswa melihat nilai terbaru. Riwayat audit lengkap perubahan nilai bukan MVP, tetapi updated version/waktu/aktor wajib tersedia pada grade.

## Kontrak API v1

Transport: Supabase RPC untuk transaksi data, Edge Functions untuk Admin API dan perubahan password. Nama fungsi berakhiran `_v1`. Semua endpoint protected memvalidasi JWT serta profile aktif. Payload sukses `{data, request_id}`; kegagalan `{error:{code,message},request_id}`. Kode: VALIDATION_ERROR, UNAUTHENTICATED, FORBIDDEN, NOT_FOUND, CONFLICT, SESSION_CLOSED, QUESTION_CLOSED, RATE_LIMITED, STORAGE_LIMIT, INTERNAL_ERROR. Jangan mengungkap stack atau keberadaan kelas pada join gagal. HTTP fungsi memakai 400/401/403/404/409/429/500 sesuai keadaan; adapter menormalkan error RPC.

| Operasi | Aktor | Input penting | Output dan aturan |
|---|---|---|---|
| list_catalog_v1 | Publik | query?, taxonomy_ids[], kind?, cursor?, limit=24 max50 | items metadata, next_cursor; urut published waktu+ID; tanpa draft/kunci |
| get_content_v1 | Publik/authorized history | slug atau revision_id | blok, soal tanpa kunci, metadata aset; revision lama cek hak sesi |
| save_draft_v1 | Admin | content_id?, expected_version?, metadata, blocks, taxonomy_ids, question_ids | revisi draft dan version; snapshot soal/kunci atomik |
| publish_revision_v1 | Admin | revision_id, expected_version, request_id | content/revision IDs; validasi snapshot/aset, set pointer atomik |
| archive_content_v1 | Admin | content_id, expected_version | state archived; tidak memutus riwayat sesi |
| save_question_v1 | Admin | question_id?, expected_version?, type,prompt,options,key,max_points | ID/version; tulis key privat dalam transaksi |
| commit_asset_v1 | Admin | object_path,filename,mime,size_bytes,sha256 | asset ID setelah server memverifikasi objek |
| delete_unused_asset_v1 | Admin | asset_id | hapus hanya bila tanpa referensi revisi; error penghapusan objek dapat dicoba lagi |
| save_taxonomy_v1 | Admin | id?,kind,name,parent_id?,active | ID; cegah relasi siklus |
| create_class_v1 / set_member_v1 | Guru/admin | name atau class_id/student_id/active | kelas/anggota; hanya pemilik atau admin |
| archive_class_v1 | Pemilik/admin | class_id,expected_version | archived; sesi baru dilarang |
| create_session_v1 | Pemilik/admin | class_id,revision_id,request_id | session_id,code,expires_at,version; hanya revisi terbit exercise/worksheet |
| rotate_session_code_v1 | Host/admin | session_id,expected_version | code baru, kode lama invalid |
| join_session_v1 | Siswa | code,request_id | session_id,attempt_id,state; cek anggota; join berulang idempotent |
| get_session_state_v1 | Host/peserta/admin | session_id | state,version,current_question tanpa kunci; hitungan jawaban hanya host |
| transition_session_v1 | Host/admin | session_id,expected_version,action,question_id?,request_id | state/version; action start/open/close/next/end; validasi state machine |
| submit_answer_v1 | Siswa peserta | session_id,question_id,response,expected_answer_version,request_id | answer_id,version,saved_at; tanpa points/correctness |
| grade_essay_v1 | Host/admin | answer_id,points,feedback?,expected_version,request_id | status attempt; hitung ulang atomik |
| get_results_v1 | Siswa sendiri/host/admin | session_id? atau class_id?,cursor? | jawaban milik sendiri dan grade final; host dapat melihat pending/rubrik |
| provision-user / reset-password / deactivate-user | Admin Edge | username/display_name/role atau user_id | ID/status; password sementara sekali; role hanya teacher/student |
| change-password | Akun Edge | old_password,new_password | sukses tanpa token/password; flag wajib ganti diperbarui setelah Auth berhasil |

Pembuatan akun lintas Auth/DB tidak satu transaksi: gunakan request_id, cek hasil terdahulu, rollback akun Auth jika profile gagal atau tandai untuk rekonsiliasi admin. Reset menyalakan must_change_password dan mencabut refresh sessions jika didukung; RLS segera memblokir data selama flag aktif. Endpoint ganti password tetap dapat dipakai oleh akun aktif dengan flag itu.

Contoh kiriman jawaban (ID berikut ilustrasi bentuk, bukan data produksi):

```json
{"session_id":"57aa8532-94e3-4195-86d8-0cf367a01389","question_id":"0e1de0fc-a1a4-463a-b34e-9ea840497df8","response":{"option_id":"b"},"expected_answer_version":0,"request_id":"e73f18a0-a7ed-4086-8c8d-feb711be30ce"}
```

Realtime: subscribe perubahan `sessions` hanya yang diizinkan RLS. Payload terpublikasi tidak berisi code_hash, jawaban, rubrik atau nilai. Klien membaca `version` dan mengambil ulang state; event lama diabaikan. Tidak mengandalkan urutan event. State machine: lobby → running → ended; open/close mengubah soal pada running; next hanya saat soal sebelumnya tertutup. Tidak membuka kembali soal tertutup pada MVP. Expiry dapat menutup dari lobby/running; ended terminal.

## Otorisasi, konsistensi dan lifecycle

- Publik hanya metadata/revisi terbit saat ini, soal tanpa keys, dan asetnya. Bank soal sumber hanya admin. Guru memperoleh rubrik sesi melalui RPC yang memverifikasi host; siswa tidak mendapat kunci mentah bahkan setelah selesai, hanya poin/feedback.
- Kelas/anggota: pemilik guru/admin; siswa dapat membaca kelas sendiri tanpa daftar seluruh profil sekolah. Peserta sesi merupakan snapshot keanggotaan saat join. Mengeluarkan anggota menghalangi join baru; penghapusan akses yang segera memakai nonaktifkan akun. Host tidak dapat diganti setelah sesi dibuat.
- Tabel grades/keys/receipts/codes privat tidak memiliki SELECT siswa. Attempts/answers boleh dibaca siswa sendiri, tetapi penulisan hanya RPC; siswa tidak bisa menulis final_score, points, waktu atau ID aktor. RLS profil hanya baca sendiri; pemilihan siswa oleh guru melalui RPC minimal ID/nama/username tanpa kredensial.
- Join rate limit memakai private.rate_buckets: maksimum 5 percobaan per menit per akun, counter atomik dan waktu server. Catat percobaan di transaksi terpisah sebelum validasi kode agar kegagalan kode tidak me-rollback counter; RPC publik wrapper mengembalikan error terstruktur tanpa exception yang membatalkan counter. Hapus bucket berumur lebih dari 24 jam melalui cleanup admin.
- Idempotency receipt disimpan atomik bersama mutasi. Request ID sama + payload sama mengembalikan hasil tersimpan; payload beda → CONFLICT. Simpan receipts minimal 24 jam setelah sesi ended, kemudian boleh dibersihkan manual. Lock sesi → attempt → answer konsisten pada semua RPC untuk menghindari deadlock.
- Indeks: contents(slug), contents(state,published_revision_id), revision_taxonomy(taxonomy_id,revision_id), sessions(class_id,created_at), attempts(student_id,session_id), answers(attempt_id), class_members(student_id,active).
- Arsip adalah default penghapusan konten/kelas; revisi yang direferensikan sesi tidak dihapus. Akun dinonaktifkan, tidak hard-delete lewat UI MVP. Retensi asumsi: riwayat disimpan sampai admin meminta purge; tinjau tiap akhir tahun ajaran. Purge siswa dilakukan lewat prosedur admin berprivilege yang menghapus answers/grades/attempts/memberships, mencabut akun, dan tidak menghapus materi. Jelaskan dampak serta cadangkan sebelum operasi permanen.
- Aset tanpa referensi dapat dibersihkan admin. Jangan hapus objek saat masih direferensikan revisi lama. Total bytes UI dihitung dari assets; kuota provider sebenarnya diverifikasi dashboard karena upload yatim/egress tidak seluruhnya tercakup.

## Migrasi dan fixture

Urutan migrasi: profiles/peran → taxonomy/content/assets → soal/keys/revisi → classes/sessions → attempts/grades/receipts → RLS/grants/RPC/Storage policies. Setiap migrasi versi di git; test database kosong dan upgrade dari versi sebelumnya. Circular FK pointer content/revision dibuat setelah tabel keduanya tersedia. Perubahan destruktif memakai backup, migrasi maju dan prosedur pemulihan; jangan klaim rollback SQL cukup untuk memulihkan objek Storage.

Fixture sintetis: satu admin, dua guru (untuk uji isolasi), delapan siswa, dua kelas, masing-masing satu konten setiap jenis, lima tipe soal, satu game demo. Data contoh terpisah dari produksi. Uji satu guru+delapan siswa bersamaan tetap sesuai target awal. Tidak menyertakan akun/password nyata. Rujukan: [architecture](./architecture.md), [testing](./testing.md), ADR-002/004/005 pada [decisions](./decisions.md).

## Kontrak presentasi v2

Nama produk kanonis: LayarBelajar. Upgrade soft brutalism tidak memerlukan migrasi tabel atau perubahan API v1. Nilai enum disimpan tetap `material`, `exercise`, `worksheet`, `game`; label UI dan mapping token adalah kontrak berikut, bukan enum baru:

| contents.kind | Label UI | Token bidang |
|---|---|---|
| material | Materi | --lb-material |
| exercise | Latihan | --lb-exercise |
| worksheet | LKPD | --lb-worksheet |
| game | Game | --lb-game |

Token dan nilai hex dimiliki design.md; mapper aplikasi tidak boleh menebak warna dari label terjemahan. Nama situs/tema adalah konfigurasi statis build dan tidak ditambahkan ke profiles atau tiap konten. API tidak mengirim CSS/HTML baru untuk tema. State UI selected/loading/disabled berbeda dari status jawaban, nilai dan sesi yang tersimpan. Tidak menyimpan skor atau telemetry game demi efek visual.
