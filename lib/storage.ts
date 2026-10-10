import { FreeScreeningData, PaidScreeningData, ScreeningRecord, RiskLevel } from '@/types/screening';
import { supabase } from './supabase';
import {
  calculateAgeFromDob,
  evaluateAnthropometry,
  AnthropometryEvaluation,
} from './anthropometry';

const LOCAL_STORAGE_KEY = 'tka_screening_records_v1';

export interface ClinicalScreeningResult {
  risk_level: RiskLevel;
  clinical_category: string;
  age_info: {
    totalMonths: number;
    formatted: string;
  };
  anthropometry: AnthropometryEvaluation | null;
  problem_areas: string[];
  summary: string;
  feeding_rule_violations: string[];
  idai_guidance: string[];
}

// Algoritma Penilai Risiko Berbasis Pedoman Klinis IDAI (Nasional) & WHO (Internasional)
export function evaluateFreeScreening(data: FreeScreeningData): ClinicalScreeningResult {
  const problems: string[] = [];
  const feedingRuleViolations: string[] = [];
  const idaiGuidance: string[] = [];
  let redFlagCount = 0;
  let behavioralScore = 0;

  // 1. EVALUASI USIA DARI TANGGAL LAHIR (DOB) & ANTROPOMETRI (WHO 2006 & Kemenkes RI)
  const age = calculateAgeFromDob(data.tanggalLahir || '');
  const totalMonths = age.totalMonths;
  const anthropometry = evaluateAnthropometry(
    data.tanggalLahir || '',
    data.jenisKelamin,
    data.bbTerakhir,
    data.tbTerakhir,
    data.tanggalPengukuran || data.usiaPengukuran
  );

  if (anthropometry) {
    // Evaluasi Status Gizi BB/U
    if (anthropometry.weightCategory === 'Gizi Buruk (< -3 SD)') {
      problems.push(`⚖️ Status Pertumbuhan (Kemenkes & WHO): Berat badan ${data.bbTerakhir} untuk usia ${age.formatted} berada pada kategori Gizi Buruk (< -3 SD). Perlu rujukan klinis segera.`);
      redFlagCount += 2;
    } else if (anthropometry.weightCategory === 'Gizi Kurang (< -2 SD)') {
      problems.push(`⚖️ Status Pertumbuhan (Kemenkes & WHO): Berat badan ${data.bbTerakhir} untuk usia ${age.formatted} berada di bawah ambang batas normal (Gizi Kurang / Underweight < -2 SD).`);
      behavioralScore += 2;
    }

    // Evaluasi Status TB/U (Stunting)
    if (anthropometry.heightCategory.includes('Stunted') || anthropometry.heightCategory.includes('Pendek')) {
      problems.push(`📏 Panjang/Tinggi Badan (WHO Standards): ${data.tbTerakhir} cm terindikasi ${anthropometry.heightCategory}. Asupan nutrisi adekuat khususnya protein hewani dan zink sangat mendesak.`);
      behavioralScore += 1;
    }

    // Evaluasi Kebaruan Pengukuran
    if (anthropometry.measurementRecencyNote.includes('⚠️')) {
      problems.push(`📅 Validitas Antropometri: ${anthropometry.measurementRecencyNote}`);
    }
  }

  // 2. EVALUASI ATURAN MAKAN BAKU & LINGKUNGAN (FEEDING RULES IDAI & AAP)
  if (data.makanSambilGadget === 'Ya') {
    feedingRuleViolations.push('Ketergantungan gadget/TV saat makan');
    problems.push('📱 Pilar Lingkungan: Makan dengan distraksi gadget/TV. AAP dan IDAI menyatakan screen time saat makan menumpulkan pengenalan rasa lapar dan kenyang (hunger-satiety cues).');
    behavioralScore += 1;
    idaiGuidance.push('Hentikan penggunaan gawai/TV saat jam makan; libatkan anak fokus pada warna, aroma, dan tekstur makanan di hadapannya.');
  }

  if (data.seringDipaksaBujuk === 'Ya') {
    feedingRuleViolations.push('Paksaan / tekanan makan emosional');
    problems.push('⚡ Pilar Lingkungan Emosional: Sering ada paksaan atau bujukan berlebih. Tekanan memicu respons melawan (food aversion) dan trauma psikologis pada waktu makan.');
    behavioralScore += 1;
    idaiGuidance.push('Terapkan Division of Responsibility: Bunda menentukan menu dan jadwal, anak menentukan seberapa banyak yang ia telan.');
  }

  if (data.digantiSusuSnack === 'Ya') {
    feedingRuleViolations.push('Makanan utama digantikan susu/snack');
    problems.push('🥛 Kompensasi Nutrisi Negatif: Makanan utama diganti susu atau camilan ketika mogok. Anak belajar bahwa menolak makan nasi akan mendatangkan susu atau camilan yang lebih disukai.');
    behavioralScore += 1;
    idaiGuidance.push('Jangan langsung menawarkan susu atau biskuit saat anak menolak makanan utama; beri jeda hingga jam makan/snack terjadwal berikutnya.');
  }

  // Evaluasi Konsumsi Susu Harian Berdasarkan Usia
  const susuText = (data.susuHarian || '').toLowerCase();
  const matchesMl = susuText.match(/(\d{3,4})\s*ml/);
  if (matchesMl && matchesMl[1]) {
    const mlNum = parseInt(matchesMl[1], 10);
    if (totalMonths >= 12 && mlNum > 600) {
      problems.push(`🍼 Asupan Susu Berlebihan (${mlNum} ml/hari): Pada usia >1 tahun, rekomendasi IDAI membatasi susu maksimal 400-500 ml/hari. Susu berlebih membuat anak kenyang kalori cair sehingga menolak makanan padat (Milk Anemia).`);
      behavioralScore += 1;
      idaiGuidance.push(`Batasi asupan susu menjadi 400-500 ml/hari agar lambung anak memiliki ruang untuk makanan padat bergizi.`);
    }
  } else if (
    susuText.includes('>600') ||
    susuText.includes('700') ||
    susuText.includes('800') ||
    susuText.includes('banyak') ||
    susuText.includes('sering')
  ) {
    if (totalMonths >= 12) {
      problems.push(`🍼 Asupan Susu Cenderung Berlebih: Pada usia >1 tahun, susu berlebih dapat menekan nafsu makan makanan padat.`);
      behavioralScore += 1;
      idaiGuidance.push(`Batasi asupan susu menjadi 400-500 ml/hari agar lambung anak memiliki ruang untuk makanan padat bergizi.`);
    }
  }

  // Evaluasi Keteraturan Jadwal Makan
  if (data.jadwalMakanUtama && (data.jadwalMakanUtama.includes('tidak teratur') || data.jadwalMakanUtama.includes('berantakan') || data.jadwalMakanUtama.includes('sesuka'))) {
    feedingRuleViolations.push('Jadwal makan tidak teratur');
    problems.push('⏰ Pilar Jadwal: Jadwal makan belum teratur atau berubah-ubah setiap hari.');
    behavioralScore += 1;
    idaiGuidance.push('Buat jadwal makan rutin yang terprediksi (3x makan utama dan 2x snack terjadwal dengan jeda 2-3 jam).');
  }

  // Backward compatibility check for legacy records (if fields are present)
  if (data.pernahTersedak === 'Ya') {
    problems.push('⚠️ Red Flag Oral-Motor: Ada riwayat tersedak saat makan (risiko inkoordinasi menelan/aspirasi faringeal).');
    redFlagCount += 2;
  }
  if (data.kesulitanKunyahTelan === 'Ya') {
    problems.push('⚠️ Red Flag Oral-Motor: Anak kesulitan mengunyah atau menelan makanan padat.');
    redFlagCount += 2;
  }

  // 5. PENENTUAN STATUS & KATEGORI KLINIS AKHIR
  let risk_level: RiskLevel = 'NORMAL';
  let clinical_category = 'Pola Makan Fisiologis Normal Sesuai Usia';
  let summary = '';

  if (redFlagCount >= 2 || (redFlagCount >= 1 && behavioralScore >= 3)) {
    risk_level = 'BUTUH PERHATIAN KHUSUS';
    clinical_category = 'Kondisi Parah: Ditemukan Red Flags & Masalah Makan Berat (Wajib Konsul)';
    summary =
      `Kondisi ananda tergolong parah karena menunjukkan red flag pada fungsi oral-motor/risiko tersedak atau defisit gizi yang berisiko mengganggu tumbuh kembang. Ananda WAJIB KONSUL dengan tim dokter untuk penanganan dan intervensi medis segera.`;
  } else if (behavioralScore >= 2 || feedingRuleViolations.length >= 2) {
    risk_level = 'PERLU DIPERHATIKAN';
    clinical_category = 'Hati-Hati: Inappropriate Feeding Practice & Picky Eating (Disarankan Konsul)';
    summary =
      `Peringatan Hati-Hati: Berdasarkan pedoman IDAI dan WHO, pola makan ananda menunjukkan ketidaksesuaian feeding rules, durasi makan yang panjang, atau penolakan jenis makanan tertentu. Anda DISARANKAN KONSUL dengan dokter untuk panduan perbaikan pola makan sebelum mempengaruhi kurva berat badan.`;
  } else {
    risk_level = 'NORMAL';
    clinical_category = 'Pola Makan Sesuai Tahapan Tumbuh Kembang (Normal)';
    summary =
      `Secara keseluruhan, pola makan ananda usia ${age.formatted || '-'} masih dalam batas normal. Tetap pantau secara rutin dan terapkan feeding rules yang konsisten tanpa paksaan.`;
    if (problems.length === 0) {
      problems.push('✨ Aturan Makan Ideal: Pola makan ananda sesuai tahapan tumbuh kembang dan feeding rules IDAI.');
    }
  }

  return {
    risk_level,
    clinical_category,
    age_info: {
      totalMonths: age.totalMonths,
      formatted: age.formatted,
    },
    anthropometry,
    problem_areas: problems,
    summary,
    feeding_rule_violations: feedingRuleViolations,
    idai_guidance: idaiGuidance,
  };
}

