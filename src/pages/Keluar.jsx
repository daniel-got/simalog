import { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { Plus, Download, LayoutGrid, List, Search, QrCode } from 'lucide-react';
import useStore from '../store/useStore';
import { Card } from '../components/ui/Card';
import Button from '../components/ui/Button';
import { Table } from '../components/ui/Table';
import { Input, Select } from '../components/ui/Input';
import SearchableSelect from '../components/ui/SearchableSelect';
import LogCard from '../components/ui/LogCard';
import Pagination from '../components/ui/Pagination';
import { KELOMPOK_BARANG } from '../utils/constants';

const EMPTY = { kode_barang: '', jumlah: '', tanggal: new Date().toISOString().split('T')[0], penerima: '' };

export default function Keluar() {
  const { keluar, addKeluar, barang } = useStore();
  const [open, setOpen]     = useState(false);
  const [form, setForm]     = useState(EMPTY);
  const [viewMode, setViewMode] = useState('card');
  
  const [filterText, setFilterText] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [filterKelompok, setFilterKelompok] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  useEffect(() => { setCurrentPage(1); }, [filterText, filterDate, filterKelompok]);

  const barangOptions = barang.map(b => ({
    label: `${b.kode_barang} — ${b.nama_barang} (sisa: ${b.stok_saat_ini})`,
    value: b.kode_barang,
  }));

  const filtered = keluar.filter(k => {
    const brg = barang.find(b => b.kode_barang === k.kode_barang) || {};
    const textTarget = (k.kode_barang + k.penerima + (brg.nama_barang || '')).toLowerCase();
    const matchText = textTarget.includes(filterText.toLowerCase());
    const matchDate = filterDate ? k.tanggal === filterDate : true;
    const matchKelompok = filterKelompok ? brg.kelompok_barang === filterKelompok : true;
    return matchText && matchDate && matchKelompok;
  });

  const paged = filtered.slice((currentPage - 1) * perPage, currentPage * perPage);

  const handleSubmit = (e) => {
    e.preventDefault();
    const brg = barang.find(b => b.kode_barang === form.kode_barang);
    if (!brg || brg.stok_saat_ini < form.jumlah) {
      alert(`Stok tidak mencukupi! Sisa: ${brg?.stok_saat_ini ?? 0}`);
      return;
    }
    addKeluar(form);
    setOpen(false);
    setForm(EMPTY);
  };

  const handleExport = () => {
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(filtered), 'Keluar');
    XLSX.writeFile(wb, 'Laporan_Keluar.xlsx');
  };

  return (
    <div className="space-y-21">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-slate-800 tracking-tight">Barang Keluar</h1>
          <p className="text-xs text-slate-400 mt-2">{filtered.length} transaksi</p>
        </div>
        <div className="flex gap-8">
          <div className="flex bg-slate-100 rounded-xl p-3">
            <button 
              onClick={() => setViewMode('card')}
              className={`p-5 rounded-lg transition-colors ${viewMode === 'card' ? 'bg-white shadow-sm text-teal-600' : 'text-slate-400 hover:text-slate-600'}`}
              title="Card View"
            >
              <LayoutGrid size={15} />
            </button>
            <button 
              onClick={() => setViewMode('table')}
              className={`p-5 rounded-lg transition-colors ${viewMode === 'table' ? 'bg-white shadow-sm text-teal-600' : 'text-slate-400 hover:text-slate-600'}`}
              title="Table View"
            >
              <List size={15} />
            </button>
          </div>
          <Button variant="ghost" size="icon" onClick={handleExport} title="Export Excel">
            <Download size={16} />
          </Button>
          <Button size="sm" onClick={() => setOpen(true)}>
            <Plus size={15} /> Catat
          </Button>
        </div>
      </div>

      {open && (
        <Card className="border-orange-200 bg-orange-50/30 p-21">
          <p className="text-base font-bold text-slate-700 mb-13">📤  Catat Barang Keluar</p>
          <form onSubmit={handleSubmit} className="space-y-13">
            <SearchableSelect 
              label="Barang" required options={barangOptions}
              value={form.kode_barang}
              onChange={e => setForm({ ...form, kode_barang: e.target.value })} 
            />
            <div className="grid grid-cols-2 gap-13">
              <Input label="Jumlah" type="number" required min="1"
                value={form.jumlah}
                onChange={e => setForm({ ...form, jumlah: Number(e.target.value) })} />
              <Input label="Tanggal" type="date" required
                value={form.tanggal}
                onChange={e => setForm({ ...form, tanggal: e.target.value })} />
            </div>
            <Input label="Penerima / Tujuan" required value={form.penerima}
              onChange={e => setForm({ ...form, penerima: e.target.value })} />
            <div className="flex justify-end gap-8 pt-5">
              <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>Batal</Button>
              <Button type="submit" size="sm">Simpan</Button>
            </div>
          </form>
        </Card>
      )}

      {/* Search & Filter Card */}
      <div className="bg-slate-50 p-13 rounded-2xl border border-slate-100 shadow-sm space-y-8">
        <div className="flex gap-8">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-13 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Cari transaksi (nama/kode barang, penerima)..."
              value={filterText}
              onChange={e => setFilterText(e.target.value)}
              className="w-full pl-34 pr-13 py-8 text-xs bg-white border border-slate-200 rounded-xl focus:border-orange-500 focus:ring-2 focus:ring-orange-100 outline-none transition-all"
            />
          </div>
          <button className="w-34 h-34 flex items-center justify-center bg-orange-500 hover:bg-orange-600 text-white rounded-xl shadow-sm transition-colors shrink-0" title="Scan Barcode">
            <QrCode size={16} />
          </button>
        </div>
        
        <div className="grid grid-cols-2 gap-8">
          <select 
            className="w-full px-8 py-8 text-[10px] bg-white border border-slate-200 rounded-xl focus:border-orange-500 focus:ring-2 focus:ring-orange-100 outline-none transition-all text-slate-600 font-medium"
            value={filterKelompok}
            onChange={e => setFilterKelompok(e.target.value)}
          >
            <option value="">Semua Kelompok</option>
            {Object.keys(KELOMPOK_BARANG).map(k => (
              <option key={k} value={k}>{k}</option>
            ))}
          </select>
          
          <input 
            type="date"
            className="w-full px-8 py-8 text-[10px] bg-white border border-slate-200 rounded-xl focus:border-orange-500 focus:ring-2 focus:ring-orange-100 outline-none transition-all text-slate-600 font-medium"
            value={filterDate}
            onChange={e => setFilterDate(e.target.value)}
          />
        </div>
      </div>

      {/* Data Views */}
      {filtered.length === 0 ? (
        <div className="text-center py-34 text-slate-400 text-sm bg-slate-50 rounded-2xl border border-slate-100 border-dashed">
          Tidak ada data transaksi keluar.
        </div>
      ) : viewMode === 'card' ? (
        <div className="space-y-21">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-13 lg:gap-21">
            {paged.map(k => {
              const brgInfo = barang.find(b => b.kode_barang === k.kode_barang);
              return (
                <LogCard 
                  key={k.id}
                  type="keluar"
                  date={k.tanggal}
                  itemCode={k.kode_barang}
                  itemName={brgInfo?.nama_barang}
                  qty={k.jumlah}
                  receiver={k.penerima}
                />
              );
            })}
          </div>
          <Pagination
            total={filtered.length}
            perPage={perPage}
            currentPage={currentPage}
            onPageChange={setCurrentPage}
            onPerPageChange={setPerPage}
          />
        </div>
      ) : (
        <div className="space-y-21">
          <Table headers={['Tanggal', 'Barang', '-Qty', 'Penerima']}>
            {paged.map(k => (
              <tr key={k.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-13 py-13 text-xs text-slate-500 whitespace-nowrap">{k.tanggal}</td>
                <td className="px-13 py-13 font-mono text-xs text-teal-700 font-bold">{k.kode_barang}</td>
                <td className="px-13 py-13">
                  <span className="bg-red-100 text-red-600 text-xs font-black px-8 py-3 rounded-lg">
                    -{k.jumlah}
                  </span>
                </td>
                <td className="px-13 py-13 text-xs text-slate-600">{k.penerima}</td>
              </tr>
            ))}
          </Table>
          <Pagination
            total={filtered.length}
            perPage={perPage}
            currentPage={currentPage}
            onPageChange={setCurrentPage}
            onPerPageChange={setPerPage}
          />
        </div>
      )}
    </div>
  );
}
