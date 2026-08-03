import { supabase } from '../../lib/supabase';

const createAktivitasSlice = (set, get) => ({
    logAktivitas: [],

    addAktivitas: async (item) => {
        const { data, error } = await supabase.from('log_aktivitas_aset').insert([item]).select();
        if (error) { alert('Gagal mencatat aktivitas: ' + error.message); return false; }
        if (data) set((s) => ({ logAktivitas: [data[0], ...s.logAktivitas] }));
        return true;
    },

    updateAktivitas: async (id, updatedItem) => {
        const { data, error } = await supabase.from('log_aktivitas_aset').update(updatedItem).eq('id', id).select();
        if (error) { alert('Gagal mengupdate aktivitas: ' + error.message); return false; }
        if (data) set((s) => ({ logAktivitas: s.logAktivitas.map(a => a.id === id ? data[0] : a) }));
        return true;
    },

    deleteAktivitas: async (id) => {
        const { error } = await supabase.from('log_aktivitas_aset').delete().eq('id', id);
        if (error) { alert('Gagal menghapus log aktivitas: ' + error.message); return false; }
        set((s) => ({ logAktivitas: s.logAktivitas.filter(a => a.id !== id) }));
        return true;
    },
});

export default createAktivitasSlice;
