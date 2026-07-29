import { useState, useEffect, useCallback } from 'react';
import {
  CheckCircle2,
  XCircle,
  Clock,
  ShieldCheck,
  ClipboardList,
  AlertTriangle,
  Loader2,
  RefreshCw,
  User,
  Calendar,
  FileText,
  AlertOctagon,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Card } from '../../components/ui/Card';
import Button from '../../components/ui/Button';

// ─── Badge Helpers ────────────────────────────────────────────────────────────
const tingkatBadge = (tingkat) => {
  switch (tingkat) {
    case 'Ringan':
      return 'bg-amber-50 text-amber-700 border border-amber-200';
    case 'Sedang':
      return 'bg-orange-50 text-orange-700 border border-orange-200';
    case 'Berat':
      return 'bg-rose-50 text-rose-700 border border-rose-200';
    default:
      return 'bg-slate-100 text-slate-600 border border-slate-200';
  }
};

// ─── Komponen Skeleton Loading ────────────────────────────────────────────────
function SkeletonRow() {
  return (
    <div className="flex items-center gap-13 p-13 bg-white rounded-2xl border border-slate-100 animate-pulse">
      <div className="w-34 h-34 bg-slate-100 rounded-xl shrink-0" />
      <div className="flex-1 space-y-5">
        <div className="h-8 bg-slate-100 rounded-lg w-1/3" />
        <div className="h-6 bg-slate-100 rounded-lg w-1/2" />
      </div>
      <div className="flex gap-5">
        <div className="h-21 w-55 bg-slate-100 rounded-lg" />
        <div className="h-21 w-34 bg-slate-100 rounded-lg" />
      </div>
    </div>
  );
}

// ─── Komponen Empty State ─────────────────────────────────────────────────────
function EmptyState({ icon: Icon, label }) {
  return (
    <div className="flex flex-col items-center justify-center py-34 text-slate-400 bg-slate-50/60 rounded-2xl border border-slate-100 border-dashed">
      <Icon size={28} className="mb-8 text-slate-300" />
      <p className="text-xs font-semibold">{label}</p>
    </div>
  );
}

