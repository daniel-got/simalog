import { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { Plus, Download, Pencil, Trash2, Search, ClipboardList, MapPin, UserCheck, Calendar, LayoutGrid, List, Activity, ArrowUpRight, ArrowDownLeft, Move, Users } from 'lucide-react';
import useHartaBendaStore from '../../store/HartaBenda/useHartaBendaStore';
import { formatNamaAset } from '../../utils/assetHelpers';
import { supabase } from '../../lib/supabase';
import { Card } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { Table } from '../../components/ui/Table';
import { Input, Select } from '../../components/ui/Input';
import SearchableSelect from '../../components/ui/SearchableSelect';
import Pagination from '../../components/ui/Pagination';

const EMPTY = {
  id_aset: '',
  jenis_aktivitas: '',
  nama_staf: '',
  lokasi_baru: '',
  penanggung_jawab_baru: '',
  tanggal: new Date().toISOString().split('T')[0],
  tanggal_rencana_kembali: '',
  keterangan: '',
};

const JENIS_AKTIVITAS = [
  { label: 'Dipindahkan', value: 'Dipindahkan' },
  { label: 'Mutasi Penanggung Jawab', value: 'Mutasi Penanggung Jawab' },
  { label: 'Dipinjam', value: 'Dipinjam' },
  { label: 'Dikembalikan', value: 'Dikembalikan' },
];

const parseStatus = (keterangan) => {
  if (keterangan?.includes('[Status: Pending]')) return 'Pending';
  if (keterangan?.includes('[Status: Disetujui]')) return 'Disetujui';
  if (keterangan?.includes('[Status: Ditolak]')) return 'Ditolak';
  if (keterangan?.includes('[Status: Selesai]')) return 'Selesai';
  if (keterangan?.includes('[Status: Dikembalikan]')) return 'Dikembalikan';
  return null;
};

const getCleanKeterangan = (keterangan) => {
  if (!keterangan) return '-';
  return keterangan
    .replace(/^\[Status:\s*[^\]]+\]\s*/, '')
    .replace(/^Keperluan:\s*/i, '') || '-';
};

