# PII Guard

Ekstensi browser yang otomatis mengingatkan pengguna saat sebuah halaman meminta data pribadi
(NIK, foto KTP/selfie, OTP, kartu, dll). Seluruh analisis lokal; **isi field tidak pernah dibaca**.

Stack: WXT + TypeScript (vanilla UI). Logika deteksi murni ada di `src/core` dan bisa dites tanpa browser.

## Mulai
```bash
npm install
npm run dev          # buka Chrome terpisah dengan ekstensi ter-load + hot reload
npm test             # jalankan unit test aturan deteksi
npm run build        # hasil di .output/chrome-mv3 (Load unpacked)
npm run zip          # paket untuk dikumpulkan
```
Cara manual: `chrome://extensions` -> aktifkan Developer mode -> Load unpacked -> pilih `.output/chrome-mv3`.

## Menguji
Jalankan server lokal lalu buka halaman demo:
```bash
npx serve demo        # atau: python3 -m http.server 8000 --directory demo
```
Buka `http://localhost:8000/form.html`. Form 1 tidak boleh memicu banner, form 2 harus Kritis,
form 3 muncul setelah 3 detik (menguji MutationObserver).

## Struktur
```
src/core/          rules.ts (kamus PII), detector.ts, risk.ts (skor), validators.ts
src/entrypoints/   content.ts (scan + banner), background.ts (badge), popup/
src/lib/           settings (chrome.storage), messages
tests/             unit test (vitest)
demo/form.html     halaman uji
```

## Tempat utak-atik (trial & error)
- Tambah kata kunci/jenis data: `src/core/rules.ts`
- Bobot skor, kombinasi berbahaya, daftar merek ditiru: `src/core/risk.ts`
- Ambang level banner: `toLevel()` di `risk.ts`
- Tampilan banner: `showBanner()` di `content.ts`
- Selalu tambah tes di `tests/` setelah mengubah aturan.

## Ide lanjutan (urut prioritas)
1. Daftar domain phishing yang diunduh berkala (`alarms`) dan dicocokkan lokal.
2. Deteksi dark pattern (checkbox persetujuan sudah tercentang / digabung).
3. Halaman options + edukasi hak subjek data UU PDP.
4. Deteksi form di iframe (`all_frames`).
5. Mode Firefox: `npm run dev:firefox`.
