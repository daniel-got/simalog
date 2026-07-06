import { cn } from "../../utils/cn";

export function Card({ children, className }) {
  return (
    <div className={cn(
      "bg-white rounded-2xl border border-slate-100 shadow-sm p-21",
      className
    )}>
      {children}
    </div>
  );
}

export function StatCard({ title, value, icon: Icon, bg, iconColor }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-21 flex flex-col gap-13">
      <div className={cn("w-34 h-34 rounded-xl flex items-center justify-center", bg)}>
        <Icon size={21} className={iconColor} />
      </div>
      <div>
        <p className="text-xs font-medium text-slate-400 tracking-wide uppercase">{title}</p>
        <p className="text-3xl font-black text-slate-800 tracking-tight leading-none mt-3">{value}</p>
      </div>
    </div>
  );
}
