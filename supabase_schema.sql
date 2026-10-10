-- ==============================================================================
-- DATABASE SCHEMA SUPABASE: SKRINING & REKAM MEDIS TUMBUH KEMBANG ANAK
-- URL Target Supabase: https://odcdtrzuwglyrjmeadgb.supabase.co
--
-- CARA PENGGUNAAN DI SUPABASE:
-- 1. Buka dashboard Supabase: https://supabase.com/dashboard/project/odcdtrzuwglyrjmeadgb
-- 2. Pilih menu "SQL Editor" di bilah navigasi sebelah kiri.
-- 3. Klik tombol "+ New query".
-- 4. Salin (copy) dan tempel (paste) seluruh skrip SQL di bawah ini.
-- 5. Klik tombol "RUN" (atau tekan Ctrl+Enter / Cmd+Enter).
-- 6. Notifikasi "Success. No rows returned" akan muncul, dan tabel 'screenings' siap digunakan!
-- ==============================================================================

-- 1. Buat Tabel screenings jika belum ada
CREATE TABLE IF NOT EXISTS public.screenings (
  id TEXT PRIMARY KEY,                                      -- ID unik rekam medis (contoh: RM-FREE-2026-XXXX atau RM-PRO-2026-XXXX)
  created_at TIMESTAMPTZ DEFAULT NOW(),                     -- Waktu submit skrining
  type TEXT NOT NULL,                                       -- 'free' (Skrining Cepat) atau 'paid' (Asesmen Lengkap 10 Bagian)
  status TEXT DEFAULT 'Baru',                               -- 'Baru', 'Dalam Review', 'Selesai', 'Follow-Up'
  risk_level TEXT DEFAULT 'PERLU DIPERHATIKAN',             -- 'NORMAL', 'PERLU DIPERHATIKAN', 'BUTUH PERHATIAN KHUSUS'
  child_name TEXT NOT NULL,                                 -- Nama lengkap anak
  mother_name TEXT,                                         -- Nama ibu / bunda
  father_name TEXT,                                         -- Nama ayah
  phone TEXT,                                               -- Nomor WhatsApp
  secondary_phone TEXT,                                     -- Nomor telepon alternatif
  age_text TEXT,                                            -- Usia anak terhitung otomatis
  gender TEXT,                                              -- 'Laki-laki' atau 'Perempuan'
  last_weight TEXT,                                         -- Berat badan terakhir
  last_height TEXT,                                         -- Tinggi / panjang badan terakhir
  measurement_date TEXT,                                    -- Tanggal pengukuran BB/TB
  summary TEXT,                                             -- Kesimpulan evaluasi klinis
  problem_areas JSONB DEFAULT '[]'::jsonb,                  -- List area masalah & feeding rules
  clinical_notes TEXT DEFAULT '',                           -- Catatan dokter
  free_data JSONB,                                          -- Data mentah skrining gratis
  paid_data JSONB                                           -- Data mentah asesmen berbayar 10 bagian
);

-- 2. Buat Index untuk performa pencarian dan filter cepat
CREATE INDEX IF NOT EXISTS idx_screenings_created_at ON public.screenings (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_screenings_type ON public.screenings (type);
CREATE INDEX IF NOT EXISTS idx_screenings_status ON public.screenings (status);
CREATE INDEX IF NOT EXISTS idx_screenings_phone ON public.screenings (phone);

-- 3. Aktifkan Row Level Security (RLS)
ALTER TABLE public.screenings ENABLE ROW LEVEL SECURITY;

-- 4. Buat Kebijakan Akses (RLS Policies) yang Idempoten (Aman dijalankan berulang kali)
DROP POLICY IF EXISTS "Izinkan publik tambah screening" ON public.screenings;
CREATE POLICY "Izinkan publik tambah screening" ON public.screenings
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Izinkan anon baca data screening" ON public.screenings;
CREATE POLICY "Izinkan anon baca data screening" ON public.screenings
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Izinkan anon update data screening" ON public.screenings;
CREATE POLICY "Izinkan anon update data screening" ON public.screenings
  FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Izinkan anon hapus data screening" ON public.screenings;
CREATE POLICY "Izinkan anon hapus data screening" ON public.screenings
  FOR DELETE USING (true);

-- 5. Berikan Hak Akses ke Role Supabase (anon, authenticated, service_role)
GRANT ALL ON TABLE public.screenings TO anon, authenticated, service_role;

-- 6. Masukkan Data Sampel Uji Coba Awal (Bisa langsung dicek di menu Table Editor)
INSERT INTO public.screenings (
  id, created_at, type, status, risk_level, child_name, mother_name, father_name,
  phone, secondary_phone, age_text, gender, last_weight, last_height,
  measurement_date, summary, problem_areas, clinical_notes
)
VALUES (
  'RM-SAMPLE-2026-001',
  NOW(),
  'free',
  'Baru',
  'PERLU DIPERHATIKAN',
  'Kenzo Althaf',
  'Fitriani',
  'Hendra',
  '081908765411',
  NULL,
  '3 tahun',
  'Laki-laki',
  '12.8 kg',
  '92 cm',
  '2026-09-20',
  'Terindikasi Picky Eater tingkat sedang. Menolak protein hewani dan sayur. Waktu makan sering melebihi 30 menit.',
  '["Durasi makan > 30 menit", "Makan dengan gadget", "Menolak daging/telur"]'::jsonb,
  'Sarankan konsultasi chat WhatsApp untuk intervensi feeding rules.'
)
ON CONFLICT (id) DO NOTHING;
