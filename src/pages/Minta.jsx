import { useState } from 'react';
import { Plus, Check, X, Clock, ClipboardList, Pencil, Trash2, Search, QrCode } from 'lucide-react';
import useStore from '../store/useStore';
import { Card } from '../components/ui/Card';
import Button from '../components/ui/Button';
import { Input, Select } from '../components/ui/Input';

const STATUS_STYLE = {
  Diajukan: 'bg-amber-100 text-amber-700 border-amber-200',
  Disetujui: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  Diterima:  'bg-blue-100 text-blue-700 border-blue-200',
  Ditolak:   'bg-red-100 text-red-600 border-red-200',
};

const BAR_COLOR = {
  Diajukan: 'bg-amber-400',
  Disetujui: 'bg-emerald-500',
  Diterima:  'bg-blue-500',
  Ditolak:   'bg-red-400',
};

const EMPTY = {
  kode_barang: '',
  jumlah: '',
  tanggal_minta: new Date().toISOString().split('T')[0],
  nama_pemohon: '',
};

export default function Minta() {
  const { minta, addMinta, updateMinta, deleteMinta, updateMintaStatus, barang, currentUser, addKeluar } = useStore();
  const [open, setOpen]           = useState(false);
  const [editId, setEditId]       = useState(null);
  const [form, setForm]           = useState(EMPTY);
  
  // Filter States
  const [filterText, setFilterText] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const isAdmin = currentUser?.role === 'Admin';

  const list = (isAdmin ? minta : minta.filter(m => m.id_user === currentUser.id))
    .filter(m => {
      const brg = barang.find(b => b.kode_barang === m.kode_barang) || {};
      const textTarget = (m.kode_barang + m.nama_pemohon + (brg.nama_barang || '')).toLowerCase();
      
      const matchText = textTarget.includes(filterText.toLowerCase());
      const matchStatus = filterStatus ? m.status_persetujuan === filterStatus : true;
      
      return matchText && matchStatus;
    })
    .sort((a, b) => new Date(b.tanggal_minta) - new Date(a.tanggal_minta));

  const closeForm = () => {
    setOpen(false);
    setEditId(null);
    setForm(EMPTY);
  };

  const handleAjukan = () => {
    setForm({ ...EMPTY, nama_pemohon: currentUser?.nama || '' });
    setOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editId) {
      updateMinta(editId, form);
    } else {
      addMinta({ ...form, id_user: currentUser.id });
    }
    closeForm();
  };

  const handleEdit = (item) => {
    setForm({
      kode_barang: item.kode_barang,
      jumlah: item.jumlah,
      tanggal_minta: item.tanggal_minta,
      nama_pemohon: item.nama_pemohon,
    });
    setEditId(item.id);
    setOpen(true);
  };

  const handleApprove = (item) => {
    const brg = barang.find(b => b.kode_barang === item.kode_barang);
    if (!brg || brg.stok_saat_ini < item.jumlah) {
      alert(`Stok tidak cukup! Sisa: ${brg?.stok_saat_ini ?? 0}`); return;
    }
    addKeluar({
      kode_barang: item.kode_barang, jumlah: item.jumlah,
      tanggal: new Date().toISOString().split('T')[0],
      penerima: `Permintaan: ${item.nama_pemohon}`,
    });
    updateMintaStatus(item.id, 'Disetujui');
  };

  const barangOptions = barang.map(b => ({ label: `${b.kode_barang} — ${b.nama_barang}`, value: b.kode_barang }));

  return (
    <div className="space-y-21">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-slate-800 tracking-tight">Permintaan Barang</h1>
          <p className="text-xs text-slate-400 mt-2">{list.length} permintaan</p>
        </div>
        <Button size="sm" onClick={handleAjukan}>
          <Plus size={15} /> Ajukan
        </Button>
      </div>

      {/* Form */}
      {open && (
        <Card className="border-blue-200 bg-blue-50/30 p-21">
          <p className="text-base font-bold text-slate-700 mb-13">
            {editId ? '✏️ Edit Permintaan' : '📋 Buat Permintaan Baru'}
          </p>
          <form onSubmit={handleSubmit} className="space-y-13">
            <Input label="Nama Pemohon" required 
              value={form.nama_pemohon} 
              onChange={e => setForm({ ...form, nama_pemohon: e.target.value })} 
            />
            <Select label="Barang" required options={barangOptions}
              value={form.kode_barang}
              onChange={e => setForm({ ...form, kode_barang: e.target.value })} />
            <div className="grid grid-cols-2 gap-13">
              <Input label="Jumlah" type="number" required min="1"
                value={form.jumlah}
                onChange={e => setForm({ ...form, jumlah: Number(e.target.value) })} />
              <Input label="Tanggal" type="date" required
                value={form.tanggal_minta}
                onChange={e => setForm({ ...form, tanggal_minta: e.target.value })} />
            </div>
            <div className="flex justify-end gap-8 pt-5">
              <Button type="button" variant="ghost" size="sm" onClick={closeForm}>Batal</Button>
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
              placeholder="Cari nama barang, kode, atau pemohon..."
              value={filterText}
              onChange={e => setFilterText(e.target.value)}
              className="w-full pl-34 pr-13 py-8 text-xs bg-white border border-slate-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
            />
          </div>
          <button className="w-34 h-34 flex items-center justify-center bg-blue-500 hover:bg-blue-600 text-white rounded-xl shadow-sm transition-colors shrink-0" title="Scan Barcode">
            <QrCode size={16} />
          </button>
        </div>
        
        <div>
          <select 
            className="w-full px-8 py-8 text-[10px] bg-white border border-slate-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-slate-600 font-medium"
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
          >
            <option value="">Semua Status</option>
            {['Diajukan', 'Disetujui', 'Diterima', 'Ditolak'].map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Request Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-13 lg:gap-21">
        {list.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center py-34 text-slate-300 bg-slate-50 rounded-2xl border border-slate-100 border-dashed">
            <ClipboardList size={36} className="mb-8" />
            <p className="text-sm font-medium text-slate-400">Tidak ada permintaan</p>
          </div>
        ) : list.map(m => {
          const brgInfo = barang.find(b => b.kode_barang === m.kode_barang);
          const status  = m.status_persetujuan;
          return (
            <div key={m.id}
              className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              {/* Top color bar */}
              <div className={`h-[5px] w-full ${BAR_COLOR[status] ?? 'bg-slate-200'}`} />

              <div className="p-21 flex justify-between items-start gap-13">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-800 truncate">
                    {brgInfo?.nama_barang ?? m.kode_barang}
                  </p>
                  <p className="font-mono text-[10px] text-slate-400 mt-2">{m.kode_barang}</p>

                  <div className="flex items-center gap-8 mt-5 text-xs text-slate-500">
                    <span className="flex items-center gap-2">
                      <Clock size={11} /> {m.tanggal_minta}
                    </span>
                    <span className="font-semibold text-slate-700">× {m.jumlah}</span>
                  </div>

                  {isAdmin && m.nama_pemohon && (
                    <p className="text-xs text-teal-600 font-semibold mt-5">
                      oleh: {m.nama_pemohon}
                    </p>
                  )}
                </div>

                <div className="flex flex-col items-end gap-8 shrink-0">
                  <span className={`text-[10px] font-bold px-8 py-3 rounded-full border ${STATUS_STYLE[status] ?? 'bg-slate-100 text-slate-500'}`}>
                    {status}
                  </span>

                  {isAdmin && (
                    <div className="flex flex-col gap-3 mt-3 items-end">
                      {status === 'Diajukan' && (
                        <div className="flex gap-5">
                          <button onClick={() => handleApprove(m)}
                            className="w-21 h-21 rounded-[8px] bg-emerald-500 text-white flex items-center justify-center
                              hover:bg-emerald-600 active:scale-95 transition-all shadow-sm" title="Setujui">
                            <Check size={14} strokeWidth={3} />
                          </button>
                          <button onClick={() => updateMintaStatus(m.id, 'Ditolak')}
                            className="w-21 h-21 rounded-[8px] bg-red-100 text-red-500 flex items-center justify-center
                              hover:bg-red-200 active:scale-95 transition-all" title="Tolak">
                            <X size={14} strokeWidth={3} />
                          </button>
                        </div>
                      )}
                      
                      <div className="flex gap-5">
                        <button onClick={() => handleEdit(m)}
                          className="w-21 h-21 rounded-[8px] bg-blue-50 text-blue-500 flex items-center justify-center
                            hover:bg-blue-100 active:scale-95 transition-all" title="Edit">
                          <Pencil size={12} strokeWidth={2.5} />
                        </button>
                        <button onClick={() => deleteMinta(m.id)}
                          className="w-21 h-21 rounded-[8px] bg-rose-50 text-rose-500 flex items-center justify-center
                            hover:bg-rose-100 active:scale-95 transition-all" title="Hapus">
                          <Trash2 size={12} strokeWidth={2.5} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
