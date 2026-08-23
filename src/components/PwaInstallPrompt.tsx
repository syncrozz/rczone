import React, { useState, useEffect } from 'react';
import { Download, Smartphone, CheckCircle, X, Sparkles, Share, PlusSquare } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [showIosModal, setShowIosModal] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Check if running as standalone PWA
    const checkStandalone = () => {
      const isStandaloneMode =
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as unknown as { standalone?: boolean }).standalone === true ||
        document.referrer.includes('android-app://');
      setIsStandalone(Boolean(isStandaloneMode));
    };

    checkStandalone();

    // Check if iOS device
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIos(isIosDevice);

    // Listen for BeforeInstallPromptEvent (Android & Desktop Chrome/Edge)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    window.addEventListener('appinstalled', () => {
      setDeferredPrompt(null);
      setIsStandalone(true);
      console.log('[PWA] RC Fun Ride Manager was successfully installed!');
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        console.log('[PWA] User accepted installation prompt');
        setDeferredPrompt(null);
      } else {
        console.log('[PWA] User dismissed installation prompt');
      }
    } else if (isIos) {
      setShowIosModal(true);
    }
  };

  // If already installed or dismissed, don't show the floating banner
  if (isStandalone || isDismissed) {
    return null;
  }

  // Only show banner if install prompt is available or it's iOS Safari and not in standalone
  if (!deferredPrompt && !isIos) {
    return null;
  }

  return (
    <>
      {/* Floating PWA Install Banner */}
      <div
        id="pwa-install-banner"
        className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-40 bg-gradient-to-r from-[#101726] to-[#141e30] border border-amber-500/50 rounded-2xl p-4 shadow-2xl shadow-black/80 flex items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom-4 duration-300"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/40 text-amber-400 flex items-center justify-center shrink-0">
            <Download className="w-5 h-5 animate-bounce" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-[9px] font-chakra font-black tracking-widest text-amber-400 uppercase px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/30">
                PWA AKTIF
              </span>
            </div>
            <h4 className="text-xs font-chakra font-black text-white uppercase tracking-wide truncate mt-0.5">
              Pasang Aplikasi RC Fun Ride
            </h4>
            <p className="text-[11px] text-slate-300 font-sans truncate">
              Akses pantas terus dari skrin utama telefon anda
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            id="btn-trigger-pwa-install"
            onClick={handleInstallClick}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 text-xs font-chakra font-black uppercase tracking-wider shadow-lg shadow-amber-500/20 active:scale-95 transition-transform cursor-pointer"
          >
            PASANG
          </button>

          <button
            type="button"
            onClick={() => setIsDismissed(true)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="Tutup banner"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* iOS Installation Instruction Modal */}
      {showIosModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#121927] border border-amber-500/40 rounded-3xl w-full max-w-sm overflow-hidden p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-amber-400" />
                <h3 className="text-sm font-chakra font-black text-white uppercase">
                  Pasang di iPhone / iPad
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowIosModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-300 font-sans">
              <div className="flex items-start gap-3 p-3 rounded-xl bg-[#0d131f] border border-slate-800">
                <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400 shrink-0">
                  <Share className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold text-white block">Langkah 1:</span>
                  Tekan butang <strong>Kongsi (Share)</strong> pada bar navigasi Safari di bawah skrin.
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-[#0d131f] border border-slate-800">
                <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400 shrink-0">
                  <PlusSquare className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold text-white block">Langkah 2:</span>
                  Tatal ke bawah dan pilih <strong>'Add to Home Screen' (Tambah ke Skrin Utama)</strong>.
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowIosModal(false)}
              className="w-full py-2.5 rounded-xl bg-amber-500 text-slate-950 font-chakra font-black text-xs uppercase tracking-wider"
            >
              Faham
            </button>
          </div>
        </div>
      )}
    </>
  );
}
