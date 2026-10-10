import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Screening Masalah Makan Anak 0-5 Tahun | Tumbuh Kembang Anak',
  description: 'Platform screening pola makan dan asesmen tumbuh kembang anak usia 0-5 tahun oleh Tumbuh Kembang Anak & Ziad Medika.',
  icons: {
    icon: 'https://cdn.scalev.com/uploads/1790750920/lIJ-4ibr6mRebbNJ7H60Yw/1790750919608-Instagram-post-52.png',
    apple: 'https://cdn.scalev.com/uploads/1790750920/lIJ-4ibr6mRebbNJ7H60Yw/1790750919608-Instagram-post-52.png',
  },
  openGraph: {
    title: 'Screening Masalah Makan Anak 0-5 Tahun | Tumbuh Kembang Anak',
    description: 'Kenali pola makan, variasi makanan, tekstur, dan tanda bahaya kesulitan makan anak usia 0-5 tahun bersama dokter dan tim ahli.',
    type: 'website',
    images: [
      {
        url: 'https://cdn.scalev.com/uploads/1791437257/QF6f43VbRyKhXQscT8CtjA/1791437253324-Frame-32-Photoroom-1.webp',
        width: 1920,
        height: 303,
        alt: 'Tumbuh Kembang Anak',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Screening Masalah Makan Anak 0-5 Tahun | Tumbuh Kembang Anak',
    description: 'Kenali pola makan, variasi makanan, tekstur, dan tanda bahaya kesulitan makan anak usia 0-5 tahun.',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className="scroll-smooth" suppressHydrationWarning>
      <body className="min-h-screen bg-[#F8FAFC] text-slate-800 antialiased font-sans selection:bg-[#ccff00] selection:text-slate-900" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
