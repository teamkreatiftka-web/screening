export type Gender = 'Laki-laki' | 'Perempuan';

export type YesNoSometimes = 'Ya' | 'Kadang' | 'Tidak';

export type ScreeningType = 'free' | 'paid';

export type ScreeningStatus = 'Baru' | 'Dalam Review' | 'Selesai' | 'Follow-Up';

export type RiskLevel = 'NORMAL' | 'PERLU DIPERHATIKAN' | 'BUTUH PERHATIAN KHUSUS';

export interface FreeScreeningData {
  // A. Identitas
  namaAnak: string;
  namaIbu: string;
  noHp: string;
  tanggalLahir?: string; // Tanggal Lahir (DOB) -> Sistem auto-hitung usia
  usiaAnak?: string; // Usia terkalkulasi string
  jenisKelamin: Gender;
  bbTerakhir: string;
  tbTerakhir: string;
  tanggalPengukuran?: string; // Tanggal / Usia saat pengukuran BB/TB
  usiaPengukuran: string;

  // B (Dulu D). Pola Pemberian Makan (Feeding Rules & Pilihan Jadwal)
  jadwalMakanUtama: string;
  jadwalSnack: string;
  susuHarian: string;
  makanSambilGadget: YesNoSometimes;
  seringDipaksaBujuk: YesNoSometimes;
  digantiSusuSnack: YesNoSometimes;

  // Legacy fields (optional for backward compatibility with old records)
  seringMenolak?: YesNoSometimes;
  hanyaMauTertentu?: YesNoSometimes;
  menolakMakananBaru?: YesNoSometimes;
  porsiSangatSedikit?: YesNoSometimes;
  butuhDistraksi?: YesNoSometimes;
  waktuMakanLebih30Mnt?: YesNoSometimes;
  responMenolak?: YesNoSometimes;
  melepehMakanan?: YesNoSometimes;
  kesulitanKunyahTelan?: YesNoSometimes;
  pernahTersedak?: YesNoSometimes;
  karbohidratMau?: string;
  proteinMau?: string;
  sayurMau?: string;
  buahMau?: string;
  makananDitolak?: string;
  teksturDiterima?: string;
}

export interface FoodRepertoireRow {
  kategori: 'Karbohidrat' | 'Protein hewani' | 'Protein nabati' | 'Sayur' | 'Buah' | 'Dairy' | 'Snack';
  makananMau: string;
  makananTidakMau: string;
}

export interface PaidScreeningData {
  // Bagian 1: Data Orang Tua
  namaAyah: string;
  waAyah: string;
  namaIbu: string;
  waIbu: string;
  email?: string;
  domisili?: string;

  // Bagian 2: Data Anak
  namaLengkapAnak: string;
  dob: string;
  usiaTerkalkulasi: string;
  jenisKelamin: Gender;
  bbSekarang: string;
  tbPB: string;
  tanggalUkur: string;
  bbLahir: string;
  usiaGestasi: string;
  riwayatNICU: string;
  riwayatPenyakit: string;
  obatSuplemen: string;
  alergiIntoleransi: string;

  // Bagian 3: Riwayat Makan
  jenisSusu: string; // ASI / Sufor / UHT / Kombinasi
  jumlahSusuPerHari: string;
  frekuensiMakanUtama: string;
  frekuensiSnack: string;
  durasiMakan: string;
  lokasiMakan: string;
  pemberiMakan: string;
  jadwalMakanHarian: string;
  makanSambilGadget: string;
  makanSambilJalan: string;
  seringDibujukDipaksa: string;

  // Bagian 4: Food Repertoire
  repertoire: FoodRepertoireRow[];
  jumlahJenisDiterima: string;

  // Bagian 5: Tekstur & Oral Motor
  teksturDiterima: string[]; // Puree, Lumat, Cincang, Lunak, Makanan keluarga
  bisaMengunyah: string;
  seringGagging: string;
  seringBatuk: string;
  pernahTersedak: string;
  melepehMakanan: string;
  lamaDiMulut: string;
  sulitNaikTekstur: string;
  hanyaMauTeksturTertentu: string;

  // Bagian 6: Perilaku Saat Makan
  perilakuMakan: string[];

  // Bagian 7: Sensorik
  alasanSensorik: string[];

  // Bagian 8: 24-Hour Food Recall
  foodRecall: {
    bangunSusu: string;
    sarapanMenu: string;
    sarapanPorsi: string;
    snackPagiMenu: string;
    snackPagiPorsi: string;
    makanSiangMenu: string;
    makanSiangPorsi: string;
    snackSoreMenu: string;
    snackSorePorsi: string;
    makanMalamMenu: string;
    makanMalamPorsi: string;
    susuSebelumTidur: string;
  };

  // Bagian 9: Riwayat Berat Badan
  riwayatBB: {
    bb1BulanLalu: string;
    bb2BulanLalu: string;
    bb3BulanLalu: string;
    bbSekarang: string;
    bbStagnan: string;
    pernahTurunBB: string;
    targetBB: string;
  };

  // Bagian 10: Keluhan Utama Orang Tua
  keluhanUtama: string[];
  keluhanLainnya?: string;
  ceritaKondisi: string;
}

export interface ScreeningRecord {
  id: string; // e.g., RM-2026-8910 or UUID
  created_at: string;
  type: ScreeningType;
  status: ScreeningStatus;
  risk_level: RiskLevel;
  child_name: string;
  mother_name: string;
  father_name?: string;
  phone: string;
  secondary_phone?: string;
  age_text: string;
  gender: string;
  last_weight: string;
  last_height: string;
  measurement_date?: string;
  summary: string;
  clinical_notes?: string;
  problem_areas?: string[];
  free_data?: FreeScreeningData;
  paid_data?: PaidScreeningData;
}
