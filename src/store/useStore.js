import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '../lib/supabase';

const useStore = create(
  persist(
    (set, get) => ({
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
    set({ currentUser: { id: 'guest-123', nama: 'Guest (Pegawai)', role: 'User' } });
    get().fetchData();
  },
  
  logout: async () => {
    await supabase.auth.signOut();
    set({ currentUser: null, barang: [], masuk: [], keluar: [], minta: [] });
  },

  // Data State
  barang: [],
  masuk: [],
  keluar: [],
  minta: [],

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

  // Barang Actions
  addBarang: async (item) => {
    const { data, error } = await supabase.from('barang').insert([item]).select();
    if (error) {
      console.error(error);
      alert('Gagal menambah barang: ' + error.message);
    } else if (data) {
      set((state) => ({ barang: [data[0], ...state.barang] }));
    }
  },
  updateBarang: async (kode, updatedItem) => {
    const { data, error } = await supabase.from('barang').update(updatedItem).eq('kode_barang', kode).select();
    if (error) console.error(error);
    else if (data) {
      set((state) => ({
        barang: state.barang.map(b => b.kode_barang === kode ? data[0] : b)
      }));
    }
  },
  deleteBarang: async (kode) => {
    const { error } = await supabase.from('barang').delete().eq('kode_barang', kode);
    if (error) {
      alert('Gagal menghapus barang');
    } else {
      set((state) => ({ barang: state.barang.filter(b => b.kode_barang !== kode) }));
    }
  },

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
      const brg = get().barang.find(b => b.kode_barang === item.kode_barang);
      if (brg) {
        await supabase.from('barang')
          .update({ stok_saat_ini: brg.stok_saat_ini + payload.jumlah })
          .eq('kode_barang', brg.kode_barang);
      }
      get().fetchData();
    }
  },

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
      const brg = get().barang.find(b => b.kode_barang === item.kode_barang);
      if (brg) {
        await supabase.from('barang')
          .update({ stok_saat_ini: brg.stok_saat_ini - payload.jumlah })
          .eq('kode_barang', brg.kode_barang);
      }
      get().fetchData();
    }
  },

  // Permintaan Actions
  addMinta: async (item) => {
    const { error } = await supabase.from('permintaan').insert([item]);
    if (error) alert('Gagal minta barang: ' + error.message);
    else get().fetchData();
  },
  updateMintaStatus: async (id, status) => {
    const { error } = await supabase.from('permintaan')
      .update({ status_persetujuan: status })
      .eq('id', id);
    if (error) alert('Gagal update status: ' + error.message);
    else get().fetchData();
  },
  updateMinta: async (id, updatedItem) => {
    const { error } = await supabase.from('permintaan')
      .update(updatedItem)
      .eq('id', id);
    if (error) alert('Gagal update permintaan: ' + error.message);
    else get().fetchData();
  },
  deleteMinta: async (id) => {
    const { error } = await supabase.from('permintaan')
      .delete()
      .eq('id', id);
    if (error) alert('Gagal hapus permintaan: ' + error.message);
    else get().fetchData();
  },
    }),
    {
      name: 'simalog-auth-storage', // Key di localStorage
      partialize: (state) => ({ currentUser: state.currentUser }), // Hanya simpan sesi user
    }
  )
);

export default useStore;
