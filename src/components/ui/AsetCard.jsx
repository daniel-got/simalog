import { Calendar, Pencil, Trash2, Image as ImageIcon } from 'lucide-react';
import { cn } from '../../utils/cn';
import { useNavigate } from 'react-router-dom';

const kondisiBadge = (k) => {
  const map = {
    'Baik': 'bg-emerald-50 text-emerald-600',
    'Rusak Ringan': 'bg-amber-50 text-amber-600',
    'Rusak Berat': 'bg-red-50 text-red-600',
    'Dihapuskan': 'bg-slate-100 text-slate-500',
  };
  return map[k] || 'bg-slate-100 text-slate-500';
};

const formatRupiah = (n) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n || 0);

export default function AsetCard({
  id,
  namaAset,
  kodeAset,
  kelompok,
  subKelompok,
  lokasi,
  merek,
  hargaBeli,
  kondisi,
  tanggalPerolehan,
  fotoUrl,
  isAdmin,
  onEdit,
  onDelete
}) {
  const navigate = useNavigate();

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col justify-between group hover:border-slate-200 hover:shadow-md transition-all">
      {/* Gambar full width */}
      <div className="w-full h-40 bg-slate-50 border-b border-slate-100 flex flex-col items-center justify-center text-slate-300 relative overflow-hidden">
        {fotoUrl ? (
          <img
            src={fotoUrl}
            alt={namaAset}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <>
            <ImageIcon size={24} className="mb-4" />
            <span className="text-[10px] font-medium">Tidak ada gambar</span>
          </>
        )}
      </div>

      <div className="p-21 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex justify-between items-start gap-3">
            <h4
              onClick={() => navigate(`/harta-benda/aset/${id}`)}
              className="text-sm font-bold text-slate-800 line-clamp-2 cursor-pointer hover:text-teal-600 transition-colors"
              title={namaAset}
            >
              {namaAset}
            </h4>
            <span className={`text-[9px] font-bold px-5 py-2 rounded-md shrink-0 ${kondisiBadge(kondisi)}`}>
              {kondisi}
            </span>
          </div>

          <p className="font-mono text-[9px] text-teal-600 font-bold mt-2">{kodeAset || '—'}</p>
          <p className="text-[10px] text-slate-400 mt-1 truncate">
            {kelompok || ''}{subKelompok ? ' › ' + subKelompok : ''}
          </p>

          <div className="mt-8 pt-8 border-t border-slate-50 space-y-3">
            <div className="flex justify-between text-[10px] text-slate-500 gap-3">
              <span className="font-medium text-slate-400 shrink-0">Lokasi</span>
              <span className="font-semibold text-slate-700 truncate text-right">{lokasi || '—'}</span>
            </div>
            <div className="flex justify-between text-[10px] text-slate-500 gap-3">
              <span className="font-medium text-slate-400 shrink-0">Merek</span>
              <span className="font-semibold text-slate-700 truncate text-right">{merek || '—'}</span>
            </div>
            <div className="flex justify-between text-[10px] text-slate-500 gap-3">
              <span className="font-medium text-slate-400 shrink-0">Harga Beli</span>
              <span className="font-bold text-teal-600 font-mono text-right truncate">{formatRupiah(hargaBeli)}</span>
            </div>
          </div>
        </div>

        <div className="flex justify-between items-end sm:items-center mt-13 pt-8 border-t border-slate-100 flex-wrap sm:flex-nowrap gap-3">
          <span className="text-[9px] text-slate-400 font-medium flex items-center gap-2">
            <Calendar size={10} /> {tanggalPerolehan}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => navigate(`/harta-benda/aset/${id}`)}
              className="text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors px-8 py-5 flex items-center justify-center text-[10px] font-bold shrink-0"
              title="Detail"
            >
              Detail
            </button>
            {isAdmin && (
              <>
                <button
                  onClick={onEdit}
                  className="w-21 h-21 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center hover:bg-teal-100 transition-colors shrink-0"
                  title="Edit"
                >
                  <Pencil size={12} />
                </button>
                <button
                  onClick={onDelete}
                  className="w-21 h-21 rounded-lg bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-100 transition-colors shrink-0"
                  title="Hapus"
                >
                  <Trash2 size={12} />
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
