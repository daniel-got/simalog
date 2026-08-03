import { useState, useRef, useEffect } from "react";
import { cn } from "../../utils/cn";

const baseInput = [
  "w-full px-13 py-8 rounded-xl border border-slate-200 bg-white",
  "text-sm text-slate-800 placeholder:text-slate-400",
  "outline-none ring-0 transition-all duration-150",
  "focus:border-teal-500 focus:ring-2 focus:ring-teal-100",
  "disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed",
];

export function Input({ label, className, ...props }) {
  return (
    <div className="flex flex-col gap-5 w-full">
      {label && (
        <label className="text-xs font-semibold text-slate-500 tracking-wide uppercase">
          {label}
        </label>
      )}
      <input className={cn(baseInput, className)} {...props} />
    </div>
  );
}

export function Select({ label, options = [], value, onChange, className, required }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  const selectedOpt = options.find((opt) => String(opt.value) === String(value));

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (val) => {
    if (onChange) {
      onChange({ target: { value: val } });
    }
    setIsOpen(false);
  };

  return (
    <div className="flex flex-col gap-5 w-full relative" ref={containerRef}>
      {label && (
        <label className="text-xs font-semibold text-slate-500 tracking-wide uppercase">
          {label}
        </label>
      )}

      {required && (
        <input
          type="text"
          value={value || ""}
          required
          onChange={() => { }}
          className="sr-only"
          tabIndex={-1}
        />
      )}

      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          baseInput,
          "text-left cursor-pointer flex justify-between items-center select-none",
          className
        )}
      >
        <span className={selectedOpt ? "text-slate-800 font-medium truncate" : "text-slate-400"}>
          {selectedOpt ? selectedOpt.label : "Pilih..."}
        </span>
        <span
          className="text-slate-400 text-[10px] transition-transform duration-200 shrink-0 ml-2"
          style={{ transform: isOpen ? "rotate(180deg)" : "rotate(0deg)" }}
        >
          ▼
        </span>
      </button>

      {/* List Pilihan: Diubah ke text-sm agar sama persis dengan tombol utama */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-50 max-h-52 overflow-y-auto divide-y divide-slate-50">
          <div
            onClick={() => handleSelect("")}
            className="px-13 py-8 text-sm text-slate-400 hover:bg-slate-50 cursor-pointer"
          >
            Pilih...
          </div>
          {options.map((opt, i) => (
            <div
              key={i}
              onClick={() => handleSelect(opt.value)}
              className={cn(
                "px-13 py-8 text-sm cursor-pointer hover:bg-teal-50 hover:text-teal-700 transition-colors truncate",
                String(value) === String(opt.value)
                  ? "bg-teal-50 text-teal-700 font-bold"
                  : "text-slate-700"
              )}
            >
              {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}