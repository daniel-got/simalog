import { useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { X } from 'lucide-react';

export default function BarcodeScanner({ onResult, onClose }) {
  const scannerRef = useRef(null);

  useEffect(() => {
    // Membuat instance scanner
    const scanner = new Html5QrcodeScanner(
      "reader",
      { 
        fps: 10, 
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
      },
      /* verbose= */ false
    );
    
    scannerRef.current = scanner;

    scanner.render((decodedText) => {
      // Jika berhasil scan, hentikan kamera dan kembalikan teks
      scanner.clear();
      onResult(decodedText);
    }, (error) => {
      // Abaikan error pembacaan frame berulang
    });

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(e => console.error(e));
      }
    };
  }, [onResult]);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-21">
      <div className="bg-white rounded-[34px] w-full max-w-sm p-21 shadow-2xl relative">
        <button 
          onClick={onClose} 
          className="absolute top-13 right-13 w-34 h-34 bg-slate-100 hover:bg-slate-200 rounded-full flex items-center justify-center text-slate-500 transition-colors z-10"
        >
          <X size={18} strokeWidth={3} />
        </button>
        
        <p className="text-center font-black text-slate-800 text-lg mb-13 mt-5">Scan Barcode / QR</p>
        
        {/* Kontainer untuk kamera html5-qrcode */}
        <div id="reader" className="w-full rounded-2xl overflow-hidden border-2 border-dashed border-teal-200 bg-slate-50"></div>
        
        <p className="text-center text-[10px] font-semibold text-slate-400 uppercase tracking-widest mt-13">
          Arahkan kamera ke kode
        </p>
      </div>
    </div>
  );
}
