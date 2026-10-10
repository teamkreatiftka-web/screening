import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-[#F8FAFC] text-center">
      <div className="w-16 h-16 rounded-2xl bg-slate-900 text-[#ccff00] font-black text-2xl flex items-center justify-center mb-4">
        404
      </div>
      <h2 className="text-xl sm:text-2xl font-black text-slate-900 mb-2">
        Halaman Tidak Ditemukan
      </h2>
      <p className="text-xs sm:text-sm text-slate-600 max-w-sm mb-6">
        Halaman yang Anda cari mungkin telah dipindahkan atau alamat URL tidak sesuai.
      </p>
      <Link
        href="/"
        className="px-5 py-2.5 bg-slate-900 text-[#ccff00] font-bold text-xs rounded-xl hover:bg-slate-800 transition-colors"
      >
        Kembali ke Halaman Utama
      </Link>
    </div>
  );
}
