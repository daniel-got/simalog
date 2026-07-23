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
          .from('daftar_aset')
          .select('*')
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
      const cat = a.kategori_aset || 'Lainnya';
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
          Ringkasan Harta Benda
        </p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-13 lg:gap-21">
          <StatCard
            title="TOTAL ASET"
            value={loading ? '...' : totalAset}
            icon={Archive}
            bg="bg-teal-50"
            iconColor="text-teal-600"
          />
          <StatCard
            title="TOTAL NILAI ASET"
            value={
              loading ? (
                '...'
              ) : (
                <span className="text-xl md:text-2xl font-black text-slate-800 tracking-tight truncate whitespace-nowrap block">
                  {formatRupiah(totalNilaiAset)}
                </span>
              )
            }
            icon={DollarSign}
            bg="bg-blue-50"
            iconColor="text-blue-500"
          />
          <StatCard
            title="KONDISI BAIK"
            value={loading ? '...' : totalBaik}
            icon={Shield}
            bg="bg-emerald-50"
            iconColor="text-emerald-500"
          />
          <StatCard
            title="PERLU PERAWATAN"
            value={loading ? '...' : totalPerluPerawatan}
            icon={Wrench}
            bg="bg-orange-50"
            iconColor="text-orange-500"
          />
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-21 lg:gap-34">
        {/* ── Grafik Batang (Kiri Bawah) ── */}
        <section className="lg:col-span-2">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-13">
            SEBARAN ASET PER KATEGORI
          </p>
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-21">
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
                    margin={{ top: 5, right: 5, left: -21, bottom: 5 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#f1f5f9"
                    />
                    <XAxis
                      dataKey="name"
                      tick={{
                        fontSize: 10,
                        fontFamily: 'Inter',
                        fill: '#94a3b8',
                        fontWeight: 600,
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
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-13">
            Perlu Perbaikan / Servis
          </p>
          {loading ? (
            <div className="bg-slate-50 border border-slate-100 rounded-[21px] p-21 h-full flex flex-col items-center justify-center text-slate-400 minimum-h-[250px]">
              <p className="text-xs font-bold text-center">Memuat data...</p>
            </div>
          ) : needRepair.length > 0 ? (
            <div className="bg-amber-50 border border-amber-200 rounded-[21px] p-21 h-full">
              <div className="flex items-center gap-8 mb-13">
                <div className="w-21 h-21 rounded-[8px] bg-amber-100 flex items-center justify-center shrink-0">
                  <AlertTriangle size={13} className="text-amber-600" />
                </div>
                <p className="text-sm font-bold text-amber-800">
                  Perlu Servis
                </p>
                <span className="ml-auto bg-amber-200 text-amber-800 text-[10px] font-bold px-8 py-2 rounded-full">
                  {needRepair.length} aset
                </span>
              </div>
              <div className="space-y-8 max-h-[220px] overflow-y-auto pr-2 custom-scrollbar">
                {needRepair.map((a) => (
                  <div
                    key={a.id}
                    className="flex items-center justify-between bg-white rounded-[13px] px-13 py-13 border border-amber-100"
                  >
                    <div className="min-w-0 pr-3">
                      <p className="text-sm font-semibold text-slate-700 leading-tight truncate">
                        {a.nama_aset}
                      </p>
                      <p className="text-[10px] font-mono text-slate-400 mt-2">
                        {a.id} · {a.lokasi_ruangan}
                      </p>
                    </div>
                    <span className="text-red-600 font-bold text-xs leading-none shrink-0 bg-red-50 px-5 py-2 rounded-md">
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
