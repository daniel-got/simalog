const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, 'src', 'pages', 'HartaBenda', 'Perawatan.jsx');
let content = fs.readFileSync(targetPath, 'utf8');

// 1. Revert Table Headers back to simple strings so Table.jsx styles them correctly
content = content.replace(
  /headers=\{\[[\s\S]*?<span className="text-xs font-semibold tracking-wider text-gray-500 uppercase">Tanggal<\/span>,[\s\S]*?\]\}/,
  `headers={['Tanggal', 'Unit Aset & Lokasi', 'Jenis Perawatan', 'Total Biaya', 'Kondisi Aset', 'Keterangan', 'Aksi']}`
);

// 2. Adjust Table Row styling back to Logistik defaults
// Tanggal td
content = content.replace(
  /<td className="px-13 py-13 text-sm font-semibold text-gray-800 whitespace-nowrap">\{p\.tanggal\}<\/td>/,
  '<td className="px-13 py-13 text-xs text-slate-500 whitespace-nowrap">{p.tanggal}</td>'
);

// Nama Aset
content = content.replace(
  /<span className="text-sm font-semibold text-gray-800">\{getAsetName\(p\.id_aset\)\}<\/span>/g,
  '<span className="text-sm font-bold text-slate-800">{getAsetName(p.id_aset)}</span>'
);

// Sub-teks (Lokasi)
content = content.replace(
  /<span className="text-xs text-gray-500">/g,
  '<span className="text-[10px] font-medium text-slate-400">'
);

// Total Biaya
content = content.replace(
  /<td className="px-13 py-13 text-sm font-bold text-emerald-600">/g,
  '<td className="px-13 py-13 font-mono text-xs font-bold text-emerald-600">'
);

// Keterangan
content = content.replace(
  /<td className="px-13 py-13 text-sm text-gray-600 max-w-\[200px\] truncate">/g,
  '<td className="px-13 py-13 text-xs text-slate-500 max-w-[200px] truncate">'
);

// 3. Buttons formatting to EXACT match
content = content.replace(
  /<div className="flex items-center gap-2 justify-start">\s*<button\s*onClick=\{\(\) => handleEdit\(p\)\}\s*className="w-8 h-8 flex items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors"\s*title="Edit"\s*>\s*<Pencil className="w-4\.5 h-4\.5" \/>\s*<\/button>\s*<button\s*onClick=\{\(\) => handleDelete\(p\)\}\s*className="w-8 h-8 flex items-center justify-center rounded-lg bg-rose-50 text-rose-500 hover:bg-rose-100 transition-colors"\s*title="Hapus"\s*>\s*<Trash2 className="w-4\.5 h-4\.5" \/>\s*<\/button>\s*<\/div>/,
  `<div className="flex items-center gap-2 justify-center">
                      <button
                        onClick={() => handleEdit(p)}
                        className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 flex items-center justify-center transition-colors"
                        title="Edit"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(p)}
                        className="w-8 h-8 rounded-lg bg-rose-50 text-rose-500 hover:bg-rose-100 flex items-center justify-center transition-colors"
                        title="Hapus"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>`
);

// 4. Input text styling for filter (ensure text-slate-700 to match Select and Date)
content = content.replace(
  /className="w-full pl-11 pr-4 py-2\.5 h-11 text-sm font-medium bg-white border border-slate-200 rounded-xl focus:border-teal-500 focus:ring-2 focus:ring-teal-100 outline-none transition-all"/,
  'className="w-full pl-11 pr-4 py-2.5 h-11 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-xl focus:border-teal-500 focus:ring-2 focus:ring-teal-100 outline-none transition-all"'
);

fs.writeFileSync(targetPath, content, 'utf8');
console.log('Update Perawatan style matching Logistik completed');
