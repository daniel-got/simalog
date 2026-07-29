-- =========================================================================
-- FIX FOREIGN KEY log_perawatan_aset & log_aktivitas_aset → assets
-- Jalankan SATU PER SATU di Supabase Dashboard → SQL Editor
-- =========================================================================

-- LANGKAH 1: Lihat dulu semua FK yang ada di kedua tabel ini
SELECT
  conname AS constraint_name,
  conrelid::regclass AS table_name,
  confrelid::regclass AS references_table
FROM pg_constraint
WHERE contype = 'f'
  AND conrelid IN (
    'log_perawatan_aset'::regclass,
    'log_aktivitas_aset'::regclass
  );
