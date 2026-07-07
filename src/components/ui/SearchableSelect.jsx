import { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown } from 'lucide-react';
import { cn } from '../../utils/cn';

export default function SearchableSelect({
  label,
  options,
  value,
  onChange,
  required,
  disabled,
  placeholder = 'Pilih atau cari...',
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const wrapperRef = useRef(null);
  
  // Cari opsi yang saat ini terpilih
  const selectedOption = options.find(opt => opt.value === value);
  const displayValue = selectedOption ? selectedOption.label : '';

  useEffect(() => {
    // Menutup dropdown saat klik di luar
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredOptions = options.filter(opt => 
    opt.label.toLowerCase().includes(query.toLowerCase()) || 
    opt.value.toString().toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-2 w-full relative" ref={wrapperRef}>
      {label && (
        <label className="text-xs font-semibold text-slate-500 tracking-wide uppercase">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      
      <div 
        className={cn(
          "w-full px-13 py-13 text-sm bg-white border rounded-xl flex items-center justify-between cursor-pointer transition-all",
          isOpen ? "border-teal-500 ring-2 ring-teal-100" : "border-slate-200",
          disabled ? "bg-slate-50 opacity-60 cursor-not-allowed" : "hover:border-slate-300"
        )}
        onClick={() => {
          if (!disabled) {
            setIsOpen(!isOpen);
            setQuery(''); // Reset query saat dibuka
          }
        }}
      >
        <span className={cn("truncate pr-4", !displayValue && "text-slate-400")}>
          {displayValue || placeholder}
        </span>
        <ChevronDown size={16} className={cn("text-slate-400 transition-transform", isOpen && "rotate-180")} />
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-lg z-50 max-h-60 flex flex-col overflow-hidden">
          {/* Search Input */}
          <div className="p-3 border-b border-slate-100 flex items-center gap-2 bg-slate-50">
            <Search size={14} className="text-slate-400 shrink-0" />
            <input 
              type="text" 
              autoFocus
              placeholder="Ketik untuk mencari..."
              className="w-full bg-transparent text-sm outline-none text-slate-700"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onClick={(e) => e.stopPropagation()} // Cegah dropdown tertutup saat mengetik
            />
          </div>
          
          {/* Options List */}
          <div className="overflow-y-auto">
            {filteredOptions.length === 0 ? (
              <div className="p-5 text-sm text-center text-slate-400">Tidak ada hasil ditemukan.</div>
            ) : (
              filteredOptions.map((opt) => (
                <div 
                  key={opt.value}
                  className={cn(
                    "px-13 py-8 text-sm cursor-pointer hover:bg-teal-50 transition-colors",
                    value === opt.value ? "bg-teal-50 text-teal-700 font-medium" : "text-slate-700"
                  )}
                  onClick={() => {
                    onChange({ target: { value: opt.value } });
                    setIsOpen(false);
                  }}
                >
                  {opt.label}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
