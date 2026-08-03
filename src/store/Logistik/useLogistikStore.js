import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '../../lib/supabase';

import createAuthSlice from '../auth';
import createBarangSlice from './barang';
import createMasukSlice from './masuk';
import createKeluarSlice from './keluar';
import createMintaSlice from './minta';

const useLogistikStore = create(
  persist(
    (set, get) => ({
      loading: false,

      ...createAuthSlice(set, get),
      ...createBarangSlice(set, get),
      ...createMasukSlice(set, get),
      ...createKeluarSlice(set, get),
      ...createMintaSlice(set, get),

      // Fetch seluruh data dari Supabase
      fetchData: async () => {
        set({ loading: true });
        try {
          const [bRes, lRes, pRes] = await Promise.all([
            supabase.from('barang').select('*').order('created_at', { ascending: false }),
            supabase.from('log_transaksi').select('*').order('created_at', { ascending: false }),
            supabase.from('permintaan').select('*').order('created_at', { ascending: false })
          ]);

          if (bRes.error) console.error('Error fetching barang:', bRes.error.message);
          if (lRes.error) console.error('Error fetching log_transaksi:', lRes.error.message);
          if (pRes.error) console.error('Error fetching permintaan:', pRes.error.message);

          set({
            barang: bRes.data || [],
            masuk: (lRes.data || []).filter((l) => l.jenis_transaksi === 'Masuk'),
            keluar: (lRes.data || []).filter((l) => l.jenis_transaksi === 'Keluar'),
            minta: pRes.data || [],
            loading: false
          });
        } catch (err) {
          console.error('Unexpected error fetching data:', err);
          set({ loading: false });
        }
      }
    }),
    {
      name: 'simalog-auth-storage',
      partialize: (state) => ({ currentUser: state.currentUser })
    }
  )
);

export default useLogistikStore;