'use client';

import React from 'react';
import { Navbar } from '@/components/Navbar';
import { HeroSection } from '@/components/HeroSection';
import { FreeScreeningForm } from '@/components/FreeScreeningForm';
import { Footer } from '@/components/Footer';
import {
  Stethoscope,
  MessageCircle,
} from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
      {/* Top Navbar */}
      <Navbar />

      {/* Hero Header */}
      <HeroSection />

      {/* Main Content: Screening Makan Singkat (Gratis) */}
      <main className="flex-1 pb-12 sm:pb-16">
        <FreeScreeningForm />

        {/* Pediatric Advisory Spotlight */}
        <section className="max-w-3xl mx-auto px-3 sm:px-6 mt-6 sm:mt-8">
          <div className="bg-white rounded-2xl p-3.5 sm:p-6 border border-slate-200 shadow-xs">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
              <div className="space-y-1.5 sm:space-y-2 max-w-lg">
                <div className="inline-flex items-center gap-1 px-2 sm:px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-[10px] sm:text-[11px] font-bold">
                  <Stethoscope className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  <span>Dokter</span>
                </div>
                <h3 className="text-sm sm:text-lg font-black text-slate-900 tracking-tight">
                  Pendampingan &amp; Evaluasi Medis Dokter
                </h3>
                <p className="text-[11px] sm:text-xs text-slate-600 leading-relaxed">
                  Semua data screening ditelaah dengan pendekatan aturan makan (feeding rules) baku untuk mencegah defisiensi mikronutrien, gangguan sensori oral-motor, dan risiko stunting pada anak.
                </p>
              </div>

              <a
                href="https://wa.me/6285129992305?text=Halo%20Dokter,%20saya%20ingin%20tanya%20seputar%20masalah%20makan%20anak"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3.5 sm:px-4 py-2 sm:py-2.5 bg-slate-950 text-[#ccff00] hover:bg-slate-800 rounded-xl text-xs font-bold transition-all shrink-0 active:scale-98"
              >
                <MessageCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>Konsultasi WhatsApp</span>
              </a>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
