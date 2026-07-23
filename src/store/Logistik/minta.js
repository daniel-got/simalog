import { supabase } from '../../lib/supabase';
import { isValidUUID } from '../../utils/uuid';

const createMintaSlice = (set, get) => ({
    // Data State
    minta: [],

    // Permintaan Actions
    addMinta: async (formData) => {
        const currentUser = get().currentUser;

        // Build payload yang VALID & BERSIH tanpa kolom bermasalah
        const payload = {
            nama_pemohon: formData.nama_pemohon || currentUser?.name || currentUser?.nama || 'Guest',
            kode_barang: formData.kode_barang,
            jumlah: parseInt(formData.jumlah, 10),
            tanggal_minta: formData.tanggal_minta || new Date().toISOString().split('T')[0],
            status_persetujuan: formData.status_persetujuan || 'Diajukan' // Gunakan status awal sesuai Supabase/Enum
        };

        // PENTING UNTUK ID_USER (Mencegah foreign key constraint error):
        // Hanya masukkan id_user JIKA ada ID UUID yang benar-benar valid dari Supabase Auth
        if (currentUser?.id && isValidUUID(currentUser.id)) {
            payload.id_user = currentUser.id;
        }

        const { error } = await supabase.from('permintaan').insert([payload]);
        if (error) {
            alert('Gagal minta barang: ' + error.message);
            return false;
        } else {
            get().fetchData();
            return true;
        }
    },
    updateMinta: async (id, updatedItem) => {
        const payload = {
            nama_pemohon: updatedItem.nama_pemohon,
            kode_barang: updatedItem.kode_barang,
            jumlah: parseInt(updatedItem.jumlah, 10),
            tanggal_minta: updatedItem.tanggal_minta,
        };
        const { error } = await supabase.from('permintaan')
            .update(payload)
            .eq('id', id);
        if (error) alert('Gagal update permintaan: ' + error.message);
        else get().fetchData();
    },
    updateMintaStatus: async (id, status) => {
        const currentUser = get().currentUser;
        const item = get().minta.find(m => m.id === id);

        const { error } = await supabase.from('permintaan')
            .update({
                status_persetujuan: status,
                processed_by: currentUser?.nama || currentUser?.name || 'Admin',
                processed_at: new Date().toISOString(),
            })
            .eq('id', id);

        if (error) {
            alert('Gagal update status: ' + error.message);
            return;
        }

        // Jika disetujui & sebelumnya belum disetujui, catat log transaksi keluar & potong stok
        if (status === 'Disetujui' && item && item.status_persetujuan !== 'Disetujui') {
            const keluarPayload = {
                kode_barang: item.kode_barang,
                jenis_transaksi: 'Keluar',
                jumlah: parseInt(item.jumlah, 10),
                tanggal: new Date().toISOString().split('T')[0],
                penerima: `Permintaan: ${item.nama_pemohon}`,
                created_by: currentUser?.nama || currentUser?.name || 'Admin',
            };
            const { error: txError } = await supabase.from('log_transaksi').insert([keluarPayload]);
            if (!txError) {
                await supabase.rpc('adjust_stok', {
                    p_kode_barang: item.kode_barang,
                    p_delta: -parseInt(item.jumlah, 10)
                });
            }
        }

        get().fetchData();
    },
    deleteMinta: async (id) => {
        const item = get().minta.find(m => m.id === id);
        if (!item) return;

        // Jika statusnya Disetujui, hapus juga log transaksi keluar yang cocok & kembalikan stok
        if (item.status_persetujuan === 'Disetujui') {
            const matchingTx = get().keluar.find(k =>
                k.kode_barang === item.kode_barang &&
                k.jumlah === item.jumlah &&
                k.penerima === `Permintaan: ${item.nama_pemohon}`
            );

            if (matchingTx) {
                // Revert efek stok (tambah kembali)
                const { error: revertError } = await supabase.rpc('adjust_stok', {
                    p_kode_barang: item.kode_barang,
                    p_delta: item.jumlah
                });
                if (revertError) console.error('Gagal mengembalikan stok:', revertError);

                // Hapus log transaksi terkait
                const { error: txError } = await supabase.from('log_transaksi')
                    .delete()
                    .eq('id', matchingTx.id);
                if (txError) console.error('Gagal menghapus log transaksi terkait:', txError);
            }
        }

        const { error } = await supabase.from('permintaan')
            .delete()
            .eq('id', id);
        if (error) alert('Gagal hapus permintaan: ' + error.message);
        else get().fetchData();
    },
});

export default createMintaSlice;