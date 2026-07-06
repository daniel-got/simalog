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
    // Outer: centers the "phone frame" on wider screens
    <div className="min-h-dvh bg-gradient-to-br from-teal-100 via-slate-100 to-teal-50 flex items-start justify-center">

      {/* App Shell — capped at 430 px like a phone */}
      <div className="relative w-full max-w-[430px] min-h-dvh bg-slate-50 flex flex-col shadow-2xl shadow-teal-900/10">

        {/* ── Header ── */}
        <header className="sticky top-0 z-40 flex items-center justify-between px-13 py-13
          bg-gradient-to-r from-teal-700 to-teal-600 shadow-md shadow-teal-900/20">

          <div className="flex items-center gap-8">
            {/* Logo pill */}
            <div className="w-34 h-34 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center shrink-0">
              <Boxes size={21} className="text-white" />
            </div>
            <div className="leading-tight">
              <p className="text-base font-bold text-white tracking-tight">SIMALOG</p>
              <p className="text-xs text-teal-100/80 font-medium">
                {currentUser?.nama} · <span className="text-teal-200">{currentUser?.role}</span>
              </p>
            </div>
          </div>

          <button
            onClick={logout}
            className="w-34 h-34 rounded-xl bg-white/15 hover:bg-white/25 active:scale-95
              transition-all duration-150 flex items-center justify-center text-white"
            title="Logout"
          >
            <LogOut size={16} />
          </button>
        </header>

        {/* ── Content ── */}
        <main
          className="flex-1 overflow-y-auto hide-scroll touch-scroll"
          style={{ paddingBottom: 'calc(72px + env(safe-area-inset-bottom, 0px))' }}
        >
          <div className="px-13 py-21 space-y-21">
            <Outlet />
          </div>
        </main>

        {/* ── Bottom Nav ── */}
        <nav
          className="fixed bottom-0 w-full max-w-[430px] z-40 bg-white border-t border-slate-100
            shadow-[0_-4px_21px_rgba(0,0,0,0.06)]"
          style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
        >
          <div className="flex justify-around px-3 py-5">
            {navs.map(({ name, path, icon: Icon }) => (
              <NavLink
                key={name}
                to={path}
                end={path === '/'}
                className={({ isActive }) =>
                  `flex flex-col items-center gap-2 px-5 py-5 rounded-xl flex-1 mx-2
                  transition-all duration-150 select-none
                  ${isActive
                    ? 'text-teal-700'
                    : 'text-slate-400 hover:text-teal-600'
                  }`
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
