'use client';

import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import {
  FreeScreeningData,
  Gender,
  YesNoSometimes,
  ScreeningRecord,
} from '@/types/screening';
import {
  evaluateFreeScreening,
  generateRecordId,
  saveScreeningRecord,
  ClinicalScreeningResult,
} from '@/lib/storage';
import { calculateAgeFromDob } from '@/lib/anthropometry';
import { motion, AnimatePresence } from 'motion/react';
import {
  CheckCircle2,
  Clock,
  ArrowRight,
  ArrowLeft,
  MessageCircle,
  Video,
  Users,
  RotateCcw,
  BookOpen,
  Calendar,
  Scale,
  Sparkles,
  AlertTriangle,
  HeartPulse,
  ZoomIn,
  X,
} from 'lucide-react';

export function FreeScreeningForm() {
  // Form State
  const [formData, setFormData] = useState<FreeScreeningData>({
    namaAnak: '',
    namaIbu: '',
    noHp: '',
    tanggalLahir: '',
    usiaAnak: '',
    jenisKelamin: 'Laki-laki',
    bbTerakhir: '',
    tbTerakhir: '',
    tanggalPengukuran: '',
    usiaPengukuran: '',

    jadwalMakanUtama: '3x Teratur (Pagi, Siang, Malam)',
    jadwalSnack: '2x Terjadwal (10.00 & 16.00)',
    susuHarian: 'Susu 2-3 gelas (400-500 ml/hari)',
    makanSambilGadget: 'Kadang',
    seringDipaksaBujuk: 'Kadang',
    digantiSusuSnack: 'Kadang',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [redirectingToWa, setRedirectingToWa] = useState(false);
  const [waRedirectUrl, setWaRedirectUrl] = useState<string | null>(null);
  const [zoomedTesti, setZoomedTesti] = useState<string | null>(null);

  // 7 Gambar Bukti Testimoni Konsultasi Pendampingan Dokter
  const TESTIMONIAL_IMAGES = useMemo(
    () => [
      {
        id: 1,
        url: 'https://files.catbox.moe/9pi9yk.jpg',
        title: 'Testimoni Pendampingan Masalah Makan #1',
      },
      {
        id: 2,
        url: 'https://files.catbox.moe/2bwkd6.jpg',
        title: 'Testimoni Pendampingan Masalah Makan #2',
      },
      {
        id: 3,
        url: 'https://files.catbox.moe/knob5q.jpg',
        title: 'Testimoni Pendampingan Masalah Makan #3',
      },
      {
        id: 4,
        url: 'https://files.catbox.moe/cp3pjp.jpg',
        title: 'Testimoni Pendampingan Masalah Makan #4',
      },
      {
        id: 5,
        url: 'https://files.catbox.moe/l698g6.jpg',
        title: 'Testimoni Pendampingan Masalah Makan #5',
      },
      {
        id: 6,
        url: 'https://files.catbox.moe/vwo8u5.jpg',
        title: 'Testimoni Pendampingan Masalah Makan #6',
      },
      {
        id: 7,
        url: 'https://files.catbox.moe/cgbpvn.jpg',
        title: 'Testimoni Pendampingan Masalah Makan #7',
      },
    ],
    []
  );

  // Wizard steps state
  const TOTAL_STEPS = 5;
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [stepError, setStepError] = useState<string | null>(null);

  // Auto kalkulasi usia dari Tanggal Lahir (DOB)
  const calculatedAge = useMemo(() => {
    return calculateAgeFromDob(formData.tanggalLahir || '');
  }, [formData.tanggalLahir]);

  const handleChange = (field: keyof FreeScreeningData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (stepError) setStepError(null);
  };

  const scrollToFormTop = () => {
    const el = document.getElementById('free-screening-form-anchor');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      window.scrollTo({ top: 220, behavior: 'smooth' });
    }
  };

  // Navigasi langkah demi langkah (1 -> 2 -> 3 -> 4 -> 5)
  const handleNextStep = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();

    if (currentStep === 1) {
      if (!formData.namaAnak.trim()) {
        setStepError('Mohon isi Nama Anak terlebih dahulu.');
        scrollToFormTop();
        return;
      }
      if (!formData.namaIbu.trim()) {
        setStepError('Mohon isi Nama Ibu terlebih dahulu.');
        scrollToFormTop();
        return;
      }
      setStepError(null);
      setCurrentStep(2);
      scrollToFormTop();
      return;
    }

    if (currentStep === 2) {
      if (!formData.noHp.trim()) {
        setStepError('Mohon isi No. WhatsApp / HP bunda terlebih dahulu.');
        scrollToFormTop();
        return;
      }
      if (formData.noHp.trim().length < 8) {
        setStepError('Nomor WhatsApp terlalu pendek. Mohon periksa kembali.');
        scrollToFormTop();
        return;
      }
      setStepError(null);
      setCurrentStep(3);
      scrollToFormTop();
      return;
    }

    if (currentStep === 3) {
      if (!formData.tanggalLahir) {
        setStepError('Mohon tentukan Tanggal Lahir Anak (DOB) agar sistem dapat menghitung usia & kurva tumbuh kembang.');
        scrollToFormTop();
        return;
      }
      setStepError(null);
      setCurrentStep(4);
      scrollToFormTop();
      return;
    }

    if (currentStep === 4) {
      setStepError(null);
      setCurrentStep(5);
      scrollToFormTop();
      return;
    }
  };

  const handlePrevStep = () => {
    setStepError(null);
    setCurrentStep((prev) => Math.max(1, prev - 1));
    scrollToFormTop();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.namaAnak.trim() || !formData.namaIbu.trim()) {
      setCurrentStep(1);
      setStepError('Mohon lengkapi Nama Anak dan Nama Ibu terlebih dahulu.');
      scrollToFormTop();
      return;
    }

    if (!formData.noHp.trim()) {
      setCurrentStep(2);
      setStepError('Mohon lengkapi No. WhatsApp.');
      scrollToFormTop();
      return;
    }

    if (!formData.tanggalLahir) {
      setCurrentStep(3);
      setStepError('Mohon pilih Tanggal Lahir anak agar usia dan kurva antropometri dapat dievaluasi.');
      scrollToFormTop();
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Evaluasi Klinis Sesuai Acuan IDAI & WHO Antropometri
      const dataWithAge = {
        ...formData,
        usiaAnak: calculatedAge.formatted,
      };

      const evaluation = evaluateFreeScreening(dataWithAge);
      const recordId = generateRecordId('free');

      const record: ScreeningRecord = {
        id: recordId,
        created_at: new Date().toISOString(),
        type: 'free',
        status: 'Baru',
        risk_level: evaluation.risk_level,
        child_name: formData.namaAnak,
        mother_name: formData.namaIbu,
        phone: formData.noHp,
        age_text: calculatedAge.formatted || '-',
        gender: formData.jenisKelamin,
        last_weight: formData.bbTerakhir || '-',
        last_height: formData.tbTerakhir || '-',
        measurement_date: formData.tanggalPengukuran || formData.usiaPengukuran || undefined,
        summary: evaluation.summary,
        problem_areas: evaluation.problem_areas,
        clinical_notes: `Kategori: ${evaluation.clinical_category}. Status BB: ${evaluation.anthropometry?.weightCategory || '-'}. Aturan makan: ${evaluation.feeding_rule_violations.join(', ') || 'Normal'}`,
        free_data: dataWithAge,
      };

      // 2. Simpan ke Database (Supabase + Local Cache)
      await saveScreeningRecord(record);

      // 3. Format pesan WhatsApp lengkap dan komprehensif
      const statusLabel =
        evaluation.risk_level === 'BUTUH PERHATIAN KHUSUS'
          ? 'WAJIB KONSUL DOKTER 🔴 (Kondisi Parah / Ditemukan Red Flags)'
          : evaluation.risk_level === 'PERLU DIPERHATIKAN'
          ? 'DISARANKAN KONSUL DOKTER 🟡 (Peringatan Hati-Hati / Inappropriate Feeding)'
          : 'NORMAL 🟢 (Pola Makan Sesuai Tahapan Usia)';

      const antropometriText = evaluation.anthropometry
        ? `• Berat Badan (BB/U): ${evaluation.anthropometry.weightCategory} (Input: ${formData.bbTerakhir || '-'})\n• Tinggi Badan (TB/U): ${evaluation.anthropometry.heightCategory} (Input: ${formData.tbTerakhir || '-'})${
            evaluation.anthropometry.bmiOrStatureNotes.length > 0
              ? `\n• Catatan: ${evaluation.anthropometry.bmiOrStatureNotes.join('; ')}`
              : ''
          }`
        : `• BB Terakhir: ${formData.bbTerakhir || '-'}\n• TB Terakhir: ${formData.tbTerakhir || '-'}`;

      const temuanPolaMakan =
        evaluation.problem_areas.length > 0
          ? evaluation.problem_areas.map((p) => `• ${p}`).join('\n')
          : '• Pola makan dan feeding rules dalam batas wajar';

      const rekomendasiPraktik =
        evaluation.idai_guidance.length > 0
          ? evaluation.idai_guidance.map((g) => `• ${g}`).join('\n')
          : '• Lanjutkan jadwal makan teratur dan pantau pertumbuhan berkala';

      const pesanWhatsApp = `*HASIL SKRINING RESMI MASALAH MAKAN ANAK*
_Acuan Ikatan Dokter Anak Indonesia (IDAI) & WHO_
No. Rekam: ${recordId}

*DATA PASIEN & ORANG TUA:*
• Nama Anak: ${formData.namaAnak}
• Nama Bunda: ${formData.namaIbu}
• No. WhatsApp: ${formData.noHp}
• Usia Terhitung: ${calculatedAge.formatted || '-'}
• Tanggal Lahir: ${formData.tanggalLahir || '-'}
• Jenis Kelamin: ${formData.jenisKelamin}

━━━━━━━━━━━━━━━━━━━━━
*1. STATUS SKRINING:*
👉 *${statusLabel}*

*2. KATEGORI TINJAUAN KLINIS IDAI:*
${evaluation.clinical_category}

*3. EVALUASI PERTUMBUHAN (WHO & KEMENKES RI):*
${antropometriText}

*4. TEMUAN POLA & VARIASI MAKAN BERDASARKAN INPUT:*
• Jadwal Makan Utama: ${formData.jadwalMakanUtama}
• Jadwal Snack / Camilan: ${formData.jadwalSnack}
• Asupan Susu / ASI Harian: ${formData.susuHarian}
• Makan Sambil Gadget/TV: ${formData.makanSambilGadget}
• Sering Dipaksa / Dibujuk: ${formData.seringDipaksaBujuk}
• Makanan Diganti Susu/Snack: ${formData.digantiSusuSnack}
*Detail Temuan Evaluasi:*
${temuanPolaMakan}

*5. REKOMENDASI PRAKTIK PEMBERIAN MAKAN (FEEDING RULES):*
${rekomendasiPraktik}

*6. KESIMPULAN KLINIS:*
${evaluation.summary}
━━━━━━━━━━━━━━━━━━━━━

Halo Admin & Tim Dokter Tumbuh Kembang Anak, saya baru saja selesai mengisi formulir skrining mandiri untuk ananda *${formData.namaAnak}*. Mohon dibantu telaah hasil skrining ini dan berikan arahan konsultasi selanjutnya. Terima kasih.`;

      const targetUrl = `https://wa.me/6285129992305?text=${encodeURIComponent(pesanWhatsApp)}`;

      setWaRedirectUrl(targetUrl);
      setRedirectingToWa(true);

      // Otomatis arahkan user ke WhatsApp Admin CS
      if (typeof window !== 'undefined') {
        window.location.href = targetUrl;
      }
    } catch (err) {
      console.error(err);
      alert('Terjadi kesalahan saat memproses screening. Silakan coba kembali.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setRedirectingToWa(false);
    setWaRedirectUrl(null);
    setCurrentStep(1);
    setStepError(null);
    window.scrollTo({ top: 150, behavior: 'smooth' });
  };

  return (
    <div className="max-w-3xl mx-auto px-3 sm:px-6 py-4 sm:py-8">
      {/* ================= LAYAR PENGALIHAN OTOMATIS KE WHATSAPP CS ADMIN ================= */}
      {redirectingToWa ? (
        <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-8 border border-emerald-300 shadow-xl space-y-6 text-center animate-fade-in">
          <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center animate-pulse">
            <MessageCircle className="w-8 h-8 sm:w-10 sm:h-10" />
          </div>

          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-black uppercase tracking-wider border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              Mengalihkan Langsung ke WhatsApp Admin...
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              HASIL SKRINING ANANDA SEDANG DIKIRIM KE WHATSAPP ADMIN
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 max-w-lg mx-auto leading-relaxed">
              Sesuai prosedur, hasil lengkap evaluasi klinis IDAI, kurva pertumbuhan, dan rekomendasi makan ananda <strong className="text-slate-900">{formData.namaAnak}</strong> langsung diteruskan ke WhatsApp CS Admin untuk ditelaah oleh tim dokter.
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-left max-w-md mx-auto space-y-2 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Pasien:</span>
              <strong className="text-slate-900">{formData.namaAnak} ({calculatedAge.formatted || '-'})</strong>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Bunda:</span>
              <strong className="text-slate-900">{formData.namaIbu}</strong>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>WhatsApp Bunda:</span>
              <strong className="text-slate-900">{formData.noHp}</strong>
            </div>
            <div className="flex justify-between text-slate-600 border-t border-slate-200 pt-2">
              <span>Status Pengalihan:</span>
              <strong className="text-emerald-700">Membuka WhatsApp CS...</strong>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            {waRedirectUrl && (
              <a
                href={waRedirectUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm rounded-xl transition-all shadow-lg active:scale-98 cursor-pointer"
              >
                <MessageCircle className="w-5 h-5" />
                <span>Buka WhatsApp Sekarang (Kirim Hasil ke Admin)</span>
              </a>
            )}

            <div>
              <button
                type="button"
                onClick={handleReset}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors pt-2"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Isi Ulang Form Screening</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* ================= FORM INPUT SCREENING GRATIS (MULTI-STEP WIZARD) ================= */
        <div id="free-screening-form-anchor" className="scroll-mt-6">
          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-8 border border-slate-200 shadow-md space-y-6 sm:space-y-8"
          >
            {/* Header Form */}
            <div className="border-b border-slate-100 pb-3 sm:pb-4">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5 sm:mb-2">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] sm:text-[11px] font-semibold">
                  <Clock className="w-3 h-3 text-blue-600" />
                  <span>Estimasi: 1–2 Menit</span>
                </div>
                <div className="text-[10px] sm:text-[11px] font-bold text-slate-500">
                  {currentStep === 1 && 'Langkah 1/5: Nama Anak & Bunda'}
                  {currentStep === 2 && 'Langkah 2/5: Kontak WhatsApp'}
                  {currentStep === 3 && 'Langkah 3/5: Tgl Lahir & Gender'}
                  {currentStep === 4 && 'Langkah 4/5: BB & TB Anak'}
                  {currentStep === 5 && 'Langkah 5/5: Pola Makan & Jadwal'}
                </div>
              </div>
              <h2 className="text-base sm:text-2xl font-black text-slate-900 tracking-tight leading-snug">
                SCREENING SINGKAT MASALAH MAKAN ANAK
              </h2>
              <p className="mt-1 text-[11px] sm:text-sm text-slate-600 leading-relaxed">
                Penapisan bertahap satu per satu pola makan dan warning sign anak usia 0–5 tahun sesuai acuan Ikatan Dokter Anak Indonesia (IDAI) &amp; WHO.
              </p>
            </div>

            {/* Stepper Progress Bar & Indicator */}
            <div className="bg-slate-50 border border-slate-200/90 rounded-xl sm:rounded-2xl p-2.5 sm:p-4">
              <div className="flex items-center justify-between text-[11px] sm:text-xs font-bold text-slate-700 mb-1.5 sm:mb-2">
                <span className="flex items-center gap-1.5 sm:gap-2">
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-slate-900 text-[#ccff00] text-[10px] sm:text-[11px] font-black">
                    {currentStep}
                  </span>
                  <span>
                    Langkah {currentStep} dari {TOTAL_STEPS}:{' '}
                    {currentStep === 1 && 'Nama Anak & Bunda'}
                    {currentStep === 2 && 'WhatsApp'}
                    {currentStep === 3 && 'Tanggal Lahir & Gender'}
                    {currentStep === 4 && 'Pertumbuhan BB/TB'}
                    {currentStep === 5 && 'B. Pola Makan'}
                  </span>
                </span>
                <span className="text-[10px] sm:text-[11px] font-semibold text-slate-500">
                  {Math.round((currentStep / TOTAL_STEPS) * 100)}% Selesai
                </span>
              </div>

              {/* Progress Line */}
              <div className="w-full h-1.5 sm:h-2 bg-slate-200 rounded-full overflow-hidden mb-2 sm:mb-3">
                <div
                  className="h-full bg-slate-900 transition-all duration-300 ease-out rounded-full"
                  style={{ width: `${(currentStep / TOTAL_STEPS) * 100}%` }}
                />
              </div>

              {/* Step Navigation Pills */}
              <div className="grid grid-cols-5 gap-1 sm:gap-1.5">
                {[
                  { step: 1, label: 'Nama' },
                  { step: 2, label: 'WhatsApp' },
                  { step: 3, label: 'Lahir' },
                  { step: 4, label: 'BB/TB' },
                  { step: 5, label: 'Pola Makan' },
                ].map((item) => (
                  <button
                    key={item.step}
                    type="button"
                    onClick={() => {
                      if (item.step < currentStep) {
                        setStepError(null);
                        setCurrentStep(item.step);
                        scrollToFormTop();
                      }
                    }}
                    disabled={item.step > currentStep}
                    className={`py-1.5 px-1 rounded-lg text-center transition-all ${
                      item.step === currentStep
                        ? 'bg-slate-900 text-[#ccff00] font-bold shadow-xs'
                        : item.step < currentStep
                        ? 'bg-emerald-100 text-emerald-800 font-semibold cursor-pointer hover:bg-emerald-200'
                        : 'bg-white/60 text-slate-400 font-medium cursor-not-allowed'
                    }`}
                  >
                    <div className="text-[9px] sm:text-[10px] truncate">
                      {item.step < currentStep ? '✓ ' : ''}{item.label}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Error Notification if required fields missing */}
            {stepError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-bold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{stepError}</span>
              </div>
            )}

            {/* ================= LANGKAH 1: NAMA ANAK & NAMA IBU ================= */}
            {currentStep === 1 && (
              <div className="space-y-4 animate-fade-in">
                <div className="border-l-3 border-[#ccff00] pl-2.5">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Langkah 1 dari 5</span>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900">
                    Nama Anak &amp; Nama Bunda
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Silakan isi nama ananda dan bunda untuk data awal skrining:
                  </p>
                </div>

                <div className="space-y-3 pt-1">
                  <div>
                    <label className="block text-[10px] sm:text-[11px] font-bold text-slate-700 uppercase mb-1">
                      Nama Anak <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Arsya Bagas"
                      value={formData.namaAnak}
                      onChange={(e) => handleChange('namaAnak', e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-300 focus:border-slate-900 text-xs sm:text-sm font-medium"
                      autoFocus
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] sm:text-[11px] font-bold text-slate-700 uppercase mb-1">
                      Nama Ibu / Bunda <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Bunda Rina"
                      value={formData.namaIbu}
                      onChange={(e) => handleChange('namaIbu', e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-300 focus:border-slate-900 text-xs sm:text-sm font-medium"
                    />
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-200 flex justify-end">
                  <button
                    type="button"
                    onClick={handleNextStep}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 bg-slate-900 hover:bg-slate-800 text-[#ccff00] font-black text-xs sm:text-sm rounded-xl transition-all shadow-md active:scale-98 cursor-pointer"
                  >
                    <span>Lanjut (Isi No. WhatsApp)</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* ================= LANGKAH 2: NOMOR WHATSAPP ================= */}
            {currentStep === 2 && (
              <div className="space-y-4 animate-fade-in">
                <div className="border-l-3 border-[#ccff00] pl-2.5">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Langkah 2 dari 5</span>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900">
                    Nomor WhatsApp Bunda
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Untuk konfirmasi dan hasil evaluasi skrining ananda {formData.namaAnak}:
                  </p>
                </div>

                <div className="space-y-3 pt-1">
                  <div>
                    <label className="block text-[10px] sm:text-[11px] font-bold text-slate-700 uppercase mb-1">
                      No. HP / WhatsApp <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="Contoh: 081234567890"
                      value={formData.noHp}
                      onChange={(e) => handleChange('noHp', e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-300 focus:border-slate-900 text-xs sm:text-sm font-medium"
                      autoFocus
                    />
                    <p className="mt-1 text-[10px] text-slate-500">
                      🔒 Privasi terjaga, nomor hanya digunakan untuk keperluan konsultasi dan skrining makan.
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
                  <button
                    type="button"
                    onClick={handlePrevStep}
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Kembali (Nama)</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleNextStep}
                    className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-slate-900 hover:bg-slate-800 text-[#ccff00] font-black text-xs sm:text-sm rounded-xl transition-all shadow-md active:scale-98 cursor-pointer"
                  >
                    <span>Lanjut (Tanggal Lahir &amp; Kelamin)</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* ================= LANGKAH 3: TANGGAL LAHIR & JENIS KELAMIN ================= */}
            {currentStep === 3 && (
              <div className="space-y-4 animate-fade-in">
                <div className="border-l-3 border-[#ccff00] pl-2.5">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Langkah 3 dari 5</span>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900">
                    Tanggal Lahir &amp; Jenis Kelamin Anak
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Sistem akan otomatis menghitung usia dan kurva antropometri tumbuh kembang:
                  </p>
                </div>

                <div className="space-y-3 pt-1">
                  <div>
                    <label className="block text-[10px] sm:text-[11px] font-bold text-slate-700 uppercase mb-1">
                      Tanggal Lahir Anak (DOB) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.tanggalLahir}
                      onChange={(e) => handleChange('tanggalLahir', e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-300 focus:border-slate-900 text-xs sm:text-sm font-medium"
                      autoFocus
                    />
                    {calculatedAge.formatted !== '-' && (
                      <div className="mt-1.5 text-[10px] sm:text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg inline-flex items-center gap-1.5 border border-indigo-100">
                        <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Usia Saat Ini: {calculatedAge.formatted}</span>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-[10px] sm:text-[11px] font-bold text-slate-700 uppercase mb-1">
                      Jenis Kelamin <span className="text-rose-500">*</span>
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {(['Laki-laki', 'Perempuan'] as Gender[]).map((gender) => (
                        <button
                          key={gender}
                          type="button"
                          onClick={() => handleChange('jenisKelamin', gender)}
                          className={`py-2.5 px-3 text-xs font-bold rounded-xl border text-center transition-all cursor-pointer ${
                            formData.jenisKelamin === gender
                              ? 'bg-slate-900 text-[#ccff00] border-slate-900 shadow-2xs'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          {gender}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
                  <button
                    type="button"
                    onClick={handlePrevStep}
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Kembali (No. WhatsApp)</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleNextStep}
                    className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-slate-900 hover:bg-slate-800 text-[#ccff00] font-black text-xs sm:text-sm rounded-xl transition-all shadow-md active:scale-98 cursor-pointer"
                  >
                    <span>Lanjut (BB &amp; TB Anak)</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* ================= LANGKAH 4: BB & TB TERAKHIR (OPSIONAL) ================= */}
            {currentStep === 4 && (
              <div className="space-y-4 animate-fade-in">
                <div className="border-l-3 border-[#ccff00] pl-2.5">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Langkah 4 dari 5</span>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900">
                    Berat &amp; Tinggi Badan Terakhir (Opsional)
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Data antropometri membantu tim dokter memeriksa kurva gizi ananda {formData.namaAnak}:
                  </p>
                </div>

                <div className="space-y-3 pt-1">
                  <div>
                    <label className="block text-[10px] sm:text-[11px] font-bold text-slate-700 uppercase mb-1">
                      BB &amp; TB Terakhir (Opsional)
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="BB (misal: 10.2 kg)"
                        value={formData.bbTerakhir}
                        onChange={(e) => handleChange('bbTerakhir', e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm font-medium"
                      />
                      <input
                        type="text"
                        placeholder="TB (misal: 82 cm)"
                        value={formData.tbTerakhir}
                        onChange={(e) => handleChange('tbTerakhir', e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm font-medium"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] sm:text-[11px] font-bold text-slate-700 uppercase mb-1">
                      Waktu Pengukuran BB/TB Terakhir (Opsional)
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: Posyandu bulan lalu / 15 Sept 2026"
                      value={formData.usiaPengukuran}
                      onChange={(e) => {
                        handleChange('usiaPengukuran', e.target.value);
                        handleChange('tanggalPengukuran', e.target.value);
                      }}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm font-medium"
                    />
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
                  <button
                    type="button"
                    onClick={handlePrevStep}
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Kembali (Tgl Lahir)</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleNextStep}
                    className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-slate-900 hover:bg-slate-800 text-[#ccff00] font-black text-xs sm:text-sm rounded-xl transition-all shadow-md active:scale-98 cursor-pointer"
                  >
                    <span>Lanjut ke B. Pola Makan</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* ================= LANGKAH 5: POLA PEMBERIAN MAKAN & JADWAL (FEEDING RULES) ================= */}
            {currentStep === 5 && (
              <div className="space-y-5 animate-fade-in">
                {/* Ringkasan Data Pasien Dari Step 1 */}
                <div className="bg-slate-900 text-white rounded-xl sm:rounded-2xl p-3 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 sm:gap-3 shadow-xs">
                  <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                    <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-white/10 flex items-center justify-center text-[#ccff00] font-black text-sm sm:text-base shrink-0">
                      👶
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                        <h4 className="text-xs sm:text-sm font-bold text-white truncate">
                          Ananda {formData.namaAnak || 'Anak'}
                        </h4>
                        <span className="px-1.5 py-0.5 rounded-md bg-[#ccff00] text-slate-950 font-black text-[9px] sm:text-[10px]">
                          {formData.jenisKelamin}
                        </span>
                        {calculatedAge.formatted !== '-' && (
                          <span className="px-1.5 py-0.5 rounded-md bg-white/15 text-slate-200 font-semibold text-[9px] sm:text-[10px]">
                            {calculatedAge.formatted}
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] sm:text-[11px] text-slate-300 mt-0.5 truncate">
                        Bunda: {formData.namaIbu} • BB/TB: {formData.bbTerakhir || '-'} / {formData.tbTerakhir || '-'}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handlePrevStep}
                    className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-[11px] sm:text-xs font-bold text-slate-200 transition-colors cursor-pointer shrink-0 self-end sm:self-center"
                  >
                    Ubah
                  </button>
                </div>

                {/* BAGIAN B: PERTANYAAN POLA MAKAN */}
                <section className="space-y-4 pt-1">
                  <div className="flex items-center gap-2 border-l-3 border-[#ccff00] pl-2.5">
                    <h3 className="text-sm sm:text-base font-bold text-slate-900">
                      B. Pola Pemberian Makan &amp; Jadwal (Feeding Rules)
                    </h3>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Pilih opsi yang paling sesuai dengan kebiasaan dan jadwal makan ananda saat ini:
                  </p>

                  {/* 1. JADWAL MAKAN UTAMA (BENTUK PILIHAN / BUTTONS) */}
                  <div className="space-y-1.5 p-2.5 sm:p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                    <label className="block text-[10px] sm:text-[11px] font-bold text-slate-800 uppercase">
                      Jadwal Makan Utama:
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 sm:gap-2 pt-0.5">
                      {[
                        '3x Teratur (Pagi, Siang, Malam)',
                        '2x Sehari (Hanya siang & malam)',
                        '1x Sehari (Sangat sulit makan)',
                        'Tidak Tentu / Sesuka Anak',
                      ].map((option) => (
                        <button
                          key={option}
                          type="button"
                          onClick={() => handleChange('jadwalMakanUtama', option)}
                          className={`py-2 px-2.5 sm:px-3 text-left text-[11px] sm:text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
                            formData.jadwalMakanUtama === option
                              ? 'bg-slate-900 text-[#ccff00] border-slate-900 font-bold shadow-2xs'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          <span className="flex items-center justify-between">
                            <span>{option}</span>
                            {formData.jadwalMakanUtama === option && (
                              <span className="w-2 h-2 rounded-full bg-[#ccff00]" />
                            )}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 2. JADWAL SNACK (BENTUK PILIHAN / BUTTONS) */}
                  <div className="space-y-1.5 p-2.5 sm:p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                    <label className="block text-[10px] sm:text-[11px] font-bold text-slate-800 uppercase">
                      Jadwal Snack / Camilan:
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 sm:gap-2 pt-0.5">
                      {[
                        '2x Terjadwal (10.00 & 16.00)',
                        '1x Sehari (Sore hari)',
                        'Sering / Terus-menerus (Grazing)',
                        'Jarang / Tidak Diberi Snack',
                      ].map((option) => (
                        <button
                          key={option}
                          type="button"
                          onClick={() => handleChange('jadwalSnack', option)}
                          className={`py-2 px-2.5 sm:px-3 text-left text-[11px] sm:text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
                            formData.jadwalSnack === option
                              ? 'bg-slate-900 text-[#ccff00] border-slate-900 font-bold shadow-2xs'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          <span className="flex items-center justify-between">
                            <span>{option}</span>
                            {formData.jadwalSnack === option && (
                              <span className="w-2 h-2 rounded-full bg-[#ccff00]" />
                            )}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 3. ASI / SUSU + JUMLAH PER HARI (BENTUK PILIHAN / BUTTONS) */}
                  <div className="space-y-1.5 p-2.5 sm:p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                    <label className="block text-[10px] sm:text-[11px] font-bold text-slate-800 uppercase">
                      ASI / Susu + Jumlah Per Hari:
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 sm:gap-2 pt-0.5">
                      {[
                        'Susu 2-3 gelas (400-500 ml/hari)',
                        'Susu Banyak (>600 ml/hari / >3 botol)',
                        'Susu Sedikit (<300 ml/hari)',
                        'Hanya ASI (Sering / On demand)',
                        'Kombinasi ASI & Susu Formula',
                        'Sudah Tidak Minum Susu',
                      ].map((option) => (
                        <button
                          key={option}
                          type="button"
                          onClick={() => handleChange('susuHarian', option)}
                          className={`py-2 px-2.5 sm:px-3 text-left text-[11px] sm:text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
                            formData.susuHarian === option
                              ? 'bg-slate-900 text-[#ccff00] border-slate-900 font-bold shadow-2xs'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          <span className="flex items-center justify-between">
                            <span>{option}</span>
                            {formData.susuHarian === option && (
                              <span className="w-2 h-2 rounded-full bg-[#ccff00]" />
                            )}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 3 Quick Yes/No/Sometimes buttons */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-2.5 pt-0.5">
                    <div className="p-2 sm:p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="text-[10px] sm:text-[11px] font-bold text-slate-800 block mb-1">
                        Makan sambil gadget/TV?
                      </span>
                      <div className="flex gap-1">
                        {(['Ya', 'Kadang', 'Tidak'] as YesNoSometimes[]).map((val) => (
                          <button
                            key={val}
                            type="button"
                            onClick={() => handleChange('makanSambilGadget', val)}
                            className={`flex-1 py-1.5 text-[10px] sm:text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                              formData.makanSambilGadget === val
                                ? 'bg-slate-900 text-white'
                                : 'bg-white border border-slate-200 text-slate-600'
                            }`}
                          >
                            {val}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="p-2 sm:p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="text-[10px] sm:text-[11px] font-bold text-slate-800 block mb-1">
                        Sering dipaksa / dibujuk?
                      </span>
                      <div className="flex gap-1">
                        {(['Ya', 'Kadang', 'Tidak'] as YesNoSometimes[]).map((val) => (
                          <button
                            key={val}
                            type="button"
                            onClick={() => handleChange('seringDipaksaBujuk', val)}
                            className={`flex-1 py-1.5 text-[10px] sm:text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                              formData.seringDipaksaBujuk === val
                                ? 'bg-slate-900 text-white'
                                : 'bg-white border border-slate-200 text-slate-600'
                            }`}
                          >
                            {val}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="p-2 sm:p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="text-[10px] sm:text-[11px] font-bold text-slate-800 block mb-1">
                        Diganti susu/snack saat mogok?
                      </span>
                      <div className="flex gap-1">
                        {(['Ya', 'Kadang', 'Tidak'] as YesNoSometimes[]).map((val) => (
                          <button
                            key={val}
                            type="button"
                            onClick={() => handleChange('digantiSusuSnack', val)}
                            className={`flex-1 py-1.5 text-[10px] sm:text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                              formData.digantiSusuSnack === val
                                ? 'bg-slate-900 text-white'
                                : 'bg-white border border-slate-200 text-slate-600'
                            }`}
                          >
                            {val}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </section>

                {/* Tombol Aksi Step 2: Kembali ke Identitas & Kirim Form */}
                <div className="pt-3 sm:pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-3">
                  <button
                    type="button"
                    onClick={handlePrevStep}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 sm:py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs sm:text-sm rounded-xl transition-all cursor-pointer order-2 sm:order-1"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Kembali ke Data Anak</span>
                  </button>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 sm:px-6 py-3 sm:py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs sm:text-sm rounded-xl transition-all shadow-md active:scale-98 disabled:opacity-50 cursor-pointer order-1 sm:order-2"
                  >
                    {isSubmitting ? (
                      <span>Menyiapkan Hasil &amp; Membuka WhatsApp CS...</span>
                    ) : (
                      <>
                        <MessageCircle className="w-4 h-4 text-[#ccff00]" />
                        <span>Kirim &amp; Dapatkan Hasil di WhatsApp Admin</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>

                <div className="text-center pt-1">
                  <span className="text-[11px] text-slate-500">
                    🔒 Hasil lengkap tinjauan klinis IDAI &amp; kurva antropometri anak langsung dikirimkan ke WhatsApp CS dokter.
                  </span>
                </div>
              </div>
            )}
          </form>
        </div>
      )}

      {/* Lightbox Modal untuk Melihat Testimoni Ukuran Penuh */}
      {zoomedTesti && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6"
          onClick={() => setZoomedTesti(null)}
        >
          <div
            className="relative max-w-3xl max-h-[92vh] bg-slate-950 rounded-2xl p-2 sm:p-3 overflow-hidden shadow-2xl flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-full flex items-center justify-between pb-2 px-2 text-white border-b border-slate-800 mb-2">
              <span className="text-xs font-bold text-slate-300">
                Tangkapan Layar Testimoni (Ukuran Asli)
              </span>
              <button
                type="button"
                onClick={() => setZoomedTesti(null)}
                className="p-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="overflow-auto max-h-[82vh] w-full flex items-center justify-center">
              <Image
                src={zoomedTesti}
                alt="Testimoni Ukuran Penuh"
                width={1200}
                height={1800}
                className="w-full h-auto object-contain rounded-lg"
                unoptimized
                referrerPolicy="no-referrer"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
