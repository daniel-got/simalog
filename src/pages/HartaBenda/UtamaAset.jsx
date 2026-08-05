import { useState, useEffect, useMemo } from 'react';
import {
  Archive,
  DollarSign,
  Shield,
  Wrench,
  AlertTriangle,
  BarChart3
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid
} from 'recharts';
import { supabase } from '../../lib/supabase';
import { StatCard } from '../../components/ui/Card';
import { formatNamaAset } from '../../utils/assetHelpers';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-100 rounded-[13px] shadow-lg px-13 py-8 text-sm">
      <p className="font-semibold text-slate-700 text-xs truncate max-w-[140px]">{label}</p>
      <p className="text-teal-600 font-bold mt-2">{payload[0].value} aset</p>
    </div>
  );
};

export default function UtamaAset() {
  const [aset, setAset] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAset() {
      try {
        const { data, error } = await supabase
          .from('assets')
          .select('*, kelompok_aset(nama)')
          .order('created_at', { ascending: false });
        if (error) {
          console.error('Error fetching assets:', error);
          setAset([]);
        } else {
          setAset(data || []);
        }
      } catch (err) {
        console.error('Catch error fetching assets:', err);
        setAset([]);
      } finally {
        setLoading(false);
      }
    }
    fetchAset();
  }, []);

  const formatRupiah = (n) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(n || 0);

  const formatRupiahRingkas = (n) => {
    if (n >= 1e9) return `Rp ${(n / 1e9).toFixed(1).replace('.', ',')} M`;
    if (n >= 1e6) return `Rp ${(n / 1e6).toFixed(1).replace('.', ',')} Jt`;
    if (n >= 1e3) return `Rp ${(n / 1e3).toFixed(1).replace('.', ',')} Rb`;
    return formatRupiah(n);
  };

  // 1. Empat Kartu Ringkasan
  const totalAset = aset.length;
  const totalNilaiAset = useMemo(() => {
    return aset.reduce((acc, curr) => acc + Number(curr.harga_beli || 0), 0);
  }, [aset]);
  const totalBaik = useMemo(() => {
    return aset.filter((a) => a.status_kondisi === 'Baik').length;
  }, [aset]);
  const totalPerluPerawatan = useMemo(() => {
    return aset.filter(
      (a) =>
        a.status_kondisi === 'Rusak Ringan' ||
        a.status_kondisi === 'Rusak Berat'
    ).length;
  }, [aset]);

  // 2. Grafik Batang: Sebaran Aset Per Kategori
  const chartData = useMemo(() => {
    const counts = {};
    aset.forEach((a) => {
      const cat = a.kelompok_aset?.nama || 'Lainnya';
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return Object.keys(counts).map((key) => ({
      name: key.split(' ').slice(0, 2).join(' '),
      jumlah: counts[key],
    }));
  }, [aset]);

  // 3. Kartu List / Alert: Perlu Perbaikan / Servis
  const needRepair = useMemo(() => {
    return aset.filter(
      (a) =>
        a.status_kondisi === 'Rusak Ringan' ||
        a.status_kondisi === 'Rusak Berat'
    );
  }, [aset]);

  return (
    <div
      className="space-y-21 lg:space-y-34 animate-[fadeUp_.35s_ease_both]"
      style={{ '--tw-enter-translate-y': '13px' }}
    >
      {/* ── Stats ── */}
      <section>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-13">
          Ringkasan
        </p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-13 lg:gap-21">
          <StatCard
            title="Total Aset"
            value={loading ? '...' : totalAset}
            icon={Archive}
            bg="bg-teal-50"
            iconColor="text-teal-600"
          />
          <StatCard
            title="Total Nilai Aset"
            value={loading ? '...' : formatRupiahRingkas(totalNilaiAset)}
            icon={DollarSign}
            bg="bg-blue-50"
            iconColor="text-blue-500"
          />
          <StatCard
            title="Kondisi Baik"
            value={loading ? '...' : totalBaik}
            icon={Shield}
            bg="bg-emerald-50"
            iconColor="text-emerald-500"
          />
          <StatCard
            title="Perlu Perawatan"
            value={loading ? '...' : totalPerluPerawatan}
            icon={Wrench}
            bg="bg-orange-50"
            iconColor="text-orange-500"
          />
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        {/* ── Grafik Batang (Kiri Bawah) ── */}
        <section className="lg:col-span-2">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-13">
            Sebaran Aset Per Kategori
          </p>
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-21 h-full">
            <div className="h-64 w-full">
              {loading ? (
                <div className="h-full w-full flex items-center justify-center text-slate-400 text-xs">
                  Memuat grafik...
                </div>
              ) : chartData.length === 0 ? (
                <div className="h-full w-full flex items-center justify-center text-slate-400 text-xs">
                  Tidak ada data untuk ditampilkan
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={chartData}
                    margin={{ top: 10, right: 5, left: -21, bottom: 50 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#f1f5f9"
                    />
                    <XAxis
                      dataKey="name"
                      interval={0}
                      tick={{
                        fontSize: 9,
                        fontFamily: 'Inter',
                        fill: '#94a3b8',
                        fontWeight: 600,
                        angle: -45,
                        textAnchor: 'end',
                        dy: 5,
                      }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      tick={{
                        fontSize: 10,
                        fontFamily: 'Inter',
                        fill: '#94a3b8',
                        fontWeight: 600,
                      }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      content={<CustomTooltip />}
                      cursor={{ fill: '#f8fafc' }}
                    />
                    <Bar
                      dataKey="jumlah"
                      fill="#0d9488"
                      radius={[8, 8, 0, 0]}
                      maxBarSize={34}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </section>

        {/* ── Kartu List / Alert (Kanan Bawah) ── */}
        <section className="lg:col-span-1">
          {loading ? (
            <div className="bg-slate-50 border border-slate-100 rounded-[21px] p-21 h-full flex flex-col items-center justify-center text-slate-400 minimum-h-[250px]">
              <p className="text-xs font-bold text-center">Memuat data...</p>
            </div>
          ) : needRepair.length > 0 ? (
            <div className="bg-yellow-50/50 border border-yellow-200 rounded-[21px] p-21 h-full">
              <div className="flex items-center gap-8 mb-13">
                <div className="w-21 h-21 rounded-[8px] bg-yellow-100 flex items-center justify-center shrink-0">
                  <AlertTriangle size={13} className="text-yellow-600" />
                </div>
                <p className="text-sm font-bold text-yellow-800">
                  Perlu Servis
                </p>
                <span className="ml-auto bg-yellow-200 text-yellow-800 text-[10px] font-bold px-8 py-2 rounded-full">
                  {needRepair.length} aset
                </span>
              </div>
              <div className="space-y-8 max-h-[260px] overflow-y-auto pr-2 custom-scrollbar">
                {needRepair.map((a) => (
                  <div
                    key={a.id}
                    className="flex items-center justify-between bg-white rounded-[13px] px-13 py-13 border border-yellow-100 shadow-sm"
                  >
                    <div className="min-w-0 pr-3">
                      <p className="text-sm font-semibold text-slate-700 leading-tight truncate">
                        {formatNamaAset(a)}
                      </p>
                      <p className="text-[10px] font-mono text-slate-400 mt-2">
                        {a.id} · {a.lokasi_ruangan}
                      </p>
                    </div>
                    <span className="text-red-600 font-bold text-xs leading-none shrink-0 bg-red-50 px-3 py-1 rounded-md border border-red-100">
                      {a.status_kondisi}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 border border-slate-100 rounded-[21px] p-21 h-full flex flex-col items-center justify-center text-slate-400 minimum-h-[250px]">
              <Shield size={34} className="mb-5 text-slate-300" />
              <p className="text-xs font-bold uppercase tracking-widest text-center">
                Semua aset dalam kondisi baik
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
