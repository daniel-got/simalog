import React, { useMemo } from 'react';
import { Package, ArrowDownToLine, ArrowUpFromLine, AlertCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import useStore from '../store/useStore';
import { Card, StatCard } from '../components/ui/Card';

export default function Utama() {
  const { barang, masuk, keluar } = useStore();

  // Kalkulasi Statistik
  const totalBarang = barang.length;
  const totalMasuk = masuk.reduce((acc, curr) => acc + parseInt(curr.jumlah), 0);
  const totalKeluar = keluar.reduce((acc, curr) => acc + parseInt(curr.jumlah), 0);
  const totalStok = barang.reduce((acc, curr) => acc + parseInt(curr.stok_saat_ini), 0);

  // Top 5 Stok Terbanyak
  const top5Barang = useMemo(() => {
    return [...barang]
      .sort((a, b) => b.stok_saat_ini - a.stok_saat_ini)
      .slice(0, 5)
      .map(b => ({ name: b.nama_barang, stok: b.stok_saat_ini }));
  }, [barang]);

  // Stok Menipis (<= 5)
  const lowStock = barang.filter(b => b.stok_saat_ini <= 5);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Kartu Statistik */}
      <div className="grid grid-cols-2 gap-4">
        <StatCard title="Total Jenis" value={totalBarang} icon={Package} colorClass="bg-blue-50" />
        <StatCard title="Total Stok" value={totalStok} icon={Package} colorClass="bg-green-50" />
        <StatCard title="Brg Masuk" value={totalMasuk} icon={ArrowDownToLine} colorClass="bg-teal-50" />
        <StatCard title="Brg Keluar" value={totalKeluar} icon={ArrowUpFromLine} colorClass="bg-orange-50" />
      </div>

      {/* Peringatan Stok Menipis */}
      {lowStock.length > 0 && (
        <Card className="bg-red-50 border-red-100">
          <div className="flex items-center gap-2 text-red-600 font-medium mb-3">
            <AlertCircle size={20} />
            <h2>Peringatan Stok Menipis</h2>
          </div>
          <div className="space-y-2">
            {lowStock.map(b => (
              <div key={b.kode_barang} className="flex justify-between items-center bg-white p-2 rounded-lg text-sm border border-red-50">
                <span className="font-medium text-gray-700">{b.nama_barang}</span>
                <span className="text-red-600 font-bold">{b.stok_saat_ini} tersisa</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Diagram Top 5 */}
      <Card>
        <h2 className="text-gray-700 font-medium mb-4">Top 5 Stok Terbanyak</h2>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={top5Barang} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
              <Tooltip 
                cursor={{ fill: '#f3f4f6' }}
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} 
              />
              <Bar dataKey="stok" fill="#22c55e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
      
    </div>
  );
}