function AktivitasCard({ item, asetObj, getAsetName, onEdit, onDelete, onUpdateStatus, parseStatus }) {
  const status = parseStatus(item.keterangan);
  
  let IconComponent = Activity;
  let colorClasses = "bg-slate-50 lg:bg-slate-50/50 lg:border-slate-100 text-slate-600";
  
  if (item.jenis_aktivitas === 'Dipinjam') {
    IconComponent = ArrowUpRight;
    colorClasses = "bg-blue-50 lg:bg-blue-50/50 lg:border-blue-100 text-blue-600";
  } else if (item.jenis_aktivitas === 'Dikembalikan') {
    IconComponent = ArrowDownLeft;
    colorClasses = "bg-emerald-50 lg:bg-emerald-50/50 lg:border-emerald-100 text-emerald-600";
  } else if (item.jenis_aktivitas === 'Dipindahkan') {
    IconComponent = Move;
    colorClasses = "bg-amber-50 lg:bg-amber-50/50 lg:border-amber-100 text-amber-600";
  } else if (item.jenis_aktivitas === 'Mutasi Penanggung Jawab') {
    IconComponent = Users;
    colorClasses = "bg-purple-50 lg:bg-purple-50/50 lg:border-purple-100 text-purple-600";
  }

  return (
    <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-row lg:flex-col items-center lg:items-stretch gap-4 overflow-hidden group hover:border-slate-200 transition-colors h-auto">
      {/* Icon Area (Kecil di kiri pada mobile, Block besar di atas pada desktop) */}
      <div className={`w-34 h-34 lg:w-full lg:h-24 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${colorClasses}`}>
        <IconComponent size={15} strokeWidth={2.5} className="lg:w-8 lg:h-8 lg:opacity-75" />
      </div>

      {/* Content Area */}
      <div className="flex-1 min-w-0 flex flex-col gap-2 w-full">
        {/* Baris 1: Judul Aset */}
        <h3 className="text-[10px] lg:text-xs font-bold text-slate-800 uppercase tracking-wide line-clamp-2 leading-snug w-full">
          {formatNamaAset(asetObj) || getAsetName(item.id_aset)}
        </h3>
        
        {/* Baris 2: Kode BMN & Status/Aktivitas */}
        <div className="flex items-center gap-2">
          <p className="text-[9px] lg:text-[10px] text-slate-500 truncate mt-1">
            {asetObj?.kode_bmn ? (
              <><span>{asetObj.kode_bmn}</span> &middot; <span>{item.jenis_aktivitas}</span></>
            ) : (
              <span>{item.jenis_aktivitas}</span>
            )}
          </p>
          {status && (
             <span className={`text-[9px] font-bold px-2 py-0.5 rounded border inline-block shrink-0 ${status === 'Pending' ? 'bg-amber-100 text-amber-700 border-amber-200' :
               status === 'Disetujui' || status === 'Dikembalikan' || status === 'Selesai' ? 'bg-green-100 text-green-700 border-green-200' :
               'bg-red-100 text-red-700 border-red-200'
             }`}>
               {status}
             </span>
          )}
        </div>
        
        {/* Baris 3: Lokasi & Tanggal (2 Baris dengan Ikon) */}
        <div className="flex flex-col gap-1.5 mt-0.5">
          <div className="text-[9px] lg:text-[10px] text-slate-500 font-medium flex items-center gap-1.5 truncate">
            <MapPin size={11} className="text-slate-400 shrink-0" />
            <span className="truncate">{asetObj?.lokasi_ruangan || 'Lokasi Tidak Diketahui'}</span>
          </div>
          <div className="text-[9px] lg:text-[10px] text-slate-500 font-medium flex items-center gap-1.5 truncate">
            <Calendar size={11} className="text-slate-400 shrink-0" />
            <span className="shrink-0">{item.tanggal}</span>
          </div>
        </div>

        {/* Baris 4 (Footer): Pelaksana & Aksi */}
        <div className="mt-2 pt-2 border-t border-slate-100 flex justify-between items-center w-full">
          <div className="text-[9px] lg:text-[10px] font-medium text-slate-500 truncate max-w-[50%]">
             <span className="truncate">{item.nama_staf || 'Tanpa Pelaksana'}</span>
          </div>

          <div className="flex gap-2 shrink-0 flex-wrap justify-end">
               {status === 'Pending' && (
                 <>
                   <button onClick={() => onUpdateStatus(item, 'Setujui')} className="text-emerald-600 bg-emerald-50 px-2.5 py-1.5 hover:bg-emerald-100 rounded-lg text-[9px] font-bold" title="Setujui">✓</button>
                   <button onClick={() => onUpdateStatus(item, 'Tolak')} className="text-red-600 bg-red-50 px-2.5 py-1.5 hover:bg-red-100 rounded-lg text-[9px] font-bold" title="Tolak">✕</button>
                 </>
               )}
               {status === 'Disetujui' && (
                 <button onClick={() => onUpdateStatus(item, 'Kembalikan')} className="text-blue-600 bg-blue-50 px-2.5 py-1.5 hover:bg-blue-100 rounded-lg text-[9px] font-bold">Kembali</button>
               )}
              <button 
                onClick={onEdit}
                className="text-teal-600 bg-teal-50 hover:bg-teal-100 rounded-lg transition-colors p-5 flex items-center justify-center" 
                title="Edit"
              >
                <Pencil size={13} strokeWidth={2.5} />
              </button>
              <button 
                onClick={onDelete}
                className="text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors p-5 flex items-center justify-center" 
                title="Hapus"
              >
                <Trash2 size={13} strokeWidth={2.5} />
              </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Aktivitas() {
  const { daftarAset, logAktivitas, addAktivitas, updateAktivitas, deleteAktivitas, fetchDataHartaBenda } = useHartaBendaStore();

  const [open, setOpen] = useState(false);
  const [viewMode, setViewMode] = useState('table');
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(EMPTY);

  const [filterText, setFilterText] = useState('');
  const [filterJenis, setFilterJenis] = useState('');
  const [filterDate, setFilterDate] = useState('');

  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  useEffect(() => { setCurrentPage(1); }, [filterText, filterJenis, filterDate]);

  // Format Tampilan Pilihan Aset: {nama_aset} — {id} — {lokasi_ruangan}
  const asetOptions = daftarAset.map(a => ({
    label: `${a.nama_aset} — ${a.id} — ${a.lokasi_ruangan || 'Tanpa Lokasi'}`,
    value: a.id,
  }));

  const getAsetName = (idAset) => daftarAset.find(a => String(a.id) === String(idAset))?.nama_aset || '-';

  const closeForm = () => { setOpen(false); setEditId(null); setForm(EMPTY); };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.id_aset) {
      alert('Silakan pilih aset terlebih dahulu.');
      return;
    }
    if (!form.jenis_aktivitas) {
      alert('Silakan pilih jenis aktivitas.');
      return;
    }

    // Validasi Field Kondisional
    if (form.jenis_aktivitas === 'Dipindahkan') {
      if (!form.lokasi_baru) {
        alert('Lokasi baru wajib diisi untuk aktivitas Dipindahkan.');
        return;
      }
    } else if (form.jenis_aktivitas === 'Mutasi Penanggung Jawab') {
      if (!form.penanggung_jawab_baru) {
        alert('Penanggung jawab baru wajib diisi untuk Mutasi.');
        return;
      }
    } else if (form.jenis_aktivitas === 'Dipinjam') {
      if (!form.nama_staf) {
        alert('Nama peminjam/staf wajib diisi.');
        return;
      }
      if (!form.tanggal_rencana_kembali) {
        alert('Rencana tanggal kembali wajib diisi.');
        return;
      }
    }

    // ── Jika 'Dipinjam': simpan ke peminjaman_aset (masuk Persetujuan) ──────
    if (!editId && form.jenis_aktivitas === 'Dipinjam') {
      const { error: pinjamErr } = await supabase
        .from('peminjaman_aset')
        .insert([{
          id_aset: form.id_aset,
          nama_peminjam: form.nama_staf,
          keperluan: form.keterangan || '',
          tanggal_pinjam: form.tanggal,
          tanggal_kembali: form.tanggal_rencana_kembali || null,
          status: 'pending',
        }]);

      if (pinjamErr) {
        alert('Gagal mengajukan peminjaman: ' + pinjamErr.message);
        return;
      }

      alert('Pengajuan peminjaman berhasil dikirim! Menunggu persetujuan admin.');
      await fetchDataHartaBenda();
      closeForm();
      return;
    }

    // ── Aktivitas lainnya: simpan langsung ke log_aktivitas_aset ─────────────
    const payloadLog = {
      id_aset: form.id_aset,
      jenis_aktivitas: form.jenis_aktivitas,
      tanggal: form.tanggal,
      nama_staf: form.jenis_aktivitas === 'Mutasi Penanggung Jawab' ? form.penanggung_jawab_baru : form.nama_staf,
      tanggal_rencana_kembali: form.jenis_aktivitas === 'Dipinjam' ? form.tanggal_rencana_kembali : null,
      keterangan: form.keterangan,
    };

    let ok = false;
    if (editId) {
      ok = await updateAktivitas(editId, payloadLog);
    } else {
      ok = await addAktivitas(payloadLog);
    }

    // UPDATE KOLOM TERKAIT DI TABEL ASSETS
    if (ok) {
      try {
        const updateDataAset = {};

        if (form.jenis_aktivitas === 'Dipindahkan') {
          updateDataAset.lokasi_ruangan = form.lokasi_baru;
        } else if (form.jenis_aktivitas === 'Mutasi Penanggung Jawab') {
          updateDataAset.penanggung_jawab = form.penanggung_jawab_baru;
          if (form.lokasi_baru) {
            updateDataAset.lokasi_ruangan = form.lokasi_baru;
          }
        }

        if (Object.keys(updateDataAset).length > 0) {
          const { error } = await supabase
            .from('assets')
            .update(updateDataAset)
            .eq('id', form.id_aset);

          if (error) {
            console.error('Gagal memperbarui data aset:', error);
          }
        }
      } catch (err) {
        console.error('Error memperbarui assets:', err);
      }

      await fetchDataHartaBenda();
      closeForm();
    }
  };

  const handleUpdateStatus = async (item, action) => {
    let newStatus = '';
    let newJenis = item.jenis_aktivitas;

    if (action === 'Setujui') newStatus = 'Disetujui';
    else if (action === 'Tolak') newStatus = 'Ditolak';
    else if (action === 'Kembalikan') {
      newStatus = 'Dikembalikan';
      newJenis = 'Dikembalikan';
    }

    let newKeterangan = item.keterangan || '';
    if (newKeterangan.match(/\[Status:\s*([^\]]+)\]/)) {
      newKeterangan = newKeterangan.replace(/\[Status:\s*([^\]]+)\]/, `[Status: ${newStatus}]`);
    } else {
      newKeterangan = `[Status: ${newStatus}] ` + newKeterangan;
    }

    await updateAktivitas(item.id, { keterangan: newKeterangan, jenis_aktivitas: newJenis });
    await fetchDataHartaBenda();
  };

  const handleEdit = (item) => {
    setForm({
      id_aset: item.id_aset || '',
      jenis_aktivitas: item.jenis_aktivitas || '',
      nama_staf: item.nama_staf || '',
      lokasi_baru: '',
      penanggung_jawab_baru: item.jenis_aktivitas === 'Mutasi Penanggung Jawab' ? item.nama_staf : '',
      tanggal: item.tanggal || '',
      tanggal_rencana_kembali: item.tanggal_rencana_kembali || '',
      keterangan: item.keterangan || '',
    });
    setEditId(item.id);
    setOpen(true);
  };

  const handleDelete = (item) => { setItemToDelete(item); setIsDeleteModalOpen(true); };

  const handleConfirmDelete = async () => {
    if (itemToDelete) {
      await deleteAktivitas(itemToDelete.id);
      await fetchDataHartaBenda();
      setIsDeleteModalOpen(false);
      setItemToDelete(null);
    }
  };

  const handleExport = () => {
    const exportData = filtered.map(a => ({
      Tanggal: a.tanggal,
      Aset: getAsetName(a.id_aset),
      Jenis_Aktivitas: a.jenis_aktivitas,
      Nama_Staf: a.nama_staf || '-',
      Rencana_Kembali: a.tanggal_rencana_kembali || '-',
      Keterangan: a.keterangan,
    }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(exportData), 'Aktivitas');
    XLSX.writeFile(wb, 'Log_Aktivitas_Aset.xlsx');
  };

  const filtered = logAktivitas.filter(a => {
    const asetNama = getAsetName(a.id_aset).toLowerCase();
    const text = (asetNama + (a.keterangan || '') + (a.nama_staf || '') + (a.jenis_aktivitas || '')).toLowerCase();
    const matchText = text.includes(filterText.toLowerCase());
    const matchJenis = filterJenis ? a.jenis_aktivitas === filterJenis : true;
    const matchDate = filterDate ? a.tanggal === filterDate : true;
    return matchText && matchJenis && matchDate;
  });

  const paged = filtered.slice((currentPage - 1) * perPage, currentPage * perPage);

  return (
    <div className="space-y-21">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
        <div>
          <h1 className="text-xl font-black text-slate-800 tracking-tight">Aktivitas &amp; Log Aset</h1>
          <p className="text-xs text-slate-400 mt-2">{filtered.length} riwayat aktivitas tercatat</p>
        </div>
        <div className="flex gap-8">
          <div className="flex bg-slate-100 rounded-xl p-3">
            <button
              onClick={() => setViewMode('card')}
              className={`p-5 rounded-lg transition-colors ${viewMode === 'card' ? 'bg-white shadow-sm text-teal-600' : 'text-slate-400 hover:text-slate-600'}`}
              title="Tampilan Kartu"
            >
              <LayoutGrid size={15} />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-5 rounded-lg transition-colors ${viewMode === 'table' ? 'bg-white shadow-sm text-teal-600' : 'text-slate-400 hover:text-slate-600'}`}
              title="Tampilan Tabel"
            >
              <List size={15} />
            </button>
          </div>
          <Button variant="ghost" size="icon" onClick={handleExport} title="Export Excel">
            <Download size={16} />
          </Button>
          <Button size="sm" onClick={() => { setEditId(null); setForm(EMPTY); setOpen(true); }}>
            <Plus size={15} /> Catat Aktivitas
          </Button>
        </div>
      </div>

      {/* Form Catat Aktivitas */}
      {open && (
        <Card className="border-teal-200 bg-teal-50/30 p-21">
          <p className="text-base font-bold text-slate-700 mb-13">
            {editId ? '✏️ Edit Catatan Aktivitas' : '📝 Catat Aktivitas Aset Baru'}
          </p>
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Baris 1: Aset */}
            <div className="w-full">
              <SearchableSelect
                label="Aset yang Terlibat"
                required
                options={asetOptions}
                value={form.id_aset}
                onChange={e => setForm({ ...form, id_aset: e.target.value })}
              />
            </div>

            {/* Baris 2: Jenis Aktivitas & Tanggal */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Select
                label="Jenis Aktivitas"
                required
                options={JENIS_AKTIVITAS}
                value={form.jenis_aktivitas}
                onChange={e => setForm({ ...form, jenis_aktivitas: e.target.value })}
              />
              <Input
                label="Tanggal Aktivitas"
                type="date"
                required
                value={form.tanggal}
                onChange={e => setForm({ ...form, tanggal: e.target.value })}
              />
            </div>

            {/* Baris 3: Kondisional berdasarkan Jenis Aktivitas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Field Penanggung Jawab / Peminjam muncul di Dipinjam & Mutasi */}
              {(form.jenis_aktivitas === 'Dipinjam' || form.jenis_aktivitas === 'Mutasi Penanggung Jawab') && (
                <Input
                  label="Penanggung Jawab / Peminjam"
                  placeholder="Contoh: Nama Staf / Vendor..."
                  required
                  value={form.jenis_aktivitas === 'Mutasi Penanggung Jawab' ? form.penanggung_jawab_baru : form.nama_staf}
                  onChange={e => {
                    if (form.jenis_aktivitas === 'Mutasi Penanggung Jawab') {
                      setForm({ ...form, penanggung_jawab_baru: e.target.value });
                    } else {
                      setForm({ ...form, nama_staf: e.target.value });
                    }
                  }}
                />
              )}

              {/* Field Lokasi Tujuan muncul di Dipindahkan & Mutasi */}
              {(form.jenis_aktivitas === 'Dipindahkan' || form.jenis_aktivitas === 'Mutasi Penanggung Jawab') && (
                <Input
                  label="Ruangan / Lokasi Tujuan Baru"
                  placeholder="Contoh: Ruang Rapat Lt 2..."
                  required={form.jenis_aktivitas === 'Dipindahkan'}
                  value={form.lokasi_baru}
                  onChange={e => setForm({ ...form, lokasi_baru: e.target.value })}
                />
              )}

              {/* Field Tanggal Kembali muncul HANYA saat Dipinjam */}
              {form.jenis_aktivitas === 'Dipinjam' && (
                <Input
                  label="Rencana Tanggal Pengembalian"
                  type="date"
                  required
                  value={form.tanggal_rencana_kembali}
                  onChange={e => setForm({ ...form, tanggal_rencana_kembali: e.target.value })}
                />
              )}
              
              {form.jenis_aktivitas === 'Dikembalikan' && (
                <div className="col-span-1 md:col-span-2 p-5 bg-emerald-50 rounded-xl border border-emerald-100 text-xs text-emerald-800 font-medium">
                  Informasi: Aset akan ditandai kembali ke lokasi/penanggung jawab sebelumnya.
                </div>
              )}
            </div>

            {/* Baris 4: Keterangan Tambahan */}
            <div className="w-full pt-3 border-t border-teal-100">
              <Input
                label="Keterangan / Catatan Tambahan"
                placeholder="Detail aktivitas atau kondisi barang..."
                value={form.keterangan}
                onChange={e => setForm({ ...form, keterangan: e.target.value })}
              />
            </div>

            <div className="flex justify-end gap-8 pt-5">
              <Button type="button" variant="ghost" size="sm" onClick={closeForm}>Batal</Button>
              <Button type="submit" size="sm">Simpan Catatan</Button>
            </div>
          </form>
        </Card>
      )}

      {/* Filter */}
      <div className="bg-slate-50 p-13 rounded-2xl border border-slate-100 shadow-sm space-y-8">
        <div className="relative">
          <Search size={14} className="absolute left-13 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari nama aset, nama staf, atau keterangan..."
            value={filterText}
            onChange={e => setFilterText(e.target.value)}
            className="w-full pl-34 pr-13 py-8 text-xs bg-white border border-slate-200 rounded-xl focus:border-teal-500 focus:ring-2 focus:ring-teal-100 outline-none transition-all"
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <select
            className="w-full px-8 py-8 text-[10px] bg-white border border-slate-200 rounded-xl focus:border-teal-500 focus:ring-2 focus:ring-teal-100 outline-none transition-all text-slate-600 font-medium"
            value={filterJenis}
            onChange={e => setFilterJenis(e.target.value)}
          >
            <option value="">Semua Jenis Aktivitas</option>
            {JENIS_AKTIVITAS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <input
            type="date"
            className="w-full px-8 py-8 text-[10px] bg-white border border-slate-200 rounded-xl focus:border-teal-500 focus:ring-2 focus:ring-teal-100 outline-none transition-all text-slate-600 font-medium"
            value={filterDate}
            onChange={e => setFilterDate(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="text-center py-34 text-slate-400 text-sm bg-slate-50 rounded-2xl border border-slate-100 border-dashed">
          <ClipboardList size={28} className="mx-auto mb-5 text-slate-300" />
          Belum ada catatan aktivitas.
        </div>
      ) : viewMode === 'card' ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-13 lg:gap-21">
            {paged.map(a => {
              const asetObj = daftarAset.find(asset => String(asset.id) === String(a.id_aset));
              return (
                <AktivitasCard
                  key={a.id}
                  item={a}
                  asetObj={asetObj}
                  getAsetName={getAsetName}
                  onEdit={() => handleEdit(a)}
                  onDelete={() => handleDelete(a)}
                  onUpdateStatus={handleUpdateStatus}
                  parseStatus={parseStatus}
                />
              );
            })}
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
          <Table headers={['Tanggal', 'Aset', 'Jenis Aktivitas', 'Penanggung Jawab', 'Keterangan / Perubahan', 'Aksi']}>
            {paged.map(a => {
              const status = parseStatus(a.keterangan);
              const asetObj = daftarAset.find(asset => String(asset.id) === String(a.id_aset));
              
              // Menggabungkan informasi tambahan ke dalam kolom keterangan
              let infoTambahan = getCleanKeterangan(a.keterangan);
              if (a.jenis_aktivitas === 'Dipinjam' && a.tanggal_rencana_kembali) {
                infoTambahan = `Rencana Kembali: ${a.tanggal_rencana_kembali} | ${infoTambahan}`;
              }

              return (
                <tr key={a.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-13 py-13 text-xs text-slate-500 whitespace-nowrap">{a.tanggal}</td>
                  <td className="px-13 py-13">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-slate-800">{getAsetName(a.id_aset)}</span>
                      <span className="text-[10px] text-slate-500 font-mono mt-0.5">{asetObj?.kode_bmn || '-'}</span>
                    </div>
                  </td>
                  <td className="px-13 py-13">
                    <div className="flex flex-col gap-2 items-start">
                      <span className={`text-[10px] font-bold px-3 py-1.5 rounded-md ${
                        a.jenis_aktivitas === 'Dipinjam' ? 'bg-blue-100 text-blue-700' :
                        a.jenis_aktivitas === 'Dikembalikan' ? 'bg-emerald-100 text-emerald-700' :
                        a.jenis_aktivitas === 'Mutasi Penanggung Jawab' ? 'bg-purple-100 text-purple-700' :
                        a.jenis_aktivitas === 'Dipindahkan' ? 'bg-amber-100 text-amber-700' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {a.jenis_aktivitas}
                      </span>
                      {status && (
                        <span className={`text-[9px] font-black px-2 py-1 rounded uppercase tracking-wider ${status === 'Pending' ? 'bg-amber-50 text-amber-600' :
                            status === 'Disetujui' || status === 'Dikembalikan' || status === 'Selesai' ? 'bg-green-50 text-green-600' :
                              'bg-red-50 text-red-600'
                          }`}>
                          {status}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-13 py-13 text-xs text-slate-700 font-medium">
                    {a.nama_staf || '-'}
                  </td>
                  <td className="px-13 py-13 text-xs text-slate-600 max-w-[200px] truncate" title={infoTambahan}>
                    {infoTambahan}
                  </td>
                  <td className="px-13 py-13">
                      <div className="flex items-center gap-5">
                        {/* Action Buttons */}
                        {status === 'Pending' && (
                          <>
                            <button onClick={() => handleUpdateStatus(a, 'Setujui')} className="text-emerald-600 p-5 hover:bg-emerald-50 rounded-lg text-xs font-bold">✓ Setujui</button>
                            <button onClick={() => handleUpdateStatus(a, 'Tolak')} className="text-red-600 p-5 hover:bg-red-50 rounded-lg text-xs font-bold">✕ Tolak</button>
                          </>
                        )}
                        {status === 'Disetujui' && (
                          <button onClick={() => handleUpdateStatus(a, 'Kembalikan')} className="text-blue-600 p-5 hover:bg-blue-50 rounded-lg text-xs font-bold">Selesaikan / Kembalikan</button>
                        )}

                        <div className="flex gap-2 items-center ml-auto shrink-0">
                          <button onClick={() => handleEdit(a)}
                            className="w-21 h-21 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center hover:bg-teal-100 transition-colors" title="Edit">
                            <Pencil size={12} strokeWidth={2.5} />
                          </button>
                          <button onClick={() => handleDelete(a)}
                            className="w-21 h-21 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center hover:bg-rose-100 transition-colors" title="Hapus">
                            <Trash2 size={12} strokeWidth={2.5} />
                          </button>
                        </div>
                      </div>
                  </td>
                </tr>
              );
            })}
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

      {/* Modal Hapus */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={() => { setIsDeleteModalOpen(false); setItemToDelete(null); }} />
          <div className="relative bg-white rounded-3xl shadow-xl border border-slate-100 w-full max-w-md p-21 flex flex-col gap-13 z-10 animate-in fade-in zoom-in-95 duration-150 text-center items-center">
            <div className="mt-8">
              <h3 className="text-lg font-black text-slate-800 tracking-tight mb-8">Hapus Log Aktivitas?</h3>
              <p className="text-xs text-slate-500 leading-relaxed max-w-sm">
                Yakin ingin menghapus catatan aktivitas <span className="font-bold text-slate-700">"{itemToDelete?.jenis_aktivitas}"</span> untuk aset <span className="font-bold text-slate-700">{getAsetName(itemToDelete?.id_aset)}</span>?
              </p>
            </div>
            <div className="flex items-center justify-center gap-8 mt-13 w-full">
              <button type="button" onClick={() => { setIsDeleteModalOpen(false); setItemToDelete(null); }}
                className="px-18 py-8 rounded-xl border border-slate-200 text-xs font-bold text-slate-500 hover:bg-slate-50 active:scale-95 transition-all select-none">
                Batal
              </button>
              <button type="button" onClick={handleConfirmDelete}
                className="px-18 py-8 rounded-xl bg-rose-600 hover:bg-rose-700 text-xs font-bold text-white shadow-sm active:scale-95 transition-all select-none">
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}