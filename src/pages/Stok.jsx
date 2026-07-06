import React, { useState } from 'react';
import useStore from '../store/useStore';
import { Card } from '../components/ui/Card';
import Button from '../components/ui/Button';
import { Table } from '../components/ui/Table';
import { Input, Select } from '../components/ui/Input';

export default function Stok() {
  const { barang, updateBarang, addMasuk, addKeluar, currentUser } = useStore();
  const [selectedKode, setSelectedKode] = useState('');
  const [jenis, setJenis] = useState('masuk'); // masuk atau keluar
  const [jumlah, setJumlah] = useState('');

  const selectedBarang = barang.find(b => b.kode_barang === selectedKode);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedKode || !jumlah || jumlah <= 0) return;

    if (jenis === 'keluar' && selectedBarang.stok_saat_ini < jumlah) {
      alert('Stok tidak mencukupi untuk dikeluarkan!');
      return;
    }

    const logData = {
      kode_barang: selectedKode,
      jumlah: Number(jumlah),
      tanggal: new Date().toISOString().split('T')[0],
      penerima: jenis === 'masuk' ? 'Penyesuaian Sistem (Admin)' : 'Penghapusan Sistem (Admin)'
    };

    if (jenis === 'masuk') {
      addMasuk(logData);
    } else {
      addKeluar(logData);
    }

    alert('Stok berhasil disesuaikan!');
    setJumlah('');
    setSelectedKode('');
  };

  const barangOptions = barang.map(b => ({ label: `${b.kode_barang} - ${b.nama_barang}`, value: b.kode_barang }));

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <h2 className="text-xl font-bold text-gray-800">Penyesuaian Stok Cepat</h2>

      <Card className="bg-white">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Select 
            label="Pilih Barang" 
            required 
            options={barangOptions}
            value={selectedKode} 
            onChange={e => setSelectedKode(e.target.value)} 
          />
          
          {selectedBarang && (
            <div className="bg-gray-50 p-3 rounded-lg text-sm border border-gray-100 flex justify-between">
              <span className="text-gray-600">Stok Saat Ini:</span>
              <span className="font-bold text-gray-900">{selectedBarang.stok_saat_ini}</span>
            </div>
          )}

          <div className="flex gap-2">
            <Select 
              label="Jenis Penyesuaian" 
              required 
              options={[
                { label: 'Tambah (Masuk)', value: 'masuk' },
                { label: 'Kurangi (Keluar)', value: 'keluar' }
              ]}
              value={jenis} 
              onChange={e => setJenis(e.target.value)} 
            />
            <Input 
              label="Jumlah" 
              type="number" 
              required 
              min="1"
              value={jumlah} 
              onChange={e => setJumlah(Number(e.target.value))} 
            />
          </div>

          <Button type="submit" className="w-full">
            Terapkan Penyesuaian
          </Button>
          <p className="text-xs text-center text-gray-400 mt-2">
            Penyesuaian ini akan otomatis tercatat di Log Masuk atau Log Keluar
          </p>
        </form>
      </Card>

      <h3 className="font-bold text-gray-700 mt-8 mb-4">Daftar Stok Saat Ini</h3>
      <Table headers={['Kode', 'Nama', 'Stok']}>
        {barang.map(b => (
          <tr key={b.kode_barang}>
            <td className="px-4 py-3 font-mono text-xs">{b.kode_barang}</td>
            <td className="px-4 py-3">{b.nama_barang}</td>
            <td className="px-4 py-3">
              <span className={`font-bold ${b.stok_saat_ini <= 5 ? 'text-red-600' : 'text-gray-700'}`}>
                {b.stok_saat_ini}
              </span>
            </td>
          </tr>
        ))}
      </Table>
    </div>
  );
}
