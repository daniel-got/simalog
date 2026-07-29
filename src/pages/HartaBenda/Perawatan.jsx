import { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { Plus, Download, Pencil, Trash2, Search, Wrench, ShieldCheck, Gauge, Clock } from 'lucide-react';
import useHartaBendaStore from '../../store/HartaBenda/useHartaBendaStore';
import { Card } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { Table } from '../../components/ui/Table';
import { Input, Select } from '../../components/ui/Input';
import SearchableSelect from '../../components/ui/SearchableSelect';
import Pagination from '../../components/ui/Pagination';
import { cn } from '../../utils/cn';
import { supabase } from '../../lib/supabase';

const EMPTY = {
  id_aset: '',
  kategori_biaya: 'Perbaikan',
  km_saat_servis: '',
  total_biaya: '',
  tanggal: new Date().toISOString().split('T')[0],
  keterangan: '',
};

export default function Perawatan() {
  const { aset, logPerawatan, addPerawatan, updatePerawatan, deletePerawatan, fetchDataHartaBenda } = useHartaBendaStore();

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

  // Options unit spesifik: {nama_aset} ({kode_aset})
  const asetOptions = dataAsetAman.map(a => ({
    label: `${a.nama_aset} (${a.kode_aset || a.id})`,
    value: String(a.id),
  }));

  // Aset yang saat ini dipilih pada form
  const selectedAset = dataAsetAman.find(a => String(a.id) === String(form.id_aset));
  const selectedMaintenanceType = selectedAset?.sub_kelompok?.maintenance_type || selectedAset?.maintenance_type || 'tidak';
  const isServisRutinAllowed = selectedMaintenanceType !== 'tidak' && selectedMaintenanceType !== null;

  // Opsi Jenis Perawatan (Dinamis berdasarkan unit aset yang dipilih)
  const jenisPerawatanOptions = isServisRutinAllowed
    ? [
      { label: 'Perbaikan (karena rusak)', value: 'Perbaikan' },
      { label: 'Servis rutin (preventif)', value: 'Servis Rutin' },
    ]
    : [
      { label: 'Perbaikan (karena rusak)', value: 'Perbaikan' },
    ];

  const getAsetObject = (idAset) => dataAsetAman.find(a => String(a.id) === String(idAset));
  const getAsetName = (idAset) => getAsetObject(idAset)?.nama_aset || '-';

  const formatRupiah = (n) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n || 0);

  const closeForm = () => { setOpen(false); setEditId(null); setForm(EMPTY); };

  // Handler saat unit aset dipilih di dropdown
  const handleAsetSelect = (e) => {
    const selectedId = e.target.value;
    const targetAset = dataAsetAman.find(a => String(a.id) === String(selectedId));
    const mType = targetAset?.sub_kelompok?.maintenance_type || targetAset?.maintenance_type || 'tidak';

    setForm(f => {
      let newKategori = f.kategori_biaya;
      if (mType === 'tidak' && newKategori === 'Servis Rutin') {
        newKategori = 'Perbaikan';
      }
      return {
        ...f,
        id_aset: selectedId,
        kategori_biaya: newKategori || 'Perbaikan',
        km_saat_servis: targetAset?.km_saat_ini || '',
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.id_aset) {
      alert('Silakan pilih unit aset terlebih dahulu.');
      return;
    }

    if (!form.kategori_biaya) {
      alert('Silakan pilih jenis perawatan.');
      return;
    }

    if (form.kategori_biaya === 'Servis Rutin' && selectedMaintenanceType === 'km' && (!form.km_saat_servis || Number(form.km_saat_servis) < 0)) {
      alert('Nilai KM saat servis wajib diisi!');
      return;
    }

    // Payload untuk insert/update log_perawatan_aset
    const logPayload = {
      id_aset: form.id_aset,
      kategori_biaya: form.kategori_biaya,
      total_biaya: Number(form.total_biaya || 0),
      tanggal: form.tanggal || new Date().toISOString().split('T')[0],
      keterangan: form.kategori_biaya === 'Servis Rutin' && selectedMaintenanceType === 'km' && form.km_saat_servis
        ? `[KM Servis: ${form.km_saat_servis}] ${form.keterangan || ''}`.trim()
        : (form.keterangan || ''),
    };

    let ok;
    if (editId) {
      ok = await updatePerawatan(editId, logPayload);
    } else {
      ok = await addPerawatan(logPayload);
    }

    if (ok) {
      // ── Otomatis Update Tabel Assets ──────────────────────────────────
      // a. Update status_kondisi menjadi "Baik"
      const assetUpdateData = {
        status_kondisi: 'Baik',
      };

      // b. Jika Servis Rutin & maintenance_type = 'km' -> update km_saat_ini
      if (form.kategori_biaya === 'Servis Rutin' && selectedMaintenanceType === 'km' && form.km_saat_servis) {
        assetUpdateData.km_saat_ini = Number(form.km_saat_servis);
      }

      // c. Jika Servis Rutin & maintenance_type = 'bulan' -> update tanggal_servis_terakhir
      if (form.kategori_biaya === 'Servis Rutin' && selectedMaintenanceType === 'bulan') {
        assetUpdateData.tanggal_servis_terakhir = form.tanggal || new Date().toISOString().split('T')[0];
      }

      try {
        const { error: updateErr } = await supabase
          .from('assets')
          .update(assetUpdateData)
          .eq('id', form.id_aset);

        if (updateErr) {
          console.error('Update asset status error:', updateErr);
        }
      } catch (err) {
        console.error('Update asset status catch error:', err);
      }

      await fetchDataHartaBenda();
      closeForm();
    }
  };

  const handleEdit = (item) => {
    const kmMatch = item.keterangan?.match(/\[KM Servis:\s*(\d+)\]/);
    const kmValue = kmMatch ? kmMatch[1] : '';
    const cleanKet = item.keterangan ? item.keterangan.replace(/\[KM Servis:\s*\d+\]\s*/, '') : '';

    setForm({
      id_aset: String(item.id_aset || ''),
      kategori_biaya: item.kategori_biaya || 'Perbaikan',
      km_saat_servis: kmValue,
      total_biaya: item.total_biaya || '',
      tanggal: item.tanggal || new Date().toISOString().split('T')[0],
      keterangan: cleanKet,
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
      Kode_Aset: getAsetObject(p.id_aset)?.kode_aset || '-',
      Lokasi: getAsetObject(p.id_aset)?.lokasi_ruangan || '-',
      Jenis_Perawatan: p.kategori_biaya,
      Total_Biaya: p.total_biaya,
      Keterangan: p.keterangan,
    }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(exportData), 'Perawatan');
    XLSX.writeFile(wb, 'Log_Perawatan_Aset.xlsx');
  };

  const filtered = (logPerawatan || []).filter(p => {
    const targetAset = getAsetObject(p.id_aset);
    const textSearch = (
      (targetAset?.nama_aset || '') +
      (targetAset?.kode_aset || '') +
      (targetAset?.lokasi_ruangan || '') +
      (p.keterangan || '') +
      (p.kategori_biaya || '')
    ).toLowerCase();

    const matchText = textSearch.includes(filterText.toLowerCase());
    const matchKat = filterKategori ? p.kategori_biaya === filterKategori : true;
    const matchDate = filterDate ? p.tanggal === filterDate : true;
    return matchText && matchKat && matchDate;
  });

  const totalBiaya = filtered.reduce((sum, p) => sum + (p.total_biaya || 0), 0);
  const paged = filtered.slice((currentPage - 1) * perPage, currentPage * perPage);

  const statusBadgeStyle = (status) => {
    switch (status) {
      case 'Baik':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Rusak Ringan':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Rusak Berat':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'Dalam Perbaikan':
        return 'bg-sky-50 text-sky-700 border-sky-200';
      case 'Dihentikan':
        return 'bg-slate-100 text-slate-600 border-slate-200';
      default:
        return 'bg-slate-50 text-slate-600 border-slate-200';
    }
  };

  return (
    <div className="space-y-21">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-slate-800 tracking-tight">Perawatan &amp; Biaya Aset</h1>
          <p className="text-xs text-slate-400 mt-2">
            {filtered.length} catatan · Total Biaya: <span className="font-bold text-emerald-600">{formatRupiah(totalBiaya)}</span>
          </p>
        </div>
        <div className="flex gap-8">
          <Button variant="ghost" size="icon" onClick={handleExport} title="Export Excel">
            <Download size={16} />
          </Button>
          <Button
            size="sm"
            onClick={() => { setEditId(null); setForm(EMPTY); setOpen(true); }}
            className="bg-teal-600 hover:bg-teal-700 shadow-teal-500/20 text-white"
          >
            <Plus size={15} /> Catat Perawatan
          </Button>
        </div>
      </div>

      {/* Form Catat Perawatan / Biaya */}
      {open && (
        <Card className="border-orange-200 bg-orange-50/30 p-21">
          <div className="flex items-center justify-between mb-13">
            <p className="text-base font-bold text-slate-800 flex items-center gap-2">
              <Wrench size={18} className="text-orange-600" />
              Catat Biaya Perawatan
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-13">
            {/* Field 1: Pilih Aset */}
            <SearchableSelect
              label="Aset"
              required
              options={asetOptions}
              value={form.id_aset}
              onChange={handleAsetSelect}
            />

            {/* Kartu Informasi Servis Berbasis Kilometer (KM) ketika kendaraan/aset KM dipilih */}
            {selectedAset && selectedMaintenanceType === 'km' && (
              <div className="bg-sky-50/80 border border-sky-200/90 rounded-2xl p-13 space-y-13 animate-in fade-in duration-200">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-sky-800 flex items-center gap-2">
                    <Gauge size={16} className="text-sky-600" /> Servis Berbasis Kilometer (KM)
                  </p>
                  {(selectedAset.no_polisi || selectedAset.nomor_seri_plat) && (
                    <span className="text-[10px] font-mono font-bold bg-white text-sky-700 px-8 py-3 rounded-md border border-sky-200 shadow-xs">
                      Plat / No. Seri: {selectedAset.no_polisi || selectedAset.nomor_seri_plat}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-13 text-xs">
                  <div className="bg-white p-13 rounded-xl border border-sky-100 flex flex-col justify-between">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">KM Terakhir Tercatat</span>
                    <span className="text-sm font-mono font-black text-slate-800 mt-1">{selectedAset.km_saat_ini || 0} KM</span>
                  </div>

                  <div className="bg-white p-13 rounded-xl border border-sky-100 flex flex-col justify-between">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Interval Servis Rutin</span>
                    <span className="text-sm font-mono font-black text-sky-700 mt-1">{selectedAset.interval_km || 5000} KM</span>
                  </div>

                  <div className="bg-white p-13 rounded-xl border border-sky-100 flex flex-col justify-between">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Target KM Servis Berikutnya</span>
                    <span className="text-sm font-mono font-black text-emerald-600 mt-1">
                      {Number(form.km_saat_servis || selectedAset.km_saat_ini || 0) + Number(selectedAset.interval_km || 5000)} KM
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Field 2 & 3: Jenis Perawatan & KM saat servis (jika berlaku) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-13">
              <Select
                label="Jenis Perawatan"
                required
                options={jenisPerawatanOptions}
                value={form.kategori_biaya}
                onChange={e => setForm({ ...form, kategori_biaya: e.target.value })}
              />

              {/* Field Tambahan "KM saat servis" (HANYA jika Jenis = Servis Rutin & maintenance_type = 'km') */}
              {form.kategori_biaya === 'Servis Rutin' && selectedMaintenanceType === 'km' && (
                <Input
                  label="KM saat servis"
                  type="number"
                  required
                  placeholder={selectedAset?.km_saat_ini ? String(selectedAset.km_saat_ini) : '0'}
                  value={form.km_saat_servis}
                  onChange={e => setForm({ ...form, km_saat_servis: e.target.value })}
                />
              )}
            </div>

            {/* Field 4 & 5: Biaya (Rp) & Tanggal */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-13">
              <Input
                label="Biaya (Rp)"
                type="number"
                required
                placeholder="Contoh: 150000"
                value={form.total_biaya}
                onChange={e => setForm({ ...form, total_biaya: e.target.value })}
              />
              <Input
                label="Tanggal Perawatan"
                type="date"
                required
                value={form.tanggal}
                onChange={e => setForm({ ...form, tanggal: e.target.value })}
              />
            </div>

            {/* Field 6: Keterangan */}
            <Input
              label="Keterangan"
              placeholder="Deskripsikan pekerjaan yang dilakukan..."
              value={form.keterangan}
              onChange={e => setForm({ ...form, keterangan: e.target.value })}
            />

            <div className="flex justify-end gap-8 pt-5">
              <Button type="button" variant="ghost" size="sm" onClick={closeForm}>
                Batal
              </Button>
              <Button type="submit" size="sm" className="bg-orange-600 hover:bg-orange-700 text-white shadow-sm">
                Simpan Catatan
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Baris Search & Filter */}
      <div className="bg-slate-50 p-13 rounded-2xl border border-slate-100 shadow-sm space-y-8">
        <div className="relative">
          <Search size={14} className="absolute left-13 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari unit aset, kode, lokasi, atau keterangan..."
            value={filterText}
            onChange={e => setFilterText(e.target.value)}
            className="w-full pl-34 pr-13 py-8 text-xs bg-white border border-slate-200 rounded-xl focus:border-teal-500 focus:ring-2 focus:ring-teal-100 outline-none transition-all"
          />
        </div>
        <div className="grid grid-cols-2 gap-8">
          <select
            className="w-full px-8 py-8 text-[10px] bg-white border border-slate-200 rounded-xl focus:border-teal-500 focus:ring-2 focus:ring-teal-100 outline-none transition-all text-slate-600 font-medium"
            value={filterKategori}
            onChange={e => setFilterKategori(e.target.value)}
          >
            <option value="">Semua Jenis Perawatan</option>
            <option value="Perbaikan">Perbaikan</option>
            <option value="Servis Rutin">Servis Rutin</option>
          </select>
          <input
            type="date"
            className="w-full px-8 py-8 text-[10px] bg-white border border-slate-200 rounded-xl focus:border-teal-500 focus:ring-2 focus:ring-teal-100 outline-none transition-all text-slate-600 font-medium"
            value={filterDate}
            onChange={e => setFilterDate(e.target.value)}
          />
        </div>
      </div>

      {/* Tabel Data Perawatan */}
      {filtered.length === 0 ? (
        <div className="text-center py-34 text-slate-400 text-sm bg-slate-50 rounded-2xl border border-slate-100 border-dashed">
          <Wrench size={28} className="mx-auto mb-5 text-slate-300" />
          Belum ada catatan perawatan aset.
        </div>
      ) : (
        <div className="space-y-21">
          <Table headers={['Tanggal', 'Unit Aset & Lokasi', 'Jenis Perawatan', 'Total Biaya', 'Kondisi Aset', 'Keterangan', 'Aksi']}>
            {paged.map(p => {
              const asetObj = getAsetObject(p.id_aset);
              const kondisiAset = asetObj?.status_kondisi || 'Baik';
              return (
                <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-13 py-13 text-xs text-slate-500 whitespace-nowrap">{p.tanggal}</td>
                  <td className="px-13 py-13">
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-slate-800">{getAsetName(p.id_aset)}</span>
                      <span className="text-[10px] font-mono text-slate-400 mt-0.5">
                        {asetObj?.kode_aset || '—'} · {asetObj?.lokasi_ruangan || '-'}
                      </span>
                    </div>
                  </td>
                  <td className="px-13 py-13">
                    <span className={cn(
                      'text-[10px] font-bold px-8 py-3 rounded-md inline-block',
                      p.kategori_biaya === 'Servis Rutin' ? 'bg-teal-50 text-teal-700' : 'bg-orange-50 text-orange-700'
                    )}>
                      {p.kategori_biaya}
                    </span>
                  </td>
                  <td className="px-13 py-13 font-mono text-xs font-bold text-emerald-600">
                    {formatRupiah(p.total_biaya)}
                  </td>
                  <td className="px-13 py-13">
                    <span className={cn('text-[10px] font-bold px-8 py-3 rounded-md border inline-block', statusBadgeStyle(kondisiAset))}>
                      {kondisiAset}
                    </span>
                  </td>
                  <td className="px-13 py-13 text-xs text-slate-500 max-w-[200px] truncate">
                    {p.keterangan || '-'}
                  </td>
                  <td className="px-13 py-13">
                    <div className="flex gap-5">
                      <button
                        onClick={() => handleEdit(p)}
                        className="w-26 h-26 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center hover:bg-teal-100 transition-colors"
                        title="Edit"
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        onClick={() => handleDelete(p)}
                        className="w-26 h-26 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center hover:bg-rose-100 transition-colors"
                        title="Hapus"
                      >
                        <Trash2 size={13} />
                      </button>
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

      {/* Modal Konfirmasi Hapus */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
            onClick={() => { setIsDeleteModalOpen(false); setItemToDelete(null); }}
          />
          <div className="relative bg-white rounded-3xl shadow-xl border border-slate-100 w-full max-w-md p-21 flex flex-col gap-13 z-10 animate-in fade-in zoom-in-95 duration-150 text-center items-center">
            <div className="mt-8">
              <h3 className="text-lg font-black text-slate-800 tracking-tight mb-8">Hapus Catatan Perawatan?</h3>
              <p className="text-xs text-slate-500 leading-relaxed max-w-sm">
                Yakin ingin menghapus catatan perawatan untuk aset <span className="font-bold text-slate-700">{getAsetName(itemToDelete?.id_aset)}</span>?
              </p>
            </div>
            <div className="flex items-center justify-center gap-8 mt-13 w-full">
              <button
                type="button"
                onClick={() => { setIsDeleteModalOpen(false); setItemToDelete(null); }}
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