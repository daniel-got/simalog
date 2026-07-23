-- =========================================================================
-- SIMALOG – FIX SCHEMA ASSETS (SAFE / IDEMPOTENT)
-- Aman dijalankan berulang kali – tidak akan error jika sudah dikerjakan
-- Jalankan di: Supabase Dashboard → SQL Editor
-- =========================================================================

DO $$
BEGIN

  -- ───────────────────────────────────────────────────────────────────────
  -- STEP 1: Tambah kolom `id` BIGSERIAL jika belum ada
  -- ───────────────────────────────────────────────────────────────────────
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'assets'
      AND column_name  = 'id'
  ) THEN
    ALTER TABLE public.assets ADD COLUMN id BIGSERIAL;
    RAISE NOTICE 'DONE: kolom id ditambahkan';
  ELSE
    RAISE NOTICE 'SKIP: kolom id sudah ada';
  END IF;

  -- ───────────────────────────────────────────────────────────────────────
  -- STEP 2: Hapus constraint PRIMARY KEY lama (jika masih di kode_aset)
  -- ───────────────────────────────────────────────────────────────────────
  IF EXISTS (
    SELECT 1
    FROM   pg_constraint c
    JOIN   pg_class      t ON t.oid = c.conrelid
    JOIN   pg_attribute  a ON a.attrelid = t.oid AND a.attnum = ANY(c.conkey)
    WHERE  t.relname   = 'assets'
      AND  c.contype   = 'p'          -- primary key
      AND  a.attname   = 'kode_aset'  -- PK masih di kode_aset
  ) THEN
    ALTER TABLE public.assets DROP CONSTRAINT assets_pkey;
    ALTER TABLE public.assets ADD PRIMARY KEY (id);
    RAISE NOTICE 'DONE: PK dipindahkan ke kolom id';
  ELSE
    RAISE NOTICE 'SKIP: PK sudah bukan kode_aset (tidak perlu ubah)';
  END IF;

  -- ───────────────────────────────────────────────────────────────────────
  -- STEP 3: Tambah UNIQUE constraint ke kode_aset jika belum ada
  -- ───────────────────────────────────────────────────────────────────────
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'assets_kode_aset_unique'
  ) THEN
    ALTER TABLE public.assets
      ADD CONSTRAINT assets_kode_aset_unique UNIQUE (kode_aset);
    RAISE NOTICE 'DONE: UNIQUE constraint kode_aset ditambahkan';
  ELSE
    RAISE NOTICE 'SKIP: UNIQUE constraint kode_aset sudah ada';
  END IF;

  -- ───────────────────────────────────────────────────────────────────────
  -- STEP 4: Tangani kolom kondisi / status_kondisi
  -- Kasus A: kondisi ada, status_kondisi TIDAK ada → rename
  -- Kasus B: kondisi ada, status_kondisi JUGA ada  → drop kondisi (duplikat)
  -- Kasus C: kondisi tidak ada                     → skip
  -- ───────────────────────────────────────────────────────────────────────
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'assets'
      AND column_name  = 'kondisi'
  ) THEN
    -- Cek apakah status_kondisi sudah ada (Kasus B)
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name   = 'assets'
        AND column_name  = 'status_kondisi'
    ) THEN
      -- Keduanya ada → hapus kolom lama 'kondisi'
      ALTER TABLE public.assets DROP COLUMN kondisi;
      RAISE NOTICE 'DONE: kolom kondisi dihapus (status_kondisi sudah ada)';
    ELSE
      -- Hanya kondisi yang ada → rename ke status_kondisi
      ALTER TABLE public.assets RENAME COLUMN kondisi TO status_kondisi;
      RAISE NOTICE 'DONE: kondisi di-rename ke status_kondisi';
    END IF;
  ELSE
    RAISE NOTICE 'SKIP: kolom kondisi tidak ada';
  END IF;

  -- ───────────────────────────────────────────────────────────────────────
  -- STEP 5: Hapus kolom km_sekarang (duplikat dari km_saat_ini)
  -- ───────────────────────────────────────────────────────────────────────
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'assets'
      AND column_name  = 'km_sekarang'
  ) THEN
    ALTER TABLE public.assets DROP COLUMN km_sekarang;
    RAISE NOTICE 'DONE: kolom km_sekarang dihapus';
  ELSE
    RAISE NOTICE 'SKIP: kolom km_sekarang tidak ada';
  END IF;

  -- ───────────────────────────────────────────────────────────────────────
  -- STEP 6: Ubah no_polisi dari NUMERIC ke TEXT (jika masih numeric)
  -- ───────────────────────────────────────────────────────────────────────
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'assets'
      AND column_name  = 'no_polisi'
      AND data_type    = 'numeric'
  ) THEN
    ALTER TABLE public.assets
      ALTER COLUMN no_polisi TYPE TEXT USING no_polisi::TEXT;
    RAISE NOTICE 'DONE: no_polisi diubah dari NUMERIC ke TEXT';
  ELSE
    RAISE NOTICE 'SKIP: no_polisi sudah TEXT atau tidak ada';
  END IF;

  -- ───────────────────────────────────────────────────────────────────────
  -- STEP 7: Set default 'aktif' untuk kolom status
  -- ───────────────────────────────────────────────────────────────────────
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'assets'
      AND column_name  = 'status'
  ) THEN
    ALTER TABLE public.assets
      ALTER COLUMN status SET DEFAULT 'aktif';
    UPDATE public.assets SET status = 'aktif' WHERE status IS NULL;
    RAISE NOTICE 'DONE: default status = aktif diset';
  ELSE
    RAISE NOTICE 'SKIP: kolom status tidak ada';
  END IF;

  -- ───────────────────────────────────────────────────────────────────────
  -- STEP 8: Tambah kolom maintenance_type jika belum ada
  -- ───────────────────────────────────────────────────────────────────────
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'assets'
      AND column_name  = 'maintenance_type'
  ) THEN
    ALTER TABLE public.assets
      ADD COLUMN maintenance_type TEXT NOT NULL DEFAULT 'tidak'
        CHECK (maintenance_type IN ('km', 'bulan', 'tidak'));
    RAISE NOTICE 'DONE: kolom maintenance_type ditambahkan';
  ELSE
    RAISE NOTICE 'SKIP: kolom maintenance_type sudah ada';
  END IF;

  -- ───────────────────────────────────────────────────────────────────────
  -- STEP 9: Tambah kolom km_terakhir_servis jika belum ada
  -- ───────────────────────────────────────────────────────────────────────
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'assets'
      AND column_name  = 'km_terakhir_servis'
  ) THEN
    ALTER TABLE public.assets ADD COLUMN km_terakhir_servis NUMERIC;
    RAISE NOTICE 'DONE: kolom km_terakhir_servis ditambahkan';
  ELSE
    RAISE NOTICE 'SKIP: kolom km_terakhir_servis sudah ada';
  END IF;

END $$;

-- =========================================================================
-- STEP 10: Refresh schema cache PostgREST (harus di luar blok DO)
-- =========================================================================
NOTIFY pgrst, 'reload schema';

-- =========================================================================
-- VERIFIKASI: Cek struktur tabel setelah semua fix
-- =========================================================================
SELECT
  ordinal_position AS "#",
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name   = 'assets'
ORDER BY ordinal_position;
