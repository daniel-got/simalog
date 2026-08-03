import { supabase } from '../../lib/supabase';

const createPerawatanSlice = (set, get) => ({
    logPerawatan: [],

    addPerawatan: async (item) => {
        const { data, error } = await supabase.from('log_perawatan_aset').insert([item]).select();
        if (error) { alert('Gagal mencatat perawatan: ' + error.message); return false; }
        if (data) set((s) => ({ logPerawatan: [data[0], ...s.logPerawatan] }));
        return true;
    },

    updatePerawatan: async (id, updatedItem) => {
        const { data, error } = await supabase.from('log_perawatan_aset').update(updatedItem).eq('id', id).select();
        if (error) { alert('Gagal mengupdate perawatan: ' + error.message); return false; }
        if (data) set((s) => ({ logPerawatan: s.logPerawatan.map(p => p.id === id ? data[0] : p) }));
        return true;
    },

    deletePerawatan: async (id) => {
        const { error } = await supabase.from('log_perawatan_aset').delete().eq('id', id);
        if (error) { alert('Gagal menghapus log perawatan: ' + error.message); return false; }
        set((s) => ({ logPerawatan: s.logPerawatan.filter(p => p.id !== id) }));
        return true;
    },
});

export default createPerawatanSlice;
