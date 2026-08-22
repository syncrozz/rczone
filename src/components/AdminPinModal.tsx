import React, { useState, useEffect, useRef } from 'react';
import { Lock, Unlock, ShieldCheck, X, Delete, AlertCircle, KeyRound } from 'lucide-react';
import { playTapSound, playEndingSoonSound } from '../utils/sound';

interface AdminPinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  soundEnabled?: boolean;
  correctPin?: string;
  title?: string;
  description?: string;
}

export const AdminPinModal: React.FC<AdminPinModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  soundEnabled = true,
  correctPin = '5313',
  title = 'Pengesahan Mod Admin',
  description = 'Sila masukkan Kod PIN Admin (5313) untuk meneruskan tindakan ini.',
}) => {
  const [pin, setPin] = useState<string>('');
  const [error, setError] = useState<boolean>(false);
  const [isShaking, setIsShaking] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setPin('');
      setError(false);
      setIsShaking(false);
      setIsSuccess(false);
      // Focus invisible input for physical keyboard entry
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  const verifyPin = (inputPin: string) => {
    if (inputPin === correctPin) {
      playTapSound(soundEnabled);
      setIsSuccess(true);
      setError(false);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 400);
    } else {
      playEndingSoonSound(soundEnabled);
      setError(true);
      setIsShaking(true);
      setTimeout(() => {
        setIsShaking(false);
        setPin('');
      }, 600);
    }
  };

  const handleKeyPress = (digit: string) => {
    if (isSuccess) return;
    playTapSound(soundEnabled);
    if (pin.length < 4) {
      const nextPin = pin + digit;
      setPin(nextPin);
      setError(false);
      if (nextPin.length === 4) {
        verifyPin(nextPin);
      }
    }
  };

  const handleDelete = () => {
    if (isSuccess) return;
    playTapSound(soundEnabled);
    setPin((prev) => prev.slice(0, -1));
    setError(false);
  };

  const handleClear = () => {
    if (isSuccess) return;
    playTapSound(soundEnabled);
    setPin('');
    setError(false);
  };

  // Physical keyboard support
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key >= '0' && e.key <= '9') {
        handleKeyPress(e.key);
      } else if (e.key === 'Backspace') {
        handleDelete();
      } else if (e.key === 'Delete') {
        handleClear();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, pin, isSuccess, soundEnabled, correctPin]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden flex flex-col p-6 sm:p-7 relative transition-transform ${
          isShaking ? 'animate-bounce border-rose-500 ring-2 ring-rose-500/30' : 'animate-in zoom-in-95 duration-150'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Invisible input to catch keyboard focus on mobile/desktop */}
        <input
          ref={inputRef}
          type="tel"
          pattern="[0-9]*"
          inputMode="numeric"
          value={pin}
          onChange={() => {}}
          className="opacity-0 absolute pointer-events-none w-0 h-0"
          autoFocus
        />

        {/* Close Button */}
        <button
          type="button"
          onClick={() => {
            playTapSound(soundEnabled);
            onClose();
          }}
          className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Tutup"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Icon & Title */}
        <div className="text-center space-y-2 mb-6">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 via-orange-500 to-amber-600 p-0.5 shadow-lg shadow-amber-500/25 flex items-center justify-center">
            <div className="w-full h-full bg-slate-900/40 rounded-[14px] flex items-center justify-center backdrop-blur-xs">
              {isSuccess ? (
                <ShieldCheck className="w-7 h-7 text-emerald-300 animate-pulse" />
              ) : (
                <Lock className="w-7 h-7 text-amber-300" />
              )}
            </div>
          </div>

          <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">
            {title}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
            {description}
          </p>
        </div>

        {/* PIN Digit Indicators */}
        <div className="flex items-center justify-center gap-3.5 mb-6">
          {[0, 1, 2, 3].map((index) => {
            const isFilled = pin.length > index;
            return (
              <div
                key={index}
                className={`w-11 h-12 rounded-2xl flex items-center justify-center font-mono font-black text-xl transition-all duration-200 ${
                  isSuccess
                    ? 'bg-emerald-500 text-white border-2 border-emerald-400 shadow-md shadow-emerald-500/30 scale-105'
                    : error
                    ? 'bg-rose-50 dark:bg-rose-950/40 border-2 border-rose-500 text-rose-600 dark:text-rose-400'
                    : isFilled
                    ? 'bg-blue-50 dark:bg-blue-950/50 border-2 border-blue-500 text-blue-600 dark:text-blue-400 shadow-sm scale-105'
                    : 'bg-slate-100 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 text-slate-400'
                }`}
              >
                {isFilled ? '●' : ''}
              </div>
            );
          })}
        </div>

        {/* Error Feedback */}
        {error && (
          <div className="mb-4 flex items-center justify-center gap-1.5 text-xs font-bold text-rose-600 dark:text-rose-400 animate-fade-in">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>PIN Tidak Sah! Sila masukkan PIN yang betul.</span>
          </div>
        )}

        {/* Numeric On-Screen Keypad */}
        <div className="grid grid-cols-3 gap-2.5 max-w-[260px] mx-auto w-full">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              type="button"
              onClick={() => handleKeyPress(digit)}
              className="h-12 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700/80 border border-slate-200/80 dark:border-slate-700 font-mono font-black text-lg text-slate-800 dark:text-slate-100 active:scale-90 transition-all shadow-2xs cursor-pointer"
            >
              {digit}
            </button>
          ))}

          {/* Clear Button */}
          <button
            type="button"
            onClick={handleClear}
            className="h-12 rounded-2xl bg-slate-100/70 hover:bg-slate-200 dark:bg-slate-800/60 dark:hover:bg-slate-700/80 border border-slate-200/80 dark:border-slate-700 text-xs font-bold text-slate-500 dark:text-slate-400 active:scale-90 transition-all cursor-pointer"
          >
            CLR
          </button>

          {/* Zero Button */}
          <button
            type="button"
            onClick={() => handleKeyPress('0')}
            className="h-12 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700/80 border border-slate-200/80 dark:border-slate-700 font-mono font-black text-lg text-slate-800 dark:text-slate-100 active:scale-90 transition-all shadow-2xs cursor-pointer"
          >
            0
          </button>

          {/* Backspace Button */}
          <button
            type="button"
            onClick={handleDelete}
            className="h-12 rounded-2xl bg-slate-100/70 hover:bg-slate-200 dark:bg-slate-800/60 dark:hover:bg-slate-700/80 border border-slate-200/80 dark:border-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 active:scale-90 transition-all cursor-pointer"
            title="Padam Digit"
          >
            <Delete className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Hint / Cancel Footer */}
        <div className="mt-5 text-center">
          <p className="text-[11px] text-slate-400 dark:text-slate-500">
            Kebenaran khas diperlukan untuk mengubah, menambah & memadam data.
          </p>
        </div>
      </div>
    </div>
  );
};
