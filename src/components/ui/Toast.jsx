import { useState, useEffect, createContext, useContext, useCallback } from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'success', duration = 4000) => {
    const id = Date.now() + Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, message, type, duration }]);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const toastHelpers = {
    show: addToast,
    success: (msg, dur) => addToast(msg, 'success', dur),
    error: (msg, dur) => addToast(msg, 'error', dur),
    warning: (msg, dur) => addToast(msg, 'warning', dur),
    info: (msg, dur) => addToast(msg, 'info', dur),
  };

  return (
    <ToastContext.Provider value={toastHelpers}>
      {children}
      <div className="fixed top-6 right-4 sm:right-6 z-[999999] flex flex-col gap-3 w-full max-w-md pointer-events-none px-2 sm:px-0">
        {toasts.map(toast => (
          <ToastItem key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({ toast, onClose }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, toast.duration || 4000);
    return () => clearTimeout(timer);
  }, [toast, onClose]);

  const styleConfig = {
    success: {
      title: 'BERHASIL',
      bg: 'bg-emerald-600 text-white shadow-xl shadow-emerald-900/20 border border-emerald-500/50',
      iconBg: 'bg-white/20 text-white',
      titleColor: 'text-emerald-100',
      icon: CheckCircle2,
    },
    error: {
      title: 'GAGAL / ERROR',
      bg: 'bg-rose-600 text-white shadow-xl shadow-rose-900/20 border border-rose-500/50',
      iconBg: 'bg-white/20 text-white',
      titleColor: 'text-rose-100',
      icon: AlertCircle,
    },
    warning: {
      title: 'PERHATIAN',
      bg: 'bg-amber-500 text-white shadow-xl shadow-amber-900/20 border border-amber-400/50',
      iconBg: 'bg-white/20 text-white',
      titleColor: 'text-amber-100',
      icon: AlertTriangle,
    },
    info: {
      title: 'INFORMASI',
      bg: 'bg-teal-600 text-white shadow-xl shadow-teal-900/20 border border-teal-500/50',
      iconBg: 'bg-white/20 text-white',
      titleColor: 'text-teal-100',
      icon: Info,
    },
  };

  const config = styleConfig[toast.type] || styleConfig.success;
  const Icon = config.icon;

  return (
    <div
      className={`pointer-events-auto flex items-start justify-between gap-4 px-5 py-4 rounded-2xl transition-all duration-300 animate-in fade-in slide-in-from-top-4 ${config.bg}`}
    >
      <div className="flex items-start gap-3.5 min-w-0 flex-1">
        <div className={`p-2 rounded-xl shrink-0 ${config.iconBg}`}>
          <Icon size={24} strokeWidth={2.5} />
        </div>
        <div className="flex flex-col gap-0.5 min-w-0 pt-0.5">
          <span className={`text-[11px] font-black tracking-widest uppercase ${config.titleColor}`}>
            {config.title}
          </span>
          <span className="text-sm font-bold leading-relaxed tracking-tight text-white break-words">
            {toast.message}
          </span>
        </div>
      </div>
      <button
        onClick={onClose}
        className="p-1.5 rounded-xl bg-white/10 hover:bg-white/25 text-white/90 hover:text-white active:scale-90 transition-all shrink-0 mt-0.5"
        title="Tutup"
      >
        <X size={16} strokeWidth={2.5} />
      </button>
    </div>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    return {
      show: () => {},
      success: () => {},
      error: () => {},
      warning: () => {},
      info: () => {},
    };
  }
  return context;
}
