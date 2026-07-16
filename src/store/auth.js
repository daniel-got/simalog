import { supabase } from '../lib/supabase';

const createAuthSlice = (set, get) => ({
    currentUser: null,

    // Login Admin menggunakan Supabase Auth (Email & Password)
    loginWithEmail: async (email, password) => {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
            console.error("Login Error:", error);
            return { success: false, error: error.message };
        }

        if (data?.user) {
            // Karena ini Hybrid, yang berhasil login email PASTI adalah Admin.
            set({ currentUser: { id: data.user.id, nama: 'Administrator', role: 'Admin' } });
            get().fetchData();
            return { success: true };
        }
        return { success: false, error: 'Unknown error' };
    },

    // Login Guest lokal (tanpa password, role User)
    loginAsGuest: () => {
        set({ currentUser: { id: '00000000-0000-0000-0000-000000000000', nama: 'Guest (Pegawai)', role: 'User' } });
        get().fetchData();
    },

    // PENTING: 
    // - Untuk Admin: signOut() memicu event SIGNED_OUT, yang ditangkap oleh
    //   onAuthStateChange di App.jsx untuk reset state. Ini mencegah circular call.
    // - Untuk Guest: signOut() TIDAK memicu event apa pun (karena Guest memang
    //   tidak pernah login lewat Supabase Auth), jadi state harus direset manual di sini.
    logout: async () => {
        const isGuest = get().currentUser?.role === 'User';

        await supabase.auth.signOut();

        if (isGuest) {
            set({ currentUser: null, barang: [], masuk: [], keluar: [], minta: [] });
        }
        // Untuk Admin, reset state terjadi otomatis lewat onAuthStateChange di App.jsx
    },
});

export default createAuthSlice;