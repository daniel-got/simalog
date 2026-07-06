import { useState } from 'react';
import { Layers3, ArrowUp, ArrowDown, Search, QrCode } from 'lucide-react';
import useStore from '../store/useStore';
import Button from '../components/ui/Button';
import { Select } from '../components/ui/Input';
import { KELOMPOK_BARANG } from '../utils/constants';

export default function Stok() {
  const { barang, addMasuk, addKeluar } = useStore();
  const [kode, setKode]   = useState('');
  const [jenis, setJenis] = useState('masuk');
  const [jumlah, setJumlah] = useState('');
  
  // Filter States
  const [filterText, setFilterText] = useState('');
  const [filterKelompok, setFilterKelompok] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [sortOrder, setSortOrder] = useState('stok_desc');

  const selected = barang.find(b => b.kode_barang === kode);

  const filteredBarang = barang
    .filter(b => {
      const textTarget = ((b.nama_barang || '') + (b.kode_barang || '')).toLowerCase();
      const matchText = textTarget.includes(filterText.toLowerCase());
      const matchKelompok = filterKelompok ? b.kelompok_barang === filterKelompok : true;
      const matchStatus = filterStatus === 'Menipis' ? b.stok_saat_ini <= 5 
                        : filterStatus === 'Normal' ? b.stok_saat_ini > 5 
                        : true;
      return matchText && matchKelompok && matchStatus;
    })
    .sort((a, b) => {
      if (sortOrder === 'stok_desc') return b.stok_saat_ini - a.stok_saat_ini;
      if (sortOrder === 'stok_asc')  return a.stok_saat_ini - b.stok_saat_ini;
      if (sortOrder === 'nama_asc')  return (a.nama_barang || '').localeCompare(b.nama_barang || '');
      if (sortOrder === 'nama_desc') return (b.nama_barang || '').localeCompare(a.nama_barang || '');
      return 0;
    });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!kode || !jumlah || jumlah <= 0) return;
    if (jenis === 'keluar' && selected?.stok_saat_ini < jumlah) {
      alert('Stok tidak mencukupi!'); return;
    }
    const payload = {
      kode_barang: kode, jumlah: Number(jumlah),
      tanggal: new Date().toISOString().split('T')[0],
      penerima: `Penyesuaian Admin (${jenis})`,
    };
    jenis === 'masuk' ? addMasuk(payload) : addKeluar(payload);
    alert('Stok berhasil disesuaikan!');
    setKode(''); setJumlah('');
  };

  const barangOptions = barang.map(b => ({ label: `${b.kode_barang} — ${b.nama_barang}`, value: b.kode_barang }));

  return (
    <div className="space-y-21">
      <div>
        <h1 className="text-xl font-black text-slate-800 tracking-tight">Penyesuaian Stok</h1>
        <p className="text-xs text-slate-400 mt-2">Adjustment otomatis masuk / keluar log</p>
      </div>

      {/* Form */}
      <div className="bg-white rounded-[21px] border border-slate-100 shadow-sm p-21">
        <form onSubmit={handleSubmit} className="space-y-13">
          <Select label="Pilih Barang" required options={barangOptions}
            value={kode} onChange={e => setKode(e.target.value)} />

          {selected && (
            <div className="flex items-center justify-between bg-teal-50 border border-teal-100 rounded-[13px] px-13 py-13">
              <span className="text-sm font-semibold text-slate-500">Stok Saat Ini</span>
              <span className="text-3xl font-black text-teal-700">{selected.stok_saat_ini}</span>
            </div>
          )}

          {/* Jenis toggle */}
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-8">Jenis Penyesuaian</p>
            <div className="grid grid-cols-2 gap-8">
              {['masuk', 'keluar'].map(j => (
                <button key={j} type="button"
                  onClick={() => setJenis(j)}
                  className={`flex items-center justify-center gap-8 py-8 rounded-[13px] text-base font-semibold
                    border transition-all duration-150 active:scale-95
                    ${jenis === j
                      ? j === 'masuk'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                        : 'bg-red-500 text-white border-red-500 shadow-sm'
                      : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
                    }`
                  }
                >
                  {j === 'masuk' ? <ArrowDown size={15} /> : <ArrowUp size={15} />}
                  {j === 'masuk' ? 'Tambah' : 'Kurangi'}
                </button>
              ))}
            </div>
          </div>

          <input
            type="number" min="1" required
            placeholder="Masukkan jumlah..."
            value={jumlah}
            onChange={e => setJumlah(Number(e.target.value))}
            className="w-full px-13 py-13 text-3xl font-black text-center rounded-[13px] border border-slate-200
              focus:border-teal-500 focus:ring-2 focus:ring-teal-100 outline-none bg-slate-50"
          />

          <Button type="submit" className="w-full justify-center py-13">
            <Layers3 size={16} /> Terapkan Penyesuaian
          </Button>
        </form>
      </div>

      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pt-13">Daftar Stok</p>
      
      {/* Search & Filter Card */}
      <div className="bg-slate-50 p-13 rounded-2xl border border-slate-100 shadow-sm space-y-8">
        <div className="flex gap-8">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-13 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Cari kode atau nama barang..."
              value={filterText}
              onChange={e => setFilterText(e.target.value)}
              className="w-full pl-34 pr-13 py-8 text-xs bg-white border border-slate-200 rounded-xl focus:border-teal-500 focus:ring-2 focus:ring-teal-100 outline-none transition-all"
            />
          </div>
          <button className="w-34 h-34 flex items-center justify-center bg-slate-600 hover:bg-slate-700 text-white rounded-xl shadow-sm transition-colors shrink-0" title="Scan Barcode">
            <QrCode size={16} />
          </button>
        </div>
        
        <div className="grid grid-cols-3 gap-8">
          <select 
            className="w-full px-8 py-8 text-[10px] bg-white border border-slate-200 rounded-xl focus:border-teal-500 focus:ring-2 focus:ring-teal-100 outline-none transition-all text-slate-600 font-medium"
            value={filterKelompok}
            onChange={e => setFilterKelompok(e.target.value)}
          >
            <option value="">Semua Kelompok</option>
            {Object.keys(KELOMPOK_BARANG).map(k => (
              <option key={k} value={k}>{k}</option>
            ))}
          </select>
          
          <select 
            className="w-full px-8 py-8 text-[10px] bg-white border border-slate-200 rounded-xl focus:border-teal-500 focus:ring-2 focus:ring-teal-100 outline-none transition-all text-slate-600 font-medium"
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
          >
            <option value="">Semua Status</option>
            <option value="Normal">Normal (&gt; 5)</option>
            <option value="Menipis">Menipis (≤ 5)</option>
          </select>

          <select 
            className="w-full px-8 py-8 text-[10px] bg-white border border-slate-200 rounded-xl focus:border-teal-500 focus:ring-2 focus:ring-teal-100 outline-none transition-all text-slate-600 font-medium"
            value={sortOrder}
            onChange={e => setSortOrder(e.target.value)}
          >
            <option value="stok_desc">Stok Terbanyak</option>
            <option value="stok_asc">Stok Tersedikit</option>
            <option value="nama_asc">Nama (A-Z)</option>
            <option value="nama_desc">Nama (Z-A)</option>
          </select>
        </div>
      </div>

      {/* Stok list */}
      {filteredBarang.length === 0 ? (
        <div className="text-center py-34 text-slate-400 text-sm bg-slate-50 rounded-2xl border border-slate-100 border-dashed">
          Tidak ada data barang sesuai pencarian.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-13 lg:gap-21">
          {filteredBarang.map(b => (
            <div key={b.kode_barang} className="bg-white p-13 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-13">
                <div className={`w-34 h-34 rounded-xl flex items-center justify-center font-black text-xs shrink-0
                  ${b.stok_saat_ini <= 5 ? 'bg-red-50 text-red-600' : 'bg-teal-50 text-teal-600'}`}>
                  {b.stok_saat_ini}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-800 truncate">{b.nama_barang}</p>
                  <p className="text-[9px] font-mono text-slate-400 mt-2">{b.kode_barang}</p>
                </div>
              </div>
              {b.stok_saat_ini <= 5 && (
                <span className="text-[9px] bg-red-100 text-red-500 px-5 py-2 rounded-full font-bold whitespace-nowrap ml-5 shrink-0">MENIPIS</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
