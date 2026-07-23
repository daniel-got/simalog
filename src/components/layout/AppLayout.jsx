import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import {
  LayoutDashboard, Package, TrendingDown, TrendingUp,
  Layers3, ClipboardList, LogOut, Boxes,
  Building2, Archive, Wrench, ChevronDown
} from 'lucide-react';

// PERUBAHAN: Mengubah pemanggilan ke store logistik yang baru
import useLogistikStore from '../../store/Logistik/useLogistikStore';
import useHartaBendaStore from '../../store/HartaBenda/useHartaBendaStore';

const NAV_GROUPS = [
  {
    key: 'logistik',
    label: 'Logistik',
    icon: Boxes,
    items: [
      { name: 'Utama', path: '/', icon: LayoutDashboard, end: true },
      { name: 'Barang', path: '/barang', icon: Package, role: 'Admin' },
      { name: 'Masuk', path: '/masuk', icon: TrendingDown, role: 'Admin' },
      { name: 'Keluar', path: '/keluar', icon: TrendingUp, role: 'Admin' },
      { name: 'Stok', path: '/stok', icon: Layers3, role: 'Admin' },
      { name: 'Minta', path: '/minta', icon: ClipboardList },
    ],
  },
  {
    key: 'aset',
    label: 'Harta Benda',
    icon: Building2,
    items: [
      { name: 'Utama', path: '/aset', icon: LayoutDashboard, end: true, role: 'Admin' },
      { name: 'Aset', path: '/aset/daftar', icon: Archive, role: 'Admin' },
      { name: 'Perawatan', path: '/aset/perawatan', icon: Wrench, role: 'Admin' },
      { name: 'Aktivitas', path: '/aset/aktivitas', icon: ClipboardList, role: 'Admin' },
      { name: 'Aktivitas', path: '/harta-benda/pinjam', icon: ClipboardList, role: ['User', 'guest'] },
      { name: 'Perawatan', path: '/harta-benda/lapor', icon: Wrench, role: ['User', 'guest'] },
    ],
  },
];

