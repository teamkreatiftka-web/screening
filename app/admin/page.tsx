'use client';

import React, { useState, useEffect, useMemo, useSyncExternalStore } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ScreeningRecord,
  ScreeningStatus,
  RiskLevel,
  ScreeningType,
  PaidScreeningData,
  Gender,
} from '@/types/screening';
import {
  fetchAllScreenings,
  updateRecordDetails,
  deleteRecord,
  saveScreeningRecord,
} from '@/lib/storage';
import {
  SUPABASE_REST_URL,
  SUPABASE_SQL_SETUP,
} from '@/lib/supabase';
import {
  ShieldCheck,
  Lock,
  Unlock,
  Search,
  Filter,
  Download,
  Printer,
  RefreshCw,
  Eye,
  Trash2,
  Phone,
  MessageCircle,
  CheckCircle2,
  Clock,
  AlertCircle,
  Database,
  Code2,
  X,
  FileSpreadsheet,
  FileText,
  User,
  Activity,
  Calendar,
  Utensils,
  Share2,
  ChevronRight,
  Sparkles,
  Copy,
} from 'lucide-react';
import {
  generateMasterPrompt,
  generateSectionPrompt,
  MasterPromptSection,
  PROMPT_SECTIONS,
} from '@/lib/generateMasterPrompt';

const ADMIN_PIN_STORAGE_KEY = 'tka_admin_auth_session';
const DEFAULT_PIN = 'admin123';

function subscribeAuth(callback: () => void) {
  window.addEventListener('storage', callback);
  return () => window.removeEventListener('storage', callback);
}

