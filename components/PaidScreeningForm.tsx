'use client';

import React, { useState } from 'react';
import {
  PaidScreeningData,
  Gender,
  FoodRepertoireRow,
  ScreeningRecord,
} from '@/types/screening';
import { generateRecordId, saveScreeningRecord } from '@/lib/storage';
import {
  CheckCircle2,
  Clock,
  ArrowRight,
  ArrowLeft,
  Calendar,
  HelpCircle,
  FileCheck2,
  MessageCircle,
  ShieldCheck,
  ChevronDown,
  RotateCcw,
  Sparkles,
} from 'lucide-react';

const INITIAL_REPERTOIRE: FoodRepertoireRow[] = [
  { kategori: 'Karbohidrat', makananMau: '', makananTidakMau: '' },
  { kategori: 'Protein hewani', makananMau: '', makananTidakMau: '' },
  { kategori: 'Protein nabati', makananMau: '', makananTidakMau: '' },
  { kategori: 'Sayur', makananMau: '', makananTidakMau: '' },
  { kategori: 'Buah', makananMau: '', makananTidakMau: '' },
  { kategori: 'Dairy', makananMau: '', makananTidakMau: '' },
  { kategori: 'Snack', makananMau: '', makananTidakMau: '' },
];

const BEHAVIOR_OPTIONS = [
  'Menutup mulut',
  'Memalingkan wajah',
  'Menangis',
  'Kabur dari meja makan',
  'Melempar makanan',
  'Memukul/menolak pengasuh',
  'Harus disuapi',
  'Harus sambil gadget',
  'Harus sambil bermain',
  'Hanya mau makan dengan orang tertentu',
  'Sangat lama menghabiskan makanan',
];

const SENSORY_OPTIONS = [
  'Tekstur',
  'Warna',
  'Aroma',
  'Rasa',
  'Suhu',
  'Bentuk',
  'Campuran makanan',
  'Takut makanan baru',
  'Tidak diketahui',
];

const TEXTURE_OPTIONS = ['Puree', 'Lumat', 'Cincang', 'Lunak', 'Makanan keluarga'];

const MAIN_COMPLAINT_OPTIONS = [
  'GTM (Gerakan Tutup Mulut)',
  'Porsi makan sedikit',
  'Pilih-pilih makanan (Picky Eating)',
  'Tidak mau protein',
  'Tidak mau sayur/buah',
  'Sulit naik tekstur',
  'Lama makan (>30 menit)',
  'Sering melepeh makanan',
  'Gagging / batuk / tersedak',
  'BB sulit naik / stagnan',
  'Lainnya',
];

function computeChildAge(dob: string): string {
  if (!dob) return '';
  try {
    const birth = new Date(dob);
    const now = new Date();
    if (isNaN(birth.getTime())) return '';

    let years = now.getFullYear() - birth.getFullYear();
    let months = now.getMonth() - birth.getMonth();
    if (now.getDate() < birth.getDate()) {
      months--;
    }
    if (months < 0) {
      years--;
      months += 12;
    }

    const totalMonths = years * 12 + months;
    if (years <= 0) {
      return `${totalMonths} Bulan`;
    }
    return `${years} Tahun ${months} Bulan (${totalMonths} Bulan)`;
  } catch {
    return '';
  }
}

