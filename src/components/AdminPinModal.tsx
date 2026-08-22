import React, { useState, useEffect, useRef } from 'react';
import { Lock, ShieldCheck, X, AlertCircle, KeyRound } from 'lucide-react';

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
  correctPin = '5313',
  title = 'Akses Mod Admin',
  description = 'Sila masukkan 4-digit PIN keselamatan untuk aktifkan mod suntingan admin.',
}) => {
  const [pin, setPin] = useState<string>('');
  const [error, setError] = useState<boolean>(false);
  const [isShaking, setIsShaking] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus immediately whenever modal opens
  useEffect(() => {
    if (isOpen) {
      setPin('');
      setError(false);
      setIsShaking(false);
      setIsSuccess(false);

      // Instant focus + delayed fallback for smooth rendering
      inputRef.current?.focus();
      const timer = setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 50);

      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Unified PIN verification function
  const verifyPin = (inputPin: string) => {
    if (inputPin === correctPin) {
      setIsSuccess(true);
      setError(false);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 200);
    } else {
      setError(true);
      setIsShaking(true);
      setPin('');
      setTimeout(() => {
        setIsShaking(false);
        inputRef.current?.focus();
      }, 500);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin || pin.length === 0) {
      inputRef.current?.focus();
      return;
    }
    verifyPin(pin);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value.replace(/\D/g, '').slice(0, 4);
    setPin(rawVal);
    setError(false);
  };

  // Keyboard Escape listener
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden flex flex-col p-6 sm:p-7 relative transition-all ${
          isShaking
            ? 'animate-bounce border-rose-500 ring-2 ring-rose-500/30'
            : 'animate-in zoom-in-95 duration-150'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          title="Tutup (Esc)"
        >
          <X className="w-5 h-5" />
        </button>

        {/* 🔒 Icon & Title */}
        <div className="text-center space-y-2 mb-6">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 flex items-center justify-center shadow-xs">
            {isSuccess ? (
              <ShieldCheck className="w-7 h-7 text-emerald-500 animate-pulse" />
            ) : (
              <Lock className="w-7 h-7 text-amber-500" />
            )}
          </div>

          <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">
            {title}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto leading-relaxed">
            {description}
          </p>
        </div>

        {/* Form with PIN Input & Submit Button */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <div className="relative">
              <input
                ref={inputRef}
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={4}
                autoComplete="off"
                placeholder="Masukkan 4-digit PIN"
                value={pin}
                onChange={handleInputChange}
                className={`w-full px-4 py-3.5 rounded-2xl border-2 bg-slate-50 dark:bg-slate-950 font-mono font-black text-center text-xl tracking-[0.3em] transition-all placeholder:font-sans placeholder:text-sm placeholder:font-normal placeholder:tracking-normal outline-hidden ${
                  error
                    ? 'border-rose-500 text-rose-600 dark:text-rose-400 bg-rose-50/50 dark:bg-rose-950/30 ring-2 ring-rose-500/20'
                    : isSuccess
                    ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/30'
                    : 'border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:border-amber-500 dark:focus:border-amber-500 focus:ring-4 focus:ring-amber-500/20'
                }`}
                autoFocus
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-rose-600 dark:text-rose-400 animate-in fade-in duration-150">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>PIN Tidak Sah! Sila cuba lagi.</span>
              </div>
            )}
          </div>

          {/* 🔑 Submit Button */}
          <button
            type="submit"
            disabled={isSuccess}
            className={`w-full py-3.5 px-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all shadow-md active:scale-98 cursor-pointer ${
              isSuccess
                ? 'bg-emerald-500 text-white shadow-emerald-500/30'
                : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-amber-500/25'
            }`}
          >
            <KeyRound className="w-4 h-4 stroke-[2.5]" />
            <span>Sahkan PIN Admin</span>
          </button>
        </form>

        {/* Quick Hint */}
        <div className="mt-4 text-center">
          <p className="text-[11px] text-slate-400 dark:text-slate-500">
            Tekan <kbd className="px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-[10px] font-bold text-slate-600 dark:text-slate-300">Enter</kbd> untuk sahkan atau <kbd className="px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-[10px] font-bold text-slate-600 dark:text-slate-300">Esc</kbd> untuk batal.
          </p>
        </div>
      </div>
    </div>
  );
};
