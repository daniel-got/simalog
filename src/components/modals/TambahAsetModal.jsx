import { useState, useEffect } from 'react';
import {
  X, Loader2, Tag, Info, Car, Clock,
  AlertCircle, CheckCircle, Image as ImageIcon, Paperclip
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import useHartaBendaStore from '../../store/HartaBenda/useHartaBendaStore';

// ─── Konstanta ─────────────────────────────────────────────────────────────────

const KONDISI_OPTIONS = [
  { label: 'Baik', value: 'Baik' },
  { label: 'Rusak Ringan', value: 'Rusak Ringan' },
  { label: 'Rusak Berat', value: 'Rusak Berat' },
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
};

// ─── Field helpers ─────────────────────────────────────────────────────────────

function FieldInput({ label, required, hint, error, className, ...props }) {
  return (
    <div className="flex flex-col gap-2 w-full">
      {label && (
        <label className="text-[10px] font-bold text-slate-500 tracking-widest uppercase flex items-center gap-2">
          {label}
          {required && <span className="text-red-400">*</span>}
          {hint && <span className="text-slate-400 font-medium normal-case tracking-normal">— {hint}</span>}
        </label>
      )}
      <input
        className={`w-full px-3 py-2 rounded-xl border text-sm text-slate-800 placeholder:text-slate-300 outline-none ring-0 transition-all
          focus:ring-2 disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed
          ${error
            ? 'border-red-300 focus:border-red-400 focus:ring-red-100 bg-red-50/30'
            : 'border-slate-200 bg-white focus:border-teal-500 focus:ring-teal-100'
          } ${className || ''}`}
        {...props}
      />
      {error && (
        <p className="text-[10px] text-red-500 font-medium flex items-center gap-1">
          <AlertCircle size={10} /> {error}
        </p>
      )}
    </div>
  );
}

function FieldSelect({ label, required, error, children, ...props }) {
  return (
    <div className="flex flex-col gap-2 w-full">
      {label && (
        <label className="text-[10px] font-bold text-slate-500 tracking-widest uppercase flex items-center gap-2">
          {label}
          {required && <span className="text-red-400">*</span>}
        </label>
      )}
      <select
        className={`w-full px-3 py-2 rounded-xl border bg-white text-sm text-slate-800 outline-none ring-0 transition-all
          focus:ring-2 disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed
          ${error
            ? 'border-red-300 focus:border-red-400 focus:ring-red-100'
            : 'border-slate-200 focus:border-teal-500 focus:ring-teal-100'
          }`}
        {...props}
      >
        {children}
      </select>
      {error && (
        <p className="text-[10px] text-red-500 font-medium flex items-center gap-1">
          <AlertCircle size={10} /> {error}
        </p>
      )}
    </div>
  );
}

// ─── Komponen Utama ────────────────────────────────────────────────────────────

/**
 * TambahAsetModal
 *
 * Props:
 *   open      : boolean  — tampilkan modal
 *   onClose   : fn()     — tutup modal
 *   onSuccess : fn()     — callback setelah berhasil insert (untuk re-fetch)
 */
export default function TambahAsetModal({ open, onClose, onSuccess }) {
  const {
    kelompokAset,
    subKelompokAset,
    addAset,
    fetchDataHartaBenda,
    fetchKelompokAset,
    fetchSubKelompokAset,
  } = useHartaBendaStore();

  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [uploading, setUploading] = useState(false);
  const [fotoFile, setFotoFile] = useState(null);
  const [fotoPreview, setFotoPreview] = useState(null);
  const [kodePreview, setKodePreview] = useState('');
  const [loadingKode, setLoadingKode] = useState(false);
  const [toast, setToast] = useState(null); // { type: 'success'|'error', msg }

  // ── Fetch kelompok saat modal dibuka ────────────────────────────────────
  useEffect(() => {
    if (!open) return;
    if (kelompokAset.length === 0) fetchKelompokAset();
    if (subKelompokAset.length === 0) fetchSubKelompokAset();
  }, [open]);

  // ── Reset saat modal ditutup ─────────────────────────────────────────────
  useEffect(() => {
    if (!open) {
      setForm(EMPTY);
      setErrors({});
      setFotoFile(null);
      setFotoPreview(null);
      setKodePreview('');
      setToast(null);
    }
  }, [open]);

  // ── Generate kode preview saat kelompok berubah ─────────────────────────
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

  // ── Helpers ──────────────────────────────────────────────────────────────
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

  // ── Foto picker ──────────────────────────────────────────────────────────
  const handleFotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setFotoFile(file);
    const reader = new FileReader();
    reader.onload = ev => setFotoPreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  // ── Upload ke Supabase Storage ───────────────────────────────────────────
  const uploadFoto = async (file) => {
    const ext = file.name.split('.').pop();
    const path = `aset/foto/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from('images').upload(path, file);
    if (error) throw new Error(error.message);
    return supabase.storage.from('images').getPublicUrl(path).data.publicUrl;
  };

  // ── Validasi ─────────────────────────────────────────────────────────────
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

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setUploading(true);
    try {
      let fotoUrl = null;
      if (fotoFile) fotoUrl = await uploadFoto(fotoFile);

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
        maintenance_type: mType,
        // Kendaraan
        no_polisi: mType === 'km' ? (form.no_polisi.trim() || null) : null,
        km_saat_ini: mType === 'km' ? Number(form.km_saat_ini) : null,
        km_terakhir_servis: mType === 'km' ? Number(form.km_saat_ini) : null, // titik awal
        interval_km: mType === 'km' ? Number(form.interval_km) : null,
        // Servis berkala
        interval_bulan: mType === 'bulan' ? Number(form.interval_bulan) : null,
        tanggal_servis_terakhir: mType === 'bulan' ? (form.tanggal_servis_terakhir || null) : null,
      };

      const ok = await addAset(payload);
      if (ok) {
        setToast({ type: 'success', msg: `Aset "${payload.nama_aset}" berhasil ditambahkan!` });
        await fetchDataHartaBenda();
        setTimeout(() => {
          onSuccess?.();
          onClose();
        }, 1200);
      }
    } catch (err) {
      setToast({ type: 'error', msg: 'Gagal menyimpan: ' + err.message });
    } finally {
      setUploading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-start justify-center p-4 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-2xl my-8 z-10 overflow-hidden">

        {/* ── Toast Notifikasi ──────────────────────────────────────────── */}
        {toast && (
          <div className={`absolute top-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 px-4 py-2 rounded-xl shadow-lg text-sm font-semibold transition-all
            ${toast.type === 'success'
              ? 'bg-emerald-600 text-white'
              : 'bg-red-600 text-white'
            }`}
          >
            {toast.type === 'success'
              ? <CheckCircle size={14} />
              : <AlertCircle size={14} />
            }
            {toast.msg}
          </div>
        )}

        {/* ── Header ───────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-teal-600 to-teal-500 shrink-0">
          <div>
            <p className="text-sm font-black text-white tracking-tight">🛡️ Registrasi Aset Baru</p>
            <p className="text-[10px] text-teal-100/80 font-medium mt-0.5">Daftarkan aset baru ke dalam sistem</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-white/15 hover:bg-white/25 flex items-center justify-center text-white transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* ── Form ─────────────────────────────────────────────────────── */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto max-h-[75vh]">

          {/* SEKSI 1: KATEGORI */}
          <section>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
              <Tag size={11} /> Kategori Aset
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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

            {/* Kode Aset Preview */}
            {form.kelompok_id && (
              <div className="mt-3 flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5">
                <div className="flex flex-col gap-0.5 flex-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    Kode Aset (Auto-Generate)
                  </span>
                  <span className="font-mono text-base font-black text-teal-700 tracking-widest flex items-center gap-1.5">
                    {loadingKode
                      ? <Loader2 size={14} className="animate-spin text-slate-400" />
                      : (kodePreview || '—')
                    }
                  </span>
                </div>
                <span className="text-[9px] text-slate-400 text-right leading-relaxed">
                  Dikonfirmasi saat<br />data disimpan
                </span>
              </div>
            )}
          </section>

          {/* SEKSI 2: INFORMASI UTAMA */}
          <section>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
              <Info size={11} /> Informasi Aset
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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

          {/* SEKSI 3: FOTO */}
          <section>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
              <ImageIcon size={11} /> Foto Aset
            </p>
            <label className="flex flex-col items-center justify-center w-full border-2 border-dashed border-slate-200 rounded-2xl cursor-pointer bg-slate-50/70 hover:bg-teal-50/40 hover:border-teal-300 transition-all group min-h-[100px]">
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
                  className="w-full max-h-48 object-contain rounded-2xl"
                />
              ) : (
                <div className="flex flex-col items-center gap-2 py-6 text-slate-400 group-hover:text-teal-500 transition-colors">
                  <ImageIcon size={24} />
                  <span className="text-xs font-semibold">Klik untuk pilih foto</span>
                  <span className="text-[10px] text-slate-300">JPG, PNG, WEBP</span>
                </div>
              )}
            </label>
          </section>

          {/* SEKSI 4: FIELD KONDISIONAL (maintenance_type) */}
          {form.sub_kelompok_id && (
            <section>
              {maintenanceType === 'km' && (
                <div className="bg-blue-50/70 border border-blue-100 rounded-2xl p-4">
                  <p className="text-[10px] font-black text-blue-700 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                    <Car size={11} /> Informasi Kendaraan — Servis Berbasis KM
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
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
                      hint="default 5.000"
                      placeholder="5000"
                      value={form.interval_km}
                      error={errors.interval_km}
                      className="bg-white"
                      onChange={e => setField('interval_km', e.target.value)}
                    />
                  </div>
                  <p className="text-[10px] text-blue-400 mt-2 italic">
                    * KM Terakhir Servis otomatis diset sama dengan KM Saat Ini (titik awal pencatatan).
                  </p>
                </div>
              )}

              {maintenanceType === 'bulan' && (
                <div className="bg-violet-50/70 border border-violet-100 rounded-2xl p-4">
                  <p className="text-[10px] font-black text-violet-700 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                    <Clock size={11} /> Jadwal Servis Berkala — Berbasis Bulan
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <FieldInput
                      label="Interval Servis (Bulan)" required
                      type="number" min="1"
                      hint="default 3"
                      placeholder="3"
                      value={form.interval_bulan}
                      error={errors.interval_bulan}
                      className="bg-white"
                      onChange={e => setField('interval_bulan', e.target.value)}
                    />
                    <FieldInput
                      label="Tanggal Servis Terakhir"
                      type="date"
                      hint="opsional, default hari ini"
                      value={form.tanggal_servis_terakhir}
                      className="bg-white"
                      onChange={e => setField('tanggal_servis_terakhir', e.target.value)}
                    />
                  </div>
                </div>
              )}

              {maintenanceType === 'tidak' && (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                    <Info size={14} className="text-slate-500" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-700">Tanpa Jadwal Servis Rutin</p>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      Aset dalam sub-kelompok ini tidak memerlukan perawatan berkala.
                      Perbaikan hanya dilakukan apabila ada laporan kerusakan dari pengguna.
                    </p>
                  </div>
                </div>
              )}
            </section>
          )}

          {/* ── Footer Aksi ──────────────────────────────────────────────── */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={uploading}
              className="px-5 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 active:scale-95 transition-all select-none disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={uploading}
              className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-sm font-semibold text-white shadow-sm active:scale-95 transition-all select-none disabled:opacity-60 flex items-center gap-2"
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
