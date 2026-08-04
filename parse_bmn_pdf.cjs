/**
 * ============================================================
 * SIMALOG – PDF BMN Parser v3 (FINAL)
 * ============================================================
 * Script ini mengekstrak data dari file "LIST BMN 26 NOV 2025.pdf"
 * dan menghasilkan file "data_aset.json" yang siap di-import ke database.
 *
 * Cara pakai:
 *   node parse_bmn_pdf.cjs
 *
 * Output:
 *   - data_aset.json       → Array of objects siap insert ke tabel `assets`
 *   - data_aset_raw.json   → Raw text per halaman (untuk debugging)
 * ============================================================
 */

const fs = require('fs');
const path = require('path');
const { PDFParse } = require('pdf-parse');

// ── Config ──────────────────────────────────────────────────────────────
const PDF_PATH = path.join(__dirname, 'LIST BMN 26 NOV 2025.pdf');
const OUTPUT_PATH = path.join(__dirname, 'data_aset.json');
const RAW_OUTPUT_PATH = path.join(__dirname, 'data_aset_raw.json');

// ── Helper: Parse Indonesian number format ──────────────────────────────
function parseNumber(str) {
    if (!str || str === '-' || str === '' || str === '0') return 0;
    const cleaned = str.replace(/\./g, '').replace(/,/g, '.').trim();
    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : num;
}

// ── Helper: Parse date from DD-MM-YYYY to YYYY-MM-DD ────────────────────
function parseDate(str) {
    if (!str || str === '-') return null;
    const match = str.match(/(\d{2})-(\d{2})-(\d{4})/);
    if (match) return `${match[3]}-${match[2]}-${match[1]}`;
    return null;
}

// ── Helper: Map kondisi to valid status ─────────────────────────────────
function normalizeKondisi(text) {
    if (!text) return 'Baik';
    const t = text.trim();
    if (/rusak berat/i.test(t)) return 'Rusak Berat';
    if (/rusak ringan/i.test(t)) return 'Rusak Ringan';
    if (/kurang baik/i.test(t)) return 'Rusak Ringan';
    if (/baik/i.test(t)) return 'Baik';
    return 'Baik';
}

// ── Helper: Map status operasional ──────────────────────────────────────
function normalizeStatus(text) {
    if (!text) return 'Aktif';
    const t = text.trim().toUpperCase();
    if (t.includes('USUL HAPUS')) return 'Usul Hapus';
    if (t.includes('TIDAK AKTIF') || t.includes('DIHAPUS')) return 'Dihapuskan';
    return 'Aktif';
}

// ── Helper: Guess kelompok from kode_bmn ────────────────────────────────
function guessKelompokFromKode(kodeBmn, namaAset) {
    if (!kodeBmn) return 'Sarana Pendukung';
    const nama = (namaAset || '').toLowerCase();

    // Tanah & Gedung
    if (kodeBmn.startsWith('1.') || kodeBmn.startsWith('2.')) return 'Gedung & Bangunan';
    if (kodeBmn.startsWith('4.') || kodeBmn.startsWith('5.')) return 'Gedung & Bangunan';

    // Kendaraan
    if (kodeBmn.startsWith('3.02')) return 'Kendaraan';

    // Mesin & Peralatan
    if (kodeBmn.startsWith('3.01') || kodeBmn.startsWith('3.03') || kodeBmn.startsWith('3.04')) {
        return 'Mesin & Peralatan';
    }

    // Furnitur
    if (kodeBmn.startsWith('3.05.02.01') || kodeBmn.startsWith('3.05.02.02') ||
        kodeBmn.startsWith('3.05.02.03')) {
        // Meja, Kursi, Lemari etc
        if (nama.includes('meja') || nama.includes('kursi') || nama.includes('lemari') ||
            nama.includes('rak') || nama.includes('sofa') || nama.includes('filling') ||
            nama.includes('filing') || nama.includes('kabinet') || nama.includes('brand kas') ||
            nama.includes('brankas')) {
            return 'Furnitur & Inventaris';
        }
    }

    // Elektronik & IT  
    if (kodeBmn.startsWith('3.05') || kodeBmn.startsWith('3.06') || kodeBmn.startsWith('3.10')) {
        if (nama.includes('meja') || nama.includes('kursi') || nama.includes('lemari') ||
            nama.includes('rak') || nama.includes('sofa') || nama.includes('filling') ||
            nama.includes('filing') || nama.includes('kabinet') || nama.includes('brand kas') ||
            nama.includes('brankas') || nama.includes('papan')) {
            return 'Furnitur & Inventaris';
        }
        return 'Elektronik & IT';
    }

    // Aset lainnya
    if (kodeBmn.startsWith('6.')) return 'Sarana Pendukung';

    return 'Sarana Pendukung';
}

