import { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { Plus, Download, Pencil, Trash2, Search, Wrench, ShieldCheck, Gauge, Clock, LayoutGrid, List, FileText, X, ExternalLink, User } from 'lucide-react';
import useHartaBendaStore from '../../store/HartaBenda/useHartaBendaStore';
import { Card } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { Table } from '../../components/ui/Table';
import { Input, Select } from '../../components/ui/Input';
import SearchableSelect from '../../components/ui/SearchableSelect';
import Pagination from '../../components/ui/Pagination';
import { cn } from '../../utils/cn';
import { supabase } from '../../lib/supabase';
import { formatNamaAset } from '../../utils/assetHelpers';

const EMPTY = {
  id_aset: '',
  kategori_biaya: 'Perbaikan',
  km_saat_servis: '',
  total_biaya: '',
  tanggal: new Date().toISOString().split('T')[0],
  keterangan: '',
  kondisi_setelah_perawatan: 'Baik',
  pelaksana: '',
  bukti_kwitansi_url: '',
};

function PerawatanCard({ item, asetObj, formatRupiah, onEdit, onDelete, onViewDetail, statusBadgeStyle }) {
  const isServisRutin = item.kategori_biaya === 'Servis Rutin';
  const kondisiAset = item.kondisi_setelah_perawatan || asetObj?.status_kondisi || 'Baik';
  
  return (
    <div className="bg-white p-13 lg:p-0 rounded-2xl border border-slate-100 shadow-sm flex flex-row lg:flex-col items-center lg:items-stretch gap-13 lg:gap-0 overflow-hidden group hover:border-slate-200 transition-colors">
      <div 
        className={cn(
          "w-34 h-34 lg:w-full lg:h-48 rounded-xl lg:rounded-t-2xl flex items-center justify-center flex-shrink-0 transition-colors relative bg-slate-50 overflow-hidden",
          !asetObj?.foto_url && (isServisRutin ? "bg-teal-50 text-teal-600" : "bg-rose-50 text-rose-600"),
          "cursor-pointer"
        )}
        onClick={onViewDetail}
      >
        {asetObj?.foto_url ? (
          <img src={asetObj.foto_url} alt="Aset" className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <Wrench size={24} strokeWidth={2} className="lg:w-8 lg:h-8 opacity-50" />
        )}
        <span className={cn("absolute top-3 right-3 hidden lg:block text-[9px] font-bold px-2 py-1 rounded shadow-sm border", isServisRutin ? 'bg-teal-50 text-teal-700 border-teal-100' : 'bg-rose-50 text-rose-600 border-rose-100')}>
          {item.kategori_biaya}
        </span>
      </div>
      
      <div className="flex-1 min-w-0 flex flex-col justify-between lg:p-13 w-full h-full py-2 lg:py-0">
        
        {/* Judul Aset (Full Width, Bold) */}
        <h3 className="text-[10px] lg:text-xs font-bold text-slate-800 uppercase tracking-wide line-clamp-2 leading-snug w-full">
          {formatNamaAset(asetObj) || 'Aset Tidak Ditemukan'}
        </h3>
        
        {/* Deskripsi (Muted, max 2 baris) */}
        <p className="text-[9px] lg:text-[10px] text-slate-500 mt-2 line-clamp-2 min-h-[2.5rem]">
          {item.keterangan || 'Tidak ada deskripsi pekerjaan.'}
        </p>

        {/* Badge Kondisi */}
        <div className="mt-2">
           <span className={cn('text-[9px] font-bold px-2 py-0.5 rounded border inline-block', statusBadgeStyle(kondisiAset))}>
             {kondisiAset}
           </span>
        </div>
        
        {/* Biaya Perawatan */}
        <div className="mt-3 text-xs lg:text-sm">
           <span className="text-[9px] lg:text-[10px] font-semibold text-slate-400">Biaya: </span>
           <span className="font-bold text-emerald-700">{formatRupiah(item.total_biaya)}</span>
        </div>
        
        {/* Footer (Tanggal, Pelaksana, Tombol) */}
        <div className="mt-auto flex justify-between items-end">
          <div className="flex flex-row lg:flex-col items-center lg:items-start gap-8 lg:gap-3 mt-5 lg:mt-6 pt-3 lg:pt-5 border-t border-slate-50 lg:border-slate-100 text-[9px] lg:text-[10px] font-medium text-slate-500 w-full">
            <span className="truncate">
              {item.tanggal}
            </span>
            <span className="truncate">
              {item.pelaksana || 'Tanpa Pelaksana'}
            </span>
          </div>

          <div className="flex gap-5 mt-5 lg:mt-6 pt-3 lg:pt-5 shrink-0 border-t border-slate-50 lg:border-slate-100">
            {item.bukti_kwitansi_url && (
              <button 
                onClick={onViewDetail}
                className="text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors p-5 flex items-center justify-center" 
                title="Lihat Bukti Kwitansi"
              >
                <FileText size={13} strokeWidth={2.5} />
              </button>
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

export default function Perawatan() {
  const { aset, logPerawatan, addPerawatan, updatePerawatan, deletePerawatan, fetchDataHartaBenda } = useHartaBendaStore();

  const dataAsetAman = aset || [];

  const [open, setOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedDetail, setSelectedDetail] = useState(null);
  const [viewMode, setViewMode] = useState('card');
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [buktiKwitansiFile, setBuktiKwitansiFile] = useState(null);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    if (selectedDetail) setImgError(false);
  }, [selectedDetail]);

  const [filterText, setFilterText] = useState('');
  const [filterKategori, setFilterKategori] = useState('');
  const [filterDate, setFilterDate] = useState('');

  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  useEffect(() => { setCurrentPage(1); }, [filterText, filterKategori, filterDate]);

  // Options unit spesifik: Nama Aset - NUP - Lokasi
  const asetOptions = dataAsetAman.map(a => ({
    label: `${a.nama_aset} - NUP ${a.nup || '-'} - ${a.lokasi_ruangan || '-'}`,
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

  const closeForm = () => { setOpen(false); setEditId(null); setForm(EMPTY); setBuktiKwitansiFile(null); };

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

    // Upload Kwitansi jika ada file baru
    let uploadedUrl = form.bukti_kwitansi_url;
    if (buktiKwitansiFile) {
      const fileExt = buktiKwitansiFile.name.split('.').pop();
      const fileName = `kwitansi_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('images')
        .upload(`perawatan/${fileName}`, buktiKwitansiFile);

      if (uploadError) {
        alert('Gagal mengupload lampiran. Error: ' + uploadError.message);
      } else if (uploadData) {
        const { data: urlData } = supabase.storage.from('images').getPublicUrl(`perawatan/${fileName}`);
        uploadedUrl = urlData?.publicUrl || '';
      }
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
      pelaksana: form.pelaksana || '',
      kondisi_setelah_perawatan: form.kondisi_setelah_perawatan || 'Baik',
      bukti_kwitansi_url: uploadedUrl || '',
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
      kondisi_setelah_perawatan: item.kondisi_setelah_perawatan || 'Baik',
      pelaksana: item.pelaksana || '',
      bukti_kwitansi_url: item.bukti_kwitansi_url || '',
    });
    setBuktiKwitansiFile(null);
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
        return 'bg-sky-50 text-teal-700 border-teal-200';
      case 'Dihentikan':
        return 'bg-slate-100 text-slate-600 border-slate-200';
      default:
        return 'bg-slate-50 text-slate-600 border-slate-200';
    }
  };

  return (
    <div className="space-y-21">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
        <div>
          <h1 className="text-xl font-black text-slate-800 tracking-tight">Perawatan &amp; Biaya Aset</h1>
          <p className="text-xs text-slate-400 mt-2">
            {filtered.length} catatan · Total Biaya: <span className="font-bold text-emerald-600">{formatRupiah(totalBiaya)}</span>
          </p>
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
        <Card className="border-teal-200 bg-teal-50/30 p-21">
          <div className="flex items-center justify-between mb-13">
            <p className="text-base font-bold text-slate-800 flex items-center gap-3">
              <Wrench size={18} className="text-teal-600" />
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
              <div className="bg-teal-50/80 border border-teal-200/90 rounded-2xl p-13 space-y-13 animate-in fade-in duration-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
                  <p className="text-xs font-bold text-teal-800 flex items-center gap-2">
                    <Gauge size={16} className="text-teal-600" /> Servis Berbasis Kilometer (KM)
                  </p>
                  {(selectedAset.no_polisi || selectedAset.nomor_seri_plat) && (
                    <span className="text-[10px] font-mono font-bold bg-white text-teal-700 px-8 py-3 rounded-md border border-teal-200 shadow-xs">
                      Plat / No. Seri: {selectedAset.no_polisi || selectedAset.nomor_seri_plat}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-13 text-xs">
                  <div className="bg-white p-13 rounded-xl border border-teal-100 flex flex-col justify-between">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">KM Terakhir Tercatat</span>
                    <span className="text-sm font-mono font-black text-slate-800 mt-1">{selectedAset.km_saat_ini || 0} KM</span>
                  </div>

                  <div className="bg-white p-13 rounded-xl border border-teal-100 flex flex-col justify-between">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Interval Servis Rutin</span>
                    <span className="text-sm font-mono font-black text-teal-700 mt-1">{selectedAset.interval_km || 5000} KM</span>
                  </div>

                  <div className="bg-white p-13 rounded-xl border border-teal-100 flex flex-col justify-between">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Target KM Servis Berikutnya</span>
                    <span className="text-sm font-mono font-black text-emerald-600 mt-1">
                      {Number(form.km_saat_servis || selectedAset.km_saat_ini || 0) + Number(selectedAset.interval_km || 5000)} KM
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Baris 2: Jenis Perawatan & Kondisi Aset Setelah Perawatan */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-13">
              <Select
                label="Jenis Perawatan"
                required
                options={jenisPerawatanOptions}
                value={form.kategori_biaya}
                onChange={e => setForm({ ...form, kategori_biaya: e.target.value })}
              />
              <Select
                label="Kondisi Aset Setelah Perawatan"
                required
                options={[
                  { value: 'Baik', label: 'Baik' },
                  { value: 'Rusak Ringan', label: 'Rusak Ringan' },
                  { value: 'Rusak Berat', label: 'Rusak Berat' },
                ]}
                value={form.kondisi_setelah_perawatan}
                onChange={e => setForm({ ...form, kondisi_setelah_perawatan: e.target.value })}
              />
            </div>

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

            {/* Baris 3: Biaya (Rp) & Tanggal */}
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

            {/* Baris 4: Pelaksana */}
            <div className="w-full">
              <Input
                label="Pelaksana / Vendor / Teknisi"
                placeholder="Contoh: Teknisi Internal / PT. Bengkel Maju"
                value={form.pelaksana}
                onChange={e => setForm({ ...form, pelaksana: e.target.value })}
              />
            </div>

            {/* Baris 5: Keterangan / Deskripsi */}
            <div className="w-full">
              <Input
                label="Keterangan / Deskripsi Pekerjaan"
                placeholder="Deskripsikan pekerjaan yang dilakukan secara detail..."
                required
                value={form.keterangan}
                onChange={e => setForm({ ...form, keterangan: e.target.value })}
              />
            </div>

            {/* Baris 6: Upload Bukti Kwitansi */}
            <div className="flex flex-col gap-5 w-full">
              <label className="text-xs font-semibold text-slate-500 tracking-wide uppercase">
                Bukti Kwitansi / Lampiran (Opsional)
              </label>
              <input
                type="file"
                accept="image/*,.pdf"
                className="w-full text-sm text-slate-500 file:mr-13 file:py-5 file:px-13 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 cursor-pointer"
                onChange={e => {
                  const f = e.target.files?.[0];
                  if (f) {
                    setBuktiKwitansiFile(f);
                    setForm({ ...form, bukti_kwitansi_url: f.name });
                  }
                }}
              />
              {form.bukti_kwitansi_url && (
                <p className="text-[10px] text-teal-600 mt-2">File tersimpan: {form.bukti_kwitansi_url}</p>
              )}
            </div>

            <div className="flex justify-end gap-8 pt-5">
              <Button type="button" variant="ghost" size="sm" onClick={closeForm}>
                Batal
              </Button>
              <Button type="submit" size="sm">
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
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
        <div className="flex flex-col items-center justify-center py-13 text-slate-400 bg-slate-50/60 rounded-xl border border-slate-100 border-dashed">
          <Wrench size={20} className="mb-3 text-slate-300" />
          <p className="text-[11px] font-medium">Belum ada catatan perawatan aset.</p>
        </div>
      ) : viewMode === 'card' ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-13 lg:gap-21">
            {paged.map(p => {
              const asetObj = getAsetObject(p.id_aset);
              return (
                <PerawatanCard
                  key={p.id}
                  item={p}
                  asetObj={asetObj}
                  formatRupiah={formatRupiah}
                  onEdit={() => handleEdit(p)}
                  onDelete={() => handleDelete(p)}
                  onViewDetail={() => { setSelectedDetail(p); setDetailModalOpen(true); }}
                  statusBadgeStyle={statusBadgeStyle}
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
          <Table headers={['Tanggal', 'Unit Aset & Lokasi', 'Jenis Perawatan', 'Total Biaya', 'Kondisi Aset', 'Keterangan', 'Aksi']}>
            {paged.map(p => {
              const asetObj = getAsetObject(p.id_aset);
              const kondisiAset = p.kondisi_setelah_perawatan || asetObj?.status_kondisi || 'Baik';
              return (
                <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-13 py-13 text-xs text-slate-500 whitespace-nowrap">{p.tanggal}</td>
                  <td className="px-13 py-13">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-slate-800">{formatNamaAset(asetObj) || 'Aset Tidak Ditemukan'}</span>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="font-mono text-[10px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-100/60">
                          {asetObj?.kode_aset || '—'}
                        </span>
                        <span className="text-[10px] font-medium text-slate-400">
                          {asetObj?.lokasi_ruangan || '-'}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-13 py-13">
                    <span className={cn(
                      'text-[10px] font-bold px-8 py-3 rounded-md inline-block',
                      p.kategori_biaya === 'Servis Rutin' ? 'bg-teal-50 text-teal-700' : 'bg-rose-50 text-rose-600'
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
                    <div className="flex items-center gap-5 justify-center">
                      {p.bukti_kwitansi_url && (
                        <button
                          onClick={() => { setSelectedDetail(p); setDetailModalOpen(true); }}
                          className="w-21 h-21 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center hover:bg-blue-100 transition-colors"
                          title="Lihat Detail/Kwitansi"
                        >
                          <FileText size={12} strokeWidth={2.5} />
                        </button>
                      )}
                      <button
                        onClick={() => handleEdit(p)}
                        className="w-21 h-21 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center hover:bg-teal-100 transition-colors"
                        title="Edit"
                      >
                        <Pencil size={12} strokeWidth={2.5} />
                      </button>
                      <button
                        onClick={() => handleDelete(p)}
                        className="w-21 h-21 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center hover:bg-rose-100 transition-colors"
                        title="Hapus"
                      >
                        <Trash2 size={12} strokeWidth={2.5} />
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

      {/* Modal Detail Perawatan */}
      {detailModalOpen && selectedDetail && (
        <div className="fixed inset-0 z-[8000] flex items-center justify-center p-4">
          <div 
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
            onClick={() => setDetailModalOpen(false)}
          />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col animate-in fade-in zoom-in duration-200 overflow-hidden z-10">
            <div className="flex items-center justify-between px-6 pt-7 pb-5 border-b border-slate-100 bg-slate-50">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-3.5">
                <FileText size={18} className="text-teal-600 shrink-0" />
                <span>Detail Riwayat Perawatan Harta Benda</span>
              </h3>
              <button onClick={() => setDetailModalOpen(false)} className="text-slate-400 hover:text-rose-500 transition-colors p-1">
                <X size={20} />
              </button>
            </div>
            
            <div className="pl-6 py-6 pr-4 overflow-y-auto custom-scrollbar flex-1 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-y-5 gap-x-8">
                {/* Aset Info - Full Width */}
                <div className="col-span-1 md:col-span-2">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Aset yang Dirawat</p>
                  <p className="text-sm font-semibold text-slate-800">{formatNamaAset(getAsetObject(selectedDetail.id_aset))}</p>
                  <p className="text-xs text-slate-500 mt-1 font-mono">{getAsetObject(selectedDetail.id_aset)?.kode_aset}</p>
                </div>
                
                {/* Jenis & Kondisi */}
                <div className="col-span-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Jenis & Kondisi</p>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold px-2 py-1 rounded bg-slate-100 text-slate-700">
                      {selectedDetail.kategori_biaya}
                    </span>
                    <span className={cn("text-xs font-semibold px-2 py-1 rounded border border-slate-200", statusBadgeStyle(selectedDetail.kondisi_setelah_perawatan || 'Baik'))}>
                      {selectedDetail.kondisi_setelah_perawatan || 'Baik'}
                    </span>
                  </div>
                </div>
                
                {/* Tanggal & Pelaksana */}
                <div className="col-span-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Tanggal & Pelaksana</p>
                  <p className="text-xs font-bold text-slate-800">{selectedDetail.tanggal}</p>
                  {selectedDetail.pelaksana ? (
                    <p className="text-xs text-slate-500 mt-0.5">{selectedDetail.pelaksana}</p>
                  ) : (
                    <p className="text-xs text-slate-400 italic mt-0.5">Tanpa Pelaksana</p>
                  )}
                </div>

                {/* Deskripsi */}
                <div className="col-span-1 md:col-span-2 mt-2 border-t border-slate-100 pt-4">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Deskripsi Pekerjaan</p>
                  <p className="text-xs text-slate-600 min-h-[2rem]">
                    {selectedDetail.keterangan || '-'}
                  </p>
                </div>
                
                {/* Total Biaya */}
                <div className="col-span-1 md:col-span-2 border-t border-slate-100 pt-4">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Total Biaya Perawatan</p>
                  <p className="text-base font-black text-emerald-600">{formatRupiah(selectedDetail.total_biaya)}</p>
                </div>
                
                {/* Kwitansi */}
                <div className="col-span-1 md:col-span-2 border-t border-slate-100 pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Bukti Kwitansi / Lampiran</p>
                    {selectedDetail.bukti_kwitansi_url && (selectedDetail.bukti_kwitansi_url.startsWith('http') || selectedDetail.bukti_kwitansi_url.startsWith('blob:') || selectedDetail.bukti_kwitansi_url.startsWith('data:')) && (
                      <a href={selectedDetail.bukti_kwitansi_url} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-[10px] font-bold text-blue-600 hover:text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md transition-colors">
                        <ExternalLink size={12} strokeWidth={2.5} /> Buka File Asli
                      </a>
                    )}
                  </div>
                  
                  {(() => {
                    const url = selectedDetail.bukti_kwitansi_url;
                    if (!url) {
                      // EMPTY STATE
                      return (
                        <div className="rounded-xl border border-slate-200 border-dashed bg-slate-50 flex flex-col items-center justify-center py-6 text-slate-400">
                          <FileText size={24} className="mb-2 text-slate-300" strokeWidth={1.5} />
                          <p className="text-[10px] font-semibold text-slate-500">Belum ada lampiran kwitansi.</p>
                        </div>
                      );
                    }

                    const isValidUrl = url.startsWith('http') || url.startsWith('blob:') || url.startsWith('data:');
                    
                    if (!isValidUrl || imgError) {
                      // ERROR STATE
                      return (
                        <div className="rounded-xl border border-rose-100 border-dashed bg-rose-50/50 flex flex-col items-center justify-center py-6 text-rose-500">
                          <FileText size={24} className="mb-2 text-rose-300 opacity-80" strokeWidth={1.5} />
                          <p className="text-[10px] font-semibold text-rose-600">File gagal dimuat (Tautan Rusak)</p>
                          <button 
                            onClick={() => { setDetailModalOpen(false); handleEdit(selectedDetail); }} 
                            className="mt-2 text-[9px] font-bold text-rose-700 bg-rose-100 px-3 py-1.5 rounded-md hover:bg-rose-200 transition-colors"
                          >
                            Unggah Ulang Kwitansi
                          </button>
                        </div>
                      );
                    }

                    const isImage = url.match(/\.(jpeg|jpg|gif|png|webp)$/i) || url.startsWith('blob:') || url.startsWith('data:image');

                    if (isImage) {
                      // IMAGE PREVIEW
                      return (
                        <div className="rounded-xl border border-slate-200 overflow-hidden bg-slate-50 flex items-center justify-center p-4 py-6 max-h-[300px]">
                          <img 
                            src={url} 
                            alt="Kwitansi" 
                            className="max-w-full max-h-full object-contain rounded"
                            onError={() => setImgError(true)} 
                          />
                        </div>
                      );
                    }

                    // PDF / DOCUMENT STATE
                    return (
                      <div className="rounded-xl border border-slate-200 border-dashed bg-slate-50 flex flex-col items-center justify-center py-6 text-slate-500">
                        <FileText size={28} className="mb-2 text-slate-300" strokeWidth={1.5} />
                        <p className="text-xs font-bold text-slate-600">Lampiran berupa dokumen/PDF</p>
                        <a 
                          href={url} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="mt-2 text-[10px] font-bold text-blue-600 hover:text-blue-700 bg-blue-50 px-3 py-1.5 rounded-md transition-colors"
                        >
                          Lihat Dokumen Kwitansi (PDF)
                        </a>
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
          </div>
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