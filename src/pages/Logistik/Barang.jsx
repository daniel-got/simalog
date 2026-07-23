import { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { Plus, Download, Pencil, Trash2, Package, Image as ImageIcon, LayoutGrid, List, Search, QrCode, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';

// PERUBAHAN 1: Arahkan ke useLogistikStore baru dengan path mundur 2 tingkat
import useLogistikStore from '../../store/Logistik/useLogistikStore';
import { supabase } from '../../lib/supabase';

// PERUBAHAN 2: Sesuaikan seluruh import UI & Utils (mundur 2 tingkat memakai ../../)
import { Card } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { Table } from '../../components/ui/Table';
import { Input, Select } from '../../components/ui/Input';
import ItemCard from '../../components/ui/ItemCard';
import BarcodeScanner from '../../components/ui/BarcodeScanner';
import Pagination from '../../components/ui/Pagination';
import { KELOMPOK_BARANG } from '../../utils/constants';

const EMPTY = {
  kode_barang: '',
  nama_barang: '',
  kelompok_barang: '',
  subkelompok_barang: '',
  satuan_barang: '',
  satuan_harga: '',
  stok_saat_ini: 0,
  image_url: ''
};

export default function Barang() {
  // PERUBAHAN 3: Ubah fungsi pemanggil dari useStore menjadi useLogistikStore
  const { barang, addBarang, updateBarang, deleteBarang } = useLogistikStore();

  const [open, setOpen] = useState(false);
  const [editKode, setEditKode] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [viewMode, setViewMode] = useState('card');
  const [showScanner, setShowScanner] = useState(false);

  const [filterText, setFilterText] = useState('');
  const [filterKelompok, setFilterKelompok] = useState('');
  const [sortOrder, setSortOrder] = useState('nama_asc');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  // ── TAMBAHAN STATE UNTUK CUSTOM MODAL HAPUS ──
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  // Reset ke halaman 1 saat filter berubah
  useEffect(() => { setCurrentPage(1); }, [filterText, filterKelompok, sortOrder]);

  const closeForm = () => { setOpen(false); setEditKode(null); setForm(EMPTY); setFile(null); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    let imageUrl = form.image_url;

    if (file) {
      setUploading(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${form.kode_barang}-${Date.now()}.${fileExt}`;
      const filePath = `barang/${fileName}`;

      const { error: uploadError } = await supabase.storage.from('images').upload(filePath, file);

      if (uploadError) {
        alert('Gagal mengunggah gambar: ' + uploadError.message);
        setUploading(false);
        return;
      }

      const { data } = supabase.storage.from('images').getPublicUrl(filePath);
      imageUrl = data.publicUrl;
    }

    const payload = {
      ...form,
      satuan_harga: Number(form.satuan_harga),
      image_url: imageUrl
    };

    if (editKode) {
      await updateBarang(editKode, payload);
    } else {
      await addBarang(payload);
    }

    setUploading(false);
    closeForm();
  };

  const handleEdit = (b) => { setForm(b); setEditKode(b.kode_barang); setOpen(true); };

  // ── PERUBAHAN FUNGSI HAPUS: Buka custom modal, bukan confirm browser ──
  const handleDelete = (b) => {
    setItemToDelete(b);
    setIsDeleteModalOpen(true);
  };

  // Fungsi eksekusi hapus setelah user klik "Ya, Hapus" di modal
  const handleConfirmDelete = async () => {
    if (itemToDelete) {
      await deleteBarang(itemToDelete.kode_barang);
      setIsDeleteModalOpen(false);
      setItemToDelete(null);
    }
  };

  const handleScanResult = (scannedCode) => {
    setShowScanner(false); // Tutup scanner
    if (!scannedCode) return;

    // Cek apakah barang sudah ada di database
    const existing = barang.find(b => b.kode_barang === scannedCode);
    if (existing) {
      alert(`Barang dengan kode ${scannedCode} sudah ada. Membuka form edit.`);
      handleEdit(existing);
    } else {
      // Buka form tambah dengan data pre-filled
      setForm({
        ...EMPTY,
        kode_barang: scannedCode,
        nama_barang: 'Item Hasil Scan',
        satuan_harga: 0,
      });
      setEditKode(null);
      setOpen(true);
    }
  };

  const handleExport = () => {
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(barang), 'Barang');
    XLSX.writeFile(wb, 'Data_Barang.xlsx');
  };

  const formatRupiah = (number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(number);
  };

  const kelompokOptions = Object.keys(KELOMPOK_BARANG).map(k => ({ label: k, value: k }));
  const subkelompokOptions = (form.kelompok_barang && KELOMPOK_BARANG[form.kelompok_barang])
    ? KELOMPOK_BARANG[form.kelompok_barang].map(s => ({ label: s, value: s }))
    : [];

  const filteredBarang = barang
    .filter(b => {
      const textTarget = ((b.nama_barang || '') + (b.kode_barang || '')).toLowerCase();
      const matchText = textTarget.includes(filterText.toLowerCase());
      const matchKelompok = filterKelompok ? b.kelompok_barang === filterKelompok : true;
      return matchText && matchKelompok;
    })
    .sort((a, b) => {
      if (sortOrder === 'nama_asc') return (a.nama_barang || '').localeCompare(b.nama_barang || '');
      if (sortOrder === 'nama_desc') return (b.nama_barang || '').localeCompare(a.nama_barang || '');
      if (sortOrder === 'kode_asc') return (a.kode_barang || '').localeCompare(b.kode_barang || '');
      if (sortOrder === 'harga_asc') return (a.satuan_harga || 0) - (b.satuan_harga || 0);
      if (sortOrder === 'harga_desc') return (b.satuan_harga || 0) - (a.satuan_harga || 0);
      return 0;
    });

  const pagedBarang = filteredBarang.slice((currentPage - 1) * perPage, currentPage * perPage);

  return (
    <div className="space-y-21">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-slate-800 tracking-tight">Master Barang</h1>
          <p className="text-xs text-slate-400 mt-2">{barang.length} item terdaftar</p>
        </div>
        <div className="flex gap-8">
          <div className="flex bg-slate-100 rounded-xl p-3">
            <button
              onClick={() => setViewMode('card')}
              className={`p-5 rounded-lg transition-colors ${viewMode === 'card' ? 'bg-white shadow-sm text-teal-600' : 'text-slate-400 hover:text-slate-600'}`}
              title="Card View"
            >
              <LayoutGrid size={15} />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-5 rounded-lg transition-colors ${viewMode === 'table' ? 'bg-white shadow-sm text-teal-600' : 'text-slate-400 hover:text-slate-600'}`}
              title="Table View"
            >
              <List size={15} />
            </button>
          </div>
          <Button variant="ghost" size="icon" onClick={handleExport} title="Export Excel">
            <Download size={16} />
          </Button>
          <Button size="sm" onClick={() => setOpen(true)}>
            <Plus size={15} /> Tambah
          </Button>
        </div>
      </div>

      {/* Form */}
      {open && (
        <Card className="border-teal-200 bg-teal-50/40 p-21">
          <p className="text-base font-bold text-slate-700 mb-13">
            {editKode ? '✏️  Edit Barang' : '📦  Tambah Barang Baru'}
          </p>
          <form onSubmit={handleSubmit} className="space-y-13">

            <div className="grid grid-cols-2 gap-13">
              <Input
                label="Kode Barang" required disabled={!!editKode}
                value={form.kode_barang}
                onChange={e => setForm({ ...form, kode_barang: e.target.value })}
              />
              <Input
                label="Nama Barang" required
                value={form.nama_barang}
                onChange={e => setForm({ ...form, nama_barang: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-13">
              <Select
                label="Kelompok Barang" required
                options={kelompokOptions}
                value={form.kelompok_barang}
                onChange={e => setForm({ ...form, kelompok_barang: e.target.value, subkelompok_barang: '' })}
              />
              <Select
                label="Subkelompok Barang" required disabled={!form.kelompok_barang}
                options={subkelompokOptions}
                value={form.subkelompok_barang}
                onChange={e => setForm({ ...form, subkelompok_barang: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-3 gap-13">
              <Input
                label="Satuan Barang (Cth: Pcs, Rim)" required
                value={form.satuan_barang}
                onChange={e => setForm({ ...form, satuan_barang: e.target.value })}
              />
              <Input
                label="Harga Satuan (Rp)" type="number" required
                value={form.satuan_harga}
                onChange={e => setForm({ ...form, satuan_harga: e.target.value })}
              />
              <Input
                label="Stok Awal" type="number" required disabled={!!editKode}
                value={form.stok_saat_ini}
                onChange={e => setForm({ ...form, stok_saat_ini: Number(e.target.value) })}
              />
            </div>

            {/* Upload File */}
            <div className="flex flex-col gap-5 w-full">
              <label className="text-xs font-semibold text-slate-500 tracking-wide uppercase">Foto Barang</label>
              <input
                type="file"
                accept="image/*"
                onChange={e => {
                  const selectedFile = e.target.files?.[0];
                  if (!selectedFile) return;

                  const MAX_SIZE_MB = 2;
                  const maxSizeBytes = MAX_SIZE_MB * 1024 * 1024;

                  if (selectedFile.size > maxSizeBytes) {
                    alert(`Ukuran foto terlalu besar (${(selectedFile.size / 1024 / 1024).toFixed(1)}MB). Maksimal ${MAX_SIZE_MB}MB.`);
                    e.target.value = '';
                    return;
                  }

                  setFile(selectedFile);
                }}
                className="w-full text-sm text-slate-500 file:mr-13 file:py-5 file:px-13 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-teal-100 file:text-teal-700 hover:file:bg-teal-200 cursor-pointer"
              />
              {form.image_url && !file && (
                <p className="text-[10px] text-teal-600 mt-2">Gambar sudah tersimpan. Unggah baru untuk mengganti.</p>
              )}
            </div>

            <div className="flex justify-end gap-8 pt-5">
              <Button type="button" variant="ghost" size="sm" onClick={closeForm} disabled={uploading}>Batal</Button>
              <Button type="submit" size="sm" disabled={uploading}>
                {uploading ? 'Menyimpan...' : 'Simpan'}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Search & Filter Card */}
      <div className="bg-slate-50 p-13 rounded-2xl border border-slate-100 shadow-sm space-y-8">
        <div className="flex gap-8">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-13 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari kode atau nama barang..."
              value={filterText}
              onChange={e => setFilterText(e.target.value)}
              className="w-full pl-34 pr-13 py-8 text-xs bg-white border border-slate-200 rounded-xl focus:border-teal-500 focus:ring-2 focus:ring-teal-100 outline-none transition-all"
            />
          </div>
          <button
            onClick={() => setShowScanner(true)}
            className="w-34 h-34 flex items-center justify-center bg-teal-600 hover:bg-teal-700 text-white rounded-xl shadow-sm transition-colors shrink-0"
            title="Scan Barcode Kamera"
          >
            <QrCode size={16} />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-8">
          <select
            className="w-full px-8 py-8 text-[10px] bg-white border border-slate-200 rounded-xl focus:border-teal-500 focus:ring-2 focus:ring-teal-100 outline-none transition-all text-slate-600 font-medium"
            value={filterKelompok}
            onChange={e => setFilterKelompok(e.target.value)}
          >
            <option value="">Semua Kelompok</option>
            {Object.keys(KELOMPOK_BARANG).map(k => (
              <option key={k} value={k}>{k}</option>
            ))}
          </select>

          <select
            className="w-full px-8 py-8 text-[10px] bg-white border border-slate-200 rounded-xl focus:border-teal-500 focus:ring-2 focus:ring-teal-100 outline-none transition-all text-slate-600 font-medium"
            value={sortOrder}
            onChange={e => setSortOrder(e.target.value)}
          >
            <option value="nama_asc">Nama (A-Z)</option>
            <option value="nama_desc">Nama (Z-A)</option>
            <option value="kode_asc">Kode (A-Z)</option>
            <option value="harga_desc">Harga Termahal</option>
            <option value="harga_asc">Harga Termurah</option>
          </select>
        </div>
      </div>

      {/* Data Views */}
      {filteredBarang.length === 0 ? (
        <div className="text-center py-34 text-slate-400 text-sm bg-slate-50 rounded-2xl border border-slate-100 border-dashed">
          <Package size={28} className="mx-auto mb-5 text-slate-300" />
          Belum ada data barang
        </div>
      ) : viewMode === 'card' ? (
        <div className="space-y-21">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-13 lg:gap-21">
            {pagedBarang.map(b => (
              <ItemCard
                key={b.kode_barang}
                itemName={b.nama_barang}
                itemCode={b.kode_barang}
                category={b.kelompok_barang}
                subCategory={b.subkelompok_barang}
                price={b.satuan_harga ? formatRupiah(b.satuan_harga) : null}
                unit={b.satuan_barang}
                imageUrl={b.image_url}
                stock={b.stok_saat_ini}
                onEdit={() => handleEdit(b)}
                onDelete={() => handleDelete(b)}
              />
            ))}
          </div>
          <Pagination
            total={filteredBarang.length}
            perPage={perPage}
            currentPage={currentPage}
            onPageChange={setCurrentPage}
            onPerPageChange={setPerPage}
          />
        </div>
      ) : (
        <div className="space-y-21">
          <Table headers={['Foto', 'Kode', 'Info Barang', 'Kategori', 'Stok', '']}>
            {pagedBarang.map(b => (
              <tr key={b.kode_barang} className="hover:bg-slate-50 transition-colors">
                <td className="px-13 py-13">
                  {b.image_url ? (
                    <img src={b.image_url} alt={b.nama_barang} className="w-34 h-34 object-cover rounded-[13px] border border-slate-200 shadow-sm" />
                  ) : (
                    <div className="w-34 h-34 bg-slate-100 rounded-[13px] flex items-center justify-center text-slate-400 border border-slate-200">
                      <ImageIcon size={16} />
                    </div>
                  )}
                </td>
                <td className="px-13 py-13 font-mono text-xs text-teal-700 font-bold bg-teal-50/40">
                  {b.kode_barang}
                </td>
                <td className="px-13 py-13">
                  <p className="text-sm font-semibold text-slate-700">{b.nama_barang}</p>
                  {b.satuan_harga && (
                    <p className="text-[10px] font-mono text-slate-400 mt-2">
                      {formatRupiah(b.satuan_harga)} / {b.satuan_barang}
                    </p>
                  )}
                </td>
                <td className="px-13 py-13">
                  <div className="flex flex-col gap-2 items-start">
                    <span className="bg-slate-100 text-slate-600 text-[9px] font-bold px-5 py-2 rounded-md uppercase tracking-wider">
                      {b.kelompok_barang}
                    </span>
                    <span className="text-[10px] text-slate-500 font-medium">
                      {b.subkelompok_barang}
                    </span>
                  </div>
                </td>
                <td className="px-13 py-13">
                  <span className={`text-sm font-black ${b.stok_saat_ini <= 5 ? 'text-red-500' : 'text-slate-800'}`}>
                    {b.stok_saat_ini}
                  </span>
                </td>
                <td className="px-13 py-13">
                  <div className="flex gap-5">
                    <Link to={`/barang/${b.kode_barang}`}
                      className="w-21 h-21 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center
                      hover:bg-teal-100 transition-colors" title="Detail">
                      <Eye size={12} />
                    </Link>
                    <button onClick={() => handleEdit(b)}
                      className="w-21 h-21 rounded-lg bg-blue-50 text-blue-500 flex items-center justify-center
                      hover:bg-blue-100 transition-colors" title="Edit">
                      <Pencil size={12} />
                    </button>
                    <button onClick={() => handleDelete(b)}
                      className="w-21 h-21 rounded-lg bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-100 transition-colors">
                      <Trash2 size={12} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </Table>
          <Pagination
            total={filteredBarang.length}
            perPage={perPage}
            currentPage={currentPage}
            onPageChange={setCurrentPage}
            onPerPageChange={setPerPage}
          />
        </div>
      )}

      {/* Komponen Kamera Scanner */}
      {showScanner && (
        <BarcodeScanner
          onResult={handleScanResult}
          onClose={() => setShowScanner(false)}
        />
      )}

      {/* ── CUSTOM MODAL KONFIRMASI HAPUS (GANTI BROWSER CONFIRM) ── */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          {/* Backdrop Gelap Belakang */}
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
            onClick={() => setIsDeleteModalOpen(false)}
          />

          {/* Kotak Modal Utama */}
          <div className="relative bg-white rounded-2xl shadow-xl border border-slate-100 w-full max-w-md p-6 flex flex-col gap-4 z-10 animate-in fade-in zoom-in-95 duration-150">
            <div>
              <h3 className="text-base font-bold text-slate-800 mb-2">Hapus Barang Logistik</h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                Yakin ingin menghapus barang <span className="font-semibold text-slate-700">"{itemToDelete?.nama_barang}" ({itemToDelete?.kode_barang})</span>? Semua riwayat transaksi terkait barang ini akan ikut terhapus secara permanen.
              </p>
            </div>

            {/* Tombol Batal / Ya, Hapus */}
            <div className="flex items-center justify-end gap-3 mt-4">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 active:scale-95 transition-all select-none"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-sm font-semibold text-white shadow-sm active:scale-95 transition-all select-none"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}