import { NavLink, Outlet } from 'react-router-dom';
import { LayoutDashboard, Package, ArrowDownToLine, ArrowUpFromLine, Layers, ShoppingBag, LogOut } from 'lucide-react';
import useStore from '../../store/useStore';

export default function AppLayout() {
  const { currentUser, logout } = useStore();

  const NAV_ITEMS = [
    { name: 'Utama', path: '/', icon: LayoutDashboard },
    { name: 'Barang', path: '/barang', icon: Package, role: 'Admin' },
    { name: 'Masuk', path: '/masuk', icon: ArrowDownToLine, role: 'Admin' },
    { name: 'Keluar', path: '/keluar', icon: ArrowUpFromLine, role: 'Admin' },
    { name: 'Stok', path: '/stok', icon: Layers, role: 'Admin' },
    { name: 'Minta', path: '/minta', icon: ShoppingBag },
  ];

  // Filter menu based on role
  const visibleNavs = NAV_ITEMS.filter(item => !item.role || item.role === currentUser?.role);

  return (
    <div className="max-w-md mx-auto bg-gray-50 min-h-screen flex flex-col relative pb-20 shadow-xl overflow-hidden">
      {/* Sticky Header */}
      <header className="bg-green-700 text-white p-4 rounded-b-3xl sticky top-0 z-20 shadow-md flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold tracking-tight">SIMALOG</h1>
          <p className="text-xs text-green-100">Halo, {currentUser?.nama || 'Guest'}</p>
        </div>
        <button 
          onClick={logout}
          className="p-2 bg-green-800 rounded-full hover:bg-green-900 transition-colors"
        >
          <LogOut size={18} />
        </button>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 p-4 space-y-6 overflow-y-auto">
        <Outlet />
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 w-full max-w-md bg-white border-t flex justify-around p-2 text-xs text-gray-500 z-20 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        {visibleNavs.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) => 
                `flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${
                  isActive ? 'text-green-600 bg-green-50' : 'hover:text-green-500 hover:bg-gray-50'
                }`
              }
            >
              <Icon size={20} />
              <span className="scale-90">{item.name}</span>
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
}
