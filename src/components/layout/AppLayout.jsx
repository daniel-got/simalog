import { NavLink, Outlet } from 'react-router-dom';
import {
  LayoutDashboard, Package, TrendingDown, TrendingUp,
  Layers3, ClipboardList, LogOut, Boxes
} from 'lucide-react';
import useStore from '../../store/useStore';

const NAV_ALL = [
  { name: 'Utama',  path: '/',       icon: LayoutDashboard },
  { name: 'Barang', path: '/barang', icon: Package,       role: 'Admin' },
  { name: 'Masuk',  path: '/masuk',  icon: TrendingDown,  role: 'Admin' },
  { name: 'Keluar', path: '/keluar', icon: TrendingUp,    role: 'Admin' },
  { name: 'Stok',   path: '/stok',   icon: Layers3,       role: 'Admin' },
  { name: 'Minta',  path: '/minta',  icon: ClipboardList },
];

export default function AppLayout() {
  const { currentUser, logout } = useStore();
  const navs = NAV_ALL.filter(n => !n.role || n.role === currentUser?.role);

  return (
    <div className="min-h-dvh bg-slate-50 flex lg:flex-row flex-col">
      
      {/* ── Sidebar (Desktop Only) ── */}
      <aside className="hidden lg:flex flex-col w-[233px] bg-white border-r border-slate-100 shadow-sm z-50 shrink-0 sticky top-0 h-dvh">
        <div className="p-21 flex items-center gap-13 border-b border-slate-100 h-[72px] shrink-0">
          <div className="w-34 h-34 rounded-xl bg-teal-50 flex items-center justify-center shrink-0">
            <Boxes size={21} className="text-teal-600" />
          </div>
          <div className="leading-tight">
            <p className="text-base font-bold text-teal-900 tracking-tight">SIMALOG</p>
            <p className="text-[10px] text-teal-600/80 font-bold uppercase tracking-widest">
              Inventory App
            </p>
          </div>
        </div>

        <nav className="flex-1 p-13 space-y-5 overflow-y-auto hide-scroll">
          {navs.map(({ name, path, icon: Icon }) => (
            <NavLink
              key={name}
              to={path}
              end={path === '/'}
              className={({ isActive }) =>
                `flex items-center gap-13 px-13 py-13 rounded-xl transition-all duration-150 select-none font-semibold text-sm
                ${isActive
                  ? 'bg-teal-50 text-teal-700'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-teal-600'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                  <span>{name}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="p-13 border-t border-slate-100 bg-slate-50/50">
          <div className="flex items-center justify-between bg-white p-8 rounded-xl border border-slate-100 shadow-sm">
            <div className="min-w-0 flex-1 px-5">
              <p className="text-xs font-bold text-slate-800 truncate">{currentUser?.nama}</p>
              <p className="text-[10px] font-medium text-slate-500 truncate">{currentUser?.role}</p>
            </div>
            <button
              onClick={logout}
              className="w-34 h-34 rounded-lg bg-rose-50 text-rose-500 hover:bg-rose-100 active:scale-95 transition-all flex items-center justify-center shrink-0"
              title="Logout"
            >
              <LogOut size={14} strokeWidth={2.5} />
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main Content Area ── */}
      <div className="flex-1 flex flex-col min-h-dvh relative max-w-full">
        
        {/* ── Mobile Header (Hidden on Desktop) ── */}
        <header className="lg:hidden sticky top-0 z-40 flex items-center justify-between px-13 py-13 bg-gradient-to-r from-teal-700 to-teal-600 shadow-md">
          <div className="flex items-center gap-8">
            <div className="w-34 h-34 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center shrink-0">
              <Boxes size={21} className="text-white" />
            </div>
            <div className="leading-tight">
              <p className="text-base font-bold text-white tracking-tight">SIMALOG</p>
              <p className="text-xs text-teal-100/80 font-medium truncate max-w-[150px]">
                {currentUser?.nama} · <span className="text-teal-200">{currentUser?.role}</span>
              </p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-34 h-34 rounded-xl bg-white/15 hover:bg-white/25 active:scale-95 transition-all flex items-center justify-center text-white shrink-0"
            title="Logout"
          >
            <LogOut size={16} />
          </button>
        </header>

        {/* ── Content ── */}
        <main
          className="flex-1 overflow-y-auto hide-scroll touch-scroll w-full mx-auto pb-[calc(72px+env(safe-area-inset-bottom,0px))] lg:pb-0"
        >
          <div className="px-13 py-21 lg:p-34 space-y-21 lg:space-y-34 max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>

        {/* ── Mobile Bottom Nav (Hidden on Desktop) ── */}
        <nav
          className="lg:hidden fixed bottom-0 w-full z-40 bg-white border-t border-slate-100 shadow-[0_-4px_21px_rgba(0,0,0,0.06)]"
          style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
        >
          <div className="flex justify-around px-3 py-5">
            {navs.map(({ name, path, icon: Icon }) => (
              <NavLink
                key={name}
                to={path}
                end={path === '/'}
                className={({ isActive }) =>
                  `flex flex-col items-center gap-2 px-5 py-5 rounded-xl flex-1 mx-2 transition-all duration-150 select-none
                  ${isActive ? 'text-teal-700' : 'text-slate-400 hover:text-teal-600'}`
                }
              >
                {({ isActive }) => (
                  <>
                    <span className={`flex items-center justify-center w-21 h-21 rounded-lg transition-all duration-150
                      ${isActive ? 'bg-teal-50 scale-110' : 'bg-transparent'}`}>
                      <Icon size={16} strokeWidth={isActive ? 2.5 : 2} />
                    </span>
                    <span className={`text-[10px] font-semibold tracking-wide ${isActive ? 'text-teal-700' : 'text-slate-400'}`}>
                      {name}
                    </span>
                  </>
                )}
              </NavLink>
            ))}
          </div>
        </nav>

      </div>
    </div>
  );
}
