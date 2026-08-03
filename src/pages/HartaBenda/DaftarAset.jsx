import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  LayoutGrid,
  List,
  Calendar,
  Image as ImageIcon,
  Car,
  Clock,
  Loader2,
  FolderPlus,
  X,
  Lock,
  Sparkles,
  FileText,
} from 'lucide-react';

import Button from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Table } from '../../components/ui/Table';
import Pagination from '../../components/ui/Pagination';
import { Input, Select } from '../../components/ui/Input';
import ModalKategoriAset from './ModalKategoriAset';
import { cn } from '../../utils/cn';
import useHartaBendaStore from '../../store/HartaBenda/useHartaBendaStore';
import { supabase } from '../../lib/supabase';

const KONDISI_OPTIONS = [
  { value: 'Baik', label: 'Baik' },
  { value: 'Rusak Ringan', label: 'Rusak Ringan' },
  { value: 'Rusak Berat', label: 'Rusak Berat' },
  { value: 'Dalam Perbaikan', label: 'Dalam Perbaikan' },
  { value: 'Dihentikan/Afkir', label: 'Dihentikan/Afkir' },
];

const SATUAN_OPTIONS = [
  { value: 'Unit', label: 'Unit' },
  { value: 'M2', label: 'M²' },
  { value: 'Buah', label: 'Buah' },
  { value: 'Set', label: 'Set' },
];

