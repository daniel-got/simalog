export const formatNamaAset = (aset) => {
  if (!aset) return "";
  let name = aset.nama_aset || "";
  if (aset.merek_tipe) {
    name += ` - ${aset.merek_tipe}`;
  }
  if (aset.nup) {
    name += ` (NUP: ${aset.nup})`;
  }
  return name;
};
