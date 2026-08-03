-- =========================================================================
-- MENGGANTI DATA KELOMPOK & SUB-KELOMPOK ASET DENGAN DATA BARU
-- Peringatan: Script ini akan menghapus semua referensi kategori lama!
-- =========================================================================

-- 1. Hapus data lama (karena ada relasi CASCADE, hapus sub_kelompok dulu, lalu kelompok)
DELETE FROM public.sub_kelompok_aset;
DELETE FROM public.kelompok_aset;

-- 2. Reset urutan ID (Opsional, agar id baru rapi jika tidak diset manual)
-- ALTER SEQUENCE kelompok_aset_id_seq RESTART WITH 1;
-- ALTER SEQUENCE sub_kelompok_aset_id_seq RESTART WITH 1;

-- 3. Masukkan data kelompok_aset baru
INSERT INTO "public"."kelompok_aset" ("id", "nama", "prefix_kode") 
VALUES 
(1, 'Kendaraan Dinas', 'KND'), 
(2, 'Elektronik & IT', 'ELK'), 
(3, 'Elektronik Rumah Tangga', 'ERT'), 
(4, 'Furnitur', 'FUR'), 
(5, 'Sarana Pendukung', 'SRN'), 
(25, 'lainnya', 'LN'), 
(26, 'Tanah', 'TNH-0'), 
(27, 'Bangunan/Gedung', 'BGN-0');

-- 4. Masukkan data sub_kelompok_aset baru
INSERT INTO "public"."sub_kelompok_aset" ("id", "kelompok_id", "nama", "maintenance_type") 
VALUES 
(1, 1, 'Mobil', 'km'), 
(2, 1, 'Motor', 'km'), 
(3, 2, 'Laptop', 'tidak'), 
(4, 2, 'PC', 'tidak'), 
(5, 2, 'Printer', 'bulan'), 
(6, 2, 'Proyektor', 'bulan'), 
(7, 2, 'Speaker', 'tidak'), 
(8, 2, 'Wifi / Router', 'tidak'), 
(9, 3, 'AC', 'bulan'), 
(10, 3, 'Kulkas', 'bulan'), 
(11, 3, 'Dispenser', 'bulan'), 
(12, 3, 'Magic Com', 'bulan'), 
(13, 4, 'Meja', 'tidak'), 
(14, 4, 'Kursi', 'tidak'), 
(15, 4, 'Lemari', 'tidak'), 
(16, 4, 'Brankas', 'tidak'), 
(17, 5, 'Tempat Sampah', 'tidak'), 
(18, 5, 'Lainnya', 'tidak'), 
(19, 25, 'Rautan', 'tidak'), 
(20, 26, 'Tanah Bangunan Kantor Pemerintah', 'tidak'), 
(21, 26, 'Tanah Bangunan Rumah Negara', 'tidak'), 
(22, 27, 'Bangunan Gedung Kantor Permanen', 'tidak'), 
(23, 27, 'Rumah Negara Tipe C/D permanen', 'tidak'), 
(24, 27, 'Bangunan Tempat Parkir / Pagar Permanen / Gedung Garasi', 'tidak');

-- 5. Sesuaikan nilai Serial ID terakhir agar insert berikutnya tidak error duplicate key
SELECT setval(pg_get_serial_sequence('public.kelompok_aset', 'id'), coalesce(max(id),0) + 1, false) FROM public.kelompok_aset;
SELECT setval(pg_get_serial_sequence('public.sub_kelompok_aset', 'id'), coalesce(max(id),0) + 1, false) FROM public.sub_kelompok_aset;
