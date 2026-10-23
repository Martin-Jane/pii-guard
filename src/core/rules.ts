import type { PiiRule } from './types';

/**
 * Kamus deteksi PII (Indonesia + Inggris). Pola dicocokkan ke teks yang sudah
 * dinormalisasi (lowercase, tanda baca -> spasi). Tambah/ubah aturan di sini.
 */
export const RULES: PiiRule[] = [
  {
    kind: 'nik', label: 'NIK / No. KTP', severity: 5, specific: false,
    patterns: [/\b(nik|ktp|no identitas|nomor identitas|nomor induk kependudukan|no induk kependudukan|national id|id number)\b/],
    edu: 'NIK dipakai untuk mendaftar pinjaman online, SIM card, dan rekening. Bocornya NIK memudahkan orang lain membuat akun atas namamu.',
  },
  {
    kind: 'kk', label: 'Kartu Keluarga', severity: 4, specific: false,
    patterns: [/\b(no kk|nomor kk|kartu keluarga)\b/],
    edu: 'Nomor KK sering diminta bersama NIK untuk verifikasi data kependudukan. Kombinasinya sangat berharga bagi penipu.',
  },
  {
    kind: 'npwp', label: 'NPWP', severity: 4, specific: false,
    patterns: [/\b(npwp|nomor pokok wajib pajak)\b/],
    edu: 'NPWP terhubung ke data perpajakan dan identitas finansialmu.',
  },
  {
    kind: 'mother_name', label: 'Nama ibu kandung', severity: 4, specific: false,
    patterns: [/\b(ibu kandung|nama ibu|mother s maiden|mother maiden|mother name)\b/],
    edu: 'Nama ibu kandung sering dipakai sebagai pertanyaan verifikasi bank dan layanan keuangan.',
  },
  {
    kind: 'phone', label: 'Nomor HP', severity: 2, specific: false,
    patterns: [/\b(no hp|nomor hp|no handphone|nomor handphone|no telp|no telepon|nomor telepon|nomor telp|telepon|telphone|telephone|phone|mobile number|no wa|nomor wa|whats ?app)\b/],
    autocomplete: ['tel', 'tel-national'],
    edu: 'Nomor HP dipakai untuk OTP dan bisa dijual untuk spam atau penipuan.',
  },
  {
    kind: 'email', label: 'Email', severity: 1, specific: false,
    patterns: [/\b(e ?mail|surel)\b/],
    autocomplete: ['email'],
    edu: 'Email bisa dipakai untuk phishing dan pengambilalihan akun.',
  },
  {
    kind: 'fullname', label: 'Nama lengkap', severity: 1, specific: false,
    patterns: [/\b(nama lengkap|nama sesuai ktp|full name|first name|last name)\b/],
    autocomplete: ['name', 'given-name', 'family-name'],
    edu: 'Nama lengkap menjadi bagian dari profil identitas yang bisa dikumpulkan dari banyak sumber.',
  },
  {
    kind: 'address', label: 'Alamat', severity: 2, specific: false,
    patterns: [/\b(alamat|address|domisili|kelurahan|kecamatan|kode pos|postal code|zip code)\b/],
    autocomplete: ['street-address', 'address-line1', 'postal-code'],
    edu: 'Alamat rumah menyangkut keselamatan fisik, bukan hanya privasi digital.',
  },
  {
    kind: 'birth', label: 'Tanggal/tempat lahir', severity: 2, specific: false,
    patterns: [/\b(tanggal lahir|tgl lahir|tempat lahir|date of birth|dob|birth ?date|birthday)\b/],
    autocomplete: ['bday'],
    edu: 'Tanggal lahir sering dipakai sebagai kata sandi atau pertanyaan keamanan.',
  },
  {
    kind: 'bank_account', label: 'Nomor rekening', severity: 4, specific: true,
    patterns: [/\b(no rekening|nomor rekening|rekening|account number|bank account|iban)\b/],
    edu: 'Data keuangan pribadi termasuk data pribadi spesifik. Pastikan situs ini memang berwenang memintanya.',
  },
  {
    kind: 'card_number', label: 'Nomor kartu', severity: 5, specific: true,
    patterns: [/\b(nomor kartu|no kartu|card number|kartu kredit|kartu debit|credit card|cc number)\b/],
    autocomplete: ['cc-number'],
    edu: 'Nomor kartu hanya aman diberikan di halaman pembayaran resmi yang kamu tuju sendiri.',
  },
  {
    kind: 'cvv', label: 'CVV/CVC kartu', severity: 5, specific: true,
    patterns: [/\b(cvv|cvc|cvn|kode keamanan kartu|security code)\b/],
    autocomplete: ['cc-csc'],
    edu: 'CVV adalah kunci terakhir transaksi kartu. Tidak ada pihak resmi yang meminta CVV lewat form biasa.',
  },
  {
    kind: 'otp', label: 'Kode OTP', severity: 5, specific: false,
    patterns: [/\b(otp|kode otp|one time password|kode verifikasi|verification code|kode sms)\b/],
    autocomplete: ['one-time-code'],
    edu: 'OTP bersifat rahasia. Pihak resmi tidak pernah meminta OTP-mu. Jangan berikan ke siapa pun.',
  },
  {
    kind: 'pin', label: 'PIN', severity: 5, specific: false,
    patterns: [/\b(pin|kode pin|pin atm|pin m banking|pin mobile banking)\b/],
    edu: 'PIN adalah rahasia mutlak. Jangan masukkan PIN di form web yang tidak kamu kenal.',
  },
  {
    kind: 'health', label: 'Data kesehatan', severity: 3, specific: true,
    patterns: [/\b(riwayat penyakit|golongan darah|bpjs|diagnosa|diagnosis|rekam medis|medical record)\b/],
    edu: 'Data kesehatan termasuk data pribadi spesifik menurut UU PDP dan perlu perlindungan lebih.',
  },
  {
    kind: 'ktp_photo', label: 'Foto KTP/identitas', severity: 5, specific: false,
    patterns: [/\b(ktp|kartu identitas|identity card|id card|sim|paspor|passport)\b/],
    edu: 'Foto KTP kerap dipakai untuk pinjaman online ilegal atas nama korban. Beri hanya ke layanan terpercaya.',
  },
  {
    kind: 'selfie', label: 'Selfie/foto wajah', severity: 4, specific: true,
    patterns: [/\b(selfie|swafoto|foto diri|foto wajah|face|biometrik|biometric)\b/],
    edu: 'Foto wajah adalah data biometrik, termasuk data pribadi spesifik. Sering dipasangkan dengan foto KTP untuk verifikasi palsu.',
  },
];