function getAuthSnapshot(): boolean {
  try {
    return sessionStorage.getItem(ADMIN_PIN_STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

function getAuthServerSnapshot(): boolean {
  return false;
}

function formatDateString(isoString: string): string {
  if (!isoString) return '-';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return '-';
    const day = String(d.getDate()).padStart(2, '0');
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const month = monthNames[d.getMonth()] || '';
    const year = d.getFullYear();
    return `${day} ${month} ${year}`;
  } catch {
    return '-';
  }
}

export default function AdminDashboardPage() {
  // Auth State (Hydration-safe via useSyncExternalStore)
  const isSessionAuth = useSyncExternalStore(subscribeAuth, getAuthSnapshot, getAuthServerSnapshot);
  const [manualAuth, setManualAuth] = useState<boolean>(false);
  const isAuthenticated = isSessionAuth || manualAuth;
  const [pinInput, setPinInput] = useState<string>('');
  const [authError, setAuthError] = useState<string>('');

  // Data State
  const [records, setRecords] = useState<ScreeningRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isFromSupabase, setIsFromSupabase] = useState<boolean>(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'free' | 'paid'>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [riskFilter, setRiskFilter] = useState<string>('all');

  // Active Detail Modal Record
  const [selectedRecord, setSelectedRecord] = useState<ScreeningRecord | null>(null);
  const [activeModalTab, setActiveModalTab] = useState<
    'ringkasan' | 'orangtua' | 'repertoire' | 'oralmotor' | 'foodrecall' | 'riwayatbb' | 'masterprompt'
  >('ringkasan');
  const [editingNotes, setEditingNotes] = useState<string>('');
  const [editingStatus, setEditingStatus] = useState<ScreeningStatus>('Baru');
  const [isSavingNotes, setIsSavingNotes] = useState<boolean>(false);
  const [copiedAdminPrompt, setCopiedAdminPrompt] = useState<boolean>(false);
  const [copiedRecordId, setCopiedRecordId] = useState<string | null>(null);
  const [selectedPromptSection, setSelectedPromptSection] = useState<MasterPromptSection>('all');
  const [copiedSectionKey, setCopiedSectionKey] = useState<string | null>(null);
  const [showA4PreviewModal, setShowA4PreviewModal] = useState<boolean>(false);

  const getRecordPromptData = (record: ScreeningRecord): Partial<PaidScreeningData> => {
    if (record.paid_data) return record.paid_data;
    return {
      namaLengkapAnak: record.child_name,
      usiaTerkalkulasi: record.age_text,
      jenisKelamin: (record.gender as Gender) || 'Laki-laki',
      bbSekarang: record.last_weight,
      tbPB: record.last_height,
      namaIbu: record.mother_name,
      waIbu: record.phone,
      ceritaKondisi: record.summary,
      keluhanUtama: record.problem_areas,
      frekuensiMakanUtama: record.free_data?.jadwalMakanUtama,
      frekuensiSnack: record.free_data?.jadwalSnack,
      jumlahSusuPerHari: record.free_data?.susuHarian,
      makanSambilGadget: record.free_data?.makanSambilGadget,
      seringDibujukDipaksa: record.free_data?.seringDipaksaBujuk,
    };
  };

  const handleCopySectionPrompt = async (
    record: ScreeningRecord,
    section: MasterPromptSection
  ) => {
    const data = getRecordPromptData(record);
    const promptText = generateSectionPrompt(section, data, record.age_text);
    try {
      await navigator.clipboard.writeText(promptText);
      setCopiedSectionKey(`${record.id}_${section}`);
      setCopiedRecordId(record.id);
      setCopiedAdminPrompt(true);
      setTimeout(() => {
        setCopiedSectionKey(null);
        setCopiedRecordId(null);
        setCopiedAdminPrompt(false);
      }, 3000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  const handleCopyAdminPrompt = async (record: ScreeningRecord) => {
    await handleCopySectionPrompt(record, 'all');
  };

  const handleDownloadPrompt = (record: ScreeningRecord, section: MasterPromptSection) => {
    const data = getRecordPromptData(record);
    const promptText = generateSectionPrompt(section, data, record.age_text);
    const blob = new Blob([promptText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Prompt_${section.toUpperCase()}_${record.child_name.replace(/\s+/g, '_')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // SQL Script Modal
  const [showSqlModal, setShowSqlModal] = useState<boolean>(false);
  const [copySuccess, setCopySuccess] = useState<boolean>(false);

  // Fetch data when authenticated
  const loadData = async () => {
    setIsLoading(true);
    try {
      const { records: data, fromSupabase } = await fetchAllScreenings();
      setRecords(data);
      setIsFromSupabase(fromSupabase);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    if (isAuthenticated) {
      fetchAllScreenings()
        .then(({ records: data, fromSupabase }) => {
          if (active) {
            setRecords(data);
            setIsFromSupabase(fromSupabase);
          }
        })
        .catch((e) => {
          console.error(e);
        });
    }
    return () => {
      active = false;
    };
  }, [isAuthenticated]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput.trim() === DEFAULT_PIN || pinInput.trim() === 'tka2026') {
      try {
        sessionStorage.setItem(ADMIN_PIN_STORAGE_KEY, 'true');
      } catch {
        // ignore
      }
      setManualAuth(true);
      setAuthError('');
    } else {
      setAuthError('Sandi / PIN salah. Gunakan sandi: admin123');
    }
  };

  const handleLogout = () => {
    try {
      sessionStorage.removeItem(ADMIN_PIN_STORAGE_KEY);
    } catch {
      // ignore
    }
    setManualAuth(false);
    setPinInput('');
  };

  // Open Record Details
  const handleOpenDetail = (record: ScreeningRecord) => {
    setSelectedRecord(record);
    setEditingNotes(record.clinical_notes || '');
    setEditingStatus(record.status);
    setActiveModalTab('ringkasan');
  };

  // Save changes to notes and status
  const handleSaveModalDetails = async () => {
    if (!selectedRecord) return;
    setIsSavingNotes(true);
    try {
      await updateRecordDetails(selectedRecord.id, {
        clinical_notes: editingNotes,
        status: editingStatus,
      });

      // Update in state
      setRecords((prev) =>
        prev.map((r) =>
          r.id === selectedRecord.id
            ? { ...r, clinical_notes: editingNotes, status: editingStatus }
            : r
        )
      );

      setSelectedRecord((prev) =>
        prev ? { ...prev, clinical_notes: editingNotes, status: editingStatus } : null
      );
      alert('Perubahan rekam medis berhasil disimpan!');
    } catch (err) {
      alert('Gagal menyimpan perubahan.');
    } finally {
      setIsSavingNotes(false);
    }
  };

  const handleDeleteRecord = async (id: string, name: string) => {
    if (confirm(`Yakin ingin menghapus data rekam medis pasien: ${name}?`)) {
      await deleteRecord(id);
      setRecords((prev) => prev.filter((r) => r.id !== id));
      if (selectedRecord?.id === id) {
        setSelectedRecord(null);
      }
    }
  };

  // Filtered Records
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      // Type
      if (typeFilter !== 'all' && r.type !== typeFilter) return false;

      // Status
      if (statusFilter !== 'all' && r.status !== statusFilter) return false;

      // Risk
      if (riskFilter !== 'all' && r.risk_level !== riskFilter) return false;

      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = r.child_name.toLowerCase().includes(q);
        const matchesMother = (r.mother_name || '').toLowerCase().includes(q);
        const matchesFather = (r.father_name || '').toLowerCase().includes(q);
        const matchesPhone = (r.phone || '').includes(q);
        const matchesId = r.id.toLowerCase().includes(q);
        return matchesName || matchesMother || matchesFather || matchesPhone || matchesId;
      }

      return true;
    });
  }, [records, typeFilter, statusFilter, riskFilter, searchQuery]);

  // Statistics
  const stats = useMemo(() => {
    const total = records.length;
    const paidCount = records.filter((r) => r.type === 'paid').length;
    const freeCount = records.filter((r) => r.type === 'free').length;
    const needsReview = records.filter((r) => r.status === 'Baru' || r.status === 'Dalam Review').length;
    const highRisk = records.filter((r) => r.risk_level === 'BUTUH PERHATIAN KHUSUS').length;
    return { total, paidCount, freeCount, needsReview, highRisk };
  }, [records]);

  // Export to CSV
  const handleExportCSV = () => {
    if (records.length === 0) return alert('Belum ada data untuk diekspor.');

    const headers = [
      'ID Rekam Medis',
      'Tanggal Input',
      'Tipe Screening',
      'Status Asesmen',
      'Tingkat Risiko',
      'Nama Anak',
      'Usia',
      'Jenis Kelamin',
      'BB Terakhir',
      'TB Terakhir',
      'Nama Ibu',
      'No. WhatsApp',
      'Keluhan / Warning Signs',
    ];

    const rows = filteredRecords.map((r) => [
      `"${r.id}"`,
      `"${new Date(r.created_at).toLocaleDateString('id-ID')}"`,
      `"${r.type === 'paid' ? 'Asesmen Lengkap' : 'Screening Gratis'}"`,
      `"${r.status}"`,
      `"${r.risk_level}"`,
      `"${r.child_name.replace(/"/g, '""')}"`,
      `"${r.age_text}"`,
      `"${r.gender}"`,
      `"${r.last_weight}"`,
      `"${r.last_height}"`,
      `"${(r.mother_name || '').replace(/"/g, '""')}"`,
      `"${r.phone}"`,
      `"${(r.problem_areas || []).join('; ').replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Rekam_Medis_TKA_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Copy SQL setup script
  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SETUP);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2500);
  };

  // Print Official Medical Record Document
  const handlePrint = () => {
    window.print();
  };

  // ---------------- LOGIN SCREEN ----------------
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center px-4">
        <div className="w-full max-w-md bg-white rounded-3xl p-8 sm:p-10 shadow-2xl border border-slate-200">
          <div className="text-center">
            <div className="w-14 h-14 bg-slate-900 text-[#ccff00] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-md">
              <Lock className="w-7 h-7" />
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Portal Rekam Medis Pasien
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-slate-500">
              Tumbuh Kembang Anak & Ziad Medika
            </p>
          </div>

          <form onSubmit={handleLogin} className="mt-8 space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Masukkan Sandi / PIN Dokter:
              </label>
              <input
                type="password"
                required
                autoFocus
                placeholder="Ketik sandi admin..."
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 text-sm font-semibold text-slate-900 transition-colors"
              />
              {authError && (
                <p className="mt-2 text-xs font-bold text-rose-600 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>{authError}</span>
                </p>
              )}
            </div>

            <button
              type="submit"
              className="w-full py-3.5 px-4 bg-slate-950 hover:bg-slate-800 text-[#ccff00] font-black rounded-xl text-sm transition-all shadow-md"
            >
              Buka Dashboard Admin
            </button>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
              <span className="text-[11px] text-slate-500 block">
                Sandi Default Klinik: <strong className="text-slate-900 font-mono">admin123</strong>
              </span>
            </div>

            <div className="pt-2 text-center">
              <Link
                href="/"
                className="text-xs text-slate-500 hover:text-slate-900 font-semibold transition-colors"
              >
                ← Kembali ke Halaman Utama Skrining
              </Link>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // ---------------- DASHBOARD UTAMA ----------------
  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 flex flex-col">
      {/* Top Admin Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Brand Logo & Info */}
            <div className="flex items-center gap-4">
              <Link href="/" className="flex items-center py-1">
                <Image
                  src="https://cdn.scalev.com/uploads/1791437257/QF6f43VbRyKhXQscT8CtjA/1791437253324-Frame-32-Photoroom-1.webp"
                  alt="Tumbuh Kembang Anak Logo"
                  width={1920}
                  height={303}
                  className="h-9 sm:h-11 w-auto max-w-[220px] sm:max-w-[280px] object-contain"
                  referrerPolicy="no-referrer"
                />
              </Link>
              <div className="hidden sm:block border-l border-slate-200 pl-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-900">
                    Dashboard Rekam Medis
                  </span>
                  <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full font-bold">
                    Admin Portal
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Data Pasien Asesmen Masalah Makan 0-5 Tahun
                </p>
              </div>
            </div>

            {/* Quick Actions & Logout */}
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                type="button"
                onClick={() => setShowSqlModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-200 transition-colors"
                title="Lihat & Salin Script Supabase"
              >
                <Database className="w-3.5 h-3.5 text-blue-600" />
                <span className="hidden md:inline">Supabase Setup</span>
              </button>

              <button
                type="button"
                onClick={loadData}
                disabled={isLoading}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-200 transition-colors"
                title="Muat ulang data terbaru"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Refresh</span>
              </button>

              <button
                type="button"
                onClick={handleExportCSV}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-200 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Export CSV</span>
              </button>

              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg border border-rose-200 transition-colors"
              >
                <Unlock className="w-3.5 h-3.5" />
                <span>Keluar</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full space-y-6">
        {/* STATISTIK CARDS */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
              Total Pasien Masuk
            </span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-slate-900 tabular-nums">
                {stats.total}
              </span>
              <span className="text-xs text-slate-500">rekam medis</span>
            </div>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
              Asesmen Lengkap (Bayar)
            </span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-indigo-700 tabular-nums">
                {stats.paidCount}
              </span>
              <span className="text-xs text-indigo-600 font-semibold">10 bagian</span>
            </div>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
              Screening Gratis (Lead)
            </span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-slate-700 tabular-nums">
                {stats.freeCount}
              </span>
              <span className="text-xs text-slate-500">skrining cepat</span>
            </div>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
              Perlu Review Tim
            </span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-amber-600 tabular-nums">
                {stats.needsReview}
              </span>
              <span className="text-xs text-amber-700 font-semibold">antrean</span>
            </div>
          </div>

          <div className="col-span-2 lg:col-span-1 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
              Red Flag / Perhatian Khusus
            </span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-rose-600 tabular-nums">
                {stats.highRisk}
              </span>
              <span className="text-xs text-rose-700 font-semibold">prioritas</span>
            </div>
          </div>
        </div>

        {/* Database & Persistence Info Banner */}
        <div className="p-3.5 bg-slate-900 text-white rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-[#ccff00]" />
            <span>
              <strong>Koneksi Database:</strong> {isFromSupabase ? 'Terkoneksi Aktif ke Supabase Remote' : 'Penyimpanan Lokal Aktif (Dual-Mode Supabase Ready)'}
            </span>
            <span className="text-slate-400 font-mono text-[11px] hidden sm:inline">
              · REST: {SUPABASE_REST_URL}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowSqlModal(true)}
              className="text-[#ccff00] hover:underline font-bold"
            >
              Cek Tabel Supabase ↗
            </button>
            <Link
              href="/"
              className="px-2.5 py-1 bg-white/10 hover:bg-white/20 rounded-md font-bold text-white transition-colors"
            >
              Lihat Halaman Skrining Publik ↗
            </Link>
          </div>
        </div>

        {/* SEARCH & FILTERS BAR */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari berdasarkan nama anak, orang tua, atau nomor WhatsApp..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:border-slate-900 text-xs sm:text-sm font-medium"
              />
            </div>

            {/* Quick Segmented Type Filter */}
            <div className="inline-flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 shrink-0">
              <button
                type="button"
                onClick={() => setTypeFilter('all')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  typeFilter === 'all'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Semua ({records.length})
              </button>
              <button
                type="button"
                onClick={() => setTypeFilter('paid')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1 ${
                  typeFilter === 'paid'
                    ? 'bg-[#ccff00] text-slate-950 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>Asesmen Lengkap</span>
                <span className="text-[10px] bg-slate-900 text-white px-1.5 py-0.2 rounded-full font-bold">
                  {stats.paidCount}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setTypeFilter('free')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  typeFilter === 'free'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Screening Gratis ({stats.freeCount})
              </button>
            </div>
          </div>

          {/* Secondary Dropdown Filters */}
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs font-semibold">
            <span className="text-slate-500 text-[11px] uppercase tracking-wider">Filter Status:</span>
            {['all', 'Baru', 'Dalam Review', 'Selesai', 'Follow-Up'].map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 rounded-lg border transition-all ${
                  statusFilter === st
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {st === 'all' ? 'Semua Status' : st}
              </button>
            ))}

            <span className="text-slate-400 mx-1">|</span>

            <span className="text-slate-500 text-[11px] uppercase tracking-wider">Risiko:</span>
            {['all', 'NORMAL', 'PERLU DIPERHATIKAN', 'BUTUH PERHATIAN KHUSUS'].map((rk) => (
              <button
                key={rk}
                type="button"
                onClick={() => setRiskFilter(rk)}
                className={`px-2.5 py-1 rounded-lg border transition-all ${
                  riskFilter === rk
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {rk === 'all' ? 'Semua Risiko' : rk}
              </button>
            ))}
          </div>
        </div>

        {/* DAFTAR REKAM MEDIS PASIEN (DESKTOP TABLE & MOBILE CARDS) */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          {/* TAMPILAN MOBILE (< md): KARTU RINGKAS & MUDAH DITAP */}
          <div className="block md:hidden divide-y divide-slate-100">
            {filteredRecords.length === 0 ? (
              <div className="p-8 text-center text-slate-500">
                <FileSpreadsheet className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                <p className="text-xs font-semibold text-slate-700">Tidak ada rekam medis yang sesuai filter.</p>
              </div>
            ) : (
              filteredRecords.map((r, index) => (
                <div
                  key={r.id}
                  onClick={() => handleOpenDetail(r)}
                  className="p-3.5 hover:bg-slate-50 active:bg-slate-100 transition-colors cursor-pointer space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] font-bold text-slate-400">#{index + 1}</span>
                      <strong className="text-sm font-black text-slate-900">{r.child_name}</strong>
                    </div>
                    {r.type === 'paid' ? (
                      <span className="text-[10px] uppercase font-black bg-slate-900 text-[#ccff00] px-2 py-0.5 rounded-full">
                        Asesmen Lengkap
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                        Skrining Singkat
                      </span>
                    )}
                  </div>

                  <div className="text-xs text-slate-500 flex flex-wrap items-center gap-1.5">
                    <span>{r.age_text}</span>
                    <span>·</span>
                    <span>{r.gender}</span>
                    {r.last_weight && (
                      <>
                        <span>·</span>
                        <span>{r.last_weight}</span>
                      </>
                    )}
                    <span>·</span>
                    <span>{formatDateString(r.created_at)}</span>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <div>
                      {r.risk_level === 'NORMAL' && (
                        <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                          NORMAL 🟢
                        </span>
                      )}
                      {r.risk_level === 'PERLU DIPERHATIKAN' && (
                        <span className="text-[10px] font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded">
                          PERLU DIPERHATIKAN 🟡
                        </span>
                      )}
                      {r.risk_level === 'BUTUH PERHATIAN KHUSUS' && (
                        <span className="text-[10px] font-bold text-rose-900 bg-rose-100 px-2 py-0.5 rounded">
                          BUTUH PERHATIAN 🔴
                        </span>
                      )}
                      <span className="text-[11px] text-slate-500 ml-2">
                        Status: <strong>{r.status}</strong>
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                      {r.paid_data && (
                        <button
                          type="button"
                          onClick={() => handleCopyAdminPrompt(r)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-black rounded-lg transition-all shadow-2xs active:scale-95 ${
                            copiedRecordId === r.id
                              ? 'bg-emerald-600 text-white'
                              : 'bg-[#ccff00] text-slate-950 hover:bg-[#b8e600]'
                          }`}
                          title="Salin Master Prompt AI Pasien Ini"
                        >
                          {copiedRecordId === r.id ? (
                            <>
                              <CheckCircle2 className="w-3 h-3 text-white" />
                              <span>Tersalin! ✅</span>
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-3 h-3 text-slate-950" />
                              <span>Salin Prompt AI</span>
                            </>
                          )}
                        </button>
                      )}
                      <a
                        href={`https://wa.me/${r.phone.replace(/[^0-9]/g, '').replace(/^0/, '62')}?text=Halo%20Bunda%20${encodeURIComponent(
                          r.mother_name || ''
                        )},%20kami%20dari%20Tim%20Ziad%20Medika%20ingin%20mengabarkan%20update%20asesmen%20${encodeURIComponent(
                          r.child_name
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700"
                        title="Chat WA"
                      >
                        <MessageCircle className="w-4 h-4" />
                      </a>
                      <button
                        type="button"
                        onClick={() => handleOpenDetail(r)}
                        className="px-2.5 py-1 text-xs font-bold bg-slate-900 text-white rounded-lg"
                      >
                        Buka
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* TAMPILAN DESKTOP (md+) */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200">
                <tr>
                  <th className="p-4 w-28">No. &amp; Tanggal</th>
                  <th className="p-4">Pasien &amp; Usia</th>
                  <th className="p-4">Kontak Ortu (WA)</th>
                  <th className="p-4">Tipe Skrining</th>
                  <th className="p-4">Status / Risiko</th>
                  <th className="p-4">Keluhan Utama</th>
                  <th className="p-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-12 text-center text-slate-500">
                      <FileSpreadsheet className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                      <p className="font-semibold text-slate-700">Tidak ada rekam medis yang sesuai filter.</p>
                      <p className="text-xs text-slate-400 mt-1">
                        Coba bersihkan pencarian atau ubah filter tipe screening.
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map((r, index) => (
                    <tr
                      key={r.id}
                      className="hover:bg-slate-50/70 transition-colors cursor-pointer group"
                      onClick={() => handleOpenDetail(r)}
                    >
                      {/* Queue & Date */}
                      <td className="p-4 align-top">
                        <span className="font-black text-slate-900 block group-hover:text-blue-600 transition-colors">
                          #{index + 1}
                        </span>
                        <span className="text-[11px] text-slate-400 block mt-0.5">
                          {formatDateString(r.created_at)}
                        </span>
                      </td>

                      {/* Patient info */}
                      <td className="p-4 align-top">
                        <div className="font-bold text-slate-900 text-sm">{r.child_name}</div>
                        <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                          <span>{r.age_text}</span>
                          <span>·</span>
                          <span>{r.gender}</span>
                          {r.last_weight && (
                            <>
                              <span>·</span>
                              <span>{r.last_weight}</span>
                            </>
                          )}
                        </div>
                      </td>

                      {/* Parent info */}
                      <td className="p-4 align-top" onClick={(e) => e.stopPropagation()}>
                        <div className="font-semibold text-slate-800 text-xs">
                          {r.mother_name ? `Bunda ${r.mother_name}` : '-'}
                        </div>
                        {r.father_name && (
                          <div className="text-[11px] text-slate-500">Ayah {r.father_name}</div>
                        )}
                        <a
                          href={`https://wa.me/${r.phone.replace(/[^0-9]/g, '').replace(/^0/, '62')}?text=Halo%20Bunda%20${encodeURIComponent(
                            r.mother_name || ''
                          )},%20kami%20dari%20Tim%20Tumbuh%20Kembang%20Anak%20&%20Ziad%20Medika%20mengenai%20hasil%20asesmen%20makan%20${encodeURIComponent(
                            r.child_name
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-emerald-700 hover:text-emerald-800 font-bold text-xs mt-1"
                        >
                          <Phone className="w-3 h-3" />
                          <span>{r.phone}</span>
                        </a>
                      </td>

                      {/* Type */}
                      <td className="p-4 align-top">
                        {r.type === 'paid' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-900 text-[#ccff00] text-[11px] font-black uppercase tracking-wide">
                            <Sparkles className="w-3 h-3 text-[#ccff00]" />
                            <span>Lengkap (Bayar)</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-[11px] font-bold">
                            <Clock className="w-3 h-3 text-slate-500" />
                            <span>Gratis (Lead)</span>
                          </span>
                        )}
                      </td>

                      {/* Status & Risk */}
                      <td className="p-4 align-top">
                        <div className="space-y-1">
                          {r.risk_level === 'NORMAL' && (
                            <span className="inline-block px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-bold text-[11px] border border-emerald-200">
                              NORMAL 🟢
                            </span>
                          )}
                          {r.risk_level === 'PERLU DIPERHATIKAN' && (
                            <span className="inline-block px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 font-bold text-[11px] border border-amber-200">
                              PERLU DIPERHATIKAN 🟡
                            </span>
                          )}
                          {r.risk_level === 'BUTUH PERHATIAN KHUSUS' && (
                            <span className="inline-block px-2 py-0.5 rounded-md bg-rose-50 text-rose-800 font-bold text-[11px] border border-rose-200">
                              BUTUH PERHATIAN 🔴
                            </span>
                          )}

                          <div className="text-[11px] text-slate-600 font-medium">
                            Status: <strong className="text-slate-900">{r.status}</strong>
                          </div>
                        </div>
                      </td>

                      {/* Keluhan / Warning */}
                      <td className="p-4 align-top max-w-xs">
                        <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                          {r.problem_areas && r.problem_areas.length > 0
                            ? r.problem_areas.join(', ')
                            : r.summary || '-'}
                        </p>
                      </td>

                      {/* Actions */}
                      <td className="p-4 align-top text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5 flex-wrap">
                          {r.paid_data && (
                            <button
                              type="button"
                              onClick={() => handleCopyAdminPrompt(r)}
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black transition-all shadow-xs active:scale-95 ${
                                copiedRecordId === r.id
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-[#ccff00] hover:bg-[#b8e600] text-slate-950 border border-slate-950/10'
                              }`}
                              title="Salin Master Prompt AI Pasien Ini (untuk ChatGPT / Gemini / Claude)"
                            >
                              {copiedRecordId === r.id ? (
                                <>
                                  <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                                  <span>Tersalin! ✅</span>
                                </>
                              ) : (
                                <>
                                  <Sparkles className="w-3.5 h-3.5 text-slate-950" />
                                  <span>Salin Prompt AI</span>
                                </>
                              )}
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleOpenDetail(r)}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                            title="Buka Rekam Medis"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <a
                            href={`https://wa.me/${r.phone.replace(/[^0-9]/g, '').replace(/^0/, '62')}?text=Halo%20Bunda%20${encodeURIComponent(
                              r.mother_name || ''
                            )},%20kami%20dari%20Tim%20Ziad%20Medika%20ingin%20mengabarkan%20update%20asesmen%20${encodeURIComponent(
                              r.child_name
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition-colors"
                            title="Hubungi WhatsApp"
                          >
                            <MessageCircle className="w-4 h-4" />
                          </a>
                          <button
                            type="button"
                            onClick={() => handleDeleteRecord(r.id, r.child_name)}
                            className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors"
                            title="Hapus Rekam Medis"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* ================= MODAL DETAIL REKAM MEDIS LENGKAP ================= */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl border border-slate-200 my-auto overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-4 sm:p-6 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#ccff00] text-slate-950 flex items-center justify-center font-black">
                  RM
                </div>
                <div>
                  <h2 className="text-base sm:text-xl font-black">{selectedRecord.child_name}</h2>
                  <p className="text-xs text-slate-400">
                    {selectedRecord.type === 'paid' ? 'Asesmen Lengkap 10 Bagian' : 'Screening Singkat'} · Tanggal: {formatDateString(selectedRecord.created_at)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {selectedRecord.paid_data && (
                  <button
                    type="button"
                    onClick={() => handleCopyAdminPrompt(selectedRecord)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-900 bg-white hover:bg-slate-100 rounded-lg transition-colors border border-slate-300 shadow-xs"
                    title="Salin Master Prompt AI dengan data pasien ini"
                  >
                    {copiedAdminPrompt ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700">Tersalin! ✅</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Salin Prompt AI</span>
                      </>
                    )}
                  </button>
                )}
                <button
                  type="button"
                  onClick={handlePrint}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-900 bg-[#ccff00] hover:bg-[#b8e600] rounded-lg transition-colors"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Cetak Rekam Medis</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedRecord(null)}
                  className="p-2 text-slate-400 hover:text-white rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Sub-Tabs Navigation */}
            <div className="px-6 pt-3 bg-slate-50 border-b border-slate-200 flex gap-2 overflow-x-auto text-xs font-bold shrink-0">
              <button
                type="button"
                onClick={() => setActiveModalTab('ringkasan')}
                className={`py-2 px-3 border-b-2 transition-all ${
                  activeModalTab === 'ringkasan'
                    ? 'border-slate-900 text-slate-900'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                1. Ringkasan &amp; Tindak Lanjut
              </button>
              <button
                type="button"
                onClick={() => setActiveModalTab('orangtua')}
                className={`py-2 px-3 border-b-2 transition-all ${
                  activeModalTab === 'orangtua'
                    ? 'border-slate-900 text-slate-900'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                2. Data Pasien &amp; Ortu
              </button>
              {selectedRecord.paid_data && (
                <>
                  <button
                    type="button"
                    onClick={() => setActiveModalTab('repertoire')}
                    className={`py-2 px-3 border-b-2 transition-all ${
                      activeModalTab === 'repertoire'
                        ? 'border-slate-900 text-slate-900'
                        : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    3. Food Repertoire
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveModalTab('oralmotor')}
                    className={`py-2 px-3 border-b-2 transition-all ${
                      activeModalTab === 'oralmotor'
                        ? 'border-slate-900 text-slate-900'
                        : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    4. Oral Motor &amp; Sensorik
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveModalTab('foodrecall')}
                    className={`py-2 px-3 border-b-2 transition-all ${
                      activeModalTab === 'foodrecall'
                        ? 'border-slate-900 text-slate-900'
                        : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    5. 24-Hr Food Recall
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveModalTab('riwayatbb')}
                    className={`py-2 px-3 border-b-2 transition-all ${
                      activeModalTab === 'riwayatbb'
                        ? 'border-slate-900 text-slate-900'
                        : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    6. Riwayat Berat Badan
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveModalTab('masterprompt')}
                    className={`py-2 px-3 border-b-2 transition-all flex items-center gap-1.5 ${
                      activeModalTab === 'masterprompt'
                        ? 'border-slate-900 text-slate-900 bg-white'
                        : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                    <span>7. Master Prompt AI</span>
                  </button>
                </>
              )}
            </div>

            {/* Modal Body Scrollable */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm text-slate-800">
              {/* TAB 1: RINGKASAN & TINDAK LANJUT */}
              {activeModalTab === 'ringkasan' && (
                <div className="space-y-5 animate-fade-in">
                  {/* Banner Salin Prompt AI Spesialis & Shortcut Filter Bagian */}
                  <div className="p-4 bg-slate-900 text-white rounded-2xl border border-slate-800 shadow-md space-y-3">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2.5 bg-[#ccff00] text-slate-950 rounded-xl font-black shrink-0">
                          <Sparkles className="w-5 h-5 text-slate-950" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-black text-white">
                              Master Prompt AI (Format Teks Klinis Terstruktur)
                            </span>
                            <span className="text-[10px] bg-[#ccff00] text-slate-950 font-black px-2 py-0.5 rounded-full uppercase">
                              BB Aktual &amp; Data Terarah
                            </span>
                          </div>
                          <p className="text-xs text-slate-300 mt-0.5">
                            Data ananda <strong className="text-white">{selectedRecord.child_name}</strong> terisi otomatis per bagian (cukup biodata &amp; data relevan). Pilih bagian untuk menyalin:
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
                        <button
                          type="button"
                          onClick={() => handleCopyAdminPrompt(selectedRecord)}
                          className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl font-black text-xs transition-all shadow-md active:scale-95 ${
                            copiedSectionKey === `${selectedRecord.id}_all`
                              ? 'bg-emerald-600 text-white'
                              : 'bg-[#ccff00] hover:bg-[#b8e600] text-slate-950'
                          }`}
                        >
                          {copiedSectionKey === `${selectedRecord.id}_all` ? (
                            <>
                              <CheckCircle2 className="w-4 h-4 text-white" />
                              <span>Full Prompt Tersalin! ✅</span>
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-4 h-4 text-slate-950" />
                              <span>Salin Full Prompt AI (Asli Lengkap)</span>
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => setActiveModalTab('masterprompt')}
                          className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-[#ccff00] font-black rounded-xl text-xs transition-colors border border-slate-700 inline-flex items-center gap-1.5"
                        >
                          <Filter className="w-3.5 h-3.5" />
                          <span>Filter Bagian →</span>
                        </button>
                      </div>
                    </div>

                    {/* Quick 1-Click Copy Buttons for all 4 sections */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-800 text-xs">
                      <button
                        type="button"
                        onClick={() => handleCopySectionPrompt(selectedRecord, 'resume')}
                        className={`p-2 rounded-xl text-left font-bold transition-all flex items-center justify-between border ${
                          copiedSectionKey === `${selectedRecord.id}_resume`
                            ? 'bg-emerald-600 text-white border-emerald-500'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                        }`}
                      >
                        <span className="truncate">📋 1. Salin Resume</span>
                        {copiedSectionKey === `${selectedRecord.id}_resume` ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-white shrink-0" />
                        ) : (
                          <Copy className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleCopySectionPrompt(selectedRecord, 'status_nutrisi')}
                        className={`p-2 rounded-xl text-left font-bold transition-all flex items-center justify-between border ${
                          copiedSectionKey === `${selectedRecord.id}_status_nutrisi`
                            ? 'bg-emerald-600 text-white border-emerald-500'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                        }`}
                      >
                        <span className="truncate">🥗 2. Salin Status Nutrisi</span>
                        {copiedSectionKey === `${selectedRecord.id}_status_nutrisi` ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-white shrink-0" />
                        ) : (
                          <Copy className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleCopySectionPrompt(selectedRecord, 'meal_plan')}
                        className={`p-2 rounded-xl text-left font-bold transition-all flex items-center justify-between border ${
                          copiedSectionKey === `${selectedRecord.id}_meal_plan`
                            ? 'bg-emerald-600 text-white border-emerald-500'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                        }`}
                      >
                        <span className="truncate">🍱 3. Salin Meal Plan</span>
                        {copiedSectionKey === `${selectedRecord.id}_meal_plan` ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-white shrink-0" />
                        ) : (
                          <Copy className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleCopySectionPrompt(selectedRecord, 'actionable_2weeks')}
                        className={`p-2 rounded-xl text-left font-bold transition-all flex items-center justify-between border ${
                          copiedSectionKey === `${selectedRecord.id}_actionable_2weeks`
                            ? 'bg-emerald-600 text-white border-emerald-500'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                        }`}
                      >
                        <span className="truncate">🎯 4. Salin 2 Weeks Plan</span>
                        {copiedSectionKey === `${selectedRecord.id}_actionable_2weeks` ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-white shrink-0" />
                        ) : (
                          <Copy className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Status & Risk Badges */}
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <span className="text-xs font-bold text-slate-500 uppercase block mb-1">
                        Ubah Status Asesmen Rekam Medis:
                      </span>
                      <select
                        value={editingStatus}
                        onChange={(e) => setEditingStatus(e.target.value as ScreeningStatus)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold text-sm bg-white"
                      >
                        <option value="Baru">Baru (Belum Direview)</option>
                        <option value="Dalam Review">Dalam Review Tim Dokter</option>
                        <option value="Selesai">Selesai (Sudah Dikabari)</option>
                        <option value="Follow-Up">Follow-Up / Jadwalkan GMeet</option>
                      </select>
                    </div>

                    <div>
                      <span className="text-xs font-bold text-slate-500 uppercase block mb-1">
                        Tingkat Risiko Terdeteksi:
                      </span>
                      <div className="pt-1.5 font-black text-sm">
                        {selectedRecord.risk_level === 'NORMAL' && (
                          <span className="text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full border border-emerald-300">
                            NORMAL 🟢
                          </span>
                        )}
                        {selectedRecord.risk_level === 'PERLU DIPERHATIKAN' && (
                          <span className="text-amber-800 bg-amber-100 px-3 py-1 rounded-full border border-amber-300">
                            PERLU DIPERHATIKAN 🟡
                          </span>
                        )}
                        {selectedRecord.risk_level === 'BUTUH PERHATIAN KHUSUS' && (
                          <span className="text-rose-800 bg-rose-100 px-3 py-1 rounded-full border border-rose-300">
                            BUTUH PERHATIAN KHUSUS 🔴
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Warning signs & problem areas */}
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                      Area Masalah / Warning Signs Teridentifikasi:
                    </h4>
                    <div className="space-y-1.5">
                      {selectedRecord.problem_areas && selectedRecord.problem_areas.length > 0 ? (
                        selectedRecord.problem_areas.map((p, idx) => (
                          <div
                            key={idx}
                            className="p-2.5 bg-rose-50/60 border border-rose-200 rounded-xl text-xs sm:text-sm font-semibold text-rose-950 flex items-center gap-2"
                          >
                            <span>{p}</span>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-slate-500">Tidak ada red flag spesifik.</p>
                      )}
                    </div>
                  </div>

                  {/* Ringkasan Kesimpulan */}
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                      Kesimpulan Awal:
                    </h4>
                    <p className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs sm:text-sm leading-relaxed text-slate-700">
                      {selectedRecord.summary || '-'}
                    </p>
                  </div>

                  {/* Cerita Kondisi Orang Tua (Khusus Asesmen Lengkap) */}
                  {selectedRecord.paid_data?.ceritaKondisi && (
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                        Cerita Langsung Dari Orang Tua (Keluhan Utama):
                      </h4>
                      <p className="p-3.5 bg-indigo-50/60 rounded-xl border border-indigo-200 text-xs sm:text-sm leading-relaxed text-indigo-950 font-medium">
                        &ldquo;{selectedRecord.paid_data.ceritaKondisi}&rdquo;
                      </p>
                    </div>
                  )}

                  {/* Catatan Dokter / Konselor Nutrisi */}
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                      Catatan Klinis Dokter / Tim Konselor (Hanya Terlihat di Admin):
                    </h4>
                    <textarea
                      rows={3}
                      value={editingNotes}
                      onChange={(e) => setEditingNotes(e.target.value)}
                      placeholder="Tuliskan rekomendasi feeding rules, hasil evaluasi oral motor, resep suplemen, atau rencana tindak lanjut..."
                      className="w-full p-3 rounded-xl border border-slate-300 focus:border-slate-900 text-xs sm:text-sm leading-relaxed"
                    />
                  </div>

                  {/* Tombol Simpan Catatan & Kirim WA */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-200">
                    <button
                      type="button"
                      onClick={handleSaveModalDetails}
                      disabled={isSavingNotes}
                      className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm rounded-xl transition-all shadow-xs"
                    >
                      {isSavingNotes ? 'Menyimpan...' : 'Simpan Status & Catatan Dokter'}
                    </button>

                    <div className="flex gap-2">
                      <a
                        href={`https://wa.me/${selectedRecord.phone.replace(/[^0-9]/g, '').replace(/^0/, '62')}?text=Halo%20Bunda%20${encodeURIComponent(
                          selectedRecord.mother_name || ''
                        )},%20kami%20dari%20Tim%20Tumbuh%20Kembang%20Anak%20&%20Ziad%20Medika.%20Hasil%20review%20asesmen%20makan%20untuk%20ananda%20${encodeURIComponent(
                          selectedRecord.child_name
                        )}%20sudah%20selesai%20kami%20analisis.`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm rounded-xl transition-all"
                      >
                        <MessageCircle className="w-4 h-4" />
                        <span>Kirim Hasil via WhatsApp Bunda</span>
                      </a>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: DATA PASIEN & ORANG TUA */}
              {activeModalTab === 'orangtua' && (
                <div className="space-y-4 animate-fade-in">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                      <h4 className="text-xs font-black uppercase text-slate-900 pb-1 border-b border-slate-200">
                        Profil Anak
                      </h4>
                      <div className="text-xs space-y-1">
                        <div>Nama: <strong className="text-slate-900">{selectedRecord.child_name}</strong></div>
                        <div>Usia: <strong className="text-slate-900">{selectedRecord.age_text}</strong></div>
                        <div>Jenis Kelamin: <strong className="text-slate-900">{selectedRecord.gender}</strong></div>
                        <div>BB Sekarang: <strong className="text-slate-900">{selectedRecord.last_weight || '-'}</strong></div>
                        <div>TB/PB: <strong className="text-slate-900">{selectedRecord.last_height || '-'}</strong></div>
                        {selectedRecord.paid_data?.dob && (
                          <div>Tanggal Lahir (DOB): <strong className="text-slate-900">{selectedRecord.paid_data.dob}</strong></div>
                        )}
                        {selectedRecord.paid_data?.bbLahir && (
                          <div>BB Lahir: <strong className="text-slate-900">{selectedRecord.paid_data.bbLahir}</strong></div>
                        )}
                        {selectedRecord.paid_data?.usiaGestasi && (
                          <div>Gestasi: <strong className="text-slate-900">{selectedRecord.paid_data.usiaGestasi}</strong></div>
                        )}
                        {selectedRecord.paid_data?.riwayatNICU && (
                          <div>Riwayat NICU: <strong className="text-slate-900">{selectedRecord.paid_data.riwayatNICU}</strong></div>
                        )}
                        {selectedRecord.paid_data?.alergiIntoleransi && (
                          <div>Alergi: <strong className="text-rose-700">{selectedRecord.paid_data.alergiIntoleransi}</strong></div>
                        )}
                      </div>
                    </div>

                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                      <h4 className="text-xs font-black uppercase text-slate-900 pb-1 border-b border-slate-200">
                        Kontak & Data Orang Tua
                      </h4>
                      <div className="text-xs space-y-1">
                        <div>Ibu: <strong className="text-slate-900">{selectedRecord.mother_name || '-'}</strong></div>
                        <div>WhatsApp Ibu: <strong className="text-slate-900">{selectedRecord.phone}</strong></div>
                        {selectedRecord.paid_data?.namaAyah && (
                          <div>Ayah: <strong className="text-slate-900">{selectedRecord.paid_data.namaAyah}</strong></div>
                        )}
                        {selectedRecord.paid_data?.waAyah && (
                          <div>WhatsApp Ayah: <strong className="text-slate-900">{selectedRecord.paid_data.waAyah}</strong></div>
                        )}
                        {selectedRecord.paid_data?.email && (
                          <div>Email: <strong className="text-slate-900">{selectedRecord.paid_data.email}</strong></div>
                        )}
                        {selectedRecord.paid_data?.domisili && (
                          <div>Domisili: <strong className="text-slate-900">{selectedRecord.paid_data.domisili}</strong></div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Feeding Rules & Habit Summary */}
                  {selectedRecord.paid_data && (
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                      <h4 className="text-xs font-black uppercase text-slate-900 pb-1 border-b border-slate-200">
                        Pola Pemberian Makan & Konsumsi Susu
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                        <div>Jenis Susu: <strong>{selectedRecord.paid_data.jenisSusu}</strong></div>
                        <div>Jumlah Susu: <strong>{selectedRecord.paid_data.jumlahSusuPerHari}</strong></div>
                        <div>Durasi Makan: <strong>{selectedRecord.paid_data.durasiMakan}</strong></div>
                        <div>Makan Sambil Gadget: <strong className="text-rose-700">{selectedRecord.paid_data.makanSambilGadget}</strong></div>
                        <div>Makan Sambil Jalan: <strong>{selectedRecord.paid_data.makanSambilJalan}</strong></div>
                        <div>Sering Dibujuk/Dipaksa: <strong className="text-rose-700">{selectedRecord.paid_data.seringDibujukDipaksa}</strong></div>
                        <div>Pemberi Makan: <strong>{selectedRecord.paid_data.pemberiMakan}</strong></div>
                        <div>Lokasi Makan: <strong>{selectedRecord.paid_data.lokasiMakan}</strong></div>
                        <div>Jadwal Makan: <strong>{selectedRecord.paid_data.jadwalMakanHarian || '-'}</strong></div>
                      </div>
                    </div>
                  )}

                  {/* Untuk Screening Gratis */}
                  {selectedRecord.free_data && (
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                      <h4 className="text-xs font-black uppercase text-slate-900 pb-1 border-b border-slate-200">
                        Data Jawaban Skrining Cepat &amp; Feeding Rules
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                        <div>Jadwal Makan Utama: <strong className="text-slate-900">{selectedRecord.free_data.jadwalMakanUtama || '-'}</strong></div>
                        <div>Jadwal Snack: <strong className="text-slate-900">{selectedRecord.free_data.jadwalSnack || '-'}</strong></div>
                        <div>Susu / ASI: <strong className="text-slate-900">{selectedRecord.free_data.susuHarian || '-'}</strong></div>
                        <div>Makan Sambil Gadget: <strong className={selectedRecord.free_data.makanSambilGadget === 'Ya' ? 'text-rose-700' : 'text-slate-900'}>{selectedRecord.free_data.makanSambilGadget || '-'}</strong></div>
                        <div>Sering Dipaksa/Dibujuk: <strong className={selectedRecord.free_data.seringDipaksaBujuk === 'Ya' ? 'text-rose-700' : 'text-slate-900'}>{selectedRecord.free_data.seringDipaksaBujuk || '-'}</strong></div>
                        <div>Diganti Susu/Snack: <strong className={selectedRecord.free_data.digantiSusuSnack === 'Ya' ? 'text-rose-700' : 'text-slate-900'}>{selectedRecord.free_data.digantiSusuSnack || '-'}</strong></div>
                        {selectedRecord.free_data.seringMenolak && (
                          <div>Sering menolak: <strong>{selectedRecord.free_data.seringMenolak}</strong></div>
                        )}
                        {selectedRecord.free_data.kesulitanKunyahTelan && (
                          <div>Sulit kunyah/telan: <strong>{selectedRecord.free_data.kesulitanKunyahTelan}</strong></div>
                        )}
                        {selectedRecord.free_data.pernahTersedak && (
                          <div>Pernah tersedak: <strong className="text-rose-700">{selectedRecord.free_data.pernahTersedak}</strong></div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: FOOD REPERTOIRE (KHUSUS BERBAYAR) */}
              {activeModalTab === 'repertoire' && selectedRecord.paid_data && (
                <div className="space-y-4 animate-fade-in">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black uppercase text-slate-900">
                      Tabel Repertoire Makanan (Diterima vs Ditolak)
                    </h4>
                    <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-md">
                      Total Ragam Diterima: {selectedRecord.paid_data.jumlahJenisDiterima || '-'}
                    </span>
                  </div>

                  <div className="border border-slate-200 rounded-2xl overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100 font-bold uppercase text-slate-700 border-b">
                        <tr>
                          <th className="p-3 w-1/4">Kelompok</th>
                          <th className="p-3 w-3/8 text-emerald-800">Makanan yang MAU</th>
                          <th className="p-3 w-3/8 text-rose-800">Makanan yang DITOLAK</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {selectedRecord.paid_data.repertoire.map((row, idx) => (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="p-3 font-bold bg-slate-50/50">{row.kategori}</td>
                            <td className="p-3 text-emerald-950 font-medium">
                              {row.makananMau || <span className="text-slate-400 italic">Tidak ada</span>}
                            </td>
                            <td className="p-3 text-rose-950 font-medium">
                              {row.makananTidakMau || <span className="text-slate-400 italic">-</span>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 4: ORAL MOTOR & SENSORIK */}
              {activeModalTab === 'oralmotor' && selectedRecord.paid_data && (
                <div className="space-y-4 animate-fade-in">
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                    <h4 className="text-xs font-black uppercase text-slate-900 pb-1 border-b border-slate-200">
                      Tekstur yang Bisa Diterima Saat Ini:
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedRecord.paid_data.teksturDiterima.map((t, idx) => (
                        <span key={idx} className="px-3 py-1 rounded-full bg-slate-900 text-white font-bold text-xs">
                          ✓ {t}
                        </span>
                      ))}
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-xs">
                      <div>Mengunyah: <strong>{selectedRecord.paid_data.bisaMengunyah}</strong></div>
                      <div>Sering Gagging: <strong className="text-rose-700">{selectedRecord.paid_data.seringGagging}</strong></div>
                      <div>Sering Batuk: <strong>{selectedRecord.paid_data.seringBatuk}</strong></div>
                      <div>Pernah Tersedak: <strong className="text-rose-700">{selectedRecord.paid_data.pernahTersedak}</strong></div>
                      <div>Melepeh: <strong>{selectedRecord.paid_data.melepehMakanan}</strong></div>
                      <div>Mengemut Lama: <strong>{selectedRecord.paid_data.lamaDiMulut}</strong></div>
                      <div>Sulit Naik Tekstur: <strong className="text-rose-700">{selectedRecord.paid_data.sulitNaikTekstur}</strong></div>
                      <div>Mau Tekstur Tertentu: <strong>{selectedRecord.paid_data.hanyaMauTeksturTertentu}</strong></div>
                    </div>
                  </div>

                  {/* Perilaku Makan & Sensorik */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                      <h4 className="text-xs font-black uppercase text-slate-900 pb-2 border-b border-slate-200 mb-2">
                        Perilaku Saat Makan Teramati:
                      </h4>
                      <ul className="text-xs space-y-1.5">
                        {selectedRecord.paid_data.perilakuMakan.map((p, idx) => (
                          <li key={idx} className="flex items-center gap-2 text-slate-800 font-semibold">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                            <span>{p}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                      <h4 className="text-xs font-black uppercase text-slate-900 pb-2 border-b border-slate-200 mb-2">
                        Pemicu Sensori Penolakan Makanan:
                      </h4>
                      <ul className="text-xs space-y-1.5">
                        {selectedRecord.paid_data.alasanSensorik.map((s, idx) => (
                          <li key={idx} className="flex items-center gap-2 text-slate-800 font-semibold">
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                            <span>{s}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 5: 24-HR FOOD RECALL */}
              {activeModalTab === 'foodrecall' && selectedRecord.paid_data && (
                <div className="space-y-3 animate-fade-in">
                  <h4 className="text-xs font-black uppercase text-slate-900">
                    Kronologi 24-Hour Food Recall (Kemarin):
                  </h4>
                  <div className="border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-100 text-xs">
                    <div className="p-3 bg-slate-50 flex justify-between">
                      <span className="font-bold text-slate-600">Bangun Tidur (Susu)</span>
                      <span className="font-semibold text-slate-900">{selectedRecord.paid_data.foodRecall.bangunSusu || '-'}</span>
                    </div>
                    <div className="p-3 flex justify-between">
                      <span className="font-bold text-slate-600">Sarapan Pagi</span>
                      <span className="text-right">
                        <strong>{selectedRecord.paid_data.foodRecall.sarapanMenu || '-'}</strong> (Porsi: {selectedRecord.paid_data.foodRecall.sarapanPorsi || '-'})
                      </span>
                    </div>
                    <div className="p-3 bg-slate-50 flex justify-between">
                      <span className="font-bold text-slate-600">Snack Pagi</span>
                      <span className="text-right">
                        <strong>{selectedRecord.paid_data.foodRecall.snackPagiMenu || '-'}</strong> (Porsi: {selectedRecord.paid_data.foodRecall.snackPagiPorsi || '-'})
                      </span>
                    </div>
                    <div className="p-3 flex justify-between">
                      <span className="font-bold text-slate-600">Makan Siang</span>
                      <span className="text-right">
                        <strong>{selectedRecord.paid_data.foodRecall.makanSiangMenu || '-'}</strong> (Porsi: {selectedRecord.paid_data.foodRecall.makanSiangPorsi || '-'})
                      </span>
                    </div>
                    <div className="p-3 bg-slate-50 flex justify-between">
                      <span className="font-bold text-slate-600">Snack Sore</span>
                      <span className="text-right">
                        <strong>{selectedRecord.paid_data.foodRecall.snackSoreMenu || '-'}</strong> (Porsi: {selectedRecord.paid_data.foodRecall.snackSorePorsi || '-'})
                      </span>
                    </div>
                    <div className="p-3 flex justify-between">
                      <span className="font-bold text-slate-600">Makan Malam</span>
                      <span className="text-right">
                        <strong>{selectedRecord.paid_data.foodRecall.makanMalamMenu || '-'}</strong> (Porsi: {selectedRecord.paid_data.foodRecall.makanMalamPorsi || '-'})
                      </span>
                    </div>
                    <div className="p-3 bg-slate-50 flex justify-between">
                      <span className="font-bold text-slate-600">Menjelang Tidur (Susu)</span>
                      <span className="font-semibold text-slate-900">{selectedRecord.paid_data.foodRecall.susuSebelumTidur || '-'}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 6: RIWAYAT BERAT BADAN */}
              {activeModalTab === 'riwayatbb' && selectedRecord.paid_data && (
                <div className="space-y-4 animate-fade-in">
                  <h4 className="text-xs font-black uppercase text-slate-900">
                    Riwayat Berat Badan & Pertumbuhan
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="text-[11px] text-slate-500 block">BB 3 Bulan Lalu</span>
                      <span className="text-base font-black text-slate-800">{selectedRecord.paid_data.riwayatBB.bb3BulanLalu || '-'}</span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="text-[11px] text-slate-500 block">BB 2 Bulan Lalu</span>
                      <span className="text-base font-black text-slate-800">{selectedRecord.paid_data.riwayatBB.bb2BulanLalu || '-'}</span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="text-[11px] text-slate-500 block">BB 1 Bulan Lalu</span>
                      <span className="text-base font-black text-slate-800">{selectedRecord.paid_data.riwayatBB.bb1BulanLalu || '-'}</span>
                    </div>
                    <div className="p-3 bg-slate-900 text-white rounded-xl">
                      <span className="text-[11px] text-slate-400 block">BB Sekarang</span>
                      <span className="text-base font-black text-[#ccff00]">{selectedRecord.paid_data.riwayatBB.bbSekarang || '-'}</span>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5">
                    <div>Status BB Stagnan: <strong className="text-rose-700">{selectedRecord.paid_data.riwayatBB.bbStagnan}</strong></div>
                    <div>Pernah Turun BB: <strong>{selectedRecord.paid_data.riwayatBB.pernahTurunBB}</strong></div>
                    <div>Target Kenaikan BB: <strong>{selectedRecord.paid_data.riwayatBB.targetBB || '-'}</strong></div>
                  </div>
                </div>
              )}

              {/* TAB 7: MASTER PROMPT AI (DENGAN FILTER KHUSUS & FORMAT HTML A4) */}
              {activeModalTab === 'masterprompt' && (
                <div className="space-y-5 animate-fade-in">
                  {/* HEADER & FILTER KHUSUS BAGIAN */}
                  <div className="bg-slate-900 text-white p-4 sm:p-5 rounded-2xl border border-slate-800 shadow-md space-y-3.5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                      <div className="space-y-1">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#ccff00] text-slate-950 text-[10px] font-black uppercase tracking-wider">
                          <Sparkles className="w-3 h-3" />
                          <span>Filter Khusus Prompt Master · Format Teks Klinis Terstruktur</span>
                        </div>
                        <h4 className="text-base sm:text-lg font-black text-white">
                          Pilih Bagian yang Ingin Dianalisis AI:
                        </h4>
                        <p className="text-xs text-slate-300">
                          Sumber data difilter khusus sesuai bagian (cukup biodata anak &amp; orang tua + data relevan). AI diinstruksikan secara tegas untuk <strong>HANYA menghasilkan bagian yang Anda pilih</strong> dalam format <strong>teks Markdown klinis rapi (Bukan HTML)</strong> dan evaluasi status nutrisi sesuai <strong>BB Aktual &amp; Usia</strong>.
                        </p>
                      </div>

                      <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
                        <button
                          type="button"
                          onClick={() => setShowA4PreviewModal(true)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-all border border-white/10 active:scale-95"
                          title="Lihat simulasi dokumen klinis"
                        >
                          <Eye className="w-3.5 h-3.5 text-[#ccff00]" />
                          <span>Pratinjau Format Teks</span>
                        </button>
                      </div>
                    </div>

                    {/* SEGMENTED FILTER BUTTONS UNTUK 4 BAGIAN + SEMUA */}
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1 border-t border-slate-800">
                      {PROMPT_SECTIONS.map((sec) => {
                        const isSelected = selectedPromptSection === sec.id;
                        return (
                          <button
                            key={sec.id}
                            type="button"
                            onClick={() => setSelectedPromptSection(sec.id)}
                            className={`p-2.5 rounded-xl text-left transition-all relative flex flex-col justify-between border ${
                              isSelected
                                ? 'bg-[#ccff00] text-slate-950 border-[#ccff00] shadow-sm font-black'
                                : 'bg-slate-800/80 hover:bg-slate-800 text-slate-200 border-slate-700/60 font-semibold'
                            }`}
                          >
                            <div className="flex items-center justify-between w-full mb-1">
                              <span className="text-xs tracking-tight">
                                {sec.id === 'resume' && '📋 '}
                                {sec.id === 'status_nutrisi' && '🥗 '}
                                {sec.id === 'meal_plan' && '🍱 '}
                                {sec.id === 'actionable_2weeks' && '🎯 '}
                                {sec.id === 'all' && '⚡ '}
                                {sec.shortTitle}
                              </span>
                              {isSelected && (
                                <CheckCircle2 className="w-3.5 h-3.5 text-slate-950 shrink-0" />
                              )}
                            </div>
                            <span
                              className={`text-[10px] uppercase font-bold truncate ${
                                isSelected ? 'text-slate-800' : 'text-slate-400'
                              }`}
                            >
                              {sec.badge}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* ACTIVE SECTION ACTION PANEL */}
                  {(() => {
                    const activeMeta =
                      PROMPT_SECTIONS.find((s) => s.id === selectedPromptSection) ||
                      PROMPT_SECTIONS[0];
                    const activePromptText = generateSectionPrompt(
                      selectedPromptSection,
                      getRecordPromptData(selectedRecord),
                      selectedRecord.age_text
                    );
                    const isCopied =
                      copiedSectionKey === `${selectedRecord.id}_${selectedPromptSection}`;

                    return (
                      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs space-y-4">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <h5 className="text-sm sm:text-base font-black text-slate-900">
                                Prompt Master Khusus: {activeMeta.title}
                              </h5>
                              <span className="text-[10px] font-bold bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-200">
                                Format Teks Klinis Rapi (Bukan HTML)
                              </span>
                            </div>
                            <p className="text-xs text-slate-600 leading-relaxed max-w-2xl">
                              {activeMeta.description}
                            </p>
                          </div>

                          {/* ACTION BUTTONS: COPY, PREVIEW, DOWNLOAD */}
                          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto shrink-0">
                            <button
                              type="button"
                              onClick={() =>
                                handleCopySectionPrompt(selectedRecord, selectedPromptSection)
                              }
                              className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-black text-xs sm:text-sm transition-all shadow-md active:scale-95 ${
                                isCopied
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-[#ccff00] hover:bg-[#b8e600] text-slate-950'
                              }`}
                            >
                              {isCopied ? (
                                <>
                                  <CheckCircle2 className="w-4 h-4 text-white" />
                                  <span>Prompt Tersalin! ✅</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-4 h-4" />
                                  <span>Salin Prompt Master {activeMeta.shortTitle}</span>
                                </>
                              )}
                            </button>

                            <button
                              type="button"
                              onClick={() => setShowA4PreviewModal(true)}
                              className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-xs transition-colors inline-flex items-center gap-1.5"
                              title="Pratinjau tampilan format teks klinis"
                            >
                              <Eye className="w-3.5 h-3.5 text-slate-700" />
                              <span className="hidden sm:inline">Pratinjau Format</span>
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                handleDownloadPrompt(selectedRecord, selectedPromptSection)
                              }
                              className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors"
                              title="Unduh sebagai file .txt"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* SPESIFIKASI ATURAN PROMPT */}
                        <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl text-xs text-emerald-950 flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                            <span>
                              <strong>Aturan Format Hasil:</strong> Teks Markdown Klinis Rapi (BUKAN HTML), evaluasi status nutrisi &amp; koreksi berdasarkan <strong>BB Aktual ({selectedRecord.last_weight || '-'})</strong> dan <strong>Usia ({selectedRecord.age_text})</strong>, data input terarah per bagian.
                            </span>
                          </div>
                          <span className="text-[11px] font-mono text-emerald-800">
                            Panjang Teks: ~{activePromptText.length.toLocaleString('id-ID')} karakter
                          </span>
                        </div>

                        {/* TEXT PREVIEW BOX */}
                        <div className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-50">
                          <div className="px-4 py-2 bg-slate-100 border-b border-slate-200 flex items-center justify-between text-xs text-slate-600 font-bold">
                            <span className="flex items-center gap-1.5">
                              <Code2 className="w-3.5 h-3.5 text-indigo-600" />
                              <span>Kode Prompt Terisi Data Pasien (Siap Disalin ke AI):</span>
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                handleCopySectionPrompt(selectedRecord, selectedPromptSection)
                              }
                              className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1"
                            >
                              <Copy className="w-3 h-3" />
                              <span>Klik Salin Cepat</span>
                            </button>
                          </div>

                          <pre className="p-4 text-xs font-mono text-slate-800 bg-white whitespace-pre-wrap leading-relaxed max-h-[520px] overflow-y-auto select-all selection:bg-[#ccff00] selection:text-slate-950">
                            {activePromptText}
                          </pre>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
              <span className="text-xs text-slate-500">
                Klinik Tumbuh Kembang Anak & Ziad Medika · Dokumen Rekam Medis Rahasia
              </span>
              <button
                type="button"
                onClick={() => setSelectedRecord(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs rounded-lg transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL PRATINJAU DOKUMEN HTML A4 (SIMULASI CETAK & SAFE AREA) ================= */}
      {showA4PreviewModal && selectedRecord && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex flex-col p-2 sm:p-5 overflow-hidden animate-fade-in">
          <div className="bg-white w-full max-w-5xl mx-auto rounded-3xl shadow-2xl border border-slate-200 flex flex-col flex-1 overflow-hidden">
            {/* Top Bar Modal */}
            <div className="p-3.5 sm:p-4 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-3 shrink-0 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-[#ccff00] text-slate-950 rounded-xl font-black">
                  <FileText className="w-5 h-5 text-slate-950" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm sm:text-base font-black text-white">
                      Pratinjau Format Dokumen Klinis Terstruktur (Simulasi AI)
                    </h3>
                    <span className="text-[10px] bg-[#ccff00] text-slate-950 font-black px-2 py-0.5 rounded-full uppercase">
                      BB Aktual &amp; Data Terarah
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300">
                    Pasien: <strong>{selectedRecord.child_name}</strong> ({selectedRecord.age_text}) · Format Teks Markdown Klinis (Bebas Kode HTML)
                  </p>
                </div>
              </div>

              {/* Action Buttons in Modal Top Bar */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    handleCopySectionPrompt(selectedRecord, selectedPromptSection)
                  }
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#ccff00] hover:bg-[#b8e600] text-slate-950 font-black rounded-xl text-xs transition-all shadow-md active:scale-95"
                >
                  {copiedSectionKey === `${selectedRecord.id}_${selectedPromptSection}` ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-slate-950" />
                      <span>Prompt Tersalin! ✅</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Salin Prompt Master</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => window.print()}
                  className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-all"
                  title="Cetak atau simpan sebagai file PDF"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Cetak / PDF</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowA4PreviewModal(false)}
                  className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Subheader: Filter Bagian di dalam Modal Pratinjau */}
            <div className="p-2.5 sm:p-3 bg-slate-100 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 shrink-0">
              <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
                <span className="text-slate-500 font-bold text-[11px] uppercase mr-1">Bagian:</span>
                {PROMPT_SECTIONS.map((sec) => (
                  <button
                    key={sec.id}
                    type="button"
                    onClick={() => setSelectedPromptSection(sec.id)}
                    className={`px-3 py-1.5 rounded-lg font-bold transition-all shrink-0 ${
                      selectedPromptSection === sec.id
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
                    }`}
                  >
                    {sec.shortTitle}
                  </button>
                ))}
              </div>

              {/* Safe area indicator badge */}
              <div className="inline-flex items-center gap-2 text-[11px] text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                <span>Margin Aman: Atas 22mm &amp; Bawah 22mm (Tidak Terpotong Saat Cetak)</span>
              </div>
            </div>

            {/* Scrollable Preview Canvas (Menyerupai Kertas A4 Nyata) */}
            <div className="p-4 sm:p-8 bg-slate-200/80 overflow-y-auto flex-1">
              <div
                className="max-w-[210mm] min-h-[297mm] mx-auto bg-white text-slate-900 shadow-2xl rounded-sm p-6 sm:p-12 space-y-6 relative border border-slate-300"
                style={{
                  boxSizing: 'border-box',
                }}
              >
                {/* Visual Safe Area Guide Banners */}
                <div className="absolute top-2 left-6 right-6 border-b border-dashed border-emerald-400 text-[10px] text-emerald-700 font-bold tracking-wider uppercase text-center pb-0.5 pointer-events-none opacity-60">
                  ↑ Batas Safe Area Atas (22mm) ↑
                </div>

                {/* KOP RESMI KLINIK (SAFE AREA ATAS) */}
                <div className="border-b-2 border-slate-900 pb-3 flex flex-col sm:flex-row sm:items-end justify-between gap-3 pt-2">
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-black text-indigo-700 tracking-wider block">
                      Layanan Tumbuh Kembang Anak &amp; Pediatric Feeding Problem
                    </span>
                    <h2 className="text-base sm:text-xl font-black text-slate-900 tracking-tight">
                      KLINIK ZIAD MEDIKA &amp; TUMBUH KEMBANG ANAK
                    </h2>
                    <p className="text-[11px] text-slate-600">
                      Didampingi Dokter Spesialis Anak &amp; Tim Konselor Nutrisi · Cirebon &amp; Sekitarnya
                    </p>
                  </div>
                  <div className="text-left sm:text-right text-[11px] text-slate-600">
                    <div>No. RM: <strong>RM-{selectedRecord.id.slice(-6).toUpperCase()}</strong></div>
                    <div>Tgl Evaluasi: <strong>{formatDateString(selectedRecord.created_at)}</strong></div>
                  </div>
                </div>

                {/* IDENTITAS PASIEN LENGKAP */}
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div>
                    <span className="text-[10px] uppercase text-slate-400 block font-bold">Nama Pasien:</span>
                    <strong className="text-slate-900">{selectedRecord.child_name}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase text-slate-400 block font-bold">Usia / Gender:</span>
                    <strong className="text-slate-900">{selectedRecord.age_text} · {selectedRecord.gender}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase text-slate-400 block font-bold">BB &amp; TB Saat Ini:</span>
                    <strong className="text-slate-900">{selectedRecord.last_weight || '-'} · {selectedRecord.last_height || '-'}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase text-slate-400 block font-bold">Orang Tua / Kontak:</span>
                    <strong className="text-slate-900">{selectedRecord.mother_name || '-'} ({selectedRecord.phone})</strong>
                  </div>
                </div>

                {/* KONTEN SESUAI BAGIAN YANG DIPILIH */}
                {selectedPromptSection === 'resume' && (
                  <div className="space-y-4">
                    <div className="inline-block px-3 py-1 bg-indigo-50 border border-indigo-200 text-indigo-900 font-black text-xs uppercase rounded-lg">
                      1. RESUME KONDISI ANAK (REKAM MEDIS KLINIS)
                    </div>

                    <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
                      <h4 className="font-black text-slate-900 uppercase text-[11px]">A. Evaluasi Pertumbuhan &amp; Riwayat Lahir:</h4>
                      <p className="text-slate-700 leading-relaxed">
                        Ananda {selectedRecord.child_name} ({selectedRecord.age_text}) saat ini memiliki berat badan {selectedRecord.last_weight || '-'} dan tinggi badan {selectedRecord.last_height || '-'}.
                        {selectedRecord.paid_data?.bbLahir && ` Lahir dengan berat ${selectedRecord.paid_data.bbLahir}, usia gestasi ${selectedRecord.paid_data.usiaGestasi || '-'}.`}
                        {selectedRecord.paid_data?.alergiIntoleransi && ` Terdapat riwayat alergi: ${selectedRecord.paid_data.alergiIntoleransi}.`}
                      </p>
                    </div>

                    <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
                      <h4 className="font-black text-slate-900 uppercase text-[11px]">B. Profil Pola Makan &amp; Feeding Rules:</h4>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        <div>Frekuensi Makan: <strong>{selectedRecord.paid_data?.frekuensiMakanUtama || selectedRecord.free_data?.jadwalMakanUtama || '-'}</strong></div>
                        <div>Snack Harian: <strong>{selectedRecord.paid_data?.frekuensiSnack || selectedRecord.free_data?.jadwalSnack || '-'}</strong></div>
                        <div>Susu: <strong>{selectedRecord.paid_data?.jumlahSusuPerHari || selectedRecord.free_data?.susuHarian || '-'}</strong></div>
                        <div>Gadget Saat Makan: <strong className="text-rose-700">{selectedRecord.paid_data?.makanSambilGadget || selectedRecord.free_data?.makanSambilGadget || '-'}</strong></div>
                        <div>Paksaan / Bujukan: <strong className="text-rose-700">{selectedRecord.paid_data?.seringDibujukDipaksa || selectedRecord.free_data?.seringDipaksaBujuk || '-'}</strong></div>
                        <div>Durasi Makan: <strong>{selectedRecord.paid_data?.durasiMakan || '-'}</strong></div>
                      </div>
                    </div>

                    <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
                      <h4 className="font-black text-slate-900 uppercase text-[11px]">C. Ringkasan 5 Masalah Utama (Root Cause):</h4>
                      <ol className="list-decimal list-inside space-y-1 text-slate-800 font-medium">
                        <li>Konsistensi jadwal makan utama dan snack yang berjarak 2-3 jam tanpa distraksi.</li>
                        <li>Sensitivitas tekstur oral-motor dan kecenderungan melepeh atau mengemut.</li>
                        <li>Keterbatasan variasi food repertoire kelompok protein hewani dan sayuran.</li>
                        <li>Ketergantungan terhadap distraksi gadget / jalan-jalan selama proses makan.</li>
                        <li>Regulasi asupan susu agar tidak menekan nafsu makan makanan padat.</li>
                      </ol>
                    </div>

                    <div className="p-3.5 bg-indigo-50/60 border border-indigo-200 rounded-xl space-y-1 text-xs">
                      <h4 className="font-black text-indigo-950 uppercase text-[11px]">D. Kesimpulan Klinis Tim Dokter:</h4>
                      <p className="text-indigo-900 leading-relaxed">
                        Berdasarkan integrasi data pertumbuhan, kebiasaan feeding rules, dan sensori oral-motor, ananda membutuhkan intervensi terstruktur 14 hari yang berfokus pada perbaikan lingkungan makan dan peningkatan densitas kalori secara bertahap tanpa paksaan.
                      </p>
                    </div>
                  </div>
                )}

                {selectedPromptSection === 'status_nutrisi' && (
                  <div className="space-y-4">
                    <div className="inline-block px-3 py-1 bg-emerald-50 border border-emerald-200 text-emerald-900 font-black text-xs uppercase rounded-lg">
                      2. EVALUASI STATUS NUTRISI &amp; PERTUMBUHAN ANAK
                    </div>

                    <div className="border border-slate-200 rounded-xl overflow-hidden">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-100 font-bold uppercase text-slate-700">
                          <tr>
                            <th className="p-2.5">Parameter Gizi</th>
                            <th className="p-2.5">Nilai Pengukuran</th>
                            <th className="p-2.5">Status Klinis</th>
                            <th className="p-2.5">Target &amp; Intervensi</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          <tr>
                            <td className="p-2.5 font-bold">Berat Badan Saat Ini</td>
                            <td className="p-2.5">{selectedRecord.last_weight || '-'}</td>
                            <td className="p-2.5 text-amber-800 font-semibold">Perlu Pemantauan</td>
                            <td className="p-2.5 text-slate-600">Target +200-300 gr/bulan</td>
                          </tr>
                          <tr>
                            <td className="p-2.5 font-bold">Tinggi / Panjang Badan</td>
                            <td className="p-2.5">{selectedRecord.last_height || '-'}</td>
                            <td className="p-2.5 text-emerald-800 font-semibold">Sesuai Usia</td>
                            <td className="p-2.5 text-slate-600">Pertahankan kurva PB/TB</td>
                          </tr>
                          <tr>
                            <td className="p-2.5 font-bold">Asupan Susu Harian</td>
                            <td className="p-2.5">{selectedRecord.paid_data?.jumlahSusuPerHari || selectedRecord.free_data?.susuHarian || '-'}</td>
                            <td className="p-2.5 text-slate-800">Evaluasi Rasio Kalori</td>
                            <td className="p-2.5 text-slate-600">Maksimal 400-500 ml/hari</td>
                          </tr>
                          <tr>
                            <td className="p-2.5 font-bold">Rasio Makronutrien</td>
                            <td className="p-2.5">Karbo, Prohe, Lemak</td>
                            <td className="p-2.5 text-slate-800">Defisit Protein &amp; Lemak</td>
                            <td className="p-2.5 text-slate-600">Tambahkan lemak sehat &amp; prohe padat</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
                      <h4 className="font-black text-slate-900 uppercase text-[11px]">Analisis 24-Hour Food Recall &amp; Mikronutrien:</h4>
                      <p className="text-slate-700 leading-relaxed">
                        Data food recall menunjukkan frekuensi makan utama belum teratur dan porsi makan masih sedikit. Diperlukan penambahan densitas kalori (double protein &amp; lemak sehat) serta suplementasi mikronutrien (zat besi dan zinc) bila diindikasikan oleh dokter anak.
                      </p>
                    </div>
                  </div>
                )}

                {selectedPromptSection === 'meal_plan' && (
                  <div className="space-y-4">
                    <div className="inline-block px-3 py-1 bg-amber-50 border border-amber-200 text-amber-900 font-black text-xs uppercase rounded-lg">
                      3. MEAL PLAN 7 HARI — VARIASI &amp; FOOD CHAINING
                    </div>

                    <div className="border border-slate-200 rounded-xl overflow-hidden">
                      <table className="w-full text-left text-[11px]">
                        <thead className="bg-slate-100 font-bold uppercase text-slate-700">
                          <tr>
                            <th className="p-2 w-16">Hari</th>
                            <th className="p-2">Sarapan (07.00)</th>
                            <th className="p-2">Snack Pagi (09.30)</th>
                            <th className="p-2">Makan Siang (12.00)</th>
                            <th className="p-2">Snack Sore (15.30)</th>
                            <th className="p-2">Makan Malam (18.30)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {[
                            { h: 'Hari 1', s: 'Nasi Tim Ayam Suwir + Kaldu', sn1: 'Puding Buah Naga', ms: 'Bubur Kasar Daging Cincang + Wortel', sn2: 'Pisang Kukus Keju', mm: 'Nasi Lunak Telur Orak-Arik Mentega' },
                            { h: 'Hari 2', s: 'Roti Panggang Telur Keju', sn1: 'Alpukat Keruk Susu', ms: 'Nasi Tim Ikan Kembung Sup Jagung', sn2: 'Biskuit Balita + ASI/Sufor', mm: 'Nasi Lunak Ayam Cincang Santan Gurih' },
                            { h: 'Hari 3', s: 'Nasi Uduk Gurih Telur Dadar', sn1: 'Puree Pepaya Jeruk', ms: 'Nasi Tim Hati Ayam Sup Bayam', sn2: 'Kue Lumpur Labu Kuning', mm: 'Nasi Lunak Tahu Daging Kukus' },
                            { h: 'Hari 4', s: 'Bubur Manado Ikan Tongkol', sn1: 'Yogurt Plain + Madu/Buah', ms: 'Nasi Tim Semur Daging Sapi Lunak', sn2: 'Ubi Manis Kukus Keju', mm: 'Nasi Lunak Sup Ayam Kampung Berkaldu' },
                            { h: 'Hari 5', s: 'Pancake Pisang Oat Telur', sn1: 'Melon Potong Dingin', ms: 'Nasi Tim Salmon Brokoli Mentega', sn2: 'Puding Roti Panggang', mm: 'Nasi Lunak Rolade Daging Homemade' },
                            { h: 'Hari 6', s: 'Nasi Tim Opor Ayam Santan', sn1: 'Mangga Manis Potong', ms: 'Nasi Tim Bakso Daging Halus Sup Sayur', sn2: 'Perkedel Kentang Ayam Mini', mm: 'Nasi Lunak Telur Puyuh Kuah Kuning' },
                            { h: 'Hari 7', s: 'Nasi Goreng Mentega Ayam Suwir', sn1: 'Smoothie Buah Naga Pisang', ms: 'Nasi Tim Empal Suwir Sup Labu Siam', sn2: 'Kukus Jagung Manis Keju', mm: 'Nasi Lunak Daging Cincang Teriyaki Lembut' },
                          ].map((row, idx) => (
                            <tr key={idx} className="hover:bg-slate-50">
                              <td className="p-2 font-bold text-slate-900 bg-slate-50">{row.h}</td>
                              <td className="p-2">{row.s}</td>
                              <td className="p-2 text-slate-600">{row.sn1}</td>
                              <td className="p-2">{row.ms}</td>
                              <td className="p-2 text-slate-600">{row.sn2}</td>
                              <td className="p-2">{row.mm}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700">
                      <strong>Strategi Food Chaining:</strong> Perkenalkan bahan makanan baru bersanding dengan menu yang sudah diterima ananda. Jangan memaksa anak menghabiskan jika tampak menolak; simpan makanan dan tawarkan kembali di jadwal berikutnya.
                    </div>
                  </div>
                )}

                {selectedPromptSection === 'actionable_2weeks' && (
                  <div className="space-y-4">
                    <div className="inline-block px-3 py-1 bg-rose-50 border border-rose-200 text-rose-900 font-black text-xs uppercase rounded-lg">
                      4. ACTIONABLE PLAN 14 HARI (PROTOKOL FEEDING RULES IDAI)
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                        <span className="font-black text-indigo-700 uppercase text-[10px]">Fase 1 · Hari 1–3</span>
                        <h5 className="font-bold text-slate-900">Reset Feeding Environment</h5>
                        <p className="text-slate-600">Disiplin jadwal makan (jeda 2 jam tanpa cemilan/susu), matikan TV &amp; gadget 100%, duduk di kursi makan, durasi maksimal 30 menit.</p>
                      </div>

                      <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                        <span className="font-black text-indigo-700 uppercase text-[10px]">Fase 2 · Hari 4–6</span>
                        <h5 className="font-bold text-slate-900">Improve Meal Structure</h5>
                        <p className="text-slate-600">Atur porsi realistis, jangan panik saat anak menolak, hindari memberikan susu sebagai kompensasi makanan yang tidak habis.</p>
                      </div>

                      <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                        <span className="font-black text-indigo-700 uppercase text-[10px]">Fase 3 · Hari 7–10</span>
                        <h5 className="font-bold text-slate-900">Food Exposure Berjenjang</h5>
                        <p className="text-slate-600">Perkenalkan makanan baru secara sensorik: Lihat → Sentuh → Cium → Cicip tanpa tekanan, dampingi dengan makanan kesukaan.</p>
                      </div>

                      <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                        <span className="font-black text-indigo-700 uppercase text-[10px]">Fase 4 · Hari 11–14</span>
                        <h5 className="font-bold text-slate-900">Progression &amp; Evaluasi</h5>
                        <p className="text-slate-600">Dorong kemandirian makan (self-feeding), evaluasi peningkatan durasi dan variasi tekstur, serta timbang berat badan pada Hari 14.</p>
                      </div>
                    </div>

                    {/* RED FLAGS BOX */}
                    <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-950 space-y-1">
                      <strong className="text-rose-800 uppercase font-black text-[11px] block">
                        ⚠️ Tanda Bahaya (Segera Konsultasi Langsung):
                      </strong>
                      <p>
                        Jika anak sering tersedak, batuk berulang saat menelan, muntah proyektil, berat badan turun signifikan, atau tampak sesak napas setelah makan, segera lakukan evaluasi medis tatap muka ke dokter spesialis anak.
                      </p>
                    </div>
                  </div>
                )}

                {selectedPromptSection === 'all' && (
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 space-y-2">
                    <strong className="text-slate-900 font-bold block">Master Prompt Lengkap (10 Bagian):</strong>
                    <p>
                      Menghasilkan seluruh rangkaian evaluasi medis: Resume Kondisi Anak, Status Nutrisi &amp; Pertumbuhan, Jawaban Dokter, Meal Plan 7 Hari, Actionable 14 Hari, Target, Monitoring, dan Red Flags dalam satu dokumen HTML A4 multi-halaman.
                    </p>
                  </div>
                )}

                {/* VERIFIKASI DOKTER & FOOTER KOP (SAFE AREA BAWAH) */}
                <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-slate-600">
                  <div className="space-y-0.5">
                    <div className="font-bold text-slate-900">Klinik Ziad Medika &amp; Tumbuh Kembang Anak</div>
                    <div className="text-[11px] text-slate-500">Dokumen Rekam Medis Rahasia · Hak Cipta Dilindungi</div>
                  </div>

                  <div className="text-left sm:text-right space-y-1 pt-2 sm:pt-0">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Diverifikasi Oleh:</span>
                    <div className="font-black text-slate-900">Tim Dokter Spesialis Anak &amp; Konselor Nutrisi</div>
                    <div className="text-[10px] text-slate-500 font-mono">SIP: Terdaftar &amp; Terverifikasi</div>
                  </div>
                </div>

                <div className="absolute bottom-2 left-6 right-6 border-t border-dashed border-emerald-400 text-[10px] text-emerald-700 font-bold tracking-wider uppercase text-center pt-0.5 pointer-events-none opacity-60">
                  ↓ Batas Safe Area Bawah (22mm) ↓
                </div>
              </div>
            </div>

            {/* Bottom Bar Modal */}
            <div className="p-3 bg-slate-100 border-t border-slate-200 flex items-center justify-between shrink-0 text-xs text-slate-600">
              <span>
                💡 Klik <strong>Salin Prompt Master</strong> di atas untuk menjalankan prompt ini di ChatGPT, Claude, atau Gemini.
              </span>
              <button
                type="button"
                onClick={() => setShowA4PreviewModal(false)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition-colors"
              >
                Tutup Pratinjau
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL SQL SETUP SUPABASE ================= */}
      {showSqlModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Database className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-black text-slate-900">
                  Script Setup Supabase (Tabel Screenings)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowSqlModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-800 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Jalankan query ini sekali saja di <strong>SQL Editor</strong> dashboard Supabase Anda (<code>{SUPABASE_REST_URL}</code>) agar semua data tersimpan permanen di cloud:
            </p>

            <pre className="p-4 bg-slate-900 text-slate-200 rounded-xl text-xs font-mono overflow-x-auto max-h-64 leading-relaxed">
              {SUPABASE_SQL_SETUP}
            </pre>

            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-slate-500">
                Aplikasi juga dilengkapi penyimpanan lokal otomatis sebagai fallback.
              </span>
              <button
                type="button"
                onClick={handleCopySql}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-[#ccff00] rounded-xl font-bold text-xs transition-all shadow-xs"
              >
                {copySuccess ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-[#ccff00]" />
                    <span>Tersalin ke Clipboard!</span>
                  </>
                ) : (
                  <>
                    <Code2 className="w-4 h-4" />
                    <span>Salin Script SQL</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
