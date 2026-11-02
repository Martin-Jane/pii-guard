/**
 * Domain institusi TNI yang dianggap resmi.
 * TODO (wajib sebelum rilis): verifikasi daftar ini lewat kanal resmi TNI AD / panitia.
 * Saat ini hanya memakai akhiran umum 'mil.id'. Domain resmi bukan jaminan situs aman
 * (situs bisa diretas), jadi ini hanya dipakai untuk menurunkan kecurigaan, bukan menyatakan aman.
 */
export const OFFICIAL_TNI_SUFFIXES: string[] = ['mil.id'];

export function isOfficialTniHost(host: string): boolean {
  const h = host.toLowerCase();
  return OFFICIAL_TNI_SUFFIXES.some((s) => h === s || h.endsWith('.' + s));
}