// ── Main Parser ─────────────────────────────────────────────────────────
async function parseBMNPdf() {
    console.log('📄 Membaca PDF:', PDF_PATH);

    if (!fs.existsSync(PDF_PATH)) {
        console.error('❌ File PDF tidak ditemukan:', PDF_PATH);
        process.exit(1);
    }

    const dataBuffer = fs.readFileSync(PDF_PATH);
    const pdfParser = new PDFParse({ data: new Uint8Array(dataBuffer) });
    await pdfParser.load();

    const info = await pdfParser.getInfo();
    console.log(`📑 Total halaman: ${info.total}`);

    // ── Get ALL text from all pages at once ──────────────────────────────
    const result = await pdfParser.getText();

    // Save raw text for debugging
    const rawPages = result.pages.map((pg, i) => ({ page: i + 1, text: pg.text }));
    fs.writeFileSync(RAW_OUTPUT_PATH, JSON.stringify(rawPages, null, 2));
    console.log('📋 Raw text disimpan ke:', RAW_OUTPUT_PATH);

    // ── Combine all pages text ──────────────────────────────────────────
    const allLines = [];
    for (const pg of result.pages) {
        const lines = pg.text.split('\n');
        for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.length > 0) allLines.push(trimmed);
        }
    }

    console.log(`📊 Total baris teks: ${allLines.length}`);

    // ── Filter out header/footer lines ───────────────────────────────────
    const skipPatterns = [
        /^LISTING DATA/i,
        /^GABUNGAN/i,
        /^Halaman$/i,
        /^Tanggal$/i,
        /^kode$/i,
        /^:$/,
        /^\d{1,2}$/,
        /^26-11-2025$/,
        /^LDBMNSI$/i,
        /^NAMA UAKPB/i,
        /^DIREKTORAT/i,
        /^BA\(\d+\)/i,
        /^KEMENTERIAN/i,
        /^S\/D\s/i,
        /^RUANG LINGKUP/i,
        /^SEMUA KONDISI/i,
        /^SUBSUB/i,
        /^KODE\s+URAIAN/i,
        /^NUP$/i,
        /^NILAI BUKU$/i,
        /^SAT\s+NILAI/i,
        /^PENYUSUTAN$/i,
        /^AKUMULASI$/i,
        /^KONDISI$/i,
        /^JENIS ASET$/i,
        /^MERK TYPE$/i,
        /^TGL$/i,
        /^PEROLEHAN$/i,
        /^STATUS$/i,
        /^ASET$/i,
        /^1\s+2$/,
        /^3$/,
        /^4\s+5/,
        /^NILAI LEBIH/i,
        /^Printed/i,
        /^Page /i,
        /^143\.06/,
    ];

    const dataLines = allLines.filter(line => !skipPatterns.some(p => p.test(line)));

    // ── Parse data lines ────────────────────────────────────────────────
    const assets = [];
    const warnings = [];

    // Regex for a line starting with BMN kode barang
    const kodeBmnLineRegex = /^(\d\.\d{2}\.\d{2}\.\d{2}\.\d{3})\s+(.+)/;

    // Satuan options (including 'dummy' which appears in some BMN records)
    const SATUAN_PATTERN = '(?:M2|Unit|Buah|Set|Paket|Lembar|Rim|Batang|Liter|Kg|Box|Dos|Lusin|Meter|Pasang|Eksemplar|Keping|dummy)';

    // Full data pattern (all fields in one or joined lines):
    // Uraian NUP SAT NILAI_ASET AKUMULASI NILAI_BUKU KONDISI TGL MERK JENIS STATUS
    const fullPattern = new RegExp(
        `^(.+?)\\s+(\\d+)\\s+(${SATUAN_PATTERN})\\s+` +         // Uraian NUP SAT
        `([\\d.,]+)\\s+([\\d.,]+)\\s+([\\d.,]+)\\s+` +          // NILAI_ASET AKUMULASI NILAI_BUKU
        `(Baik|Rusak Berat|Rusak Ringan|Kurang Baik)\\s+` +     // KONDISI
        `(\\d{2}-\\d{2}-\\d{4})\\s+` +                          // TGL_PEROLEHAN
        `(.+?)\\s+` +                                            // MERK_TYPE
        `(Intrakomptabel|Ekstrakomptabel)\\s+` +                 // JENIS
        `(AKTIF|USUL HAPUS|TIDAK AKTIF)$`,                       // STATUS
        'i'
    );

    // Pattern for items WITHOUT merk/type (date directly followed by jenis)
    const noMerkPattern = new RegExp(
        `^(.+?)\\s+(\\d+)\\s+(${SATUAN_PATTERN})\\s+` +         // Uraian NUP SAT
        `([\\d.,]+)\\s+([\\d.,]+)\\s+([\\d.,]+)\\s+` +          // NILAI_ASET AKUMULASI NILAI_BUKU
        `(Baik|Rusak Berat|Rusak Ringan|Kurang Baik)\\s+` +     // KONDISI
        `(\\d{2}-\\d{2}-\\d{4})\\s+` +                          // TGL_PEROLEHAN
        `(Intrakomptabel|Ekstrakomptabel)\\s+` +                 // JENIS
        `(AKTIF|USUL HAPUS|TIDAK AKTIF)$`,                       // STATUS
        'i'
    );

    let i = 0;
    while (i < dataLines.length) {
        const line = dataLines[i];
        const kodeMatch = line.match(kodeBmnLineRegex);

        if (!kodeMatch) {
            i++;
            continue;
        }

        const kodeBmn = kodeMatch[1];
        const remainder = kodeMatch[2].trim();

        // Try matching the full pattern with current line
        let matched = false;
        let combinedRemainder = remainder;
        let extraLinesUsed = 0;

        // Try with 0, 1, 2, or 3 continuation lines
        for (let j = 0; j <= 3; j++) {
            if (j > 0) {
                const nextIdx = i + j;
                if (nextIdx >= dataLines.length) break;
                const nextLine = dataLines[nextIdx];
                // Stop if next line starts a new BMN kode
                if (kodeBmnLineRegex.test(nextLine)) break;
                combinedRemainder += ' ' + nextLine;
            }

            const fullMatch = combinedRemainder.match(fullPattern);
            if (fullMatch) {
                const uraian = fullMatch[1].trim();
                const nup = parseInt(fullMatch[2]);
                const satuan = fullMatch[3];
                const nilaiAset = parseNumber(fullMatch[4]);
                const akumulasiPenyusutan = parseNumber(fullMatch[5]);
                const nilaiBuku = parseNumber(fullMatch[6]);
                const kondisi = normalizeKondisi(fullMatch[7]);
                const tglPerolehan = parseDate(fullMatch[8]);
                const merkType = fullMatch[9].trim();
                const jenisAset = fullMatch[10];
                const statusAset = normalizeStatus(fullMatch[11]);

                assets.push({
                    kode_bmn: kodeBmn,
                    nama_aset: uraian,
                    nup: nup,
                    satuan: satuan,
                    harga_beli: nilaiAset,
                    akumulasi_penyusutan: akumulasiPenyusutan,
                    nilai_buku: nilaiBuku,
                    status_kondisi: kondisi,
                    tanggal_perolehan: tglPerolehan,
                    merek_tipe: merkType,
                    jenis_bmn: jenisAset,
                    status_operasional: statusAset,
                    lokasi_ruangan: '-',
                    kelompok_guess: guessKelompokFromKode(kodeBmn, uraian),
                });

                matched = true;
                extraLinesUsed = j;
                break;
            }

            // Fallback: try pattern without merk/type
            const noMerkMatch = combinedRemainder.match(noMerkPattern);
            if (noMerkMatch) {
                const uraian = noMerkMatch[1].trim();
                const nup = parseInt(noMerkMatch[2]);
                const satuan = noMerkMatch[3];
                const nilaiAset = parseNumber(noMerkMatch[4]);
                const akumulasiPenyusutan = parseNumber(noMerkMatch[5]);
                const nilaiBuku = parseNumber(noMerkMatch[6]);
                const kondisi = normalizeKondisi(noMerkMatch[7]);
                const tglPerolehan = parseDate(noMerkMatch[8]);
                const jenisAset = noMerkMatch[9];
                const statusAset = normalizeStatus(noMerkMatch[10]);

                assets.push({
                    kode_bmn: kodeBmn,
                    nama_aset: uraian,
                    nup: nup,
                    satuan: satuan,
                    harga_beli: nilaiAset,
                    akumulasi_penyusutan: akumulasiPenyusutan,
                    nilai_buku: nilaiBuku,
                    status_kondisi: kondisi,
                    tanggal_perolehan: tglPerolehan,
                    merek_tipe: '-',
                    jenis_bmn: jenisAset,
                    status_operasional: statusAset,
                    lokasi_ruangan: '-',
                    kelompok_guess: guessKelompokFromKode(kodeBmn, uraian),
                });

                matched = true;
                extraLinesUsed = j;
                break;
            }
        }

        if (!matched) {
            warnings.push(`Line ${i + 1}: ${line.substring(0, 120)}`);
        }

        i += 1 + extraLinesUsed;
    }

    // ── Post-processing ─────────────────────────────────────────────────
    // De-duplicate (same kode_bmn + nup should be unique)
    const seen = new Set();
    const uniqueAssets = assets.filter(a => {
        const key = `${a.kode_bmn}|${a.nup}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    }).map(a => {
        return {
            kode_aset: `${a.kode_bmn}-${a.nup}`,
            ...a,
            nomor_seri_plat: "",
            penanggung_jawab: null,
            masa_manfaat_bulan: null,
            foto_url: null,
            lampiran_url: null
        };
    });

    // ── Summary ─────────────────────────────────────────────────────────
    console.log(`\n✅ Total aset diekstrak (raw): ${assets.length}`);
    console.log(`✅ Total aset unik (setelah dedup): ${uniqueAssets.length}`);

    if (warnings.length > 0) {
        console.log(`\n⚠️  ${warnings.length} baris tidak bisa diparsing:`);
        warnings.slice(0, 10).forEach(w => console.log(`   ${w}`));
        if (warnings.length > 10) console.log(`   ... dan ${warnings.length - 10} lainnya`);
    }

    if (uniqueAssets.length > 0) {
        const byKelompok = {};
        const byJenis = {};
        const byKondisi = {};
        const byStatus = {};

        uniqueAssets.forEach(a => {
            byKelompok[a.kelompok_guess] = (byKelompok[a.kelompok_guess] || 0) + 1;
            byJenis[a.jenis_bmn] = (byJenis[a.jenis_bmn] || 0) + 1;
            byKondisi[a.status_kondisi] = (byKondisi[a.status_kondisi] || 0) + 1;
            byStatus[a.status_operasional] = (byStatus[a.status_operasional] || 0) + 1;
        });

        console.log('\n📊 Ringkasan per Kelompok:');
        Object.entries(byKelompok).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => {
            console.log(`   ${k}: ${v} item`);
        });

        console.log('\n📊 Ringkasan per Jenis BMN:');
        Object.entries(byJenis).forEach(([k, v]) => {
            console.log(`   ${k}: ${v} item`);
        });

        console.log('\n📊 Ringkasan per Kondisi:');
        Object.entries(byKondisi).forEach(([k, v]) => {
            console.log(`   ${k}: ${v} item`);
        });

        console.log('\n📊 Ringkasan per Status Operasional:');
        Object.entries(byStatus).forEach(([k, v]) => {
            console.log(`   ${k}: ${v} item`);
        });

        const totalNilai = uniqueAssets.reduce((sum, a) => sum + a.harga_beli, 0);
        console.log(`\n💰 Total Nilai Aset: Rp ${totalNilai.toLocaleString('id-ID')}`);

        console.log('\n📦 Contoh 10 item pertama:');
        uniqueAssets.slice(0, 10).forEach((a, idx) => {
            console.log(`   ${idx + 1}. [${a.kode_bmn}] NUP:${a.nup} | ${a.nama_aset} | ${a.merek_tipe} | Rp ${a.harga_beli.toLocaleString('id-ID')} | ${a.status_kondisi} | ${a.jenis_bmn}`);
        });
    }

    // Save output
    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(uniqueAssets, null, 2));
    console.log(`\n💾 Data disimpan ke: ${OUTPUT_PATH}`);
    console.log(`📊 Total: ${uniqueAssets.length} aset`);
    console.log('🎉 Selesai!\n');

    await pdfParser.destroy();
}

// ── Run ─────────────────────────────────────────────────────────────────
parseBMNPdf().catch(err => {
    console.error('❌ Error:', err.message);
    console.error(err.stack);
    process.exit(1);
});
