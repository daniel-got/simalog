import { useState, useEffect } from 'react';
import {
  X, Plus, Trash2, Layers, Tag, Settings2,
  ChevronRight, AlertCircle, Loader2
} from 'lucide-react';
import useHartaBendaStore from '../../store/HartaBenda/useHartaBendaStore';

const MAINTENANCE_OPTIONS = [
  { value: 'km', label: 'Berbasis KM (Kendaraan)', icon: '🚗', desc: 'Servis berdasarkan kilometer — Mobil, Motor, dll' },
  { value: 'bulan', label: 'Berbasis Bulan (Periodik)', icon: '📅', desc: 'Servis rutin bulanan — AC, Printer, Proyektor, dll' },
  { value: 'tidak', label: 'Tanpa Servis Berkala', icon: '📦', desc: 'Tidak memerlukan servis rutin — Laptop, Furnitur, dll' },
];

export default function ModalKategoriAset({ onClose }) {
  const { kelompokAset, subKelompokAset, addKelompok, deleteKelompok, addSubKelompok, deleteSubKelompok, fetchKelompokAset, fetchSubKelompokAset } = useHartaBendaStore();

  const [activeTab, setActiveTab] = useState('kelompok');
  const [loadingId, setLoadingId] = useState(null);

  // Form tambah kelompok
  const [formKelompok, setFormKelompok] = useState({ nama: '', prefix_kode: '' });
  const [savingKelompok, setSavingKelompok] = useState(false);

  // Form tambah sub-kelompok
  const [formSub, setFormSub] = useState({ kelompok_id: '', nama: '', maintenance_type: '' });
  const [savingSub, setSavingSub] = useState(false);

  useEffect(() => {
    fetchKelompokAset();
    fetchSubKelompokAset();
  }, [fetchKelompokAset, fetchSubKelompokAset]);

  const handleAddKelompok = async (e) => {
    e.preventDefault();
    if (!formKelompok.nama.trim() || !formKelompok.prefix_kode.trim()) return;
    setSavingKelompok(true);
    const ok = await addKelompok({
      nama: formKelompok.nama.trim(),
      prefix_kode: formKelompok.prefix_kode.trim().toUpperCase(),
    });
    setSavingKelompok(false);
    if (ok) setFormKelompok({ nama: '', prefix_kode: '' });
  };

  const handleDeleteKelompok = async (id, nama) => {
    if (!window.confirm(`Hapus kelompok "${nama}"? Semua sub-kelompoknya juga akan terhapus.`)) return;
    setLoadingId(id);
    await deleteKelompok(id);
    setLoadingId(null);
  };

  const handleAddSub = async (e) => {
    e.preventDefault();
    if (!formSub.nama.trim() || !formSub.kelompok_id || !formSub.maintenance_type) return;
    setSavingSub(true);
    const ok = await addSubKelompok({
      kelompok_id: Number(formSub.kelompok_id),
      nama: formSub.nama.trim(),
      maintenance_type: formSub.maintenance_type,
    });
    setSavingSub(false);
    if (ok) setFormSub({ kelompok_id: '', nama: '', maintenance_type: '' });
  };

  const handleDeleteSub = async (id, nama) => {
    if (!window.confirm(`Hapus sub-kelompok "${nama}"?`)) return;
    setLoadingId(id);
    await deleteSubKelompok(id);
    setLoadingId(null);
  };

  const getKelompokNama = (id) => kelompokAset.find(k => k.id === id)?.nama || '-';

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-2xl max-h-[90vh] flex flex-col z-10 overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-21 py-13 border-b border-slate-100 bg-gradient-to-r from-teal-600 to-teal-500 shrink-0">
          <div className="flex items-center gap-8">
            <div className="w-34 h-34 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
              <Settings2 size={18} className="text-white" />
            </div>
            <div>
              <p className="text-sm font-black text-white tracking-tight">Manajemen Kategori Aset</p>
              <p className="text-[10px] text-teal-100/80 font-medium">Kelola kelompok & sub-kelompok aset</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-34 h-34 rounded-xl bg-white/15 hover:bg-white/25 flex items-center justify-center text-white transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-0 px-21 pt-13 border-b border-slate-100 bg-slate-50/50 shrink-0">
          {[
            { key: 'kelompok', label: 'Kelompok Aset', icon: Layers },
            { key: 'sub', label: 'Sub-Kelompok', icon: Tag },
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex items-center gap-5 px-13 py-8 text-xs font-bold border-b-2 transition-all -mb-px ${
                activeTab === key
                  ? 'border-teal-600 text-teal-700 bg-white rounded-t-xl'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              <Icon size={13} />
              {label}
              <span className={`ml-2 text-[10px] font-bold px-5 py-1 rounded-full ${
                activeTab === key ? 'bg-teal-100 text-teal-700' : 'bg-slate-100 text-slate-400'
              }`}>
                {key === 'kelompok' ? kelompokAset.length : subKelompokAset.length}
              </span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-21 space-y-13">

          {/* ── TAB: KELOMPOK ASET ── */}
          {activeTab === 'kelompok' && (
            <div className="space-y-13">
              {/* Form Tambah */}
              <div className="bg-teal-50/60 border border-teal-100 rounded-2xl p-13">
                <p className="text-[10px] font-black text-teal-700 uppercase tracking-widest mb-8 flex items-center gap-5">
                  <Plus size={11} /> Tambah Kelompok Baru
                </p>
                <form onSubmit={handleAddKelompok} className="flex gap-8 flex-col sm:flex-row">
                  <input
                    type="text"
                    placeholder="Nama Kelompok (contoh: Kendaraan)"
                    value={formKelompok.nama}
                    onChange={e => setFormKelompok(f => ({ ...f, nama: e.target.value }))}
                    required
                    className="flex-1 px-13 py-8 text-sm rounded-xl border border-slate-200 bg-white focus:border-teal-500 focus:ring-2 focus:ring-teal-100 outline-none transition-all"
                  />
                  <input
                    type="text"
                    placeholder="Prefix (KND)"
                    value={formKelompok.prefix_kode}
                    onChange={e => setFormKelompok(f => ({ ...f, prefix_kode: e.target.value.toUpperCase() }))}
                    maxLength={5}
                    required
                    className="w-28 px-13 py-8 text-sm font-mono rounded-xl border border-slate-200 bg-white focus:border-teal-500 focus:ring-2 focus:ring-teal-100 outline-none transition-all uppercase"
                  />
                  <button
                    type="submit"
                    disabled={savingKelompok}
                    className="flex items-center gap-5 px-13 py-8 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl transition-all active:scale-95 disabled:opacity-50 shrink-0"
                  >
                    {savingKelompok ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
                    Tambah
                  </button>
                </form>
              </div>

              {/* List Kelompok */}
              <div className="space-y-5">
                {kelompokAset.length === 0 ? (
                  <div className="text-center py-13 text-slate-400 text-xs bg-slate-50 rounded-xl">
                    Belum ada kelompok aset. Tambahkan di atas.
                  </div>
                ) : (
                  kelompokAset.map(k => (
                    <div key={k.id} className="flex items-center justify-between bg-white border border-slate-100 rounded-xl px-13 py-8 hover:border-slate-200 transition-colors group">
                      <div className="flex items-center gap-8 min-w-0">
                        <span className="text-[10px] font-black font-mono text-teal-700 bg-teal-50 px-8 py-3 rounded-lg shrink-0">
                          {k.prefix_kode}
                        </span>
                        <p className="text-sm font-semibold text-slate-700 truncate">{k.nama}</p>
                        <ChevronRight size={12} className="text-slate-300 shrink-0" />
                        <p className="text-[10px] text-slate-400">
                          {subKelompokAset.filter(s => s.kelompok_id === k.id).length} sub-kelompok
                        </p>
                      </div>
                      <button
                        onClick={() => handleDeleteKelompok(k.id, k.nama)}
                        disabled={loadingId === k.id}
                        className="w-21 h-21 rounded-lg bg-red-50 text-red-400 hover:bg-red-100 hover:text-red-600 flex items-center justify-center transition-colors shrink-0 opacity-0 group-hover:opacity-100"
                        title="Hapus"
                      >
                        {loadingId === k.id ? <Loader2 size={11} className="animate-spin" /> : <Trash2 size={11} />}
                      </button>
                    </div>
                  ))
                )}
              </div>

              {/* Info */}
              {kelompokAset.length > 0 && (
                <div className="flex items-start gap-8 bg-amber-50 border border-amber-100 rounded-xl p-8 text-[10px] text-amber-700">
                  <AlertCircle size={12} className="shrink-0 mt-0.5" />
                  Menghapus kelompok akan otomatis menghapus semua sub-kelompok di dalamnya (CASCADE).
                </div>
              )}
            </div>
          )}

          {/* ── TAB: SUB-KELOMPOK ── */}
          {activeTab === 'sub' && (
            <div className="space-y-13">
              {/* Form Tambah */}
              <div className="bg-teal-50/60 border border-teal-100 rounded-2xl p-13">
                <p className="text-[10px] font-black text-teal-700 uppercase tracking-widest mb-8 flex items-center gap-5">
                  <Plus size={11} /> Tambah Sub-Kelompok Baru
                </p>
                <form onSubmit={handleAddSub} className="space-y-8">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                    <div className="flex flex-col gap-3">
                      <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Kelompok Induk</label>
                      <select
                        value={formSub.kelompok_id}
                        onChange={e => setFormSub(f => ({ ...f, kelompok_id: e.target.value }))}
                        required
                        className="w-full px-13 py-8 text-sm rounded-xl border border-slate-200 bg-white focus:border-teal-500 focus:ring-2 focus:ring-teal-100 outline-none transition-all"
                      >
                        <option value="">Pilih kelompok...</option>
                        {kelompokAset.map(k => (
                          <option key={k.id} value={k.id}>{k.nama}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex flex-col gap-3">
                      <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Nama Sub-Kelompok</label>
                      <input
                        type="text"
                        placeholder="contoh: AC / Air Conditioner"
                        value={formSub.nama}
                        onChange={e => setFormSub(f => ({ ...f, nama: e.target.value }))}
                        required
                        className="w-full px-13 py-8 text-sm rounded-xl border border-slate-200 bg-white focus:border-teal-500 focus:ring-2 focus:ring-teal-100 outline-none transition-all"
                      />
                    </div>
                  </div>

                  {/* Maintenance Type Pills */}
                  <div className="flex flex-col gap-3">
                    <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Tipe Maintenance</label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                      {MAINTENANCE_OPTIONS.map(opt => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setFormSub(f => ({ ...f, maintenance_type: opt.value }))}
                          className={`text-left px-8 py-8 rounded-xl border-2 transition-all ${
                            formSub.maintenance_type === opt.value
                              ? 'border-teal-500 bg-teal-50'
                              : 'border-slate-200 bg-white hover:border-slate-300'
                          }`}
                        >
                          <p className="text-sm mb-2">{opt.icon}</p>
                          <p className={`text-[10px] font-bold ${formSub.maintenance_type === opt.value ? 'text-teal-700' : 'text-slate-600'}`}>
                            {opt.label}
                          </p>
                          <p className={`text-[9px] mt-1 leading-tight ${formSub.maintenance_type === opt.value ? 'text-teal-500' : 'text-slate-400'}`}>
                            {opt.desc}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={savingSub || !formSub.kelompok_id || !formSub.nama || !formSub.maintenance_type}
                    className="flex items-center gap-5 px-13 py-8 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl transition-all active:scale-95 disabled:opacity-50"
                  >
                    {savingSub ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
                    Tambah Sub-Kelompok
                  </button>
                </form>
              </div>

              {/* List Sub-Kelompok (grouped by kelompok) */}
              <div className="space-y-5">
                {subKelompokAset.length === 0 ? (
                  <div className="text-center py-13 text-slate-400 text-xs bg-slate-50 rounded-xl">
                    Belum ada sub-kelompok. Tambahkan di atas.
                  </div>
                ) : (
                  kelompokAset
                    .filter(k => subKelompokAset.some(s => s.kelompok_id === k.id))
                    .map(k => (
                      <div key={k.id}>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-5 flex items-center gap-5">
                          <span className="text-[9px] font-black font-mono text-teal-600 bg-teal-50 px-5 py-1 rounded">{k.prefix_kode}</span>
                          {k.nama}
                        </p>
                        <div className="space-y-3 pl-8">
                          {subKelompokAset
                            .filter(s => s.kelompok_id === k.id)
                            .map(s => {
                              const mOpt = MAINTENANCE_OPTIONS.find(o => o.value === s.maintenance_type);
                              return (
                                <div key={s.id} className="flex items-center justify-between bg-white border border-slate-100 rounded-xl px-13 py-8 hover:border-slate-200 transition-colors group">
                                  <div className="flex items-center gap-8 min-w-0">
                                    <span className="text-sm shrink-0">{mOpt?.icon}</span>
                                    <p className="text-sm font-medium text-slate-700 truncate">{s.nama}</p>
                                    <span className={`text-[9px] font-bold px-5 py-1 rounded-full shrink-0 ${
                                      s.maintenance_type === 'km' ? 'bg-blue-50 text-blue-600' :
                                      s.maintenance_type === 'bulan' ? 'bg-amber-50 text-amber-600' :
                                      'bg-slate-100 text-slate-500'
                                    }`}>
                                      {s.maintenance_type === 'km' ? 'KM' : s.maintenance_type === 'bulan' ? 'BULAN' : 'TANPA SERVIS'}
                                    </span>
                                  </div>
                                  <button
                                    onClick={() => handleDeleteSub(s.id, s.nama)}
                                    disabled={loadingId === s.id}
                                    className="w-21 h-21 rounded-lg bg-red-50 text-red-400 hover:bg-red-100 hover:text-red-600 flex items-center justify-center transition-colors shrink-0 opacity-0 group-hover:opacity-100"
                                    title="Hapus"
                                  >
                                    {loadingId === s.id ? <Loader2 size={11} className="animate-spin" /> : <Trash2 size={11} />}
                                  </button>
                                </div>
                              );
                            })}
                        </div>
                      </div>
                    ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-21 py-8 border-t border-slate-100 bg-slate-50/50 shrink-0">
          <button
            onClick={onClose}
            className="w-full py-8 text-xs font-bold text-slate-500 hover:text-slate-700 transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
