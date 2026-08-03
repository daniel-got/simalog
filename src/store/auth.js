import { supabase } from '../lib/supabase'; // Path tetap aman karena posisi file di luar folder store utama

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

            // PERUBAHAN: Panggil fungsi fetch khusus Logistik yang baru
            if (get().fetchDataLogistik) get().fetchDataLogistik();

            return { success: true };
        }
        return { success: false, error: 'Unknown error' };
    },

    // Login Guest lokal (tanpa password, role User)
    loginAsGuest: () => {
        set({ currentUser: { id: '00000000-0000-0000-0000-000000000000', nama: 'Guest (Pegawai)', role: 'User' } });

        // PERUBAHAN: Panggil fungsi fetch khusus Logistik yang baru
        if (get().fetchDataLogistik) get().fetchDataLogistik();
    },

    // Proses Logout
    logout: async () => {
        await supabase.auth.signOut().catch(err => console.error("SignOut error:", err));

        set({ currentUser: null, barang: [], masuk: [], keluar: [], minta: [] });
    },
});

export default createAuthSlice;