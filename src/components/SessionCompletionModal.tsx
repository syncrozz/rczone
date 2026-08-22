import React from 'react';
import { X, CheckCircle2, Plus, Clock, DollarSign, User, AlertCircle, Sparkles } from 'lucide-react';
import { Session, AppSettings } from '../types';
import { formatClockTime } from '../utils/format';
import { playTapSound } from '../utils/sound';

interface SessionCompletionModalProps {
  session: Session | null;
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onCompleteAndRecord: (session: Session) => void;
  onExtend: (session: Session, minutes: number, price: number) => void;
}

export const SessionCompletionModal: React.FC<SessionCompletionModalProps> = ({
  session,
  isOpen,
  onClose,
  settings,
  onCompleteAndRecord,
  onExtend,
}) => {
  React.useEffect(() => {
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header banner */}
        <div className="p-5 bg-gradient-to-b from-amber-500/20 to-transparent border-b border-slate-200 dark:border-slate-800 text-center relative">
          <button
            type="button"
            onClick={() => {
              playTapSound(settings.soundEnabled);
              onClose();
            }}
            className="absolute top-4 right-4 p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="w-14 h-14 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-amber-500/30">
            <CheckCircle2 className="w-8 h-8 stroke-[2.5]" />
          </div>

          <span className="text-[11px] font-black uppercase tracking-widest text-amber-800 dark:text-amber-300">
            PENGESAHAN SESI
          </span>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mt-0.5">
            SESI SELESAI
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
            Pilih tindakan untuk mesin ini
          </p>
        </div>

        {/* Session Details Card */}
        <div className="p-5 space-y-4">
          <div className="bg-slate-50 dark:bg-slate-800/80 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-2.5">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
              <span className="text-xs text-slate-600 dark:text-slate-300 font-medium">Mesin</span>
              <span className="font-extrabold text-base text-slate-900 dark:text-white">
                {session.machineName}
              </span>
            </div>

            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
              <span className="text-xs text-slate-600 dark:text-slate-300 font-medium">Pakej & Tempoh</span>
              <span className="font-bold text-sm text-slate-800 dark:text-slate-200">
                {session.packageName} ({session.durationMinutes} Minit)
              </span>
            </div>

            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
              <span className="text-xs text-slate-600 dark:text-slate-300 font-medium">Pelanggan</span>
              <span className="font-bold text-sm text-slate-800 dark:text-slate-200">
                {session.customerName || 'Walk-in'}
              </span>
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-xs text-slate-600 dark:text-slate-300 font-medium">Jumlah Bayaran</span>
              <span className="font-black text-xl text-amber-800 dark:text-amber-300">
                {settings.currencySymbol}{session.price}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2.5 pt-1">
            {/* 1. Tamatkan & Rekod */}
            <button
              type="button"
              id="btn-complete-confirm"
              onClick={() => {
                playTapSound(settings.soundEnabled);
                onCompleteAndRecord(session);
                onClose();
              }}
              className="w-full py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/25 transition-all cursor-pointer"
            >
              <CheckCircle2 className="w-5 h-5" />
              <span>[ TAMATKAN & REKOD ]</span>
            </button>

            {/* 2. Sambung Options */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                id="btn-extend-20-confirm"
                onClick={() => {
                  playTapSound(settings.soundEnabled);
                  onExtend(session, 20, 10);
                  onClose();
                }}
                className="py-3 px-3 rounded-2xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-800 dark:text-amber-300 border-2 border-amber-500/40 font-extrabold text-xs flex items-center justify-center gap-1 transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>SAMBUNG 20 MIN (RM10)</span>
              </button>

              <button
                type="button"
                id="btn-extend-30-confirm"
                onClick={() => {
                  playTapSound(settings.soundEnabled);
                  onExtend(session, 30, 15);
                  onClose();
                }}
                className="py-3 px-3 rounded-2xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-800 dark:text-amber-300 border-2 border-amber-500/40 font-extrabold text-xs flex items-center justify-center gap-1 transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>SAMBUNG 30 MIN (RM15)</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
