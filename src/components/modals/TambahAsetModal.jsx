import { useState, useEffect } from 'react';
import {
  X, Loader2, Tag, Info, Car, Clock,
  AlertCircle, Image as ImageIcon, Paperclip, ShieldCheck
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import useHartaBendaStore from '../../store/HartaBenda/useHartaBendaStore';
import { useToast } from '../ui/Toast';

// ─── Konstanta ─────────────────────────────────────────────────────────────────

const KONDISI_OPTIONS = [
  { label: 'Baik', value: 'Baik' },
  { label: 'Rusak Ringan', value: 'Rusak Ringan' },
  { label: 'Rusak Berat', value: 'Rusak Berat' },
];

const SATUAN_OPTIONS = [
  { value: 'Unit', label: 'Unit' },
  { value: 'M2', label: 'M²' },
  { value: 'Buah', label: 'Buah' },
  { value: 'Set', label: 'Set' },
];

const EMPTY = {
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
  // km
  no_polisi: '',
  km_saat_ini: '',
  interval_km: '5000',
  // bulan
  interval_bulan: '3',
  tanggal_servis_terakhir: new Date().toISOString().split('T')[0],
  // bmn
  kode_bmn: '',
  nup: '',
  satuan: 'Unit',
  masa_manfaat_bulan: '',
  jenis_bmn: 'Intrakomptabel',
  status_operasional: 'Aktif',
};

// ─── Field helpers (Font & Style 100% Identik dengan Logistik Input.jsx) ──────

function FieldInput({ label, required, error, className, ...props }) {
  return (
    <div className="flex flex-col gap-5 w-full">
      {label && (
        <label className="text-xs font-semibold text-slate-500 tracking-wide uppercase flex items-center gap-1">
          {label}
          {required && <span className="text-rose-500">*</span>}
        </label>
      )}
      <input
        className={`w-full px-13 py-8 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 placeholder:text-slate-400 outline-none ring-0 transition-all duration-150 focus:border-teal-500 focus:ring-2 focus:ring-teal-100 disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed ${
          error ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-100 bg-rose-50/20' : ''
        } ${className || ''}`}
        {...props}
      />
      {error && (
        <p className="text-[10px] text-rose-500 font-semibold flex items-center gap-1 mt-1">
          <AlertCircle size={11} /> {error}
        </p>
      )}
    </div>
  );
}

function FieldSelect({ label, required, error, children, ...props }) {
  return (
    <div className="flex flex-col gap-5 w-full">
      {label && (
        <label className="text-xs font-semibold text-slate-500 tracking-wide uppercase flex items-center gap-1">
          {label}
          {required && <span className="text-rose-500">*</span>}
        </label>
      )}
      <select
        className={`w-full px-13 py-8 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 outline-none ring-0 transition-all duration-150 focus:border-teal-500 focus:ring-2 focus:ring-teal-100 disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed ${
          error ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-100' : ''
        }`}
        {...props}
      >
        {children}
      </select>
      {error && (
        <p className="text-[10px] text-rose-500 font-semibold flex items-center gap-1 mt-1">
          <AlertCircle size={11} /> {error}
        </p>
      )}
    </div>
  );
}

// ─── Komponen Utama ────────────────────────────────────────────────────────────

export default function TambahAsetModal({ open, onClose, onSuccess }) {
  const {
    kelompokAset,
    subKelompokAset,
    addAset,
    fetchDataHartaBenda,
    fetchKelompokAset,
    fetchSubKelompokAset,
  } = useHartaBendaStore();

  const toast = useToast();

  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [uploading, setUploading] = useState(false);
  const [fotoFile, setFotoFile] = useState(null);
  const [fotoPreview, setFotoPreview] = useState(null);
  const [lampiranFile, setLampiranFile] = useState(null);
  const [lampiranPreview, setLampiranPreview] = useState(null);
  const [kodePreview, setKodePreview] = useState('');
  const [loadingKode, setLoadingKode] = useState(false);

  // Fetch kelompok saat modal dibuka
  useEffect(() => {
    if (!open) return;
    if (kelompokAset.length === 0) fetchKelompokAset();
    if (subKelompokAset.length === 0) fetchSubKelompokAset();
  }, [open]);

  // Reset saat modal ditutup
  useEffect(() => {
    if (!open) {
      setForm(EMPTY);
      setErrors({});
      setFotoFile(null);
      setFotoPreview(null);
      setLampiranFile(null);
      setLampiranPreview(null);
      setKodePreview('');
    }
  }, [open]);

  // Generate kode preview saat kelompok berubah
  useEffect(() => {
    if (!form.kelompok_id) { setKodePreview(''); return; }
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
  }, [form.kelompok_id]);

  const filteredSub = subKelompokAset.filter(
    s => String(s.kelompok_id) === String(form.kelompok_id)
  );

  const maintenanceType = form.sub_kelompok_id
    ? (subKelompokAset.find(s => String(s.id) === String(form.sub_kelompok_id))?.maintenance_type || null)
    : null;

  const setField = (key, value) => {
    setForm(f => ({ ...f, [key]: value }));
    if (errors[key]) setErrors(e => ({ ...e, [key]: '' }));
  };

  const handleFotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setFotoFile(file);
    const reader = new FileReader();
    reader.onload = ev => setFotoPreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const handleLampiranChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setLampiranFile(file);
    const reader = new FileReader();
    reader.onload = ev => setLampiranPreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const uploadFoto = async (file) => {
    const ext = file.name.split('.').pop();
    const path = `aset/foto/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from('images').upload(path, file);
    if (error) throw new Error(error.message);
    return supabase.storage.from('images').getPublicUrl(path).data.publicUrl;
  };

  const uploadLampiran = async (file) => {
    const ext = file.name.split('.').pop();
    const path = `aset/lampiran/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from('images').upload(path, file);
    if (error) throw new Error(error.message);
    return supabase.storage.from('images').getPublicUrl(path).data.publicUrl;
  };

  const validate = () => {
    const e = {};
    if (!form.kelompok_id) e.kelompok_id = 'Pilih kelompok aset';
    if (!form.sub_kelompok_id) e.sub_kelompok_id = 'Pilih sub-kelompok aset';
    if (!form.nama_aset.trim()) e.nama_aset = 'Nama aset wajib diisi';
    if (!form.lokasi_ruangan.trim()) e.lokasi_ruangan = 'Lokasi / ruangan wajib diisi';
    if (form.harga_beli !== '' && Number(form.harga_beli) < 0) e.harga_beli = 'Harga beli tidak boleh negatif';

    if (maintenanceType === 'km') {
      if (form.km_saat_ini === '' || Number(form.km_saat_ini) < 0)
        e.km_saat_ini = 'KM saat ini wajib diisi (minimal 0)';
      if (!form.interval_km || Number(form.interval_km) <= 0)
        e.interval_km = 'Interval KM harus lebih dari 0';
    }
    if (maintenanceType === 'bulan') {
      if (!form.interval_bulan || Number(form.interval_bulan) <= 0)
        e.interval_bulan = 'Interval bulan harus lebih dari 0';
    }
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setUploading(true);
    try {
      let fotoUrl = null;
      if (fotoFile) fotoUrl = await uploadFoto(fotoFile);

      let lampiranUrl = null;
      if (lampiranFile) lampiranUrl = await uploadLampiran(lampiranFile);

      const mType = maintenanceType || 'tidak';

      const payload = {
        kode_aset: kodePreview && kodePreview !== '—' ? kodePreview : undefined,
        kelompok_id: Number(form.kelompok_id),
        sub_kelompok_id: Number(form.sub_kelompok_id),
        nama_aset: form.nama_aset.trim(),
        merek_tipe: form.merek_tipe.trim() || null,
        nomor_seri_plat: form.nomor_seri_plat.trim() || null,
        lokasi_ruangan: form.lokasi_ruangan.trim(),
        penanggung_jawab: form.penanggung_jawab.trim() || null,
        tanggal_perolehan: form.tanggal_perolehan,
        harga_beli: Number(form.harga_beli) || 0,
        status_kondisi: form.status_kondisi,
        foto_url: fotoUrl,
        lampiran_url: lampiranUrl,
        maintenance_type: mType,
        no_polisi: mType === 'km' ? (form.no_polisi.trim() || null) : null,
        km_saat_ini: mType === 'km' ? Number(form.km_saat_ini) : null,
        km_terakhir_servis: mType === 'km' ? Number(form.km_saat_ini) : null,
        interval_km: mType === 'km' ? Number(form.interval_km) : null,
        interval_bulan: mType === 'bulan' ? Number(form.interval_bulan) : null,
        tanggal_servis_terakhir: mType === 'bulan' ? (form.tanggal_servis_terakhir || null) : null,
        // bmn
        kode_bmn: form.kode_bmn.trim() || null,
        nup: form.nup ? Number(form.nup) : null,
        satuan: form.satuan || 'Unit',
        masa_manfaat_bulan: form.masa_manfaat_bulan ? Number(form.masa_manfaat_bulan) : null,
        jenis_bmn: form.jenis_bmn || 'Intrakomptabel',
        status_operasional: form.status_operasional || 'Aktif',
      };

      const ok = await addAset(payload);
      if (ok) {
        toast.success(`Aset "${payload.nama_aset}" berhasil ditambahkan!`);
        await fetchDataHartaBenda();
        onSuccess?.();
        onClose();
      }
    } catch (err) {
      toast.error('Gagal menyimpan aset: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className="relative bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-2xl my-6 z-10 overflow-hidden animate-in fade-in zoom-in-95 duration-150">

        {/* ── Header ───────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-6 py-4 bg-teal-600 text-white shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center text-white shrink-0">
              <ShieldCheck size={18} strokeWidth={2.5} />
            </div>
            <div>
              <h2 className="text-base font-black tracking-tight leading-tight">Registrasi Aset Baru</h2>
              <p className="text-[11px] text-teal-100 font-medium">Daftarkan aset baru ke dalam sistem Harta Benda</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 flex items-center justify-center text-white transition-all shrink-0"
            title="Tutup"
          >
            <X size={16} strokeWidth={2.5} />
          </button>
        </div>

        {/* ── Form Body ─────────────────────────────────────────────────── */}
        <form onSubmit={handleSubmit} className="p-6 space-y-21 overflow-y-auto max-h-[75vh]">

          {/* SEKSI 1: KATEGORI */}
          <section className="space-y-13">
            <p className="text-xs font-bold text-teal-700 uppercase tracking-wide flex items-center gap-1.5 border-b border-slate-100 pb-2">
              <Tag size={14} strokeWidth={2.5} /> Kategori Aset
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-13">
              <FieldSelect
                label="Kelompok Aset"
                required
                value={form.kelompok_id}
                error={errors.kelompok_id}
                onChange={e => {
                  setField('kelompok_id', e.target.value);
                  setField('sub_kelompok_id', '');
                }}
              >
                <option value="">— Pilih Kelompok —</option>
                {kelompokAset.map(k => (
                  <option key={k.id} value={k.id}>{k.nama}</option>
                ))}
              </FieldSelect>

              <FieldSelect
                label="Sub-Kelompok Aset"
                required
                value={form.sub_kelompok_id}
                error={errors.sub_kelompok_id}
                disabled={!form.kelompok_id}
                onChange={e => setField('sub_kelompok_id', e.target.value)}
              >
                <option value="">— Pilih Sub-Kelompok —</option>
                {filteredSub.map(s => (
                  <option key={s.id} value={s.id}>{s.nama}</option>
                ))}
              </FieldSelect>
            </div>

            {/* Kode Aset Preview (Tanpa Tulisan Otomatis) */}
            {form.kelompok_id && (
              <div className="mt-2 flex items-center justify-between bg-teal-50/50 border border-teal-100/80 rounded-xl px-4 py-3">
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs font-semibold text-slate-500 tracking-wide uppercase">
                    Kode Aset
                  </span>
                  <span className="font-mono text-sm font-black text-teal-800 tracking-wider flex items-center gap-1.5">
                    {loadingKode
                      ? <Loader2 size={13} className="animate-spin text-teal-600" />
                      : (kodePreview || '—')
                    }
                  </span>
                </div>
              </div>
            )}
          </section>

          {/* SEKSI 2: INFORMASI ASET */}
          <section className="space-y-13 pt-1">
            <p className="text-xs font-bold text-teal-700 uppercase tracking-wide flex items-center gap-1.5 border-b border-slate-100 pb-2">
              <Info size={14} strokeWidth={2.5} /> Informasi Aset
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-13">
              <FieldInput
                label="Nama Aset" required
                placeholder="contoh: AC Split Samsung 1.5 PK"
                value={form.nama_aset}
                error={errors.nama_aset}
                onChange={e => setField('nama_aset', e.target.value)}
              />
              <FieldInput
                label="Merek / Tipe"
                placeholder="contoh: Samsung / AR13TYHQB"
                value={form.merek_tipe}
                onChange={e => setField('merek_tipe', e.target.value)}
              />
              <FieldInput
                label="Nomor Seri / Plat"
                placeholder="contoh: SN-2024-001"
                value={form.nomor_seri_plat}
                onChange={e => setField('nomor_seri_plat', e.target.value)}
              />
              <FieldInput
                label="Lokasi / Ruangan" required
                placeholder="contoh: Ruang Rapat Lantai 2"
                value={form.lokasi_ruangan}
                error={errors.lokasi_ruangan}
                onChange={e => setField('lokasi_ruangan', e.target.value)}
              />
              <FieldInput
                label="Penanggung Jawab"
                placeholder="contoh: Budi Santoso"
                value={form.penanggung_jawab}
                onChange={e => setField('penanggung_jawab', e.target.value)}
              />
              <FieldInput
                label="Harga Beli (Rp)"
                type="number" min="0"
                placeholder="0"
                value={form.harga_beli}
                error={errors.harga_beli}
                onChange={e => setField('harga_beli', e.target.value)}
              />
              <FieldInput
                label="Tanggal Perolehan" required
                type="date"
                value={form.tanggal_perolehan}
                onChange={e => setField('tanggal_perolehan', e.target.value)}
              />
              <FieldSelect
                label="Kondisi Awal" required
                value={form.status_kondisi}
                onChange={e => setField('status_kondisi', e.target.value)}
              >
                {KONDISI_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </FieldSelect>
            </div>
          </section>

          {/* SEKSI 3: INFORMASI BMN (OPSIONAL) */}
          <section className="space-y-13 pt-1">
            <p className="text-xs font-bold text-teal-700 uppercase tracking-wide flex items-center gap-1.5 border-b border-slate-100 pb-2">
              <ShieldCheck size={14} strokeWidth={2.5} /> Informasi BMN (Opsional)
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-13">
              <FieldSelect
                label="Jenis Aset BMN"
                value={form.jenis_bmn}
                onChange={e => setField('jenis_bmn', e.target.value)}
              >
                <option value="Intrakomptabel">Intrakomptabel</option>
                <option value="Ekstrakomptabel">Ekstrakomptabel</option>
              </FieldSelect>
              <FieldSelect
                label="Status Operasional"
                value={form.status_operasional}
                onChange={e => setField('status_operasional', e.target.value)}
              >
                <option value="Aktif">Aktif</option>
                <option value="Usul Hapus">Usul Hapus</option>
                <option value="Dihapuskan">Dihapuskan</option>
              </FieldSelect>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-13">
              <div>
                <FieldInput
                  label="Kode Barang BMN"
                  placeholder="Contoh: 3.02.01.01.002"
                  value={form.kode_bmn}
                  onChange={e => setField('kode_bmn', e.target.value)}
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Boleh sama untuk beberapa unit sejenis (dibedakan lewat NUP)
                </p>
              </div>
              <FieldInput
                label="NUP"
                type="number"
                placeholder="Kosongkan untuk dihitung otomatis"
                value={form.nup}
                onChange={e => setField('nup', e.target.value)}
              />
              <FieldSelect
                label="Satuan"
                value={form.satuan}
                onChange={e => setField('satuan', e.target.value)}
              >
                {SATUAN_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </FieldSelect>
              <FieldInput
                label="Masa Manfaat (bulan)"
                type="number"
                placeholder="Contoh: 48"
                value={form.masa_manfaat_bulan}
                onChange={e => setField('masa_manfaat_bulan', e.target.value)}
              />
            </div>
          </section>

          {/* SEKSI 4: FOTO ASET (OPSIONAL) */}
          <section className="space-y-8 pt-1">
            <p className="text-xs font-bold text-teal-700 uppercase tracking-wide flex items-center gap-1.5 border-b border-slate-100 pb-2">
              <ImageIcon size={14} strokeWidth={2.5} /> Foto Aset (Opsional)
            </p>
            <label className="flex flex-col items-center justify-center w-full border-2 border-dashed border-slate-200 rounded-2xl cursor-pointer bg-slate-50/60 hover:bg-teal-50/30 hover:border-teal-300 transition-all group min-h-[95px] p-3">
              <input
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={handleFotoChange}
              />
              {fotoPreview ? (
                <img
                  src={fotoPreview}
                  alt="Preview"
                  className="w-full max-h-44 object-contain rounded-xl"
                />
              ) : (
                <div className="flex flex-col items-center gap-1.5 py-4 text-slate-400 group-hover:text-teal-600 transition-colors">
                  <ImageIcon size={22} strokeWidth={2} />
                  <span className="text-xs font-bold">Klik untuk memilih foto aset</span>
                  <span className="text-[10px] text-slate-400 font-medium">Format: JPG, PNG, WEBP</span>
                </div>
              )}
            </label>
          </section>

          {/* SEKSI 5: UPLOAD LAMPIRAN (OPSIONAL) */}
          <section className="space-y-8 pt-1">
            <p className="text-xs font-bold text-teal-700 uppercase tracking-wide flex items-center gap-1.5 border-b border-slate-100 pb-2">
              <Paperclip size={14} strokeWidth={2.5} /> Upload Lampiran (Opsional)
            </p>
            <label className="flex flex-col items-center justify-center w-full border-2 border-dashed border-slate-200 rounded-2xl cursor-pointer bg-slate-50/60 hover:bg-teal-50/30 hover:border-teal-300 transition-all group min-h-[85px] p-3">
              <input
                type="file"
                accept="image/*,application/pdf"
                className="sr-only"
                onChange={handleLampiranChange}
              />
              {lampiranPreview ? (
                lampiranFile?.type?.startsWith('image/') ? (
                  <img
                    src={lampiranPreview}
                    alt="Preview Lampiran"
                    className="w-full max-h-36 object-contain rounded-xl"
                  />
                ) : (
                  <div className="flex items-center gap-2 text-xs font-bold text-teal-700">
                    <Paperclip size={15} /> {lampiranFile?.name}
                  </div>
                )
              ) : (
                <div className="flex flex-col items-center gap-1 text-slate-400 group-hover:text-teal-600 transition-colors py-2.5">
                  <Paperclip size={18} strokeWidth={2} />
                  <span className="text-xs font-bold">Klik untuk mengunggah dokumen/lampiran (Opsional)</span>
                  <span className="text-[10px] text-slate-400 font-medium">Format: Gambar atau PDF</span>
                </div>
              )}
            </label>
          </section>

          {/* SEKSI 6: FIELD KONDISIONAL (maintenance_type) */}
          {form.sub_kelompok_id && (
            <section className="pt-1">
              {maintenanceType === 'km' && (
                <div className="bg-blue-50/60 border border-blue-100 rounded-2xl p-4 space-y-13">
                  <p className="text-xs font-bold text-blue-700 uppercase tracking-wide flex items-center gap-1.5">
                    <Car size={14} strokeWidth={2.5} /> Informasi Kendaraan — Servis Berbasis KM
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-13">
                    <FieldInput
                      label="No. Polisi"
                      placeholder="B 1234 XYZ"
                      value={form.no_polisi}
                      className="bg-white"
                      onChange={e => setField('no_polisi', e.target.value)}
                    />
                    <FieldInput
                      label="KM Saat Ini" required
                      type="number" min="0"
                      placeholder="0"
                      value={form.km_saat_ini}
                      error={errors.km_saat_ini}
                      className="bg-white"
                      onChange={e => setField('km_saat_ini', e.target.value)}
                    />
                    <FieldInput
                      label="Interval Servis (KM)" required
                      type="number" min="1"
                      placeholder="5000"
                      value={form.interval_km}
                      error={errors.interval_km}
                      className="bg-white"
                      onChange={e => setField('interval_km', e.target.value)}
                    />
                  </div>
                </div>
              )}

              {maintenanceType === 'bulan' && (
                <div className="bg-violet-50/60 border border-violet-100 rounded-2xl p-4 space-y-13">
                  <p className="text-xs font-bold text-violet-700 uppercase tracking-wide flex items-center gap-1.5">
                    <Clock size={14} strokeWidth={2.5} /> Jadwal Servis Berkala — Berbasis Bulan
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-13">
                    <FieldInput
                      label="Interval Servis (Bulan)" required
                      type="number" min="1"
                      placeholder="3"
                      value={form.interval_bulan}
                      error={errors.interval_bulan}
                      className="bg-white"
                      onChange={e => setField('interval_bulan', e.target.value)}
                    />
                    <FieldInput
                      label="Tanggal Servis Terakhir"
                      type="date"
                      value={form.tanggal_servis_terakhir}
                      className="bg-white"
                      onChange={e => setField('tanggal_servis_terakhir', e.target.value)}
                    />
                  </div>
                </div>
              )}

              {maintenanceType === 'tidak' && (
                <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                    <Info size={15} className="text-slate-500" strokeWidth={2.5} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800">Tanpa Jadwal Servis Rutin</p>
                    <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                      Aset dalam sub-kelompok ini tidak memerlukan perawatan berkala. Perbaikan hanya dilakukan apabila ada laporan kerusakan dari pengguna.
                    </p>
                  </div>
                </div>
              )}
            </section>
          )}

          {/* ── Footer Aksi ──────────────────────────────────────────────── */}
          <div className="flex items-center justify-end gap-8 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={uploading}
              className="px-5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 active:scale-95 transition-all select-none disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={uploading}
              className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-xs font-bold text-white shadow-sm active:scale-95 transition-all select-none disabled:opacity-60 flex items-center gap-2"
            >
              {uploading
                ? <><Loader2 size={14} className="animate-spin" /> Menyimpan...</>
                : '🛡️ Simpan Aset'
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
