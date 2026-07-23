import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import {
  Plus, Download, Pencil, Trash2, Search, Calendar,
  Shield, LayoutGrid, List, Image as ImageIcon, Settings2,
  X, Loader2, Info, Car, Clock, Paperclip, Eye,
  ChevronDown, Tag
} from 'lucide-react';
import useHartaBendaStore from '../../store/HartaBenda/useHartaBendaStore';
import useLogistikStore from '../../store/Logistik/useLogistikStore';
import { Card } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { Table } from '../../components/ui/Table';
import Pagination from '../../components/ui/Pagination';
import { supabase } from '../../lib/supabase';
import ModalKategoriAset from './ModalKategoriAset';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const KONDISI_OPTIONS = [
  { label: 'Baik', value: 'Baik' },
  { label: 'Rusak Ringan', value: 'Rusak Ringan' },
  { label: 'Rusak Berat', value: 'Rusak Berat' },
  { label: 'Dihapuskan', value: 'Dihapuskan' },
];

const EMPTY_FORM = {
  kelompok_id: '',
  sub_kelompok_id: '',
  nama_aset: '',
  merek_tipe: '',
  nomor_seri_plat: '',
  lokasi_ruangan: '',
  penanggung_jawab: '',
  tanggal_perolehan: new Date().toISOString().split('T')[0],
  harga_beli: '',
  status_kondisi: 'Baik',
  foto_url: '',
  lampiran_url: '',
  // km fields
  no_polisi: '',
  km_saat_ini: '',
  interval_km: '',
  // bulan fields
  interval_bulan: '',
  tanggal_servis_terakhir: '',
};

const kondisiBadge = (k) => {
  const map = {
    'Baik': 'bg-emerald-50 text-emerald-600',
    'Rusak Ringan': 'bg-amber-50 text-amber-600',
    'Rusak Berat': 'bg-red-50 text-red-600',
    'Dihapuskan': 'bg-slate-100 text-slate-500',
  };
  return map[k] || 'bg-slate-100 text-slate-500';
};

// ─── Komponen Input & Select internal (agar tidak bergantung pada props yg berbeda) ─
function FieldInput({ label, required, hint, className, ...props }) {
  return (
    <div className="flex flex-col gap-3 w-full">
      {label && (
        <label className="text-[10px] font-bold text-slate-500 tracking-widest uppercase flex items-center gap-3">
          {label}
          {required && <span className="text-red-400">*</span>}
          {hint && <span className="text-slate-400 font-medium normal-case tracking-normal">— {hint}</span>}
        </label>
      )}
      <input
        className={`w-full px-13 py-8 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 placeholder:text-slate-300 outline-none ring-0 transition-all focus:border-teal-500 focus:ring-2 focus:ring-teal-100 disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed ${className || ''}`}
        {...props}
      />
    </div>
  );
}

