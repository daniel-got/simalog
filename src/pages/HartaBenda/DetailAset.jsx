import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { ArrowLeft, Building2, Wrench, Clock, Gauge, ShieldCheck, LogOut, Image as ImageIcon, FileText } from 'lucide-react';
import useHartaBendaStore from '../../store/HartaBenda/useHartaBendaStore';
import Button from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Table } from '../../components/ui/Table';
import { cn } from '../../utils/cn';
import { supabase } from '../../lib/supabase';
import { formatNamaAset } from '../../utils/assetHelpers';

export default function DetailAset() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { aset } = useHartaBendaStore();

  const [assetDetail, setAssetDetail] = useState(null);
  const [loadingAsset, setLoadingAsset] = useState(true);

  const [maintenanceHistory, setMaintenanceHistory] = useState([]);
  const [loadingMaintenance, setLoadingMaintenance] = useState(true);

  const [activityHistory, setActivityHistory] = useState([]);
  const [loadingActivity, setLoadingActivity] = useState(true);

  // 1. Fetch Detail Aset (Cek dari Store dulu, jika tidak ada fetch via API Supabase)
  useEffect(() => {
    if (!id) return;
    const storeItem = (aset || []).find(a => String(a.id) === String(id));
    if (storeItem) {
      setAssetDetail(storeItem);
      setLoadingAsset(false);
    } else {
      async function fetchAsset() {
        setLoadingAsset(true);
        try {
          const { data, error } = await supabase
            .from('assets')
            .select(`
              *,
              kelompok:kelompok_aset(id, nama, prefix_kode),
              sub_kelompok:sub_kelompok_aset(id, nama, maintenance_type)
            `)
            .eq('id', id)
            .single();

          if (!error && data) {
            setAssetDetail(data);
          }
        } catch (err) {
          console.error('Fetch asset error:', err);
        } finally {
          setLoadingAsset(false);
        }
      }
      fetchAsset();
    }
  }, [id, aset]);

  // 2. Fetch Histori Perawatan
  useEffect(() => {
    if (!id) return;
    async function fetchMaintenance() {
      try {
        const { data, error } = await supabase
          .from('log_perawatan_aset')
          .select('*')
          .eq('id_aset', id)
          .order('tanggal', { ascending: false });

        if (!error) {
          setMaintenanceHistory(data || []);
        }
      } catch (err) {
        console.error('Fetch maintenance error:', err);
      } finally {
        setLoadingMaintenance(false);
      }
    }
    fetchMaintenance();
  }, [id]);

  // 3. Fetch Histori Aktivitas
  useEffect(() => {
    if (!id) return;
    async function fetchActivity() {
      try {
        const { data, error } = await supabase
          .from('log_aktivitas_aset')
          .select('*')
          .eq('id_aset', id)
          .order('tanggal', { ascending: false });

        if (!error) {
          setActivityHistory(data || []);
        }
      } catch (err) {
        console.error('Fetch activity error:', err);
      } finally {
        setLoadingActivity(false);
      }
    }
    fetchActivity();
  }, [id]);

  if (loadingAsset) {
    return (
      <div className="flex flex-col items-center justify-center py-34">
        <p className="text-slate-400 text-sm animate-pulse">Memuat data aset...</p>
      </div>
    );
  }

  if (!assetDetail) {
    return (
      <div className="flex flex-col items-center justify-center py-34">
        <p className="text-slate-500 mb-13 font-semibold">Aset tidak ditemukan.</p>
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

  const kondisiBadgeClass = (kondisi) => {
    switch (kondisi) {
      case 'Baik':
        return 'bg-emerald-50 text-emerald-700 font-bold';
      case 'Rusak Ringan':
        return 'bg-amber-50 text-amber-700 font-bold';
      case 'Rusak Berat':
        return 'bg-rose-50 text-rose-700 font-bold';
      case 'Dihapuskan':
        return 'bg-slate-100 text-slate-600 font-bold';
      default:
        return 'bg-slate-100 text-slate-700 font-bold';
    }
  };

  const maintenanceType = assetDetail.sub_kelompok?.maintenance_type || null;

  // Hitung jatuh tempo bulan (jika tipe bulan)
  const getNextServiceMonth = () => {
    if (!assetDetail.tanggal_servis_terakhir || !assetDetail.interval_bulan) return '—';
    const lastDate = new Date(assetDetail.tanggal_servis_terakhir);
    if (isNaN(lastDate.getTime())) return '—';
    lastDate.setMonth(lastDate.getMonth() + Number(assetDetail.interval_bulan));
    return lastDate.toISOString().split('T')[0];
  };

  return (
    <div className="space-y-21 w-full max-w-7xl mx-auto">
      {/* Header & Navigasi */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-13">
        <div className="flex items-center gap-13">
          <button
            onClick={() => navigate(-1)}
            className="w-34 h-34 flex items-center justify-center bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-slate-300 text-slate-500 transition-all shadow-sm shrink-0"
            title="Kembali"
          >
            <ArrowLeft size={16} strokeWidth={2.5} />
          </button>
          <div>
            <h1 className="text-xl font-black text-slate-800 tracking-tight">Detail Aset</h1>
            <p className="text-xs text-slate-400 mt-2 font-mono">
              {assetDetail.kode_aset || assetDetail.id}
            </p>
          </div>
        </div>
      </div>

      {/* Grid Utama (Kartu Kiri: Info Utama, Kartu Kanan: 2 Tabel Riwayat) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-21">

        {/* ── KARTU KIRI: INFO UTAMA ASET ── */}
        <div className="lg:col-span-1 space-y-21">
          <Card className="p-21 border-slate-200 shadow-sm overflow-hidden relative">
            <div className="absolute top-0 right-0 p-34 opacity-5 pointer-events-none">
              <Building2 size={120} />
            </div>

            <div className="relative z-10 flex flex-col gap-13">
              {/* Foto Aset */}
              {assetDetail.foto_url ? (
                <img
                  src={assetDetail.foto_url}
                  alt={assetDetail.nama_aset}
                  className="w-full h-48 object-contain p-2 rounded-xl border border-slate-100 shadow-sm bg-slate-50"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = 'https://placehold.co/400x300?text=Gambar+Tidak+Tersedia';
                  }}
                />
              ) : (
                <div className="w-full h-48 bg-slate-50 rounded-xl border border-slate-100 flex flex-col items-center justify-center text-slate-300">
                  <ImageIcon size={34} className="mb-8" />
                  <span className="text-xs font-medium">Tidak ada gambar</span>
                </div>
              )}

              {/* Kode, Nama & Kategori */}
              <div>
                <span className="inline-block bg-teal-50 text-teal-700 font-bold font-mono text-[10px] px-8 py-3 rounded-md mb-8">
                  {assetDetail.kode_aset || '—'}
                </span>
                <h2 className="text-lg font-black text-slate-800 leading-tight">
                  {formatNamaAset(assetDetail)}
                </h2>
                <div className="flex items-center gap-5 mt-5">
                  <span className="text-xs font-medium text-slate-500">
                    {assetDetail.kelompok?.nama || '-'}
                  </span>
                  <span className="text-slate-300">•</span>
                  <span className="text-xs font-medium text-slate-500">
                    {assetDetail.sub_kelompok?.nama || '-'}
                  </span>
                </div>
              </div>

              {/* Informasi Detail Aset */}
              <div className="pt-13 border-t border-slate-100 space-y-13">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-13">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                      Merek / Tipe
                    </p>
                    <p className="text-xs font-semibold text-slate-700">
                      {assetDetail.merek_tipe || '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                      No. Seri / Plat
                    </p>
                    <p className="text-xs font-semibold font-mono text-slate-700">
                      {assetDetail.nomor_seri_plat || assetDetail.no_polisi || '-'}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-13 pt-8 border-t border-slate-50">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                      Lokasi / Ruangan
                    </p>
                    <p className="text-xs font-semibold text-slate-700">
                      {assetDetail.lokasi_ruangan || '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                      Penanggung Jawab
                    </p>
                    <p className="text-xs font-semibold text-slate-700">
                      {assetDetail.penanggung_jawab || '-'}
                    </p>
                  </div>
                </div>

                {/* ── Informasi BMN ── */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-13 pt-8 border-t border-slate-50">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                      Jenis Aset BMN
                    </p>
                    <p className="text-xs font-semibold text-slate-700">
                      {assetDetail.jenis_bmn || 'Intrakomptabel'}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                      Status Operasional
                    </p>
                    <span className={cn('text-[10px] font-bold px-6 py-2 rounded-md inline-block', assetDetail.status_operasional === 'Aktif' ? 'bg-teal-50 text-teal-700' : 'bg-rose-50 text-rose-700')}>
                      {assetDetail.status_operasional || 'Aktif'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-13 pt-8 border-t border-slate-50">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                      Kode Barang BMN
                    </p>
                    <p className="text-xs font-semibold font-mono text-slate-700">
                      {assetDetail.kode_bmn || '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                      NUP
                    </p>
                    <p className="text-xs font-semibold font-mono text-slate-700">
                      {assetDetail.nup || '-'}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-13 pt-8 border-t border-slate-50">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                      Kondisi Aset
                    </p>
                    <span className={cn('text-[10px] px-8 py-3 rounded-md inline-block', kondisiBadgeClass(assetDetail.status_kondisi))}>
                      {assetDetail.status_kondisi || 'Baik'}
                    </span>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                      Harga Beli
                    </p>
                    <p className="text-xs font-black text-emerald-600">
                      {formatRupiah(assetDetail.harga_beli)}
                    </p>
                  </div>
                </div>

                {/* Jatuh Tempo Servis (Jika Maintenance Type = KM / Bulan) */}
                {maintenanceType === 'km' && (
                  <div className="bg-sky-50/80 border border-sky-100 rounded-xl p-13 mt-13 space-y-8">
                    <p className="text-xs font-bold text-sky-800 flex items-center gap-5">
                      <Gauge size={14} className="text-sky-600" /> Servis Rutin (Berbasis KM)
                    </p>
                    <div className="grid grid-cols-3 gap-5 text-center">
                      <div className="bg-white p-5 rounded-lg border border-sky-100">
                        <span className="text-[9px] text-slate-400 block font-medium">KM Saat Ini</span>
                        <span className="text-xs font-black text-slate-700">{assetDetail.km_saat_ini || 0} KM</span>
                      </div>
                      <div className="bg-white p-5 rounded-lg border border-sky-100">
                        <span className="text-[9px] text-slate-400 block font-medium">Interval</span>
                        <span className="text-xs font-black text-sky-700">{assetDetail.interval_km || 0} KM</span>
                      </div>
                      <div className="bg-white p-5 rounded-lg border border-sky-100">
                        <span className="text-[9px] text-slate-400 block font-medium">Target Servis</span>
                        <span className="text-xs font-black text-emerald-600">
                          {Number(assetDetail.km_saat_ini || 0) + Number(assetDetail.interval_km || 0)} KM
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {maintenanceType === 'bulan' && (
                  <div className="bg-violet-50/80 border border-violet-100 rounded-xl p-13 mt-13 space-y-8">
                    <p className="text-xs font-bold text-violet-800 flex items-center gap-5">
                      <Clock size={14} className="text-violet-600" /> Servis Rutin (Berbasis Bulan)
                    </p>
                    <div className="grid grid-cols-3 gap-5 text-center">
                      <div className="bg-white p-5 rounded-lg border border-violet-100">
                        <span className="text-[9px] text-slate-400 block font-medium">Servis Terakhir</span>
                        <span className="text-xs font-black text-slate-700">{assetDetail.tanggal_servis_terakhir || '—'}</span>
                      </div>
                      <div className="bg-white p-5 rounded-lg border border-violet-100">
                        <span className="text-[9px] text-slate-400 block font-medium">Interval</span>
                        <span className="text-xs font-black text-violet-700">{assetDetail.interval_bulan || 0} Bln</span>
                      </div>
                      <div className="bg-white p-5 rounded-lg border border-violet-100">
                        <span className="text-[9px] text-slate-400 block font-medium">Jatuh Tempo</span>
                        <span className="text-xs font-black text-rose-600">{getNextServiceMonth()}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Lampiran Lampiran Opsional */}
                {assetDetail.lampiran_url && (
                  <div className="pt-8 border-t border-slate-50">
                    <a
                      href={assetDetail.lampiran_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-8 text-xs font-bold text-teal-600 bg-teal-50 hover:bg-teal-100 px-13 py-8 rounded-xl transition-colors"
                    >
                      <FileText size={14} /> Lihat Lampiran Berkas
                    </a>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>

        {/* ── KARTU KANAN: 2 TABEL RIWAYAT ── */}
        <div className="lg:col-span-2 flex flex-col gap-21">

          {/* 1. Tabel Histori Perawatan (log_perawatan_aset) */}
          <Card className="p-21 border-slate-200 shadow-sm flex-1">
            <div className="flex items-center gap-8 mb-13 pb-8 border-b border-slate-100">
              <div className="w-26 h-26 bg-emerald-100 rounded-lg flex items-center justify-center text-emerald-600 shrink-0">
                <Wrench size={14} strokeWidth={2.5} />
              </div>
              <h3 className="text-sm font-bold text-slate-800">Histori Perawatan</h3>
              <span className="ml-auto text-[10px] font-bold text-slate-400 bg-slate-100 px-8 py-3 rounded-full">
                {loadingMaintenance ? '...' : maintenanceHistory.length} riwayat
              </span>
            </div>

            {loadingMaintenance ? (
              <div className="py-21 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200 animate-pulse">
                Memuat data riwayat perawatan...
              </div>
            ) : maintenanceHistory.length === 0 ? (
              <div className="py-21 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                Belum ada data riwayat perawatan.
              </div>
            ) : (
              <Table headers={['Tanggal', 'Kategori Biaya', 'Total Biaya', 'Keterangan']}>
                {maintenanceHistory.map(m => (
                  <tr key={m.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-13 py-8 text-xs text-slate-500 whitespace-nowrap">
                      {m.tanggal || '-'}
                    </td>
                    <td className="px-13 py-8">
                      <span className="text-[10px] font-bold px-8 py-3 rounded bg-amber-50 text-amber-600">
                        {m.kategori_biaya || '-'}
                      </span>
                    </td>
                    <td className="px-13 py-8">
                      <span className="text-xs font-black text-emerald-600">
                        {formatRupiah(m.total_biaya)}
                      </span>
                    </td>
                    <td className="px-13 py-8 text-xs font-medium text-slate-600">
                      {m.keterangan || '-'}
                    </td>
                  </tr>
                ))}
              </Table>
            )}
          </Card>

          {/* 2. Tabel Histori Aktivitas (log_aktivitas_aset) */}
          <Card className="p-21 border-slate-200 shadow-sm flex-1">
            <div className="flex items-center gap-8 mb-13 pb-8 border-b border-slate-100">
              <div className="w-26 h-26 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 shrink-0">
                <LogOut size={14} strokeWidth={2.5} />
              </div>
              <h3 className="text-sm font-bold text-slate-800">Histori Aktivitas & Pemakaian</h3>
              <span className="ml-auto text-[10px] font-bold text-slate-400 bg-slate-100 px-8 py-3 rounded-full">
                {loadingActivity ? '...' : activityHistory.length} riwayat
              </span>
            </div>

            {loadingActivity ? (
              <div className="py-21 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200 animate-pulse">
                Memuat data riwayat aktivitas...
              </div>
            ) : activityHistory.length === 0 ? (
              <div className="py-21 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                Belum ada data riwayat aktivitas.
              </div>
            ) : (
              <Table headers={['Tanggal', 'Jenis Aktivitas', 'Peminjam / Staf', 'Rencana Kembali', 'Keterangan']}>
                {activityHistory.map(a => (
                  <tr key={a.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-13 py-8 text-xs text-slate-500 whitespace-nowrap">
                      {a.tanggal || '-'}
                    </td>
                    <td className="px-13 py-8">
                      <span className={cn(
                        'text-[10px] font-bold px-8 py-3 rounded-md inline-block',
                        a.jenis_aktivitas === 'Dipinjam' ? 'bg-blue-50 text-blue-600' :
                          a.jenis_aktivitas === 'Dikembalikan' ? 'bg-emerald-50 text-emerald-600' :
                            a.jenis_aktivitas === 'Dihapuskan' ? 'bg-rose-50 text-rose-600' :
                              a.jenis_aktivitas === 'Dipindahkan' ? 'bg-violet-50 text-violet-600' :
                                'bg-slate-100 text-slate-600'
                      )}>
                        {a.jenis_aktivitas || '-'}
                      </span>
                    </td>
                    <td className="px-13 py-8 text-xs font-medium text-slate-600">
                      {a.nama_staf || <span className="text-slate-300">—</span>}
                    </td>
                    <td className="px-13 py-8 text-xs text-slate-500 whitespace-nowrap">
                      {a.tanggal_rencana_kembali || <span className="text-slate-300">—</span>}
                    </td>
                    <td className="px-13 py-8 text-xs font-medium text-slate-600">
                      {a.keterangan || '-'}
                    </td>
                  </tr>
                ))}
              </Table>
            )}
          </Card>

        </div>

      </div>
    </div>
  );
}