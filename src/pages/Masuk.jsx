import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { Plus, Download } from 'lucide-react';
import useStore from '../store/useStore';
import { Card } from '../components/ui/Card';
import Button from '../components/ui/Button';
import { Table } from '../components/ui/Table';
import { Input, Select } from '../components/ui/Input';

export default function Masuk() {
  const { masuk, addMasuk, barang } = useStore();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [filterDate, setFilterDate] = useState('');
  const [search, setSearch] = useState('');

  const [formData, setFormData] = useState({
    kode_barang: '',
    jumlah: '',
    tanggal: new Date().toISOString().split('T')[0],
    penerima: ''
  });

  const filteredData = masuk.filter(item => {
    const matchDate = filterDate ? item.tanggal === filterDate : true;
    const matchSearch = item.kode_barang.toLowerCase().includes(search.toLowerCase()) || 
                        item.penerima.toLowerCase().includes(search.toLowerCase());
    return matchDate && matchSearch;
  });

  const handleExport = () => {
    const ws = XLSX.utils.json_to_sheet(filteredData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Barang_Masuk");
    XLSX.writeFile(wb, "Laporan_Masuk.xlsx");
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    addMasuk(formData);
    setIsFormOpen(false);
    setFormData({ kode_barang: '', jumlah: '', tanggal: new Date().toISOString().split('T')[0], penerima: '' });
  };

  const barangOptions = barang.map(b => ({ label: `${b.kode_barang} - ${b.nama_barang}`, value: b.kode_barang }));

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-800">Barang Masuk</h2>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={handleExport} className="px-2">
            <Download size={18} />
          </Button>
          <Button onClick={() => setIsFormOpen(true)}>
            <Plus size={18} /> Catat
          </Button>
        </div>
      </div>

      <div className="flex gap-2">
        <Input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)} />
        <Input placeholder="Cari kode/penerima..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {isFormOpen && (
        <Card className="bg-teal-50 border-teal-100">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Select 
              label="Barang" 
              required 
              options={barangOptions}
              value={formData.kode_barang} 
              onChange={e => setFormData({...formData, kode_barang: e.target.value})} 
            />
            <Input 
              label="Jumlah" 
              type="number" 
              required 
              value={formData.jumlah} 
              onChange={e => setFormData({...formData, jumlah: Number(e.target.value)})} 
            />
            <Input 
              label="Tanggal" 
              type="date" 
              required 
              value={formData.tanggal} 
              onChange={e => setFormData({...formData, tanggal: e.target.value})} 
            />
            <Input 
              label="Penerima" 
              required 
              value={formData.penerima} 
              onChange={e => setFormData({...formData, penerima: e.target.value})} 
            />
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" onClick={() => setIsFormOpen(false)}>Batal</Button>
              <Button type="submit">Simpan</Button>
            </div>
          </form>
        </Card>
      )}

      <Table headers={['Tanggal', 'Kode Brg', 'Jumlah', 'Penerima']}>
        {filteredData.map(item => (
          <tr key={item.id}>
            <td className="px-4 py-3 text-xs">{item.tanggal}</td>
            <td className="px-4 py-3 font-mono text-xs">{item.kode_barang}</td>
            <td className="px-4 py-3 font-bold text-green-600">+{item.jumlah}</td>
            <td className="px-4 py-3">{item.penerima}</td>
          </tr>
        ))}
      </Table>
    </div>
  );
}
