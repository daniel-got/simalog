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
      bg: 'bg-amber-50 text-amber-600 border border-amber-100',
      icon: Clock,
    },
    Disetujui: {
      label: 'Disetujui',
      bg: 'bg-emerald-50 text-emerald-600 border border-emerald-100',
      icon: CheckCircle2,
    },
    Ditolak: {
      label: 'Ditolak',
      bg: 'bg-rose-50 text-rose-600 border border-rose-100',
      icon: XCircle,
    },
  };

  const currentStatus = statusConfig[status] || statusConfig.Diajukan;
  const StatusIcon = currentStatus.icon;

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 p-3.5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group">
      
      {/* ── Top Body Section ── */}
      <div>
        {/* Header Card */}
        <div>
          <div className="flex justify-between items-start gap-2">
            <h3 className="font-bold text-slate-800 text-xs truncate max-w-[130px]" title={namaBarang}>
              {namaBarang}
            </h3>
            {/* Status Badge */}
            <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0 border", currentStatus.bg)}>
              {currentStatus.label}
            </span>
          </div>
          <span className="text-[11px] text-slate-400 font-normal mt-0.5 block truncate" title={`${item.kode_barang} ${barangInfo?.kelompok_barang ? '• ' + barangInfo.kelompok_barang : ''}`}>
            {item.kode_barang} {barangInfo?.kelompok_barang && `• ${barangInfo.kelompok_barang}`}
          </span>
        </div>

        {/* Body Card (Box Qty) */}
        <div className="bg-slate-50/70 rounded-lg p-2 my-2.5 grid grid-cols-2 divide-x divide-slate-200/60 border border-slate-100">
          <div className="flex flex-col">
            <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider block">Minta Qty</span>
            <span className="text-sm font-bold text-teal-600 mt-0.5">
              {item.jumlah} <span className="text-[10px] font-normal text-slate-500">{barangInfo?.satuan || ''}</span>
            </span>
          </div>

          <div className="flex flex-col pl-2">
            <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider block">Stok Gudang</span>
            <div className="flex items-center gap-1 mt-0.5">
              <span className={cn(
                "text-sm font-bold",
                isStokKurang ? "text-rose-600" : "text-slate-700"
              )}>
                {stokSaatIni !== undefined ? stokSaatIni : '-'}
              </span>
              {isStokKurang && (
                <span className="inline-flex items-center text-[9px] font-bold text-rose-600 bg-rose-50 px-1 py-0.5 rounded border border-rose-200 ml-1" title="Stok gudang tidak mencukupi!">
                  <AlertTriangle size={10} className="mr-0.5" /> Kurang
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Footer Card ── */}
      <div className="mt-auto">
        <div className="flex items-end justify-between">
          <div className="flex flex-col">
            <span className="text-[11px] font-medium text-slate-600 flex items-center gap-1 truncate max-w-[120px]" title={item.nama_pemohon || 'Guest'}>
              <User size={12} className="text-slate-400 shrink-0" />
              <span className="truncate">{item.nama_pemohon || 'Guest'}</span>
            </span>
            <span className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
              <Calendar size={10} className="text-slate-300" />
              <span>{item.tanggal_minta}</span>
            </span>
          </div>

          {/* Action Icons (Edit & Hapus) */}
          <div className="flex items-center gap-2">
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
          <div className="flex items-center gap-2 pt-2.5 border-t border-slate-100 mt-2.5">
            <button
              type="button"
              onClick={() => onUpdateStatus(item.id, 'Disetujui')}
              className="flex-1 py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold shadow-sm active:scale-95 transition-all flex items-center justify-center gap-1"
            >
              <CheckCircle2 size={12} /> Setujui
            </button>
            <button
              type="button"
              onClick={() => onUpdateStatus(item.id, 'Ditolak')}
              className="flex-1 py-1.5 px-3 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[11px] font-bold shadow-sm active:scale-95 transition-all flex items-center justify-center gap-1"
            >
              <XCircle size={12} /> Tolak
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
