import React, { useState } from 'react';
import { 
  Cloud, 
  CloudOff, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle, 
  X, 
  ExternalLink,
  ShieldAlert,
  Smartphone,
  Server
} from 'lucide-react';
import { CloudSyncStatus, testFirestoreConnection } from '../services/firebaseSync';

interface CloudSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  syncStatus: CloudSyncStatus;
  errorMessage?: string;
  projectId: string;
  onRefreshSync: () => void;
}

export const CloudSyncModal: React.FC<CloudSyncModalProps> = ({
  isOpen,
  onClose,
  syncStatus,
  errorMessage,
  projectId,
  onRefreshSync,
}) => {
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await testFirestoreConnection();
      setTestResult(res);
      if (res.ok) {
        onRefreshSync();
      }
    } finally {
      setIsTesting(false);
    }
  };

  const isConnected = syncStatus === 'CONNECTED';
  const isConnecting = syncStatus === 'CONNECTING';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        role="dialog"
        aria-labelledby="modal-sync-title"
        className="w-full max-w-lg bg-[#0e1520] border border-slate-700/80 rounded-2xl shadow-2xl shadow-black/80 overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-800 bg-[#131b28]">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl border ${
              isConnected 
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
            }`}>
              {isConnected ? <Cloud className="w-5 h-5" /> : <CloudOff className="w-5 h-5" />}
            </div>
            <div>
              <h2 id="modal-sync-title" className="text-sm sm:text-base font-chakra font-black text-white uppercase tracking-wider">
                Status Penyelarasan Cloud
              </h2>
              <p className="text-[10px] sm:text-[11px] font-mono text-slate-400">
                Penyegerakan masa nyata antara berbilang peranti (Multi-Device Sync)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 font-sans text-xs sm:text-sm text-slate-300">
          {/* Status Banner */}
          <div className={`p-3.5 rounded-xl border flex items-start gap-3 ${
            isConnected
              ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
              : isConnecting
              ? 'bg-blue-950/40 border-blue-500/40 text-blue-200'
              : 'bg-amber-950/40 border-amber-500/40 text-amber-200'
          }`}>
            {isConnected ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            )}
            <div className="min-w-0 flex-1">
              <div className="font-chakra font-bold text-xs uppercase tracking-wider">
                {isConnected
                  ? 'Cloud Sync Aktif & Diselaraskan'
                  : isConnecting
                  ? 'Sedang Menyambung ke Cloud...'
                  : 'Pangkalan Data Cloud Belum Tersambung'}
              </div>
              <p className="text-[11px] mt-0.5 opacity-90 leading-relaxed">
                {isConnected
                  ? 'Semua sesi, pemasa berdetik, barisan giliran dan rekod diselaraskan secara langsung di semua peranti.'
                  : errorMessage ||
                    'Sesi pada masa ini hanya disimpan di memori peranti ini (Local Storage) dan belum dapat disegerakkan ke peranti lain.'}
              </p>
            </div>
          </div>

          {/* Technical Environment Specs */}
          <div className="bg-[#131b28] rounded-xl p-3.5 border border-slate-800 space-y-2">
            <div className="text-[10px] font-chakra font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
              <Server className="w-3.5 h-3.5 text-amber-400" />
              <span>Konfigurasi Firebase Firestore</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
              <div className="bg-[#0b1018] p-2 rounded-lg border border-slate-800/80">
                <span className="text-slate-500 block text-[9px] uppercase">Project ID:</span>
                <span className="text-amber-400 font-bold break-all">{projectId}</span>
              </div>
              <div className="bg-[#0b1018] p-2 rounded-lg border border-slate-800/80">
                <span className="text-slate-500 block text-[9px] uppercase">Database ID:</span>
                <span className="text-slate-200 font-bold">(default)</span>
              </div>
            </div>
          </div>

          {/* Explanation & Steps if Error */}
          {!isConnected && (
            <div className="bg-[#151c27] rounded-xl p-3.5 border border-slate-700/60 space-y-2.5">
              <div className="flex items-center gap-2 text-amber-400 font-chakra font-bold text-xs uppercase tracking-wider">
                <ShieldAlert className="w-4 h-4" />
                <span>Punca Masalah &amp; Cara Mengaktifkan:</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Platform ini telah dipasang sistem penyegerakan awan real-time sepenuhnya. Namun, pangkalan data{' '}
                <strong className="text-white">Cloud Firestore</strong> belum dicipta di akaun Firebase bagi projek{' '}
                <span className="text-amber-400 font-mono font-bold">'{projectId}'</span>.
              </p>
              
              <div className="text-[11px] space-y-1.5 pt-1 text-slate-200">
                <div className="flex items-start gap-2">
                  <span className="w-4 h-4 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-mono font-bold text-[10px] shrink-0 mt-0.5">
                    1
                  </span>
                  <span>
                    Buka{' '}
                    <a
                      href={`https://console.firebase.google.com/project/${projectId}/firestore`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-amber-400 underline font-semibold hover:text-amber-300 inline-flex items-center gap-0.5"
                    >
                      Firebase Console Firestore
                      <ExternalLink className="w-3 h-3 inline" />
                    </a>
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-4 h-4 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-mono font-bold text-[10px] shrink-0 mt-0.5">
                    2
                  </span>
                  <span>
                    Klik butang <strong>"Create database"</strong>, pilih ID <strong>(default)</strong> dan lokasi pelayan (cth: <em>asia-southeast1</em>).
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-4 h-4 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-mono font-bold text-[10px] shrink-0 mt-0.5">
                    3
                  </span>
                  <span>
                    Pilih mod keselamatan <strong>"Start in test mode"</strong> (atau rules benarkan baca &amp; tulis).
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-4 h-4 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-mono font-bold text-[10px] shrink-0 mt-0.5">
                    4
                  </span>
                  <span>
                    Kembali ke sini dan klik butang <strong>"Uji Semula Sambungan"</strong> di bawah!
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Test Result Message */}
          {testResult && (
            <div className={`p-3 rounded-xl border text-[11px] ${
              testResult.ok 
                ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300' 
                : 'bg-rose-950/60 border-rose-500/50 text-rose-300'
            }`}>
              <div className="font-bold mb-0.5">{testResult.ok ? '✓ Ujian Berjaya:' : '✗ Ujian Gagal:'}</div>
              <p className="leading-snug">{testResult.message}</p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-3.5 sm:p-4 border-t border-slate-800 bg-[#101723] flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-chakra font-bold text-xs uppercase tracking-wider cursor-pointer"
          >
            Tutup
          </button>

          <button
            type="button"
            onClick={handleTestConnection}
            disabled={isTesting}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-chakra font-black text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-md shadow-amber-500/20 disabled:opacity-50 cursor-pointer active:scale-95 transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
            <span>{isTesting ? 'Menguji...' : 'Uji Semula Sambungan'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
