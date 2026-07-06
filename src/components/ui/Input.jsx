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

export function Select({ label, options = [], className, ...props }) {
  return (
    <div className="flex flex-col gap-5 w-full">
      {label && (
        <label className="text-xs font-semibold text-slate-500 tracking-wide uppercase">
          {label}
        </label>
      )}
      <select className={cn(baseInput, "appearance-none cursor-pointer", className)} {...props}>
        <option value="">Pilih...</option>
        {options.map((opt, i) => (
          <option key={i} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );
}
