import { useState, useEffect } from 'react';
import { X, Plus, Trash2, Layers, Tag, ChevronRight, Loader2 } from 'lucide-react';
import useHartaBendaStore from '../../store/HartaBenda/useHartaBendaStore';

const MAINTENANCE_OPTIONS = [
  { value: 'km', label: 'Berbasis KM (Kendaraan)', icon: '🚗' },
  { value: 'bulan', label: 'Berbasis Bulan (Periodik)', icon: '📅' },
  { value: 'tidak', label: 'Tanpa Servis Berkala', icon: '📦' },
];

export default function ModalKategoriAset({ onClose }) {
  const {
    kelompokAset,
    subKelompokAset,
    addKelompok,
    deleteKelompok,
    addSubKelompok,
    deleteSubKelompok,
    fetchKelompokAset,
    fetchSubKelompokAset,
  } = useHartaBendaStore();

  const [activeTab, setActiveTab] = useState('kelompok');
  const [loadingId, setLoadingId] = useState(null);

  // Form Tambah Kelompok
  const [formKelompok, setFormKelompok] = useState({ nama: '', prefix_kode: '' });
  const [savingKelompok, setSavingKelompok] = useState(false);

  // Form Tambah Sub-Kelompok
  const [formSub, setFormSub] = useState({ kelompok_id: '', nama: '', maintenance_type: '' });
  const [savingSub, setSavingSub] = useState(false);

  // State custom modal konfirmasi hapus
  const [deleteModal, setDeleteModal] = useState({ open: false, id: null, nama: '', type: '' });

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

  const handleDeleteKelompok = (id, nama) => {
    setDeleteModal({ open: true, id, nama, type: 'kelompok' });
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

  const handleDeleteSub = (id, nama) => {
    setDeleteModal({ open: true, id, nama, type: 'sub' });
  };

  const handleConfirmDelete = async () => {
    setLoadingId(deleteModal.id);
    if (deleteModal.type === 'kelompok') {
      await deleteKelompok(deleteModal.id);
    } else {
      await deleteSubKelompok(deleteModal.id);
    }
    setLoadingId(null);
    setDeleteModal({ open: false, id: null, nama: '', type: '' });
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative bg-white border border-slate-100 rounded-3xl shadow-xl w-full max-w-2xl flex flex-col max-h-[90vh] z-10">

        {/* Header Modal */}
        <div className="flex items-center justify-between p-21 pb-0 shrink-0">
          <div>
            <p className="text-base font-bold text-slate-700">📁 Manajemen Kategori Aset</p>
            <p className="text-xs text-slate-400 mt-2">Kelola kelompok &amp; sub-kelompok aset</p>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="text-slate-400 hover:text-slate-600 transition-colors p-1"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center gap-8 px-21 py-13 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('kelompok')}
            className={`flex items-center gap-5 px-13 py-8 rounded-full text-xs font-extrabold transition-all border ${
              activeTab === 'kelompok'
                ? 'bg-white text-teal-600 border-teal-500 shadow-sm'
                : 'bg-transparent text-slate-400 border-slate-200 hover:text-slate-600'
            }`}
          >
            <Layers size={14} />
            Kelompok Aset
            <span className={`ml-2 px-5 py-2 text-[10px] rounded-full font-bold ${
              activeTab === 'kelompok' ? 'bg-teal-50 text-teal-600' : 'bg-slate-100 text-slate-500'
            }`}>
              {kelompokAset.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('sub')}
            className={`flex items-center gap-5 px-13 py-8 rounded-full text-xs font-extrabold transition-all border ${
              activeTab === 'sub'
                ? 'bg-white text-teal-600 border-teal-500 shadow-sm'
                : 'bg-transparent text-slate-400 border-slate-200 hover:text-slate-600'
            }`}
          >
            <Tag size={14} />
            Sub-Kelompok
            <span className={`ml-2 px-5 py-2 text-[10px] rounded-full font-bold ${
              activeTab === 'sub' ? 'bg-teal-50 text-teal-600' : 'bg-slate-100 text-slate-500'
            }`}>
              {subKelompokAset.length}
            </span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto px-21 space-y-13 pb-13">

          {/* ── TAB 1: KELOMPOK ASET ── */}
          {activeTab === 'kelompok' && (
            <div className="space-y-13">
              {/* Form Tambah Kelompok */}
              <div className="p-13 bg-slate-50 rounded-2xl border border-slate-100 space-y-8">
                <label className="text-[10px] font-bold text-teal-600 tracking-wider uppercase flex items-center gap-5">
                  <Plus size={13} /> TAMBAH KELOMPOK BARU
                </label>
                <form onSubmit={handleAddKelompok} className="flex gap-8">
                  <input
                    type="text"
                    placeholder="Nama Kelompok (contoh: Kendaraan)"
                    value={formKelompok.nama}
                    onChange={(e) => setFormKelompok((f) => ({ ...f, nama: e.target.value }))}
                    required
                    className="flex-1 px-13 py-8 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 transition-all text-slate-700 placeholder:text-slate-300"
                  />
                  <input
                    type="text"
                    placeholder="PREFIX (KND)"
                    value={formKelompok.prefix_kode}
                    onChange={(e) => setFormKelompok((f) => ({ ...f, prefix_kode: e.target.value.toUpperCase() }))}
                    maxLength={5}
                    required
                    className="w-89 px-8 py-8 text-xs text-center font-mono uppercase bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 transition-all text-slate-700 placeholder:text-slate-300"
                  />
                  <button
                    type="submit"
                    disabled={savingKelompok}
                    className="px-13 py-8 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-full flex items-center gap-5 shadow-sm transition-all shrink-0 active:scale-95 disabled:opacity-60"
                  >
                    {savingKelompok ? <Loader2 size={13} className="animate-spin" /> : <Plus size={14} strokeWidth={3} />}
                    Tambah
                  </button>
                </form>
              </div>

              {/* List Kelompok */}
              <div className="space-y-8 max-h-56 overflow-y-auto pr-3">
                {kelompokAset.length === 0 ? (
                  <div className="text-center py-21 text-slate-400 text-xs bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                    Belum ada kelompok aset.
                  </div>
                ) : (
                  kelompokAset.map((k) => (
                    <div
                      key={k.id}
                      className="flex items-center justify-between bg-white border border-slate-100 rounded-2xl px-13 py-8 hover:border-teal-200 transition-all group shadow-sm"
                    >
                      <div className="flex items-center gap-8 min-w-0">
                        <span className="text-[10px] font-extrabold text-teal-600 bg-teal-50 px-8 py-3 rounded-lg shrink-0">
                          {k.prefix_kode}
                        </span>
                        <p className="text-xs font-bold text-slate-700 truncate">{k.nama}</p>
                        <ChevronRight size={14} className="text-slate-300 shrink-0" />
                        <p className="text-[11px] text-slate-400 font-medium whitespace-nowrap">
                          {subKelompokAset.filter((s) => s.kelompok_id === k.id).length} sub-kelompok
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteKelompok(k.id, k.nama)}
                        disabled={loadingId === k.id}
                        className="opacity-0 group-hover:opacity-100 text-rose-400 hover:text-rose-600 p-5 transition-all"
                        title="Hapus"
                      >
                        {loadingId === k.id ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* ── TAB 2: SUB-KELOMPOK ── */}
          {activeTab === 'sub' && (
            <div className="space-y-13">
              {/* Form Tambah Sub-Kelompok */}
              <div className="p-13 bg-slate-50 rounded-2xl border border-slate-100 space-y-8">
                <label className="text-[10px] font-bold text-teal-600 tracking-wider uppercase flex items-center gap-5">
                  <Plus size={13} /> TAMBAH SUB-KELOMPOK BARU
                </label>
                <form onSubmit={handleAddSub} className="space-y-8">
                  <div className="grid grid-cols-2 gap-8">
                    <div>
                      <p className="text-[10px] font-bold text-slate-500 uppercase mb-5">Kelompok Induk</p>
                      <select
                        value={formSub.kelompok_id}
                        onChange={(e) => setFormSub((f) => ({ ...f, kelompok_id: e.target.value }))}
                        required
                        className="w-full px-8 py-8 text-xs bg-white border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 transition-all"
                      >
                        <option value="">Pilih kelompok...</option>
                        {kelompokAset.map((k) => (
                          <option key={k.id} value={k.id}>{k.nama}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-500 uppercase mb-5">Nama Sub-Kelompok</p>
                      <input
                        type="text"
                        placeholder="contoh: AC / Air Conditioner"
                        value={formSub.nama}
                        onChange={(e) => setFormSub((f) => ({ ...f, nama: e.target.value }))}
                        required
                        className="w-full px-8 py-8 text-xs bg-white border border-slate-200 rounded-xl text-slate-700 placeholder:text-slate-300 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase mb-5">Tipe Maintenance</p>
                    <div className="grid grid-cols-3 gap-8">
                      {MAINTENANCE_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setFormSub((f) => ({ ...f, maintenance_type: opt.value }))}
                          className={`text-left p-8 rounded-xl border transition-all ${
                            formSub.maintenance_type === opt.value
                              ? 'border-teal-500 bg-teal-50 ring-1 ring-teal-500'
                              : 'border-slate-200 bg-white hover:border-slate-300'
                          }`}
                        >
                          <p className="text-sm mb-3">{opt.icon}</p>
                          <p className={`text-[11px] font-bold leading-tight ${
                            formSub.maintenance_type === opt.value ? 'text-teal-600' : 'text-slate-700'
                          }`}>
                            {opt.label}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={savingSub || !formSub.kelompok_id || !formSub.nama || !formSub.maintenance_type}
                    className="flex items-center gap-5 px-13 py-8 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-full transition-all disabled:opacity-50 active:scale-95"
                  >
                    {savingSub ? <Loader2 size={13} className="animate-spin" /> : <Plus size={14} strokeWidth={3} />}
                    Tambah Sub-Kelompok
                  </button>
                </form>
              </div>

              {/* List Sub-Kelompok */}
              <div className="space-y-13 max-h-56 overflow-y-auto pr-3">
                {subKelompokAset.length === 0 ? (
                  <div className="text-center py-21 text-slate-400 text-xs bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                    Belum ada sub-kelompok.
                  </div>
                ) : (
                  kelompokAset
                    .filter((k) => subKelompokAset.some((s) => s.kelompok_id === k.id))
                    .map((k) => (
                      <div key={k.id} className="space-y-5">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-5 px-3">
                          <span className="font-bold text-teal-600 bg-teal-50 px-8 py-3 rounded-lg">
                            {k.prefix_kode}
                          </span>
                          {k.nama}
                        </p>
                        <div className="space-y-5 pl-5">
                          {subKelompokAset
                            .filter((s) => s.kelompok_id === k.id)
                            .map((s) => {
                              const mOpt = MAINTENANCE_OPTIONS.find((o) => o.value === s.maintenance_type);
                              return (
                                <div
                                  key={s.id}
                                  className="flex items-center justify-between bg-white border border-slate-100 rounded-2xl px-13 py-8 hover:border-teal-200 transition-all group shadow-sm"
                                >
                                  <div className="flex items-center gap-8 min-w-0">
                                    <span className="text-xs shrink-0">{mOpt?.icon}</span>
                                    <p className="text-xs font-bold text-slate-700 truncate">{s.nama}</p>
                                    <span className="text-[9px] font-bold px-5 py-2 rounded-full bg-slate-100 text-slate-500 uppercase shrink-0">
                                      {s.maintenance_type}
                                    </span>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteSub(s.id, s.nama)}
                                    disabled={loadingId === s.id}
                                    className="opacity-0 group-hover:opacity-100 text-rose-400 hover:text-rose-600 p-5 transition-all"
                                    title="Hapus"
                                  >
                                    {loadingId === s.id ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={13} />}
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

        {/* Footer Tombol Tutup */}
        <div className="flex justify-end p-21 pt-13 border-t border-slate-100 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-18 py-8 bg-white hover:bg-slate-50 text-slate-600 text-xs font-extrabold rounded-full border border-slate-200 transition-all active:scale-95 shadow-sm"
          >
            Tutup
          </button>
        </div>

      </div>

      {/* ── Custom Modal Konfirmasi Hapus ── */}
      {deleteModal.open && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
            onClick={() => setDeleteModal({ open: false, id: null, nama: '', type: '' })}
          />
          <div className="relative bg-white rounded-3xl shadow-xl border border-slate-100 w-full max-w-md p-21 flex flex-col gap-13 z-10 animate-in fade-in zoom-in-95 duration-150 text-center items-center">
            <div className="mt-8">
              <h3 className="text-lg font-black text-slate-800 tracking-tight mb-8">
                Hapus {deleteModal.type === 'kelompok' ? 'Kelompok' : 'Sub-Kelompok'}?
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed max-w-sm">
                Yakin ingin menghapus{' '}
                {deleteModal.type === 'kelompok'
                  ? <>kelompok <span className="font-bold text-slate-700">"{deleteModal.nama}"</span>? Semua sub-kelompoknya juga akan ikut terhapus.</>
                  : <>sub-kelompok <span className="font-bold text-slate-700">"{deleteModal.nama}"</span>? Tindakan ini tidak dapat dibatalkan.</>
                }
              </p>
            </div>
            <div className="flex items-center justify-center gap-8 mt-13 w-full">
              <button
                type="button"
                onClick={() => setDeleteModal({ open: false, id: null, nama: '', type: '' })}
                className="px-18 py-8 rounded-xl border border-slate-200 text-xs font-bold text-slate-500 hover:bg-slate-50 active:scale-95 transition-all select-none"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={loadingId !== null}
                className="px-18 py-8 rounded-xl bg-rose-600 hover:bg-rose-700 text-xs font-bold text-white shadow-sm active:scale-95 transition-all select-none disabled:opacity-60"
              >
                {loadingId !== null ? <Loader2 size={13} className="animate-spin" /> : 'Ya, Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}