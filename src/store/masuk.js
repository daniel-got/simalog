import { supabase } from '../lib/supabase';

const createMasukSlice = (set, get) => ({
    masuk: [],

    // Transaksi Actions
    addMasuk: async (item) => {
        const payload = {
            kode_barang: item.kode_barang,
            jenis_transaksi: 'Masuk',
            jumlah: parseInt(item.jumlah),
            tanggal: item.tanggal,
            penerima: item.penerima,
            created_by: get().currentUser?.nama || 'Unknown',
        };
        const { data, error } = await supabase.from('log_transaksi').insert([payload]).select();
        if (error) { alert('Gagal catat masuk: ' + error.message); return; }

        if (data) {
            const { error: rpcError } = await supabase.rpc('adjust_stok', {
                p_kode_barang: item.kode_barang,
                p_delta: payload.jumlah
            });
            if (rpcError) console.error('Gagal update stok:', rpcError);

            get().fetchData();
        }
    },

    updateLogTransaksi: async (id, oldItem, newItem) => {
        // 1. Revert efek stok lama
        const revertDelta = oldItem.jenis_transaksi === 'Masuk'
            ? -oldItem.jumlah
            : oldItem.jumlah;
        const { error: revertError } = await supabase.rpc('adjust_stok', {
            p_kode_barang: oldItem.kode_barang,
            p_delta: revertDelta
        });
        if (revertError) console.error('Gagal revert stok:', revertError);

        // 2. Apply efek stok baru
        const newQty = parseInt(newItem.jumlah);
        const applyDelta = oldItem.jenis_transaksi === 'Masuk' ? newQty : -newQty;
        const { error: applyError } = await supabase.rpc('adjust_stok', {
            p_kode_barang: newItem.kode_barang,
            p_delta: applyDelta
        });
        if (applyError) console.error('Gagal apply stok baru:', applyError);

        // 3. Update log
        const payload = {
            kode_barang: newItem.kode_barang,
            jumlah: parseInt(newItem.jumlah),
            tanggal: newItem.tanggal,
            penerima: newItem.penerima,
        };
        const { error } = await supabase.from('log_transaksi').update(payload).eq('id', id);
        if (error) alert('Gagal update log: ' + error.message);

        get().fetchData();
    },

    deleteLogTransaksi: async (id, item) => {
        // Revert efek stok
        const revertDelta = item.jenis_transaksi === 'Masuk' ? -item.jumlah : item.jumlah;
        const { error: revertError } = await supabase.rpc('adjust_stok', {
            p_kode_barang: item.kode_barang,
            p_delta: revertDelta
        });
        if (revertError) console.error('Gagal revert stok:', revertError);

        // Delete log
        const { error } = await supabase.from('log_transaksi').delete().eq('id', id);
        if (error) alert('Gagal hapus log: ' + error.message);

        get().fetchData();
    },
});

export default createMasukSlice;