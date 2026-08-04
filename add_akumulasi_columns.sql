-- Tambahkan kolom akumulasi penyusutan dan nilai buku ke tabel assets
ALTER TABLE public.assets 
ADD COLUMN IF NOT EXISTS akumulasi_penyusutan NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS nilai_buku NUMERIC DEFAULT 0;
