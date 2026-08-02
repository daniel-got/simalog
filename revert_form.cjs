const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, 'src', 'pages', 'HartaBenda', 'LaporRusakGuest.jsx');
let content = fs.readFileSync(targetPath, 'utf8');

const regex = /\{\/\* Form Tambah Laporan \(Inline Card\) \*\/\}\s*\{open && \([\s\S]*?<\/Card>\s*\)\}/;

const newForm = `{/* Form Tambah Laporan (Inline Card) */}
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

            <div className="flex flex-col gap-5 w-full">
              <label className="text-xs font-semibold text-slate-500 tracking-wide uppercase">
                Deskripsi Kerusakan / Kendala
              </label>
              <textarea
                required
                value={form.deskripsi}
                onChange={e => setForm({ ...form, deskripsi: e.target.value })}
                className="w-full px-13 py-13 rounded-2xl border border-slate-200 bg-slate-50 text-sm focus:bg-white focus:border-teal-500 focus:ring-2 focus:ring-teal-100 outline-none transition-all resize-none h-28"
                placeholder="Deskripsikan dengan detail kendala atau kerusakan yang dialami..."
              />
            </div>

            <div className="flex justify-end gap-8 pt-5">
              <Button type="button" variant="ghost" size="sm" onClick={() => { setForm(makeEmptyForm(currentUser)); setOpen(false); }}>
                Batal
              </Button>
              <Button type="submit" disabled={loading} size="sm" className="bg-teal-600 hover:bg-teal-700 text-white">
                {loading ? <><Loader2 size={13} className="animate-spin mr-1" /> Mengirim...</> : 'Simpan'}
              </Button>
            </div>
          </form>
        </Card>
      )}`;

content = content.replace(regex, newForm);

fs.writeFileSync(targetPath, content, 'utf8');
console.log('Reverted form style');
