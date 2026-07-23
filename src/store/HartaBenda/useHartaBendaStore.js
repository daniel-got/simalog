import { create } from 'zustand';
import { supabase } from '../../lib/supabase';
import useLogistikStore from '../Logistik/useLogistikStore';

const useHartaBendaStore = create((set, get) => ({
    // ═══════════════════════════════════════════
    // DATA STATE
    // ═══════════════════════════════════════════
    daftarAset: [],
    aset: [],             // alias — selalu disinkronkan dengan daftarAset
    logPerawatan: [],
    logAktivitas: [],

    // Kategori dinamis dari Supabase
    kelompokAset: [],
    subKelompokAset: [],

    // ═══════════════════════════════════════════
    // HELPER: Ambil nama user aktif dari store Logistik
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

    // ═══════════════════════════════════════════
    // FETCH KATEGORI (terpisah, dipanggil saat modal kategori dibuka)
    // ═══════════════════════════════════════════
    fetchKelompokAset: async () => {
        const { data, error } = await supabase
            .from('kelompok_aset')
            .select('*')
            .order('nama', { ascending: true });
        if (error) { console.error('fetchKelompokAset error:', error); return; }
        set({ kelompokAset: data || [] });
    },

    fetchSubKelompokAset: async () => {
        const { data, error } = await supabase
            .from('sub_kelompok_aset')
            .select('*')
            .order('nama', { ascending: true });
        if (error) { console.error('fetchSubKelompokAset error:', error); return; }
        set({ subKelompokAset: data || [] });
    },

    // ═══════════════════════════════════════════
    // CRUD: KELOMPOK ASET
    // ═══════════════════════════════════════════
    addKelompok: async (item) => {
        const { data, error } = await supabase.from('kelompok_aset').insert([item]).select();
        if (error) { alert('Gagal menambah kelompok: ' + error.message); return false; }
        if (data) set((s) => ({ kelompokAset: [...s.kelompokAset, data[0]] }));
        return true;
    },

    deleteKelompok: async (id) => {
        const { error } = await supabase.from('kelompok_aset').delete().eq('id', id);
        if (error) { alert('Gagal menghapus kelompok: ' + error.message); return false; }
        set((s) => ({
            kelompokAset: s.kelompokAset.filter(k => k.id !== id),
            subKelompokAset: s.subKelompokAset.filter(sk => sk.kelompok_id !== id),
        }));
        return true;
    },

    // ═══════════════════════════════════════════
    // CRUD: SUB-KELOMPOK ASET
    // ═══════════════════════════════════════════
    addSubKelompok: async (item) => {
        const { data, error } = await supabase.from('sub_kelompok_aset').insert([item]).select();
        if (error) { alert('Gagal menambah sub-kelompok: ' + error.message); return false; }
        if (data) set((s) => ({ subKelompokAset: [...s.subKelompokAset, data[0]] }));
        return true;
    },

    deleteSubKelompok: async (id) => {
        const { error } = await supabase.from('sub_kelompok_aset').delete().eq('id', id);
        if (error) { alert('Gagal menghapus sub-kelompok: ' + error.message); return false; }
        set((s) => ({ subKelompokAset: s.subKelompokAset.filter(sk => sk.id !== id) }));
        return true;
    },

    // ═══════════════════════════════════════════
    // CRUD: ASSETS (tabel baru)
    // ═══════════════════════════════════════════
    addAset: async (payload) => {
        const userId = get().getCurrentUserId();

        // Jika kode_aset belum ada di payload, generate dari RPC
        let kodeAset = payload.kode_aset;
        if (!kodeAset && payload.kelompok_id) {
            const { data: kodeData } = await supabase.rpc('generate_kode_aset', {
                p_kelompok_id: Number(payload.kelompok_id),
            });
            kodeAset = kodeData || null;
        }

        const insertData = {
            ...payload,
            kode_aset: kodeAset || null,
            status: payload.status || 'aktif',   // default wajib ada
            created_by: userId,
            updated_by: userId,
        };

        const { data, error } = await supabase
            .from('assets')
            .insert([insertData])
            .select(`
                *,
                kelompok:kelompok_aset(id, nama, prefix_kode),
                sub_kelompok:sub_kelompok_aset(id, nama, maintenance_type)
            `);

        if (error) { alert('Gagal menambah aset: ' + error.message); return false; }
        if (data) set((s) => ({
            daftarAset: [data[0], ...s.daftarAset],
            aset: [data[0], ...s.daftarAset],
        }));
        return true;
    },

    updateAset: async (id, payload) => {
        const userId = get().getCurrentUserId();
        const updateData = { ...payload, updated_by: userId };
        // Hapus field yang tidak boleh diupdate
        delete updateData.id;
        delete updateData.created_at;
        delete updateData.created_by;
        delete updateData.kode_aset;

        const { data, error } = await supabase
            .from('assets')
            .update(updateData)
            .eq('id', id)
            .select(`
                *,
                kelompok:kelompok_aset(id, nama, prefix_kode),
                sub_kelompok:sub_kelompok_aset(id, nama, maintenance_type)
            `);

        if (error) { alert('Gagal mengupdate aset: ' + error.message); return false; }
        if (data) {
            set((s) => ({
                daftarAset: s.daftarAset.map(a => a.id === id ? data[0] : a),
                aset: s.daftarAset.map(a => a.id === id ? data[0] : a),
            }));
        }
        return true;
    },

    deleteAset: async (id) => {
        const { error } = await supabase.from('assets').delete().eq('id', id);
        if (error) { alert('Gagal menghapus aset: ' + error.message); return false; }
        set((s) => ({
            daftarAset: s.daftarAset.filter(a => a.id !== id),
            aset: s.daftarAset.filter(a => a.id !== id),
        }));
        return true;
    },

    // ═══════════════════════════════════════════
    // CRUD: LOG PERAWATAN ASET
    // ═══════════════════════════════════════════
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

    // ═══════════════════════════════════════════
    // CRUD: LOG AKTIVITAS ASET
    // ═══════════════════════════════════════════
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
}));

export default useHartaBendaStore;