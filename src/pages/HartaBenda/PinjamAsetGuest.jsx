import { useState, useEffect, useMemo, useCallback } from 'react';
import useHartaBendaStore from '../../store/HartaBenda/useHartaBendaStore';
import useLogistikStore from '../../store/Logistik/useLogistikStore';
import { supabase } from '../../lib/supabase';
import { Card } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import SearchableSelect from '../../components/ui/SearchableSelect';
import Pagination from '../../components/ui/Pagination';
import {
  Plus, Search, Calendar, User, Trash2, Building2,
  Clock, ClipboardList, X, Loader2
} from 'lucide-react';

const makeEmptyForm = (namaUser) => ({
  id_aset: '',
  nama_staf: namaUser || 'Guest',
  tanggal: new Date().toISOString().split('T')[0],
  tanggal_rencana_kembali: '',
  keperluan: '',
});

const KATEGORI_OPTIONS = [
  'Peralatan & Mesin',
  'Gedung & Bangunan',
  'Kendaraan',
  'Elektronik & IT',
  'Furnitur',
  'Aset Tetap Lainnya'
];

// Badge status
const statusBadge = (status) => {
  switch (status) {
    case 'pending':   return 'bg-amber-50 text-amber-600 border border-amber-100';
    case 'disetujui': return 'bg-green-50 text-green-600 border border-green-100';
    case 'ditolak':   return 'bg-red-50 text-red-600 border border-red-100';
    default:          return 'bg-slate-100 text-slate-500 border border-slate-200';
  }
};

const statusLabel = (status) => {
  switch (status) {
    case 'pending':   return 'Pending';
    case 'disetujui': return 'Disetujui';
    case 'ditolak':   return 'Ditolak';
    default:          return status || '—';
  }
};

