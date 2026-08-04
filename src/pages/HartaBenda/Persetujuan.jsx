import { useState, useEffect, useCallback, useRef } from 'react';
import {
  CheckCircle2,
  XCircle,
  Clock,
  ShieldCheck,
  ClipboardList,
  AlertTriangle,
  Loader2,
  User,
  Calendar,
  FileText,
  AlertOctagon,
  LayoutGrid,
  List,
  Download
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { supabase } from '../../lib/supabase';
import { Card } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { Table } from '../../components/ui/Table';

// ─── Badge Helpers ────────────────────────────────────────────────────────────
const tingkatBadge = (tingkat) => {
  switch (tingkat) {
    case 'Ringan': return 'bg-amber-50 text-amber-700 border border-amber-200';
    case 'Sedang': return 'bg-orange-50 text-orange-700 border border-orange-200';
    case 'Berat': return 'bg-rose-50 text-rose-700 border border-rose-200';
    default: return 'bg-slate-100 text-slate-600 border border-slate-200';
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
    <div className="flex flex-col items-center justify-center py-13 text-slate-400 bg-slate-50/60 rounded-xl border border-slate-100 border-dashed">
      <Icon size={20} className="mb-3 text-slate-300" />
      <p className="text-[11px] font-medium">{label}</p>
    </div>
  );
}

// ─── Komponen Confirm Modal (dengan field catatan opsional) ───────────────────
function ConfirmModal({
  open, title, message, onConfirm, onCancel,
  loading, confirmLabel, confirmClass,
  showCatatan, catatan, onCatatanChange,
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
        onClick={onCancel}
      />
      <div className="relative bg-white rounded-3xl shadow-xl border border-slate-100 w-full max-w-md p-21 flex flex-col gap-13 z-10 animate-in fade-in zoom-in-95 duration-150 text-center items-center">
        <div className="mt-8 w-full">
          <h3 className="text-lg font-black text-slate-800 tracking-tight mb-8">{title}</h3>
          <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto">{message}</p>

          {/* Field catatan penolakan (opsional) */}
          {showCatatan && (
            <div className="mt-13 text-left">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-5">
                Alasan Penolakan <span className="text-slate-400 font-normal">(opsional)</span>
              </label>
              <textarea
                value={catatan}
                onChange={e => onCatatanChange(e.target.value)}
                rows={3}
                className="w-full px-13 py-8 rounded-2xl border border-slate-200 bg-slate-50 text-xs focus:bg-white focus:border-rose-400 focus:ring-2 focus:ring-rose-100 outline-none transition-all resize-none"
                placeholder="Tulis alasan penolakan (opsional)..."
              />
            </div>
          )}
        </div>
        <div className="flex items-center justify-center gap-8 mt-5 w-full">
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

// ─── Card Components ────────────────────────────────────────────────────────────

function PersetujuanPeminjamanCard({ item, confirmSetujuiPeminjaman, confirmTolakPeminjaman, actionLoading }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200/80 p-3.5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group">
      
      {/* Header */}
      <div>
        <div className="flex justify-between items-start gap-2">
          <div className="min-w-0">
            <h3 className="font-bold text-slate-800 text-xs truncate max-w-[150px]" title={item.aset?.nama_aset}>
              {item.aset?.nama_aset || `Aset #${item.id_aset}`}
            </h3>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0 border bg-amber-50 text-amber-600 border-amber-100">
            Diajukan
          </span>
        </div>
        <span className="text-[11px] text-slate-400 font-normal mt-0.5 block truncate">
          {item.aset?.kode_aset || '—'}
        </span>

        {/* Body */}
        <div className="bg-slate-50/70 rounded-lg p-2 my-2.5 flex flex-col gap-2.5 border border-slate-100">
          {/* Row 1: Keperluan */}
          <div className="flex flex-col min-w-0">
            <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider block">Keperluan</span>
            <span className="text-[10px] font-bold text-slate-700 mt-0.5 truncate" title={item.keperluan}>{item.keperluan || '—'}</span>
          </div>

          {/* Row 2: Grid 2 cols */}
          <div className="grid grid-cols-2 gap-2 border-t border-slate-200/60 pt-2.5">
            <div className="flex flex-col min-w-0">
              <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider block">Peminjam</span>
              <span className="text-[10px] font-bold text-slate-700 mt-0.5 truncate" title={item.nama_peminjam}>{item.nama_peminjam || '—'}</span>
            </div>
            
            <div className="flex flex-col min-w-0">
              <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider block">Tanggal</span>
              <span className="text-[10px] font-bold text-slate-700 mt-0.5 truncate" title={`${item.tanggal_pinjam} s/d ${item.tanggal_kembali}`}>{item.tanggal_pinjam || '—'} s/d {item.tanggal_kembali || '—'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer (Buttons) */}
      <div className="mt-auto">
        <div className="flex items-center gap-4 pt-4 border-t border-slate-100 mt-4">
          <button
            onClick={() => confirmSetujuiPeminjaman(item)}
            disabled={actionLoading === item.id}
            className="flex-1 py-2 px-3 bg-teal-50/60 border border-teal-100 text-teal-600 hover:bg-teal-50 rounded-xl text-xs font-bold active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            {actionLoading === item.id ? <Loader2 size={12} className="animate-spin shrink-0" /> : 'Setujui'}
          </button>
          <button
            onClick={() => confirmTolakPeminjaman(item)}
            disabled={actionLoading === item.id}
            className="flex-1 py-2 px-3 bg-rose-50/60 border border-rose-100 text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-bold active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            Tolak
          </button>
        </div>
      </div>
    </div>
  );
}

function PersetujuanKerusakanCard({ item, confirmVerifikasiKerusakan, confirmTolakKerusakan, actionLoading, tingkatBadge }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200/80 p-3.5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group">
      
      {/* Header */}
      <div>
        <div className="flex justify-between items-start gap-2">
          <div className="min-w-0">
            <h3 className="font-bold text-slate-800 text-xs truncate max-w-[150px]" title={item.aset?.nama_aset}>
              {item.aset?.nama_aset || `Aset #${item.id_aset}`}
            </h3>
          </div>
          {item.tingkat && (
             <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0 border ${tingkatBadge(item.tingkat)}`}>
               {item.tingkat}
             </span>
          )}
        </div>
        <span className="text-[11px] text-slate-400 font-normal mt-0.5 block truncate">
          {item.aset?.kode_aset || '—'}
        </span>

        {/* Body */}
        <div className="bg-slate-50/70 rounded-lg p-2 my-2.5 flex flex-col gap-2.5 border border-slate-100">
          {/* Row 1: Kendala */}
          <div className="flex flex-col min-w-0">
            <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider block">Kendala / Kerusakan</span>
            <span className="text-[10px] font-bold text-slate-700 mt-0.5 truncate" title={item.kendala || item.deskripsi}>{item.kendala || item.deskripsi || '—'}</span>
          </div>

          {/* Row 2: Grid 2 cols */}
          <div className="grid grid-cols-2 gap-2 border-t border-slate-200/60 pt-2.5">
            <div className="flex flex-col min-w-0">
              <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider block">Pelapor</span>
              <span className="text-[10px] font-bold text-slate-700 mt-0.5 truncate" title={item.nama_pelapor}>{item.nama_pelapor || '—'}</span>
            </div>
            
            <div className="flex flex-col min-w-0">
              <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider block">Tgl Lapor</span>
              <span className="text-[10px] font-bold text-slate-700 mt-0.5 truncate" title={item.tanggal || item.created_at?.split('T')[0]}>{item.tanggal || item.created_at?.split('T')[0] || '—'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer (Buttons) */}
      <div className="mt-auto">
        <div className="flex items-center gap-4 pt-4 border-t border-slate-100 mt-4">
          <button
            onClick={() => confirmVerifikasiKerusakan(item)}
            disabled={actionLoading === item.id}
            className="flex-1 py-2 px-3 bg-teal-50/60 border border-teal-100 text-teal-600 hover:bg-teal-50 rounded-xl text-xs font-bold active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            {actionLoading === item.id ? <Loader2 size={12} className="animate-spin shrink-0" /> : 'Verifikasi'}
          </button>
          <button
            onClick={() => confirmTolakKerusakan(item)}
            disabled={actionLoading === item.id}
            className="flex-1 py-2 px-3 bg-rose-50/60 border border-rose-100 text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-bold active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            Tolak
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
  const [peminjaman, setPeminjaman] = useState([]);
  const [kerusakan, setKerusakan] = useState([]);
  const [loadingP, setLoadingP] = useState(true);
  const [loadingK, setLoadingK] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [isRealtime, setIsRealtime] = useState(false); // status koneksi realtime
  const [activeTab, setActiveTab] = useState('peminjaman'); // 'peminjaman' | 'kerusakan'
  const [viewMode, setViewMode] = useState('table'); // 'card' | 'table'

  // ── Confirm modal state ───────────────────────────────────────────────────
  const [modal, setModal] = useState({
    open: false, title: '', message: '',
    onConfirm: null, confirmLabel: '', confirmClass: '',
    showCatatan: false,
  });
  const [catatan, setCatatan] = useState('');

  // ── Ref untuk channel realtime ────────────────────────────────────────────
  const channelRef = useRef(null);

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
      // Mendukung semua variasi string status laporan awal
      .in('status', ['menunggu', 'MENUNGGU PENGECEKAN', 'menunggu_pengecekan'])
      .order('created_at', { ascending: false });
    if (!error) setKerusakan(data || []);
    setLoadingK(false);
  }, []);

  // Fetch awal saat komponen mount
  useEffect(() => {
    fetchPeminjaman();
    fetchKerusakan();
  }, [fetchPeminjaman, fetchKerusakan]);

  // ── Supabase Realtime Listener ────────────────────────────────────────────
  useEffect(() => {
    // Buat channel dengan nama unik
    const channel = supabase.channel('persetujuan-admin-realtime', {
      config: { broadcast: { self: false } },
    });

    channel
      // Listen perubahan di tabel peminjaman_aset
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'peminjaman_aset' },
        (payload) => {
          // Ada pengajuan pinjam baru masuk — re-fetch seluruh list (untuk join aset)
          fetchPeminjaman();
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'peminjaman_aset' },
        (payload) => {
          const updated = payload.new;
          if (updated.status !== 'pending') {
            // Sudah diproses — hapus dari list
            setPeminjaman(prev => prev.filter(p => p.id !== updated.id));
          } else {
            setPeminjaman(prev =>
              prev.map(p => p.id === updated.id ? { ...p, ...updated } : p)
            );
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'peminjaman_aset' },
        (payload) => {
          setPeminjaman(prev => prev.filter(p => p.id !== payload.old.id));
        }
      )
      // Listen perubahan di tabel laporan_kerusakan
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'laporan_kerusakan' },
        (payload) => {
          // Laporan baru masuk — re-fetch (untuk join aset)
          fetchKerusakan();
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'laporan_kerusakan' },
        (payload) => {
          const updated = payload.new;
          const statusPending = ['menunggu', 'MENUNGGU PENGECEKAN', 'menunggu_pengecekan'];
          if (!statusPending.includes(updated.status)) {
            // Sudah diproses — hapus dari list
            setKerusakan(prev => prev.filter(k => k.id !== updated.id));
          } else {
            setKerusakan(prev =>
              prev.map(k => k.id === updated.id ? { ...k, ...updated } : k)
            );
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'laporan_kerusakan' },
        (payload) => {
          setKerusakan(prev => prev.filter(k => k.id !== payload.old.id));
        }
      )
      .subscribe((status) => {
        setIsRealtime(status === 'SUBSCRIBED');
      });

    channelRef.current = channel;

    // Cleanup saat komponen unmount
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [fetchPeminjaman, fetchKerusakan]);

  const closeModal = () => {
    setModal({ open: false, title: '', message: '', onConfirm: null, confirmLabel: '', confirmClass: '', showCatatan: false });
    setCatatan('');
  };

  // ── Handler: Setujui Peminjaman ───────────────────────────────────────────
  const doSetujuiPeminjaman = async (item) => {
    setActionLoading(item.id);
    try {
      // 1. Update status peminjaman_aset → disetujui
      const { error: e1 } = await supabase
        .from('peminjaman_aset')
        .update({ status: 'disetujui', catatan_admin: catatan || null })
        .eq('id', item.id);
      if (e1) throw e1;

      // 2. Insert ke log_aktivitas_aset (catat bahwa aset dipinjam)
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
        .update({ status: 'ditolak', catatan_admin: catatan || null })
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
      // 1. Update status laporan_kerusakan → diverifikasi
      const { error: e1 } = await supabase
        .from('laporan_kerusakan')
        .update({ status: 'diverifikasi', catatan_admin: catatan || null })
        .eq('id', item.id);
      if (e1) throw e1;

      // 2. Update status_kondisi aset sesuai tingkat kerusakan
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
        .update({ status: 'ditolak', catatan_admin: catatan || null })
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
  const confirmSetujuiPeminjaman = (item) => {
    setCatatan('');
    setModal({
      open: true,
      title: 'Setujui Peminjaman?',
      message: `Setujui peminjaman aset "${item.aset?.nama_aset}" oleh ${item.nama_peminjam}? Log aktivitas "Dipinjam" akan otomatis dicatat.`,
      onConfirm: () => doSetujuiPeminjaman(item),
      confirmLabel: 'Ya, Setujui',
      confirmClass: 'bg-emerald-600 hover:bg-emerald-700',
      showCatatan: false,
    });
  };

  const confirmTolakPeminjaman = (item) => {
    setCatatan('');
    setModal({
      open: true,
      title: 'Tolak Peminjaman?',
      message: `Tolak peminjaman aset "${item.aset?.nama_aset}" oleh ${item.nama_peminjam}?`,
      onConfirm: () => doTolakPeminjaman(item),
      confirmLabel: 'Ya, Tolak',
      confirmClass: 'bg-rose-600 hover:bg-rose-700',
      showCatatan: true,
    });
  };

  const confirmVerifikasiKerusakan = (item) => {
    setCatatan('');
    setModal({
      open: true,
      title: 'Verifikasi Laporan Kerusakan?',
      message: `Verifikasi laporan dari ${item.nama_pelapor} untuk aset "${item.aset?.nama_aset}"? Kondisi aset akan diubah ke "${item.tingkat === 'Ringan' ? 'Rusak Ringan' : 'Rusak Berat'}".`,
      onConfirm: () => doVerifikasiKerusakan(item),
      confirmLabel: 'Ya, Verifikasi',
      confirmClass: 'bg-teal-600 hover:bg-teal-700',
      showCatatan: false,
    });
  };

  const confirmTolakKerusakan = (item) => {
    setCatatan('');
    setModal({
      open: true,
      title: 'Tolak Laporan Kerusakan?',
      message: `Tolak laporan kerusakan dari ${item.nama_pelapor}? Kondisi aset tidak akan berubah.`,
      onConfirm: () => doTolakKerusakan(item),
      confirmLabel: 'Ya, Tolak',
      confirmClass: 'bg-rose-600 hover:bg-rose-700',
      showCatatan: true,
    });
  };

  const handleExport = () => {
    const wb = XLSX.utils.book_new();

    if (activeTab === 'peminjaman') {
      const exportData = peminjaman.map(item => ({
        'ID Peminjaman': item.id,
        'Kode Aset': item.aset?.kode_aset || '-',
        'Nama Aset': item.aset?.nama_aset || '-',
        'Peminjam': item.nama_peminjam || '-',
        'Keperluan': item.keperluan || '-',
        'Tanggal Pinjam': item.tanggal_pinjam || '-',
        'Tanggal Kembali': item.tanggal_kembali || '-',
        'Status': item.status || 'Pending'
      }));
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(exportData), 'Peminjaman');
      XLSX.writeFile(wb, 'Data_Persetujuan_Peminjaman.xlsx');
    } else if (activeTab === 'kerusakan') {
      const exportData = kerusakan.map(item => ({
        'ID Laporan': item.id,
        'Kode Aset': item.aset?.kode_aset || '-',
        'Nama Aset': item.aset?.nama_aset || '-',
        'Pelapor': item.nama_pelapor || '-',
        'Kendala / Kerusakan': item.kendala || item.deskripsi || '-',
        'Tingkat': item.tingkat || '-',
        'Tanggal Lapor': item.tanggal || item.created_at?.split('T')[0] || '-',
        'Status': item.status || 'Pending'
      }));
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(exportData), 'Kerusakan');
      XLSX.writeFile(wb, 'Data_Persetujuan_Kerusakan.xlsx');
    }
  };

  // ── Total badge count ─────────────────────────────────────────────────────
  const totalPending = peminjaman.length + kerusakan.length;

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-8">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
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
            Daftar pengajuan peminjaman dan laporan kerusakan yang memerlukan verifikasi.
          </p>
        </div>
        <div className="flex gap-5">
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
          
          <button
            onClick={handleExport}
            className="w-[34px] h-[34px] rounded-xl border border-slate-200 bg-white text-slate-500 hover:text-teal-600 hover:border-teal-200 transition-colors flex items-center justify-center shadow-sm"
            title="Export Excel"
          >
            <Download size={15} />
          </button>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="flex bg-slate-100 rounded-xl p-3 w-fit mt-5">
        <button
          onClick={() => setActiveTab('peminjaman')}
          className={`px-13 py-5 rounded-lg transition-colors text-xs font-bold flex items-center gap-5 ${activeTab === 'peminjaman' ? 'bg-white shadow-sm text-teal-600' : 'text-slate-400 hover:text-slate-600'}`}
        >
          Pengajuan Peminjaman
          {peminjaman.length > 0 && (
            <span className={`px-5 py-2 rounded-md text-[9px] ${activeTab === 'peminjaman' ? 'bg-teal-50 text-teal-700' : 'bg-slate-200 text-slate-500'}`}>
              {peminjaman.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('kerusakan')}
          className={`px-13 py-5 rounded-lg transition-colors text-xs font-bold flex items-center gap-5 ${activeTab === 'kerusakan' ? 'bg-white shadow-sm text-teal-600' : 'text-slate-400 hover:text-slate-600'}`}
        >
          Laporan Kerusakan
          {kerusakan.length > 0 && (
            <span className={`px-5 py-2 rounded-md text-[9px] ${activeTab === 'kerusakan' ? 'bg-teal-50 text-teal-700' : 'bg-slate-200 text-slate-500'}`}>
              {kerusakan.length}
            </span>
          )}
        </button>
      </div>

      {/* ── Tab Content ── */}
      {activeTab === 'peminjaman' && (
        <div className="space-y-13 animate-[fadeUp_.35s_ease_both]">
          {loadingP ? (
            <div className="space-y-8">
              {[1, 2].map(i => <SkeletonRow key={i} />)}
            </div>
          ) : peminjaman.length === 0 ? (
            <EmptyState icon={ClipboardList} label="Tidak ada pengajuan peminjaman yang menunggu persetujuan." />
          ) : viewMode === 'card' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              {peminjaman.map((item) => (
                <PersetujuanPeminjamanCard
                  key={item.id}
                  item={item}
                  confirmSetujuiPeminjaman={confirmSetujuiPeminjaman}
                  confirmTolakPeminjaman={confirmTolakPeminjaman}
                  actionLoading={actionLoading}
                />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <Table headers={['Aset', 'Peminjam', 'Keperluan', 'Tgl Pinjam - Kembali', 'Aksi']}>
                {peminjaman.map(item => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors border-b border-slate-100 last:border-b-0">
                    <td className="px-13 py-13">
                      <div className="flex flex-col">
                        <span className="text-xs font-semibold text-slate-800">{item.aset?.nama_aset || `Aset #${item.id_aset}`}</span>
                        <span className="font-mono text-[10px] text-teal-600 font-bold mt-1">{item.aset?.kode_aset || '—'}</span>
                      </div>
                    </td>
                    <td className="px-13 py-13 text-xs text-slate-700 font-medium">
                      {item.nama_peminjam || '—'}
                    </td>
                    <td className="px-13 py-13 text-xs text-slate-500 max-w-[200px] truncate" title={item.keperluan || ''}>
                      {item.keperluan || '—'}
                    </td>
                    <td className="px-13 py-13">
                      <div className="flex flex-col gap-2">
                        <span className="text-[10px] font-medium text-slate-600 flex items-center gap-3"><Calendar size={10} /> {item.tanggal_pinjam || '—'}</span>
                        <span className="text-[10px] font-bold text-teal-700 flex items-center gap-3"><Calendar size={10} /> {item.tanggal_kembali || '—'}</span>
                      </div>
                    </td>
                    <td className="px-13 py-13 text-right">
                      <div className="flex justify-end gap-5">
                        <button
                          onClick={() => confirmSetujuiPeminjaman(item)}
                          disabled={actionLoading === item.id}
                          className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 transition-colors disabled:opacity-50"
                          title="Setujui Peminjaman"
                        >
                          {actionLoading === item.id ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                        </button>
                        <button
                          onClick={() => confirmTolakPeminjaman(item)}
                          disabled={actionLoading === item.id}
                          className="p-1.5 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-100 transition-colors disabled:opacity-50"
                          title="Tolak Peminjaman"
                        >
                          <XCircle size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </Table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'kerusakan' && (
        <div className="space-y-13 animate-[fadeUp_.35s_ease_both]">
          {loadingK ? (
            <div className="space-y-8">
              {[1, 2].map(i => <SkeletonRow key={i} />)}
            </div>
          ) : kerusakan.length === 0 ? (
            <EmptyState icon={AlertTriangle} label="Tidak ada laporan kerusakan yang menunggu verifikasi." />
          ) : viewMode === 'card' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              {kerusakan.map((item) => (
                <PersetujuanKerusakanCard
                  key={item.id}
                  item={item}
                  confirmVerifikasiKerusakan={confirmVerifikasiKerusakan}
                  confirmTolakKerusakan={confirmTolakKerusakan}
                  actionLoading={actionLoading}
                  tingkatBadge={tingkatBadge}
                />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <Table headers={['Aset', 'Pelapor', 'Kendala', 'Tgl Lapor', 'Efek Verifikasi', 'Aksi']}>
                {kerusakan.map(item => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors border-b border-slate-100 last:border-b-0">
                    <td className="px-13 py-13">
                      <div className="flex flex-col">
                        <span className="text-xs font-semibold text-slate-800">{item.aset?.nama_aset || `Aset #${item.id_aset}`}</span>
                        <div className="flex items-center gap-5 mt-1">
                          <span className="font-mono text-[10px] text-teal-600 font-bold">{item.aset?.kode_aset || '—'}</span>
                          {item.tingkat && (
                            <span className={`text-[9px] font-black px-5 py-1 rounded-full ${tingkatBadge(item.tingkat)}`}>
                              {item.tingkat}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-13 py-13 text-xs text-slate-700 font-medium">
                      {item.nama_pelapor || '—'}
                    </td>
                    <td className="px-13 py-13 text-xs text-slate-500 max-w-[200px] truncate" title={item.kendala || item.deskripsi || ''}>
                      {item.kendala || item.deskripsi || '—'}
                    </td>
                    <td className="px-13 py-13 text-[10px] font-medium text-slate-600">
                      {item.tanggal || item.created_at?.split('T')[0] || '—'}
                    </td>
                    <td className="px-13 py-13 text-[10px] font-bold text-teal-700">
                      → {item.tingkat === 'Ringan' ? 'Rusak Ringan' : 'Rusak Berat'}
                    </td>
                    <td className="px-13 py-13 text-right">
                      <div className="flex justify-end gap-5">
                        <button
                          onClick={() => confirmVerifikasiKerusakan(item)}
                          disabled={actionLoading === item.id}
                          className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 transition-colors disabled:opacity-50"
                          title="Verifikasi Kerusakan"
                        >
                          {actionLoading === item.id ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                        </button>
                        <button
                          onClick={() => confirmTolakKerusakan(item)}
                          disabled={actionLoading === item.id}
                          className="p-1.5 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-100 transition-colors disabled:opacity-50"
                          title="Tolak Kerusakan"
                        >
                          <XCircle size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </Table>
            </div>
          )}
        </div>
      )}

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
        showCatatan={modal.showCatatan}
        catatan={catatan}
        onCatatanChange={setCatatan}
      />

    </div>
  );
}
