import { supabase } from '../../lib/supabase';

const adjustStokManual = async (kode, delta) => {
    const { data } = await supabase.from('barang').select('stok_saat_ini').eq('kode_barang', kode).single();
    if (data) {
        await supabase.from('barang').update({ stok_saat_ini: data.stok_saat_ini + delta }).eq('kode_barang', kode);
    }
};

const createMasukSlice = (set, get) => ({
    masuk: [],

    // Transaksi Actions
    addMasuk: async (item) => {
        const payload = {
            kode_barang: item.kode_barang,
            jenis_transaksi: 'Masuk',
            jumlah: parseInt(item.jumlah),
            tanggal: item.tanggal,
            penerima: item.penerima
        };
        const { data, error } = await supabase.from('log_transaksi').insert([payload]).select();
        if (error) { alert('Gagal catat masuk: ' + error.message); return; }

        if (data) {
            // Update stok manual
            await adjustStokManual(item.kode_barang, payload.jumlah);
            
            get().fetchData();
        }
    },

    updateLogTransaksi: async (id, oldItem, newItem) => {
        // Revert stok lama manual
        const revertDelta = oldItem.jenis_transaksi === 'Masuk' ? -oldItem.jumlah : oldItem.jumlah;
        await adjustStokManual(oldItem.kode_barang, revertDelta);

        // Apply stok baru manual
        const newQty = parseInt(newItem.jumlah);
        const applyDelta = oldItem.jenis_transaksi === 'Masuk' ? newQty : -newQty;
        await adjustStokManual(newItem.kode_barang, applyDelta);

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
        // Revert efek stok manual
        const revertDelta = item.jenis_transaksi === 'Masuk' ? -item.jumlah : item.jumlah;
        await adjustStokManual(item.kode_barang, revertDelta);

        // Delete log
        const { error } = await supabase.from('log_transaksi').delete().eq('id', id);
        if (error) alert('Gagal hapus log: ' + error.message);

        get().fetchData();
    },
});

export default createMasukSlice;