import { createClient } from '@supabase/supabase-js';

// Provided Supabase Credentials
export const SUPABASE_URL = 'https://odcdtrzuwglyrjmeadgb.supabase.co';
export const SUPABASE_REST_URL = 'https://odcdtrzuwglyrjmeadgb.supabase.co/rest/v1/';
export const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9kY2R0cnp1d2dseXJqbWVhZGdiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEyNDE3OTIsImV4cCI6MjEwNjgxNzc5Mn0.jC_SmmTMvzf2tMxstaTGi-nAorVuYiWX2TLbWt8bSc0';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: false,
  },
});

export const SUPABASE_SQL_SETUP = `-- ============================================================
-- SCRIPT SETUP DATABASE SUPABASE (PROYEK: odcdtrzuwglyrjmeadgb)
-- Tabel: public.screenings (Rekam Medis & Screening Makan Anak)
-- Jalankan di SQL Editor Supabase: https://supabase.com/dashboard/project/odcdtrzuwglyrjmeadgb/sql/new
-- ============================================================

-- 1. Buat Tabel screenings
CREATE TABLE IF NOT EXISTS public.screenings (
  id TEXT PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  type TEXT NOT NULL,                         -- 'free' (Skrining Cepat) atau 'paid' (Asesmen Lengkap)
  status TEXT DEFAULT 'Baru',                 -- 'Baru', 'Dalam Review', 'Selesai', 'Follow-Up'
  risk_level TEXT DEFAULT 'PERLU DIPERHATIKAN', -- 'NORMAL', 'PERLU DIPERHATIKAN', 'BUTUH PERHATIAN KHUSUS'
  child_name TEXT NOT NULL,
  mother_name TEXT,
  father_name TEXT,
  phone TEXT,
  secondary_phone TEXT,
  age_text TEXT,
  gender TEXT,
  last_weight TEXT,
  last_height TEXT,
  measurement_date TEXT,
  summary TEXT,
  problem_areas JSONB DEFAULT '[]'::jsonb,
  clinical_notes TEXT DEFAULT '',
  free_data JSONB,
  paid_data JSONB
);

-- 2. Aktifkan Row Level Security (RLS)
ALTER TABLE public.screenings ENABLE ROW LEVEL SECURITY;

-- 3. Kebijakan Akses (RLS Policies) - Idempoten (Bebas Dijalankan Berulang Kali)
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

-- 4. Berikan Hak Akses ke Role Supabase
GRANT ALL ON TABLE public.screenings TO anon, authenticated, service_role;

-- 5. Data Awal Contoh (Opsional, langsung bisa dites di Table Editor)
INSERT INTO public.screenings (
  id, created_at, type, status, risk_level, child_name, mother_name, father_name,
  phone, secondary_phone, age_text, gender, last_weight, last_height,
  measurement_date, summary, problem_areas, clinical_notes
)
VALUES (
  'RM-PRO-2026-1024',
  NOW() - INTERVAL '5 hours',
  'paid',
  'Dalam Review',
  'BUTUH PERHATIAN KHUSUS',
  'Arsya Bagas Pratama',
  'Rina Wardhani',
  'Dimas Pratama',
  '081234567890',
  '081398765432',
  '2 tahun 4 bulan',
  'Laki-laki',
  '10.2 kg',
  '84 cm',
  '2026-09-28',
  'GTM kronis sejak usia 14 bulan. Hanya mau nasi kecap dan biskuit. Melepeh makanan berserat.',
  '["GTM dan porsi minim", "Tekstur stagnan", "BB stagnan 3 bulan", "Ketergantungan gadget"]'::jsonb,
  'Jadwalkan telekonsultasi GMeet. Evaluasi oromotor hiper-sensitivitas tekstur.'
)
ON CONFLICT (id) DO NOTHING;
`;
