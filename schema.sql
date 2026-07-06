-- =========================================================================
-- SKEMA DATABASE SIMALOG (SUPABASE)
-- Silakan jalankan seluruh skrip ini di menu "SQL Editor" pada dasbor Supabase Anda.
-- =========================================================================

-- 1. Hapus tabel jika sudah ada (untuk mencegah error bila dijalankan ulang)
DROP TABLE IF EXISTS permintaan;
DROP TABLE IF EXISTS log_transaksi;
DROP TABLE IF EXISTS barang;
DROP TABLE IF EXISTS users;

-- 2. Buat Tabel Users
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nama TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('Admin', 'User')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Buat Tabel Barang
CREATE TABLE barang (
  kode_barang TEXT PRIMARY KEY,
  nama_barang TEXT NOT NULL,
  kategori TEXT NOT NULL,
  stok_saat_ini INTEGER NOT NULL DEFAULT 0,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Buat Tabel Log Transaksi (Masuk / Keluar)
CREATE TABLE log_transaksi (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kode_barang TEXT REFERENCES barang(kode_barang) ON DELETE CASCADE,
  jenis_transaksi TEXT NOT NULL CHECK (jenis_transaksi IN ('Masuk', 'Keluar')),
  jumlah INTEGER NOT NULL CHECK (jumlah > 0),
  tanggal DATE NOT NULL,
  penerima TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Buat Tabel Permintaan
CREATE TABLE permintaan (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_user UUID REFERENCES users(id) ON DELETE CASCADE,
  nama_pemohon TEXT NOT NULL,
  kode_barang TEXT REFERENCES barang(kode_barang) ON DELETE CASCADE,
  jumlah INTEGER NOT NULL CHECK (jumlah > 0),
  tanggal_minta DATE NOT NULL,
  status_persetujuan TEXT NOT NULL DEFAULT 'Diajukan' CHECK (status_persetujuan IN ('Diajukan', 'Disetujui', 'Diterima', 'Ditolak')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Masukkan Data Pengguna Palsu (Dummy) untuk Testing Login
INSERT INTO users (id, nama, role) VALUES 
  ('11111111-1111-1111-1111-111111111111', 'Admin (BPHL IV)', 'Admin'),
  ('22222222-2222-2222-2222-222222222222', 'Pegawai (Demo)', 'User');

-- =========================================================================
-- PENGATURAN SUPABASE STORAGE (BUCKET GAMBAR BARANG)
-- =========================================================================

-- 7. Membuat Bucket bernama 'images'
INSERT INTO storage.buckets (id, name, public)
VALUES ('images', 'images', true)
ON CONFLICT (id) DO NOTHING;

-- 8. Membuat Aturan Izin Akses (Policy)
-- a. Izinkan semua orang melihat gambar
CREATE POLICY "Public Access"
  ON storage.objects FOR SELECT
  USING ( bucket_id = 'images' );

-- b. Izinkan semua orang (anon) untuk mengunggah gambar (Hanya untuk testing)
CREATE POLICY "Allow Insert"
  ON storage.objects FOR INSERT
  WITH CHECK ( bucket_id = 'images' );

-- c. Izinkan semua orang untuk memperbarui gambar
CREATE POLICY "Allow Update"
  ON storage.objects FOR UPDATE
  WITH CHECK ( bucket_id = 'images' );

-- d. Izinkan semua orang untuk menghapus gambar
CREATE POLICY "Allow Delete"
  ON storage.objects FOR DELETE
  USING ( bucket_id = 'images' );
