import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from './components/layout/AppLayout';
import useStore from './store/useStore';
import Button from './components/ui/Button';

import Utama from './pages/Utama';
import Barang from './pages/Barang';
import Masuk from './pages/Masuk';
import Keluar from './pages/Keluar';
import Stok from './pages/Stok';
import Minta from './pages/Minta';

function Login() {
  const login = useStore(state => state.login);
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-sm w-full max-w-sm flex flex-col gap-4 text-center">
        <h1 className="text-2xl font-bold text-green-700">SIMALOG</h1>
        <p className="text-gray-500 text-sm mb-4">Silakan login untuk melanjutkan</p>
        <Button onClick={() => login('admin')} className="w-full">Login sebagai Admin</Button>
        <Button onClick={() => login('user1')} variant="secondary" className="w-full">Login sebagai User</Button>
      </div>
    </div>
  );
}

export default function App() {
  const currentUser = useStore(state => state.currentUser);

  if (!currentUser) {
    return <Login />;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AppLayout />}>
          <Route index element={<Utama />} />
          {currentUser.role === 'Admin' && (
            <>
              <Route path="barang" element={<Barang />} />
              <Route path="masuk" element={<Masuk />} />
              <Route path="keluar" element={<Keluar />} />
              <Route path="stok" element={<Stok />} />
            </>
          )}
          <Route path="minta" element={<Minta />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
