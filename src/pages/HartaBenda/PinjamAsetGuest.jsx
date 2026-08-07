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
  Clock, ClipboardList, X, Loader2, Pencil
} from 'lucide-react';
import { useToast } from '../../components/ui/Toast';

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
  const toast = useToast();

  const [open, setOpen]     = useState(false);
  const [form, setForm]     = useState(() => makeEmptyForm(currentUser?.nama));
  const [loading, setLoading] = useState(false);

  // Data pengajuan dari tabel peminjaman_aset
  const [daftarPinjam, setDaftarPinjam] = useState([]);
  const [loadingList, setLoadingList]   = useState(true);

  // Form & Cancel States
  const [editId, setEditId] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

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
      toast.warning('Pilih aset terlebih dahulu!');
      return;
    }
    if (!form.tanggal_rencana_kembali) {
      toast.warning('Tanggal rencana kembali wajib diisi!');
      return;
    }
    if (form.tanggal_rencana_kembali < form.tanggal) {
      toast.warning('Tanggal kembali tidak boleh kurang dari tanggal pinjam!');
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

    let error;
    if (editId) {
      const { error: err } = await supabase.from('peminjaman_aset').update(payload).eq('id', editId);
      error = err;
    } else {
      const { error: err } = await supabase.from('peminjaman_aset').insert([payload]);
      error = err;
    }
    setLoading(false);

    if (error) {
      toast.error('Gagal mengirim pengajuan: ' + error.message);
      return;
    }

    toast.success(editId ? 'Pengajuan peminjaman berhasil diperbarui!' : 'Pengajuan peminjaman berhasil dikirim!');

    setForm(makeEmptyForm(currentUser?.nama));
    setEditId(null);
    setOpen(false);
    // Re-fetch untuk tampilkan data baru (Realtime akan trigger juga)
    fetchDaftarPinjam();
  };

  const handleEdit = (loan) => {
    setEditId(loan.id);
    setForm({
      id_aset: loan.id_aset,
      nama_staf: loan.nama_peminjam,
      tanggal: loan.tanggal_pinjam,
      tanggal_rencana_kembali: loan.tanggal_kembali,
      keperluan: loan.keperluan
    });
    setOpen(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ── Batalkan pengajuan (hanya saat status pending) ───────────────────────
  const handleConfirmCancel = async () => {
    if (!itemToDelete) return;
    const { error } = await supabase.from('peminjaman_aset').delete().eq('id', itemToDelete.id);
    if (error) {
      toast.error('Gagal membatalkan: ' + error.message);
      return;
    }
    toast.success('Pengajuan berhasil dibatalkan!');
    setDaftarPinjam(prev => prev.filter(p => p.id !== itemToDelete.id));
    setIsDeleteModalOpen(false);
    setItemToDelete(null);
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
        <div>
          <h1 className="text-xl font-black text-slate-800 tracking-tight">Peminjaman Aset</h1>
          <p className="text-xs text-slate-400 mt-1">{filteredLoans.length} pengajuan peminjaman</p>
        </div>
        <Button
          size="sm"
          onClick={() => {
            setEditId(null);
            setForm(makeEmptyForm(currentUser?.nama));
            setOpen(true);
          }}
        >
          <Plus size={15} /> Kirim Pengajuan
        </Button>
      </div>

      {/* Form Tambah Pengajuan */}
      {open && (
        <Card className="border-teal-200 bg-teal-50/40 p-21">
          <p className="text-base font-bold text-slate-700 mb-13">
            {editId ? '✏️ Edit Pengajuan Peminjaman' : '📋 Pengajuan Pinjam Aset Baru'}
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
              <Button type="button" variant="ghost" size="sm" onClick={() => { setForm(makeEmptyForm(currentUser?.nama)); setEditId(null); setOpen(false); }}>
                Batal
              </Button>
              <Button
                type="submit"
                disabled={loading || asetOptions.length === 0}
                size="sm"
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-13 lg:gap-21 w-full items-start">
            {pagedLoans.map(loan => {
              const asetDetail = loan.aset || getAssetDetails(loan.id_aset);
              const status     = loan.status || 'pending';

              return (
                <div
                  key={loan.id}
                  className="bg-white p-13 lg:p-0 rounded-2xl border border-slate-100 shadow-sm flex flex-row lg:flex-col gap-13 lg:gap-0 items-center lg:items-stretch overflow-hidden group hover:shadow-md transition-shadow"
                >
                  {/* Container Gambar */}
                  <div className="w-89 h-89 lg:w-full lg:h-48 bg-slate-50 rounded-xl lg:rounded-none lg:border-0 lg:border-b border border-slate-100 flex items-center justify-center overflow-hidden flex-shrink-0 relative">
                    {asetDetail?.foto_url || asetDetail?.image_url ? (
                      <img
                        src={asetDetail.foto_url || asetDetail.image_url}
                        alt={asetDetail.nama_aset}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <Building2 size={21} className="text-slate-300" />
                    )}
                  </div>

                  {/* Body */}
                  <div className="flex-1 min-w-0 flex flex-col py-2 lg:p-13">
                    <div className="flex flex-col">
                      {/* Header Mobile: Kategori & Status */}
                      <div className="flex justify-between items-start gap-5 lg:hidden mb-2">
                        <span className="text-[9px] font-mono bg-slate-50 text-slate-500 px-5 py-2 rounded-md font-bold uppercase tracking-wider truncate">
                          {asetDetail?.kategori_aset || 'Umum'}
                        </span>
                        <span className={`text-[9px] font-black px-2 py-1 rounded-md uppercase tracking-wider shrink-0 ${statusBadge(status)}`}>
                          {statusLabel(status)}
                        </span>
                      </div>

                      {/* Name */}
                      <h3 className="text-sm font-bold text-slate-800 leading-tight truncate mb-2">
                        {asetDetail?.nama_aset || 'Aset Tidak Dikenal'}
                      </h3>

                      {/* Keperluan & Kode Aset */}
                      <p className="text-[10px] font-medium text-slate-500 truncate mt-2 lg:mt-0">
                        <span className="font-semibold text-slate-400">Keperluan:</span> <span className="text-slate-600 ml-1">{loan.keperluan || '—'}</span>
                      </p>

                      <h4 className="hidden lg:block text-[10px] font-mono text-slate-400 truncate mt-2">
                        {asetDetail?.kode_aset || asetDetail?.id || loan.id_aset}
                      </h4>
                    </div>

                    {/* Footer Detail */}
                    <div className="flex justify-between items-end lg:items-end mt-4 pt-4 border-t border-slate-50">
                      <div className="flex flex-col">
                        <span className="hidden lg:block text-[10px] font-semibold text-slate-500 mb-3">
                          Status: <span className={`font-bold px-1.5 py-0.5 rounded text-[9px] uppercase tracking-wider ${statusBadge(status)}`}>{statusLabel(status)}</span>
                        </span>
                        <span className="text-[9px] font-bold text-teal-700 leading-none">
                          {loan.tanggal_pinjam || '—'}
                        </span>
                        <span className="text-[9px] text-slate-400 font-medium mt-1">
                          s.d {loan.tanggal_kembali || '—'}
                        </span>
                      </div>

                      <div className="flex flex-col items-end gap-1">
                        <span className="text-[10px] font-semibold text-slate-600 max-w-[100px] truncate">{loan.nama_peminjam}</span>
                        {loan.catatan_admin ? (
                          <span className="text-[9px] font-medium text-slate-400 max-w-[100px] truncate italic" title={loan.catatan_admin}>
                            Admin: {loan.catatan_admin}
                          </span>
                        ) : status === 'pending' ? (
                          <div className="flex gap-2 mt-1">
                            <button
                              onClick={() => handleEdit(loan)}
                              className="p-1.5 text-teal-600 bg-teal-50 hover:bg-teal-100 rounded-lg transition-colors"
                              title="Edit Pengajuan"
                            >
                              <Pencil size={14} />
                            </button>
                            <button
                              onClick={() => { setItemToDelete(loan); setIsDeleteModalOpen(true); }}
                              className="p-1.5 text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors"
                              title="Batalkan Pengajuan"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        ) : null}
                      </div>
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

      {/* ── CUSTOM MODAL KONFIRMASI BATAL ── */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
            onClick={() => {
              setIsDeleteModalOpen(false);
              setItemToDelete(null);
            }}
          />
          <div className="relative bg-white rounded-3xl shadow-xl border border-slate-100 w-full max-w-md p-21 flex flex-col gap-13 z-10 animate-in fade-in zoom-in-95 duration-150 text-center items-center">
            <div className="mt-8">
              <h3 className="text-lg font-black text-slate-800 tracking-tight mb-8">Batalkan Pengajuan</h3>
              <p className="text-xs text-slate-500 leading-relaxed max-w-sm">
                Yakin ingin membatalkan pengajuan pinjam <span className="font-bold text-slate-700">"{itemToDelete?.aset?.nama_aset || 'Aset'}"</span>? Tindakan ini tidak dapat diurungkan.
              </p>
            </div>
            <div className="flex items-center justify-center gap-8 mt-13 w-full">
              <button
                type="button"
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setItemToDelete(null);
                }}
                className="px-18 py-8 rounded-xl border border-slate-200 text-xs font-bold text-slate-500 hover:bg-slate-50 active:scale-95 transition-all select-none"
              >
                Kembali
              </button>
              <button
                type="button"
                onClick={handleConfirmCancel}
                className="px-18 py-8 rounded-xl bg-rose-600 hover:bg-rose-700 text-xs font-bold text-white shadow-sm active:scale-95 transition-all select-none"
              >
                Ya, Batalkan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}