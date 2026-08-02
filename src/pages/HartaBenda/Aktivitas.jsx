import { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { Plus, Download, Pencil, Trash2, Search, ClipboardList, MapPin, UserCheck, Calendar } from 'lucide-react';
import useHartaBendaStore from '../../store/HartaBenda/useHartaBendaStore';
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

export default function Aktivitas() {
  const { daftarAset, logAktivitas, addAktivitas, updateAktivitas, deleteAktivitas, fetchDataHartaBenda } = useHartaBendaStore();

  const [open, setOpen] = useState(false);
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-slate-800 tracking-tight">Aktivitas &amp; Log Aset</h1>
          <p className="text-xs text-slate-400 mt-2">{filtered.length} riwayat aktivitas tercatat</p>
        </div>
        <div className="flex gap-8">
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
          <form onSubmit={handleSubmit} className="space-y-13">
            <SearchableSelect
              label="Pilih Aset"
              required
              options={asetOptions}
              value={form.id_aset}
              onChange={e => setForm({ ...form, id_aset: e.target.value })}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-13">
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

            {/* FIELD KONDISIONAL BERDASARKAN JENIS AKTIVITAS */}

            {/* 1. Dipindahkan */}
            {form.jenis_aktivitas === 'Dipindahkan' && (
              <div className="p-13 bg-teal-100/50 rounded-2xl border border-teal-200/80 space-y-13">
                <div className="flex items-center gap-8 text-teal-800 font-semibold text-xs">
                  <MapPin size={14} /> Informasi Pemindahan Lokasi
                </div>
                <Input
                  label="Lokasi Baru"
                  placeholder="Masukkan lokasi / ruangan baru..."
                  required
                  value={form.lokasi_baru}
                  onChange={e => setForm({ ...form, lokasi_baru: e.target.value })}
                />
              </div>
            )}

            {/* 2. Mutasi Penanggung Jawab */}
            {form.jenis_aktivitas === 'Mutasi Penanggung Jawab' && (
              <div className="p-13 bg-purple-50/60 rounded-2xl border border-purple-100 space-y-13">
                <div className="flex items-center gap-8 text-purple-800 font-semibold text-xs">
                  <UserCheck size={14} /> Informasi Mutasi Penanggung Jawab
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-13">
                  <Input
                    label="Penanggung Jawab Baru"
                    placeholder="Nama penanggung jawab baru..."
                    required
                    value={form.penanggung_jawab_baru}
                    onChange={e => setForm({ ...form, penanggung_jawab_baru: e.target.value })}
                  />
                  <Input
                    label="Lokasi Baru (Opsional)"
                    placeholder="Lokasi baru jika ada..."
                    value={form.lokasi_baru}
                    onChange={e => setForm({ ...form, lokasi_baru: e.target.value })}
                  />
                </div>
              </div>
            )}

            {/* 3. Dipinjam */}
            {form.jenis_aktivitas === 'Dipinjam' && (
              <div className="p-13 bg-blue-50/60 rounded-2xl border border-blue-100 space-y-13">
                <div className="flex items-center gap-8 text-blue-800 font-semibold text-xs">
                  <Calendar size={14} /> Detail Peminjaman
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-13">
                  <Input
                    label="Nama Peminjam / Staf"
                    placeholder="Masukkan nama peminjam..."
                    required
                    value={form.nama_staf}
                    onChange={e => setForm({ ...form, nama_staf: e.target.value })}
                  />
                  <Input
                    label="Rencana Tanggal Kembali"
                    type="date"
                    required
                    value={form.tanggal_rencana_kembali}
                    onChange={e => setForm({ ...form, tanggal_rencana_kembali: e.target.value })}
                  />
                </div>
              </div>
            )}

            {/* 4. Dikembalikan */}
            {form.jenis_aktivitas === 'Dikembalikan' && (
              <div className="p-13 bg-emerald-50 rounded-2xl border border-emerald-100 text-xs text-emerald-800 font-medium">
                Aset akan ditandai kembali ke lokasi/penanggung jawab awal.
              </div>
            )}

            <Input
              label="Keterangan"
              placeholder="Catatan tambahan (opsional)..."
              value={form.keterangan}
              onChange={e => setForm({ ...form, keterangan: e.target.value })}
            />

            <div className="flex justify-end gap-8 pt-5">
              <Button type="button" variant="ghost" size="sm" onClick={closeForm}>Batal</Button>
              <Button type="submit" size="sm">Simpan</Button>
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
        <div className="grid grid-cols-2 gap-8">
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
      ) : (
        <div className="space-y-21">
          <Table headers={['Tanggal', 'Aset', 'Jenis / Status', 'Penanggung Jawab', 'Rencana Kembali', 'Keterangan', 'Aksi']}>
            {paged.map(a => {
              const status = parseStatus(a.keterangan);
              return (
                <tr key={a.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-13 py-13 text-xs text-slate-500 whitespace-nowrap">{a.tanggal}</td>
                  <td className="px-13 py-13 text-sm font-semibold text-slate-700">{getAsetName(a.id_aset)}</td>
                  <td className="px-13 py-13">
                    <div className="flex flex-col gap-3 items-start">
                      <span className={`text-[10px] font-bold px-5 py-2 rounded-md ${a.jenis_aktivitas === 'Dipinjam' ? 'bg-blue-50 text-blue-600' :
                          a.jenis_aktivitas === 'Dikembalikan' ? 'bg-emerald-50 text-emerald-600' :
                            a.jenis_aktivitas === 'Mutasi Penanggung Jawab' ? 'bg-purple-50 text-purple-600' :
                              a.jenis_aktivitas === 'Dipindahkan' ? 'bg-teal-50 text-teal-600' :
                                'bg-slate-100 text-slate-600'
                        }`}>
                        {a.jenis_aktivitas}
                      </span>
                      {status && (
                        <span className={`text-[9px] font-black px-5 py-2 rounded uppercase tracking-wider ${status === 'Pending' ? 'bg-amber-100 text-amber-700' :
                            status === 'Disetujui' || status === 'Dikembalikan' || status === 'Selesai' ? 'bg-green-100 text-green-700' :
                              'bg-red-100 text-red-700'
                          }`}>
                          {status}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-13 py-13 text-xs text-slate-600 font-medium">
                    {a.nama_staf || '-'}
                  </td>
                  <td className="px-13 py-13 text-xs text-slate-500 whitespace-nowrap">
                    {a.jenis_aktivitas === 'Dipinjam'
                      ? (a.tanggal_rencana_kembali || '-')
                      : <span className="text-slate-300">—</span>
                    }
                  </td>
                  <td className="px-13 py-13 text-xs text-slate-500 max-w-[180px] truncate">{getCleanKeterangan(a.keterangan)}</td>
                  <td className="px-13 py-13">
                    <div className="flex items-center gap-8">
                      {/* Action Buttons */}
                      {status === 'Pending' && (
                        <div className="flex gap-5">
                          <button onClick={() => handleUpdateStatus(a, 'Setujui')} className="text-[10px] font-bold px-5 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors">✓ Setujui</button>
                          <button onClick={() => handleUpdateStatus(a, 'Tolak')} className="text-[10px] font-bold px-5 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors">✕ Tolak</button>
                        </div>
                      )}
                      {status === 'Disetujui' && (
                        <button onClick={() => handleUpdateStatus(a, 'Kembalikan')} className="text-[10px] font-bold px-5 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">Selesaikan / Kembalikan</button>
                      )}

                      <div className="flex gap-5 items-center ml-auto shrink-0">
                        <button onClick={() => handleEdit(a)}
                          className="w-21 h-21 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center hover:bg-teal-100 transition-colors" title="Edit">
                          <Pencil size={12} />
                        </button>
                        <button onClick={() => handleDelete(a)}
                          className="w-21 h-21 rounded-lg bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-100 transition-colors" title="Hapus">
                          <Trash2 size={12} />
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