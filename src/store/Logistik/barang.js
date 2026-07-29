import { supabase } from '../../lib/supabase';

const createBarangSlice = (set, get) => ({
    barang: [],

    // Fungsi Tambah Barang
    addBarang: async (newItem, file, lampiranFile) => {
        try {
            let imageUrl = newItem.image_url || null;
            let lampiranUrl = newItem.lampiran_url || null;

            // 1. Jika ada file gambar yang diunggah
            if (file) {
                // Bersihkan spasi/karakter aneh pada kode barang untuk nama file
                const cleanCode = (newItem.kode_barang || 'item').replace(/[^a-zA-Z0-9]/g, '_');
                const fileExt = file.name.split('.').pop();
                const fileName = `${cleanCode}-${Date.now()}.${fileExt}`;
                const filePath = `barang/${fileName}`;

                // Upload ke bucket 'images' (huruf kecil konsisten)
                const { error: uploadError } = await supabase.storage
                    .from('images')
                    .upload(filePath, file, {
                        cacheControl: '3600',
                        upsert: true
                    });

                if (uploadError) {
                    console.error('Error uploading image:', uploadError.message);
                    throw uploadError;
                }

                // Ambil URL Publik resmi Supabase
                const { data: publicUrlData } = supabase.storage
                    .from('images')
                    .getPublicUrl(filePath);

                if (publicUrlData?.publicUrl) {
                    imageUrl = publicUrlData.publicUrl;
                }
            }

            // 1b. Jika ada file lampiran yang diunggah (opsional)
            if (lampiranFile) {
                const cleanCode = (newItem.kode_barang || 'item').replace(/[^a-zA-Z0-9]/g, '_');
                const fileExt = lampiranFile.name.split('.').pop();
                const fileName = `lampiran_${cleanCode}-${Date.now()}.${fileExt}`;
                const filePath = `barang/lampiran/${fileName}`;

                const { error: uploadLampiranError } = await supabase.storage
                    .from('images')
                    .upload(filePath, lampiranFile, {
                        cacheControl: '3600',
                        upsert: true
                    });

                if (uploadLampiranError) {
                    console.error('Error uploading lampiran:', uploadLampiranError.message);
                    throw uploadLampiranError;
                }

                const { data: publicLampiranData } = supabase.storage
                    .from('images')
                    .getPublicUrl(filePath);

                if (publicLampiranData?.publicUrl) {
                    lampiranUrl = publicLampiranData.publicUrl;
                }
            }

            // 2. Simpan ke Database
            const payload = {
                ...newItem,
                satuan_harga: Number(newItem.satuan_harga || 0),
                stok_saat_ini: Number(newItem.stok_saat_ini || 0),
                image_url: imageUrl,
                lampiran_url: lampiranUrl
            };

            const { data, error } = await supabase
                .from('barang')
                .insert([payload])
                .select();

            if (error) throw error;

            // 3. Sync State Lokal & Refresh
            if (get().fetchData) {
                await get().fetchData();
            } else if (data && data.length > 0) {
                set((state) => ({ barang: [data[0], ...state.barang] }));
            }

            return { success: true };
        } catch (err) {
            console.error('Failed to add barang:', err);
            return { success: false, error: err.message };
        }
    },

    // Fungsi Update Barang
    updateBarang: async (kode, updatedItem, file, lampiranFile) => {
        try {
            let imageUrl = updatedItem.image_url || null;
            let lampiranUrl = updatedItem.lampiran_url || null;

            // 1. Jika ada file gambar baru yang diunggah
            if (file) {
                const cleanCode = (kode || 'item').replace(/[^a-zA-Z0-9]/g, '_');
                const fileExt = file.name.split('.').pop();
                const fileName = `${cleanCode}-${Date.now()}.${fileExt}`;
                const filePath = `barang/${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from('images')
                    .upload(filePath, file, {
                        cacheControl: '3600',
                        upsert: true
                    });

                if (uploadError) {
                    console.error('Error uploading image:', uploadError.message);
                    throw uploadError;
                }

                const { data: publicUrlData } = supabase.storage
                    .from('images')
                    .getPublicUrl(filePath);

                if (publicUrlData?.publicUrl) {
                    imageUrl = publicUrlData.publicUrl;
                }
            }

            // 1b. Jika ada file lampiran baru yang diunggah
            if (lampiranFile) {
                const cleanCode = (kode || 'item').replace(/[^a-zA-Z0-9]/g, '_');
                const fileExt = lampiranFile.name.split('.').pop();
                const fileName = `lampiran_${cleanCode}-${Date.now()}.${fileExt}`;
                const filePath = `barang/lampiran/${fileName}`;

                const { error: uploadLampiranError } = await supabase.storage
                    .from('images')
                    .upload(filePath, lampiranFile, {
                        cacheControl: '3600',
                        upsert: true
                    });

                if (uploadLampiranError) {
                    console.error('Error uploading lampiran:', uploadLampiranError.message);
                    throw uploadLampiranError;
                }

                const { data: publicLampiranData } = supabase.storage
                    .from('images')
                    .getPublicUrl(filePath);

                if (publicLampiranData?.publicUrl) {
                    lampiranUrl = publicLampiranData.publicUrl;
                }
            }

            // 2. Update Database
            const payload = {
                ...updatedItem,
                satuan_harga: Number(updatedItem.satuan_harga || 0),
                stok_saat_ini: Number(updatedItem.stok_saat_ini || 0),
                image_url: imageUrl,
                lampiran_url: lampiranUrl
            };

            const { error } = await supabase
                .from('barang')
                .update(payload)
                .eq('kode_barang', kode);

            if (error) throw error;

            // 3. Sync State Lokal & Refresh
            if (get().fetchData) {
                await get().fetchData();
            }

            return { success: true };
        } catch (err) {
            console.error('Failed to update barang:', err);
            return { success: false, error: err.message };
        }
    },

    // Fungsi Hapus Barang
    deleteBarang: async (kode) => {
        try {
            const { error } = await supabase
                .from('barang')
                .delete()
                .eq('kode_barang', kode);

            if (error) throw error;

            if (get().fetchData) {
                await get().fetchData();
            } else {
                set((state) => ({
                    barang: state.barang.filter((b) => b.kode_barang !== kode)
                }));
            }

            return { success: true };
        } catch (err) {
            console.error('Failed to delete barang:', err);
            return { success: false, error: err.message };
        }
    }
});

export default createBarangSlice;