// ─── Komponen Confirm Modal ────────────────────────────────────────────────────
function ConfirmModal({ open, title, message, onConfirm, onCancel, loading, confirmLabel, confirmClass }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
        onClick={onCancel}
      />
      <div className="relative bg-white rounded-3xl shadow-xl border border-slate-100 w-full max-w-md p-21 flex flex-col gap-13 z-10 animate-in fade-in zoom-in-95 duration-150 text-center items-center">
        <div className="mt-8">
          <h3 className="text-lg font-black text-slate-800 tracking-tight mb-8">{title}</h3>
          <p className="text-xs text-slate-500 leading-relaxed max-w-sm">{message}</p>
        </div>
        <div className="flex items-center justify-center gap-8 mt-13 w-full">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="px-18 py-8 rounded-xl border border-slate-200 text-xs font-bold text-slate-500 hover:bg-slate-50 active:scale-95 transition-all select-none disabled:opacity-50"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`px-18 py-8 rounded-xl text-xs font-bold text-white shadow-sm active:scale-95 transition-all select-none disabled:opacity-60 flex items-center gap-5 ${confirmClass}`}
          >
            {loading ? <Loader2 size={13} className="animate-spin" /> : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════════════════════════════
export default function Persetujuan() {
  // ── State data ────────────────────────────────────────────────────────────
  const [peminjaman, setPeminjaman]     = useState([]);
  const [kerusakan, setKerusakan]       = useState([]);
  const [loadingP, setLoadingP]         = useState(true);
  const [loadingK, setLoadingK]         = useState(true);
  const [actionLoading, setActionLoading] = useState(null); // id item yang sedang diproses

  // ── Confirm modal state ───────────────────────────────────────────────────
  const [modal, setModal] = useState({
    open: false,
    title: '',
    message: '',
    onConfirm: null,
    confirmLabel: '',
    confirmClass: '',
  });

  // ── Fetch ─────────────────────────────────────────────────────────────────
  const fetchPeminjaman = useCallback(async () => {
    setLoadingP(true);
    const { data, error } = await supabase
      .from('peminjaman_aset')
      .select(`
        *,
        aset:id_aset ( id, nama_aset, kode_aset )
      `)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });
    if (!error) setPeminjaman(data || []);
    setLoadingP(false);
  }, []);

  const fetchKerusakan = useCallback(async () => {
    setLoadingK(true);
    const { data, error } = await supabase
      .from('laporan_kerusakan')
      .select(`
        *,
        aset:id_aset ( id, nama_aset, kode_aset )
      `)
      .eq('status', 'menunggu')
      .order('created_at', { ascending: false });
    if (!error) setKerusakan(data || []);
    setLoadingK(false);
  }, []);

  useEffect(() => {
    fetchPeminjaman();
    fetchKerusakan();
  }, [fetchPeminjaman, fetchKerusakan]);

  const closeModal = () =>
    setModal({ open: false, title: '', message: '', onConfirm: null, confirmLabel: '', confirmClass: '' });

  // ── Handler: Setujui Peminjaman ───────────────────────────────────────────
  const doSetujuiPeminjaman = async (item) => {
    setActionLoading(item.id);
    try {
      // 1. Update status peminjaman_aset
      const { error: e1 } = await supabase
        .from('peminjaman_aset')
        .update({ status: 'disetujui' })
        .eq('id', item.id);
      if (e1) throw e1;

      // 2. Insert ke log_aktivitas_aset
      const { error: e2 } = await supabase
        .from('log_aktivitas_aset')
        .insert([{
          id_aset: item.id_aset,
          tanggal: new Date().toISOString().split('T')[0],
          jenis_aktivitas: 'Dipinjam',
          nama_staf: item.nama_peminjam,
          tanggal_rencana_kembali: item.tanggal_kembali,
          keterangan: item.keperluan || '',
        }]);
      if (e2) throw e2;

      setPeminjaman(prev => prev.filter(p => p.id !== item.id));
    } catch (err) {
      alert('Gagal menyetujui: ' + (err.message || err));
    } finally {
      setActionLoading(null);
      closeModal();
    }
  };

  // ── Handler: Tolak Peminjaman ─────────────────────────────────────────────
  const doTolakPeminjaman = async (item) => {
    setActionLoading(item.id);
    try {
      const { error } = await supabase
        .from('peminjaman_aset')
        .update({ status: 'ditolak' })
        .eq('id', item.id);
      if (error) throw error;
      setPeminjaman(prev => prev.filter(p => p.id !== item.id));
    } catch (err) {
      alert('Gagal menolak: ' + (err.message || err));
    } finally {
      setActionLoading(null);
      closeModal();
    }
  };

  // ── Handler: Verifikasi Kerusakan ─────────────────────────────────────────
  const doVerifikasiKerusakan = async (item) => {
    setActionLoading(item.id);
    try {
      // 1. Update status laporan_kerusakan
      const { error: e1 } = await supabase
        .from('laporan_kerusakan')
        .update({ status: 'diverifikasi' })
        .eq('id', item.id);
      if (e1) throw e1;

      // 2. Update status_kondisi aset
      const kondisiBaru = item.tingkat === 'Ringan' ? 'Rusak Ringan' : 'Rusak Berat';
      const { error: e2 } = await supabase
        .from('assets')
        .update({ status_kondisi: kondisiBaru })
        .eq('id', item.id_aset);
      if (e2) throw e2;

      setKerusakan(prev => prev.filter(k => k.id !== item.id));
    } catch (err) {
      alert('Gagal memverifikasi: ' + (err.message || err));
    } finally {
      setActionLoading(null);
      closeModal();
    }
  };

  // ── Handler: Tolak Kerusakan ──────────────────────────────────────────────
  const doTolakKerusakan = async (item) => {
    setActionLoading(item.id);
    try {
      const { error } = await supabase
        .from('laporan_kerusakan')
        .update({ status: 'ditolak' })
        .eq('id', item.id);
      if (error) throw error;
      setKerusakan(prev => prev.filter(k => k.id !== item.id));
    } catch (err) {
      alert('Gagal menolak laporan: ' + (err.message || err));
    } finally {
      setActionLoading(null);
      closeModal();
    }
  };

  // ── Confirm wrappers ──────────────────────────────────────────────────────
  const confirmSetujuiPeminjaman = (item) =>
    setModal({
      open: true,
      title: 'Setujui Peminjaman?',
      message: `Setujui peminjaman aset "${item.aset?.nama_aset}" oleh ${item.nama_peminjam}? Log aktivitas "Dipinjam" akan otomatis dicatat.`,
      onConfirm: () => doSetujuiPeminjaman(item),
      confirmLabel: 'Ya, Setujui',
      confirmClass: 'bg-emerald-600 hover:bg-emerald-700',
    });

  const confirmTolakPeminjaman = (item) =>
    setModal({
      open: true,
      title: 'Tolak Peminjaman?',
      message: `Tolak peminjaman aset "${item.aset?.nama_aset}" oleh ${item.nama_peminjam}?`,
      onConfirm: () => doTolakPeminjaman(item),
      confirmLabel: 'Ya, Tolak',
      confirmClass: 'bg-rose-600 hover:bg-rose-700',
    });

  const confirmVerifikasiKerusakan = (item) =>
    setModal({
      open: true,
      title: 'Verifikasi Laporan Kerusakan?',
      message: `Verifikasi laporan dari ${item.nama_pelapor} untuk aset "${item.aset?.nama_aset}"? Kondisi aset akan diubah ke "${item.tingkat === 'Ringan' ? 'Rusak Ringan' : 'Rusak Berat'}".`,
      onConfirm: () => doVerifikasiKerusakan(item),
      confirmLabel: 'Ya, Verifikasi',
      confirmClass: 'bg-blue-600 hover:bg-blue-700',
    });

  const confirmTolakKerusakan = (item) =>
    setModal({
      open: true,
      title: 'Tolak Laporan Kerusakan?',
      message: `Tolak laporan kerusakan dari ${item.nama_pelapor}? Kondisi aset tidak akan berubah.`,
      onConfirm: () => doTolakKerusakan(item),
      confirmLabel: 'Ya, Tolak',
      confirmClass: 'bg-rose-600 hover:bg-rose-700',
    });

  // ── Total badge count (dipakai juga di header) ────────────────────────────
  const totalPending = peminjaman.length + kerusakan.length;

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-8">

      {/* ── Refresh Button wrapping ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-4">
            Persetujuan
            {totalPending > 0 && (
              <span className="inline-flex items-center justify-center min-w-[22px] h-[22px] px-5 bg-rose-500 text-white text-[10px] font-black rounded-full">
                {totalPending}
              </span>
            )}
          </h1>
          <p className="text-xs text-slate-400 mt-2">
            {peminjaman.length} peminjaman pending · {kerusakan.length} laporan kerusakan menunggu
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => { fetchPeminjaman(); fetchKerusakan(); }}
          title="Refresh"
        >
          <RefreshCw size={14} /> Refresh
        </Button>
      </div>

      {/* ════════════════════════════════════════════════════════════════════
          A. PENGAJUAN PEMINJAMAN
      ════════════════════════════════════════════════════════════════════ */}
      <div className="space-y-13">
        {/* Section Header */}
        <div className="flex items-center gap-8">
          <div className="w-34 h-34 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
            <ClipboardList size={18} className="text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-black text-slate-800 tracking-tight">
              Pengajuan Peminjaman
            </p>
            <p className="text-[10px] text-slate-400 mt-1">Dari tabel <code className="font-mono bg-slate-100 px-3 py-1 rounded text-slate-600">peminjaman_aset</code> — status: <span className="font-bold text-amber-600">pending</span></p>
          </div>
          {peminjaman.length > 0 && (
            <span className="ml-auto inline-flex items-center justify-center min-w-[22px] h-[22px] px-5 bg-blue-100 text-blue-700 text-[10px] font-black rounded-full">
              {peminjaman.length}
            </span>
          )}
        </div>

        {loadingP ? (
          <div className="space-y-8">
            {[1, 2].map(i => <SkeletonRow key={i} />)}
          </div>
        ) : peminjaman.length === 0 ? (
          <EmptyState icon={ClipboardList} label="Tidak ada pengajuan peminjaman yang menunggu persetujuan." />
        ) : (
          <div className="space-y-8">
            {peminjaman.map(item => (
              <Card
                key={item.id}
                className="p-0 overflow-hidden border-slate-100 hover:border-blue-200 transition-all shadow-sm"
              >
                <div className="flex items-stretch">
                  {/* Left accent bar */}
                  <div className="w-3 bg-blue-500 shrink-0 rounded-l-2xl" />

                  {/* Content */}
                  <div className="flex-1 flex flex-col md:flex-row md:items-center gap-13 p-13">
                    {/* Aset Info */}
                    <div className="flex-1 min-w-0 space-y-5">
                      <div className="flex items-start gap-8">
                        <div className="w-34 h-34 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                          <ClipboardList size={16} className="text-blue-600" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-black text-slate-800 truncate">
                            {item.aset?.nama_aset || `Aset #${item.id_aset}`}
                          </p>
                          <p className="font-mono text-[10px] text-blue-600 font-bold mt-1">
                            {item.aset?.kode_aset || '—'}
                          </p>
                        </div>
                      </div>

                      {/* Meta grid */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-8 pl-[42px]">
                        <div>
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-3">
                            <User size={9} /> Peminjam
                          </p>
                          <p className="text-xs font-semibold text-slate-700 truncate">
                            {item.nama_peminjam || '—'}
                          </p>
                        </div>
                        <div>
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-3">
                            <FileText size={9} /> Keperluan
                          </p>
                          <p className="text-xs text-slate-600 truncate">
                            {item.keperluan || '—'}
                          </p>
                        </div>
                        <div>
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-3">
                            <Calendar size={9} /> Tgl Pinjam
                          </p>
                          <p className="text-xs text-slate-600">{item.tanggal_pinjam || '—'}</p>
                        </div>
                        <div>
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-3">
                            <Calendar size={9} /> Tgl Kembali
                          </p>
                          <p className="text-xs font-semibold text-blue-700">{item.tanggal_kembali || '—'}</p>
                        </div>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-8 shrink-0 md:flex-col lg:flex-row">
                      <button
                        onClick={() => confirmSetujuiPeminjaman(item)}
                        disabled={actionLoading === item.id}
                        className="flex items-center gap-5 px-13 py-8 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all active:scale-95 disabled:opacity-50 shadow-sm shadow-emerald-500/20 whitespace-nowrap"
                      >
                        {actionLoading === item.id
                          ? <Loader2 size={13} className="animate-spin" />
                          : <CheckCircle2 size={13} />}
                        Setujui
                      </button>
                      <button
                        onClick={() => confirmTolakPeminjaman(item)}
                        disabled={actionLoading === item.id}
                        className="flex items-center gap-5 px-13 py-8 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 text-xs font-bold rounded-xl transition-all active:scale-95 disabled:opacity-50 whitespace-nowrap"
                      >
                        <XCircle size={13} /> Tolak
                      </button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="border-t border-slate-100" />

      {/* ════════════════════════════════════════════════════════════════════
          B. LAPORAN KERUSAKAN
      ════════════════════════════════════════════════════════════════════ */}
      <div className="space-y-13">
        {/* Section Header */}
        <div className="flex items-center gap-8">
          <div className="w-34 h-34 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
            <AlertTriangle size={18} className="text-amber-600" />
          </div>
          <div>
            <p className="text-sm font-black text-slate-800 tracking-tight">
              Laporan Kerusakan
            </p>
            <p className="text-[10px] text-slate-400 mt-1">Dari tabel <code className="font-mono bg-slate-100 px-3 py-1 rounded text-slate-600">laporan_kerusakan</code> — status: <span className="font-bold text-amber-600">menunggu</span></p>
          </div>
          {kerusakan.length > 0 && (
            <span className="ml-auto inline-flex items-center justify-center min-w-[22px] h-[22px] px-5 bg-amber-100 text-amber-700 text-[10px] font-black rounded-full">
              {kerusakan.length}
            </span>
          )}
        </div>

        {loadingK ? (
          <div className="space-y-8">
            {[1, 2].map(i => <SkeletonRow key={i} />)}
          </div>
        ) : kerusakan.length === 0 ? (
          <EmptyState icon={AlertTriangle} label="Tidak ada laporan kerusakan yang menunggu verifikasi." />
        ) : (
          <div className="space-y-8">
            {kerusakan.map(item => (
              <Card
                key={item.id}
                className="p-0 overflow-hidden border-slate-100 hover:border-amber-200 transition-all shadow-sm"
              >
                <div className="flex items-stretch">
                  {/* Left accent bar */}
                  <div className={`w-3 shrink-0 rounded-l-2xl ${
                    item.tingkat === 'Berat' ? 'bg-rose-500' :
                    item.tingkat === 'Sedang' ? 'bg-orange-400' :
                    'bg-amber-400'
                  }`} />

                  {/* Content */}
                  <div className="flex-1 flex flex-col md:flex-row md:items-center gap-13 p-13">
                    {/* Aset Info */}
                    <div className="flex-1 min-w-0 space-y-5">
                      <div className="flex items-start gap-8">
                        <div className="w-34 h-34 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
                          <AlertOctagon size={16} className="text-amber-600" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-black text-slate-800 truncate">
                            {item.aset?.nama_aset || `Aset #${item.id_aset}`}
                          </p>
                          <div className="flex items-center gap-5 mt-1">
                            <p className="font-mono text-[10px] text-amber-600 font-bold">
                              {item.aset?.kode_aset || '—'}
                            </p>
                            {item.tingkat && (
                              <span className={`text-[9px] font-black px-5 py-1 rounded-full ${tingkatBadge(item.tingkat)}`}>
                                {item.tingkat}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Meta grid */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-8 pl-[42px]">
                        <div>
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-3">
                            <User size={9} /> Pelapor
                          </p>
                          <p className="text-xs font-semibold text-slate-700 truncate">
                            {item.nama_pelapor || '—'}
                          </p>
                        </div>
                        <div>
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-3">
                            <AlertTriangle size={9} /> Kendala
                          </p>
                          <p className="text-xs text-slate-600 line-clamp-2">
                            {item.kendala || item.deskripsi || '—'}
                          </p>
                        </div>
                        <div>
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-3">
                            <Calendar size={9} /> Tanggal
                          </p>
                          <p className="text-xs text-slate-600">{item.tanggal || item.created_at?.split('T')[0] || '—'}</p>
                        </div>
                        <div>
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-3">
                            <ShieldCheck size={9} /> Efek Verifikasi
                          </p>
                          <p className="text-xs font-semibold text-orange-700">
                            → {item.tingkat === 'Ringan' ? 'Rusak Ringan' : 'Rusak Berat'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-8 shrink-0 md:flex-col lg:flex-row">
                      <button
                        onClick={() => confirmVerifikasiKerusakan(item)}
                        disabled={actionLoading === item.id}
                        className="flex items-center gap-5 px-13 py-8 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all active:scale-95 disabled:opacity-50 shadow-sm shadow-blue-500/20 whitespace-nowrap"
                      >
                        {actionLoading === item.id
                          ? <Loader2 size={13} className="animate-spin" />
                          : <ShieldCheck size={13} />}
                        Verifikasi
                      </button>
                      <button
                        onClick={() => confirmTolakKerusakan(item)}
                        disabled={actionLoading === item.id}
                        className="flex items-center gap-5 px-13 py-8 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 text-xs font-bold rounded-xl transition-all active:scale-95 disabled:opacity-50 whitespace-nowrap"
                      >
                        <XCircle size={13} /> Tolak
                      </button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* ── Confirm Modal ── */}
      <ConfirmModal
        open={modal.open}
        title={modal.title}
        message={modal.message}
        onConfirm={modal.onConfirm}
        onCancel={closeModal}
        loading={actionLoading !== null}
        confirmLabel={modal.confirmLabel}
        confirmClass={modal.confirmClass}
      />

    </div>
  );
}
