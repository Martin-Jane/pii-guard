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

describe('mode OPSEC dan rekrutmen TNI', () => {
  const k = (...items: any[]) => uniqueKinds(items.map((i) => detectField(i)));
  const base = { isHttps: true, formActionHosts: [] as string[] };

  it('mengenali data kedinasan', () => {
    expect(detectField({ name: 'nrp', type: 'text' })?.kind).toBe('nrp');
    expect(detectField({ label: 'Kesatuan', type: 'text' })?.kind).toBe('unit');
    expect(detectField({ label: 'Lokasi penugasan', type: 'text' })?.kind).toBe('assignment');
    expect(detectField({ label: 'Pangkat/Korps', type: 'text' })?.kind).toBe('rank');
  });
  it('kata "satuan" biasa tidak dianggap data kedinasan', () => {
    expect(detectField({ label: 'Harga satuan', type: 'text' })).toBeNull();
  });
  it('rekrutmen TNI di domain tidak resmi dengan data identitas = berisiko', () => {
    const r = assessRisk(k({ name: 'nik', type: 'text' }, { type: 'file', label: 'Foto KTP' }),
      { ...base, pageHost: 'rekrutmen-tni-online.com', pageText: 'Pendaftaran Penerimaan Calon Bintara TNI AD 2026' });
    expect(r.reasons.join(' ')).toContain('Halaman membahas rekrutmen TNI');
    expect(['high', 'critical']).toContain(r.level);
  });
  it('domain *.mil.id tidak kena peringatan domain tidak resmi', () => {
    const r = assessRisk(k({ name: 'nik', type: 'text' }),
      { ...base, pageHost: 'contoh.mil.id', pageText: 'Pendaftaran Penerimaan Calon Bintara TNI AD 2026' });
    expect(r.reasons.join(' ')).not.toContain('Halaman membahas rekrutmen TNI');
  });
  it('artikel berita rekrutmen dengan form komentar sederhana tidak memicu', () => {
    const r = assessRisk(k({ label: 'Nama lengkap', type: 'text' }, { type: 'email' }),
      { ...base, pageHost: 'berita.example.com', pageText: 'Pendaftaran Calon Bintara TNI AD dibuka' });
    expect(['none', 'low']).toContain(r.level);
  });
  it('rekrutmen TNI meminta rekening = peringatan pembayaran', () => {
    const r = assessRisk(k({ label: 'Nomor rekening', type: 'text' }),
      { ...base, pageHost: 'contoh.mil.id', pageText: 'Penerimaan Tamtama TNI AD' });
    expect(r.reasons.join(' ')).toContain('pembayaran');
  });
  it('NRP + satuan di luar domain resmi menaikkan risiko', () => {
    const r = assessRisk(k({ name: 'nrp', type: 'text' }, { label: 'Kesatuan', type: 'text' }),
      { ...base, pageHost: 'formulir.example.com', pageText: 'Formulir Data Personel' });
    expect(r.reasons.join(' ')).toContain('OPSEC');
    expect(r.score).toBeGreaterThanOrEqual(30);
  });
  it('mode dimatikan = tidak ada efek', () => {
    const kinds = k({ name: 'nrp', type: 'text' }, { label: 'Kesatuan', type: 'text' });
    const r = assessRisk(kinds, { ...base, pageHost: 'x.example.com', pageText: '' }, { recruitment: false, opsec: false });
    expect(r.level).toBe('none');
    const r2 = assessRisk(k({ name: 'nik', type: 'text' }, { type: 'file', label: 'Foto KTP' }),
      { ...base, pageHost: 'rekrutmen-tni.example.com', pageText: 'Penerimaan Bintara TNI' }, { recruitment: false, opsec: true });
    expect(r2.reasons.join(' ')).not.toContain('Halaman membahas rekrutmen TNI');
  });
  it('domain peniru TNI terdeteksi', () => {
    expect(suspiciousHost('rekrutmen-tni-online.com')).not.toBeNull();
    expect(suspiciousHost('www.tniad.mil.id')).toBeNull();
  });
});
