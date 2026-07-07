import { TrendingDown, TrendingUp, Clock, User } from 'lucide-react';
import { cn } from '../../utils/cn';

export default function LogCard({ type, date, itemCode, itemName, qty, receiver }) {
  const isMasuk = type === 'masuk';
  
  return (
    <div className="bg-white p-13 lg:p-0 rounded-2xl border border-slate-100 shadow-sm flex flex-row lg:flex-col items-center lg:items-stretch gap-13 lg:gap-0 overflow-hidden group hover:border-slate-200 transition-colors">
      
      {/* Icon Area (Kecil di kiri pada mobile, Block besar di atas pada desktop) */}
      <div className={cn(
        "w-34 h-34 lg:w-full lg:h-24 rounded-xl lg:rounded-none lg:border-b flex items-center justify-center flex-shrink-0 transition-colors",
        isMasuk 
          ? "bg-emerald-50 lg:bg-emerald-50/50 lg:border-emerald-100 text-emerald-600" 
          : "bg-red-50 lg:bg-red-50/50 lg:border-red-100 text-red-600"
      )}>
        {isMasuk ? (
          <TrendingDown size={15} strokeWidth={2.5} className="lg:w-8 lg:h-8 lg:opacity-75" />
        ) : (
          <TrendingUp size={15} strokeWidth={2.5} className="lg:w-8 lg:h-8 lg:opacity-75" />
        )}
      </div>
      
      {/* Content Area */}
      <div className="flex-1 min-w-0 flex flex-col justify-between lg:p-13">
        
        <div className="flex justify-between items-start gap-3">
          <span className="text-[10px] lg:text-xs font-bold text-slate-800 uppercase tracking-wide truncate">
            {itemName || itemCode}
          </span>
          <span className={cn(
            "text-xs lg:text-sm font-black shrink-0",
            isMasuk ? "text-emerald-600" : "text-red-600"
          )}>
            {isMasuk ? '+' : '-'}{qty}
          </span>
        </div>
        
        <p className="text-[9px] lg:text-[10px] font-mono text-slate-400 mt-2 lg:mt-3 truncate">{itemCode}</p>
        
        <div className="flex flex-row lg:flex-col items-center lg:items-start gap-8 lg:gap-3 mt-5 lg:mt-8 pt-3 lg:pt-5 border-t border-slate-50 lg:border-slate-100 text-[9px] lg:text-[10px] font-medium text-slate-500">
          <span className="flex items-center gap-2">
            <Clock size={11} className="text-slate-400" /> {date}
          </span>
          <span className="flex items-center gap-2 truncate">
            <User size={11} className="text-slate-400" /> {receiver}
          </span>
        </div>
      </div>
    </div>
  );
}
