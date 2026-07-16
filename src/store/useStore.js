import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '../lib/supabase';

import createAuthSlice from './auth';
import createBarangSlice from './barang';
import createMasukSlice from './masuk';
import createKeluarSlice from './keluar';
import createMintaSlice from './minta';

const useStore = create(
  persist(
    (set, get) => ({
      ...createAuthSlice(set, get),
      ...createBarangSlice(set, get),
      ...createMasukSlice(set, get),
      ...createKeluarSlice(set, get),
      ...createMintaSlice(set, get),

      // Fetch all data
      fetchData: async () => {
        const [bRes, lRes, pRes] = await Promise.all([
          supabase.from('barang').select('*').order('created_at', { ascending: false }),
          supabase.from('log_transaksi').select('*').order('created_at', { ascending: false }),
          supabase.from('permintaan').select('*').order('created_at', { ascending: false })
        ]);

        set({
          barang: bRes.data || [],
          masuk: (lRes.data || []).filter(l => l.jenis_transaksi === 'Masuk'),
          keluar: (lRes.data || []).filter(l => l.jenis_transaksi === 'Keluar'),
          minta: pRes.data || []
        });
      },
    }),
    {
      name: 'simalog-auth-storage', // Key di localStorage
      partialize: (state) => ({ currentUser: state.currentUser }), // Hanya simpan sesi user
    }
  )
);

export default useStore;