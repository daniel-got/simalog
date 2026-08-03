const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, 'src', 'pages', 'HartaBenda', 'LaporRusakGuest.jsx');
let content = fs.readFileSync(targetPath, 'utf8');

// 1. Container Card
content = content.replace(
  /<Card className="border-teal-200 bg-teal-50\/40 p-21">/,
  '<Card className="bg-white border border-emerald-100 rounded-2xl p-6 shadow-sm mb-6">'
);

// 2. Judul Form
content = content.replace(
  /<p className="text-base font-bold text-slate-700 mb-13 flex items-center gap-2">\s*⚠️ Laporan Kerusakan Aset Baru\s*<\/p>/,
  `<p className="text-lg font-bold text-gray-800 flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            Laporan Kerusakan Aset Baru
          </p>`
);

// 3. Re-write the form fields using native HTML where appropriate to guarantee classes
// Because SearchableSelect might be hard to replicate natively if it has complex logic, I will pass className to it.
// But wait, the user's instructions for label and input can be applied to native inputs easily.
// I'll replace the `<Input>` and `<Select>` with native HTML.

const oldGrid = /<div className="grid grid-cols-1 md:grid-cols-3 gap-13">[\s\S]*?<SearchableSelect[\s\S]*?\/>[\s\S]*?<Input[\s\S]*?\/>[\s\S]*?<Select[\s\S]*?\/>\s*<\/div>/;

const newGrid = `<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex flex-col gap-1.5 w-full">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">
                  Pilih Aset Bermasalah
                </label>
                <SearchableSelect
                  required
                  options={asetOptions}
                  value={form.id_aset}
                  onChange={e => setForm({ ...form, id_aset: e.target.value })}
                  placeholder="Pilih aset..."
                  className="h-11 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 w-full transition-all"
                />
              </div>

              <div className="flex flex-col gap-1.5 w-full">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">
                  Nama Pelapor
                </label>
                <input
                  type="text"
                  required
                  value={form.nama_pelapor}
                  onChange={e => setForm({ ...form, nama_pelapor: e.target.value })}
                  placeholder="Nama Pelapor"
                  className="h-11 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 w-full transition-all outline-none"
                />
              </div>

              <div className="flex flex-col gap-1.5 w-full">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">
                  Tingkat Kerusakan
                </label>
                <select
                  required
                  value={form.tingkat}
                  onChange={e => setForm({ ...form, tingkat: e.target.value })}
                  className="h-11 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 w-full transition-all outline-none"
                >
                  <option value="" disabled>Pilih tingkat...</option>
                  {TINGKAT_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>`;

content = content.replace(oldGrid, newGrid);

// 4. Textarea
content = content.replace(
  /<label className="text-xs font-semibold text-slate-500 tracking-wide uppercase">\s*Deskripsi Kerusakan \/ Kendala\s*<\/label>/,
  '<label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Deskripsi Kerusakan / Kendala</label>'
);
content = content.replace(
  /className="w-full px-3 py-3 rounded-2xl border border-slate-200 bg-slate-50 text-sm focus:bg-white focus:border-teal-500 focus:ring-2 focus:ring-teal-100 outline-none transition-all resize-none h-28"/,
  'className="p-4 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 w-full transition-all min-h-[110px] outline-none resize-none"'
);

// 5. Action buttons
const oldButtons = /<div className="flex justify-end gap-8 pt-5">[\s\S]*?<Button type="button" variant="ghost" size="sm" onClick=\{\(\) => \{ setForm\(makeEmptyForm\(currentUser\)\); setOpen\(false\); \}\}>\s*Batal\s*<\/Button>[\s\S]*?<Button type="submit" disabled=\{loading\} size="sm" className="bg-teal-600 text-white">[\s\S]*?<\/Button>[\s\S]*?<\/div>/;

const newButtons = `<div className="flex justify-end gap-4 pt-5">
              <button
                type="button"
                onClick={() => { setForm(makeEmptyForm(currentUser)); setOpen(false); }}
                className="h-10 px-5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-xl transition-all flex items-center justify-center cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={loading}
                className="h-10 px-6 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-xl transition-all shadow-sm flex items-center justify-center disabled:opacity-50 cursor-pointer"
              >
                {loading ? <><Loader2 size={16} className="animate-spin mr-2" /> Mengirim...</> : 'Simpan'}
              </button>
            </div>`;

content = content.replace(oldButtons, newButtons);

// 6. Fix filter buttons colors from teal to emerald
content = content.replace(/focus:border-teal-500/g, 'focus:border-emerald-500');
content = content.replace(/focus:ring-teal-100/g, 'focus:ring-emerald-100');
content = content.replace(/bg-teal-600/g, 'bg-emerald-600');
content = content.replace(/hover:bg-teal-700/g, 'hover:bg-emerald-700');

fs.writeFileSync(targetPath, content, 'utf8');
console.log('UI Refactoring completed');
