-- =========================================================================
-- SIMALOG – MIGRATION HARTA BENDA v2 (FIXED RLS)
-- Jalankan di: Supabase Dashboard → SQL Editor
-- =========================================================================

-- ─────────────────────────────────────────────────────────────────────────
-- 1. TABEL KELOMPOK ASET
-- ─────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.kelompok_aset (
    id          BIGSERIAL PRIMARY KEY,
    nama        TEXT NOT NULL,
    prefix_kode TEXT NOT NULL UNIQUE,        -- contoh: KND, ELK, FRN
    created_at  TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- ─────────────────────────────────────────────────────────────────────────
-- 2. TABEL SUB-KELOMPOK ASET
-- ─────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.sub_kelompok_aset (
    id               BIGSERIAL PRIMARY KEY,
    kelompok_id      BIGINT NOT NULL REFERENCES public.kelompok_aset(id) ON DELETE CASCADE,
    nama             TEXT NOT NULL,
    maintenance_type TEXT NOT NULL CHECK (maintenance_type IN ('km', 'bulan', 'tidak')),
    -- 'km'    -> Kendaraan (motor, mobil)
    -- 'bulan' -> Elektronik/alat servis rutin (AC, Printer, Proyektor, dll)
    -- 'tidak' -> Tanpa servis berkala (Laptop, PC, Furnitur, dll)
    created_at       TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- ─────────────────────────────────────────────────────────────────────────
-- 3. TABEL ASSETS (Tabel Utama Harta Benda v2)
-- ─────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.assets (
    id                      BIGSERIAL PRIMARY KEY,
    kode_aset               TEXT UNIQUE,              -- auto-generated, e.g. KND-0001
    kelompok_id             BIGINT REFERENCES public.kelompok_aset(id) ON DELETE SET NULL,
    sub_kelompok_id         BIGINT REFERENCES public.sub_kelompok_aset(id) ON DELETE SET NULL,

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
    lampiran_url            TEXT NULL,                -- opsional: nota/surat garansi/dokumen

    -- Field Kendaraan (maintenance_type = 'km')
    no_polisi               TEXT,
    km_saat_ini             NUMERIC,
    interval_km             NUMERIC,

    -- Field Servis Berkala (maintenance_type = 'bulan')
    interval_bulan          INTEGER,
    tanggal_servis_terakhir DATE,

    -- Audit
    created_by              UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    updated_by              UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at              TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at              TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- ─────────────────────────────────────────────────────────────────────────
-- 4. FUNCTION RPC: generate_kode_aset
--    Cara panggil di React: supabase.rpc('generate_kode_aset', { p_kelompok_id: id })
--    Return: TEXT — kode unik, contoh "KND-0001"
-- ─────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.generate_kode_aset(p_kelompok_id BIGINT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_prefix    TEXT;
    v_next_seq  INT;
    v_kode      TEXT;
BEGIN
    -- Ambil prefix kelompok
    SELECT prefix_kode INTO v_prefix
    FROM public.kelompok_aset
    WHERE id = p_kelompok_id;

    IF v_prefix IS NULL THEN
        RAISE EXCEPTION 'Kelompok aset dengan id % tidak ditemukan.', p_kelompok_id;
    END IF;

    -- Hitung nomor urut berikutnya untuk kelompok ini
    SELECT COALESCE(MAX(
        CAST(
            REGEXP_REPLACE(kode_aset, '^[A-Z]+-', '') AS INTEGER
        )
    ), 0) + 1
    INTO v_next_seq
    FROM public.assets
    WHERE kelompok_id = p_kelompok_id
      AND kode_aset IS NOT NULL
      AND kode_aset ~ ('^' || v_prefix || '-[0-9]+$');

    -- Format: PREFIX-XXXX (4 digit)
    v_kode := v_prefix || '-' || LPAD(v_next_seq::TEXT, 4, '0');

    RETURN v_kode;
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
-- 6. ROW LEVEL SECURITY (RLS) & HELPER FUNCTION
-- ─────────────────────────────────────────────────────────────────────────
ALTER TABLE public.kelompok_aset     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sub_kelompok_aset ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assets            ENABLE ROW LEVEL SECURITY;

-- Helper Function dengan SECURITY DEFINER agar aman mengecek role Admin tanpa terhalang RLS users
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

-- Hapus policy lama jika ada
DROP POLICY IF EXISTS "Public read kelompok_aset" ON public.kelompok_aset;
DROP POLICY IF EXISTS "Admin insert kelompok_aset" ON public.kelompok_aset;
DROP POLICY IF EXISTS "Admin update kelompok_aset" ON public.kelompok_aset;
DROP POLICY IF EXISTS "Admin delete kelompok_aset" ON public.kelompok_aset;

DROP POLICY IF EXISTS "Public read sub_kelompok_aset" ON public.sub_kelompok_aset;
DROP POLICY IF EXISTS "Admin insert sub_kelompok_aset" ON public.sub_kelompok_aset;
DROP POLICY IF EXISTS "Admin update sub_kelompok_aset" ON public.sub_kelompok_aset;
DROP POLICY IF EXISTS "Admin delete sub_kelompok_aset" ON public.sub_kelompok_aset;

DROP POLICY IF EXISTS "Public read assets" ON public.assets;
DROP POLICY IF EXISTS "Admin insert assets" ON public.assets;
DROP POLICY IF EXISTS "Admin update assets" ON public.assets;
DROP POLICY IF EXISTS "Admin delete assets" ON public.assets;

-- ── kelompok_aset ─────────────────────────────────────────────────────────
CREATE POLICY "Public read kelompok_aset"
    ON public.kelompok_aset FOR SELECT USING (true);

CREATE POLICY "Admin insert kelompok_aset"
    ON public.kelompok_aset FOR INSERT WITH CHECK (public.is_admin());

CREATE POLICY "Admin update kelompok_aset"
    ON public.kelompok_aset FOR UPDATE USING (public.is_admin());

CREATE POLICY "Admin delete kelompok_aset"
    ON public.kelompok_aset FOR DELETE USING (public.is_admin());

-- ── sub_kelompok_aset ─────────────────────────────────────────────────────
CREATE POLICY "Public read sub_kelompok_aset"
    ON public.sub_kelompok_aset FOR SELECT USING (true);

CREATE POLICY "Admin insert sub_kelompok_aset"
    ON public.sub_kelompok_aset FOR INSERT WITH CHECK (public.is_admin());

CREATE POLICY "Admin update sub_kelompok_aset"
    ON public.sub_kelompok_aset FOR UPDATE USING (public.is_admin());

CREATE POLICY "Admin delete sub_kelompok_aset"
    ON public.sub_kelompok_aset FOR DELETE USING (public.is_admin());

-- ── assets ────────────────────────────────────────────────────────────────
CREATE POLICY "Public read assets"
    ON public.assets FOR SELECT USING (true);

CREATE POLICY "Admin insert assets"
    ON public.assets FOR INSERT WITH CHECK (public.is_admin());

CREATE POLICY "Admin update assets"
    ON public.assets FOR UPDATE USING (public.is_admin());

CREATE POLICY "Admin delete assets"
    ON public.assets FOR DELETE USING (public.is_admin());

-- ─────────────────────────────────────────────────────────────────────────
-- 7. SEEDER DATA AWAL: kelompok_aset
-- ─────────────────────────────────────────────────────────────────────────
INSERT INTO public.kelompok_aset (nama, prefix_kode) VALUES
    ('Kendaraan',             'KND'),
    ('Elektronik & IT',       'ELK'),
    ('Furnitur & Inventaris', 'FRN'),
    ('Mesin & Peralatan',     'MSN'),
    ('Gedung & Bangunan',     'GDB'),
    ('Sarana Pendukung',      'SPD')
ON CONFLICT (prefix_kode) DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────────
-- 8. SEEDER DATA AWAL: sub_kelompok_aset
-- ─────────────────────────────────────────────────────────────────────────

-- Kendaraan → maintenance_type = 'km'
INSERT INTO public.sub_kelompok_aset (kelompok_id, nama, maintenance_type)
SELECT k.id, s.nama, 'km'
FROM public.kelompok_aset k,
     (VALUES ('Mobil'), ('Motor'), ('Kendaraan Roda Tiga'), ('Truk / Pick-up')) AS s(nama)
WHERE k.prefix_kode = 'KND';

-- Elektronik & IT → servis berkala bulan
INSERT INTO public.sub_kelompok_aset (kelompok_id, nama, maintenance_type)
SELECT k.id, s.nama, 'bulan'
FROM public.kelompok_aset k,
     (VALUES
        ('AC / Air Conditioner'), ('Printer'), ('Proyektor'),
        ('Kulkas / Freezer'), ('Dispenser'), ('Mesin Fotokopi'), ('UPS / Stabilizer')
     ) AS s(nama)
WHERE k.prefix_kode = 'ELK';

-- Elektronik & IT → tanpa servis berkala
INSERT INTO public.sub_kelompok_aset (kelompok_id, nama, maintenance_type)
SELECT k.id, s.nama, 'tidak'
FROM public.kelompok_aset k,
     (VALUES
        ('Laptop / Notebook'), ('PC / Desktop'), ('Monitor'),
        ('Speaker / Audio'), ('Wifi Router / Switch'), ('Kamera / CCTV'), ('Telepon / PABX')
     ) AS s(nama)
WHERE k.prefix_kode = 'ELK';

-- Furnitur & Inventaris → tanpa servis
INSERT INTO public.sub_kelompok_aset (kelompok_id, nama, maintenance_type)
SELECT k.id, s.nama, 'tidak'
FROM public.kelompok_aset k,
     (VALUES ('Meja Kerja'), ('Kursi'), ('Lemari / Rak'), ('Sofa / Mebel'), ('Partisi / Sekat')) AS s(nama)
WHERE k.prefix_kode = 'FRN';

-- Mesin & Peralatan → servis berkala bulan
INSERT INTO public.sub_kelompok_aset (kelompok_id, nama, maintenance_type)
SELECT k.id, s.nama, 'bulan'
FROM public.kelompok_aset k,
     (VALUES ('Genset / Generator'), ('Pompa Air'), ('Kompresor'), ('Mesin Laundry')) AS s(nama)
WHERE k.prefix_kode = 'MSN';

-- Sarana Pendukung → tanpa servis
INSERT INTO public.sub_kelompok_aset (kelompok_id, nama, maintenance_type)
SELECT k.id, s.nama, 'tidak'
FROM public.kelompok_aset k,
     (VALUES
        ('Papan Tulis / Whiteboard'), ('Proyektor Screen'),
        ('Sound System Portable'), ('Teralis / Pagar'), ('Tanda / Signage')
     ) AS s(nama)
WHERE k.prefix_kode = 'SPD';