import { supabase } from '../lib/supabase';

const createMintaSlice = (set, get) => ({
    // Data State
    minta: [],

    // Permintaan Actions
    addMinta: async (item) => {
        const { error } = await supabase.from('permintaan').insert([item]);
        if (error) alert('Gagal minta barang: ' + error.message);
        else get().fetchData();
    },
    updateMintaStatus: async (id, status) => {
        const { error } = await supabase.from('permintaan')
            .update({ status_persetujuan: status })
            .eq('id', id);
        if (error) alert('Gagal update status: ' + error.message);
        else get().fetchData();
    },
    updateMintaStatus: async (id, status) => {
        const { error } = await supabase.from('permintaan')
            .update({
                status_persetujuan: status,
                processed_by: get().currentUser?.nama || 'Unknown',
                processed_at: new Date().toISOString(),
            })
            .eq('id', id);
        if (error) alert('Gagal update status: ' + error.message);
        else get().fetchData();
    },
    deleteMinta: async (id) => {
        const { error } = await supabase.from('permintaan')
            .delete()
            .eq('id', id);
        if (error) alert('Gagal hapus permintaan: ' + error.message);
        else get().fetchData();
    },
});

export default createMintaSlice;