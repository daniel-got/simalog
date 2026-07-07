import { ChevronLeft, ChevronRight } from 'lucide-react';

const PER_PAGE_OPTIONS = [10, 50, 100];

export default function Pagination({ total, perPage, currentPage, onPageChange, onPerPageChange }) {
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const start = total === 0 ? 0 : (currentPage - 1) * perPage + 1;
  const end   = Math.min(currentPage * perPage, total);

  // Build page numbers to show: always first, last, current ±1
  const pages = [];
  const add = (p) => { if (p >= 1 && p <= totalPages && !pages.includes(p)) pages.push(p); };
  add(1);
  add(currentPage - 1);
  add(currentPage);
  add(currentPage + 1);
  add(totalPages);
  pages.sort((a, b) => a - b);

  // Insert ellipsis markers
  const pageItems = [];
  for (let i = 0; i < pages.length; i++) {
    if (i > 0 && pages[i] - pages[i - 1] > 1) pageItems.push('...');
    pageItems.push(pages[i]);
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-13 pt-13 border-t border-slate-100">
      
      {/* Left: info + per-page */}
      <div className="flex items-center gap-8 text-xs text-slate-500">
        <span>
          {total === 0 ? 'Tidak ada data' : `${start}–${end} dari ${total} item`}
        </span>
        <div className="flex items-center gap-5">
          <span className="font-medium text-slate-400 hidden sm:inline">Tampilkan</span>
          <select
            value={perPage}
            onChange={e => { onPerPageChange(Number(e.target.value)); onPageChange(1); }}
            className="px-5 py-3 text-xs bg-white border border-slate-200 rounded-lg focus:border-teal-500 focus:ring-2 focus:ring-teal-100 outline-none font-semibold text-slate-700 cursor-pointer"
          >
            {PER_PAGE_OPTIONS.map(n => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
          <span className="font-medium text-slate-400 hidden sm:inline">per halaman</span>
        </div>
      </div>

      {/* Right: page navigation */}
      {totalPages > 1 && (
        <div className="flex items-center gap-3">
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="w-21 h-21 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500
              hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft size={13} />
          </button>

          {pageItems.map((item, idx) =>
            item === '...' ? (
              <span key={`ellipsis-${idx}`} className="text-xs text-slate-400 px-2">…</span>
            ) : (
              <button
                key={item}
                onClick={() => onPageChange(item)}
                className={`w-21 h-21 flex items-center justify-center rounded-lg text-xs font-bold transition-colors
                  ${currentPage === item
                    ? 'bg-teal-600 text-white border border-teal-600 shadow-sm'
                    : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
              >
                {item}
              </button>
            )
          )}

          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="w-21 h-21 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500
              hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight size={13} />
          </button>
        </div>
      )}
    </div>
  );
}