export default function DaftarAset() {
  const navigate = useNavigate();
  const isAdmin = true;

  // ── Store ────────────────────────────────────────────────────────────────
  const {
    daftarAset,
    kelompokAset,
    subKelompokAset,
    fetchDataHartaBenda,
    addAset,
    updateAset,
    deleteAset,
  } = useHartaBendaStore();

  // ── UI State ─────────────────────────────────────────────────────────────
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [fotoFile, setFotoFile] = useState(null);
  const [lampiranFile, setLampiranFile] = useState(null);
  const [loadingKode, setLoadingKode] = useState(false);
  const [showKategoriModal, setShowKategoriModal] = useState(false);

  // Delete Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  // Filter & Pagination State
  const [filterText, setFilterText] = useState('');
  const [filterKelompok, setFilterKelompok] = useState('');
  const [filterKondisi, setFilterKondisi] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(12);

  // ── Form Initial State ───────────────────────────────────────────────────
  const initialFormState = {
    nama_aset: '',
    kode_aset: '',
    kelompok_id: '',
    sub_kelompok_id: '',
    merek_tipe: '',
    nomor_seri_plat: '',
    lokasi_ruangan: '',
    penanggung_jawab: '',
    status_kondisi: 'Baik',
    harga_beli: '',
    tanggal_perolehan: new Date().toISOString().split('T')[0],
    no_polisi: '',
    km_saat_ini: '',
    interval_km: '',
    interval_bulan: '',
    tanggal_servis_terakhir: '',
    foto_url: '',
    lampiran_url: '',
    // BMN fields
    kode_bmn: '',
    nup: '',
    satuan: 'Unit',
    masa_manfaat_bulan: '',
    jenis_bmn: 'Intrakomptabel',
    status_operasional: 'Aktif',
  };

  const [form, setForm] = useState(initialFormState);

  // ── Init ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    fetchDataHartaBenda();
  }, [fetchDataHartaBenda]);

  // ── Kode Aset Otomatis (hanya saat mode Tambah baru) ────────────────────
  useEffect(() => {
    // Mode edit: jangan generate ulang
    if (editId) return;
    if (!form.kelompok_id) {
      setForm(f => ({ ...f, kode_aset: '' }));
      return;
    }

    let cancelled = false;
    const generateKode = async () => {
      setLoadingKode(true);
      try {
        const { data, error } = await supabase.rpc('generate_kode_aset', {
          p_kelompok_id: Number(form.kelompok_id),
        });
        if (!cancelled) {
          setForm(f => ({ ...f, kode_aset: error ? '' : (data || '') }));
        }
      } catch {
        // silent
      } finally {
        if (!cancelled) setLoadingKode(false);
      }
    };

    generateKode();
    return () => { cancelled = true; };
  }, [form.kelompok_id, editId]);

  // ── Sub-kelompok otomatis isi jika hanya ada satu pilihan ───────────────
  useEffect(() => {
    if (!form.kelompok_id) return;
    const subs = subKelompokAset.filter(
      s => String(s.kelompok_id) === String(form.kelompok_id)
    );
    if (subs.length === 1) {
      setForm(f => ({ ...f, sub_kelompok_id: String(subs[0].id) }));
    }
  }, [form.kelompok_id, subKelompokAset]);

  // ── Handlers ─────────────────────────────────────────────────────────────
  const closeForm = () => {
    setShowForm(false);
    setEditId(null);
    setForm(initialFormState);
    setFotoFile(null);
    setLampiranFile(null);
  };

  const handleEdit = (aset) => {
    setEditId(aset.id);
    setForm({
      nama_aset: aset.nama_aset || '',
      kode_aset: aset.kode_aset || '',
      kelompok_id: aset.kelompok_id ? String(aset.kelompok_id) : '',
      sub_kelompok_id: aset.sub_kelompok_id ? String(aset.sub_kelompok_id) : '',
      merek_tipe: aset.merek_tipe || '',
      nomor_seri_plat: aset.nomor_seri_plat || '',
      lokasi_ruangan: aset.lokasi_ruangan || '',
      penanggung_jawab: aset.penanggung_jawab || '',
      status_kondisi: aset.status_kondisi || 'Baik',
      harga_beli: aset.harga_beli || '',
      tanggal_perolehan: aset.tanggal_perolehan || '',
      no_polisi: aset.no_polisi || '',
      km_saat_ini: aset.km_saat_ini || '',
      interval_km: aset.interval_km || '',
      interval_bulan: aset.interval_bulan || '',
      tanggal_servis_terakhir: aset.tanggal_servis_terakhir || '',
      foto_url: aset.foto_url || '',
      lampiran_url: aset.lampiran_url || '',
      // BMN fields
      kode_bmn: aset.kode_bmn || '',
      nup: aset.nup || '',
      satuan: aset.satuan || 'Unit',
      masa_manfaat_bulan: aset.masa_manfaat_bulan || '',
      jenis_bmn: aset.jenis_bmn || 'Intrakomptabel',
      status_operasional: aset.status_operasional || 'Aktif',
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = (aset) => {
    setItemToDelete(aset);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    await deleteAset(itemToDelete.id);
    setIsDeleteModalOpen(false);
    setItemToDelete(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!fotoFile && !form.foto_url) {
      alert('Foto Aset wajib diunggah!');
      setUploading(false);
      return;
    }

    let fotoUrl = form.foto_url;

    // Upload foto jika ada file baru
    if (fotoFile) {
      const ext = fotoFile.name.split('.').pop();
      const fileName = `aset-${Date.now()}.${ext}`;
      const filePath = `aset/foto/${fileName}`;

      // Coba upload ke bucket 'images' (bucket utama yang public)
      let { data: uploadData, error: uploadError } = await supabase.storage
        .from('images')
        .upload(filePath, fotoFile, { upsert: true });

      if (!uploadError && uploadData) {
        const { data: urlData } = supabase.storage
          .from('images')
          .getPublicUrl(filePath);
        fotoUrl = urlData?.publicUrl || '';
      } else {
        // Fallback ke bucket 'assets-foto' jika bucket 'images' gagal
        const { data: fallbackData, error: fallbackError } = await supabase.storage
          .from('assets-foto')
          .upload(fileName, fotoFile, { upsert: true });
        if (!fallbackError && fallbackData) {
          const { data: urlData } = supabase.storage
            .from('assets-foto')
            .getPublicUrl(fileName);
          fotoUrl = urlData?.publicUrl || '';
        } else {
          console.error('Upload foto gagal:', uploadError || fallbackError);
          alert('Gagal mengunggah foto aset. Pastikan bucket "images" atau "assets-foto" di Supabase Storage sudah dibuat dan bersifat Public.');
          setUploading(false);
          return;
        }
      }
    }

    let lampiranUrl = form.lampiran_url;

    // Upload lampiran jika ada file baru (opsional)
    if (lampiranFile) {
      const ext = lampiranFile.name.split('.').pop();
      const fileName = `lampiran-${Date.now()}.${ext}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('images')
        .upload(`aset/lampiran/${fileName}`, lampiranFile, { upsert: true });
      if (!uploadError && uploadData) {
        const { data: urlData } = supabase.storage
          .from('images')
          .getPublicUrl(`aset/lampiran/${fileName}`);
        lampiranUrl = urlData?.publicUrl || '';
      }
    }

    const payload = {
      ...form,
      foto_url: fotoUrl,
      lampiran_url: lampiranUrl,
      harga_beli: form.harga_beli ? Number(form.harga_beli) : null,
      kelompok_id: form.kelompok_id ? Number(form.kelompok_id) : null,
      sub_kelompok_id: form.sub_kelompok_id ? Number(form.sub_kelompok_id) : null,
      km_saat_ini: form.km_saat_ini ? Number(form.km_saat_ini) : null,
      interval_km: form.interval_km ? Number(form.interval_km) : null,
      interval_bulan: form.interval_bulan ? Number(form.interval_bulan) : null,
      tanggal_perolehan: form.tanggal_perolehan || null,
      tanggal_servis_terakhir: form.tanggal_servis_terakhir || null,
      // BMN fields — boleh null
      kode_bmn: form.kode_bmn?.trim() || null,
      nup: form.nup ? Number(form.nup) : null,
      satuan: form.satuan || 'Unit',
      masa_manfaat_bulan: form.masa_manfaat_bulan ? Number(form.masa_manfaat_bulan) : null,
      jenis_bmn: form.jenis_bmn || 'Intrakomptabel',
      status_operasional: form.status_operasional || 'Aktif',
    };

    let success;
    if (editId) {
      success = await updateAset(editId, payload);
    } else {
      success = await addAset(payload);
    }

    setUploading(false);
    if (success) closeForm();
  };

  // ── Computed ─────────────────────────────────────────────────────────────
  const selectedSub = subKelompokAset.find(
    s => String(s.id) === String(form.sub_kelompok_id)
  );
  const mType = selectedSub?.maintenance_type || 'tidak';

  const filteredSubs = subKelompokAset.filter(
    s => String(s.kelompok_id) === String(form.kelompok_id)
  );

  // ── Formatting Helpers ───────────────────────────────────────────────────
  const formatRupiah = (val) => {
    if (!val) return 'Rp 0';
    return `Rp ${Number(val).toLocaleString('id-ID')}`;
  };

  const kondisiBadge = (kondisi) => {
    switch (kondisi) {
      case 'Baik':
        return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
      case 'Rusak Ringan':
        return 'bg-amber-50 text-amber-700 border border-amber-200';
      case 'Rusak Berat':
        return 'bg-rose-50 text-rose-700 border border-rose-200';
      case 'Dalam Perbaikan':
        return 'bg-blue-50 text-blue-700 border border-blue-200';
      default:
        return 'bg-slate-100 text-slate-600 border border-slate-200';
    }
  };

  // ── Filter & Pagination ──────────────────────────────────────────────────
  const filtered = daftarAset.filter(a => {
    const matchSearch =
      (a.nama_aset || '').toLowerCase().includes(filterText.toLowerCase()) ||
      (a.kode_aset || '').toLowerCase().includes(filterText.toLowerCase()) ||
      (a.merek_tipe || '').toLowerCase().includes(filterText.toLowerCase()) ||
      (a.nomor_seri_plat || '').toLowerCase().includes(filterText.toLowerCase()) ||
      (a.penanggung_jawab || '').toLowerCase().includes(filterText.toLowerCase()) ||
      (a.lokasi_ruangan || '').toLowerCase().includes(filterText.toLowerCase());

    const matchKelompok = !filterKelompok || String(a.kelompok_id) === String(filterKelompok);
    const matchKondisi = !filterKondisi || a.status_kondisi === filterKondisi;

    return matchSearch && matchKelompok && matchKondisi;
  });

  const startIndex = (currentPage - 1) * perPage;
  const paged = filtered.slice(startIndex, startIndex + perPage);

  return (
    <div className="space-y-21">

      {/* ── Header Halaman ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-slate-800 tracking-tight">Master Harta &amp; Aset</h1>
          <p className="text-xs text-slate-400 mt-2">{daftarAset.length} item terdaftar dalam sistem</p>
        </div>

        <div className="flex gap-8">
          {/* Toggle view */}
          <div className="flex bg-slate-100 rounded-xl p-3">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-5 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-white shadow-sm text-teal-600' : 'text-slate-400 hover:text-slate-600'}`}
              title="Grid View"
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

          {isAdmin && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowKategoriModal(true)}
              >
                <FolderPlus size={15} /> Kategori
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  if (showForm && !editId) {
                    setShowForm(false);
                  } else {
                    setEditId(null);
                    setForm(initialFormState);
                    setShowForm(true);
                  }
                }}
              >
                <Plus size={15} /> Tambah
              </Button>
            </>
          )}
        </div>
      </div>

      {/* ── Form Card ── */}
      {showForm && (
        <Card className="border-teal-200 bg-teal-50/30 p-21">
          <div className="flex justify-between items-center mb-13">
            <p className="text-base font-bold text-slate-700">
              {editId ? '✏️  Edit Data Aset' : '📦  Tambah Aset Baru'}
            </p>
            <button
              type="button"
              onClick={closeForm}
              className="text-slate-400 hover:text-slate-600 transition-colors p-1"
            >
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-13">

            {/* ── Baris 1: Kode & Nama ── */}
            <div className="grid grid-cols-2 gap-13">
              {/* Kode Aset — dapat diisi manual atau di-generate otomatis */}
              <Input
                label="Kode Aset / Inventaris"
                type="text"
                placeholder={loadingKode ? 'Membuat kode otomatis...' : 'Contoh: KODE/ASET/2026'}
                value={form.kode_aset}
                onChange={e => setForm(f => ({ ...f, kode_aset: e.target.value }))}
                className={loadingKode ? 'animate-pulse' : ''}
              />
              <Input
                label="Nama Aset"
                required
                type="text"
                placeholder="Contoh: Laptop Asus ROG / AC Split 1.5 PK"
                value={form.nama_aset}
                onChange={e => setForm(f => ({ ...f, nama_aset: e.target.value }))}
              />
            </div>

            {/* ── Baris 2: Kelompok & Sub-Kelompok (Progressive) ── */}
            <div className="grid grid-cols-2 gap-13">
              <Select
                label="Kelompok Aset"
                required
                options={kelompokAset.map(k => ({ label: k.nama, value: k.id }))}
                value={form.kelompok_id}
                onChange={e => setForm(f => ({
                  ...f,
                  kelompok_id: e.target.value,
                  sub_kelompok_id: '',
                  kode_aset: editId ? f.kode_aset : '',
                }))}
              />
              {/* Sub-kelompok: HANYA tampil setelah kelompok dipilih */}
              {form.kelompok_id && (
                <Select
                  label="Subkelompok Aset"
                  required
                  options={filteredSubs.map(s => ({ label: s.nama, value: s.id }))}
                  value={form.sub_kelompok_id}
                  onChange={e => setForm(f => ({ ...f, sub_kelompok_id: e.target.value }))}
                />
              )}
            </div>

            {/* ── Baris 3: Merek, No Seri, Lokasi, PIC ── */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-13">
              <Input
                label="Merek / Tipe"
                type="text"
                placeholder="Contoh: Samsung / AR13"
                value={form.merek_tipe}
                onChange={e => setForm(f => ({ ...f, merek_tipe: e.target.value }))}
              />
              <Input
                label="Nomor Seri / Plat"
                type="text"
                placeholder="Contoh: SN-2026-88"
                value={form.nomor_seri_plat}
                onChange={e => setForm(f => ({ ...f, nomor_seri_plat: e.target.value }))}
              />
              <Input
                label="Lokasi / Ruangan"
                type="text"
                placeholder="Contoh: R. Rapat Lt.2"
                value={form.lokasi_ruangan}
                onChange={e => setForm(f => ({ ...f, lokasi_ruangan: e.target.value }))}
              />
              <Input
                label="Penanggung Jawab"
                type="text"
                placeholder="Contoh: Budi Santoso"
                value={form.penanggung_jawab}
                onChange={e => setForm(f => ({ ...f, penanggung_jawab: e.target.value }))}
              />
            </div>

            {/* ── Baris 4: Harga, Tgl Beli, Kondisi ── */}
            <div className="grid grid-cols-3 gap-13">
              <Input
                label="Harga Beli (Rp)"
                type="number"
                placeholder="0"
                value={form.harga_beli}
                onChange={e => setForm(f => ({ ...f, harga_beli: e.target.value }))}
              />
              <Input
                label="Tanggal Perolehan"
                type="date"
                value={form.tanggal_perolehan}
                onChange={e => setForm(f => ({ ...f, tanggal_perolehan: e.target.value }))}
              />
              <Select
                label="Kondisi Awal"
                options={KONDISI_OPTIONS}
                value={form.status_kondisi}
                onChange={e => setForm(f => ({ ...f, status_kondisi: e.target.value }))}
              />
            </div>
            {/* ── Config Maintenance ── */}
            {form.sub_kelompok_id && mType !== 'tidak' && (
              <div className="pt-2">
                {mType === 'km' && (
                  <div className="bg-white/80 border border-blue-100 rounded-2xl p-4 space-y-3">
                    <p className="text-[10px] font-black text-blue-700 uppercase tracking-wider flex items-center gap-2">
                      <Car size={14} /> Servis Berbasis Kilometer (KM)
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-13">
                      <Input
                        placeholder="No. Polisi"
                        value={form.no_polisi}
                        onChange={e => setForm(f => ({ ...f, no_polisi: e.target.value }))}
                      />
                      <Input
                        type="number"
                        placeholder="KM Saat Ini"
                        value={form.km_saat_ini}
                        onChange={e => setForm(f => ({ ...f, km_saat_ini: e.target.value }))}
                      />
                      <Input
                        type="number"
                        placeholder="Interval KM Servis"
                        value={form.interval_km}
                        onChange={e => setForm(f => ({ ...f, interval_km: e.target.value }))}
                      />
                    </div>
                  </div>
                )}

                {mType === 'bulan' && (
                  <div className="bg-white/80 border border-amber-100 rounded-2xl p-4 space-y-3">
                    <p className="text-[10px] font-black text-amber-700 uppercase tracking-wider flex items-center gap-2">
                      <Clock size={14} /> Servis Berkala Bulanan
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-13">
                      <Input
                        type="number"
                        placeholder="Interval (Bulan)"
                        value={form.interval_bulan}
                        onChange={e => setForm(f => ({ ...f, interval_bulan: e.target.value }))}
                      />
                      <Input
                        type="date"
                        value={form.tanggal_servis_terakhir}
                        onChange={e => setForm(f => ({ ...f, tanggal_servis_terakhir: e.target.value }))}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── Informasi BMN (Opsional) ── */}
            <div className="pt-5 border-t border-slate-100 mt-8">
              <p className="text-sm font-bold text-slate-700 mb-8 flex items-center gap-5">
                <FileText size={16} className="text-teal-600" /> Informasi BMN (opsional)
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-13 mb-5">
                <Select
                  label="Jenis Aset BMN"
                  options={[{label: 'Intrakomptabel', value: 'Intrakomptabel'}, {label: 'Ekstrakomptabel', value: 'Ekstrakomptabel'}]}
                  value={form.jenis_bmn}
                  onChange={e => setForm(f => ({ ...f, jenis_bmn: e.target.value }))}
                />
                <Select
                  label="Status Operasional"
                  options={[{label: 'Aktif', value: 'Aktif'}, {label: 'Usul Hapus', value: 'Usul Hapus'}, {label: 'Dihapuskan', value: 'Dihapuskan'}]}
                  value={form.status_operasional}
                  onChange={e => setForm(f => ({ ...f, status_operasional: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-13">
                <div className="flex flex-col gap-1">
                  <Input
                    label="Kode Barang BMN"
                    type="text"
                    placeholder="Contoh: 3.02.01.01.002"
                    value={form.kode_bmn}
                    onChange={e => setForm(f => ({ ...f, kode_bmn: e.target.value }))}
                  />
                  <p className="text-[10px] text-slate-400">
                    Boleh sama untuk beberapa unit sejenis (dibedakan lewat NUP)
                  </p>
                </div>
                <Input
                  label="NUP"
                  type="number"
                  placeholder="Kosongkan untuk dihitung otomatis"
                  value={form.nup}
                  onChange={e => setForm(f => ({ ...f, nup: e.target.value }))}
                />
                <Select
                  label="Satuan"
                  options={SATUAN_OPTIONS}
                  value={form.satuan}
                  onChange={e => setForm(f => ({ ...f, satuan: e.target.value }))}
                />
                <Input
                  label="Masa Manfaat (bulan)"
                  type="number"
                  placeholder="Contoh: 48"
                  value={form.masa_manfaat_bulan}
                  onChange={e => setForm(f => ({ ...f, masa_manfaat_bulan: e.target.value }))}
                />
              </div>
            </div>

            {/* ── Upload Foto & Lampiran (Opsional) ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-13">
              <div className="flex flex-col gap-5 w-full">
                <label className="text-xs font-semibold text-slate-500 tracking-wide uppercase flex items-center gap-1">
                  Foto Aset <span className="text-rose-500">*</span>
                </label>
                <div className="flex items-center gap-3 bg-white px-13 py-8 border border-slate-200 rounded-xl">
                  <input
                    type="file"
                    accept="image/*"
                    required={!form.foto_url}
                    onChange={e => {
                      const f = e.target.files?.[0];
                      if (f) setFotoFile(f);
                    }}
                    className="text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-teal-100/60 file:text-teal-700 hover:file:bg-teal-100 cursor-pointer w-full"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-5 w-full">
                <label className="text-xs font-semibold text-slate-500 tracking-wide uppercase">
                  Upload Lampiran (Opsional)
                </label>
                <div className="flex items-center gap-3 bg-white px-13 py-8 border border-slate-200 rounded-xl">
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={e => {
                      const f = e.target.files?.[0];
                      if (f) setLampiranFile(f);
                    }}
                    className="text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-teal-100/60 file:text-teal-700 hover:file:bg-teal-100 cursor-pointer w-full"
                  />
                </div>
              </div>
            </div>

            {/* ── Action Buttons ── */}
            <div className="flex justify-end gap-8 pt-5">
              <Button type="button" variant="ghost" size="sm" onClick={closeForm} disabled={uploading}>
                Batal
              </Button>
              <Button type="submit" size="sm" disabled={uploading || loadingKode}>
                {uploading ? (
                  <><Loader2 size={14} className="animate-spin" /> Menyimpan...</>
                ) : editId ? 'Simpan Perubahan' : 'Simpan Aset'}
              </Button>
            </div>

          </form>
        </Card>
      )}

      {/* ── Filter Panel & Search ── */}
      <div className="bg-slate-50 p-13 rounded-2xl border border-slate-100 shadow-sm space-y-8">
        <div className="relative">
          <Search size={14} className="absolute left-13 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari nama, kode, merek, nomor seri, penanggung jawab, atau lokasi..."
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
            {KONDISI_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* ── Data Grid / Table ── */}
      {filtered.length === 0 ? (
        <div className="text-center py-34 text-slate-400 text-sm bg-slate-50 rounded-2xl border border-slate-100 border-dashed">
          {filterText || filterKelompok || filterKondisi
            ? 'Tidak ada aset yang cocok dengan filter pencarian.'
            : 'Belum ada data aset yang terdaftar.'}
        </div>
      ) : viewMode === 'grid' ? (
        <div className="space-y-21">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-13 lg:gap-21">
            {paged.map(a => (
              <div key={a.id} className="bg-white p-13 lg:p-0 rounded-2xl border border-slate-100 shadow-sm flex flex-row lg:flex-col gap-13 lg:gap-0 items-center lg:items-stretch overflow-hidden group hover:shadow-md transition-shadow">

                {/* Container Gambar (89px di mobile, full width x tinggi 144px di desktop) */}
                <div className="w-89 h-89 lg:w-full lg:h-36 bg-slate-50 rounded-xl lg:rounded-none lg:border-0 lg:border-b border border-slate-100 flex items-center justify-center overflow-hidden flex-shrink-0 relative">
                  {a.foto_url ? (
                    <img
                      src={a.foto_url}
                      alt={a.nama_aset}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <ImageIcon size={21} className="text-slate-300" />
                  )}
                </div>

                {/* Container Konten */}
                <div className="flex-1 min-w-0 flex flex-col justify-between py-2 lg:p-13">
                  <div className="flex flex-col">
                    {/* Header Mobile: Kode & Kondisi */}
                    <div className="flex justify-between items-start gap-5 lg:hidden mb-2">
                      <span className="text-[9px] font-mono bg-teal-50 text-teal-700 px-5 py-2 rounded-md font-bold uppercase tracking-wider truncate">
                        {a.kode_aset || '—'}
                      </span>
                      <span className={cn("text-[9px] font-bold px-2 py-1 rounded-md shrink-0", kondisiBadge(a.status_kondisi))}>
                        {a.status_kondisi}
                      </span>
                    </div>

                    {/* Name */}
                    <h3 
                      onClick={() => navigate(`/harta-benda/aset/${a.id}`)}
                      className="text-sm font-bold text-slate-800 leading-tight truncate mb-2 cursor-pointer hover:text-teal-600 transition-colors"
                    >
                      {a.nama_aset}
                    </h3>

                    {/* Kategori / Kelompok */}
                    <p className="text-[10px] font-medium text-slate-500 truncate mt-2 lg:mt-0">
                      <span>{a.kelompok?.nama || ''}</span>
                      {a.sub_kelompok?.nama && (
                        <>
                          <span className="text-slate-300 mx-2">/</span>
                          <span>{a.sub_kelompok.nama}</span>
                        </>
                      )}
                    </p>

                    {/* Kode Aset / SKU (Desktop Only) */}
                    <h4 className="hidden lg:block text-[10px] font-mono text-slate-400 truncate mt-2">
                      {a.kode_aset || '—'}
                    </h4>
                  </div>

                  {/* Footer: Harga & Tombol Aksi */}
                  <div className="flex justify-between items-center mt-8 lg:mt-13 pt-5 lg:pt-8 border-t border-slate-50">
                    <div className="flex flex-col min-w-0">
                      <span className="hidden lg:block text-[10px] font-semibold text-slate-500 mb-3">
                        Kondisi: <span className={cn("font-bold px-1.5 py-0.5 rounded text-[9px]", kondisiBadge(a.status_kondisi))}>{a.status_kondisi}</span>
                      </span>
                      <span className="text-xs font-black text-emerald-600 leading-none whitespace-nowrap truncate">
                        {formatRupiah(a.harga_beli)}
                      </span>
                      <span className="text-[9px] text-slate-400 font-medium mt-1">
                        {a.tanggal_perolehan}
                      </span>
                    </div>

                    <div className="flex gap-2 shrink-0">
                      <button
                        onClick={() => navigate(`/harta-benda/aset/${a.id}`)}
                        className="text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors px-3 py-1.5 flex items-center justify-center text-[10px] font-bold"
                        title="Detail"
                      >
                        Detail
                      </button>
                      {isAdmin && (
                        <>
                          <button
                            onClick={() => handleEdit(a)}
                            className="text-teal-600 bg-teal-50 hover:bg-teal-100 rounded-lg transition-colors p-2 flex items-center justify-center"
                            title="Edit"
                          >
                            <Pencil size={14} strokeWidth={2.5} />
                          </button>
                          <button
                            onClick={() => handleDelete(a)}
                            className="text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors p-2 flex items-center justify-center"
                            title="Hapus"
                          >
                            <Trash2 size={14} strokeWidth={2.5} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
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
        <Card className="p-0 overflow-hidden shadow-sm border-slate-200 rounded-2xl">
          <Table headers={['Kode / Nama Aset', 'Kelompok', 'Merek / No. Seri', 'Lokasi & PIC', 'Kondisi', 'Harga Beli', 'Aksi']}>
            {paged.map(a => (
              <tr key={a.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3">
                  <p
                    onClick={() => navigate(`/harta-benda/aset/${a.id}`)}
                    className="text-xs font-bold text-slate-800 cursor-pointer hover:text-teal-600 transition-colors"
                  >
                    {a.nama_aset}
                  </p>
                  <p className="font-mono text-[10px] text-teal-600 font-bold mt-0.5">{a.kode_aset || '—'}</p>
                </td>
                <td className="px-4 py-3">
                  <p className="text-xs font-medium text-slate-700">{a.kelompok?.nama || '—'}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{a.sub_kelompok?.nama || ''}</p>
                </td>
                <td className="px-4 py-3">
                  <p className="text-xs font-medium text-slate-700">{a.merek_tipe || '—'}</p>
                  <p className="font-mono text-[10px] text-slate-400 mt-0.5">{a.nomor_seri_plat || '—'}</p>
                </td>
                <td className="px-4 py-3">
                  <p className="text-xs text-slate-700">{a.lokasi_ruangan || '—'}</p>
                  {a.penanggung_jawab && (
                    <p className="text-[10px] text-slate-400 mt-0.5">{a.penanggung_jawab}</p>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span className={cn("text-[9px] font-bold px-2 py-1 rounded-md", kondisiBadge(a.status_kondisi))}>
                    {a.status_kondisi}
                  </span>
                </td>
                <td className="px-4 py-3 font-mono text-xs font-bold text-emerald-600">
                  {formatRupiah(a.harga_beli)}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => navigate(`/harta-benda/aset/${a.id}`)}
                      className="px-2.5 py-1 bg-teal-50 hover:bg-teal-100 text-teal-700 font-bold text-[10px] rounded-lg transition-colors"
                    >
                      Detail
                    </button>
                    {isAdmin && (
                      <>
                        <button
                          onClick={() => handleEdit(a)}
                          className="p-1 text-slate-400 hover:text-teal-600 rounded-lg transition-colors"
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          onClick={() => handleDelete(a)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded-lg transition-colors"
                        >
                          <Trash2 size={13} />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </Table>

          <div className="p-3 border-t border-slate-100">
            <Pagination
              total={filtered.length}
              perPage={perPage}
              currentPage={currentPage}
              onPageChange={setCurrentPage}
              onPerPageChange={setPerPage}
            />
          </div>
        </Card>
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
              <h3 className="text-lg font-black text-slate-800 tracking-tight mb-8">Hapus Data Aset?</h3>
              <p className="text-xs text-slate-500 leading-relaxed max-w-sm">
                Yakin ingin menghapus aset <span className="font-bold text-slate-700">"{itemToDelete?.nama_aset}"</span>? Tindakan ini tidak dapat dibatalkan.
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

      {/* Modal Kategori */}
      {showKategoriModal && (
        <ModalKategoriAset
          onClose={() => setShowKategoriModal(false)}
        />
      )}

    </div>
  );
}