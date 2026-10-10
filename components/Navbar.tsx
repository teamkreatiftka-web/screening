'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { PhoneCall } from 'lucide-react';

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-18">
          {/* Logo & Brand */}
          <Link href="/" className="flex items-center gap-2 group shrink-0 py-1">
            <Image
              src="https://cdn.scalev.com/uploads/1791437257/QF6f43VbRyKhXQscT8CtjA/1791437253324-Frame-32-Photoroom-1.webp"
              alt="Logo Tumbuh Kembang Anak"
              width={1920}
              height={303}
              priority
              className="h-7 sm:h-11 w-auto max-w-[170px] xs:max-w-[200px] sm:max-w-[280px] object-contain"
              referrerPolicy="no-referrer"
            />
          </Link>

          {/* Action Button: Konsultasi / Bantuan WA */}
          <div className="flex items-center gap-2 shrink-0">
            <a
              href="https://wa.me/6285129992305?text=Halo%20Admin%20Tumbuh%20Kembang%20Anak,%20saya%20ingin%20tanya%20seputar%20skrining%20masalah%20makan%20anak"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-4 py-1.5 sm:py-2.5 text-[11px] sm:text-xs font-bold text-slate-950 bg-[#ccff00] hover:bg-[#b8e600] rounded-lg sm:rounded-xl transition-all shadow-2xs active:scale-98"
            >
              <PhoneCall className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
              <span className="hidden xs:inline">Bantuan WhatsApp</span>
              <span className="xs:hidden">Bantuan WA</span>
            </a>
          </div>
        </div>
      </div>
    </header>
  );
}
