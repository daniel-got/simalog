-- =========================================================================
-- SIMALOG – MIGRATION TAMBAH ASET
-- Jalankan di: Supabase Dashboard → SQL Editor
-- =========================================================================

-- ─────────────────────────────────────────────────────────────────────────
-- 1. TABEL KELOMPOK ASET
-- ─────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.kelompok_aset (
    id          SERIAL PRIMARY KEY,
    nama        TEXT NOT NULL UNIQUE,
    prefix_kode TEXT NOT NULL UNIQUE
);

-- ─────────────────────────────────────────────────────────────────────────
-- 2. TABEL SUB-KELOMPOK ASET
-- ─────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.sub_kelompok_aset (
    id               SERIAL PRIMARY KEY,
    kelompok_id      INT NOT NULL REFERENCES public.kelompok_aset(id) ON DELETE CASCADE,
    nama             TEXT NOT NULL,
    maintenance_type TEXT NOT NULL CHECK (maintenance_type IN ('km', 'bulan', 'tidak'))
);

-- ─────────────────────────────────────────────────────────────────────────
-- 3. TABEL ASSETS (Tabel Utama Harta Benda)
-- ─────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.assets (
    id                      BIGSERIAL PRIMARY KEY,
    kode_aset               TEXT UNIQUE,
    kelompok_id             INT REFERENCES public.kelompok_aset(id) ON DELETE SET NULL,
    sub_kelompok_id         INT REFERENCES public.sub_kelompok_aset(id) ON DELETE SET NULL,

    -- Field Utama
    nama_aset               TEXT NOT NULL,
    merek_tipe              TEXT,
    nomor_seri_plat         TEXT,
    lokasi_ruangan          TEXT NOT NULL,
    penanggung_jawab        TEXT,
    tanggal_perolehan       DATE NOT NULL DEFAULT CURRENT_DATE,
    harga_beli              NUMERIC NOT NULL DEFAULT 0,
    status_kondisi          TEXT NOT NULL DEFAULT 'Baik'
                            CHECK (status_kondisi IN ('Baik', 'Rusak Ringan', 'Rusak Berat', 'Dihapuskan')),

    -- Media
    foto_url                TEXT,
    lampiran_url            TEXT,

    -- Maintenance type (disalin dari sub_kelompok agar mudah query)
    maintenance_type        TEXT NOT NULL DEFAULT 'tidak'
                            CHECK (maintenance_type IN ('km', 'bulan', 'tidak')),

    -- Field Kendaraan (maintenance_type = 'km')
    no_polisi               TEXT,
    km_saat_ini             NUMERIC,
    km_terakhir_servis      NUMERIC,
    interval_km             NUMERIC DEFAULT 5000,

    -- Field Servis Berkala (maintenance_type = 'bulan')
    interval_bulan          INTEGER DEFAULT 3,
    tanggal_servis_terakhir DATE,

    -- Audit
    created_by              UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    updated_by              UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at              TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at              TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- ─────────────────────────────────────────────────────────────────────────
-- 4. FUNCTION RPC: generate_kode_aset
-- ─────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.generate_kode_aset(p_kelompok_id INT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_prefix    TEXT;
    v_count     INT;
BEGIN
    SELECT prefix_kode INTO v_prefix
    FROM public.kelompok_aset
    WHERE id = p_kelompok_id;

    IF v_prefix IS NULL THEN
        RAISE EXCEPTION 'Kelompok aset dengan id % tidak ditemukan.', p_kelompok_id;
    END IF;

    SELECT COUNT(*) INTO v_count
    FROM public.assets
    WHERE kelompok_id = p_kelompok_id;

    RETURN v_prefix || '-' || LPAD((v_count + 1)::TEXT, 4, '0');
END;
$$;

-- ─────────────────────────────────────────────────────────────────────────
-- 5. TRIGGER: auto-update updated_at pada tabel assets
-- ─────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS assets_set_updated_at ON public.assets;
CREATE TRIGGER assets_set_updated_at
    BEFORE UPDATE ON public.assets
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ─────────────────────────────────────────────────────────────────────────
-- 6. ROW LEVEL SECURITY (RLS)
-- ─────────────────────────────────────────────────────────────────────────
ALTER TABLE public.kelompok_aset     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sub_kelompok_aset ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assets            ENABLE ROW LEVEL SECURITY;

-- Helper: cek admin dari tabel users/profiles
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'Admin'
  );
$$;

-- ── Hapus policy lama jika ada ─────────────────────────────────────────
DROP POLICY IF EXISTS "Public read kelompok_aset" ON public.kelompok_aset;
DROP POLICY IF EXISTS "Admin write kelompok_aset" ON public.kelompok_aset;
DROP POLICY IF EXISTS "Admin insert kelompok_aset" ON public.kelompok_aset;
DROP POLICY IF EXISTS "Admin update kelompok_aset" ON public.kelompok_aset;
DROP POLICY IF EXISTS "Admin delete kelompok_aset" ON public.kelompok_aset;

DROP POLICY IF EXISTS "Public read sub_kelompok_aset" ON public.sub_kelompok_aset;
DROP POLICY IF EXISTS "Admin insert sub_kelompok_aset" ON public.sub_kelompok_aset;
DROP POLICY IF EXISTS "Admin update sub_kelompok_aset" ON public.sub_kelompok_aset;
DROP POLICY IF EXISTS "Admin delete sub_kelompok_aset" ON public.sub_kelompok_aset;

DROP POLICY IF EXISTS "Semua user login bisa lihat aset" ON public.assets;
DROP POLICY IF EXISTS "Hanya admin bisa tambah aset" ON public.assets;
DROP POLICY IF EXISTS "Hanya admin bisa update aset" ON public.assets;
DROP POLICY IF EXISTS "Public read assets" ON public.assets;
DROP POLICY IF EXISTS "Admin insert assets" ON public.assets;
DROP POLICY IF EXISTS "Admin update assets" ON public.assets;
DROP POLICY IF EXISTS "Admin delete assets" ON public.assets;

-- ── kelompok_aset ──────────────────────────────────────────────────────
CREATE POLICY "Public read kelompok_aset"
    ON public.kelompok_aset FOR SELECT USING (true);

CREATE POLICY "Admin insert kelompok_aset"
    ON public.kelompok_aset FOR INSERT WITH CHECK (public.is_admin());

CREATE POLICY "Admin update kelompok_aset"
    ON public.kelompok_aset FOR UPDATE USING (public.is_admin());

CREATE POLICY "Admin delete kelompok_aset"
    ON public.kelompok_aset FOR DELETE USING (public.is_admin());

-- ── sub_kelompok_aset ──────────────────────────────────────────────────
CREATE POLICY "Public read sub_kelompok_aset"
    ON public.sub_kelompok_aset FOR SELECT USING (true);

CREATE POLICY "Admin insert sub_kelompok_aset"
    ON public.sub_kelompok_aset FOR INSERT WITH CHECK (public.is_admin());

CREATE POLICY "Admin update sub_kelompok_aset"
    ON public.sub_kelompok_aset FOR UPDATE USING (public.is_admin());

CREATE POLICY "Admin delete sub_kelompok_aset"
    ON public.sub_kelompok_aset FOR DELETE USING (public.is_admin());

-- ── assets ─────────────────────────────────────────────────────────────
CREATE POLICY "Authenticated read assets"
    ON public.assets FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admin insert assets"
    ON public.assets FOR INSERT WITH CHECK (public.is_admin());

CREATE POLICY "Admin update assets"
    ON public.assets FOR UPDATE USING (public.is_admin());

CREATE POLICY "Admin delete assets"
    ON public.assets FOR DELETE USING (public.is_admin());

-- ─────────────────────────────────────────────────────────────────────────
-- 7. SEEDER: kelompok_aset
-- ─────────────────────────────────────────────────────────────────────────
INSERT INTO public.kelompok_aset (nama, prefix_kode) VALUES
    ('Kendaraan Dinas',             'KND'),
    ('Elektronik & IT',             'ELK'),
    ('Elektronik Rumah Tangga',     'ERT'),
    ('Furnitur',                    'FRN'),
    ('Sarana Pendukung',            'SPD')
ON CONFLICT (nama) DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────────
-- 8. SEEDER: sub_kelompok_aset
-- ─────────────────────────────────────────────────────────────────────────

-- Kendaraan Dinas → km
INSERT INTO public.sub_kelompok_aset (kelompok_id, nama, maintenance_type)
SELECT k.id, s.nama, 'km'
FROM public.kelompok_aset k,
     (VALUES ('Mobil'), ('Motor')) AS s(nama)
WHERE k.nama = 'Kendaraan Dinas'
ON CONFLICT DO NOTHING;

-- Elektronik & IT → 'bulan' untuk Printer & Proyektor
INSERT INTO public.sub_kelompok_aset (kelompok_id, nama, maintenance_type)
SELECT k.id, s.nama, 'bulan'
FROM public.kelompok_aset k,
     (VALUES ('Printer'), ('Proyektor')) AS s(nama)
WHERE k.nama = 'Elektronik & IT'
ON CONFLICT DO NOTHING;

-- Elektronik & IT → 'tidak' untuk lainnya
INSERT INTO public.sub_kelompok_aset (kelompok_id, nama, maintenance_type)
SELECT k.id, s.nama, 'tidak'
FROM public.kelompok_aset k,
     (VALUES ('Laptop'), ('PC / Desktop'), ('Speaker / Audio'), ('Wifi / Router')) AS s(nama)
WHERE k.nama = 'Elektronik & IT'
ON CONFLICT DO NOTHING;

-- Elektronik Rumah Tangga → bulan
INSERT INTO public.sub_kelompok_aset (kelompok_id, nama, maintenance_type)
SELECT k.id, s.nama, 'bulan'
FROM public.kelompok_aset k,
     (VALUES ('AC'), ('Kulkas'), ('Dispenser'), ('Magic Com')) AS s(nama)
WHERE k.nama = 'Elektronik Rumah Tangga'
ON CONFLICT DO NOTHING;

-- Furnitur → tidak
INSERT INTO public.sub_kelompok_aset (kelompok_id, nama, maintenance_type)
SELECT k.id, s.nama, 'tidak'
FROM public.kelompok_aset k,
     (VALUES ('Meja'), ('Kursi'), ('Lemari'), ('Brankas')) AS s(nama)
WHERE k.nama = 'Furnitur'
ON CONFLICT DO NOTHING;

-- Sarana Pendukung → tidak
INSERT INTO public.sub_kelompok_aset (kelompok_id, nama, maintenance_type)
SELECT k.id, s.nama, 'tidak'
FROM public.kelompok_aset k,
     (VALUES ('Tempat Sampah'), ('Lainnya')) AS s(nama)
WHERE k.nama = 'Sarana Pendukung'
ON CONFLICT DO NOTHING;
