import React, { useState } from 'react';
import { X, PlusCircle, Clock, DollarSign } from 'lucide-react';
import { Session, AppSettings, RidePackage } from '../types';
import { playTapSound } from '../utils/sound';

interface QuickExtendModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: Session | null;
  packages: RidePackage[];
  settings: AppSettings;
  onExtend: (session: Session, minutes: number, price: number) => void;
}

export const QuickExtendModal: React.FC<QuickExtendModalProps> = ({
  isOpen,
  onClose,
  session,
  packages,
  settings,
  onExtend,
}) => {
  const [customMinutes, setCustomMinutes] = useState<number>(10);
  const [customPrice, setCustomPrice] = useState<number>(5);

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900">
          <div>
            <span className="text-[11px] font-black uppercase tracking-wider text-amber-800 dark:text-amber-300">
              Tambah Masa Sesi
            </span>
            <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
              {session.machineName}
            </h2>
          </div>
          <button
            type="button"
            onClick={() => {
              playTapSound(settings.soundEnabled);
              onClose();
            }}
            className="p-2 rounded-xl text-slate-600 hover:text-slate-800 dark:text-slate-300 dark:hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Extension Options */}
        <div className="p-4 sm:p-5 space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase text-slate-700 dark:text-slate-300 mb-2">
              Pakej Tambahan Pantas
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => {
                  playTapSound(settings.soundEnabled);
                  onExtend(session, 20, 10);
                  onClose();
                }}
                className="p-3.5 rounded-2xl border-2 border-slate-200 dark:border-slate-700 hover:border-amber-500 bg-white dark:bg-slate-800/80 text-center transition-all cursor-pointer group"
              >
                <span className="block font-black text-slate-900 dark:text-white text-base group-hover:text-amber-500">
                  +20 MINIT
                </span>
                <span className="font-extrabold text-amber-800 dark:text-amber-300 text-sm">
                  {settings.currencySymbol}10
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  playTapSound(settings.soundEnabled);
                  onExtend(session, 30, 15);
                  onClose();
                }}
                className="p-3.5 rounded-2xl border-2 border-slate-200 dark:border-slate-700 hover:border-amber-500 bg-white dark:bg-slate-800/80 text-center transition-all cursor-pointer group"
              >
                <span className="block font-black text-slate-900 dark:text-white text-base group-hover:text-amber-500">
                  +30 MINIT
                </span>
                <span className="font-extrabold text-amber-800 dark:text-amber-300 text-sm">
                  {settings.currencySymbol}15
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  playTapSound(settings.soundEnabled);
                  onExtend(session, 60, 25);
                  onClose();
                }}
                className="p-3.5 rounded-2xl border-2 border-slate-200 dark:border-slate-700 hover:border-amber-500 bg-white dark:bg-slate-800/80 text-center transition-all cursor-pointer group"
              >
                <span className="block font-black text-slate-900 dark:text-white text-base group-hover:text-amber-500">
                  +60 MINIT
                </span>
                <span className="font-extrabold text-amber-800 dark:text-amber-300 text-sm">
                  {settings.currencySymbol}25
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  playTapSound(settings.soundEnabled);
                  onExtend(session, 10, 5);
                  onClose();
                }}
                className="p-3.5 rounded-2xl border-2 border-slate-200 dark:border-slate-700 hover:border-amber-500 bg-white dark:bg-slate-800/80 text-center transition-all cursor-pointer group"
              >
                <span className="block font-black text-slate-900 dark:text-white text-base group-hover:text-amber-500">
                  +10 MINIT
                </span>
                <span className="font-extrabold text-amber-800 dark:text-amber-300 text-sm">
                  {settings.currencySymbol}5
                </span>
              </button>
            </div>
          </div>

          {/* Custom Duration & Price */}
          <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
            <label className="block text-xs font-bold uppercase text-slate-700 dark:text-slate-300 mb-2">
              Pilihan Tempoh Tersuai
            </label>
            <div className="grid grid-cols-2 gap-2 mb-3">
              <div>
                <span className="text-[11px] text-slate-600 dark:text-slate-300 block mb-1">Minit</span>
                <input
                  type="number"
                  min="1"
                  max="180"
                  value={customMinutes}
                  onChange={(e) => setCustomMinutes(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-sm"
                />
              </div>
              <div>
                <span className="text-[11px] text-slate-600 dark:text-slate-300 block mb-1">Harga ({settings.currencySymbol})</span>
                <input
                  type="number"
                  min="0"
                  value={customPrice}
                  onChange={(e) => setCustomPrice(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-sm"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                playTapSound(settings.soundEnabled);
                onExtend(session, customMinutes, customPrice);
                onClose();
              }}
              className="w-full py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>TAMBAH {customMinutes} MINIT ({settings.currencySymbol}{customPrice})</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
