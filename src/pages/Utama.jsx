import { useMemo } from 'react';
import {
  Package, TrendingDown, TrendingUp, BarChart3,
  AlertTriangle, Boxes, ChevronRight
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid
} from 'recharts';
import useStore from '../store/useStore';
import { StatCard } from '../components/ui/Card';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-100 rounded-[13px] shadow-lg px-13 py-8 text-sm">
      <p className="font-semibold text-slate-700 text-xs truncate max-w-[140px]">{label}</p>
      <p className="text-teal-600 font-bold mt-2">{payload[0].value} unit</p>
    </div>
  );
};

export default function Utama() {
  const { barang, masuk, keluar } = useStore();

  const totalJenis  = barang.length;
  const totalStok   = barang.reduce((s, b) => s + b.stok_saat_ini, 0);
  const totalMasuk  = masuk.reduce((s, m) => s + parseInt(m.jumlah), 0);
  const totalKeluar = keluar.reduce((s, k) => s + parseInt(k.jumlah), 0);

  const top5 = useMemo(() =>
    [...barang]
      .sort((a, b) => b.stok_saat_ini - a.stok_saat_ini)
      .slice(0, 5)
      .map(b => ({ name: b.nama_barang.split(' ').slice(0, 2).join(' '), stok: b.stok_saat_ini })),
    [barang]
  );

  const lowStock = barang.filter(b => b.stok_saat_ini <= 5);

  return (
    <div className="space-y-21 animate-[fadeUp_.35s_ease_both]"
      style={{ '--tw-enter-translate-y': '13px' }}
    >
      {/* ── Stats ── */}
      <section>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-13">Ringkasan</p>
        <div className="grid grid-cols-2 gap-13">
          <StatCard title="Total Jenis"  value={totalJenis}
            icon={Boxes}     bg="bg-teal-50"   iconColor="text-teal-600" />
          <StatCard title="Total Stok"   value={totalStok}
            icon={BarChart3} bg="bg-blue-50"   iconColor="text-blue-500" />
          <StatCard title="Brg Masuk"    value={totalMasuk}
            icon={TrendingDown} bg="bg-emerald-50" iconColor="text-emerald-500" />
          <StatCard title="Brg Keluar"   value={totalKeluar}
            icon={TrendingUp}   bg="bg-orange-50"  iconColor="text-orange-500" />
        </div>
      </section>

      {/* ── Low Stock Warning ── */}
      {lowStock.length > 0 && (
        <section>
          <div className="bg-amber-50 border border-amber-200 rounded-[21px] p-21">
            <div className="flex items-center gap-8 mb-13">
              <div className="w-21 h-21 rounded-[8px] bg-amber-100 flex items-center justify-center shrink-0">
                <AlertTriangle size={13} className="text-amber-600" />
              </div>
              <p className="text-sm font-bold text-amber-800">Stok Menipis</p>
              <span className="ml-auto bg-amber-200 text-amber-800 text-[10px] font-bold px-8 py-2 rounded-full">
                {lowStock.length} item
              </span>
            </div>
            <div className="space-y-8">
              {lowStock.map(b => (
                <div key={b.kode_barang}
                  className="flex items-center justify-between bg-white rounded-[13px] px-13 py-13
                    border border-amber-100">
                  <div>
                    <p className="text-sm font-semibold text-slate-700 leading-tight">{b.nama_barang}</p>
                    <p className="text-[10px] font-mono text-slate-400 mt-2">{b.kode_barang}</p>
                  </div>
                  <span className="text-red-600 font-black text-lg leading-none">{b.stok_saat_ini}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Chart ── */}
      <section>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-13">Top 5 Stok Terbanyak</p>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-21">
          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={top5} margin={{ top: 5, right: 5, left: -21, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 10, fontFamily: 'Inter', fill: '#94a3b8', fontWeight: 600 }}
                  tickLine={false} axisLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10, fontFamily: 'Inter', fill: '#94a3b8', fontWeight: 600 }}
                  tickLine={false} axisLine={false}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
                <Bar dataKey="stok" fill="#0d9488" radius={[8, 8, 0, 0]} maxBarSize={34} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>
    </div>
  );
}
