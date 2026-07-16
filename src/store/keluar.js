import { supabase } from '../lib/supabase';

const createKeluarSlice = (set, get) => ({
    keluar: [],

    addKeluar: async (item) => {
        const payload = {
            kode_barang: item.kode_barang,
            jenis_transaksi: 'Keluar',
            jumlah: parseInt(item.jumlah),
            tanggal: item.tanggal,
            penerima: item.penerima,
            created_by: get().currentUser?.nama || 'Unknown',
        };
        const { data, error } = await supabase.from('log_transaksi').insert([payload]).select();
        if (error) { alert('Gagal catat keluar: ' + error.message); return; }

        if (data) {
            const { error: rpcError } = await supabase.rpc('adjust_stok', {
                p_kode_barang: item.kode_barang,
                p_delta: -payload.jumlah
            });
            if (rpcError) console.error('Gagal update stok:', rpcError);

            get().fetchData();
        }
    },
});

export default createKeluarSlice;