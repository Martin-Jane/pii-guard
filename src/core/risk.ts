import { normalize } from './detector';
import { isOfficialTniHost } from './official';
import type { Detection, Level, PageContext, RiskResult } from './types';

export interface Modes { recruitment: boolean; opsec: boolean }
const MILITARY_KINDS = ['nrp', 'nip', 'kta', 'rank', 'unit', 'assignment'];
const RECRUIT_WORDS = /\b(rekrutmen|penerimaan|pendaftaran|seleksi|werving|lowongan|calon)\b/;
const TNI_WORDS = /\b(tni|tniad|tamtama|bintara|akmil|akademi militer|secaba|catam|prajurit karier|angkatan darat)\b/;

/** Judul/heading halaman membahas rekrutmen TNI? */
export function isRecruitmentContext(pageText: string): boolean {
  const t = normalize(pageText);
  return RECRUIT_WORDS.test(t) && TNI_WORDS.test(t);
}

export const LEVEL_ORDER: Level[] = ['none', 'low', 'medium', 'high', 'critical'];
export const levelAtLeast = (a: Level, min: Level) => LEVEL_ORDER.indexOf(a) >= LEVEL_ORDER.indexOf(min);

/** Daftar kecil merek sering ditiru. Perluas sesuai kebutuhan demo. */
const BRANDS: { token: string; domains: string[] }[] = [
  { token: 'bca', domains: ['bca.co.id', 'klikbca.com'] },
  { token: 'mandiri', domains: ['bankmandiri.co.id', 'livin.id'] },
  { token: 'bri', domains: ['bri.co.id'] },
  { token: 'bni', domains: ['bni.co.id'] },
  { token: 'gopay', domains: ['gopay.co.id', 'gojek.com'] },
  { token: 'ovo', domains: ['ovo.id'] },
  { token: 'dana', domains: ['dana.id'] },
  { token: 'shopee', domains: ['shopee.co.id', 'shopee.com'] },
  { token: 'tokopedia', domains: ['tokopedia.com'] },
  { token: 'tni', domains: ['mil.id'] },
  { token: 'tniad', domains: ['mil.id'] },
  { token: 'akmil', domains: ['mil.id'] },
  { token: 'bpjs', domains: ['bpjs-kesehatan.go.id', 'bpjsketenagakerjaan.go.id'] },
  { token: 'pajak', domains: ['pajak.go.id'] },
];

const endsWithDomain = (host: string, d: string) => host === d || host.endsWith('.' + d);

/** Mengembalikan alasan bila host mencurigakan, atau null. */
export function suspiciousHost(host: string): string | null {
  const h = host.toLowerCase();
  if (h.includes('xn--')) return 'Nama domain memakai karakter menyerupai (punycode)';
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(h)) return 'Situs diakses lewat alamat IP, bukan nama domain';
  const labels = h.split('.');
  for (const b of BRANDS) {
    const mentions = labels.some(
      (l) => l === b.token || l.split('-').includes(b.token) || (l.includes(b.token) && /(login|secure|verif|klik|promo|hadiah|update|akun|official|rekrut|daftar|penerimaan|pendaftaran)/.test(l)),
    );
    if (mentions && !b.domains.some((d) => endsWithDomain(h, d))) {
      return `Nama domain menyerupai "${b.token}" tetapi bukan domain resminya`;
    }
  }
  if (labels.length > 5) return 'Domain memiliki terlalu banyak subdomain';
  if ((h.match(/-/g) ?? []).length >= 3) return 'Domain mengandung banyak tanda hubung';
  return null;
}

export function toLevel(score: number): Level {
  if (score < 15) return 'none';
  if (score < 30) return 'low';
  if (score < 55) return 'medium';
  if (score < 80) return 'high';
  return 'critical';
}

export function assessRisk(
  allKinds: Detection[],
  ctx: PageContext,
  modes: Modes = { recruitment: true, opsec: true },
): RiskResult {
  const reasons: string[] = [];
  // Bila mode OPSEC dimatikan, jenis data kedinasan diabaikan sepenuhnya
  const kinds = modes.opsec ? allKinds : allKinds.filter((k) => !MILITARY_KINDS.includes(k.kind));
  if (kinds.length === 0) return { score: 0, level: 'none', kinds, reasons };

  const has = (k: string) => kinds.some((x) => x.kind === k);
  let score = kinds.reduce((s, k) => s + k.severity * 6, 0);

  // Kombinasi berbahaya
  if (has('nik') && (has('ktp_photo') || has('selfie'))) {
    score += 25;
    reasons.push('Meminta NIK bersama foto KTP/selfie: paket lengkap yang sering dipakai untuk pinjol ilegal dan pembukaan rekening palsu.');
  }
  if (has('nik') && has('mother_name')) {
    score += 10;
    reasons.push('Meminta NIK dan nama ibu kandung sekaligus.');
  }
  if (has('card_number') && has('cvv')) {
    score += 15;
    reasons.push('Meminta nomor kartu dan CVV sekaligus.');
  }
  if (has('otp') || has('pin')) {
    reasons.push('Meminta OTP/PIN. Pihak resmi tidak pernah meminta ini lewat form web.');
  }

  // Konteks situs
  if (!ctx.isHttps) {
    score += 30;
    reasons.push('Halaman tidak memakai HTTPS: data bisa disadap saat dikirim.');
  }
  const crossHosts = ctx.formActionHosts.filter((h) => h && h !== ctx.pageHost);
  if (crossHosts.length) {
    score += 25;
    reasons.push(`Data form dikirim ke domain lain: ${[...new Set(crossHosts)].join(', ')}.`);
  }
  const sus = suspiciousHost(ctx.pageHost);
  if (sus) {
    score += 30;
    reasons.push(sus + '.');
  }

  // Mode Rekrutmen: halaman membahas rekrutmen TNI
  if (modes.recruitment && isRecruitmentContext(ctx.pageText ?? '')) {
    const maxSev = Math.max(...kinds.map((k) => k.severity));
    if (!isOfficialTniHost(ctx.pageHost) && maxSev >= 4) {
      score += 40;
      reasons.push('Halaman membahas rekrutmen TNI tetapi bukan domain resmi (*.mil.id). Verifikasi lewat kanal resmi TNI AD.');
    }
    if (has('bank_account') || has('card_number')) {
      score += 30;
      reasons.push('Halaman rekrutmen TNI meminta data pembayaran. Pendaftaran dinyatakan gratis oleh pejabat TNI AD setempat, jadi waspadai calo dan penipuan.');
    }
  }

  // Mode OPSEC: data kedinasan
  if (kinds.some((k) => MILITARY_KINDS.includes(k.kind))) {
    reasons.push('Form meminta data kedinasan/satuan (OPSEC): informasi ini bisa dipakai pihak tak berwenang menyusun gambaran kegiatan satuan.');
    if ((has('nrp') || has('nip') || has('kta')) && (has('unit') || has('assignment'))) {
      score += 15;
      reasons.push('Identitas kedinasan diminta bersama informasi satuan/penugasan.');
    }
    if (!isOfficialTniHost(ctx.pageHost)) {
      score += 20;
      reasons.push('Data kedinasan diminta di luar domain resmi (*.mil.id).');
    }
  }

  score = Math.min(100, score);
  return { score, level: toLevel(score), kinds, reasons };
}
