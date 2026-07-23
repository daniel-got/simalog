import { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { Plus, Download, Pencil, Trash2, Search, Wrench } from 'lucide-react';
import useHartaBendaStore from '../../store/HartaBenda/useHartaBendaStore';
import { Card } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { Table } from '../../components/ui/Table';
import { Input, Select } from '../../components/ui/Input';
import SearchableSelect from '../../components/ui/SearchableSelect';
import Pagination from '../../components/ui/Pagination';

const EMPTY = {
  id_aset: '',
  kategori_biaya: '',
  total_biaya: '',
  tanggal: new Date().toISOString().split('T')[0],
  keterangan: '',
};

const KATEGORI_BIAYA = [
  { label: 'Servis Rutin', value: 'Servis Rutin' },
  { label: 'Perbaikan', value: 'Perbaikan' },
  { label: 'Pajak & Dokumen', value: 'Pajak & Dokumen' },
  { label: 'Bahan Bakar (BBM)', value: 'Bahan Bakar (BBM)' },
];

const parseStatus = (keterangan) => {
  const statusMatch = keterangan?.match(/\[Status:\s*([^\]]+)\]/);
  return statusMatch ? statusMatch[1] : null;
};

const getCleanKeterangan = (keterangan) => {
  if (!keterangan) return '-';
  const kendalaMatch = keterangan.match(/Kendala:\s*(.*)$/);
  if (kendalaMatch) return kendalaMatch[1];
  return keterangan;
};

