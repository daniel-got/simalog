import { useState } from 'react';
import { Layers3, ArrowUp, ArrowDown } from 'lucide-react';
import useStore from '../store/useStore';
import Button from '../components/ui/Button';
import { Select } from '../components/ui/Input';

export default function Stok() {
  const { barang, addMasuk, addKeluar } = useStore();
  const [kode, setKode]   = useState('');
  const [jenis, setJenis] = useState('masuk');
  const [jumlah, setJumlah] = useState('');
  const selected = barang.find(b => b.kode_barang === kode);

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

      {/* Stok list */}
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Daftar Stok</p>
      
      {barang.length === 0 ? (
        <div className="text-center py-34 text-slate-400 text-sm bg-slate-50 rounded-2xl border border-slate-100 border-dashed">
          Belum ada data barang
        </div>
      ) : (
        <div className="space-y-13">
          {barang.map(b => (
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
