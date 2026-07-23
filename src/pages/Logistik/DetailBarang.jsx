import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Package, LogIn, LogOut, Image as ImageIcon } from 'lucide-react';
// PERUBAHAN DI SINI: Mengarahkan impor ke useLogistikStore baru dengan path mundur 2 tingkat
import useStore from '../../store/Logistik/useLogistikStore';
import Button from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Table } from '../../components/ui/Table';
import { cn } from '../../utils/cn';

export default function DetailBarang() {
  const { kode } = useParams();
  const navigate = useNavigate();
  const { barang, masuk, keluar } = useStore();

  const item = barang.find(b => b.kode_barang === kode);

  if (!item) {
    return (
      <div className="flex flex-col items-center justify-center py-34">
        <p className="text-slate-500 mb-13">Barang tidak ditemukan.</p>
        <Button onClick={() => navigate('/barang')}>Kembali ke Data Barang</Button>
      </div>
    );
  }

  // Filter Log Masuk & Keluar khusus untuk barang ini
  const logMasuk = masuk
    .filter(m => m.kode_barang === kode)
    .sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));

  const logKeluar = keluar
    .filter(k => k.kode_barang === kode)
    .sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));

  // Hitung total
  const totalMasuk = logMasuk.reduce((acc, curr) => acc + Number(curr.jumlah || 0), 0);
  const totalKeluar = logKeluar.reduce((acc, curr) => acc + Number(curr.jumlah || 0), 0);

  return (
    <div className="space-y-21 w-full max-w-7xl mx-auto">

      {/* Header & Navigasi */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-13">
        <div className="flex items-center gap-13">
          <button
            onClick={() => navigate('/barang')}
            className="w-34 h-34 flex items-center justify-center bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-slate-300 text-slate-500 transition-all shadow-sm"
          >
            <ArrowLeft size={16} strokeWidth={2.5} />
          </button>
          <div>
            <h1 className="text-xl font-black text-slate-800 tracking-tight">Detail Barang</h1>
            <p className="text-xs text-slate-400 mt-2 font-mono">{item.kode_barang}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-21">
        {/* Kolom Kiri: Info Utama & Statistik */}
        <div className="lg:col-span-1 space-y-21">

          {/* Card Info Utama */}
          <Card className="p-21 border-slate-200 shadow-sm overflow-hidden relative">
            <div className="absolute top-0 right-0 p-34 opacity-5">
              <Package size={120} />
            </div>

            <div className="relative z-10 flex flex-col gap-13">
              {item.image_url ? (
                <img src={item.image_url} alt={item.nama_barang} className="w-full h-48 object-cover rounded-xl border border-slate-100 shadow-sm bg-slate-50" />
              ) : (
                <div className="w-full h-48 bg-slate-50 rounded-xl border border-slate-100 flex flex-col items-center justify-center text-slate-300">
                  <ImageIcon size={34} className="mb-8" />
                  <span className="text-xs font-medium">Tidak ada gambar</span>
                </div>
              )}

              <div>
                <span className="inline-block bg-teal-50 text-teal-700 font-bold font-mono text-[10px] px-8 py-3 rounded-md mb-8">
                  {item.kode_barang}
                </span>
                <h2 className="text-lg font-black text-slate-800 leading-tight">
                  {item.nama_barang}
                </h2>
                <div className="flex items-center gap-5 mt-5">
                  <span className="text-xs font-medium text-slate-500">{item.kelompok_barang || '-'}</span>
                  <span className="text-slate-300">•</span>
                  <span className="text-xs font-medium text-slate-500">{item.subkelompok_barang || '-'}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-13 pt-13 border-t border-slate-100">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Harga</p>
                  <p className="text-sm font-black text-emerald-600">Rp {item.satuan_harga ? item.satuan_harga.toLocaleString('id-ID') : '0'}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Sisa Stok</p>
                  <div className="flex items-baseline gap-5">
                    <p className={cn("text-xl font-black", item.stok_saat_ini <= 5 ? "text-rose-600" : "text-slate-800")}>
                      {item.stok_saat_ini}
                    </p>
                    <span className="text-[10px] font-bold text-slate-400">{item.satuan_barang}</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Card Statistik Total */}
          <div className="grid grid-cols-2 gap-13">
            <Card className="p-13 border-emerald-100 bg-emerald-50/50 shadow-sm flex flex-col justify-center items-center text-center">
              <div className="w-34 h-34 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-8">
                <LogIn size={16} strokeWidth={2.5} />
              </div>
              <p className="text-[10px] font-bold text-emerald-600/70 uppercase tracking-wider mb-2">Total Masuk</p>
              <p className="text-xl font-black text-emerald-700">{totalMasuk} <span className="text-xs">unit</span></p>
            </Card>

            <Card className="p-13 border-orange-100 bg-orange-50/50 shadow-sm flex flex-col justify-center items-center text-center">
              <div className="w-34 h-34 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center mb-8">
                <LogOut size={16} strokeWidth={2.5} />
              </div>
              <p className="text-[10px] font-bold text-orange-600/70 uppercase tracking-wider mb-2">Total Keluar</p>
              <p className="text-xl font-black text-orange-700">{totalKeluar} <span className="text-xs">unit</span></p>
            </Card>
          </div>
        </div>

        {/* Kolom Kanan: Histori Tabel */}
        <div className="lg:col-span-2 flex flex-col gap-21">

          {/* Tabel Masuk */}
          <Card className="p-21 border-slate-200 shadow-sm flex-1">
            <div className="flex items-center gap-8 mb-13 pb-13 border-b border-slate-100">
              <div className="w-21 h-21 bg-emerald-100 rounded flex items-center justify-center text-emerald-600">
                <LogIn size={12} strokeWidth={3} />
              </div>
              <h3 className="text-sm font-bold text-slate-800">Histori Barang Masuk</h3>
              <span className="ml-auto text-[10px] font-bold text-slate-400 bg-slate-100 px-5 py-2 rounded-full">
                {logMasuk.length} riwayat
              </span>
            </div>

            {logMasuk.length === 0 ? (
              <div className="py-21 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                Belum ada data barang masuk.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table headers={['Tanggal', '+Qty', 'Penerima / Keterangan']}>
                  {logMasuk.map(m => (
                    <tr key={m.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-13 py-8 text-[11px] text-slate-500 whitespace-nowrap">{m.tanggal}</td>
                      <td className="px-13 py-8">
                        <span className="bg-emerald-100 text-emerald-700 text-[10px] font-black px-5 py-2 rounded">
                          +{m.jumlah}
                        </span>
                      </td>
                      <td className="px-13 py-8 text-[11px] font-medium text-slate-600">{m.penerima}</td>
                    </tr>
                  ))}
                </Table>
              </div>
            )}
          </Card>

          {/* Tabel Keluar */}
          <Card className="p-21 border-slate-200 shadow-sm flex-1">
            <div className="flex items-center gap-8 mb-13 pb-13 border-b border-slate-100">
              <div className="w-21 h-21 bg-orange-100 rounded flex items-center justify-center text-orange-600">
                <LogOut size={12} strokeWidth={3} />
              </div>
              <h3 className="text-sm font-bold text-slate-800">Histori Barang Keluar</h3>
              <span className="ml-auto text-[10px] font-bold text-slate-400 bg-slate-100 px-5 py-2 rounded-full">
                {logKeluar.length} riwayat
              </span>
            </div>

            {logKeluar.length === 0 ? (
              <div className="py-21 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                Belum ada data barang keluar.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table headers={['Tanggal', '-Qty', 'Penerima / Keterangan']}>
                  {logKeluar.map(k => (
                    <tr key={k.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-13 py-8 text-[11px] text-slate-500 whitespace-nowrap">{k.tanggal}</td>
                      <td className="px-13 py-8">
                        <span className="bg-orange-100 text-orange-600 text-[10px] font-black px-5 py-2 rounded">
                          -{k.jumlah}
                        </span>
                      </td>
                      <td className="px-13 py-8 text-[11px] font-medium text-slate-600">{k.penerima}</td>
                    </tr>
                  ))}
                </Table>
              </div>
            )}
          </Card>

        </div>

      </div>
    </div>
  );
}