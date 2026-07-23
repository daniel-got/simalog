import { supabase } from '../../lib/supabase';

const createAsetSlice = (set, get) => ({
    // Data State untuk Harta Benda
    aset: [],

    // Aset Actions
    fetchAset: async () => {
        const { data, error } = await supabase
            .from('aset')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error(error);
        } else if (data) {
            set({ aset: data });
        }
    },

    addAset: async (item) => {
        const payload = {
            ...item,
            // Perubahan: Mengambil user login dari fungsi helper di store induk
            updated_by: get().getCurrentUserNama ? get().getCurrentUserNama() : 'Unknown',
        };
        const { data, error } = await supabase.from('aset').insert([payload]).select();
        if (error) {
            console.error(error);
            alert('Gagal menambah aset: ' + error.message);
        } else if (data) {
            set((state) => ({ aset: [data[0], ...state.aset] }));
        }
    },

    updateAset: async (id, updatedItem) => {
        const payload = {
            ...updatedItem,
            // Perubahan: Mengambil user login dari fungsi helper di store induk
            updated_by: get().getCurrentUserNama ? get().getCurrentUserNama() : 'Unknown',
            updated_at: new Date().toISOString(),
        };
        const { data, error } = await supabase.from('aset').update(payload).eq('id', id).select();
        if (error) {
            console.error(error);
            alert('Gagal mengupdate aset: ' + error.message);
        } else if (data) {
            set((state) => ({
                aset: state.aset.map(a => a.id === id ? data[0] : a)
            }));
        }
    },

    deleteAset: async (id) => {
        const { error } = await supabase.from('aset').delete().eq('id', id);
        if (error) {
            alert('Gagal menghapus aset');
        } else {
            set((state) => ({ aset: state.aset.filter(a => a.id !== id) }));
        }
    },
});

export default createAsetSlice;