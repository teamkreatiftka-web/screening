import React from 'react';
import Image from 'next/image';

export function Footer() {
  return (
    <footer className="bg-slate-900 py-6 sm:py-8 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 flex flex-col items-center justify-center">
        <div className="inline-block bg-white rounded-xl p-2.5 sm:p-3 shadow-xs">
          <Image
            src="https://cdn.scalev.com/uploads/1791437257/QF6f43VbRyKhXQscT8CtjA/1791437253324-Frame-32-Photoroom-1.webp"
            alt="Logo Tumbuh Kembang Anak"
            width={1920}
            height={303}
            className="h-9 sm:h-12 w-auto max-w-[240px] sm:max-w-[300px] object-contain"
            referrerPolicy="no-referrer"
          />
        </div>
      </div>
    </footer>
  );
}
