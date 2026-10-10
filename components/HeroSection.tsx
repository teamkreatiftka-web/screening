'use client';

import React from 'react';
import {
  Stethoscope,
  Users2,
  AlertTriangle,
} from 'lucide-react';

export function HeroSection() {
  return (
    <section className="relative overflow-hidden pt-3 sm:pt-8 pb-4 sm:pb-8 bg-linear-to-b from-white via-slate-50 to-[#F8FAFC]">
      <div className="max-w-4xl mx-auto px-3 sm:px-6 lg:px-8 text-center">
        {/* Top notification pill */}
        <div className="flex justify-center mb-2 sm:mb-3">
          <div className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full bg-slate-900 text-white text-[10px] sm:text-xs font-semibold shadow-2xs">
            <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-[#ccff00] animate-pulse" />
            <span className="leading-tight">Tools Skrining Masalah Makan Anak Usia 0–5 Tahun</span>
          </div>
        </div>

        {/* Main Header */}
        <h1 className="text-lg sm:text-2xl md:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight leading-snug sm:leading-tight text-balance">
          Dicari! <span className="bg-linear-to-r from-slate-950 via-indigo-950 to-slate-800 bg-clip-text text-transparent">PARENTS</span> yang Mau Dampingi Masalah Makan Anak agar Lebih Optimal!
        </h1>
        <p className="mt-1.5 sm:mt-2 text-[11px] sm:text-sm md:text-base text-slate-600 font-normal leading-relaxed text-balance max-w-2xl mx-auto px-1">
          Kenali apakah si kecil mengalami GTM, picky eating, adaptasi tekstur, atau risiko nutrisi menurut panduan Ikatan Dokter Anak Indonesia (IDAI).
        </p>

        {/* Quick value badges */}
        <div className="mt-2.5 sm:mt-3.5 flex flex-wrap items-center justify-center gap-1.5 sm:gap-2.5 text-[10px] sm:text-xs font-semibold text-slate-700">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 sm:px-2.5 sm:py-1 bg-white rounded-lg border border-slate-200/80 shadow-2xs">
            <Users2 className="w-3 h-3 text-indigo-600" />
            Usia 0–5 Tahun
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 sm:px-2.5 sm:py-1 bg-white rounded-lg border border-slate-200/80 shadow-2xs">
            <Stethoscope className="w-3 h-3 text-blue-600" />
            Dokter
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 sm:px-2.5 sm:py-1 bg-white rounded-lg border border-slate-200/80 shadow-2xs">
            <AlertTriangle className="w-3 h-3 text-amber-500" />
            tim dokter
          </span>
        </div>
      </div>
    </section>
  );
}
