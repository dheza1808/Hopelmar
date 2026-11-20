<<<<<<< HEAD
# Hopelmar Job Tracker

## Menjalankan aplikasi

```powershell
npm ci
Copy-Item .env.example .env.local
npm run dev
```

Isi `VITE_SUPABASE_URL` dan `VITE_SUPABASE_ANON_KEY` di `.env.local` dengan kredensial proyek Supabase sebelum login. Jangan commit file `.env.local`.

## Role dan alur BPMN

Role di dalam sistem:

- **Sales & Marketing**: membuat dan mengirim quotation; mencatat persetujuan atau permintaan revisi customer. Customer insidental memerlukan verifikasi legalitas sebelum masuk ke Sales Support.
- **Sales Support**: menerima quotation final, menerbitkan Job Number, memastikan biaya quotation terisi otomatis, lalu mencatat biaya tambahan bila ada.
- **Exim**: melengkapi Incoterm dan mengonfirmasi dokumen, kemudian menandai pekerjaan sebagai Job Done.
- **Admin Invoice + Pengadaan**: membuat invoice dari job yang selesai dan mengirim invoice ke customer.
- **Accounting**: membuat laporan margin dan PNL. Sales & Marketing dapat melihat laporan yang sudah dibuat.
- Semua role memiliki menu **Job Order History** untuk melihat daftar job, status workflow, PIC/tahap berikutnya, dan status invoice secara bersama.

Operasional bukan role sistem. Respons customer (persetujuan, permintaan revisi, penerimaan invoice) dicatat oleh staff terkait; diagram BPMN tidak mendefinisikan portal customer.

Setiap akun hanya melihat menu dan halaman sesuai role pada profilnya. Akses ke halaman role lain dibatasi kembali; isi fitur dan alur kerja tidak diubah.

Skema Supabase baru tersedia di `supabase/schema.sql`. Untuk database yang sudah memakai skema lama, jalankan migrasi `supabase/migrations/20261105_align_bpmn_workflow.sql`. Migrasi memetakan role lama `sales` ke `sales_marketing`, `customer_service` ke `exim`, `finance` ke `admin_invoice`, dan `manager` ke `accounting`.

Untuk mengaktifkan upload dokumen Exim, jalankan `supabase/migrations/20261106_enable_job_document_storage.sql` di SQL Editor pada project Supabase yang sama dengan `VITE_SUPABASE_URL`. File disimpan di bucket privat `job-documents`; akun terautentikasi dapat upload ke folder masing-masing dan membuka file melalui URL sementara.

## Login dengan username

Login menggunakan username yang disimpan pada `profiles.username`; pencarian username ke email berlangsung di Supabase Edge Function dan tidak mengirim alamat email ke browser.

1. Jalankan `supabase/migrations/20261109_add_profile_usernames.sql` di SQL Editor. Migrasi mengisi username dari bagian sebelum `@` untuk email unik yang memenuhi format username (`a-z`, `0-9`, `.`, `_`, `-`; 3–64 karakter). Email yang memiliki nama depan duplikat akan memerlukan username unik yang ditetapkan manual.
2. Pastikan setiap pengguna memiliki username unik. Contoh untuk SQL Editor:

   ```sql
   UPDATE public.profiles
   SET username = 'nama.username'
   WHERE email = 'alamat-email-perusahaan';
   ```

3. Dari root project yang terhubung ke Supabase, deploy function:

   ```powershell
   supabase functions deploy login-with-username
   ```

   Function memakai `SUPABASE_URL`, `SUPABASE_ANON_KEY`, dan `SUPABASE_SERVICE_ROLE_KEY` dari environment Edge Functions Supabase. Jangan pernah menaruh service-role key di frontend atau mengirimkannya ke repository.

Username login tidak membedakan huruf besar/kecil. Password tetap password akun Supabase Auth yang sudah digunakan.

> Catatan implementasi: selain dokumen yang diunggah, data operasional workflow masih disimpan di `localStorage` browser. Data belum tersinkron antar pengguna/perangkat atau ditulis ke tabel Supabase; integrasi CRUD Supabase dibutuhkan sebelum dipakai sebagai sistem produksi multi-role.
=======
# Hopelmar
Projek_KP
>>>>>>> 813a504b7d5a700a51412b1f909548bb936c32fe
