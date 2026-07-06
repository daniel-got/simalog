import { TrendingDown, TrendingUp, Clock, User } from 'lucide-react';
import { cn } from '../../utils/cn';

export default function LogCard({ type, date, itemCode, itemName, qty, receiver }) {
  const isMasuk = type === 'masuk';
  
  return (
    <div className="bg-white p-13 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-13">
      {/* Icon Area */}
      <div className={cn(
        "w-34 h-34 rounded-xl flex items-center justify-center flex-shrink-0",
        isMasuk ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
      )}>
        {isMasuk ? <TrendingDown size={15} strokeWidth={2.5} /> : <TrendingUp size={15} strokeWidth={2.5} />}
      </div>
      
      {/* Content Area */}
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start gap-3">
          <span className="text-[10px] font-bold text-slate-800 uppercase tracking-wide truncate">
            {itemName || itemCode}
          </span>
          <span className={cn(
            "text-xs font-black",
            isMasuk ? "text-emerald-600" : "text-red-600"
          )}>
            {isMasuk ? '+' : '-'}{qty}
          </span>
        </div>
        
        <p className="text-[9px] font-mono text-slate-400 mt-2">{itemCode}</p>
        
        <div className="flex items-center gap-8 mt-5 pt-3 border-t border-slate-50 text-[9px] font-medium text-slate-500">
          <span className="flex items-center gap-2">
            <Clock size={11} /> {date}
          </span>
          <span className="flex items-center gap-2 truncate">
            <User size={11} /> {receiver}
          </span>
        </div>
      </div>
    </div>
  );
}
