export type PiiKind =
  | 'nik' | 'kk' | 'npwp' | 'mother_name' | 'phone' | 'email' | 'fullname'
  | 'address' | 'birth' | 'bank_account' | 'card_number' | 'cvv' | 'otp' | 'pin'
  | 'health' | 'ktp_photo' | 'selfie'
  | 'nrp' | 'nip' | 'kta' | 'rank' | 'unit' | 'assignment';

export type Level = 'none' | 'low' | 'medium' | 'high' | 'critical';

/** Metadata sebuah field. SENGAJA tidak ada properti `value`: isi ketikan tidak pernah dibaca. */
export interface FieldMeta {
  name?: string;
  id?: string;
  placeholder?: string;
  label?: string;
  ariaLabel?: string;
  autocomplete?: string;
  type?: string;
  accept?: string;
  nearbyText?: string;
}

export interface PiiRule {
  kind: PiiKind;
  label: string;
  /** 1 (rendah) .. 5 (sangat sensitif) */
  severity: 1 | 2 | 3 | 4 | 5;
  /** true = data pribadi spesifik menurut UU PDP (kesehatan, keuangan pribadi, biometrik, dll) */
  specific: boolean;
  patterns: RegExp[];
  autocomplete?: string[];
  edu: string;
}

export interface Detection {
  kind: PiiKind;
  label: string;
  severity: number;
  specific: boolean;
  edu: string;
}

export interface PageContext {
  isHttps: boolean;
  pageHost: string;
  /** host tujuan form (atribut action), bila ada */
  formActionHosts: string[];
  /** Judul, deskripsi meta, dan heading halaman (maks ~800 karakter). Bukan isi ketikan. */
  pageText?: string;
}

export interface RiskResult {
  score: number;
  level: Level;
  kinds: Detection[];
  reasons: string[];
}