function FieldSelect({ label, required, children, ...props }) {
  return (
    <div className="flex flex-col gap-3 w-full">
      {label && (
        <label className="text-[10px] font-bold text-slate-500 tracking-widest uppercase flex items-center gap-3">
          {label}
          {required && <span className="text-red-400">*</span>}
        </label>
      )}
      <select
        className="w-full px-13 py-8 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 outline-none ring-0 transition-all focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
        {...props}
      >
        {children}
      </select>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function DaftarAset() {
  const navigate = useNavigate();
  const currentUser = useLogistikStore(s => s.currentUser);
  const isAdmin = currentUser?.role === 'Admin';

  const {
    daftarAset,
    kelompokAset,
    subKelompokAset,
    addAset,
    updateAset,
    deleteAset,
    fetchKelompokAset,
    fetchSubKelompokAset,
  } = useHartaBendaStore();

  // ── Modal State ──────────────────────────────────────────────────────────
  const [openForm, setOpenForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [showKategoriModal, setShowKategoriModal] = useState(false);

  // ── Upload State ─────────────────────────────────────────────────────────
  const [fotoFile, setFotoFile] = useState(null);
  const [lampiranFile, setLampiranFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  // ── Kode Aset Preview ────────────────────────────────────────────────────
  const [kodePreview, setKodePreview] = useState('');
  const [loadingKode, setLoadingKode] = useState(false);

  // ── Filter State ─────────────────────────────────────────────────────────
  const [filterText, setFilterText] = useState('');
  const [filterKelompok, setFilterKelompok] = useState('');
  const [filterKondisi, setFilterKondisi] = useState('');

  // ── Pagination & View ────────────────────────────────────────────────────
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [viewMode, setViewMode] = useState('list');

  // ── Delete Modal ─────────────────────────────────────────────────────────
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  // ── Reset page saat filter berubah ──────────────────────────────────────
  useEffect(() => { setCurrentPage(1); }, [filterText, filterKelompok, filterKondisi]);

  // ── Fetch kategori saat mount ────────────────────────────────────────────
  useEffect(() => {
    fetchKelompokAset();
    fetchSubKelompokAset();
  }, [fetchKelompokAset, fetchSubKelompokAset]);

  // ── Generate kode aset preview saat kelompok berubah ────────────────────
  useEffect(() => {
    if (!form.kelompok_id || editId) { setKodePreview(''); return; }
    const timer = setTimeout(async () => {
      setLoadingKode(true);
      try {
        const { data, error } = await supabase.rpc('generate_kode_aset', {
          p_kelompok_id: Number(form.kelompok_id),
        });
        setKodePreview(error ? '—' : (data || '—'));
      } catch {
        setKodePreview('—');
      } finally {
        setLoadingKode(false);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [form.kelompok_id, editId]);

  // ── Helpers ──────────────────────────────────────────────────────────────
  const formatRupiah = (n) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n || 0);

  const getSubKelompokFiltered = () =>
    subKelompokAset.filter(s => String(s.kelompok_id) === String(form.kelompok_id));

  const getMaintenanceType = () => {
    if (!form.sub_kelompok_id) return null;
    return subKelompokAset.find(s => String(s.id) === String(form.sub_kelompok_id))?.maintenance_type || null;
  };

  const closeForm = () => {
    setOpenForm(false);
    setEditId(null);
    setForm(EMPTY_FORM);
    setFotoFile(null);
    setLampiranFile(null);
    setKodePreview('');
  };

  // ── Upload helper ────────────────────────────────────────────────────────
  const uploadFile = async (file, folder = 'aset') => {
    const ext = file.name.split('.').pop();
    const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from('images').upload(path, file);
    if (error) throw new Error(error.message);
    return supabase.storage.from('images').getPublicUrl(path).data.publicUrl;
  };

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);

    try {
      let fotoUrl = form.foto_url;
      let lampiranUrl = form.lampiran_url;

      if (fotoFile) fotoUrl = await uploadFile(fotoFile, 'aset/foto');
      if (lampiranFile) lampiranUrl = await uploadFile(lampiranFile, 'aset/lampiran');

      const mType = getMaintenanceType();
      const payload = {
        kelompok_id: Number(form.kelompok_id) || null,
        sub_kelompok_id: Number(form.sub_kelompok_id) || null,
        nama_aset: form.nama_aset,
        merek_tipe: form.merek_tipe || null,
        nomor_seri_plat: form.nomor_seri_plat || null,
        lokasi_ruangan: form.lokasi_ruangan,
        penanggung_jawab: form.penanggung_jawab || null,
        tanggal_perolehan: form.tanggal_perolehan,
        harga_beli: Number(form.harga_beli) || 0,
        status_kondisi: form.status_kondisi,  // setelah rename dari 'kondisi'
        status: 'aktif',                       // kolom wajib di DB
        maintenance_type: mType || 'tidak',
        foto_url: fotoUrl || null,
        lampiran_url: lampiranUrl || null,
        // km fields — nama kolom sesuai DB: km_saat_ini
        no_polisi: mType === 'km' ? (form.no_polisi || null) : null,
        km_saat_ini: mType === 'km' ? (Number(form.km_saat_ini) || null) : null,
        km_terakhir_servis: mType === 'km' ? (Number(form.km_saat_ini) || null) : null, // titik awal
        interval_km: mType === 'km' ? (Number(form.interval_km) || null) : null,
        // bulan fields
        interval_bulan: mType === 'bulan' ? (Number(form.interval_bulan) || null) : null,
        tanggal_servis_terakhir: mType === 'bulan' ? (form.tanggal_servis_terakhir || null) : null,
      };

      // Tambahkan kode_aset hanya saat create baru
      if (!editId && kodePreview && kodePreview !== '—') {
        payload.kode_aset = kodePreview;
      }

      const ok = editId ? await updateAset(editId, payload) : await addAset(payload);
      if (ok) closeForm();
    } catch (err) {
      alert('Gagal menyimpan: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleEdit = (a) => {
    setForm({
      kelompok_id: a.kelompok_id || '',
      sub_kelompok_id: a.sub_kelompok_id || '',
      nama_aset: a.nama_aset || '',
      merek_tipe: a.merek_tipe || '',
      nomor_seri_plat: a.nomor_seri_plat || '',
      lokasi_ruangan: a.lokasi_ruangan || '',
      penanggung_jawab: a.penanggung_jawab || '',
      tanggal_perolehan: a.tanggal_perolehan || '',
      harga_beli: a.harga_beli || '',
      status_kondisi: a.status_kondisi || 'Baik',
      foto_url: a.foto_url || '',
      lampiran_url: a.lampiran_url || '',
      no_polisi: a.no_polisi || '',
      km_saat_ini: a.km_saat_ini || '',
      interval_km: a.interval_km || '',
      interval_bulan: a.interval_bulan || '',
      tanggal_servis_terakhir: a.tanggal_servis_terakhir || '',
    });
    setEditId(a.id);
    setOpenForm(true);
  };

  const handleDelete = (a) => { setItemToDelete(a); setIsDeleteModalOpen(true); };
  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    await deleteAset(itemToDelete.id);
    setIsDeleteModalOpen(false);
    setItemToDelete(null);
  };

  const handleExport = () => {
    const wb = XLSX.utils.book_new();
    const exportData = filtered.map(a => ({
      'Kode Aset': a.kode_aset || '',
      'Nama Aset': a.nama_aset,
      'Kelompok': a.kelompok?.nama || '',
      'Sub-Kelompok': a.sub_kelompok?.nama || '',
      'Merek / Tipe': a.merek_tipe || '',
      'No. Seri / Plat': a.nomor_seri_plat || '',
      'Lokasi': a.lokasi_ruangan,
      'Penanggung Jawab': a.penanggung_jawab || '',
      'Kondisi': a.status_kondisi,
      'Harga Beli': a.harga_beli || 0,
      'Tanggal Perolehan': a.tanggal_perolehan,
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(exportData), 'Daftar Aset');
    XLSX.writeFile(wb, 'Daftar_Aset.xlsx');
  };

  // ── Filter ────────────────────────────────────────────────────────────────
  const filtered = daftarAset.filter(a => {
    const text = (
      (a.nama_aset || '') + (a.nomor_seri_plat || '') +
      (a.lokasi_ruangan || '') + (a.merek_tipe || '') +
      (a.kode_aset || '') + (a.penanggung_jawab || '')
    ).toLowerCase();
    const matchText = text.includes(filterText.toLowerCase());
    const matchKelompok = filterKelompok ? String(a.kelompok_id) === filterKelompok : true;
    const matchKondisi = filterKondisi ? a.status_kondisi === filterKondisi : true;
    return matchText && matchKelompok && matchKondisi;
  });

  const paged = filtered.slice((currentPage - 1) * perPage, currentPage * perPage);

  const mType = getMaintenanceType();

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-21">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-slate-800 tracking-tight">Daftar Aset</h1>
          <p className="text-xs text-slate-400 mt-2">{filtered.length} aset tercatat</p>
        </div>
        <div className="flex gap-8 items-center">
          {/* View toggle */}
          <div className="flex bg-slate-100 rounded-xl p-3">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`p-5 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-white shadow-sm text-teal-600' : 'text-slate-400 hover:text-slate-600'}`}
              title="Grid View"
            >
              <LayoutGrid size={15} />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`p-5 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-white shadow-sm text-teal-600' : 'text-slate-400 hover:text-slate-600'}`}
              title="List View"
            >
              <List size={15} />
            </button>
          </div>

          <Button variant="ghost" size="icon" onClick={handleExport} title="Export Excel">
            <Download size={16} />
          </Button>

          {isAdmin && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowKategoriModal(true)}
                className="border-slate-200 text-slate-600"
                title="Kelola Kategori"
              >
                <Settings2 size={14} />
                <span className="hidden sm:inline">Kategori</span>
              </Button>
              <Button
                size="sm"
                onClick={() => { setEditId(null); setForm(EMPTY_FORM); setOpenForm(true); }}
                className="bg-teal-600 hover:bg-teal-700 shadow-teal-500/20"
              >
                <Plus size={15} /> Tambah Aset
              </Button>
            </>
          )}
        </div>
      </div>

      {/* ── FORM MODAL OVERLAY ──────────────────────────────────────────────── */}
      {openForm && (
        <div className="fixed inset-0 z-[9999] flex items-start justify-center p-4 overflow-y-auto">
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={closeForm} />
          <div className="relative bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-2xl my-8 z-10 overflow-hidden">

            {/* Form Header */}
            <div className="flex items-center justify-between px-21 py-13 bg-gradient-to-r from-teal-600 to-teal-500 shrink-0">
              <div>
                <p className="text-sm font-black text-white tracking-tight">
                  {editId ? '✏️ Edit Detail Aset' : '🛡️ Registrasi Aset Baru'}
                </p>
                <p className="text-[10px] text-teal-100/80 font-medium mt-1">
                  {editId ? 'Ubah data aset yang sudah tersimpan' : 'Daftarkan aset baru ke dalam sistem'}
                </p>
              </div>
              <button onClick={closeForm} className="w-34 h-34 rounded-xl bg-white/15 hover:bg-white/25 flex items-center justify-center text-white transition-colors">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-21 space-y-13 overflow-y-auto max-h-[75vh]">

              {/* ── SEKSI 1: KATEGORI ──────────────────────────────────────── */}
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-8 flex items-center gap-5">
                  <Tag size={11} /> Kategori Aset
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                  {/* Kelompok */}
                  <FieldSelect
                    label="Kelompok Aset"
                    required
                    value={form.kelompok_id}
                    onChange={e => setForm(f => ({ ...f, kelompok_id: e.target.value, sub_kelompok_id: '' }))}
                  >
                    <option value="">— Pilih Kelompok —</option>
                    {kelompokAset.map(k => (
                      <option key={k.id} value={k.id}>{k.nama}</option>
                    ))}
                  </FieldSelect>

                  {/* Sub-Kelompok */}
                  <FieldSelect
                    label="Sub-Kelompok Aset"
                    required
                    value={form.sub_kelompok_id}
                    onChange={e => setForm(f => ({ ...f, sub_kelompok_id: e.target.value }))}
                    disabled={!form.kelompok_id}
                  >
                    <option value="">— Pilih Sub-Kelompok —</option>
                    {getSubKelompokFiltered().map(s => (
                      <option key={s.id} value={s.id}>{s.nama}</option>
                    ))}
                  </FieldSelect>
                </div>

                {/* Kode Aset Preview */}
                {!editId && form.kelompok_id && (
                  <div className="mt-8 flex items-center gap-8 bg-slate-50 border border-slate-200 rounded-xl px-13 py-8">
                    <div className="flex flex-col gap-1 flex-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Kode Aset (Auto-Generate)</span>
                      <span className="font-mono text-base font-black text-teal-700 tracking-widest flex items-center gap-5">
                        {loadingKode
                          ? <Loader2 size={14} className="animate-spin text-slate-400" />
                          : (kodePreview || '—')
                        }
                      </span>
                    </div>
                    <div className="text-[9px] text-slate-400 text-right leading-relaxed">
                      Dikonfirmasi saat<br />data disimpan
                    </div>
                  </div>
                )}

                {/* Edit: tampilkan kode eksisting */}
                {editId && (
                  <div className="mt-8 flex items-center gap-8 bg-slate-50 border border-slate-100 rounded-xl px-13 py-8">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Kode Aset</span>
                    <span className="font-mono text-sm font-black text-slate-600">
                      {daftarAset.find(a => a.id === editId)?.kode_aset || '—'}
                    </span>
                  </div>
                )}
              </div>

              {/* ── SEKSI 2: INFORMASI UTAMA ───────────────────────────────── */}
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-8 flex items-center gap-5">
                  <Info size={11} /> Informasi Aset
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <FieldInput
                    label="Nama Aset"
                    required
                    placeholder="contoh: AC Split Samsung 1.5 PK"
                    value={form.nama_aset}
                    onChange={e => setForm(f => ({ ...f, nama_aset: e.target.value }))}
                  />
                  <FieldInput
                    label="Merek / Tipe"
                    placeholder="contoh: Samsung / AR13TYHQB"
                    value={form.merek_tipe}
                    onChange={e => setForm(f => ({ ...f, merek_tipe: e.target.value }))}
                  />
                  <FieldInput
                    label="Nomor Seri / Plat"
                    placeholder="contoh: SN-2024-001 atau B 1234 XYZ"
                    value={form.nomor_seri_plat}
                    onChange={e => setForm(f => ({ ...f, nomor_seri_plat: e.target.value }))}
                  />
                  <FieldInput
                    label="Lokasi / Ruangan"
                    required
                    placeholder="contoh: Ruang Rapat Lantai 2"
                    value={form.lokasi_ruangan}
                    onChange={e => setForm(f => ({ ...f, lokasi_ruangan: e.target.value }))}
                  />
                  <FieldInput
                    label="Penanggung Jawab"
                    placeholder="contoh: Budi Santoso"
                    value={form.penanggung_jawab}
                    onChange={e => setForm(f => ({ ...f, penanggung_jawab: e.target.value }))}
                  />
                  <FieldInput
                    label="Harga Beli (Rp)"
                    required
                    type="number"
                    min="0"
                    placeholder="0"
                    value={form.harga_beli}
                    onChange={e => setForm(f => ({ ...f, harga_beli: e.target.value }))}
                  />
                  <FieldInput
                    label="Tanggal Perolehan"
                    required
                    type="date"
                    value={form.tanggal_perolehan}
                    onChange={e => setForm(f => ({ ...f, tanggal_perolehan: e.target.value }))}
                  />
                  <FieldSelect
                    label="Kondisi Awal"
                    required
                    value={form.status_kondisi}
                    onChange={e => setForm(f => ({ ...f, status_kondisi: e.target.value }))}
                  >
                    {KONDISI_OPTIONS.map(o => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </FieldSelect>
                </div>
              </div>

              {/* ── SEKSI 3: FORM DINAMIS MAINTENANCE ─────────────────────── */}
              {form.sub_kelompok_id && (
                <div>
                  {mType === 'km' && (
                    <div className="bg-blue-50/70 border border-blue-100 rounded-2xl p-13">
                      <p className="text-[10px] font-black text-blue-700 uppercase tracking-widest mb-8 flex items-center gap-5">
                        <Car size={11} /> Informasi Kendaraan (Servis Berbasis KM)
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <FieldInput
                          label="No. Polisi"
                          placeholder="B 1234 XYZ"
                          value={form.no_polisi}
                          onChange={e => setForm(f => ({ ...f, no_polisi: e.target.value }))}
                          className="bg-white"
                        />
                        <FieldInput
                          label="KM Saat Ini"
                          type="number"
                          min="0"
                          placeholder="contoh: 45000"
                          value={form.km_saat_ini}
                          onChange={e => setForm(f => ({ ...f, km_saat_ini: e.target.value }))}
                          className="bg-white"
                        />
                        <FieldInput
                          label="Interval Servis (KM)"
                          type="number"
                          min="0"
                          placeholder="contoh: 5000"
                          value={form.interval_km}
                          onChange={e => setForm(f => ({ ...f, interval_km: e.target.value }))}
                          className="bg-white"
                        />
                      </div>
                    </div>
                  )}

                  {mType === 'bulan' && (
                    <div className="bg-amber-50/70 border border-amber-100 rounded-2xl p-13">
                      <p className="text-[10px] font-black text-amber-700 uppercase tracking-widest mb-8 flex items-center gap-5">
                        <Clock size={11} /> Jadwal Servis Berkala (Bulanan)
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <FieldInput
                          label="Interval Servis (Bulan)"
                          type="number"
                          min="1"
                          max="60"
                          placeholder="contoh: 3 (setiap 3 bulan)"
                          value={form.interval_bulan}
                          onChange={e => setForm(f => ({ ...f, interval_bulan: e.target.value }))}
                          className="bg-white"
                        />
                        <FieldInput
                          label="Tanggal Servis Terakhir"
                          type="date"
                          value={form.tanggal_servis_terakhir}
                          onChange={e => setForm(f => ({ ...f, tanggal_servis_terakhir: e.target.value }))}
                          className="bg-white"
                        />
                      </div>
                    </div>
                  )}

                  {mType === 'tidak' && (
                    <div className="flex items-start gap-8 bg-slate-50 border border-slate-200 rounded-2xl p-13">
                      <div className="w-21 h-21 rounded-lg bg-slate-200 flex items-center justify-center shrink-0 mt-0.5">
                        <Info size={11} className="text-slate-500" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-600">Tanpa Jadwal Servis Berkala</p>
                        <p className="text-[10px] text-slate-400 mt-2 leading-relaxed">
                          Sub-kelompok ini tidak memerlukan servis atau perawatan rutin terjadwal.
                          Jika terjadi kerusakan, gunakan menu <strong>Laporan Perawatan</strong> untuk mencatat perbaikan.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ── SEKSI 4: UPLOAD FOTO & LAMPIRAN ───────────────────────── */}
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-8 flex items-center gap-5">
                  <ImageIcon size={11} /> Media & Dokumen
                </p>
                <div className="space-y-8">

                  {/* Foto Utama */}
                  <div className="flex flex-col gap-5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                      Foto Utama Aset
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={e => {
                        const f = e.target.files?.[0];
                        if (!f) return;
                        if (f.size > 3 * 1024 * 1024) {
                          alert('Ukuran foto terlalu besar. Maksimal 3MB.');
                          e.target.value = '';
                          return;
                        }
                        setFotoFile(f);
                      }}
                      className="w-full text-xs text-slate-500 file:mr-13 file:py-5 file:px-13 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-teal-100 file:text-teal-700 hover:file:bg-teal-200 cursor-pointer"
                    />
                    {form.foto_url && !fotoFile && (
                      <div className="flex items-center gap-5 text-[10px] text-teal-600 bg-teal-50 px-8 py-5 rounded-lg">
                        <ImageIcon size={10} /> Foto sudah tersimpan. Unggah baru untuk mengganti.
                      </div>
                    )}
                  </div>

                  {/* Lampiran Opsional */}
                  <div className="flex flex-col gap-5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-5">
                      <Paperclip size={10} />
                      Lampiran Dokumen
                      <span className="text-[9px] font-medium text-slate-400 normal-case tracking-normal">— Opsional (nota, surat garansi, dokumen pendukung)</span>
                    </label>
                    <input
                      type="file"
                      accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx"
                      onChange={e => {
                        const f = e.target.files?.[0];
                        if (!f) return;
                        if (f.size > 5 * 1024 * 1024) {
                          alert('Ukuran lampiran terlalu besar. Maksimal 5MB.');
                          e.target.value = '';
                          return;
                        }
                        setLampiranFile(f);
                      }}
                      className="w-full text-xs text-slate-500 file:mr-13 file:py-5 file:px-13 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-slate-100 file:text-slate-600 hover:file:bg-slate-200 cursor-pointer"
                    />
                    {form.lampiran_url && !lampiranFile && (
                      <div className="flex items-center gap-5 text-[10px] text-slate-600 bg-slate-50 px-8 py-5 rounded-lg">
                        <Paperclip size={10} /> Dokumen lampiran sudah tersimpan.
                        <a href={form.lampiran_url} target="_blank" rel="noopener noreferrer" className="underline text-teal-600 ml-3">Lihat</a>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* ── Action Buttons ─────────────────────────────────────────── */}
              <div className="flex justify-end gap-8 pt-5 border-t border-slate-100">
                <button
                  type="button"
                  onClick={closeForm}
                  disabled={uploading}
                  className="px-18 py-8 rounded-xl border border-slate-200 text-xs font-bold text-slate-500 hover:bg-slate-50 active:scale-95 transition-all select-none"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="flex items-center gap-5 px-18 py-8 rounded-xl bg-teal-600 hover:bg-teal-700 text-xs font-bold text-white shadow-sm active:scale-95 transition-all select-none disabled:opacity-50"
                >
                  {uploading
                    ? <><Loader2 size={12} className="animate-spin" /> Menyimpan...</>
                    : `${editId ? 'Simpan Perubahan' : 'Daftarkan Aset'}`
                  }
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Filter Panel ───────────────────────────────────────────────────── */}
      <div className="bg-slate-50 p-13 rounded-2xl border border-slate-100 shadow-sm space-y-8">
        <div className="relative">
          <Search size={14} className="absolute left-13 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari nama, kode, merek, nomor seri, penanggung jawab, lokasi..."
            value={filterText}
            onChange={e => setFilterText(e.target.value)}
            className="w-full pl-34 pr-13 py-8 text-xs bg-white border border-slate-200 rounded-xl focus:border-teal-500 focus:ring-2 focus:ring-teal-100 outline-none transition-all"
          />
        </div>
        <div className="grid grid-cols-2 gap-8">
          <select
            className="w-full px-8 py-8 text-[10px] bg-white border border-slate-200 rounded-xl focus:border-teal-500 focus:ring-2 focus:ring-teal-100 outline-none transition-all text-slate-600 font-medium"
            value={filterKelompok}
            onChange={e => setFilterKelompok(e.target.value)}
          >
            <option value="">Semua Kelompok</option>
            {kelompokAset.map(k => (
              <option key={k.id} value={String(k.id)}>{k.nama}</option>
            ))}
          </select>
          <select
            className="w-full px-8 py-8 text-[10px] bg-white border border-slate-200 rounded-xl focus:border-teal-500 focus:ring-2 focus:ring-teal-100 outline-none transition-all text-slate-600 font-medium"
            value={filterKondisi}
            onChange={e => setFilterKondisi(e.target.value)}
          >
            <option value="">Semua Kondisi</option>
            {KONDISI_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      </div>

      {/* ── Table / Grid ───────────────────────────────────────────────────── */}
      {filtered.length === 0 ? (
        <div className="text-center py-34 text-slate-400 text-sm bg-slate-50 rounded-2xl border border-slate-100 border-dashed">
          <Shield size={28} className="mx-auto mb-5 text-slate-300" />
          {filterText || filterKelompok || filterKondisi
            ? 'Tidak ada aset yang cocok dengan filter.'
            : 'Belum ada data aset terdaftar.'
          }
        </div>
      ) : viewMode === 'grid' ? (
        <div className="space-y-21">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-13 lg:gap-21">
            {paged.map(a => (
              <Card key={a.id} className="p-0 overflow-hidden flex flex-col justify-between group hover:border-slate-200 transition-colors">
                {a.foto_url ? (
                  <img src={a.foto_url} alt={a.nama_aset} className="w-full h-40 object-cover border-b border-slate-100" />
                ) : (
                  <div className="w-full h-40 bg-slate-50 border-b border-slate-100 flex flex-col items-center justify-center text-slate-300">
                    <ImageIcon size={24} className="mb-4" />
                    <span className="text-[10px] font-medium">Tidak ada gambar</span>
                  </div>
                )}
                <div className="p-21 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start gap-3">
                      <h4
                        onClick={() => navigate(`/harta-benda/aset/${a.id}`)}
                        className="text-sm font-bold text-slate-800 line-clamp-2 cursor-pointer hover:text-teal-600 transition-colors"
                        title={a.nama_aset}
                      >
                        {a.nama_aset}
                      </h4>
                      <span className={`text-[9px] font-bold px-5 py-2 rounded-md shrink-0 ${kondisiBadge(a.status_kondisi)}`}>
                        {a.status_kondisi}
                      </span>
                    </div>

                    <p className="font-mono text-[9px] text-teal-600 font-bold mt-2">{a.kode_aset || '—'}</p>
                    <p className="text-[10px] text-slate-400 mt-1">{a.kelompok?.nama || ''}{a.sub_kelompok ? ' › ' + a.sub_kelompok.nama : ''}</p>

                    <div className="mt-8 pt-8 border-t border-slate-50 space-y-3">
                      <div className="flex justify-between text-[10px] text-slate-500">
                        <span className="font-medium text-slate-400">Lokasi</span>
                        <span className="font-semibold text-slate-700 truncate max-w-[120px]">{a.lokasi_ruangan}</span>
                      </div>
                      <div className="flex justify-between text-[10px] text-slate-500">
                        <span className="font-medium text-slate-400">Merek</span>
                        <span className="font-semibold text-slate-700 truncate max-w-[120px]">{a.merek_tipe || '—'}</span>
                      </div>
                      <div className="flex justify-between text-[10px] text-slate-500">
                        <span className="font-medium text-slate-400">Harga Beli</span>
                        <span className="font-bold text-teal-600 font-mono">{formatRupiah(a.harga_beli)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center mt-13 pt-8 border-t border-slate-100">
                    <span className="text-[9px] text-slate-400 font-medium flex items-center gap-2">
                      <Calendar size={10} /> {a.tanggal_perolehan}
                    </span>
                    <div className="flex gap-5">
                      <button
                        onClick={() => navigate(`/harta-benda/aset/${a.id}`)}
                        className="text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors px-8 py-5 flex items-center justify-center text-[10px] font-bold"
                        title="Detail"
                      >
                        Detail
                      </button>
                      {isAdmin && (
                        <>
                          <button
                            onClick={() => handleEdit(a)}
                            className="w-21 h-21 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center hover:bg-teal-100 transition-colors"
                            title="Edit"
                          >
                            <Pencil size={12} />
                          </button>
                          <button
                            onClick={() => handleDelete(a)}
                            className="w-21 h-21 rounded-lg bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-100 transition-colors"
                            title="Hapus"
                          >
                            <Trash2 size={12} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
          <Pagination total={filtered.length} perPage={perPage} currentPage={currentPage} onPageChange={setCurrentPage} onPerPageChange={setPerPage} />
        </div>
      ) : (
        <div className="space-y-21">
          <Table headers={['Kode / Aset', 'Kelompok', 'Merek / No.Seri', 'Lokasi', 'Kondisi', 'Harga Beli', '']}>
            {paged.map(a => (
              <tr key={a.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-13 py-13">
                  <p
                    onClick={() => navigate(`/harta-benda/aset/${a.id}`)}
                    className="text-sm font-semibold text-slate-700 cursor-pointer hover:text-teal-600 transition-colors"
                  >
                    {a.nama_aset}
                  </p>
                  <p className="font-mono text-[9px] text-teal-600 font-bold mt-1">{a.kode_aset || '—'}</p>
                  <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-2">
                    <Calendar size={9} /> {a.tanggal_perolehan}
                  </p>
                </td>
                <td className="px-13 py-13">
                  <p className="text-xs font-medium text-slate-600">{a.kelompok?.nama || '—'}</p>
                  <p className="text-[10px] text-slate-400 mt-1">{a.sub_kelompok?.nama || ''}</p>
                </td>
                <td className="px-13 py-13">
                  <p className="text-xs font-medium text-slate-600">{a.merek_tipe || '—'}</p>
                  <p className="font-mono text-[10px] text-slate-400 mt-1">{a.nomor_seri_plat || '—'}</p>
                </td>
                <td className="px-13 py-13">
                  <p className="text-xs text-slate-600">{a.lokasi_ruangan}</p>
                  {a.penanggung_jawab && (
                    <p className="text-[10px] text-slate-400 mt-1">{a.penanggung_jawab}</p>
                  )}
                </td>
                <td className="px-13 py-13">
                  <span className={`text-[10px] font-bold px-5 py-2 rounded-md ${kondisiBadge(a.status_kondisi)}`}>
                    {a.status_kondisi}
                  </span>
                </td>
                <td className="px-13 py-13 font-mono text-xs font-bold text-slate-700">{formatRupiah(a.harga_beli)}</td>
                <td className="px-13 py-13">
                  <div className="flex gap-5">
                    <button
                      onClick={() => navigate(`/harta-benda/aset/${a.id}`)}
                      className="text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors px-8 py-5 flex items-center justify-center text-[10px] font-bold"
                      title="Detail"
                    >
                      Detail
                    </button>
                    {isAdmin && (
                      <>
                        <button
                          onClick={() => handleEdit(a)}
                          className="w-21 h-21 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center hover:bg-teal-100 transition-colors"
                          title="Edit"
                        >
                          <Pencil size={12} />
                        </button>
                        <button
                          onClick={() => handleDelete(a)}
                          className="w-21 h-21 rounded-lg bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-100 transition-colors"
                          title="Hapus"
                        >
                          <Trash2 size={12} />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </Table>
          <Pagination total={filtered.length} perPage={perPage} currentPage={currentPage} onPageChange={setCurrentPage} onPerPageChange={setPerPage} />
        </div>
      )}

      {/* ── Modal Hapus ────────────────────────────────────────────────────── */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => { setIsDeleteModalOpen(false); setItemToDelete(null); }} />
          <div className="relative bg-white rounded-3xl shadow-xl border border-slate-100 w-full max-w-md p-21 flex flex-col gap-13 z-10 text-center items-center">
            <div className="w-55 h-55 rounded-2xl bg-red-50 flex items-center justify-center">
              <Trash2 size={24} className="text-red-500" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-800 tracking-tight mb-8">Hapus Aset</h3>
              <p className="text-xs text-slate-500 leading-relaxed max-w-sm">
                Yakin ingin menghapus aset <span className="font-bold text-slate-700">"{itemToDelete?.nama_aset}"</span>
                {itemToDelete?.kode_aset && <span className="font-mono text-teal-600"> ({itemToDelete.kode_aset})</span>}?
                <br />Data ini akan dihapus secara permanen.
              </p>
            </div>
            <div className="flex items-center justify-center gap-8 mt-5 w-full">
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

      {/* ── Modal Kategori ──────────────────────────────────────────────────── */}
      {showKategoriModal && (
        <ModalKategoriAset
          onClose={() => {
            setShowKategoriModal(false);
            fetchKelompokAset();
            fetchSubKelompokAset();
          }}
        />
      )}
    </div>
  );
}
