import { useState, useEffect, useMemo } from 'react';
import useHartaBendaStore from '../../store/HartaBenda/useHartaBendaStore';
import useLogistikStore from '../../store/Logistik/useLogistikStore';
import { Card } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { Input, Select } from '../../components/ui/Input';
import SearchableSelect from '../../components/ui/SearchableSelect';
import Pagination from '../../components/ui/Pagination';
import {
  Plus, Search, Calendar, User, Building2,
  Clock, AlertTriangle, X, Wrench
} from 'lucide-react';

const makeEmptyForm = (currentUser) => ({
  id_aset: '',
  nama_pelapor: currentUser?.nama || 'Guest',
  tingkat: 'Ringan',
  deskripsi: '',
});

const TINGKAT_OPTIONS = [
  { label: 'Ringan', value: 'Ringan' },
  { label: 'Sedang', value: 'Sedang' },
  { label: 'Berat', value: 'Berat' },
];

const KATEGORI_OPTIONS = [
  'Peralatan & Mesin',
  'Gedung & Bangunan',
  'Kendaraan',
  'Elektronik & IT',
  'Furnitur',
  'Aset Tetap Lainnya'
];

export default function LaporRusakGuest() {
  const { currentUser } = useLogistikStore();
  const { aset, logPerawatan, addPerawatan } = useHartaBendaStore();

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(() => makeEmptyForm(currentUser));
  const [loading, setLoading] = useState(false);

  // Filter States
  const [filterText, setFilterText] = useState('');
  const [filterKategori, setFilterKategori] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(9); // 3x3 grid

  // Update nama pelapor jika currentUser selesai dimuat
  useEffect(() => {
    if (currentUser?.nama && !form.nama_pelapor) {
      setForm(prev => ({ ...prev, nama_pelapor: currentUser.nama }));
    }
  }, [currentUser]);

  // Reset page ke 1 saat filter berubah
  useEffect(() => {
    setCurrentPage(1);
  }, [filterText, filterKategori, filterStatus, filterStartDate, filterEndDate]);

  // Helper parse status, kendala & tingkat
  const parseStatus = (keterangan) => {
    const statusMatch = keterangan?.match(/\[Status:\s*([^\]]+)\]/);
    return statusMatch ? statusMatch[1] : 'Selesai';
  };

  const getCleanKeterangan = (keterangan) => {
    const kendalaMatch = keterangan?.match(/Kendala:\s*(.*)$/);
    return kendalaMatch ? kendalaMatch[1] : (keterangan || '-');
  };

  const parseTingkat = (keterangan) => {
    const tingkatMatch = keterangan?.match(/\[Tingkat:\s*([^\]]+)\]/);
    return tingkatMatch ? tingkatMatch[1] : 'Ringan';
  };

  const asetOptions = useMemo(() => {
    return (aset || []).map(a => ({
      label: `${a.nama_aset} — ${a.kode || a.id} (${a.lokasi_ruangan || 'Tanpa Lokasi'})`,
      value: a.id,
    }));
  }, [aset]);

  const getAssetDetails = (idAset) => {
    return (aset || []).find(a => a.id === idAset) || {};
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.id_aset) {
      alert('Pilih aset terlebih dahulu!');
      return;
    }
    if (!form.deskripsi) {
      alert('Deskripsi kerusakan wajib diisi!');
      return;
    }

    setLoading(true);
    const payload = {
      id_aset: form.id_aset,
      kategori_biaya: 'Perbaikan',
      total_biaya: 0,
      tanggal: new Date().toISOString().split('T')[0],
      keterangan: `[Pelapor: ${form.nama_pelapor || currentUser?.nama || 'Guest'}] [Tingkat: ${form.tingkat}] [Status: Menunggu Pengecekan] Kendala: ${form.deskripsi}`,
    };

    const ok = await addPerawatan(payload);
    setLoading(false);
    if (ok) {
      setForm(makeEmptyForm(currentUser));
      setOpen(false);
    }
  };

  // Filter & Search Logic
  const filteredReports = useMemo(() => {
    const namaPelapor = currentUser?.nama || 'Guest';

    return (logPerawatan || [])
      .filter(p => p.keterangan?.includes(`[Pelapor: ${namaPelapor}]`))
      .filter(p => {
        const item = getAssetDetails(p.id_aset);
        const status = parseStatus(p.keterangan);
        const cleanKet = getCleanKeterangan(p.keterangan);

        const targetText = `${item.nama_aset || ''} ${item.kode || ''} ${p.id_aset || ''} ${cleanKet}`.toLowerCase();
        const matchText = targetText.includes(filterText.toLowerCase());

        const matchKategori = filterKategori ? item.kategori_aset === filterKategori : true;
        const matchStatus = filterStatus ? status === filterStatus : true;

        // Date Picker Range
        const matchStart = filterStartDate ? new Date(p.tanggal) >= new Date(filterStartDate) : true;
        const matchEnd = filterEndDate ? new Date(p.tanggal) <= new Date(filterEndDate) : true;

        return matchText && matchKategori && matchStatus && matchStart && matchEnd;
      })
      .sort((a, b) => b.id - a.id);
  }, [logPerawatan, aset, filterText, filterKategori, filterStatus, filterStartDate, filterEndDate, currentUser]);

  const pagedReports = useMemo(() => {
    return filteredReports.slice((currentPage - 1) * perPage, currentPage * perPage);
  }, [filteredReports, currentPage, perPage]);

  return (
    <div className="space-y-21">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-slate-800 tracking-tight">Laporan Perawatan Aset</h1>
          <p className="text-xs text-slate-400 mt-1">{filteredReports.length} laporan kerusakan ditemukan</p>
        </div>
        <Button
          size="sm"
          onClick={() => setOpen(!open)}
          className="bg-teal-600 hover:bg-teal-700 text-white font-bold"
        >
          <Plus size={15} /> {open ? 'Tutup Form' : 'Lapor Kerusakan'}
        </Button>
      </div>

      {/* Form Tambah Laporan (Inline Card) */}
      {open && (
        <Card className="border-teal-200 bg-teal-50/40 p-21">
          <p className="text-base font-bold text-slate-700 mb-13 flex items-center gap-2">
            ⚠️ Laporan Kerusakan Aset Baru
          </p>
          <form onSubmit={handleSubmit} className="space-y-13">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-13">
              <SearchableSelect
                label="Pilih Aset Bermasalah"
                required
                options={asetOptions}
                value={form.id_aset}
                onChange={e => setForm({ ...form, id_aset: e.target.value })}
                placeholder="Pilih aset..."
              />
              <Input
                label="Nama Pelapor"
                type="text"
                required
                value={form.nama_pelapor}
                onChange={e => setForm({ ...form, nama_pelapor: e.target.value })}
              />
              <Select
                label="Tingkat Kerusakan"
                required
                options={TINGKAT_OPTIONS}
                value={form.tingkat}
                onChange={e => setForm({ ...form, tingkat: e.target.value })}
              />
            </div>

            <div className="flex flex-col gap-1 w-full">
              <label className="text-xs font-semibold text-slate-500 tracking-wide uppercase">
                Deskripsi Kerusakan / Kendala
              </label>
              <textarea
                required
                value={form.deskripsi}
                onChange={e => setForm({ ...form, deskripsi: e.target.value })}
                className="w-full px-3 py-3 rounded-2xl border border-slate-200 bg-slate-50 text-sm focus:bg-white focus:border-teal-500 focus:ring-2 focus:ring-teal-100 outline-none transition-all resize-none h-28"
                placeholder="Deskripsikan dengan detail kendala atau kerusakan yang dialami..."
              />
            </div>

            <div className="flex justify-end gap-8 pt-5">
              <Button type="button" variant="ghost" size="sm" onClick={() => { setForm(makeEmptyForm(currentUser)); setOpen(false); }}>
                Batal
              </Button>
              <Button type="submit" disabled={loading} size="sm" className="bg-teal-600 text-white">
                {loading ? 'Mengirim...' : 'Simpan'}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Baris Filter & Pencarian */}
      <div className="bg-slate-50 p-13 rounded-2xl border border-slate-100 shadow-sm space-y-8">
        <div className="relative">
          <Search size={14} className="absolute left-13 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari transaksi (nama aset, kode, kendala)..."
            value={filterText}
            onChange={e => setFilterText(e.target.value)}
            className="w-full pl-34 pr-13 py-8 text-xs bg-white border border-slate-200 rounded-xl focus:border-teal-500 focus:ring-2 focus:ring-teal-100 outline-none transition-all text-slate-700"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
          <div>
            <select
              value={filterKategori}
              onChange={e => setFilterKategori(e.target.value)}
              className="w-full px-8 py-8 text-[10px] bg-white border border-slate-200 rounded-xl focus:border-teal-500 focus:ring-2 focus:ring-teal-100 outline-none transition-all text-slate-600 font-medium"
            >
              <option value="">Semua Kategori Aset</option>
              {KATEGORI_OPTIONS.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="w-full px-8 py-8 text-[10px] bg-white border border-slate-200 rounded-xl focus:border-teal-500 focus:ring-2 focus:ring-teal-100 outline-none transition-all text-slate-600 font-medium"
            >
              <option value="">Semua Status</option>
              <option value="Menunggu Pengecekan">Menunggu Pengecekan</option>
              <option value="Sedang Diperbaiki">Sedang Diperbaiki</option>
              <option value="Selesai">Selesai</option>
            </select>
          </div>

          <div className="flex items-center gap-5">
            <span className="text-[10px] text-slate-400 font-bold uppercase shrink-0">Dari</span>
            <input
              type="date"
              value={filterStartDate}
              onChange={e => setFilterStartDate(e.target.value)}
              className="w-full px-8 py-8 text-[10px] bg-white border border-slate-200 rounded-xl focus:border-teal-500 focus:ring-2 focus:ring-teal-100 outline-none transition-all text-slate-600 font-medium"
            />
          </div>

          <div className="flex items-center gap-5">
            <span className="text-[10px] text-slate-400 font-bold uppercase shrink-0">Smp</span>
            <input
              type="date"
              value={filterEndDate}
              onChange={e => setFilterEndDate(e.target.value)}
              className="w-full px-8 py-8 text-[10px] bg-white border border-slate-200 rounded-xl focus:border-teal-500 focus:ring-2 focus:ring-teal-100 outline-none transition-all text-slate-600 font-medium"
            />
          </div>
        </div>
      </div>

      {/* Grid Card List */}
      {filteredReports.length === 0 ? (
        <div className="text-center py-34 text-slate-400 text-sm bg-slate-50 rounded-2xl border border-slate-100 border-dashed">
          <AlertTriangle size={34} className="mx-auto mb-5 text-slate-300" />
          Tidak ada riwayat laporan kerusakan aset.
        </div>
      ) : (
        <div className="space-y-21">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-13 lg:gap-21 w-full">
            {pagedReports.map(rep => {
              const item = getAssetDetails(rep.id_aset);
              const status = parseStatus(rep.keterangan);
              const kendala = getCleanKeterangan(rep.keterangan);
              const tingkat = parseTingkat(rep.keterangan);

              return (
                <div
                  key={rep.id}
                  className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col overflow-hidden group"
                >
                  {/* Gambar Aset */}
                  <div className="w-full h-40 rounded-t-2xl overflow-hidden bg-slate-100 flex items-center justify-center relative flex-shrink-0">
                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        alt={item.nama_aset}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <Building2 size={34} className="text-slate-300" />
                    )}
                    <span className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm text-slate-500 font-bold text-[9px] px-2 py-1 rounded-md border border-slate-100 uppercase tracking-wider">
                      {item.kategori_aset || 'Umum'}
                    </span>
                  </div>

                  {/* Body */}
                  <div className="flex flex-col flex-1 p-4">
                    {/* Nama & Kode */}
                    <div className="mb-3">
                      <h3 className="text-sm font-bold text-slate-800 leading-tight truncate">
                        {item.nama_aset || 'Aset Tidak Dikenal'}
                      </h3>
                      <p className="text-[10px] font-mono text-slate-400 mt-1">
                        {item.kode || item.id || rep.id_aset}
                      </p>
                    </div>

                    {/* Info detail */}
                    <div className="bg-slate-50 p-3 rounded-xl space-y-1 text-xs text-slate-600 mb-3">
                      <div className="flex justify-between">
                        <span className="font-semibold text-slate-400">Kendala</span>
                        <span className="text-slate-600 text-right max-w-[60%] line-clamp-2">{kendala}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-semibold text-slate-400">Tingkat</span>
                        <span className={`font-bold ${tingkat === 'Berat' ? 'text-red-600' :
                          tingkat === 'Sedang' ? 'text-amber-600' :
                            'text-slate-600'
                          }`}>{tingkat}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-semibold text-slate-400">Tgl Lapor</span>
                        <span className="text-slate-600">{rep.tanggal}</span>
                      </div>
                    </div>

                    {/* Badge Status */}
                    <div className="mb-2">
                      <span className={`text-[10px] font-black px-2 py-1 rounded-md uppercase tracking-wider inline-block ${status === 'Menunggu Pengecekan' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                        status === 'Sedang Diperbaiki' ? 'bg-blue-50 text-blue-600 border border-blue-100' :
                          'bg-green-50 text-green-600 border border-green-100'
                        }`}>
                        {status}
                      </span>
                    </div>

                    {/* Footer divider */}
                    <div className="border-t border-slate-100 pt-3 mt-auto flex items-center justify-between text-xs text-slate-400">
                      <div className="flex items-center gap-1 min-w-0">
                        <User size={12} className="shrink-0" />
                        <span className="truncate font-semibold">{currentUser?.nama || 'Guest'}</span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Clock size={10} />
                        <span>{rep.tanggal}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination Footer */}
          <Pagination
            total={filteredReports.length}
            perPage={perPage}
            currentPage={currentPage}
            onPageChange={setCurrentPage}
            onPerPageChange={setPerPage}
          />
        </div>
      )}
    </div>
  );
}