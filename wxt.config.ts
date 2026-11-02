import { defineConfig } from 'wxt';

export default defineConfig({
  srcDir: 'src',
  manifest: {
    name: 'PII Guard',
    description:
      'Mengingatkan Anda sebelum mengisi form yang meminta data pribadi (NIK, KTP, OTP, dll). Semua proses lokal.',
    // Izin seminimal mungkin. Content script berjalan otomatis lewat `matches`.
    permissions: ['storage'],
  },
});
