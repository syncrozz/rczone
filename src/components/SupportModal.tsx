import React, { useState, useEffect } from 'react';
import {
  X,
  Download,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  ArrowLeft,
  Heart,
  QrCode,
  Smartphone,
} from 'lucide-react';

const LOCKED_QR_IMAGE_URL =
  'https://raw.githubusercontent.com/syncrozz/syncrozz-assets/main/Bank%20QR/QR%20RYT%20for%20Sumbangan.jpg';

interface SupportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SupportModal: React.FC<SupportModalProps> = ({ isOpen, onClose }) => {
  const [isAccordionOpen, setIsAccordionOpen] = useState<boolean>(false);
  const [isSaved, setIsSaved] = useState<boolean>(false);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setIsAccordionOpen(false);
      setIsSaved(false);
      setIsDownloading(false);
    }
  }, [isOpen]);

  // Handle ESC key to close modal
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Reliable Save QR Code function using direct raw image source
  const handleSaveQrCode = async () => {
    setIsDownloading(true);
    try {
      // Attempt blob fetch
      const response = await fetch(LOCKED_QR_IMAGE_URL, { mode: 'cors' });
      if (!response.ok) throw new Error('Fetch failed');
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = 'QR-DuitNow-Sumbangan-Syncrozz.jpg';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);

      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3500);
    } catch {
      // Reliable fallback: Direct download anchor targeting the exact locked URL
      const link = document.createElement('a');
      link.href = LOCKED_QR_IMAGE_URL;
      link.download = 'QR-DuitNow-Sumbangan-Syncrozz.jpg';
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3500);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200 select-none overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-[#101723] border border-slate-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl shadow-rose-950/20 flex flex-col relative my-auto max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button X */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
          title="Tutup (Esc)"
          aria-label="Tutup"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Scrollable Content Container */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4.5 text-center">
          {/* Header Section */}
          <div className="space-y-2 pt-1">
            {/* Badge: Sumbangan Sukarela */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/25 text-rose-300 text-[11px] font-mono font-bold uppercase tracking-wider">
              <Heart className="w-3 h-3 fill-rose-400 text-rose-400" />
              <span>Sumbangan Sukarela</span>
            </div>

            {/* Title: Sokong Inovasi Ini ❤️ */}
            <h2 className="text-xl sm:text-2xl font-chakra font-black text-white tracking-wide uppercase">
              Sokong Inovasi Ini <span className="text-rose-400">❤️</span>
            </h2>

            {/* Description */}
            <p className="text-xs text-slate-300 leading-relaxed font-sans max-w-sm mx-auto">
              Platform ini dibangunkan secara berterusan bagi memudahkan warga pendidik dan komuniti.
              Sokongan ikhlas anda membantu kesinambungan pelayanan dan pembangunan inovasi seterusnya.
            </p>
          </div>

          {/* Locked Real QR Image Display */}
          <div className="flex justify-center pt-1">
            <div className="bg-white p-3.5 sm:p-4 rounded-2xl shadow-xl border-2 border-slate-200/20 max-w-[240px] sm:max-w-[260px] w-full flex flex-col items-center justify-center">
              <img
                src={LOCKED_QR_IMAGE_URL}
                alt="QR RYT for Sumbangan Syncrozz"
                className="w-full h-auto object-contain rounded-lg aspect-square"
                crossOrigin="anonymous"
                loading="eager"
              />
            </div>
          </div>

          {/* Support Information Under QR */}
          <div className="space-y-1">
            <p className="text-xs font-mono font-bold text-slate-200 tracking-wide">
              DuitNow QR / Mana-mana Bank &amp; e-Wallet Malaysia
            </p>
            <p className="text-xs font-mono font-semibold text-amber-400">
              RM1 pun amat dihargai 👏
            </p>
          </div>

          {/* Save QR Code Button */}
          <div className="space-y-2 pt-1">
            <button
              type="button"
              id="btn-save-qr-code"
              onClick={handleSaveQrCode}
              disabled={isDownloading}
              className="w-full py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-chakra font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 active:scale-95 transition-all shadow cursor-pointer disabled:opacity-75"
            >
              <Download className="w-4 h-4" />
              <span>{isDownloading ? 'Menyimpan...' : 'Save QR Code'}</span>
            </button>

            {isSaved && (
              <div className="p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-400/50 text-emerald-200 text-xs font-mono flex items-center justify-center gap-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>QR Code berjaya disimpan!</span>
              </div>
            )}
          </div>

          {/* How To Pay Accordion */}
          <div className="rounded-2xl bg-[#0c121d] border border-slate-800 text-left overflow-hidden transition-all">
            <button
              type="button"
              id="btn-accordion-how-to-pay"
              onClick={() => setIsAccordionOpen(!isAccordionOpen)}
              className="w-full p-3.5 flex items-center justify-between text-xs font-chakra font-black uppercase text-slate-300 hover:text-white tracking-wide transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Cara Bayar Guna Galeri (How To Pay)</span>
              </div>
              {isAccordionOpen ? (
                <ChevronUp className="w-4 h-4 text-slate-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-400" />
              )}
            </button>

            {isAccordionOpen && (
              <div className="p-3.5 pt-0 border-t border-slate-800/80 text-xs font-sans text-slate-300 space-y-2 animate-in fade-in">
                <ol className="list-decimal list-inside space-y-1.5 leading-relaxed text-[11px] font-mono text-slate-300">
                  <li>
                    <strong className="text-white">Save QR Code</strong> ke device.
                  </li>
                  <li>Buka aplikasi banking / e-wallet.</li>
                  <li>Pilih fungsi QR payment atau scan from gallery.</li>
                  <li>Pilih QR yang telah disimpan.</li>
                  <li>Lengkapkan pembayaran mengikut langkah aplikasi bank / e-wallet.</li>
                </ol>
              </div>
            )}
          </div>

          {/* Return / Close Action: Kembali ke SYNCROZZ */}
          <div className="pt-1">
            <button
              type="button"
              id="btn-return-syncrozz"
              onClick={onClose}
              className="w-full py-2.5 px-4 rounded-xl bg-[#131d2e] hover:bg-[#18263c] border border-slate-700/80 hover:border-slate-600 text-slate-300 hover:text-white font-chakra font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 text-slate-400" />
              <span>Kembali ke SYNCROZZ</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