// Generate unique ID format Rekam Medis
export function generateRecordId(type: 'free' | 'paid'): string {
  const prefix = type === 'paid' ? 'RM-PRO' : 'RM-FREE';
  const year = new Date().getFullYear();
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${year}-${randomSuffix}`;
}

// Default Seed Rekam Medis untuk pertama kali jika kosong
export const INITIAL_SAMPLE_RECORDS: ScreeningRecord[] = [
  {
    id: 'RM-PRO-2026-1024',
    created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
    type: 'paid',
    status: 'Dalam Review',
    risk_level: 'BUTUH PERHATIAN KHUSUS',
    child_name: 'Arsya Bagas Pratama',
    mother_name: 'Bunda Rina Wardhani',
    father_name: 'Ayah Dimas Pratama',
    phone: '081234567890',
    secondary_phone: '081398765432',
    age_text: '2 tahun 4 bulan',
    gender: 'Laki-laki',
    last_weight: '10.2 kg',
    last_height: '84 cm',
    measurement_date: '2026-09-28',
    summary:
      'GTM kronis sejak usia 14 bulan. Hanya mau nasi kecap dan biskuit. Melepeh makanan berserat, sering muntah jika dipaksa mengunyah daging.',
    clinical_notes:
      'Tim Ziad Medika: Jadwalkan telekonsultasi GMeet Kamis ini. Perlu assessment oral motor mendalam terkait hiper-sensitivitas tekstur.',
    problem_areas: [
      'GTM dan porsi makan sangat minim',
      'Tekstur stagnan di semi-lunak (sulit naik ke makanan keluarga)',
      'BB stagnan 3 bulan berturut-turut',
      'Ketergantungan gadget saat disuapi',
    ],
    paid_data: {
      namaAyah: 'Dimas Pratama',
      waAyah: '081398765432',
      namaIbu: 'Rina Wardhani',
      waIbu: '081234567890',
      email: 'rina.wardhani@gmail.com',
      domisili: 'Cirebon Kota',
      namaLengkapAnak: 'Arsya Bagas Pratama',
      dob: '2024-05-15',
      usiaTerkalkulasi: '2 tahun 4 bulan',
      jenisKelamin: 'Laki-laki',
      bbSekarang: '10.2 kg',
      tbPB: '84 cm',
      tanggalUkur: '2026-09-28',
      bbLahir: '3.1 kg',
      usiaGestasi: '38 minggu',
      riwayatNICU: 'Tidak ada',
      riwayatPenyakit: 'Batuk pilek berulang',
      obatSuplemen: 'Curcuma plus (jarang diminum)',
      alergiIntoleransi: 'Tidak ada alergi yang terkonfirmasi',
      jenisSusu: 'Sufor (SGM Eksplor)',
      jumlahSusuPerHari: '600 ml (4 botol)',
      frekuensiMakanUtama: '2 kali (sering tidak habis)',
      frekuensiSnack: '3-4 kali camilan manis/biskuit',
      durasiMakan: '> 45 menit',
      lokasiMakan: 'Depan TV / digendong keliling',
      pemberiMakan: 'Ibu dan Nenek',
      jadwalMakanHarian: 'Tidak teratur, tergantung kemauan anak',
      makanSambilGadget: 'Ya, nonton YouTube Cocomelon',
      makanSambilJalan: 'Ya, sering keliling komplek',
      seringDibujukDipaksa: 'Ya, sering sampai menangis',
      repertoire: [
        { kategori: 'Karbohidrat', makananMau: 'Nasi lembek, kentang goreng', makananTidakMau: 'Nasi tim, jagung, ubi' },
        { kategori: 'Protein hewani', makananMau: 'Telur dadar tipis, sosis', makananTidakMau: 'Daging sapi, ayam, ikan kembung' },
        { kategori: 'Protein nabati', makananMau: 'Tahu goreng garing', makananTidakMau: 'Tempe, kacang hijau' },
        { kategori: 'Sayur', makananMau: 'Hanya kuah sup bening', makananTidakMau: 'Wortel, bayam, brokoli' },
        { kategori: 'Buah', makananMau: 'Pisang cavendish', makananTidakMau: 'Pepaya, mangga, alpukat' },
        { kategori: 'Dairy', makananMau: 'Keju slice, yogurt pouch', makananTidakMau: 'Susu UHT tawar' },
        { kategori: 'Snack', makananMau: 'Biskuit marie, wafer cokelat', makananTidakMau: 'Buah potong' },
      ],
      jumlahJenisDiterima: '8 jenis makanan',
      teksturDiterima: ['Lunak', 'Cincang halus'],
      bisaMengunyah: 'Bisa tapi malas mengunyah makanan berserat',
      seringGagging: 'Ya, sering saat ada tekstur kasar',
      seringBatuk: 'Kadang-kadang',
      pernahTersedak: 'Pernah saat makan potongan daging ayam',
      melepehMakanan: 'Ya, sangat sering jika merasa ada serat',
      lamaDiMulut: 'Ya, makanan sering dikemut sampai 20 menit',
      sulitNaikTekstur: 'Sangat sulit, muntah jika dipaksa',
      hanyaMauTeksturTertentu: 'Ya, suka yang renyah kering atau kuah bening',
      perilakuMakan: ['Menutup mulut', 'Memalingkan wajah', 'Menangis', 'Harus sambil gadget', 'Sangat lama menghabiskan makanan'],
      alasanSensorik: ['Tekstur', 'Aroma', 'Campuran makanan', 'Takut makanan baru'],
      foodRecall: {
        bangunSusu: 'Sufor 150 ml (jam 06.30)',
        sarapanMenu: 'Nasi lembek 3 suap + telur dadar',
        sarapanPorsi: '1/4 mangkuk kecil',
        snackPagiMenu: 'Biskuit marie 2 keping + sufor 120 ml',
        snackPagiPorsi: 'Habis',
        makanSiangMenu: 'Nasi kuah sop (sayur dilepeh)',
        makanSiangPorsi: '3-4 sendok makan',
        snackSoreMenu: 'Keripik kentang & yogurt',
        snackSorePorsi: '1 pouch yogurt',
        makanMalamMenu: 'Nasi kecap + sosis goreng',
        makanMalamPorsi: '1/3 porsi anak',
        susuSebelumTidur: 'Sufor 180 ml (jam 21.00)',
      },
      riwayatBB: {
        bb1BulanLalu: '10.2 kg',
        bb2BulanLalu: '10.3 kg',
        bb3BulanLalu: '10.2 kg',
        bbSekarang: '10.2 kg',
        bbStagnan: 'Ya, sudah 3 bulan tidak ada kenaikan',
        pernahTurunBB: 'Pernah turun 200 gram saat demam',
        targetBB: '11.5 kg (sesuai kurva WHO)',
      },
      keluhanUtama: ['GTM', 'Porsi makan sedikit', 'Pilih-pilih makanan', 'Sulit naik tekstur', 'BB sulit naik'],
      keluhanLainnya: 'Sering drama saat jam makan',
      ceritaKondisi:
        'Bunda merasa sangat stress setiap kali tiba jam makan. Arsya langsung histeris kalau lihat mangkuk makan. Harus dibujuk pakai HP dan digendong, itu pun hanya masuk 3-4 suap lalu dikemut lama sekali.',
    },
  },
  {
    id: 'RM-FREE-2026-8821',
    created_at: new Date(Date.now() - 3600000 * 12).toISOString(),
    type: 'free',
    status: 'Baru',
    risk_level: 'PERLU DIPERHATIKAN',
    child_name: 'Mikayla Zanna Kirana',
    mother_name: 'Bunda Novita Sari',
    phone: '085712349988',
    age_text: '18 bulan',
    gender: 'Perempuan',
    last_weight: '9.4 kg',
    last_height: '78 cm',
    measurement_date: '2026-10-01',
    summary:
      'Anak mulai menolak nasi dan sayuran, durasi makan sering >30 menit dan harus disetelkan video lagu anak agar mau mangap.',
    clinical_notes: '',
    problem_areas: [
      '🍽️ Pola makan: Mulai menunjukkan tanda selektivitas makan',
      '⏰ Durasi makan: Cenderung berlarut-larut (>30 menit)',
      '📱 Distraksi: Masih bergantung pada video lagu anak',
    ],
    free_data: {
      namaAnak: 'Mikayla Zanna Kirana',
      namaIbu: 'Novita Sari',
      noHp: '085712349988',
      tanggalLahir: '2025-04-10',
      usiaAnak: '18 bulan',
      jenisKelamin: 'Perempuan',
      bbTerakhir: '9.4 kg',
      tbTerakhir: '78 cm',
      usiaPengukuran: '17 bulan',
      seringMenolak: 'Kadang',
      hanyaMauTertentu: 'Ya',
      menolakMakananBaru: 'Ya',
      porsiSangatSedikit: 'Kadang',
      butuhDistraksi: 'Ya',
      waktuMakanLebih30Mnt: 'Ya',
      responMenolak: 'Kadang',
      melepehMakanan: 'Kadang',
      kesulitanKunyahTelan: 'Tidak',
      pernahTersedak: 'Tidak',
      karbohidratMau: 'Kentang, mie, roti',
      proteinMau: 'Ayam krispi, keju',
      sayurMau: 'Sangat jarang, hampir tidak mau',
      buahMau: 'Semangka, jeruk manis',
      makananDitolak: 'Nasi putih, brokoli, ikan kukus',
      teksturDiterima: 'Garing dan renyah',
      jadwalMakanUtama: 'Jam 08.00, 13.00, 19.00',
      jadwalSnack: 'Jam 10.30 & 16.00',
      susuHarian: 'UHT 400 ml/hari',
      makanSambilGadget: 'Ya',
      seringDipaksaBujuk: 'Kadang',
      digantiSusuSnack: 'Ya',
    },
  },
  {
    id: 'RM-FREE-2026-3012',
    created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
    type: 'free',
    status: 'Selesai',
    risk_level: 'NORMAL',
    child_name: 'Kenzo Althaf',
    mother_name: 'Bunda Fitriani',
    phone: '081908765411',
    age_text: '3 tahun',
    gender: 'Laki-laki',
    last_weight: '14.1 kg',
    last_height: '96 cm',
    measurement_date: '2026-09-20',
    summary:
      'Pola makan secara umum baik, nafsu makan stabil, hanya kadang menolak sayuran hijau baru.',
    clinical_notes: 'Sudah follow up via WA. Bunda diedukasi teknik food bridging untuk sayuran.',
    problem_areas: ['✨ Feeding habits: Menunjukkan sinyal positif dan respons adaptif'],
    free_data: {
      namaAnak: 'Kenzo Althaf',
      namaIbu: 'Fitriani',
      noHp: '081908765411',
      tanggalLahir: '2023-09-15',
      usiaAnak: '3 tahun',
      jenisKelamin: 'Laki-laki',
      bbTerakhir: '14.1 kg',
      tbTerakhir: '96 cm',
      usiaPengukuran: '36 bulan',
      seringMenolak: 'Tidak',
      hanyaMauTertentu: 'Kadang',
      menolakMakananBaru: 'Kadang',
      porsiSangatSedikit: 'Tidak',
      butuhDistraksi: 'Tidak',
      waktuMakanLebih30Mnt: 'Tidak',
      responMenolak: 'Tidak',
      melepehMakanan: 'Tidak',
      kesulitanKunyahTelan: 'Tidak',
      pernahTersedak: 'Tidak',
      karbohidratMau: 'Nasi, mie, kentang, roti',
      proteinMau: 'Ayam, telur, ikan nila, tahu, tempe',
      sayurMau: 'Wortel sup, bayam bening',
      buahMau: 'Pisang, pepaya, apel',
      makananDitolak: 'Pare, brokoli mentah',
      teksturDiterima: 'Makanan keluarga normal',
      jadwalMakanUtama: 'Teratur 3x sehari bersama keluarga',
      jadwalSnack: '2x sehari buah / biskuit',
      susuHarian: 'UHT 250 ml menjelang tidur',
      makanSambilGadget: 'Tidak',
      seringDipaksaBujuk: 'Tidak',
      digantiSusuSnack: 'Tidak',
    },
  },
];

// Helper Mengambil data dari localStorage
function getLocalRecords(): ScreeningRecord[] {
  if (typeof window === 'undefined') return INITIAL_SAMPLE_RECORDS;
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(INITIAL_SAMPLE_RECORDS));
      return INITIAL_SAMPLE_RECORDS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : INITIAL_SAMPLE_RECORDS;
  } catch (e) {
    console.error('Failed to read local records:', e);
    return INITIAL_SAMPLE_RECORDS;
  }
}

// Simpan ke Local Storage
function setLocalRecords(records: ScreeningRecord[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(records));
  } catch (e) {
    console.error('Failed to save to local storage:', e);
  }
}

// SIMPAN RECORD BARU (Dual-Write: Local Storage + Supabase)
export async function saveScreeningRecord(record: ScreeningRecord): Promise<{
  success: boolean;
  id: string;
  supabaseSynced: boolean;
  error?: string;
}> {
  // 1. Simpan ke local storage selalu berhasil dan instan
  const existing = getLocalRecords();
  const updated = [record, ...existing.filter((r) => r.id !== record.id)];
  setLocalRecords(updated);

  let supabaseSynced = false;
  let supabaseError = '';

  // 2. Coba simpan ke Supabase
  try {
    const { error } = await supabase.from('screenings').upsert([
      {
        id: record.id,
        created_at: record.created_at,
        type: record.type,
        status: record.status,
        risk_level: record.risk_level,
        child_name: record.child_name,
        mother_name: record.mother_name,
        father_name: record.father_name || null,
        phone: record.phone,
        secondary_phone: record.secondary_phone || null,
        age_text: record.age_text,
        gender: record.gender,
        last_weight: record.last_weight,
        last_height: record.last_height,
        measurement_date: record.measurement_date || null,
        summary: record.summary,
        problem_areas: record.problem_areas || [],
        clinical_notes: record.clinical_notes || '',
        free_data: record.free_data || null,
        paid_data: record.paid_data || null,
      },
    ]);

    if (!error) {
      supabaseSynced = true;
    } else {
      supabaseError = error.message;
      console.warn('Supabase upsert note:', error.message);
    }
  } catch (err: any) {
    supabaseError = err?.message || 'Network / Supabase schema issue';
    console.warn('Supabase sync exception:', supabaseError);
  }

  return {
    success: true,
    id: record.id,
    supabaseSynced,
    error: supabaseError,
  };
}

// AMBIL SEMUA RECORD (Merge dari Supabase jika ada, fallback local storage)
export async function fetchAllScreenings(): Promise<{
  records: ScreeningRecord[];
  fromSupabase: boolean;
}> {
  const localList = getLocalRecords();

  try {
    const { data, error } = await supabase
      .from('screenings')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && Array.isArray(data) && data.length > 0) {
      // Format Supabase data ke tipe ScreeningRecord
      const remoteRecords: ScreeningRecord[] = data.map((item) => ({
        id: item.id,
        created_at: item.created_at || new Date().toISOString(),
        type: item.type as any,
        status: (item.status as any) || 'Baru',
        risk_level: (item.risk_level as any) || 'PERLU DIPERHATIKAN',
        child_name: item.child_name || 'Tanpa Nama',
        mother_name: item.mother_name || '-',
        father_name: item.father_name || undefined,
        phone: item.phone || '',
        secondary_phone: item.secondary_phone || undefined,
        age_text: item.age_text || '-',
        gender: item.gender || 'Laki-laki',
        last_weight: item.last_weight || '-',
        last_height: item.last_height || '-',
        measurement_date: item.measurement_date || undefined,
        summary: item.summary || '',
        clinical_notes: item.clinical_notes || '',
        problem_areas: item.problem_areas || [],
        free_data: item.free_data || undefined,
        paid_data: item.paid_data || undefined,
      }));

      // Merge dengan data local yang belum ada di remote
      const remoteIds = new Set(remoteRecords.map((r) => r.id));
      const unmergedLocals = localList.filter((l) => !remoteIds.has(l.id));
      const merged = [...remoteRecords, ...unmergedLocals];

      setLocalRecords(merged);
      return { records: merged, fromSupabase: true };
    }
  } catch (e) {
    console.warn('Could not fetch from Supabase table directly, using local store:', e);
  }

  return { records: localList, fromSupabase: false };
}

// UPDATE STATUS ATAU CATATAN KLINIS
export async function updateRecordDetails(
  id: string,
  updates: Partial<Pick<ScreeningRecord, 'status' | 'clinical_notes'>>
): Promise<boolean> {
  const records = getLocalRecords();
  const index = records.findIndex((r) => r.id === id);
  if (index !== -1) {
    records[index] = { ...records[index], ...updates };
    setLocalRecords(records);
  }

  try {
    await supabase.from('screenings').update(updates).eq('id', id);
  } catch (e) {
    console.warn('Supabase update note:', e);
  }

  return true;
}

// HAPUS RECORD
export async function deleteRecord(id: string): Promise<boolean> {
  const records = getLocalRecords();
  const filtered = records.filter((r) => r.id !== id);
  setLocalRecords(filtered);

  try {
    await supabase.from('screenings').delete().eq('id', id);
  } catch (e) {
    console.warn('Supabase delete note:', e);
  }

  return true;
}
