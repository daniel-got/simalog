import { supabase } from '../../lib/supabase';

const createAsetSlice = (set, get) => ({
    daftarAset: [],
    aset: [],             // alias — selalu disinkronkan dengan daftarAset
    kelompokAset: [],
    subKelompokAset: [],

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

    addAset: async (payload) => {
        const userId = get().getCurrentUserId();

        // Sanitasi tanggal string kosong ("") menjadi null
        const sanitizedPayload = { ...payload };
        if (!sanitizedPayload.tanggal_perolehan) sanitizedPayload.tanggal_perolehan = null;
        if (!sanitizedPayload.tanggal_servis_terakhir) sanitizedPayload.tanggal_servis_terakhir = null;

        // Jika kode_aset belum ada di payload, generate dari RPC
        let kodeAset = sanitizedPayload.kode_aset;
        if (!kodeAset && sanitizedPayload.kelompok_id) {
            const { data: kodeData } = await supabase.rpc('generate_kode_aset', {
                p_kelompok_id: Number(sanitizedPayload.kelompok_id),
            });
            kodeAset = kodeData || null;
        }

        const insertData = {
            ...sanitizedPayload,
            kode_aset: kodeAset || null,
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
        if (!updateData.tanggal_perolehan) updateData.tanggal_perolehan = null;
        if (!updateData.tanggal_servis_terakhir) updateData.tanggal_servis_terakhir = null;
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
});

export default createAsetSlice;