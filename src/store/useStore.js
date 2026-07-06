import { create } from 'zustand';
import { initialBarang, initialMasuk, initialKeluar, initialMinta, users } from '../data/dummyData';

const useStore = create((set, get) => ({
  // Auth State
  currentUser: null, // Set to users[0] for testing admin, or users[1] for user
  login: (username) => {
    const user = users.find(u => u.username === username);
    if (user) {
      set({ currentUser: user });
      return true;
    }
    return false;
  },
  logout: () => set({ currentUser: null }),

  // Data State
  barang: initialBarang,
  masuk: initialMasuk,
  keluar: initialKeluar,
  minta: initialMinta,

  // Barang Actions
  addBarang: (item) => set((state) => ({ barang: [...state.barang, item] })),
  updateBarang: (kode, updatedItem) => set((state) => ({
    barang: state.barang.map(b => b.kode_barang === kode ? { ...b, ...updatedItem } : b)
  })),
  deleteBarang: (kode) => set((state) => ({
    barang: state.barang.filter(b => b.kode_barang !== kode)
  })),

  // Masuk Actions
  addMasuk: (item) => {
    set((state) => {
      // Adjust stock
      const updatedBarang = state.barang.map(b => 
        b.kode_barang === item.kode_barang 
          ? { ...b, stok_saat_ini: b.stok_saat_ini + parseInt(item.jumlah) } 
          : b
      );
      return { 
        masuk: [...state.masuk, { ...item, id: Date.now() }],
        barang: updatedBarang
      };
    });
  },

  // Keluar Actions
  addKeluar: (item) => {
    set((state) => {
      // Adjust stock
      const updatedBarang = state.barang.map(b => 
        b.kode_barang === item.kode_barang 
          ? { ...b, stok_saat_ini: b.stok_saat_ini - parseInt(item.jumlah) } 
          : b
      );
      return { 
        keluar: [...state.keluar, { ...item, id: Date.now() }],
        barang: updatedBarang
      };
    });
  },

  // Minta Actions
  addMinta: (item) => set((state) => ({
    minta: [...state.minta, { ...item, id: Date.now(), status_persetujuan: 'Diajukan' }]
  })),
  updateMintaStatus: (id, status) => set((state) => ({
    minta: state.minta.map(m => m.id === id ? { ...m, status_persetujuan: status } : m)
  })),
}));

export default useStore;
