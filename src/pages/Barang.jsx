import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { Plus, Download, Edit2, Trash2 } from 'lucide-react';
import useStore from '../store/useStore';
import { Card } from '../components/ui/Card';
import Button from '../components/ui/Button';
import { Table } from '../components/ui/Table';
import { Input, Select } from '../components/ui/Input';

export default function Barang() {
  const { barang, addBarang, updateBarang, deleteBarang } = useStore();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingKode, setEditingKode] = useState(null);
  
  // Form State
  const [formData, setFormData] = useState({
    kode_barang: '',
    nama_barang: '',
    kategori: '',
    stok_saat_ini: 0
  });

  const handleExport = () => {
    const ws = XLSX.utils.json_to_sheet(barang);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Barang");
    XLSX.writeFile(wb, "Data_Barang.xlsx");
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingKode) {
      updateBarang(editingKode, formData);
    } else {
      addBarang(formData);
    }
    closeForm();
  };

  const editItem = (item) => {
    setFormData(item);
    setEditingKode(item.kode_barang);
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingKode(null);
    setFormData({ kode_barang: '', nama_barang: '', kategori: '', stok_saat_ini: 0 });
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-800">Master Barang</h2>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={handleExport} className="px-2">
            <Download size={18} />
          </Button>
          <Button onClick={() => setIsFormOpen(true)}>
            <Plus size={18} /> Tambah
          </Button>
        </div>
      </div>

      {isFormOpen && (
        <Card className="bg-green-50/50 border-green-100">
          <form onSubmit={handleSubmit} className="space-y-4">
            <h3 className="font-semibold text-gray-700">{editingKode ? 'Edit Barang' : 'Tambah Barang Baru'}</h3>
            <Input 
              label="Kode Barang" 
              required 
              disabled={!!editingKode}
              value={formData.kode_barang} 
              onChange={e => setFormData({...formData, kode_barang: e.target.value})} 
            />
            <Input 
              label="Nama Barang" 
              required 
              value={formData.nama_barang} 
              onChange={e => setFormData({...formData, nama_barang: e.target.value})} 
            />
            <Select 
              label="Kategori" 
              required 
              options={[
                { label: 'ATK', value: 'ATK' },
                { label: 'Elektronik', value: 'Elektronik' },
                { label: 'Furnitur', value: 'Furnitur' },
                { label: 'Lainnya', value: 'Lainnya' },
              ]}
              value={formData.kategori} 
              onChange={e => setFormData({...formData, kategori: e.target.value})} 
            />
            <Input 
              label="Stok Awal" 
              type="number" 
              required 
              disabled={!!editingKode}
              value={formData.stok_saat_ini} 
              onChange={e => setFormData({...formData, stok_saat_ini: Number(e.target.value)})} 
            />
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" onClick={closeForm}>Batal</Button>
              <Button type="submit">Simpan</Button>
            </div>
          </form>
        </Card>
      )}

      <Table headers={['Kode', 'Nama', 'Kategori', 'Stok', 'Aksi']}>
        {barang.map(b => (
          <tr key={b.kode_barang}>
            <td className="px-4 py-3 font-mono text-xs">{b.kode_barang}</td>
            <td className="px-4 py-3">{b.nama_barang}</td>
            <td className="px-4 py-3">
              <span className="bg-gray-100 px-2 py-1 rounded-full text-xs text-gray-600">{b.kategori}</span>
            </td>
            <td className="px-4 py-3">
              <span className={`font-bold ${b.stok_saat_ini <= 5 ? 'text-red-600' : 'text-gray-700'}`}>
                {b.stok_saat_ini}
              </span>
            </td>
            <td className="px-4 py-3 flex gap-2">
              <button onClick={() => editItem(b)} className="text-blue-600 hover:text-blue-800"><Edit2 size={16} /></button>
              <button onClick={() => deleteBarang(b.kode_barang)} className="text-red-600 hover:text-red-800"><Trash2 size={16} /></button>
            </td>
          </tr>
        ))}
        {barang.length === 0 && (
          <tr><td colSpan="5" className="text-center py-4 text-gray-500">Belum ada data barang.</td></tr>
        )}
      </Table>
    </div>
  );
}
