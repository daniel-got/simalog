import { supabase } from '../../lib/supabase';

const createBarangSlice = (set, get) => ({
    // Data State
    barang: [],

    // Barang Actions
    addBarang: async (item) => {
        const { data, error } = await supabase.from('barang').insert([item]).select();
        if (error) {
            console.error(error);
            alert('Gagal menambah barang: ' + error.message);
        } else if (data) {
            set((state) => ({ barang: [data[0], ...state.barang] }));
        }
    },
    updateBarang: async (kode, updatedItem) => {
        const payload = {
            ...updatedItem,
            updated_by: get().currentUser?.nama || 'Unknown',
            updated_at: new Date().toISOString(),
        };
        const { data, error } = await supabase.from('barang').update(payload).eq('kode_barang', kode).select();
        if (error) console.error(error);
        else if (data) {
            set((state) => ({
                barang: state.barang.map(b => b.kode_barang === kode ? data[0] : b)
            }));
        }
    },
    deleteBarang: async (kode) => {
        const { error } = await supabase.from('barang').delete().eq('kode_barang', kode);
        if (error) {
            alert('Gagal menghapus barang');
        } else {
            set((state) => ({ barang: state.barang.filter(b => b.kode_barang !== kode) }));
        }
    },
});

export default createBarangSlice;