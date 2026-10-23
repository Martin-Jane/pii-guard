import { RULES } from './rules';
import type { Detection, FieldMeta, PiiRule } from './types';

export function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/['’`]/g, ' ')
    .replace(/[_\-./\\[\](){}:;,*!?]/g, ' ')
    // pisahkan camelCase sebelum lowercase sudah terjadi di atas, jadi tangani di caller bila perlu
    .replace(/\s+/g, ' ')
    .trim();
}

/** "noHp" -> "no Hp" supaya camelCase pada name/id ikut terbaca */
function splitCamel(s: string): string {
  return s.replace(/([a-z])([A-Z])/g, '$1 $2');
}

function toDetection(r: PiiRule): Detection {
  return { kind: r.kind, label: r.label, severity: r.severity, specific: r.specific, edu: r.edu };
}

function best(matches: PiiRule[]): PiiRule | null {
  if (!matches.length) return null;
  return matches.reduce((a, b) => (b.severity > a.severity ? b : a));
}

/** Deteksi jenis PII dari metadata field. Mengembalikan null bila tidak terdeteksi. */
export function detectField(meta: FieldMeta): Detection | null {
  const type = (meta.type ?? '').toLowerCase();
  if (['hidden', 'submit', 'button', 'checkbox', 'radio', 'search', 'range', 'color', 'image', 'reset'].includes(type)) {
    return null;
  }

  const direct = normalize(
    [meta.name, meta.id, meta.placeholder, meta.label, meta.ariaLabel]
      .filter(Boolean)
      .map((s) => splitCamel(String(s)))
      .join(' | '),
  );

  // Upload file: hanya KTP/selfie yang relevan
  if (type === 'file') {
    const text = direct || normalize(meta.nearbyText ?? '');
    const pool = RULES.filter((r) => r.kind === 'ktp_photo' || r.kind === 'selfie');
    const matched = pool.filter((r) => r.patterns.some((p) => p.test(text)));
    // "selfie sambil memegang KTP" harus dianggap selfie, bukan foto KTP biasa
    const hit = matched.find((r) => r.kind === 'selfie') ?? best(matched);
    return hit ? toDetection(hit) : null;
  }

  // Kind khusus file tidak berlaku untuk input teks biasa
  const textRules = RULES.filter((r) => r.kind !== 'ktp_photo' && r.kind !== 'selfie');

  // 1) autocomplete yang eksplisit paling bisa dipercaya
  const ac = (meta.autocomplete ?? '').toLowerCase().split(/\s+/);
  const byAuto = textRules.filter((r) => r.autocomplete?.some((a) => ac.includes(a)));

  // 2) atribut & label langsung
  const byDirect = textRules.filter((r) => r.patterns.some((p) => p.test(direct)));

  // 3) type bawaan
  const byType: PiiRule[] = [];
  if (type === 'email') byType.push(...textRules.filter((r) => r.kind === 'email'));
  if (type === 'tel') byType.push(...textRules.filter((r) => r.kind === 'phone'));

  let hit = best([...byAuto, ...byDirect, ...byType]);

  // 4) teks sekitar hanya dipakai kalau tidak ada petunjuk lain (kurangi false positive)
  if (!hit && meta.nearbyText) {
    const near = normalize(meta.nearbyText);
    hit = best(textRules.filter((r) => r.severity >= 3 && r.patterns.some((p) => p.test(near))));
  }

  return hit ? toDetection(hit) : null;
}

/** Gabungkan hasil banyak field menjadi daftar jenis PII unik. */
export function uniqueKinds(list: (Detection | null)[]): Detection[] {
  const map = new Map<string, Detection>();
  for (const d of list) if (d) map.set(d.kind, d);
  return [...map.values()].sort((a, b) => b.severity - a.severity);
}
