import { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { Plus, Download, LayoutGrid, List, Search, QrCode } from 'lucide-react';
import useLogistikStore from '../../store/Logistik/useLogistikStore';
import { Card } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { Table } from '../../components/ui/Table';
import { Input, Select } from '../../components/ui/Input';
import ItemCard from '../../components/ui/ItemCard';
import Pagination from '../../components/ui/Pagination';
import BarcodeScanner from '../../components/ui/BarcodeScanner';
import { KELOMPOK_BARANG } from '../../utils/constants';
import { useToast } from '../../components/ui/Toast';

const EMPTY = {
  nama_barang: '',
  kode_barang: '',
  kelompok_barang: '',
  subkelompok_barang: '',
  satuan_barang: '',
  satuan_harga: '',
  stok_saat_ini: 0,
  image_url: '',
  lampiran_url: '',
};

export default function Barang() {
  const { barang, addBarang, updateBarang, deleteBarang } = useLogistikStore();
  const toast = useToast();

  const [open, setOpen] = useState(false);
  const [editKode, setEditKode] = useState(null);
  const [form, setForm] = useState(EMPTY);

  // STATE FILE UPLOAD & LOADING
  const [file, setFile] = useState(null);
  const [lampiranFile, setLampiranFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const [viewMode, setViewMode] = useState('card');
  const [showScanner, setShowScanner] = useState(false);

  // Filter states
  const [filterText, setFilterText] = useState('');
  const [filterKelompok, setFilterKelompok] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  // State modal konfirmasi hapus
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  // Reset ke halaman 1 saat filter berubah
  useEffect(() => { setCurrentPage(1); }, [filterText, filterKelompok, filterStatus]);

  // Sub-kelompok sesuai kelompok yang dipilih di form
  const subOptions = form.kelompok_barang
    ? (KELOMPOK_BARANG[form.kelompok_barang] || []).map(s => ({ label: s, value: s }))
    : [];

  // Filter data barang
  const filtered = barang.filter(b => {
    const textTarget = ((b.nama_barang || '') + (b.kode_barang || '')).toLowerCase();
    const matchText = textTarget.includes(filterText.toLowerCase());
    const matchKelompok = filterKelompok ? b.kelompok_barang === filterKelompok : true;
    const matchStatus = filterStatus === 'Menipis'
      ? b.stok_saat_ini <= 5
      : filterStatus === 'Normal'
        ? b.stok_saat_ini > 5
        : true;
    return matchText && matchKelompok && matchStatus;
  });

  const paged = filtered.slice((currentPage - 1) * perPage, currentPage * perPage);

  // RESET FORM
  const closeForm = () => {
    setOpen(false);
    setEditKode(null);
    setForm(EMPTY);
    setFile(null);
    setLampiranFile(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);

    const payload = {
      ...form,
      satuan_harga: Number(form.satuan_harga || 0),
    };

    let res;
    // Serahkan proses upload file & lampiran ke addBarang / updateBarang di Store
    if (editKode) {
      res = await updateBarang(editKode, payload, file, lampiranFile);
    } else {
      res = await addBarang(payload, file, lampiranFile);
    }

    setUploading(false);

    if (res?.success) {
      toast.success(editKode ? `Data barang "${payload.nama_barang}" berhasil diperbarui!` : `Barang baru "${payload.nama_barang}" berhasil ditambahkan!`);
      closeForm();
    } else {
      toast.error('Gagal menyimpan barang: ' + (res?.error || 'Terjadi kesalahan'));
    }
  };

  const handleEdit = (item) => {
    setEditKode(item.kode_barang);
    setForm({
      nama_barang: item.nama_barang,
      kode_barang: item.kode_barang,
      kelompok_barang: item.kelompok_barang || '',
      subkelompok_barang: item.subkelompok_barang || '',
      satuan_barang: item.satuan_barang || '',
      satuan_harga: item.satuan_harga || '',
      stok_saat_ini: item.stok_saat_ini ?? 0,
      image_url: item.image_url || '',
      lampiran_url: item.lampiran_url || '',
    });
    setFile(null);
    setLampiranFile(null);
    setOpen(true);
  };

  const handleDelete = (item) => {
    setItemToDelete(item);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = () => {
    if (itemToDelete) {
      deleteBarang(itemToDelete.kode_barang);
      toast.success(`Barang "${itemToDelete.nama_barang}" berhasil dihapus!`);
      setIsDeleteModalOpen(false);
      setItemToDelete(null);
    }
  };

  const handleScanResult = (scannedCode) => {
    setShowScanner(false);
    if (!scannedCode) return;
    const found = barang.find(b => b.kode_barang === scannedCode);
    if (found) {
      handleEdit(found);
    } else {
      toast.warning(`Barang dengan kode "${scannedCode}" tidak terdaftar di database.`);
    }
  };

  const handleExport = () => {
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(filtered), 'Barang');
    XLSX.writeFile(wb, 'Data_Barang.xlsx');
  };

  return (
    <div className="space-y-21">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
        <div>
          <h1 className="text-xl font-black text-slate-800 tracking-tight">Data Barang</h1>
          <p className="text-xs text-slate-400 mt-2">{filtered.length} item terdaftar</p>
        </div>
        <div className="flex gap-8">
          {/* Toggle view */}
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

          <Button size="sm" onClick={() => {
            setEditKode(null);
            setForm(EMPTY);
            setFile(null);
            setOpen(true);
          }}>
            <Plus size={15} /> Tambah
          </Button>
        </div>
      </div>

      {/* ── Form Tambah / Edit ── */}
      {open && (
        <Card className="border-teal-200 bg-teal-50/30 p-21">
          <p className="text-base font-bold text-slate-700 mb-13">
            {editKode ? '✏️ Edit Data Barang' : '📦 Tambah Barang Baru'}
          </p>
          <form onSubmit={handleSubmit} className="space-y-13">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-13">
              <Input
                label="Nama Barang" required
                value={form.nama_barang}
                onChange={e => setForm({ ...form, nama_barang: e.target.value })}
              />
              <Input
                label="Kode Barang" required
                value={form.kode_barang}
                disabled={!!editKode}
                onChange={e => setForm({ ...form, kode_barang: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-13">
              <Select
                label="Kelompok Barang" required
                options={Object.keys(KELOMPOK_BARANG).map(k => ({ label: k, value: k }))}
                value={form.kelompok_barang}
                onChange={e => setForm({ ...form, kelompok_barang: e.target.value, subkelompok_barang: '' })}
              />
              <Select
                label="Sub-Kelompok Barang"
                options={subOptions}
                value={form.subkelompok_barang}
                onChange={e => setForm({ ...form, subkelompok_barang: e.target.value })}
                disabled={!form.kelompok_barang}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-13">
              <Input
                label="Satuan" required placeholder="pcs / rim / box"
                value={form.satuan_barang}
                onChange={e => setForm({ ...form, satuan_barang: e.target.value })}
              />
              <Input
                label="Harga Satuan (Rp)" type="number" min="0"
                value={form.satuan_harga}
                onChange={e => setForm({ ...form, satuan_harga: Number(e.target.value) })}
              />
              <Input
                label="Stok Awal" type="number" min="0"
                value={form.stok_saat_ini}
                disabled={!!editKode}
                onChange={e => setForm({ ...form, stok_saat_ini: Number(e.target.value) })}
              />
            </div>

            {/* Upload File Foto */}
            <div className="flex flex-col gap-5 w-full">
              <label className="text-xs font-semibold text-slate-500 tracking-wide uppercase">Foto Barang</label>
              <input
                type="file"
                accept="image/*"
                onChange={e => e.target.files && setFile(e.target.files[0])}
                className="w-full text-sm text-slate-500 file:mr-13 file:py-5 file:px-13 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-teal-100 file:text-teal-700 hover:file:bg-teal-200 cursor-pointer"
              />
              {form.image_url && !file && (
                <p className="text-[10px] text-teal-600 mt-2">Gambar sudah tersimpan. Unggah baru untuk mengganti.</p>
              )}
            </div>

            {/* Upload Lampiran (Opsional) */}
            <div className="flex flex-col gap-5 w-full">
              <label className="text-xs font-semibold text-slate-500 tracking-wide uppercase">Lampiran (Opsional)</label>
              <input
                type="file"
                accept="image/*,application/pdf"
                onChange={e => e.target.files && setLampiranFile(e.target.files[0])}
                className="w-full text-sm text-slate-500 file:mr-13 file:py-5 file:px-13 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 cursor-pointer"
              />
              {form.lampiran_url && !lampiranFile && (
                <p className="text-[10px] text-teal-600 mt-2">File lampiran sudah tersimpan. Unggah baru untuk mengganti.</p>
              )}
            </div>

            <div className="flex justify-end gap-8 pt-5">
              <Button type="button" variant="ghost" size="sm" onClick={closeForm} disabled={uploading}>
                Batal
              </Button>
              <Button type="submit" size="sm" disabled={uploading}>
                {uploading ? 'Mengunggah...' : 'Simpan'}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* ── Search & Filter ── */}
      <div className="bg-slate-50 p-13 rounded-2xl border border-slate-100 shadow-sm space-y-8">
        <div className="flex gap-8">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-13 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nama atau kode barang..."
              value={filterText}
              onChange={e => setFilterText(e.target.value)}
              className="w-full pl-34 pr-13 py-8 text-xs bg-white border border-slate-200 rounded-xl focus:border-teal-500 focus:ring-2 focus:ring-teal-100 outline-none transition-all"
            />
          </div>
          <button
            type="button"
            onClick={() => setShowScanner(true)}
            className="w-34 h-34 flex items-center justify-center bg-teal-600 hover:bg-teal-700 text-white rounded-xl shadow-sm transition-colors shrink-0"
            title="Scan Barcode"
          >
            <QrCode size={16} />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
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
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
          >
            <option value="">Semua Status Stok</option>
            <option value="Normal">Normal (&gt; 5)</option>
            <option value="Menipis">Menipis (≤ 5)</option>
          </select>
        </div>
      </div>

      {/* ── Data Views ── */}
      {filtered.length === 0 ? (
        <div className="text-center py-34 text-slate-400 text-sm bg-slate-50 rounded-2xl border border-slate-100 border-dashed">
          Tidak ada data barang sesuai pencarian.
        </div>
      ) : viewMode === 'card' ? (
        <div className="space-y-21">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-13 lg:gap-21">
            {paged.map(b => (
              <ItemCard
                key={b.kode_barang}
                itemName={b.nama_barang}
                itemCode={b.kode_barang}
                category={b.kelompok_barang}
                subCategory={b.subkelompok_barang}
                price={b.satuan_harga ? `Rp ${Number(b.satuan_harga).toLocaleString('id-ID')}` : '-'}
                unit={b.satuan_barang}
                imageUrl={b.image_url}
                stock={b.stok_saat_ini}
                onEdit={() => handleEdit(b)}
                onDelete={() => handleDelete(b)}
              />
            ))}
          </div>
          <Pagination
            total={filtered.length}
            perPage={perPage}
            currentPage={currentPage}
            onPageChange={setCurrentPage}
            onPerPageChange={setPerPage}
          />
        </div>
      ) : (
        <div className="space-y-21">
          <Table headers={['Kode', 'Nama Barang', 'Kelompok', 'Stok', 'Harga/Satuan', 'Aksi']}>
            {paged.map(b => (
              <tr key={b.kode_barang} className="hover:bg-slate-50 transition-colors">
                <td className="px-13 py-13">
                  <span className="font-mono text-[10px] text-teal-700 font-bold bg-teal-50 px-5 py-2 rounded">{b.kode_barang}</span>
                </td>
                <td className="px-13 py-13">
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-slate-800">{b.nama_barang}</span>
                    <span className="text-[10px] text-slate-400 mt-1">{b.subkelompok_barang || '-'}</span>
                  </div>
                </td>
                <td className="px-13 py-13 text-xs text-slate-500">{b.kelompok_barang || '-'}</td>
                <td className="px-13 py-13">
                  <span className={`text-xs font-black px-8 py-3 rounded-lg ${b.stok_saat_ini <= 5 ? 'bg-rose-100 text-rose-600' : 'bg-slate-100 text-slate-700'}`}>
                    {b.stok_saat_ini} {b.satuan_barang}
                  </span>
                </td>
                <td className="px-13 py-13 text-xs font-semibold text-emerald-600">
                  {b.satuan_harga ? `Rp ${Number(b.satuan_harga).toLocaleString('id-ID')}` : '-'}
                </td>
                <td className="px-13 py-13">
                  <div className="flex gap-5">
                    <button onClick={() => handleEdit(b)} className="text-teal-600 p-5 hover:bg-teal-50 rounded-lg text-xs">Edit</button>
                    <button onClick={() => handleDelete(b)} className="text-red-600 p-5 hover:bg-red-50 rounded-lg text-xs">Hapus</button>
                  </div>
                </td>
              </tr>
            ))}
          </Table>
          <Pagination
            total={filtered.length}
            perPage={perPage}
            currentPage={currentPage}
            onPageChange={setCurrentPage}
            onPerPageChange={setPerPage}
          />
        </div>
      )}

      {/* ── Barcode Scanner ── */}
      {showScanner && (
        <BarcodeScanner
          onResult={handleScanResult}
          onClose={() => setShowScanner(false)}
        />
      )}

      {/* ── Modal Konfirmasi Hapus ── */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
            onClick={() => {
              setIsDeleteModalOpen(false);
              setItemToDelete(null);
            }}
          />
          <div className="relative bg-white rounded-3xl shadow-xl border border-slate-100 w-full max-w-md p-21 flex flex-col gap-13 z-10 animate-in fade-in zoom-in-95 duration-150 text-center items-center">
            <div className="mt-8">
              <h3 className="text-lg font-black text-slate-800 tracking-tight mb-8">Hapus Barang</h3>
              <p className="text-xs text-slate-500 leading-relaxed max-w-sm">
                Yakin ingin menghapus barang <span className="font-bold text-slate-700">"{itemToDelete?.nama_barang}"</span>? Seluruh data barang ini akan terhapus secara permanen.
              </p>
            </div>
            <div className="flex items-center justify-center gap-8 mt-13 w-full">
              <button
                type="button"
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setItemToDelete(null);
                }}
                className="px-18 py-8 rounded-xl border border-slate-200 text-xs font-bold text-slate-500 hover:bg-slate-50 active:scale-95 transition-all select-none"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-18 py-8 rounded-xl bg-rose-600 hover:bg-rose-700 text-xs font-bold text-white shadow-sm active:scale-95 transition-all select-none"
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