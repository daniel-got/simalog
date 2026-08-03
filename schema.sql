-- =========================================================================
-- SKEMA DATABASE SIMALOG (SUPABASE)
-- Silakan jalankan seluruh skrip ini di menu "SQL Editor" pada dasbor Supabase Anda.
-- =========================================================================

-- 1. Hapus tabel jika sudah ada (JANGAN DIJALANKAN JIKA DATA SUDAH ADA)
-- DROP TABLE IF EXISTS permintaan;
-- DROP TABLE IF EXISTS log_transaksi;
-- DROP TABLE IF EXISTS barang;
-- DROP TABLE IF EXISTS users;

-- 2. Buat Tabel Users
-- CREATE TABLE users (
--   id UUID PRIMARY KEY,
--   nama TEXT NOT NULL,
--   role TEXT NOT NULL CHECK (role IN ('Admin', 'User')),
--   created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
-- );

-- 3. Buat Tabel Barang
-- CREATE TABLE barang (
--   kode_barang TEXT PRIMARY KEY,
--   nama_barang TEXT NOT NULL,
--   kategori TEXT NOT NULL,
--   stok_saat_ini INTEGER NOT NULL DEFAULT 0,
--   image_url TEXT,
--   created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
-- );

-- 4. Buat Tabel Log Transaksi (Masuk / Keluar)
-- CREATE TABLE log_transaksi (
--   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--   kode_barang TEXT REFERENCES barang(kode_barang) ON DELETE CASCADE,
--   jenis_transaksi TEXT NOT NULL CHECK (jenis_transaksi IN ('Masuk', 'Keluar')),
--   jumlah INTEGER NOT NULL CHECK (jumlah > 0),
--   tanggal DATE NOT NULL,
--   penerima TEXT NOT NULL,
--   created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
-- );

-- 5. Buat Tabel Permintaan
-- CREATE TABLE permintaan (
--   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--   id_user UUID REFERENCES users(id) ON DELETE CASCADE,
--   nama_pemohon TEXT NOT NULL,
--   kode_barang TEXT REFERENCES barang(kode_barang) ON DELETE CASCADE,
--   jumlah INTEGER NOT NULL CHECK (jumlah > 0),
--   tanggal_minta DATE NOT NULL,
--   status_persetujuan TEXT NOT NULL DEFAULT 'Diajukan' CHECK (status_persetujuan IN ('Diajukan', 'Disetujui', 'Diterima', 'Ditolak')),
--   created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
-- );
-- 6. Hapus Data Dummy Lama (karena sekarang memakai auth.users, Anda harus mendaftar via Supabase Authentication dulu, lalu Insert manual ke tabel users ini dengan ID yang sama)
-- Namun, untuk mengakomodasi Guest (tanpa login Supabase), kita butuh satu UUID statis:
INSERT INTO users (id, nama, role) VALUES ('00000000-0000-0000-0000-000000000000', 'Guest', 'User') ON CONFLICT DO NOTHING;

-- =========================================================================
-- TRIGGER UNTUK OTOMATIS MENAMBAHKAN ADMIN BARU
-- =========================================================================
-- Supaya setiap kali Anda membuat user di menu Authentication Supabase, 
-- user tersebut otomatis masuk ke tabel public.users dengan role 'Admin'

CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, nama, role)
  VALUES (new.id, COALESCE(new.raw_user_meta_data->>'nama', 'Administrator'), 'Admin');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Hapus trigger jika sudah ada untuk menghindari error
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- =========================================================================
-- MENGAKTIFKAN KEAMANAN (ROW LEVEL SECURITY / RLS)
-- =========================================================================

-- Aktifkan RLS pada semua tabel
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE barang ENABLE ROW LEVEL SECURITY;
ALTER TABLE log_transaksi ENABLE ROW LEVEL SECURITY;
ALTER TABLE permintaan ENABLE ROW LEVEL SECURITY;

-- 1. Kebijakan (Policy) Tabel `users`
CREATE POLICY "Public Read Users" ON users FOR SELECT USING (true);
CREATE POLICY "Admin Update Users" ON users FOR UPDATE USING (auth.uid() = id);

-- 2. Kebijakan (Policy) Tabel `barang`
CREATE POLICY "Public Read Barang" ON barang FOR SELECT USING (true);
CREATE POLICY "Admin Insert Barang" ON barang FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'Admin')
);
CREATE POLICY "Admin Update Barang" ON barang FOR UPDATE USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'Admin')
);
CREATE POLICY "Admin Delete Barang" ON barang FOR DELETE USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'Admin')
);

-- 3. Kebijakan (Policy) Tabel `log_transaksi`
CREATE POLICY "Public Read Log" ON log_transaksi FOR SELECT USING (true);
CREATE POLICY "Admin Insert Log" ON log_transaksi FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'Admin')
);
CREATE POLICY "Admin Update Log" ON log_transaksi FOR UPDATE USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'Admin')
);
CREATE POLICY "Admin Delete Log" ON log_transaksi FOR DELETE USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'Admin')
);

-- 4. Kebijakan (Policy) Tabel `permintaan`
CREATE POLICY "Public Read Permintaan" ON permintaan FOR SELECT USING (true);
-- Siapapun (termasuk Guest tanpa login Supabase) bisa membuat permintaan
CREATE POLICY "Public Insert Permintaan" ON permintaan FOR INSERT WITH CHECK (true);
-- Hanya Admin yang bisa mengupdate (menyetujui/menolak) atau menghapus permintaan
CREATE POLICY "Admin Update Permintaan" ON permintaan FOR UPDATE USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'Admin')
);
CREATE POLICY "Admin Delete Permintaan" ON permintaan FOR DELETE USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'Admin')
);