export function PaidScreeningForm() {
  const [formData, setFormData] = useState<PaidScreeningData>({
    // Bagian 1
    namaAyah: '',
    waAyah: '',
    namaIbu: '',
    waIbu: '',
    email: '',
    domisili: '',

    // Bagian 2
    namaLengkapAnak: '',
    dob: '',
    usiaTerkalkulasi: '',
    jenisKelamin: 'Laki-laki',
    bbSekarang: '',
    tbPB: '',
    tanggalUkur: '',
    bbLahir: '',
    usiaGestasi: '',
    riwayatNICU: 'Tidak',
    riwayatPenyakit: '',
    obatSuplemen: '',
    alergiIntoleransi: '',

    // Bagian 3
    jenisSusu: 'Sufor',
    jumlahSusuPerHari: '',
    frekuensiMakanUtama: '3 kali',
    frekuensiSnack: '2 kali',
    durasiMakan: '30-45 menit',
    lokasiMakan: 'Meja makan / depan TV',
    pemberiMakan: 'Ibu',
    jadwalMakanHarian: '',
    makanSambilGadget: 'Ya',
    makanSambilJalan: 'Kadang',
    seringDibujukDipaksa: 'Ya',

    // Bagian 4
    repertoire: INITIAL_REPERTOIRE,
    jumlahJenisDiterima: '',

    // Bagian 5
    teksturDiterima: ['Lunak'],
    bisaMengunyah: 'Bisa',
    seringGagging: 'Kadang',
    seringBatuk: 'Tidak',
    pernahTersedak: 'Tidak',
    melepehMakanan: 'Kadang',
    lamaDiMulut: 'Kadang',
    sulitNaikTekstur: 'Ya',
    hanyaMauTeksturTertentu: 'Ya',

    // Bagian 6
    perilakuMakan: ['Menutup mulut', 'Harus disuapi'],

    // Bagian 7
    alasanSensorik: ['Tekstur', 'Campuran makanan'],

    // Bagian 8
    foodRecall: {
      bangunSusu: '',
      sarapanMenu: '',
      sarapanPorsi: '',
      snackPagiMenu: '',
      snackPagiPorsi: '',
      makanSiangMenu: '',
      makanSiangPorsi: '',
      snackSoreMenu: '',
      snackSorePorsi: '',
      makanMalamMenu: '',
      makanMalamPorsi: '',
      susuSebelumTidur: '',
    },

    // Bagian 9
    riwayatBB: {
      bb1BulanLalu: '',
      bb2BulanLalu: '',
      bb3BulanLalu: '',
      bbSekarang: '',
      bbStagnan: 'Ya',
      pernahTurunBB: 'Tidak',
      targetBB: '',
    },

    // Bagian 10
    keluhanUtama: ['GTM (Gerakan Tutup Mulut)', 'Porsi makan sedikit'],
    keluhanLainnya: '',
    ceritaKondisi: '',
  });

  const [currentStep, setCurrentStep] = useState<number>(1);
  const totalSteps = 10;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedRecordId, setSubmittedRecordId] = useState<string | null>(null);

  // Auto-hitung usia anak dari DOB
  const calculatedAge = computeChildAge(formData.dob);

  const handleDobChange = (dobVal: string) => {
    setFormData((prev) => ({
      ...prev,
      dob: dobVal,
    }));
  };

  const handleRepertoireChange = (
    index: number,
    field: 'makananMau' | 'makananTidakMau',
    value: string
  ) => {
    setFormData((prev) => {
      const copy = [...prev.repertoire];
      copy[index] = { ...copy[index], [field]: value };
      return { ...prev, repertoire: copy };
    });
  };

  const toggleArrayItem = (
    listField: 'teksturDiterima' | 'perilakuMakan' | 'alasanSensorik' | 'keluhanUtama',
    item: string
  ) => {
    setFormData((prev) => {
      const current = prev[listField];
      const exists = current.includes(item);
      const next = exists ? current.filter((x) => x !== item) : [...current, item];
      return { ...prev, [listField]: next };
    });
  };

  const handleFoodRecallChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      foodRecall: {
        ...prev.foodRecall,
        [field]: value,
      },
    }));
  };

  const handleRiwayatBBChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      riwayatBB: {
        ...prev.riwayatBB,
        [field]: value,
      },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.namaLengkapAnak.trim() || !formData.namaIbu.trim() || !formData.waIbu.trim()) {
      alert('Mohon pastikan nama anak, nama ibu, dan WhatsApp ibu telah terisi di Bagian 1 & 2.');
      return;
    }

    setIsSubmitting(true);

    try {
      const recordId = generateRecordId('paid');
      const record: ScreeningRecord = {
        id: recordId,
        created_at: new Date().toISOString(),
        type: 'paid',
        status: 'Dalam Review',
        risk_level: 'BUTUH PERHATIAN KHUSUS',
        child_name: formData.namaLengkapAnak,
        mother_name: formData.namaIbu,
        father_name: formData.namaAyah || undefined,
        phone: formData.waIbu,
        secondary_phone: formData.waAyah || undefined,
        age_text: calculatedAge || formData.usiaTerkalkulasi || '-',
        gender: formData.jenisKelamin,
        last_weight: formData.bbSekarang || '-',
        last_height: formData.tbPB || '-',
        measurement_date: formData.tanggalUkur || undefined,
        summary: formData.ceritaKondisi
          ? formData.ceritaKondisi.slice(0, 160) + '...'
          : 'Asesmen Rekam Medis Lengkap (10 Bagian) diterima untuk evaluasi komprehensif tim ahli.',
        problem_areas: formData.keluhanUtama,
        clinical_notes: '',
        paid_data: {
          ...formData,
          usiaTerkalkulasi: calculatedAge,
        },
      };

      await saveScreeningRecord(record);
      setSubmittedRecordId(recordId);
      window.scrollTo({ top: 350, behavior: 'smooth' });
    } catch (err) {
      console.error(err);
      alert('Terjadi kendala saat menyimpan. Silakan coba kembali.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
      {/* JIKA SUDAH DISUBMIT: TAMPILKAN OUTPUT SESUAI PERMINTAAN */}
      {submittedRecordId ? (
        <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-10 border border-slate-200 shadow-xl text-center animate-fade-in max-w-xl mx-auto">
          <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4 sm:mb-6">
            <CheckCircle2 className="w-7 h-7 sm:w-10 sm:h-10" />
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Assessment berhasil dikirim! ✅
          </h2>

          <div className="mt-4 p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200 text-left text-xs sm:text-sm text-slate-700 leading-relaxed space-y-2.5">
            <p>
              Data makan anak Bunda sudah kami terima.
            </p>
            <p>
              Selanjutnya data akan direview oleh tim untuk melihat pola makan, variasi makanan, tekstur, perilaku makan, serta data asupan anak.
            </p>
            <p className="font-bold text-slate-900 pt-1">
              ⏳ Hasil screening akan dikirim setelah proses review selesai +-3-5 hari
            </p>
            <p className="text-rose-600 font-semibold">
              Mohon menunggu ya, Bunda. ❤️
            </p>
          </div>

          <div className="mt-6 flex flex-col sm:flex-row gap-2.5 justify-center">
            <a
              href={`https://wa.me/6285129992305?text=Halo%20Admin%20Tumbuh%20Kembang%20Anak,%20saya%20sudah%20mengirim%20Assessment%20Lengkap%20untuk%20anak%20saya%20${encodeURIComponent(
                formData.namaLengkapAnak
              )}.%20Mohon%20info%20tahap%20selanjutnya.`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs sm:text-sm transition-all shadow-md"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Konfirmasi ke Admin WhatsApp</span>
            </a>

            <button
              type="button"
              onClick={() => {
                setSubmittedRecordId(null);
                setCurrentStep(1);
              }}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-semibold text-xs sm:text-sm transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Kirim Asesmen Baru</span>
            </button>
          </div>
        </div>
      ) : (
        /* FORM ASESMEN BERBAYAR 10 BAGIAN */
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-8 border border-slate-200 shadow-xl space-y-6 sm:space-y-8"
        >
          {/* Header */}
          <div className="border-b border-slate-100 pb-6">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-950 text-[#ccff00] text-xs font-black uppercase tracking-wider">
                Assessment Mendalam &amp; Rekam Medis Pasien
              </span>
              <span className="text-xs font-semibold text-slate-500">
                Langkah {currentStep} dari {totalSteps}
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              FORM SCREENING LENGKAP MASALAH MAKAN
            </h2>
            <p className="mt-1 text-sm sm:text-base text-slate-600">
              Instrumen komprehensif untuk pemetaan pola makan, profil sensorik, tekstur oral-motor, dan food repertoire.
            </p>

            {/* Stepper Progress Bar */}
            <div className="mt-5 w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
              <div
                className="bg-linear-to-r from-slate-900 to-[#ccff00] h-full transition-all duration-300 rounded-full"
                style={{ width: `${(currentStep / totalSteps) * 100}%` }}
              />
            </div>

            {/* Step Quick Pills */}
            <div className="mt-3.5 flex gap-1.5 overflow-x-auto pb-1 scrollbar-none -mx-1 px-1">
              {[
                '1. Orang Tua',
                '2. Data Anak',
                '3. Riwayat Makan',
                '4. Repertoire',
                '5. Oral Motor',
                '6. Perilaku',
                '7. Sensorik',
                '8. Food Recall',
                '9. Riwayat BB',
                '10. Keluhan Utama',
              ].map((name, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setCurrentStep(idx + 1)}
                  className={`text-[10px] sm:text-[11px] font-bold px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg whitespace-nowrap transition-colors ${
                    currentStep === idx + 1
                      ? 'bg-slate-900 text-white shadow-xs'
                      : idx + 1 < currentStep
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-slate-100 text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {name}
                </button>
              ))}
            </div>
          </div>

          {/* ===================== STEP 1: DATA ORANG TUA ===================== */}
          {currentStep === 1 && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex items-center gap-2 border-l-4 border-slate-900 pl-3">
                <h3 className="text-lg font-bold text-slate-900">BAGIAN 1 — DATA ORANG TUA</h3>
              </div>
              <p className="text-xs text-slate-500">
                Informasi kontak orang tua untuk pengiriman hasil review dan tindak lanjut rekam medis.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Nama Ayah
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Dimas Pratama"
                    value={formData.namaAyah}
                    onChange={(e) => setFormData({ ...formData, namaAyah: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-slate-900 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    No. WhatsApp Ayah
                  </label>
                  <input
                    type="tel"
                    placeholder="Contoh: 081398765432"
                    value={formData.waAyah}
                    onChange={(e) => setFormData({ ...formData, waAyah: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-slate-900 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Nama Ibu <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Rina Wardhani"
                    value={formData.namaIbu}
                    onChange={(e) => setFormData({ ...formData, namaIbu: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-slate-900 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    No. WhatsApp Ibu <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="Contoh: 081234567890"
                    value={formData.waIbu}
                    onChange={(e) => setFormData({ ...formData, waIbu: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-slate-900 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Email (opsional)
                  </label>
                  <input
                    type="email"
                    placeholder="Contoh: rina.wardhani@gmail.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-slate-900 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Domisili Kota / Kabupaten (opsional)
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Cirebon / Indramayu / Majalengka"
                    value={formData.domisili}
                    onChange={(e) => setFormData({ ...formData, domisili: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-slate-900 text-sm"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ===================== STEP 2: DATA ANAK ===================== */}
          {currentStep === 2 && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex items-center gap-2 border-l-4 border-slate-900 pl-3">
                <h3 className="text-lg font-bold text-slate-900">BAGIAN 2 — DATA ANAK</h3>
              </div>
              <p className="text-xs text-slate-500">
                Tanggal lahir anak (DOB) sangat penting supaya usia dihitung secara tepat saat assessment.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Nama Lengkap Anak <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Arsya Bagas Pratama"
                    value={formData.namaLengkapAnak}
                    onChange={(e) => setFormData({ ...formData, namaLengkapAnak: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-slate-900 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Tanggal Lahir (DOB) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.dob}
                    onChange={(e) => handleDobChange(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-slate-900 text-sm"
                  />
                  {calculatedAge && (
                    <div className="mt-1 text-xs text-indigo-700 font-bold bg-indigo-50 px-2.5 py-1 rounded-md inline-block">
                      Usia Terhitung: {calculatedAge}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Jenis Kelamin
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {(['Laki-laki', 'Perempuan'] as Gender[]).map((gender) => (
                      <button
                        key={gender}
                        type="button"
                        onClick={() => setFormData({ ...formData, jenisKelamin: gender })}
                        className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all ${
                          formData.jenisKelamin === gender
                            ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                            : 'bg-white text-slate-700 border-slate-300'
                        }`}
                      >
                        {gender}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    BB Sekarang
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: 10.2 kg"
                    value={formData.bbSekarang}
                    onChange={(e) => setFormData({ ...formData, bbSekarang: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-slate-900 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    TB / PB Sekarang
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: 84 cm"
                    value={formData.tbPB}
                    onChange={(e) => setFormData({ ...formData, tbPB: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-slate-900 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Tanggal Pengukuran BB/TB
                  </label>
                  <input
                    type="date"
                    value={formData.tanggalUkur}
                    onChange={(e) => setFormData({ ...formData, tanggalUkur: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-slate-900 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    BB Lahir & Usia Gestasi Saat Lahir
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="BB Lahir (misal: 3.1 kg)"
                      value={formData.bbLahir}
                      onChange={(e) => setFormData({ ...formData, bbLahir: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                    />
                    <input
                      type="text"
                      placeholder="Gestasi (misal: 38 minggu)"
                      value={formData.usiaGestasi}
                      onChange={(e) => setFormData({ ...formData, usiaGestasi: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Riwayat Perawatan NICU
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Tidak ada / Ada (3 hari fototerapi)"
                    value={formData.riwayatNICU}
                    onChange={(e) => setFormData({ ...formData, riwayatNICU: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-slate-900 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Alergi / Intoleransi Makanan
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Alergi telur / susu sapi / tidak ada"
                    value={formData.alergiIntoleransi}
                    onChange={(e) => setFormData({ ...formData, alergiIntoleransi: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-slate-900 text-sm"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Riwayat Penyakit & Obat/Suplemen yang Sedang Dikonsumsi
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Batuk pilek berulang / konsumsi vitamin zat besi atau zink"
                    value={formData.obatSuplemen}
                    onChange={(e) => setFormData({ ...formData, obatSuplemen: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-slate-900 text-sm"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ===================== STEP 3: RIWAYAT MAKAN ===================== */}
          {currentStep === 3 && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex items-center gap-2 border-l-4 border-slate-900 pl-3">
                <h3 className="text-lg font-bold text-slate-900">BAGIAN 3 — RIWAYAT MAKAN</h3>
              </div>
              <p className="text-xs text-slate-500">
                Pola konsumsi susu harian dan kebiasaan aturan makan (feeding rules) di rumah.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Jenis Susu (ASI / Sufor / UHT / Kombinasi)
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Sufor merk X / ASI langsung"
                    value={formData.jenisSusu}
                    onChange={(e) => setFormData({ ...formData, jenisSusu: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-slate-900 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Jumlah Susu Per Hari
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: 600 ml / 4 botol sehari"
                    value={formData.jumlahSusuPerHari}
                    onChange={(e) => setFormData({ ...formData, jumlahSusuPerHari: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-slate-900 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Frekuensi Makan Utama & Snack
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Makan utama: 3x"
                      value={formData.frekuensiMakanUtama}
                      onChange={(e) => setFormData({ ...formData, frekuensiMakanUtama: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                    />
                    <input
                      type="text"
                      placeholder="Snack: 2x"
                      value={formData.frekuensiSnack}
                      onChange={(e) => setFormData({ ...formData, frekuensiSnack: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Durasi Setiap Sesi Makan
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: > 45 menit / sering berlarut"
                    value={formData.durasiMakan}
                    onChange={(e) => setFormData({ ...formData, durasiMakan: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-slate-900 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Lokasi Makan & Siapa yang Memberi Makan
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Depan TV / disuapi Nenek & Ibu"
                    value={formData.lokasiMakan}
                    onChange={(e) => setFormData({ ...formData, lokasiMakan: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-slate-900 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Jadwal Makan Harian
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Sarapan 08.00, Siang 12.30, Malam 19.00"
                    value={formData.jadwalMakanHarian}
                    onChange={(e) => setFormData({ ...formData, jadwalMakanHarian: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-slate-900 text-sm"
                  />
                </div>

                <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-xs font-bold text-slate-700 block mb-1">
                      Apakah makan sambil gadget?
                    </span>
                    <input
                      type="text"
                      placeholder="Ya / Kadang / Tidak"
                      value={formData.makanSambilGadget}
                      onChange={(e) => setFormData({ ...formData, makanSambilGadget: e.target.value })}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-medium"
                    />
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-xs font-bold text-slate-700 block mb-1">
                      Apakah makan sambil jalan-jalan?
                    </span>
                    <input
                      type="text"
                      placeholder="Ya / Kadang / Tidak"
                      value={formData.makanSambilJalan}
                      onChange={(e) => setFormData({ ...formData, makanSambilJalan: e.target.value })}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-medium"
                    />
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-xs font-bold text-slate-700 block mb-1">
                      Apakah sering dibujuk / dipaksa?
                    </span>
                    <input
                      type="text"
                      placeholder="Ya / Kadang / Tidak"
                      value={formData.seringDibujukDipaksa}
                      onChange={(e) => setFormData({ ...formData, seringDibujukDipaksa: e.target.value })}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-medium"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ===================== STEP 4: FOOD REPERTOIRE ===================== */}
          {currentStep === 4 && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex items-center gap-2 border-l-4 border-slate-900 pl-3">
                <h3 className="text-lg font-bold text-slate-900">BAGIAN 4 — FOOD REPERTOIRE</h3>
              </div>
              <p className="text-xs text-slate-500">
                Tuliskan ragam makanan yang diterima (MAU) vs ditolak (TIDAK MAU) untuk setiap kelompok:
              </p>

              <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-slate-100 text-slate-700 uppercase font-black tracking-wider text-[11px] border-b border-slate-200">
                    <tr>
                      <th className="p-3 w-1/4">Kelompok</th>
                      <th className="p-3 w-3/8 text-emerald-800">Makanan yang MAU</th>
                      <th className="p-3 w-3/8 text-rose-800">Makanan yang TIDAK MAU</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {formData.repertoire.map((row, idx) => (
                      <tr key={row.kategori} className="hover:bg-slate-50/60">
                        <td className="p-3 font-bold text-slate-900 bg-slate-50/50">
                          {row.kategori}
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            placeholder="Contoh jenis yg mau..."
                            value={row.makananMau}
                            onChange={(e) => handleRepertoireChange(idx, 'makananMau', e.target.value)}
                            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 focus:border-slate-900 text-xs"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            placeholder="Contoh jenis yg ditolak..."
                            value={row.makananTidakMau}
                            onChange={(e) =>
                              handleRepertoireChange(idx, 'makananTidakMau', e.target.value)
                            }
                            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 focus:border-slate-900 text-xs"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="pt-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Jumlah jenis makanan yang masih diterima anak:
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Sekitar 8-10 jenis saja"
                  value={formData.jumlahJenisDiterima}
                  onChange={(e) => setFormData({ ...formData, jumlahJenisDiterima: e.target.value })}
                  className="w-full sm:w-72 px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-slate-900 text-sm font-medium"
                />
              </div>
            </div>
          )}

          {/* ===================== STEP 5: TEKSTUR & ORAL MOTOR ===================== */}
          {currentStep === 5 && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex items-center gap-2 border-l-4 border-slate-900 pl-3">
                <h3 className="text-lg font-bold text-slate-900">BAGIAN 5 — TEKSTUR & ORAL MOTOR</h3>
              </div>
              <p className="text-xs text-slate-500">
                Evaluasi kemampuan mengunyah, refleks menelan, dan adaptasi tekstur:
              </p>

              {/* Tekstur yang bisa diterima */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Tekstur yang bisa diterima anak saat ini: (Pilih semua yang sesuai)
                </label>
                <div className="flex flex-wrap gap-2">
                  {TEXTURE_OPTIONS.map((tekstur) => {
                    const isSelected = formData.teksturDiterima.includes(tekstur);
                    return (
                      <button
                        key={tekstur}
                        type="button"
                        onClick={() => toggleArrayItem('teksturDiterima', tekstur)}
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all ${
                          isSelected
                            ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                            : 'bg-white text-slate-700 border-slate-300 hover:border-slate-400'
                        }`}
                      >
                        {isSelected ? '✓ ' : '+ '}
                        {tekstur}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3">
                {[
                  { field: 'bisaMengunyah', label: 'Apakah bisa mengunyah makanan?' },
                  { field: 'seringGagging', label: 'Apakah sering gagging (mual/mau muntah)?' },
                  { field: 'seringBatuk', label: 'Apakah sering batuk saat makan?' },
                  { field: 'pernahTersedak', label: 'Apakah pernah tersedak?' },
                  { field: 'melepehMakanan', label: 'Apakah sering melepeh makanan?' },
                  { field: 'lamaDiMulut', label: 'Apakah makanan lama berada di mulut (mengemut)?' },
                  { field: 'sulitNaikTekstur', label: 'Apakah sulit naik tekstur?' },
                  { field: 'hanyaMauTeksturTertentu', label: 'Apakah hanya mau tekstur tertentu?' },
                ].map((item) => (
                  <div key={item.field} className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-xs font-bold text-slate-800 block mb-1.5">
                      {item.label}
                    </span>
                    <input
                      type="text"
                      placeholder="Ya / Sering / Kadang / Tidak"
                      value={(formData as any)[item.field]}
                      onChange={(e) => setFormData({ ...formData, [item.field]: e.target.value })}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-medium"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ===================== STEP 6: PERILAKU SAAT MAKAN ===================== */}
          {currentStep === 6 && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex items-center gap-2 border-l-4 border-slate-900 pl-3">
                <h3 className="text-lg font-bold text-slate-900">BAGIAN 6 — PERILAKU SAAT MAKAN</h3>
              </div>
              <p className="text-xs text-slate-500">
                Pilih perilaku yang sering ditunjukkan anak saat sesi makan (Centang yang sesuai):
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {BEHAVIOR_OPTIONS.map((item) => {
                  const checked = formData.perilakuMakan.includes(item);
                  return (
                    <label
                      key={item}
                      onClick={() => toggleArrayItem('perilakuMakan', item)}
                      className={`flex items-center gap-3 p-3 rounded-xl border text-xs sm:text-sm font-semibold cursor-pointer transition-all ${
                        checked
                          ? 'bg-rose-50/70 border-rose-300 text-rose-950 font-bold'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => {}}
                        className="w-4 h-4 rounded text-slate-900 focus:ring-0"
                      />
                      <span>{item}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {/* ===================== STEP 7: SENSORIK ===================== */}
          {currentStep === 7 && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex items-center gap-2 border-l-4 border-slate-900 pl-3">
                <h3 className="text-lg font-bold text-slate-900">BAGIAN 7 — SENSORIK</h3>
              </div>
              <p className="text-xs text-slate-500">
                Anak biasanya menolak makanan karena faktor apa saja? (Bisa pilih lebih dari satu):
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {SENSORY_OPTIONS.map((item) => {
                  const checked = formData.alasanSensorik.includes(item);
                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => toggleArrayItem('alasanSensorik', item)}
                      className={`p-3 rounded-xl border text-xs sm:text-sm font-bold text-left transition-all flex items-center justify-between ${
                        checked
                          ? 'bg-[#ccff00]/40 border-slate-900 text-slate-950'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span>{item}</span>
                      <span className="text-xs font-black">{checked ? '✓' : '+'}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ===================== STEP 8: 24-HOUR FOOD RECALL ===================== */}
          {currentStep === 8 && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex items-center gap-2 border-l-4 border-slate-900 pl-3">
                <h3 className="text-lg font-bold text-slate-900">BAGIAN 8 — 24-HOUR FOOD RECALL</h3>
              </div>
              <p className="text-xs text-slate-500">
                Catatan riwayat asupan makan & minum si kecil kemarin (dari bangun tidur sampai tidur kembali):
              </p>

              <div className="space-y-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Bangun Tidur (ASI / Susu):
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Sufor 150 ml (jam 06.30)"
                    value={formData.foodRecall.bangunSusu}
                    onChange={(e) => handleFoodRecallChange('bangunSusu', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
                  />
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Sarapan (Menu):
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: Nasi uduk + telur ceplok"
                      value={formData.foodRecall.sarapanMenu}
                      onChange={(e) => handleFoodRecallChange('sarapanMenu', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Sarapan (Jumlah / Porsi):
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: Hanya 3 suap"
                      value={formData.foodRecall.sarapanPorsi}
                      onChange={(e) => handleFoodRecallChange('sarapanPorsi', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
                    />
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Snack Pagi (Menu):
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: Biskuit marie + susu"
                      value={formData.foodRecall.snackPagiMenu}
                      onChange={(e) => handleFoodRecallChange('snackPagiMenu', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Snack Pagi (Porsi):
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: 2 keping"
                      value={formData.foodRecall.snackPagiPorsi}
                      onChange={(e) => handleFoodRecallChange('snackPagiPorsi', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
                    />
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Makan Siang (Menu):
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: Nasi sop ayam"
                      value={formData.foodRecall.makanSiangMenu}
                      onChange={(e) => handleFoodRecallChange('makanSiangMenu', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Makan Siang (Porsi):
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: Setengah mangkuk"
                      value={formData.foodRecall.makanSiangPorsi}
                      onChange={(e) => handleFoodRecallChange('makanSiangPorsi', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
                    />
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Snack Sore (Menu):
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: Pisang / wafer"
                      value={formData.foodRecall.snackSoreMenu}
                      onChange={(e) => handleFoodRecallChange('snackSoreMenu', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Snack Sore (Porsi):
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: 1 buah"
                      value={formData.foodRecall.snackSorePorsi}
                      onChange={(e) => handleFoodRecallChange('snackSorePorsi', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
                    />
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Makan Malam (Menu):
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: Nasi kecap + sosis"
                      value={formData.foodRecall.makanMalamMenu}
                      onChange={(e) => handleFoodRecallChange('makanMalamMenu', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Makan Malam (Porsi):
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: 4-5 suap"
                      value={formData.foodRecall.makanMalamPorsi}
                      onChange={(e) => handleFoodRecallChange('makanMalamPorsi', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
                    />
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Susu / ASI Sebelum Tidur:
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Sufor 180 ml (jam 21.00)"
                    value={formData.foodRecall.susuSebelumTidur}
                    onChange={(e) => handleFoodRecallChange('susuSebelumTidur', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ===================== STEP 9: RIWAYAT BERAT BADAN ===================== */}
          {currentStep === 9 && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex items-center gap-2 border-l-4 border-slate-900 pl-3">
                <h3 className="text-lg font-bold text-slate-900">BAGIAN 9 — RIWAYAT BERAT BADAN</h3>
              </div>
              <p className="text-xs text-slate-500">
                Penting untuk memantau kurva pertumbuhan dan mendeteksi kenaikan berat badan yang tidak adekuat:
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    BB 3 Bulan Lalu
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: 10.2 kg"
                    value={formData.riwayatBB.bb3BulanLalu}
                    onChange={(e) => handleRiwayatBBChange('bb3BulanLalu', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    BB 2 Bulan Lalu
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: 10.2 kg"
                    value={formData.riwayatBB.bb2BulanLalu}
                    onChange={(e) => handleRiwayatBBChange('bb2BulanLalu', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    BB 1 Bulan Lalu
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: 10.3 kg"
                    value={formData.riwayatBB.bb1BulanLalu}
                    onChange={(e) => handleRiwayatBBChange('bb1BulanLalu', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    BB Sekarang
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: 10.2 kg"
                    value={formData.riwayatBB.bbSekarang}
                    onChange={(e) => handleRiwayatBBChange('bbSekarang', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-xs font-bold text-slate-700 block mb-1">
                    Apakah BB stagnan?
                  </span>
                  <input
                    type="text"
                    placeholder="Ya / Tidak"
                    value={formData.riwayatBB.bbStagnan}
                    onChange={(e) => handleRiwayatBBChange('bbStagnan', e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-medium"
                  />
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-xs font-bold text-slate-700 block mb-1">
                    Pernah mengalami penurunan BB?
                  </span>
                  <input
                    type="text"
                    placeholder="Ya (saat sakit) / Tidak"
                    value={formData.riwayatBB.pernahTurunBB}
                    onChange={(e) => handleRiwayatBBChange('pernahTurunBB', e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-medium"
                  />
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-xs font-bold text-slate-700 block mb-1">
                    Target Kenaikan BB (jika ada):
                  </span>
                  <input
                    type="text"
                    placeholder="Contoh: 11.5 kg"
                    value={formData.riwayatBB.targetBB}
                    onChange={(e) => handleRiwayatBBChange('targetBB', e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-medium"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ===================== STEP 10: KELUHAN UTAMA ORANG TUA ===================== */}
          {currentStep === 10 && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex items-center gap-2 border-l-4 border-slate-900 pl-3">
                <h3 className="text-lg font-bold text-slate-900">
                  BAGIAN 10 — KELUHAN UTAMA ORANG TUA
                </h3>
              </div>
              <p className="text-xs text-slate-500">
                Penting untuk mengetahui apa yang paling membuat orang tua khawatir saat ini:
              </p>

              <div>
                <label className="block text-sm font-bold text-slate-900 mb-2">
                  &quot;Apa masalah makan anak yang paling ingin Bunda/Ayah bantu?&quot; (Bisa pilih beberapa):
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {MAIN_COMPLAINT_OPTIONS.map((item) => {
                    const checked = formData.keluhanUtama.includes(item);
                    return (
                      <button
                        key={item}
                        type="button"
                        onClick={() => toggleArrayItem('keluhanUtama', item)}
                        className={`p-3 rounded-xl border text-xs sm:text-sm font-bold text-left transition-all flex items-center justify-between ${
                          checked
                            ? 'bg-slate-900 text-white border-slate-900'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <span>{item}</span>
                        <span className="text-xs font-bold">{checked ? '✓' : '+'}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Keluhan Lainnya (jika ada):
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Sering muntah kalau lihat sayur"
                  value={formData.keluhanLainnya}
                  onChange={(e) => setFormData({ ...formData, keluhanLainnya: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-slate-900 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Ceritakan dengan singkat kondisi makan anak saat ini: <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Ceritakan drama jam makan, sejak kapan masalah makan berlangsung, apa yang sudah dicoba orang tua, serta kekhawatiran terbesar Bunda..."
                  value={formData.ceritaKondisi}
                  onChange={(e) => setFormData({ ...formData, ceritaKondisi: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-slate-900 text-sm leading-relaxed"
                />
              </div>
            </div>
          )}

          {/* Stepper Navigation Buttons */}
          <div className="pt-5 border-t border-slate-200 flex items-center justify-between gap-2">
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={() => setCurrentStep((prev) => prev - 1)}
                className="inline-flex items-center gap-1 px-3.5 sm:px-5 py-2.5 sm:py-3 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs sm:text-sm font-bold transition-all"
              >
                <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>Sebelumnya</span>
              </button>
            ) : (
              <div />
            )}

            {currentStep < totalSteps ? (
              <button
                type="button"
                onClick={() => setCurrentStep((prev) => prev + 1)}
                className="inline-flex items-center gap-1 px-4 sm:px-6 py-2.5 sm:py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs sm:text-sm font-bold transition-all shadow-xs"
              >
                <span>Lanjut ({currentStep + 1}/{totalSteps})</span>
                <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center gap-1.5 px-4 sm:px-8 py-2.5 sm:py-3.5 bg-[#ccff00] hover:bg-[#b8e600] text-slate-950 font-black text-xs sm:text-base rounded-xl transition-all shadow-md active:scale-98 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span>Mengirimkan...</span>
                ) : (
                  <>
                    <FileCheck2 className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span>Kirim & Selesaikan</span>
                  </>
                )}
              </button>
            )}
          </div>
        </form>
      )}
    </div>
  );
}
