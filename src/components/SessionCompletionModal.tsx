import React, { useEffect } from 'react';
import { 
  X, 
  CheckCircle2, 
  Clock, 
  RotateCcw, 
  DollarSign, 
  User, 
  AlertTriangle,
  Receipt,
  Zap,
} from 'lucide-react';
import { Session, AppSettings } from '../types';
import { formatClockTime } from '../utils/format';
import { playTapSound } from '../utils/sound';

interface SessionCompletionModalProps {
  isOpen: boolean;
  session: Session | null;
  onClose: () => void;
  settings: AppSettings;
  onCompleteAndRecord: (session: Session) => void;
  onExtend: (session: Session, minutes: number, price?: number) => void;
}

export const SessionCompletionModal: React.FC<SessionCompletionModalProps> = ({
  isOpen,
  session,
  onClose,
  settings,
  onCompleteAndRecord,
  onExtend,
}) => {
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

  if (!isOpen || !session) return null;

  const handleConfirm = () => {
    playTapSound(settings.soundEnabled);
    onCompleteAndRecord(session);
    onClose();
  };

  const handleQuickExtend = (mins: number, price: number) => {
    playTapSound(settings.soundEnabled);
    onExtend(session, mins, price);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="bg-[#101723] border border-slate-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-[#0c121c]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[9px] font-chakra font-black uppercase tracking-widest px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                SESI TAMAT
              </span>
              <h2 className="text-base sm:text-lg font-chakra font-black text-white tracking-wide uppercase mt-0.5">
                Pengesahan Selesai
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              playTapSound(settings.soundEnabled);
              onClose();
            }}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Details */}
        <div className="p-5 sm:p-6 space-y-4 font-mono">
          <div className="p-4 rounded-2xl bg-[#0c121c] border border-slate-800 space-y-3">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800/80 text-xs">
              <span className="text-slate-400 font-bold uppercase">Mesin</span>
              <span className="text-white font-black">{session.machineName}</span>
            </div>

            <div className="flex justify-between items-center pb-2 border-b border-slate-800/80 text-xs">
              <span className="text-slate-400 font-bold uppercase">Pelanggan</span>
              <span className="text-amber-400 font-bold">{session.customerName || 'Walk-in'}</span>
            </div>

            <div className="flex justify-between items-center pb-2 border-b border-slate-800/80 text-xs">
              <span className="text-slate-400 font-bold uppercase">Pakej & Tempoh</span>
              <span className="text-slate-200 font-bold">{session.packageName} ({session.totalDurationMinutes} Minit)</span>
            </div>

            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400 font-bold uppercase">Masa Sesi</span>
              <span className="text-slate-300 font-bold">{formatClockTime(session.startTime)} - {formatClockTime(session.endTime)}</span>
            </div>
          </div>

          {/* Revenue Amount */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/40 to-[#0c121c] border border-emerald-500/30 flex justify-between items-center">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">
                Jumlah Kutipan Sesi
              </span>
              <span className="text-2xl font-black text-emerald-400">
                {settings.currencySymbol} {session.price.toFixed(2)}
              </span>
            </div>
            <Receipt className="w-6 h-6 text-emerald-400/60" />
          </div>

          {/* Primary Action Button */}
          <button
            type="button"
            onClick={handleConfirm}
            className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-chakra font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/20 transition-all cursor-pointer active:scale-[0.98]"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>SAHKAN & SIMPAN TRANSAKSI</span>
          </button>

          {/* Or Quick Extend */}
          <div className="pt-2">
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block text-center mb-2">
              Atau Pelanggan Mahu Tambah Masa?
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickExtend(20, 10)}
                className="py-2 px-3 rounded-xl bg-[#151f2e] hover:bg-[#1c2a3e] border border-amber-500/40 text-amber-300 font-bold text-xs uppercase transition-colors cursor-pointer"
              >
                +20 Minit (RM10)
              </button>
              <button
                type="button"
                onClick={() => handleQuickExtend(30, 15)}
                className="py-2 px-3 rounded-xl bg-[#151f2e] hover:bg-[#1c2a3e] border border-amber-500/40 text-amber-300 font-bold text-xs uppercase transition-colors cursor-pointer"
              >
                +30 Minit (RM15)
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