-- =========================================================================
-- PENGATURAN SUPABASE STORAGE (BUCKET GAMBAR BARANG)
-- =========================================================================

-- 7. Membuat Bucket bernama 'images' (JIKA BELUM ADA)
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('images', 'images', true)
-- ON CONFLICT (id) DO NOTHING;

-- 8. Membuat Aturan Izin Akses (Policy) (SUDAH DIBUAT SEBELUMNYA)
-- a. Izinkan semua orang melihat gambar
-- CREATE POLICY "Public Access"
--   ON storage.objects FOR SELECT
--   USING ( bucket_id = 'images' );

-- b. Izinkan semua orang (anon) untuk mengunggah gambar (Hanya untuk testing)
-- CREATE POLICY "Allow Insert"
--   ON storage.objects FOR INSERT
--   WITH CHECK ( bucket_id = 'images' );

-- c. Izinkan semua orang untuk memperbarui gambar
-- CREATE POLICY "Allow Update"
--   ON storage.objects FOR UPDATE
--   WITH CHECK ( bucket_id = 'images' );

-- d. Izinkan semua orang untuk menghapus gambar
-- CREATE POLICY "Allow Delete"
--   ON storage.objects FOR DELETE
--   USING ( bucket_id = 'images' );


-- =========================================================================
-- TABEL & POLICY HARTA BENDA (ASET, PERAWATAN, AKTIVITAS)
-- =========================================================================

-- 9. Buat Tabel Daftar Aset
-- CREATE TABLE daftar_aset (
--   id TEXT PRIMARY KEY,
--   nama_aset TEXT NOT NULL,
--   kategori_aset TEXT NOT NULL,
--   merek_tipe TEXT,
--   nomor_seri_plat TEXT,
--   lokasi_ruangan TEXT NOT NULL,
--   tanggal_perolehan DATE NOT NULL,
--   harga_beli NUMERIC NOT NULL DEFAULT 0,
--   status_kondisi TEXT NOT NULL DEFAULT 'Baik' CHECK (status_kondisi IN ('Baik', 'Rusak Ringan', 'Rusak Berat', 'Dihapuskan')),
--   image_url TEXT,
--   created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
-- );

-- 10. Buat Tabel Log Perawatan Aset
-- CREATE TABLE log_perawatan_aset (
--   id BIGSERIAL PRIMARY KEY,
--   id_aset TEXT REFERENCES daftar_aset(id) ON DELETE CASCADE,
--   kategori_biaya TEXT NOT NULL,
--   total_biaya NUMERIC NOT NULL DEFAULT 0,
--   tanggal DATE NOT NULL,
--   keterangan TEXT,
--   created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
-- );

-- 11. Buat Tabel Log Aktivitas Aset
-- CREATE TABLE log_aktivitas_aset (
--   id BIGSERIAL PRIMARY KEY,
--   id_aset TEXT REFERENCES daftar_aset(id) ON DELETE CASCADE,
--   jenis_aktivitas TEXT NOT NULL,
--   nama_staf TEXT NOT NULL,
--   tanggal DATE NOT NULL,
--   tanggal_rencana_kembali DATE,
--   keterangan TEXT,
--   created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
-- );

-- 12. Aktifkan RLS pada semua tabel Harta Benda
-- ALTER TABLE daftar_aset ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE log_perawatan_aset ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE log_aktivitas_aset ENABLE ROW LEVEL SECURITY;

-- 13. Kebijakan (Policy) Tabel `daftar_aset`
-- CREATE POLICY "Public Read Aset" ON daftar_aset FOR SELECT USING (true);
-- CREATE POLICY "Admin Insert Aset" ON daftar_aset FOR INSERT WITH CHECK (
--   EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'Admin')
-- );
-- CREATE POLICY "Admin Update Aset" ON daftar_aset FOR UPDATE USING (
--   EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'Admin')
-- );
-- CREATE POLICY "Admin Delete Aset" ON daftar_aset FOR DELETE USING (
--   EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'Admin')
-- );

-- 14. Kebijakan (Policy) Tabel `log_perawatan_aset`
-- CREATE POLICY "Public Read Perawatan Aset" ON log_perawatan_aset FOR SELECT USING (true);
-- CREATE POLICY "Public Insert Perawatan Aset" ON log_perawatan_aset FOR INSERT WITH CHECK (true);
-- CREATE POLICY "Admin Update Perawatan Aset" ON log_perawatan_aset FOR UPDATE USING (
--   EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'Admin')
-- );
-- CREATE POLICY "Admin Delete Perawatan Aset" ON log_perawatan_aset FOR DELETE USING (
--   EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'Admin')
-- );

-- 15. Kebijakan (Policy) Tabel `log_aktivitas_aset`
-- CREATE POLICY "Public Read Aktivitas Aset" ON log_aktivitas_aset FOR SELECT USING (true);
-- CREATE POLICY "Public Insert Aktivitas Aset" ON log_aktivitas_aset FOR INSERT WITH CHECK (true);
-- CREATE POLICY "Public Delete Aktivitas Aset" ON log_aktivitas_aset FOR DELETE USING (true);
-- CREATE POLICY "Admin Update Aktivitas Aset" ON log_aktivitas_aset FOR UPDATE USING (
--   EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'Admin')
-- );

