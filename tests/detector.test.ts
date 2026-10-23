import { describe, expect, it } from 'vitest';
import { detectField } from '../src/core/detector';
import { assessRisk, suspiciousHost } from '../src/core/risk';
import { luhn, validateNik } from '../src/core/validators';
import { uniqueKinds } from '../src/core/detector';

describe('detectField', () => {
  it('mengenali NIK dari name/placeholder', () => {
    expect(detectField({ name: 'nik', type: 'text' })?.kind).toBe('nik');
    expect(detectField({ placeholder: 'Nomor KTP', type: 'text' })?.kind).toBe('nik');
  });
  it('mengenali camelCase dan underscore', () => {
    expect(detectField({ name: 'noHp', type: 'text' })?.kind).toBe('phone');
    expect(detectField({ id: 'nama_ibu_kandung', type: 'text' })?.kind).toBe('mother_name');
  });
  it('type=tel dan type=email', () => {
    expect(detectField({ type: 'tel' })?.kind).toBe('phone');
    expect(detectField({ type: 'email' })?.kind).toBe('email');
  });
  it('autocomplete cc-number', () => {
    expect(detectField({ autocomplete: 'cc-number', type: 'text' })?.kind).toBe('card_number');
  });
  it('upload file KTP / selfie', () => {
    expect(detectField({ type: 'file', label: 'Upload foto KTP' })?.kind).toBe('ktp_photo');
    expect(detectField({ type: 'file', label: 'Foto selfie sambil memegang KTP' })?.kind).toBe('selfie');
    expect(detectField({ type: 'file', label: 'Lampiran dokumen' })).toBeNull();
  });
  it('mengabaikan field tak relevan', () => {
    expect(detectField({ type: 'text', placeholder: 'Masukan nama karya' })).toBeNull();
    expect(detectField({ type: 'hidden', name: 'nik' })).toBeNull();
    expect(detectField({ type: 'checkbox', name: 'setuju' })).toBeNull();
  });
  it('memilih severity tertinggi', () => {
    expect(detectField({ label: 'Nama ibu kandung', type: 'text' })?.kind).toBe('mother_name');
  });
});

describe('risk', () => {
  const ctx = { isHttps: true, pageHost: 'contoh.id', formActionHosts: [] };
  const kinds = (...items: any[]) => uniqueKinds(items.map((i) => detectField(i)));

  it('nama + email saja = tidak memicu banner', () => {
    const r = assessRisk(kinds({ label: 'Nama lengkap', type: 'text' }, { type: 'email' }), ctx);
    expect(['none', 'low']).toContain(r.level);
  });
  it('NIK + foto KTP + selfie = tinggi/kritis', () => {
    const r = assessRisk(
      kinds({ name: 'nik', type: 'text' }, { type: 'file', label: 'Foto KTP' }, { type: 'file', label: 'Selfie' }),
      ctx,
    );
    expect(['high', 'critical']).toContain(r.level);
  });
  it('form dikirim ke domain lain dan tanpa HTTPS menaikkan skor', () => {
    const base = assessRisk(kinds({ name: 'nik', type: 'text' }), ctx);
    const worse = assessRisk(kinds({ name: 'nik', type: 'text' }), { isHttps: false, pageHost: 'a.id', formActionHosts: ['evil.xyz'] });
    expect(worse.score).toBeGreaterThan(base.score);
  });
  it('mendeteksi domain peniru merek', () => {
    expect(suspiciousHost('klikbca-login.xyz')).not.toBeNull();
    expect(suspiciousHost('www.bca.co.id')).toBeNull();
    expect(suspiciousHost('brilliant.com')).toBeNull();
    expect(suspiciousHost('xn--bca-abc.com')).not.toBeNull();
  });
});

describe('validators', () => {
  it('NIK', () => {
    expect(validateNik('3171010101900001')).toBe(true);
    expect(validateNik('3171014101900001')).toBe(true); // hari 41 = perempuan tgl 1
    expect(validateNik('0071010101900001')).toBe(false);
    expect(validateNik('123')).toBe(false);
  });
  it('Luhn', () => {
    expect(luhn('4111111111111111')).toBe(true);
    expect(luhn('4111111111111112')).toBe(false);
  });
});
