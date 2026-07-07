import { Pencil, Trash2, Image as ImageIcon } from 'lucide-react';
import { cn } from '../../utils/cn';

export default function ItemCard({
  itemName,
  itemCode,
  category,
  subCategory,
  price,
  unit,
  imageUrl,
  stock,
  onEdit,
  onDelete
}) {
  const isLowStock = stock <= 5;

  return (
    <div className="bg-white p-13 lg:p-0 rounded-2xl border border-slate-100 shadow-sm flex flex-row lg:flex-col gap-13 lg:gap-0 items-center lg:items-stretch overflow-hidden group hover:shadow-md transition-shadow">

      {/* Container Gambar (89px di mobile, full width x tinggi 144px di desktop) */}
      <div className="w-89 h-89 lg:w-full lg:h-36 bg-slate-50 rounded-xl lg:rounded-none lg:border-0 lg:border-b border border-slate-100 flex items-center justify-center overflow-hidden flex-shrink-0 relative">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={itemName}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <ImageIcon size={21} className="text-slate-300" />
        )}
      </div>

      {/* Container Konten */}
      <div className="flex-1 min-w-0 flex flex-col justify-between py-2 lg:p-13">

        <div className="flex flex-col">
          {/* Header Mobile: Kode & Stok */}
          <div className="flex justify-between items-start gap-5 lg:hidden mb-2">
            <span className="text-[9px] font-mono bg-teal-50 text-teal-700 px-5 py-2 rounded-md font-bold uppercase tracking-wider truncate">
              {itemCode}
            </span>
            <span className="text-[10px] text-slate-400 font-bold whitespace-nowrap bg-slate-50 px-5 py-2 rounded-md">
              Stok: <span className={cn(isLowStock ? 'text-red-500' : 'text-slate-700')}>{stock}</span>
            </span>
          </div>

          {/* Name (Tampil di Mobile & Desktop) */}
          <h3 className="text-sm font-bold text-slate-800 leading-tight truncate mb-2">
            {itemName}
          </h3>

          {/* Kategori */}
          <p className="text-[10px] font-medium text-slate-500 truncate mt-2 lg:mt-0">
            <span>{category || '-'}</span> <span className="text-slate-300 mx-2">/</span> <span>{subCategory || '-'}</span>
          </p>

          {/* Kode Barang / SKU (Desktop Only) */}
          <h4 className="hidden lg:block text-[10px] font-mono text-slate-400 truncate mt-2">
            {itemCode}
          </h4>
        </div>

        {/* Footer: Harga & Tombol Aksi */}
        <div className="flex justify-between items-end lg:items-end mt-8 lg:mt-13 pt-5 lg:pt-8 border-t border-slate-50">
          <div className="flex flex-col">
            <span className="hidden lg:block text-[10px] font-semibold text-slate-500 mb-3">
              Sisa Stok: <span className={cn('font-bold', isLowStock ? 'text-rose-500' : 'text-slate-800')}>{stock}</span>
            </span>
            <span className="text-xs font-black text-emerald-600 leading-none">
              {price || '-'}
            </span>
            <span className="text-[9px] text-slate-400 font-medium mt-1">
              per {unit || 'unit'}
            </span>
          </div>

          <div className="flex gap-5">
            <button
              onClick={onEdit}
              className="text-teal-600 bg-teal-50 hover:bg-teal-100 rounded-lg transition-colors p-5 flex items-center justify-center"
              title="Edit"
            >
              <Pencil size={13} strokeWidth={2.5} />
            </button>
            <button
              onClick={onDelete}
              className="text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors p-5 flex items-center justify-center"
              title="Hapus"
            >
              <Trash2 size={13} strokeWidth={2.5} />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
