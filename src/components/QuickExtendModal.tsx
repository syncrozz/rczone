import React, { useState, useEffect } from 'react';
import { 
  X, 
  PlusCircle, 
  Clock, 
  DollarSign, 
  Sparkles,
  Zap,
} from 'lucide-react';
import { Session, RidePackage, AppSettings } from '../types';
import { playTapSound } from '../utils/sound';

interface QuickExtendModalProps {
  isOpen: boolean;
  session: Session | null;
  packages: RidePackage[];
  settings: AppSettings;
  onClose: () => void;
  onExtend: (session: Session, minutes: number, price?: number) => void;
}

export const QuickExtendModal: React.FC<QuickExtendModalProps> = ({
  isOpen,
  session,
  packages,
  settings,
  onClose,
  onExtend,
}) => {
  const [selectedMinutes, setSelectedMinutes] = useState<number>(20);
  const [customPrice, setCustomPrice] = useState<number>(10);

  useEffect(() => {
    if (isOpen) {
      setSelectedMinutes(20);
      setCustomPrice(10);
    }
  }, [isOpen]);

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedMinutes <= 0) return;

    playTapSound(settings.soundEnabled);
    onExtend(session, selectedMinutes, customPrice);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="bg-[#101723] border border-slate-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-150 font-mono"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-[#0c121c]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center">
              <Zap className="w-5 h-5 fill-amber-400" />
            </div>
            <div>
              <span className="text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                EXTEND TIME
              </span>
              <h2 className="text-base sm:text-lg font-black text-white tracking-tight uppercase mt-0.5">
                Tambah Masa Sesi
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4">
          <div className="p-3.5 rounded-2xl bg-[#0c121c] border border-slate-800 text-xs text-slate-300">
            Unit: <strong className="text-white">{session.machineName}</strong> • Pelanggan: <strong className="text-amber-400">{session.customerName || 'Walk-in'}</strong>
          </div>

          {/* Quick Preset Buttons */}
          <div className="space-y-2">
            <label className="text-xs font-black uppercase text-slate-400 tracking-wider block">
              PILIHAN TEMPOH PANTAS
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { mins: 10, price: 5 },
                { mins: 20, price: 10 },
                { mins: 30, price: 15 },
                { mins: 45, price: 20 },
                { mins: 60, price: 25 },
              ].map((preset) => {
                const isSelected = selectedMinutes === preset.mins && customPrice === preset.price;
                return (
                  <button
                    key={preset.mins}
                    type="button"
                    onClick={() => {
                      playTapSound(settings.soundEnabled);
                      setSelectedMinutes(preset.mins);
                      setCustomPrice(preset.price);
                    }}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-black uppercase transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-500/20'
                        : 'bg-[#0c121c] border-slate-800 text-slate-300 hover:bg-[#162030]'
                    }`}
                  >
                    <div>+{preset.mins}M</div>
                    <div className="text-[10px] opacity-80">{settings.currencySymbol}{preset.price}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Duration & Price */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div>
              <label className="text-[11px] font-black uppercase text-slate-400 block mb-1">
                Minit Tambahan
              </label>
              <input
                type="number"
                min="1"
                required
                value={selectedMinutes}
                onChange={(e) => setSelectedMinutes(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-slate-700 bg-[#0c121c] text-white text-xs font-black focus:border-amber-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-[11px] font-black uppercase text-slate-400 block mb-1">
                Caj Tambahan ({settings.currencySymbol})
              </label>
              <input
                type="number"
                min="0"
                required
                value={customPrice}
                onChange={(e) => setCustomPrice(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-slate-700 bg-[#0c121c] text-white text-xs font-black focus:border-amber-400 focus:outline-none"
              />
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="w-full mt-2 py-3 px-4 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-amber-500/20 transition-all cursor-pointer active:scale-[0.98]"
          >
            SAMBUNG MASA (+{selectedMinutes} MINIT)
          </button>
        </form>
      </div>
    </div>
  );
};
