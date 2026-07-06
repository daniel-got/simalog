Antarmuka pada gambar yang kamu unggah terlihat sangat rapi dan fungsional. Mari kita bedah gaya desainnya dan bagaimana kamu bisa mewujudkannya.

### **1. Nama Gaya Desain (UI Style)**

Gaya antarmuka pada sistem inventaris tersebut menggabungkan beberapa tren desain modern:

- **Soft UI / Clean UI:** Penggunaan warna latar belakang putih dipadukan dengan warna pastel/lembut (seperti hijau muda, biru muda, dan krem) pada elemen kartu.
- **Card-based Design:** Informasi dikelompokkan ke dalam "kartu" (kotak dengan sudut melengkung/rounded corners) yang diberi bayangan sangat halus (_soft drop shadow_) untuk memberikan kesan kedalaman pemisah antar konten.
- **App-like Web Design (PWA Style):** Desain ini sangat menyerupai aplikasi _native_ di _smartphone_. Ciri khas utamanya adalah adanya **Bottom Navigation Bar** (menu navigasi di bagian bawah) dan _header_ yang menempel di atas (sticky).

---

### **2. Cara Membuat dengan React (Pendekatan Mobile-First) & Hosting di Vercel**

Pendekatan _mobile-first_ berarti kamu mendesain dan mengoding struktur untuk layar kecil (HP) terlebih dahulu, baru kemudian menyesuaikannya untuk layar yang lebih besar jika diperlukan.

Berikut adalah panduan teknis langkah demi langkah:

#### **Langkah 1: Pemilihan Teknologi (Tech Stack)**

Untuk mencapai hasil yang cepat, modern, dan gratis dihosting, gunakan kombinasi ini:

- **Framework:** React dengan **Vite** (sangat cepat) atau **Next.js** (sangat direkomendasikan karena dibuat oleh Vercel).
- **Styling:** **Tailwind CSS**. Ini adalah kunci untuk pendekatan _mobile-first_. Tailwind menggunakan _utility classes_ yang memudahkan pembuatan layout responsif.
- **Ikon:** **Lucide React** atau **Heroicons** (ikon minimalis yang cocok dengan desain tersebut).

Setelah itu, instal Tailwind CSS dengan mengikuti dokumentasi resmi mereka untuk Vite.

#### **Langkah 3: Menerapkan Pendekatan Mobile-First dengan Tailwind**

Dalam _mobile-first_, kamu menulis _style_ dasar untuk layar HP. Desain di gambar adalah aplikasi mobile, jadi kamu bisa membatasi lebar maksimal aplikasi agar tetap terlihat seperti HP meskipun dibuka di laptop.

Struktur utama (_Layout_):

```jsx
export default function AppLayout({ children }) {
  return (
    // max-w-md membatasi lebar seperti HP, mx-auto menempatkannya di tengah layar laptop
    <div className="max-w-md mx-auto bg-gray-50 min-h-screen flex flex-col relative pb-20">
      {/* HEADER */}
      <header className="bg-green-700 text-white p-4 rounded-b-3xl sticky top-0 z-10">
        <h1>SIMALOG - BPHL IV</h1>
        {/* Konten header lainnya */}
      </header>

      {/* MAIN CONTENT (bisa di-scroll) */}
      <main className="flex-1 p-4 space-y-6">{children}</main>

      {/* BOTTOM NAVIGATION */}
      <nav className="fixed bottom-0 w-full max-w-md bg-white border-t flex justify-around p-3 text-xs text-gray-500 z-10">
        <button className="flex flex-col items-center text-green-600">
          <HomeIcon /> Utama
        </button>
        <button className="flex flex-col items-center">
          <BoxIcon /> Barang
        </button>
        {/* Tombol navigasi lainnya */}
      </nav>
    </div>
  );
}
```

#### **Langkah 4: Membangun Komponen Visual (Cards & Bars)**

- **Kartu Metrik (Total Barang, dll):** Gunakan _grid_ dengan 2 kolom. Berikan warna latar pastel dan _rounded corners_ yang besar.
- _Class Tailwind contoh:_ `bg-green-50 rounded-2xl p-4 shadow-sm`.

- **Progress Bar (Stok Barang):** Kamu tidak butuh _library_ chart yang berat untuk ini. Cukup gunakan div HTML biasa yang tumpang tindih.
- _Class Tailwind contoh:_ `<div className="w-full bg-gray-200 rounded-full h-2"><div className="bg-green-500 h-2 rounded-full" style={{ width: '80%' }}></div></div>`.
