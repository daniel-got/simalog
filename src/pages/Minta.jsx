import React, { useState } from 'react';
import { Plus, Check, X, Clock } from 'lucide-react';
import useStore from '../store/useStore';
import { Card } from '../components/ui/Card';
import Button from '../components/ui/Button';
import { Input, Select } from '../components/ui/Input';

export default function Minta() {
  const { minta, addMinta, updateMintaStatus, barang, currentUser, addKeluar } = useStore();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState('');

  const isAdmin = currentUser?.role === 'Admin';

  const [formData, setFormData] = useState({
    kode_barang: '',
    jumlah: '',
    tanggal_minta: new Date().toISOString().split('T')[0],
  });

  // Jika admin, lihat semua. Jika user, lihat miliknya saja.
  const userMinta = isAdmin ? minta : minta.filter(m => m.id_user === currentUser.id);

  // Filter dan Sort (terbaru di atas)
  const filteredMinta = userMinta
    .filter(m => filterStatus ? m.status_persetujuan === filterStatus : true)
    .sort((a, b) => new Date(b.tanggal_minta) - new Date(a.tanggal_minta));

  const handleSubmit = (e) => {
    e.preventDefault();
    addMinta({
      ...formData,
      id_user: currentUser.id,
      nama_pemohon: currentUser.nama
    });
    setIsFormOpen(false);
    setFormData({ kode_barang: '', jumlah: '', tanggal_minta: new Date().toISOString().split('T')[0] });
  };

  const handleApprove = (item) => {
    // Cek stok
    const brg = barang.find(b => b.kode_barang === item.kode_barang);
    if (!brg || brg.stok_saat_ini < item.jumlah) {
      alert(`Stok tidak mencukupi! Sisa stok: ${brg?.stok_saat_ini || 0}`);
      return;
    }
    
    // Kurangi stok & catat log keluar
    addKeluar({
      kode_barang: item.kode_barang,
      jumlah: item.jumlah,
      tanggal: new Date().toISOString().split('T')[0],
      penerima: `Permintaan disetujui: ${item.nama_pemohon || 'User'}`
    });

    // Update status
    updateMintaStatus(item.id, 'Disetujui');
  };

  const handleReject = (id) => {
    updateMintaStatus(id, 'Ditolak');
  };

  const barangOptions = barang.map(b => ({ label: `${b.kode_barang} - ${b.nama_barang}`, value: b.kode_barang }));

  const getStatusColor = (status) => {
    if (status === 'Disetujui' || status === 'Diterima') return 'bg-green-100 text-green-700 border-green-200';
    if (status === 'Ditolak') return 'bg-red-100 text-red-700 border-red-200';
    return 'bg-yellow-100 text-yellow-700 border-yellow-200'; // Diajukan
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-800">Permintaan Barang</h2>
        {!isAdmin && (
          <Button onClick={() => setIsFormOpen(true)}>
            <Plus size={18} /> Buat Permintaan
          </Button>
        )}
      </div>

      <div className="flex gap-2">
        <Select 
          options={[
            { label: 'Semua Status', value: '' },
            { label: 'Diajukan', value: 'Diajukan' },
            { label: 'Disetujui', value: 'Disetujui' },
            { label: 'Ditolak', value: 'Ditolak' },
          ]}
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
        />
      </div>

      {isFormOpen && !isAdmin && (
        <Card className="bg-blue-50 border-blue-100">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input label="Nama Pemohon" value={currentUser?.nama} disabled />
            <Select 
              label="Pilih Barang" 
              required 
              options={barangOptions}
              value={formData.kode_barang} 
              onChange={e => setFormData({...formData, kode_barang: e.target.value})} 
            />
            <div className="flex gap-2">
              <Input 
                label="Jumlah" 
                type="number" 
                required 
                min="1"
                value={formData.jumlah} 
                onChange={e => setFormData({...formData, jumlah: Number(e.target.value)})} 
              />
              <Input 
                label="Tanggal" 
                type="date" 
                required 
                value={formData.tanggal_minta} 
                onChange={e => setFormData({...formData, tanggal_minta: e.target.value})} 
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" onClick={() => setIsFormOpen(false)}>Batal</Button>
              <Button type="submit">Kirim</Button>
            </div>
          </form>
        </Card>
      )}

      <div className="space-y-3">
        {filteredMinta.length === 0 ? (
          <div className="text-center py-8 text-gray-500">Belum ada permintaan.</div>
        ) : (
          filteredMinta.map(m => {
            const brgInfo = barang.find(b => b.kode_barang === m.kode_barang);
            return (
              <Card key={m.id} className="relative overflow-hidden">
                <div className={`absolute top-0 left-0 w-1 h-full ${m.status_persetujuan === 'Disetujui' ? 'bg-green-500' : m.status_persetujuan === 'Ditolak' ? 'bg-red-500' : 'bg-yellow-500'}`}></div>
                <div className="flex justify-between items-start pl-2">
                  <div>
                    <h3 className="font-bold text-gray-800">{brgInfo ? brgInfo.nama_barang : m.kode_barang}</h3>
                    <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                      <Clock size={14} /> {m.tanggal_minta}
                    </p>
                    {isAdmin && <p className="text-xs text-gray-500 mt-1">Oleh: {m.nama_pemohon || `User ID: ${m.id_user}`}</p>}
                    <p className="text-sm mt-1">Jumlah: <strong>{m.jumlah}</strong></p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className={`text-xs px-2 py-1 rounded-full border font-medium ${getStatusColor(m.status_persetujuan)}`}>
                      {m.status_persetujuan}
                    </span>
                    {isAdmin && m.status_persetujuan === 'Diajukan' && (
                      <div className="flex gap-1 mt-2">
                        <button onClick={() => handleApprove(m)} className="p-1 bg-green-100 text-green-700 rounded hover:bg-green-200" title="Setujui">
                          <Check size={16} />
                        </button>
                        <button onClick={() => handleReject(m.id)} className="p-1 bg-red-100 text-red-700 rounded hover:bg-red-200" title="Tolak">
                          <X size={16} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
