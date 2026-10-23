/**
 * Validator untuk dipakai pada scanner DB / pengujian.
 * Catatan: ekstensi TIDAK memakai ini saat runtime karena ekstensi tidak membaca isi field.
 */

const PROVINCE_CODES = new Set([
  11, 12, 13, 14, 15, 16, 17, 18, 19, 21, 31, 32, 33, 34, 35, 36, 51, 52, 53,
  61, 62, 63, 64, 65, 71, 72, 73, 74, 75, 76, 81, 82, 91, 92, 93, 94,
]);

/** Validasi struktur NIK: 16 digit, kode provinsi, tanggal lahir (hari +40 untuk perempuan), bulan 1-12. */
export function validateNik(nik: string): boolean {
  if (!/^\d{16}$/.test(nik)) return false;
  if (!PROVINCE_CODES.has(Number(nik.slice(0, 2)))) return false;
  let day = Number(nik.slice(6, 8));
  const month = Number(nik.slice(8, 10));
  if (day > 40) day -= 40;
  if (day < 1 || day > 31) return false;
  if (month < 1 || month > 12) return false;
  return true;
}

export function validateNpwp(npwp: string): boolean {
  const d = npwp.replace(/\D/g, '');
  return d.length === 15 || d.length === 16;
}

/** Algoritma Luhn untuk nomor kartu */
export function luhn(num: string): boolean {
  const d = num.replace(/\D/g, '');
  if (d.length < 13 || d.length > 19) return false;
  let sum = 0;
  let alt = false;
  for (let i = d.length - 1; i >= 0; i--) {
    let n = Number(d[i]);
    if (alt) { n *= 2; if (n > 9) n -= 9; }
    sum += n;
    alt = !alt;
  }
  return sum % 10 === 0;
}
