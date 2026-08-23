import React, { useState, useEffect } from 'react';
import { WifiOff, AlertTriangle, RefreshCw } from 'lucide-react';

export function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div
      role="alert"
      id="pwa-offline-indicator"
      className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-50 bg-[#131a26]/95 backdrop-blur-md border border-amber-500/50 rounded-2xl p-3.5 shadow-2xl shadow-black/80 flex items-start gap-3 animate-in fade-in slide-in-from-bottom-3 duration-300"
    >
      <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 shrink-0 mt-0.5 border border-amber-500/30">
        <WifiOff className="w-5 h-5" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-chakra font-black tracking-widest text-amber-400 uppercase">
            MOD OFFLINE
          </span>
        </div>
        <h4 className="text-xs font-chakra font-black text-white uppercase tracking-wide mt-0.5">
          Anda Sedang Offline
        </h4>
        <p className="text-[11px] text-slate-300 font-sans mt-0.5 leading-snug">
          Semua data pemasa &amp; operasi kekal berfungsi secara lokal. Sambungan internet akan dipulihkan secara automatik.
        </p>
      </div>

      <button
        type="button"
        onClick={() => window.location.reload()}
        className="px-2.5 py-1.5 rounded-lg bg-[#1a2536] hover:bg-[#223045] text-amber-400 hover:text-amber-300 text-[10px] font-chakra font-black uppercase tracking-wider border border-slate-700 transition-colors shrink-0 flex items-center gap-1 cursor-pointer self-center"
        title="Semak Semula Talian"
      >
        <RefreshCw className="w-3 h-3" />
        <span>SEMAK</span>
      </button>
    </div>
  );
}