export default function AppLayout() {
  const { currentUser, logout, fetchData } = useLogistikStore();
  const location = useLocation();

  const activeGroupKey = NAV_GROUPS.find(g =>
    g.items.some(item =>
      location.pathname === item.path ||
      (item.path !== '/' && location.pathname.startsWith(item.path)) ||
      (item.path === '/aset/daftar' && location.pathname.startsWith('/harta-benda/aset/'))
    )
  )?.key || 'logistik';

  const [openGroup, setOpenGroup] = useState(activeGroupKey);

  useEffect(() => {
    setOpenGroup(activeGroupKey);
  }, [activeGroupKey]);

  const fetchDataHartaBenda = useHartaBendaStore(s => s.fetchDataHartaBenda);

  useEffect(() => {
    if (currentUser) {
      fetchData();
      fetchDataHartaBenda();
    }
  }, [currentUser, fetchData, fetchDataHartaBenda]);

  const filterByRole = (items) => items.filter(n => {
    if (!n.role) return true;
    const userRole = currentUser?.role?.toLowerCase();
    if (Array.isArray(n.role)) {
      return n.role.some(r => r.toLowerCase() === userRole);
    }
    return n.role.toLowerCase() === userRole;
  });

  const activeGroup = NAV_GROUPS.find(g => g.key === openGroup) || NAV_GROUPS[0];
  const mobileNavs = filterByRole(activeGroup.items);

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

        <nav className="flex-1 p-13 space-y-13 overflow-y-auto hide-scroll">
          {NAV_GROUPS.map((group) => {
            const items = filterByRole(group.items);
            if (items.length === 0) return null;

            const isOpen = openGroup === group.key;
            const GroupIcon = group.icon;

            return (
              <div key={group.key}>
                <button
                  onClick={() => setOpenGroup(isOpen ? null : group.key)}
                  className={`w-full flex items-center gap-13 px-13 py-13 rounded-xl transition-all duration-150 select-none font-semibold text-sm
                    ${isOpen
                      ? 'bg-teal-600 text-white shadow-sm shadow-teal-500/30'
                      : 'text-slate-500 hover:bg-slate-50 hover:text-teal-600'
                    }`}
                >
                  <GroupIcon size={18} strokeWidth={isOpen ? 2.5 : 2} />
                  <span className="flex-1 text-left">{group.label}</span>
                  <ChevronDown
                    size={16}
                    strokeWidth={2.5}
                    className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                  />
                </button>

                {isOpen && (
                  <div className="mt-5 space-y-3 pl-8">
                    {items.map(({ name, path, icon: Icon, end }) => (
                      <NavLink
                        key={path}
                        to={path}
                        end={end}
                        className={({ isActive }) => {
                          const isActuallyActive = isActive || (path === '/aset/daftar' && location.pathname.startsWith('/harta-benda/aset/'));
                          return `flex items-center gap-13 px-13 py-13 rounded-xl transition-all duration-150 select-none font-semibold text-sm
                          ${isActuallyActive
                            ? 'bg-teal-50 text-teal-700'
                            : 'text-slate-500 hover:bg-slate-50 hover:text-teal-600'
                          }`;
                        }}
                      >
                        {({ isActive }) => (
                          <>
                            <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                            <span>{name}</span>
                          </>
                        )}
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
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

        {/* ── Mobile Header ── */}
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

        {/* ── Mobile Group Switcher ── */}
        {(currentUser?.role === 'Admin' || currentUser?.role === 'User' || currentUser?.role === 'guest') && (
          <div className="lg:hidden flex gap-8 px-13 pt-13">
            {NAV_GROUPS.map((group) => {
              const isActive = openGroup === group.key;
              return (
                <button
                  key={group.key}
                  onClick={() => setOpenGroup(group.key)}
                  className={`flex-1 text-sm font-semibold py-13 rounded-xl transition-all
                    ${isActive
                      ? 'bg-teal-600 text-white shadow-sm'
                      : 'bg-white text-slate-500 border border-slate-200'
                    }`}
                >
                  {group.label}
                </button>
              );
            })}
          </div>
        )}

        {/* ── Content ── */}
        <main
          className="flex-1 overflow-y-auto hide-scroll touch-scroll w-full mx-auto pb-[calc(72px+env(safe-area-inset-bottom,0px))] lg:pb-0"
        >
          <div className="px-13 py-21 lg:p-34 space-y-21 lg:space-y-34 max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>

        {/* ── Mobile Bottom Nav ── */}
        <nav
          className="lg:hidden fixed bottom-0 w-full z-40 bg-white border-t border-slate-100 shadow-[0_-4px_21px_rgba(0,0,0,0.06)]"
          style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
        >
          <div className="flex justify-around px-3 py-5">
            {mobileNavs.map(({ name, path, icon: Icon, end }) => (
              <NavLink
                key={path}
                to={path}
                end={end}
                className={({ isActive }) => {
                  const isActuallyActive = isActive || (path === '/aset/daftar' && location.pathname.startsWith('/harta-benda/aset/'));
                  return `flex flex-col items-center gap-2 px-5 py-5 rounded-xl flex-1 mx-2 transition-all duration-150 select-none
                  ${isActuallyActive ? 'text-teal-700' : 'text-slate-400 hover:text-teal-600'}`;
                }}
              >
                {({ isActive }) => {
                  const isActuallyActive = isActive || (path === '/aset/daftar' && location.pathname.startsWith('/harta-benda/aset/'));
                  return (
                    <>
                      <span className={`flex items-center justify-center w-21 h-21 rounded-lg transition-all duration-150
                        ${isActuallyActive ? 'bg-teal-50 scale-110' : 'bg-transparent'}`}>
                        <Icon size={16} strokeWidth={isActuallyActive ? 2.5 : 2} />
                      </span>
                      <span className={`text-[10px] font-semibold tracking-wide ${isActuallyActive ? 'text-teal-700' : 'text-slate-400'}`}>
                        {name}
                      </span>
                    </>
                  );
                }}
              </NavLink>
            ))}
          </div>
        </nav>

      </div>
    </div>
  );
}