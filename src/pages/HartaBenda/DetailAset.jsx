import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { ArrowLeft, Building2, Wrench, LogOut, Image as ImageIcon } from 'lucide-react';
import useHartaBendaStore from '../../store/HartaBenda/useHartaBendaStore';
import Button from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Table } from '../../components/ui/Table';
import { cn } from '../../utils/cn';
import { supabase } from '../../lib/supabase';

export default function DetailAset() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { aset } = useHartaBendaStore();
  const item = (aset || []).find(a => a.id === id);

  const [maintenanceHistory, setMaintenanceHistory] = useState([]);
  const [loadingMaintenance, setLoadingMaintenance] = useState(true);

  const [activityHistory, setActivityHistory] = useState([]);
  const [loadingActivity, setLoadingActivity] = useState(true);

  useEffect(() => {
    if (!id) return;
    async function fetchMaintenance() {
      try {
        const { data, error } = await supabase
          .from('log_perawatan_aset')
          .select('*')
          .eq('id_aset', id)
          .order('tanggal', { ascending: false });

        if (error) {
          console.error('Fetch maintenance histories error:', error);
        } else {
          setMaintenanceHistory(data || []);
        }
      } catch (err) {
        console.error('Fetch maintenance histories catch error:', err);
      } finally {
        setLoadingMaintenance(false);
      }
    }
    fetchMaintenance();
  }, [id]);

  useEffect(() => {
    if (!id) return;
    async function fetchActivity() {
      try {
        const { data, error } = await supabase
          .from('log_aktivitas_aset')
          .select('*')
          .eq('id_aset', id)
          .order('tanggal', { ascending: false });

        if (error) {
          console.error('Fetch activity history error:', error);
        } else {
          setActivityHistory(data || []);
        }
      } catch (err) {
        console.error('Fetch activity history catch error:', err);
      } finally {
        setLoadingActivity(false);
      }
    }
    fetchActivity();
  }, [id]);

  if (!item) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
        <p className="text-slate-500 mb-6">Aset tidak ditemukan.</p>
        <Button onClick={() => navigate('/aset/daftar')}>Kembali ke Data Aset</Button>
      </div>
    );
  }

  const formatRupiah = (n) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(n || 0);

  return (
    <div className="space-y-6 w-full max-w-7xl mx-auto px-4 sm:px-6">
      {/* Header & Navigasi */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/aset/daftar')}
            className="w-10 h-10 flex items-center justify-center bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-slate-300 text-slate-500 transition-all shadow-sm shrink-0"
          >
            <ArrowLeft size={18} strokeWidth={2.5} />
          </button>
          <div>
            <h1 className="text-xl font-black text-slate-800 tracking-tight">Detail Aset</h1>
            <p className="text-xs text-slate-400 mt-0.5 font-mono">
              {item.kode || item.kode_aset || item.no_aset || item.id}
            </p>
          </div>
        </div>
      </div>

      {/* CSS GRID UTAMA: Mobile-First (1 Kolom di HP, 3 Kolom di Laptop/Desktop) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Kolom Kiri: Info Utama Aset */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="p-5 border-slate-200 shadow-sm overflow-hidden relative">
            <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
              <Building2 size={120} />
            </div>

            <div className="relative z-10 flex flex-col gap-4">
              {item.image_url ? (
                <img
                  src={item.image_url}
                  alt={item.nama_aset}
                  className="w-full h-48 object-cover rounded-xl border border-slate-100 shadow-sm bg-slate-50"
                />
              ) : (
                <div className="w-full h-48 bg-slate-50 rounded-xl border border-slate-100 flex flex-col items-center justify-center text-slate-300">
                  <ImageIcon size={34} className="mb-2" />
                  <span className="text-xs font-medium">Tidak ada gambar</span>
                </div>
              )}

              <div>
                <span className="inline-block bg-teal-50 text-teal-700 font-bold font-mono text-[10px] px-2.5 py-1 rounded-md mb-2">
                  {item.kode || item.kode_aset || item.no_aset || item.id}
                </span>
                <h2 className="text-lg font-black text-slate-800 leading-tight">
                  {item.nama_aset}
                </h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs font-medium text-slate-500">
                    {item.kategori_aset || '-'}
                  </span>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 space-y-3">
                {/* Mobile First: 1 Kolom di HP, 2 Kolom di Tablet Keatas */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Merek / No. Seri
                    </p>
                    <p className="text-xs font-semibold text-slate-700">
                      {item.merek_tipe || '-'}
                    </p>
                    {item.nomor_seri_plat && (
                      <p className="text-[10px] font-mono text-slate-400 mt-0.5">
                        {item.nomor_seri_plat}
                      </p>
                    )}
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Lokasi / Ruangan
                    </p>
                    <p className="text-xs font-semibold text-slate-700">
                      {item.lokasi_ruangan || '-'}
                    </p>
                  </div>
                </div>

                {/* Mobile First: 1 Kolom di HP, 2 Kolom di Tablet Keatas */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-slate-50">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Kondisi
                    </p>
                    <span
                      className={cn(
                        'text-[10px] font-bold px-2.5 py-1 rounded-md inline-block',
                        item.status_kondisi === 'Baik'
                          ? 'bg-green-50 text-green-600'
                          : item.status_kondisi === 'Rusak Ringan'
                            ? 'bg-amber-50 text-amber-600'
                            : item.status_kondisi === 'Dihapuskan'
                              ? 'bg-slate-100 text-slate-500'
                              : 'bg-red-50 text-red-600'
                      )}
                    >
                      {item.status_kondisi}
                    </span>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Harga Beli
                    </p>
                    <p className="text-sm font-black text-emerald-600">
                      {formatRupiah(item.harga_beli)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Kolom Kanan: Histori Perawatan & Pemakaian */}
        <div className="lg:col-span-2 flex flex-col gap-6">

          {/* Tabel Histori Perawatan */}
          <Card className="p-5 border-slate-200 shadow-sm flex-1">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
              <div className="w-6 h-6 bg-emerald-100 rounded flex items-center justify-center text-emerald-600 shrink-0">
                <Wrench size={14} strokeWidth={2.5} />
              </div>
              <h3 className="text-sm font-bold text-slate-800">Histori Perawatan</h3>
              <span className="ml-auto text-[10px] font-bold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full">
                {loadingMaintenance ? '...' : maintenanceHistory.length} riwayat
              </span>
            </div>

            {loadingMaintenance ? (
              <div className="py-6 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                Memuat data riwayat perawatan...
              </div>
            ) : maintenanceHistory.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                Belum ada data riwayat perawatan.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table headers={['Tanggal', 'Kategori', 'Total Biaya', 'Keterangan']}>
                  {maintenanceHistory.map(m => (
                    <tr key={m.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-3 py-2 text-[11px] text-slate-500 whitespace-nowrap">
                        {m.tanggal}
                      </td>
                      <td className="px-3 py-2">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-600">
                          {m.kategori_biaya || '-'}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <span className="bg-teal-50 text-teal-700 text-[10px] font-black px-2 py-0.5 rounded">
                          {formatRupiah(m.total_biaya)}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-[11px] font-medium text-slate-600">
                        {m.keterangan || '-'}
                      </td>
                    </tr>
                  ))}
                </Table>
              </div>
            )}
          </Card>

          {/* Tabel Histori Pemakaian / Aktivitas */}
          <Card className="p-5 border-slate-200 shadow-sm flex-1">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
              <div className="w-6 h-6 bg-orange-100 rounded flex items-center justify-center text-orange-600 shrink-0">
                <LogOut size={14} strokeWidth={2.5} />
              </div>
              <h3 className="text-sm font-bold text-slate-800">Histori Pemakaian & Aktivitas</h3>
              <span className="ml-auto text-[10px] font-bold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full">
                {loadingActivity ? '...' : activityHistory.length} riwayat
              </span>
            </div>

            {loadingActivity ? (
              <div className="py-6 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                Memuat data riwayat aktivitas...
              </div>
            ) : activityHistory.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                Belum ada data riwayat pemakaian.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table headers={['Tanggal', 'Jenis Aktivitas', 'Peminjam / Staf', 'Rencana Kembali', 'Keterangan']}>
                  {activityHistory.map(a => (
                    <tr key={a.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-3 py-2 text-[11px] text-slate-500 whitespace-nowrap">
                        {a.tanggal}
                      </td>
                      <td className="px-3 py-2">
                        <span className={cn(
                          'text-[10px] font-bold px-2 py-0.5 rounded-md inline-block',
                          a.jenis_aktivitas === 'Dipinjam' ? 'bg-blue-50 text-blue-600' :
                            a.jenis_aktivitas === 'Dikembalikan' ? 'bg-green-50 text-green-600' :
                              a.jenis_aktivitas === 'Dihapuskan' ? 'bg-rose-50 text-rose-600' :
                                a.jenis_aktivitas === 'Dipindahkan' ? 'bg-violet-50 text-violet-600' :
                                  'bg-slate-100 text-slate-600'
                        )}>
                          {a.jenis_aktivitas || '-'}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-[11px] font-medium text-slate-600">
                        {a.nama_staf || <span className="text-slate-300">—</span>}
                      </td>
                      <td className="px-3 py-2 text-[11px] text-slate-500 whitespace-nowrap">
                        {a.tanggal_rencana_kembali || <span className="text-slate-300">—</span>}
                      </td>
                      <td className="px-3 py-2 text-[11px] font-medium text-slate-600">
                        {a.keterangan || '-'}
                      </td>
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