-- =========================================================================
-- FIX FINAL: id_aset → BIGINT (sesuai assets.id yang BIGINT/BIGSERIAL)
-- Jalankan di: Supabase Dashboard → SQL Editor
-- =========================================================================

-- ── STEP 1: Hapus SEMUA FK dari log_perawatan_aset ───────────────────────
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT conname FROM pg_constraint
    WHERE contype = 'f' AND conrelid = 'public.log_perawatan_aset'::regclass
  LOOP
    EXECUTE 'ALTER TABLE public.log_perawatan_aset DROP CONSTRAINT ' || quote_ident(r.conname);
    RAISE NOTICE 'Dropped from log_perawatan_aset: %', r.conname;
  END LOOP;
END $$;

-- ── STEP 2: Hapus SEMUA FK dari log_aktivitas_aset ───────────────────────
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT conname FROM pg_constraint
    WHERE contype = 'f' AND conrelid = 'public.log_aktivitas_aset'::regclass
  LOOP
    EXECUTE 'ALTER TABLE public.log_aktivitas_aset DROP CONSTRAINT ' || quote_ident(r.conname);
    RAISE NOTICE 'Dropped from log_aktivitas_aset: %', r.conname;
  END LOOP;
END $$;

-- ── STEP 3: Ubah id_aset ke BIGINT (sesuai assets.id = BIGINT) ───────────
-- Hapus data lama yang tidak valid (isi TEXT yang tidak bisa jadi angka)
DELETE FROM public.log_perawatan_aset
  WHERE id_aset IS NOT NULL
    AND id_aset !~ '^\d+$';

DELETE FROM public.log_aktivitas_aset
  WHERE id_aset IS NOT NULL
    AND id_aset !~ '^\d+$';

-- Konversi tipe
ALTER TABLE public.log_perawatan_aset
  ALTER COLUMN id_aset TYPE BIGINT USING id_aset::BIGINT;

ALTER TABLE public.log_aktivitas_aset
  ALTER COLUMN id_aset TYPE BIGINT USING id_aset::BIGINT;

-- ── STEP 4: Tambah FK baru → assets.id (BIGINT) ──────────────────────────
ALTER TABLE public.log_perawatan_aset
  ADD CONSTRAINT fk_log_perawatan_assets
  FOREIGN KEY (id_aset) REFERENCES public.assets(id)
  ON DELETE CASCADE;

ALTER TABLE public.log_aktivitas_aset
  ADD CONSTRAINT fk_log_aktivitas_assets
  FOREIGN KEY (id_aset) REFERENCES public.assets(id)
  ON DELETE CASCADE;

-- ── Refresh schema cache ──────────────────────────────────────────────────
NOTIFY pgrst, 'reload schema';

-- ── Verifikasi: pastikan FK sudah ke assets ───────────────────────────────
SELECT
  conname AS constraint_name,
  conrelid::regclass AS table_name,
  confrelid::regclass AS references_table,
  a.attname AS fk_column,
  af.attname AS ref_column,
  at.typname AS fk_type,
  aft.typname AS ref_type
FROM pg_constraint c
JOIN pg_attribute a  ON a.attrelid  = c.conrelid  AND a.attnum  = ANY(c.conkey)
JOIN pg_attribute af ON af.attrelid = c.confrelid AND af.attnum = ANY(c.confkey)
JOIN pg_type at  ON at.oid = a.atttypid
JOIN pg_type aft ON aft.oid = af.atttypid
WHERE c.contype = 'f'
  AND c.conrelid IN (
    'public.log_perawatan_aset'::regclass,
    'public.log_aktivitas_aset'::regclass
  );
