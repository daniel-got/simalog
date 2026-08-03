import { create } from 'zustand';
import { supabase } from '../../lib/supabase';
import useLogistikStore from '../Logistik/useLogistikStore';

import createAsetSlice from './aset';
import createPerawatanSlice from './perawatan';
import createAktivitasSlice from './aktivitas';
import createPersetujuanSlice from './persetujuan';
import createPeminjamanSlice from './peminjaman';

const useHartaBendaStore = create((set, get) => ({
    // ═══════════════════════════════════════════
    // Menggabungkan semua slice modul
    // ═══════════════════════════════════════════
    ...createAsetSlice(set, get),
    ...createPerawatanSlice(set, get),
    ...createAktivitasSlice(set, get),
    ...createPersetujuanSlice(set, get),
    ...createPeminjamanSlice(set, get),

    // ═══════════════════════════════════════════
    // HELPER: Ambil data user aktif dari store Logistik
    // ═══════════════════════════════════════════
    getCurrentUserNama: () => {
        const logistikState = useLogistikStore.getState();
        return logistikState.currentUser?.nama || 'Unknown';
    },

    getCurrentUserId: () => {
        const logistikState = useLogistikStore.getState();
        return logistikState.currentUser?.id || null;
    },

    // ═══════════════════════════════════════════
    // FETCH ALL DATA (dipanggil saat init)
    // ═══════════════════════════════════════════
    fetchDataHartaBenda: async () => {
        const [
            asetRes,
            perawatanRes,
            aktivitasRes,
            kelompokRes,
            subKelompokRes,
        ] = await Promise.all([
            supabase
                .from('assets')
                .select(`
                    *,
                    kelompok:kelompok_aset(id, nama, prefix_kode),
                    sub_kelompok:sub_kelompok_aset(id, nama, maintenance_type)
                `)
                .order('created_at', { ascending: false }),
            supabase.from('log_perawatan_aset').select('*').order('tanggal', { ascending: false }),
            supabase.from('log_aktivitas_aset').select('*').order('tanggal', { ascending: false }),
            supabase.from('kelompok_aset').select('*').order('nama', { ascending: true }),
            supabase.from('sub_kelompok_aset').select('*').order('nama', { ascending: true }),
        ]);

        set({
            daftarAset: asetRes.data || [],
            aset: asetRes.data || [],
            logPerawatan: perawatanRes.data || [],
            logAktivitas: aktivitasRes.data || [],
            kelompokAset: kelompokRes.data || [],
            subKelompokAset: subKelompokRes.data || [],
        });

        if (asetRes.error) console.error('Fetch assets error:', asetRes.error);
        if (perawatanRes.error) console.error('Fetch log_perawatan_aset error:', perawatanRes.error);
        if (aktivitasRes.error) console.error('Fetch log_aktivitas_aset error:', aktivitasRes.error);
        if (kelompokRes.error) console.error('Fetch kelompok_aset error:', kelompokRes.error);
        if (subKelompokRes.error) console.error('Fetch sub_kelompok_aset error:', subKelompokRes.error);
    },
}));

export default useHartaBendaStore;