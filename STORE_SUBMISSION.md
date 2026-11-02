# PII Guard: Panduan Publikasi Chrome Web Store

File yang diunggah: `pii-guard-0.2.0-chrome.zip` (manifest.json ada di akar zip).

## Yang perlu kamu siapkan sendiri
1. Akun Chrome Web Store Developer (biaya pendaftaran satu kali, cek nominal terbaru di dashboard) dan verifikasi 2 langkah.
2. Minimal 1 screenshot (disarankan 1280x800). Ambil dari halaman demo: banner Kritis, popup.
3. Small promo tile 440x280 (gambar).
4. URL kebijakan privasi (tempel teks di bawah ke GitHub Pages / Notion publik / Google Doc publik).
5. Kategori disarankan: Productivity atau Privacy & Security (pilih yang tersedia).

## Single purpose (isian dashboard)
Mengingatkan pengguna saat halaman web meminta data pribadi (misalnya NIK, foto KTP, OTP), disertai penilaian risiko lokal.

## Justifikasi izin
- **storage**: menyimpan pengaturan pengguna (level minimum banner) dan daftar situs yang dipercaya, hanya di perangkat.
- **Akses ke semua situs (content script `<all_urls>`)**: peringatan harus muncul otomatis di situs mana pun yang meminta data pribadi, sebelum pengguna mengisi form. Ekstensi hanya membaca metadata field (nama, label, tipe, atribut action form) serta judul dan heading halaman untuk konteks, tidak membaca isi yang diketik, dan tidak mengirim data ke luar perangkat.
- **Remote code**: tidak ada. Seluruh kode dikemas di dalam ekstensi.

## Tab "Privacy practices": jawaban yang sesuai kode saat ini
- Data pengguna yang dikumpulkan: **tidak ada** (tidak ada transmisi ke server).
- Centang pernyataan bahwa data tidak dijual, tidak dipakai di luar tujuan tunggal, dan tidak dipakai untuk menentukan kelayakan kredit.
- Pastikan kamu belum menambah fitur yang memanggil API eksternal. Jika nanti ada (daftar phishing, cek umur domain), perbarui jawaban ini dan kebijakan privasi.

## Draf kebijakan privasi (sesuaikan nama dan kontak)
**Kebijakan Privasi PII Guard** (berlaku mulai [tanggal])

PII Guard adalah ekstensi browser yang mengingatkan pengguna saat sebuah halaman meminta data pribadi.

Data yang kami proses: ekstensi membaca metadata elemen form pada halaman yang dibuka (nama, label, placeholder, tipe field, dan tujuan pengiriman form) serta judul, deskripsi meta, dan heading halaman untuk mengenali konteks (misalnya halaman rekrutmen). Teks ini dianalisis di perangkat dan tidak disimpan maupun dikirim. Ekstensi tidak membaca, menyimpan, atau mengirim isi yang diketik pengguna.

Penyimpanan: pengaturan dan daftar situs tepercaya disimpan secara lokal di browser melalui chrome.storage dan tidak dikirim ke pihak mana pun.

Pembagian data: kami tidak mengumpulkan, menjual, atau membagikan data pengguna kepada pihak ketiga. Seluruh analisis berjalan di perangkat pengguna.

Kontak: [email pengembang]

## Teks deskripsi toko (Bahasa Indonesia)
PII Guard mengingatkan kamu sebelum mengisi form yang meminta data pribadi seperti NIK, foto KTP, OTP, atau data kartu. Peringatan muncul otomatis, dibuat berjenjang berdasarkan risiko (jenis data, kombinasi berbahaya, tujuan pengiriman form, dan domain yang meniru merek), dan disertai penjelasan singkat dalam bahasa awam.

Privasi: semua analisis berjalan di perangkatmu. PII Guard hanya membaca metadata field, tidak pernah isi yang kamu ketik, dan tidak mengirim data apa pun ke server.

Catatan: tidak ada peringatan bukan berarti situs pasti aman. PII Guard membantu kewaspadaan, bukan menggantikannya.

## Sebelum mengirim, uji paket zip
1. Ekstrak zip ke folder baru, buka `chrome://extensions`, aktifkan Developer mode, Load unpacked, pilih folder hasil ekstrak.
2. Jalankan tiga skenario di `demo/form.html` dan periksa popup serta pengaturan.
3. Lihat `chrome://extensions` untuk tombol Errors.

## Perkiraan waktu
Peninjauan bisa memakan waktu beberapa hari hingga lebih lama, dan izin akses semua situs bisa memicu peninjauan lebih teliti. Kirim sedini mungkin. Untuk hackathon, tanyakan ke panitia apakah yang dinilai adalah zip/kode atau ekstensi yang sudah terbit.
