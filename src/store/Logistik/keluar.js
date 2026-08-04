import { supabase } from '../../lib/supabase';

const createKeluarSlice = (set, get) => ({
    keluar: [],

    addKeluar: async (item) => {
        const payload = {
            kode_barang: item.kode_barang,
            jenis_transaksi: 'Keluar',
            jumlah: parseInt(item.jumlah),
            tanggal: item.tanggal,
            penerima: item.penerima
        };
        const { data, error } = await supabase.from('log_transaksi').insert([payload]).select();
        if (error) { alert('Gagal catat keluar: ' + error.message); return; }

        if (data) {
            // Kita update stok manual karena tidak ada RPC/Trigger DB
            const { data: bData } = await supabase.from('barang').select('stok_saat_ini').eq('kode_barang', item.kode_barang).single();
            if (bData) {
                await supabase.from('barang').update({ stok_saat_ini: bData.stok_saat_ini - parseInt(payload.jumlah) }).eq('kode_barang', item.kode_barang);
            }
            get().fetchData();
        }
    },
});

export default createKeluarSlice;