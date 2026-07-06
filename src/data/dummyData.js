export const users = [
  { id: 1, nama: 'Budi Admin', username: 'admin', role: 'Admin' },
  { id: 2, nama: 'Agus Pegawai', username: 'user1', role: 'User' },
];

export const initialBarang = [
  { kode_barang: 'BRG001', nama_barang: 'Kertas HVS A4', kategori: 'ATK', stok_saat_ini: 50 },
  { kode_barang: 'BRG002', nama_barang: 'Tinta Printer Hitam', kategori: 'ATK', stok_saat_ini: 4 },
  { kode_barang: 'BRG003', nama_barang: 'Pulpen', kategori: 'ATK', stok_saat_ini: 120 },
  { kode_barang: 'BRG004', nama_barang: 'Laptop HP', kategori: 'Elektronik', stok_saat_ini: 2 },
  { kode_barang: 'BRG005', nama_barang: 'Meja Kerja', kategori: 'Furnitur', stok_saat_ini: 10 },
  { kode_barang: 'BRG006', nama_barang: 'Kursi Kantor', kategori: 'Furnitur', stok_saat_ini: 15 },
];

export const initialMasuk = [
  { id: 1, kode_barang: 'BRG001', jumlah: 100, tanggal: '2023-10-01', penerima: 'Budi Admin' },
  { id: 2, kode_barang: 'BRG003', jumlah: 200, tanggal: '2023-10-02', penerima: 'Budi Admin' },
];

export const initialKeluar = [
  { id: 1, kode_barang: 'BRG001', jumlah: 50, tanggal: '2023-10-05', penerima: 'Agus Pegawai' },
  { id: 2, kode_barang: 'BRG003', jumlah: 80, tanggal: '2023-10-06', penerima: 'Agus Pegawai' },
];

export const initialMinta = [
  { id: 1, id_user: 2, kode_barang: 'BRG001', jumlah: 5, tanggal_minta: '2023-10-10', status_persetujuan: 'Diajukan' },
  { id: 2, id_user: 2, kode_barang: 'BRG002', jumlah: 2, tanggal_minta: '2023-10-12', status_persetujuan: 'Disetujui' },
  { id: 3, id_user: 2, kode_barang: 'BRG004', jumlah: 1, tanggal_minta: '2023-10-08', status_persetujuan: 'Diterima' },
];