export default function PinjamAsetGuest() {
  const { currentUser } = useLogistikStore();
  const { aset, logAktivitas } = useHartaBendaStore();

  const [open, setOpen]     = useState(false);
  const [form, setForm]     = useState(() => makeEmptyForm(currentUser?.nama));
  const [loading, setLoading] = useState(false);

  // Data pengajuan dari tabel peminjaman_aset
  const [daftarPinjam, setDaftarPinjam] = useState([]);
  const [loadingList, setLoadingList]   = useState(true);

  // Filter States
  const [filterText, setFilterText]           = useState('');
  const [filterKategori, setFilterKategori]   = useState('');
  const [filterStatus, setFilterStatus]       = useState('');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate]     = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage]         = useState(9);

  // Update nama staf di form jika data currentUser baru termuat
  useEffect(() => {
    if (currentUser?.nama && form.nama_staf === 'Guest') {
      setForm(prev => ({ ...prev, nama_staf: currentUser.nama }));
    }
  }, [currentUser]);

  // Reset page on filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filterText, filterKategori, filterStatus, filterStartDate, filterEndDate]);

  // ── Fetch data pinjam milik user ini ────────────────────────────────────
  const fetchDaftarPinjam = useCallback(async () => {
    if (!currentUser?.nama) return;
    setLoadingList(true);
    const { data, error } = await supabase
      .from('peminjaman_aset')
      .select(`
        *,
        aset:id_aset ( id, nama_aset, kode_aset, foto_url, lokasi_ruangan )
      `)
      .eq('nama_peminjam', currentUser.nama)
      .order('created_at', { ascending: false });

    if (!error) setDaftarPinjam(data || []);
    setLoadingList(false);
  }, [currentUser?.nama]);

  useEffect(() => {
    fetchDaftarPinjam();
  }, [fetchDaftarPinjam]);

  // ── Supabase Realtime: auto-update saat status berubah ──────────────────
  useEffect(() => {
    if (!currentUser?.nama) return;

    const channel = supabase
      .channel('pinjam-guest-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'peminjaman_aset',
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            // Hanya tambahkan jika milik user ini
            if (payload.new?.nama_peminjam === currentUser.nama) {
              // Re-fetch untuk mendapatkan data relasi aset
              fetchDaftarPinjam();
            }
          } else if (payload.eventType === 'UPDATE') {
            setDaftarPinjam(prev =>
              prev.map(p => p.id === payload.new.id ? { ...p, ...payload.new } : p)
            );
          } else if (payload.eventType === 'DELETE') {
            setDaftarPinjam(prev => prev.filter(p => p.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser?.nama, fetchDaftarPinjam]);

  // ── Hitung ketersediaan aset (dari log_aktivitas_aset) ──────────────────
  const latestActivity = useMemo(() => {
    const map = {};
    const sorted = [...(logAktivitas || [])].sort((a, b) => a.id - b.id);
    sorted.forEach(act => { map[act.id_aset] = act.jenis_aktivitas; });
    return map;
  }, [logAktivitas]);

  const availableAset = useMemo(() => {
    return (aset || []).filter(a => {
      const isCondOk = a.status_kondisi !== 'Dihapuskan' && a.status_kondisi !== 'Rusak Berat';
      const notBorrowed = latestActivity[a.id] !== 'Dipinjam';
      return isCondOk && notBorrowed;
    });
  }, [aset, latestActivity]);

  const asetOptions = useMemo(() => {
    return availableAset.map(a => ({
      label: `${a.nama_aset} — ${a.kode_aset || a.id} (${a.lokasi_ruangan || 'Tanpa Lokasi'})`,
      value: a.id,
    }));
  }, [availableAset]);

  const getAssetDetails = useCallback((idAset) => {
    return (aset || []).find(a => a.id === idAset) || {};
  }, [aset]);

  // ── Submit pengajuan ke tabel peminjaman_aset ────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.id_aset) {
      alert('Pilih aset terlebih dahulu!');
      return;
    }
    if (!form.tanggal_rencana_kembali) {
      alert('Tanggal rencana kembali wajib diisi!');
      return;
    }
    if (form.tanggal_rencana_kembali < form.tanggal) {
      alert('Tanggal kembali tidak boleh kurang dari tanggal pinjam!');
      return;
    }

    setLoading(true);
    const payload = {
      id_aset:         Number(form.id_aset),
      nama_peminjam:   form.nama_staf || currentUser?.nama || 'Guest',
      keperluan:       form.keperluan || '',
      tanggal_pinjam:  form.tanggal,
      tanggal_kembali: form.tanggal_rencana_kembali,
      status:          'pending',
    };

    const { error } = await supabase.from('peminjaman_aset').insert([payload]);
    setLoading(false);

    if (error) {
      alert('Gagal mengirim pengajuan: ' + error.message);
      return;
    }

    setForm(makeEmptyForm(currentUser?.nama));
    setOpen(false);
    // Re-fetch untuk tampilkan data baru (Realtime akan trigger juga)
    fetchDaftarPinjam();
  };

  // ── Batalkan pengajuan (hanya saat status pending) ───────────────────────
  const handleCancel = async (id) => {
    if (!window.confirm('Yakin ingin membatalkan pengajuan peminjaman ini?')) return;
    const { error } = await supabase.from('peminjaman_aset').delete().eq('id', id);
    if (error) {
      alert('Gagal membatalkan: ' + error.message);
      return;
    }
    setDaftarPinjam(prev => prev.filter(p => p.id !== id));
  };

  // ── Filter & Search ──────────────────────────────────────────────────────
  const filteredLoans = useMemo(() => {
    return daftarPinjam.filter(loan => {
      const asetDetail = loan.aset || getAssetDetails(loan.id_aset);
      const targetText = `${asetDetail?.nama_aset || ''} ${asetDetail?.kode_aset || ''} ${loan.keperluan || ''}`.toLowerCase();
      const matchText  = targetText.includes(filterText.toLowerCase());

      const matchKategori = filterKategori
        ? (asetDetail?.kategori_aset || '') === filterKategori
        : true;

      const matchStatus = filterStatus
        ? loan.status === filterStatus
        : true;

      const tgl = loan.tanggal_pinjam || '';
      const matchStart = filterStartDate ? tgl >= filterStartDate : true;
      const matchEnd   = filterEndDate   ? tgl <= filterEndDate   : true;

      return matchText && matchKategori && matchStatus && matchStart && matchEnd;
    });
  }, [daftarPinjam, aset, filterText, filterKategori, filterStatus, filterStartDate, filterEndDate]);

  const pagedLoans = useMemo(() => {
    return filteredLoans.slice((currentPage - 1) * perPage, currentPage * perPage);
  }, [filteredLoans, currentPage, perPage]);

  return (
    <div className="space-y-21">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-slate-800 tracking-tight">Peminjaman Aset</h1>
          <p className="text-xs text-slate-400 mt-1">{filteredLoans.length} pengajuan peminjaman</p>
        </div>
        <Button
          size="sm"
          onClick={() => setOpen(!open)}
          className="bg-teal-600 hover:bg-teal-700 text-white font-bold"
        >
          {open ? <X size={15} /> : <Plus size={15} />}
          <span className="ml-1">{open ? 'Tutup Form' : 'Kirim Pengajuan'}</span>
        </Button>
      </div>

      {/* Form Tambah Pengajuan */}
      {open && (
        <Card className="border-teal-200 bg-teal-50/40 p-21">
          <p className="text-base font-bold text-slate-700 mb-13">
            📋&nbsp; Pengajuan Pinjam Aset Baru
          </p>
          <form onSubmit={handleSubmit} className="space-y-13">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-13">
              <SearchableSelect
                label="Pilih Aset"
                required
                options={asetOptions}
                value={form.id_aset}
                onChange={e => setForm({ ...form, id_aset: e.target.value })}
                placeholder={asetOptions.length === 0 ? "Tidak ada aset tersedia saat ini" : "Pilih aset..."}
                disabled={asetOptions.length === 0}
              />
              <Input
                label="Nama Peminjam"
                type="text"
                required
                value={form.nama_staf}
                onChange={e => setForm({ ...form, nama_staf: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-13">
              <Input
                label="Tanggal Pinjam"
                type="date"
                required
                value={form.tanggal}
                onChange={e => setForm({ ...form, tanggal: e.target.value })}
              />
              <Input
                label="Tanggal Kembali"
                type="date"
                required
                value={form.tanggal_rencana_kembali}
                onChange={e => setForm({ ...form, tanggal_rencana_kembali: e.target.value })}
              />
            </div>

            <div className="flex flex-col gap-5 w-full">
              <label className="text-xs font-semibold text-slate-500 tracking-wide uppercase">
                Keperluan / Tujuan
              </label>
              <textarea
                required
                value={form.keperluan}
                onChange={e => setForm({ ...form, keperluan: e.target.value })}
                className="w-full px-13 py-13 rounded-2xl border border-slate-200 bg-slate-50 text-sm focus:bg-white focus:border-teal-500 focus:ring-2 focus:ring-teal-100 outline-none transition-all resize-none h-28"
                placeholder="Tulis tujuan peminjaman aset..."
              />
            </div>

            <div className="flex justify-end gap-8 pt-5">
              <Button type="button" variant="ghost" size="sm" onClick={() => { setForm(makeEmptyForm(currentUser?.nama)); setOpen(false); }}>
                Batal
              </Button>
              <Button
                type="submit"
                disabled={loading || asetOptions.length === 0}
                size="sm"
                className="bg-teal-600 hover:bg-teal-700 text-white"
              >
                {loading ? <><Loader2 size={13} className="animate-spin mr-1" /> Mengirim...</> : 'Simpan'}
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
            placeholder="Cari transaksi (nama aset, kode, keperluan)..."
            value={filterText}
            onChange={e => setFilterText(e.target.value)}
            className="w-full pl-34 pr-13 py-8 text-xs bg-white border border-slate-200 rounded-xl focus:border-teal-500 focus:ring-2 focus:ring-teal-100 outline-none transition-all text-slate-700"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
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

          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="w-full px-8 py-8 text-[10px] bg-white border border-slate-200 rounded-xl focus:border-teal-500 focus:ring-2 focus:ring-teal-100 outline-none transition-all text-slate-600 font-medium"
          >
            <option value="">Semua Status</option>
            <option value="pending">Pending</option>
            <option value="disetujui">Disetujui</option>
            <option value="ditolak">Ditolak</option>
          </select>

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
      {loadingList ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-13 lg:gap-21">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-pulse">
              <div className="w-full h-40 bg-slate-100" />
              <div className="p-4 space-y-3">
                <div className="h-4 bg-slate-100 rounded w-3/4" />
                <div className="h-3 bg-slate-100 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredLoans.length === 0 ? (
        <div className="text-center py-34 text-slate-400 text-sm bg-slate-50 rounded-2xl border border-slate-100 border-dashed">
          <ClipboardList size={34} className="mx-auto mb-5 text-slate-300" />
          Tidak ada riwayat transaksi peminjaman aset.
        </div>
      ) : (
        <div className="space-y-21">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-13 lg:gap-21 w-full">
            {pagedLoans.map(loan => {
              const asetDetail = loan.aset || getAssetDetails(loan.id_aset);
              const status     = loan.status || 'pending';

              return (
                <div
                  key={loan.id}
                  className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col overflow-hidden group"
                >
                  {/* Gambar Aset */}
                  <div className="w-full h-40 rounded-t-2xl overflow-hidden bg-slate-100 flex items-center justify-center relative flex-shrink-0">
                    {asetDetail?.foto_url || asetDetail?.image_url ? (
                      <img
                        src={asetDetail.foto_url || asetDetail.image_url}
                        alt={asetDetail.nama_aset}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <Building2 size={34} className="text-slate-300" />
                    )}
                    <span className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm text-slate-500 font-bold text-[9px] px-2 py-1 rounded-md border border-slate-100 uppercase tracking-wider">
                      {asetDetail?.kategori_aset || 'Umum'}
                    </span>
                  </div>

                  {/* Body */}
                  <div className="flex flex-col flex-1 p-4">
                    {/* Nama & Kode */}
                    <div className="mb-3">
                      <h3 className="text-sm font-bold text-slate-800 leading-tight truncate">
                        {asetDetail?.nama_aset || 'Aset Tidak Dikenal'}
                      </h3>
                      <p className="text-[10px] font-mono text-slate-400 mt-1">
                        {asetDetail?.kode_aset || asetDetail?.id || loan.id_aset}
                      </p>
                    </div>

                    {/* Info detail */}
                    <div className="bg-slate-50 p-3 rounded-xl space-y-1.5 text-sm text-slate-600 mb-3">
                      <div className="flex justify-between items-start">
                        <span className="text-xs font-semibold text-slate-400">Keperluan</span>
                        <span className="text-xs text-slate-600 text-right max-w-[60%] line-clamp-2">{loan.keperluan || '—'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-xs font-semibold text-slate-400">Tgl Pinjam</span>
                        <span className="text-xs text-slate-600">{loan.tanggal_pinjam || '—'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-xs font-semibold text-slate-400">Tgl Kembali</span>
                        <span className="text-xs text-slate-600">{loan.tanggal_kembali || '—'}</span>
                      </div>
                      {/* Tampilkan catatan admin jika ada */}
                      {loan.catatan_admin && (
                        <div className="flex flex-col gap-1 pt-1 border-t border-slate-200">
                          <span className="text-[9px] font-bold text-slate-400 uppercase">Catatan Admin</span>
                          <span className="text-xs text-slate-600 italic">{loan.catatan_admin}</span>
                        </div>
                      )}
                    </div>

                    {/* Badge Status */}
                    <div className="mb-2">
                      <span className={`text-[10px] font-black px-2.5 py-1 rounded-md uppercase tracking-wider inline-block ${statusBadge(status)}`}>
                        {statusLabel(status)}
                      </span>
                    </div>

                    {/* Footer divider */}
                    <div className="border-t border-slate-100 pt-3 mt-auto flex items-center justify-between text-xs text-slate-400">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <User size={12} className="shrink-0" />
                        <span className="truncate font-semibold">{loan.nama_peminjam}</span>
                      </div>
                      {status === 'pending' && (
                        <button
                          onClick={() => handleCancel(loan.id)}
                          className="flex items-center gap-1 text-[10px] font-black text-rose-500 bg-rose-50 hover:bg-rose-100 px-2 py-1 rounded-lg transition-all shrink-0 ml-2"
                          title="Batalkan Pengajuan"
                        >
                          <Trash2 size={10} />
                          BATALKAN
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination Footer */}
          <Pagination
            total={filteredLoans.length}
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