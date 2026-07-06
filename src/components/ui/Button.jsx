import { cn } from "../../utils/cn";

const variants = {
  primary:   "bg-teal-600 text-white shadow-sm hover:bg-teal-700 active:bg-teal-800",
  secondary: "bg-teal-50 text-teal-700 border border-teal-200 hover:bg-teal-100",
  danger:    "bg-red-50 text-red-600 border border-red-200 hover:bg-red-100",
  ghost:     "bg-transparent text-slate-500 border border-slate-200 hover:bg-slate-50",
  icon:      "bg-slate-100 text-slate-600 hover:bg-slate-200",
};

export default function Button({
  children,
  className,
  variant = "primary",
  size = "md",
  ...props
}) {
  const sizes = {
    sm: "px-13 py-5 text-xs gap-5 rounded-lg",
    md: "px-21 py-8 text-sm gap-8 rounded-xl",
    lg: "px-34 py-13 text-base gap-13 rounded-2xl",
    icon: "p-8 rounded-xl",
  };

  return (
    <button
      className={cn(
        "inline-flex items-center justify-center font-semibold tracking-tight",
        "transition-all duration-150 active:scale-95 disabled:opacity-50 disabled:pointer-events-none",
        "select-none whitespace-nowrap cursor-pointer",
        sizes[size],
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
