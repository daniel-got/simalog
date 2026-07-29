import { Clock, CheckCircle2, XCircle, User, Calendar, Pencil, Trash2, AlertTriangle } from 'lucide-react';
import { cn } from '../../utils/cn';

/**
 * PermintaanCard
 * Komponen Card khusus untuk menampilkan item Permintaan Logistik dengan layout visual yang rapi,
 * indikator status persetujuan, info stok barang, metadata pemohon, dan aksi persetujuan admin.
 */
export default function PermintaanCard({
  item,
  barangInfo,
  currentUser,
  onEdit,
  onDelete,
  onUpdateStatus,
}) {
  const status = item.status_persetujuan || 'Diajukan';
  const isAdmin = currentUser?.role === 'Admin';

  const namaBarang = barangInfo?.nama_barang || 'Barang Tidak Ditemukan';
  const stokSaatIni = barangInfo?.stok_saat_ini;
  const isStokKurang = stokSaatIni !== undefined && stokSaatIni < item.jumlah;

  // Status visual configurations
  const statusConfig = {
    Diajukan: {
      label: 'Diajukan',
      bg: 'bg-amber-50 text-amber-700 border-amber-200/80',
      icon: Clock,
    },
    Disetujui: {
      label: 'Disetujui',
      bg: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
      icon: CheckCircle2,
    },
    Ditolak: {
      label: 'Ditolak',
      bg: 'bg-rose-50 text-rose-700 border-rose-200/80',
      icon: XCircle,
    },
  };

  const currentStatus = statusConfig[status] || statusConfig.Diajukan;
  const StatusIcon = currentStatus.icon;

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-4.5 shadow-sm hover:shadow-md hover:border-slate-200 transition-all duration-200 flex flex-col justify-between overflow-hidden group">
      
      {/* ── Top Body Section ── */}
      <div>
        {/* Barang Info Section */}
        <div className="mb-3.5">
          <h3 className="text-sm font-bold text-slate-800 leading-snug truncate" title={namaBarang}>
            {namaBarang}
          </h3>
          <div className="flex items-center gap-2 mt-1">
            <span className="font-mono text-[10px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-100/60">
              {item.kode_barang}
            </span>
            {barangInfo?.kelompok_barang && (
              <span className="text-[10px] text-slate-400 font-medium truncate">
                {barangInfo.kelompok_barang}
              </span>
            )}
          </div>
        </div>

        {/* Quantity & Stock Alert Grid */}
        <div className="bg-slate-50/80 rounded-xl p-3 border border-slate-100/80 grid grid-cols-2 gap-2 mb-3.5">
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Minta Qty</span>
            <span className="text-sm font-black text-teal-700 mt-0.5">
              {item.jumlah} <span className="text-[10px] font-normal text-slate-500">{barangInfo?.satuan || 'unit'}</span>
            </span>
          </div>

          <div className="flex flex-col">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Stok Gudang</span>
            <div className="flex items-center gap-1 mt-0.5">
              <span className={cn(
                "text-xs font-bold",
                isStokKurang ? "text-rose-600 font-black" : "text-slate-700"
              )}>
                {stokSaatIni !== undefined ? stokSaatIni : '-'}
              </span>
              {isStokKurang && (
                <span className="inline-flex items-center text-[9px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.2 rounded border border-rose-200" title="Stok gudang tidak mencukupi!">
                  <AlertTriangle size={10} className="mr-0.5" /> Kurang
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Pemohon & Tanggal Metadata */}
        <div className="space-y-1.5 text-xs text-slate-500 pb-3">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-slate-600 font-medium truncate">
              <User size={12} className="text-slate-400 shrink-0" />
              <span className="truncate">{item.nama_pemohon || 'Guest'}</span>
            </span>
            <span className="flex items-center gap-1.5 text-[11px] text-slate-400 shrink-0">
              <Calendar size={11} className="text-slate-400" />
              <span>{item.tanggal_minta}</span>
            </span>
          </div>

        </div>
      </div>

      {/* ── Bottom Footer: Status Badge & Action Icons (Edit / Hapus) ── */}
      <div className="pt-3 border-t border-slate-100 flex flex-col gap-2.5">
        <div className="flex items-center justify-between gap-2">
          {/* Status Badge (Disetujui / Ditolak / Diajukan) */}
          <div className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-bold tracking-tight", currentStatus.bg)}>
            <StatusIcon size={13} className="shrink-0" />
            <span>{currentStatus.label}</span>
          </div>

          {/* Action Icons (Edit & Hapus) */}
          <div className="flex items-center gap-1">
            {onEdit && (
              <button
                onClick={onEdit}
                className="p-1.5 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                title="Edit Permintaan"
              >
                <Pencil size={14} strokeWidth={2} />
              </button>
            )}
            {onDelete && (
              <button
                onClick={onDelete}
                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                title="Hapus Permintaan"
              >
                <Trash2 size={14} strokeWidth={2} />
              </button>
            )}
          </div>
        </div>

        {/* Admin Approval Controls (Setujui / Tolak) */}
        {isAdmin && onUpdateStatus && (status === 'Diajukan' || status === 'Pending') && (
          <div className="flex items-center gap-2 pt-1 border-t border-slate-100/60">
            <button
              type="button"
              onClick={() => onUpdateStatus(item.id, 'Disetujui')}
              className="flex-1 py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs active:scale-95 transition-all flex items-center justify-center gap-1"
            >
              <CheckCircle2 size={13} /> Setujui
            </button>
            <button
              type="button"
              onClick={() => onUpdateStatus(item.id, 'Ditolak')}
              className="flex-1 py-1.5 px-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-xs active:scale-95 transition-all flex items-center justify-center gap-1"
            >
              <XCircle size={13} /> Tolak
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