export default function Perawatan() {
  // 1. UBAH DI SINI: panggil 'aset' dari store, bukan 'daftarAset'
  const { aset, logPerawatan, addPerawatan, updatePerawatan, deletePerawatan, fetchDataHartaBenda } = useHartaBendaStore();

  // Amankan data aset menjadi array kosong jika store belum termuat sempurna
  const dataAsetAman = aset || [];

  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(EMPTY);

  const [filterText, setFilterText] = useState('');
  const [filterKategori, setFilterKategori] = useState('');
  const [filterDate, setFilterDate] = useState('');

  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  useEffect(() => { setCurrentPage(1); }, [filterText, filterKategori, filterDate]);

  // 2. UBAH DI SINI: Gunakan 'dataAsetAman' dan tambahkan pengecekan kolom kode yang fleksibel
  const asetOptions = dataAsetAman.map(a => ({
    label: `${a.nama_aset} — ${a.kode || a.kode_aset || a.no_aset || a.id || 'Tanpa kode'}`,
    value: a.id,
  }));

  // 3. UBAH DI SINI: Gunakan 'dataAsetAman' untuk mencari nama
  const getAsetName = (idAset) => dataAsetAman.find(a => String(a.id) === String(idAset))?.nama_aset || '-';

  const formatRupiah = (n) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n || 0);

  const closeForm = () => { setOpen(false); setEditId(null); setForm(EMPTY); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = { ...form, total_biaya: Number(form.total_biaya) };
    let ok;
    if (editId) {
      ok = await updatePerawatan(editId, payload);
    } else {
      ok = await addPerawatan(payload);
    }
    if (ok) {
      await fetchDataHartaBenda();
      closeForm();
    }
  };

  const handleUpdateStatus = async (item, action) => {
    let newStatus = action;
    if (action === 'Setujui') newStatus = 'Sedang Diperbaiki';
    else if (action === 'Tolak') newStatus = 'Ditolak';
    else if (action === 'Selesaikan') newStatus = 'Selesai';

    let newKeterangan = item.keterangan || '';
    if (newKeterangan.match(/\[Status:\s*([^\]]+)\]/)) {
      newKeterangan = newKeterangan.replace(/\[Status:\s*([^\]]+)\]/, `[Status: ${newStatus}]`);
    } else {
      newKeterangan = `[Status: ${newStatus}] ` + newKeterangan;
    }
    await updatePerawatan(item.id, { keterangan: newKeterangan });
    await fetchDataHartaBenda();
  };

  const handleEdit = (item) => {
    setForm({
      id_aset: item.id_aset || '',
      kategori_biaya: item.kategori_biaya || '',
      total_biaya: item.total_biaya || '',
      tanggal: item.tanggal || '',
      keterangan: item.keterangan || '',
    });
    setEditId(item.id);
    setOpen(true);
  };

  const handleDelete = (item) => { setItemToDelete(item); setIsDeleteModalOpen(true); };

  const handleConfirmDelete = async () => {
    if (itemToDelete) {
      await deletePerawatan(itemToDelete.id);
      await fetchDataHartaBenda();
      setIsDeleteModalOpen(false);
      setItemToDelete(null);
    }
  };

  const handleExport = () => {
    const exportData = filtered.map(p => ({
      Tanggal: p.tanggal,
      Aset: getAsetName(p.id_aset),
      Kategori: p.kategori_biaya,
      Total_Biaya: p.total_biaya,
      Keterangan: p.keterangan,
    }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(exportData), 'Perawatan');
    XLSX.writeFile(wb, 'Log_Perawatan_Aset.xlsx');
  };

  const filtered = (logPerawatan || []).filter(p => {
    const asetNama = getAsetName(p.id_aset).toLowerCase();
    const text = (asetNama + (p.keterangan || '') + (p.kategori_biaya || '')).toLowerCase();
    const matchText = text.includes(filterText.toLowerCase());
    const matchKat = filterKategori ? p.kategori_biaya === filterKategori : true;
    const matchDate = filterDate ? p.tanggal === filterDate : true;
    return matchText && matchKat && matchDate;
  });

  const totalBiaya = filtered.reduce((sum, p) => sum + (p.total_biaya || 0), 0);
  const paged = filtered.slice((currentPage - 1) * perPage, currentPage * perPage);

  return (
    <div className="space-y-21">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-slate-800 tracking-tight">Perawatan & Biaya Aset</h1>
          <p className="text-xs text-slate-400 mt-2">{filtered.length} catatan · Total: <span className="font-bold text-slate-600">{formatRupiah(totalBiaya)}</span></p>
        </div>
        <div className="flex gap-8">
          <Button variant="ghost" size="icon" onClick={handleExport} title="Export Excel">
            <Download size={16} />
          </Button>
          <Button size="sm" onClick={() => { setEditId(null); setForm(EMPTY); setOpen(true); }}
            className="bg-amber-600 hover:bg-amber-700 shadow-amber-500/20">
            <Plus size={15} /> Catat Biaya
          </Button>
        </div>
      </div>

      {/* Form */}
      {open && (
        <Card className="border-amber-200 bg-amber-50/40 p-21">
          <p className="text-base font-bold text-slate-700 mb-13">
            {editId ? '✏️   Edit Catatan Biaya' : '🔧   Catat Biaya Perawatan'}
          </p>
          <form onSubmit={handleSubmit} className="space-y-13">
            <SearchableSelect label="Pilih Aset" required options={asetOptions}
              value={form.id_aset}
              onChange={e => setForm({ ...form, id_aset: e.target.value })} />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-13">
              <Select label="Kategori Biaya" required options={KATEGORI_BIAYA}
                value={form.kategori_biaya}
                onChange={e => setForm({ ...form, kategori_biaya: e.target.value })} />
              <Input label="Total Biaya (Rp)" type="number" required value={form.total_biaya}
                onChange={e => setForm({ ...form, total_biaya: e.target.value })} />
              <Input label="Tanggal" type="date" required value={form.tanggal}
                onChange={e => setForm({ ...form, tanggal: e.target.value })} />
            </div>
            <Input label="Keterangan" value={form.keterangan}
              onChange={e => setForm({ ...form, keterangan: e.target.value })} />
            <div className="flex justify-end gap-8 pt-5">
              <Button type="button" variant="ghost" size="sm" onClick={closeForm}>Batal</Button>
              <Button type="submit" size="sm" className="bg-amber-600 hover:bg-amber-700 text-white">Simpan</Button>
            </div>
          </form>
        </Card>
      )}

      {/* Filter */}
      <div className="bg-slate-50 p-13 rounded-2xl border border-slate-100 shadow-sm space-y-8">
        <div className="relative">
          <Search size={14} className="absolute left-13 top-1/2 -translate-y-1/2 text-slate-400" />
          <input type="text" placeholder="Cari nama aset atau keterangan..."
            value={filterText} onChange={e => setFilterText(e.target.value)}
            className="w-full pl-34 pr-13 py-8 text-xs bg-white border border-slate-200 rounded-xl focus:border-amber-500 focus:ring-2 focus:ring-amber-100 outline-none transition-all" />
        </div>
        <div className="grid grid-cols-2 gap-8">
          <select className="w-full px-8 py-8 text-[10px] bg-white border border-slate-200 rounded-xl focus:border-amber-500 focus:ring-2 focus:ring-amber-100 outline-none transition-all text-slate-600 font-medium"
            value={filterKategori} onChange={e => setFilterKategori(e.target.value)}>
            <option value="">Semua Kategori</option>
            {KATEGORI_BIAYA.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <input type="date"
            className="w-full px-8 py-8 text-[10px] bg-white border border-slate-200 rounded-xl focus:border-amber-500 focus:ring-2 focus:ring-amber-100 outline-none transition-all text-slate-600 font-medium"
            value={filterDate} onChange={e => setFilterDate(e.target.value)} />
        </div>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="text-center py-34 text-slate-400 text-sm bg-slate-50 rounded-2xl border border-slate-100 border-dashed">
          <Wrench size={28} className="mx-auto mb-5 text-slate-300" />
          Belum ada catatan perawatan.
        </div>
      ) : (
        <div className="space-y-21">
          <Table headers={['Tanggal', 'Aset', 'Kategori Biaya', 'Total Biaya', 'Status', 'Keterangan', 'Aksi']}>
            {paged.map(p => {
              const status = parseStatus(p.keterangan);
              return (
              <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-13 py-13 text-xs text-slate-500 whitespace-nowrap">{p.tanggal}</td>
                <td className="px-13 py-13 text-sm font-semibold text-slate-700">{getAsetName(p.id_aset)}</td>
                <td className="px-13 py-13">
                  <span className={`text-[10px] font-bold px-5 py-2 rounded-md ${p.kategori_biaya === 'Servis Rutin' ? 'bg-teal-50 text-teal-600' :
                    p.kategori_biaya === 'Perbaikan' ? 'bg-orange-50 text-orange-600' :
                      p.kategori_biaya === 'Pajak & Dokumen' ? 'bg-purple-50 text-purple-600' :
                        'bg-sky-50 text-sky-600'
                    }`}>
                    {p.kategori_biaya}
                  </span>
                </td>
                <td className="px-13 py-13 font-mono text-xs font-bold text-slate-700">{formatRupiah(p.total_biaya)}</td>
                <td className="px-13 py-13">
                  {status ? (
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-md border ${
                      status === 'Menunggu Pengecekan' ? 'bg-amber-50 text-amber-600 border-amber-200' :
                      status === 'Sedang Diperbaiki' ? 'bg-blue-50 text-blue-600 border-blue-200' :
                      status === 'Ditolak' ? 'bg-rose-50 text-rose-600 border-rose-200' :
                      'bg-green-50 text-green-600 border-green-200'
                    }`}>
                      {status}
                    </span>
                  ) : (
                    <span className="text-slate-400 text-[10px] italic">-</span>
                  )}
                </td>
                <td className="px-13 py-13 text-xs text-slate-500 max-w-[150px] truncate">{getCleanKeterangan(p.keterangan)}</td>
                <td className="px-13 py-13">
                  <div className="flex flex-col gap-2">
                    {status === 'Menunggu Pengecekan' && (
                      <div className="flex gap-1">
                        <button onClick={() => handleUpdateStatus(p, 'Setujui')} className="text-[10px] font-bold px-2 py-1 bg-green-500 text-white rounded hover:bg-green-600 transition-colors">✓ Setujui</button>
                        <button onClick={() => handleUpdateStatus(p, 'Tolak')} className="text-[10px] font-bold px-2 py-1 bg-rose-500 text-white rounded hover:bg-rose-600 transition-colors">✕ Tolak</button>
                      </div>
                    )}
                    {status === 'Sedang Diperbaiki' && (
                      <button onClick={() => handleUpdateStatus(p, 'Selesaikan')} className="text-[10px] font-bold px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors">Selesaikan / Kembalikan</button>
                    )}

                    <div className="flex gap-5 mt-3">
                      <button onClick={() => handleEdit(p)}
                        className="w-21 h-21 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center hover:bg-amber-100 transition-colors" title="Edit">
                        <Pencil size={12} />
                      </button>
                      <button onClick={() => handleDelete(p)}
                        className="w-21 h-21 rounded-lg bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-100 transition-colors" title="Hapus">
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                </td>
              </tr>
            )})}
          </Table>
          <Pagination total={filtered.length} perPage={perPage} currentPage={currentPage}
            onPageChange={setCurrentPage} onPerPageChange={setPerPage} />
        </div>
      )}

      {/* CUSTOM MODAL HAPUS */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={() => { setIsDeleteModalOpen(false); setItemToDelete(null); }} />
          <div className="relative bg-white rounded-2xl shadow-xl border border-slate-100 w-full max-w-md p-6 flex flex-col gap-4 z-10 animate-in fade-in zoom-in-95 duration-150">
            <div>
              <h3 className="text-base font-bold text-slate-800 mb-2">Hapus Log Perawatan</h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                Yakin ingin menghapus catatan biaya <span className="font-semibold text-slate-700">"{itemToDelete?.kategori_biaya}"</span> untuk aset <span className="font-semibold text-slate-700">{getAsetName(itemToDelete?.id_aset)}</span>?
              </p>
            </div>
            <div className="flex items-center justify-end gap-3 mt-4">
              <button type="button" onClick={() => { setIsDeleteModalOpen(false); setItemToDelete(null); }}
                className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 active:scale-95 transition-all select-none">
                Batal
              </button>
              <button type="button" onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-sm font-semibold text-white shadow-sm active:scale-95 transition-all select-none">
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}