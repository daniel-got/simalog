-- =========================================================================
-- SIMALOG - FIX PERSETUJUAN: Tabel Baru + RLS + Realtime
-- Jalankan SELURUH skrip ini di: Supabase Dashboard > SQL Editor
-- =========================================================================

-- -------------------------------------------------------------------------
-- 1. TABEL PEMINJAMAN ASET (pengajuan pinjam dari Guest/User)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.peminjaman_aset (
    id              BIGSERIAL PRIMARY KEY,
    id_aset         BIGINT REFERENCES public.assets(id) ON DELETE CASCADE,
    nama_peminjam   TEXT NOT NULL,
    keperluan       TEXT,
    tanggal_pinjam  DATE NOT NULL DEFAULT CURRENT_DATE,
    tanggal_kembali DATE,
    status          TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'disetujui', 'ditolak')),
    catatan_admin   TEXT,
    created_at      TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at      TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Jika tabel sudah ada sebelumnya, tambahkan kolom yang mungkin belum ada
ALTER TABLE public.peminjaman_aset
    ADD COLUMN IF NOT EXISTS keperluan       TEXT,
    ADD COLUMN IF NOT EXISTS tanggal_pinjam  DATE DEFAULT CURRENT_DATE,
    ADD COLUMN IF NOT EXISTS tanggal_kembali DATE,
    ADD COLUMN IF NOT EXISTS catatan_admin   TEXT,
    ADD COLUMN IF NOT EXISTS updated_at      TIMESTAMPTZ DEFAULT now();

-- -------------------------------------------------------------------------
-- 2. TABEL LAPORAN KERUSAKAN (laporan dari Guest/User)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.laporan_kerusakan (
    id              BIGSERIAL PRIMARY KEY,
    id_aset         BIGINT REFERENCES public.assets(id) ON DELETE CASCADE,
    nama_pelapor    TEXT NOT NULL,
    tingkat         TEXT NOT NULL DEFAULT 'Ringan'
                    CHECK (tingkat IN ('Ringan', 'Sedang', 'Berat')),
    kendala         TEXT,
    tanggal         DATE NOT NULL DEFAULT CURRENT_DATE,
    status          TEXT NOT NULL DEFAULT 'menunggu'
                    CHECK (status IN ('menunggu', 'diverifikasi', 'ditolak')),
    catatan_admin   TEXT,
    created_at      TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at      TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Jika tabel sudah ada sebelumnya, tambahkan kolom yang mungkin belum ada
ALTER TABLE public.laporan_kerusakan
    ADD COLUMN IF NOT EXISTS kendala         TEXT,
    ADD COLUMN IF NOT EXISTS deskripsi       TEXT,
    ADD COLUMN IF NOT EXISTS catatan_admin   TEXT,
    ADD COLUMN IF NOT EXISTS updated_at      TIMESTAMPTZ DEFAULT now();

-- -------------------------------------------------------------------------
-- 3. TRIGGER: auto-update updated_at
-- -------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS peminjaman_aset_set_updated_at ON public.peminjaman_aset;
CREATE TRIGGER peminjaman_aset_set_updated_at
    BEFORE UPDATE ON public.peminjaman_aset
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS laporan_kerusakan_set_updated_at ON public.laporan_kerusakan;
CREATE TRIGGER laporan_kerusakan_set_updated_at
    BEFORE UPDATE ON public.laporan_kerusakan
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- -------------------------------------------------------------------------
-- 4. ROW LEVEL SECURITY (RLS)
-- -------------------------------------------------------------------------
ALTER TABLE public.peminjaman_aset   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.laporan_kerusakan ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'Admin'
  );
$$;

-- Hapus policy lama
DROP POLICY IF EXISTS "Public read peminjaman_aset"    ON public.peminjaman_aset;
DROP POLICY IF EXISTS "Guest insert peminjaman_aset"   ON public.peminjaman_aset;
DROP POLICY IF EXISTS "Admin update peminjaman_aset"   ON public.peminjaman_aset;
DROP POLICY IF EXISTS "Admin delete peminjaman_aset"   ON public.peminjaman_aset;
DROP POLICY IF EXISTS "Public read laporan_kerusakan"  ON public.laporan_kerusakan;
DROP POLICY IF EXISTS "Guest insert laporan_kerusakan" ON public.laporan_kerusakan;
DROP POLICY IF EXISTS "Admin update laporan_kerusakan" ON public.laporan_kerusakan;
DROP POLICY IF EXISTS "Admin delete laporan_kerusakan" ON public.laporan_kerusakan;

-- peminjaman_aset
CREATE POLICY "Public read peminjaman_aset"
    ON public.peminjaman_aset FOR SELECT USING (true);

CREATE POLICY "Guest insert peminjaman_aset"
    ON public.peminjaman_aset FOR INSERT WITH CHECK (true);

CREATE POLICY "Admin update peminjaman_aset"
    ON public.peminjaman_aset FOR UPDATE USING (public.is_admin());

CREATE POLICY "Admin delete peminjaman_aset"
    ON public.peminjaman_aset FOR DELETE USING (public.is_admin());

-- laporan_kerusakan
CREATE POLICY "Public read laporan_kerusakan"
    ON public.laporan_kerusakan FOR SELECT USING (true);

CREATE POLICY "Guest insert laporan_kerusakan"
    ON public.laporan_kerusakan FOR INSERT WITH CHECK (true);

CREATE POLICY "Admin update laporan_kerusakan"
    ON public.laporan_kerusakan FOR UPDATE USING (public.is_admin());

CREATE POLICY "Admin delete laporan_kerusakan"
    ON public.laporan_kerusakan FOR DELETE USING (public.is_admin());

-- -------------------------------------------------------------------------
-- 5. AKTIFKAN REALTIME
-- -------------------------------------------------------------------------
ALTER PUBLICATION supabase_realtime ADD TABLE public.peminjaman_aset;
ALTER PUBLICATION supabase_realtime ADD TABLE public.laporan_kerusakan;

-- SELESAI
-- Setelah menjalankan SQL ini, pastikan di Supabase Dashboard:
-- Database > Replication > kedua tabel sudah tercentang
-- =========================================================================
