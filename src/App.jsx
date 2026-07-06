import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Boxes, ShieldCheck, User } from 'lucide-react';
import AppLayout from './components/layout/AppLayout';
import useStore from './store/useStore';

import Utama  from './pages/Utama';
import Barang from './pages/Barang';
import Masuk  from './pages/Masuk';
import Keluar from './pages/Keluar';
import Stok   from './pages/Stok';
import Minta  from './pages/Minta';

function Login() {
  const loginWithEmail = useStore(s => s.loginWithEmail);
  const loginAsGuest   = useStore(s => s.loginAsGuest);
  
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    const { success, error: errMsg } = await loginWithEmail(email, password);
    if (!success) {
      setError(errMsg || 'Kredensial tidak valid');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center
      bg-gradient-to-br from-teal-50 via-white to-slate-100 p-21">

      {/* Brand mark */}
      <div className="flex flex-col items-center gap-13 mb-34">
        <div className="w-55 h-55 rounded-[21px] bg-teal-600 flex items-center justify-center shadow-lg shadow-teal-500/30">
          <Boxes size={34} className="text-white" />
        </div>
        <div className="text-center">
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">SIMALOG</h1>
          <p className="text-sm text-slate-500 mt-3 font-medium">Sistem Manajemen Logistik</p>
        </div>
      </div>

      {/* Login card */}
      <div className="w-full max-w-sm bg-white rounded-[34px] border border-slate-100 shadow-xl shadow-slate-200/60 p-34">
        <p className="text-sm font-black text-slate-700 text-center mb-21">
          Login Administrator
        </p>

        <form onSubmit={handleAdminLogin} className="flex flex-col gap-13">
          {error && (
            <div className="bg-red-50 text-red-600 p-8 rounded-xl text-xs font-bold text-center border border-red-100">
              {error}
            </div>
          )}
          
          <input 
            type="email" 
            placeholder="Email Admin" 
            required
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full px-13 py-13 rounded-2xl border border-slate-200 bg-slate-50 text-sm focus:bg-white focus:border-teal-500 focus:ring-2 focus:ring-teal-100 outline-none transition-all"
          />
          <input 
            type="password" 
            placeholder="Password" 
            required
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full px-13 py-13 rounded-2xl border border-slate-200 bg-slate-50 text-sm focus:bg-white focus:border-teal-500 focus:ring-2 focus:ring-teal-100 outline-none transition-all"
          />
          
          <button 
            type="submit" 
            disabled={loading}
            className="w-full flex items-center justify-center gap-8 p-13 rounded-2xl bg-teal-600 text-white font-bold
              hover:bg-teal-700 active:scale-95 transition-all shadow-md shadow-teal-500/30 disabled:opacity-50"
          >
            {loading ? 'Memvalidasi...' : (
              <>
                <ShieldCheck size={16} /> Masuk Sistem
              </>
            )}
          </button>
        </form>

        <div className="mt-34 pt-21 border-t border-slate-100 flex flex-col items-center">
          <button
            onClick={loginAsGuest}
            type="button"
            className="flex items-center gap-5 text-sm font-semibold text-slate-500 hover:text-teal-600 transition-colors"
          >
            <User size={15} /> Masuk sebagai Guest
          </button>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const currentUser = useStore(s => s.currentUser);
  if (!currentUser) return <Login />;

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AppLayout />}>
          <Route index element={<Utama />} />
          {currentUser.role === 'Admin' && (
            <>
              <Route path="barang" element={<Barang />} />
              <Route path="masuk"  element={<Masuk />} />
              <Route path="keluar" element={<Keluar />} />
              <Route path="stok"   element={<Stok />} />
            </>
          )}
          <Route path="minta" element={<Minta />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
