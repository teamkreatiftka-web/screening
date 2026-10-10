'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Navbar } from '@/components/Navbar';
import { PaidScreeningForm } from '@/components/PaidScreeningForm';
import { Footer } from '@/components/Footer';
import {
  Sparkles,
  Stethoscope,
  Clock,
  ArrowLeft,
  CheckCircle2,
} from 'lucide-react';

export default function AssessmentPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
      {/* Top Navbar */}
      <Navbar />

      {/* Hero Header Khusus Assessment Lengkap */}
      <section className="bg-white border-b border-slate-200 py-6 sm:py-10">
        <div className="max-w-4xl mx-auto px-3 sm:px-6">
          <div className="flex items-center gap-2 mb-3">
            <Link
              href="/"
              className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Kembali ke Skrining Singkat (Gratis)</span>
            </Link>
          </div>

          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            <div className="flex-1 space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-950 text-[#ccff00] text-[11px] sm:text-xs font-black uppercase tracking-wider mb-1">
                <Sparkles className="w-3 h-3 text-[#ccff00]" />
                <span>Asesmen Mendalam 10 Bagian (Berbayar)</span>
              </div>

              <h1 className="text-xl sm:text-3xl font-black text-slate-900 tracking-tight leading-tight">
                Asesmen Rekam Medis Masalah Makan Anak
              </h1>
              <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed max-w-2xl">
                Instrumen klinis komprehensif untuk menganalisis <strong>Food Repertoire</strong>, adaptasi tekstur oral-motor, <strong>24-Hour Food Recall</strong>, serta kurva pertumbuhan berat badan anak usia 0–5 tahun.
              </p>

              <div className="mt-4 flex flex-wrap gap-2 text-[11px] sm:text-xs font-semibold text-slate-700 pt-1">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 rounded-lg">
                  <Stethoscope className="w-3.5 h-3.5 text-blue-600" />
                  Review Tim Dokter &amp; Ahli Gizi
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 rounded-lg">
                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                  Proses Review 3–5 Hari Kerja
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 rounded-lg">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Hasil Dikirim via WhatsApp
                </span>
              </div>
            </div>

            {/* Poster Uncropped (1092 x 1440) */}
            <div className="w-36 sm:w-44 shrink-0 bg-slate-50 p-1.5 rounded-2xl border border-slate-200 shadow-xs">
              <Image
                src="https://cdn.scalev.com/uploads/1791258963/M3FyLHewUMMywnWXpbi7Iw/1791258961341-e7950a0d-66ea-414c-8b17-60c2369af36b.webp"
                alt="Asesmen Rekam Medis Lengkap 10 Bagian"
                width={1092}
                height={1440}
                className="w-full h-auto object-contain rounded-xl"
                priority
                referrerPolicy="no-referrer"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Main Assessment Form */}
      <main className="flex-1 pb-16">
        <PaidScreeningForm />
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
