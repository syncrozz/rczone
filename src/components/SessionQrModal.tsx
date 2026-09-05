import React, { useState, useEffect } from 'react';
import {
  QrCode,
  Share2,
  Copy,
  ExternalLink,
  Check,
  X,
  Phone,
  MessageCircle,
  Clock,
  Sparkles,
  Zap,
} from 'lucide-react';
import { Session, Machine, AppSettings } from '../types';
import { generateQrDataUrl, getLiveSessionUrl, getWhatsAppShareUrl, formatPhoneNumberForWhatsApp } from '../utils/qr';
import { formatClockTime } from '../utils/format';
import { playTapSound } from '../utils/sound';

interface SessionQrModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: Session | null;
  machine: Machine | null;
  settings: AppSettings;
}

export const SessionQrModal: React.FC<SessionQrModalProps> = ({
  isOpen,
  onClose,
  session,
  machine,
  settings,
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(true);

  const liveUrl = session && machine ? getLiveSessionUrl(session, machine, settings.businessName) : '';

  // Generate QR Code when modal opens or session changes
  useEffect(() => {
    if (isOpen && liveUrl) {
      setIsGenerating(true);
      generateQrDataUrl(liveUrl).then((url) => {
        setQrDataUrl(url);
        setIsGenerating(false);
      });
    }
  }, [isOpen, liveUrl]);

  if (!isOpen || !session || !machine) return null;

  const handleCopyLink = async () => {
    playTapSound(settings.soundEnabled);
    if (!liveUrl) return;
    try {
      await navigator.clipboard.writeText(liveUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (e) {
      console.warn('Copy failed:', e);
    }
  };

  const handleOpenWhatsApp = () => {
    playTapSound(settings.soundEnabled);
    const waUrl = getWhatsAppShareUrl(
      phoneNumber,
      session,
      machine,
      settings.businessName,
      settings.currencySymbol
    );
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  };

  const handleOpenLiveView = () => {
    playTapSound(settings.soundEnabled);
    if (liveUrl) {
      window.open(liveUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="bg-[#101723] border border-amber-500/40 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl shadow-amber-500/10 flex flex-col relative max-h-[92vh]">
        {/* Top Header */}
        <div className="p-5 bg-gradient-to-r from-[#182335] via-[#121927] to-[#182335] border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-400/50 flex items-center justify-center text-amber-400">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-black uppercase px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  LIVE TELEMETRY
                </span>
                <h3 className="text-lg font-chakra font-black text-white uppercase tracking-wide">
                  QR Live Tracker Sesi
                </h3>
              </div>
              <p className="text-xs text-slate-400 font-mono">
                Imbas QR atau hantar terus ke WhatsApp pelanggan
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
            title="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4.5 scrollbar-thin">
          {/* Session Overview Capsule */}
          <div className="p-3.5 rounded-2xl bg-[#0c121d] border border-slate-800/90 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[10px] font-mono uppercase text-slate-400">
                Unit RC & Pelanggan
              </span>
              <div className="font-chakra font-black text-white text-sm uppercase">
                {machine.name}
              </div>
              <div className="text-xs text-amber-400 font-mono">
                {session.customerName || 'Pelanggan Walk-in'}
              </div>
            </div>

            <div className="text-right space-y-0.5">
              <span className="text-[10px] font-mono uppercase text-slate-400">
                Pakej & Masa Tamat
              </span>
              <div className="font-mono font-bold text-slate-200 text-xs">
                {session.packageName}
              </div>
              <div className="text-xs text-emerald-400 font-mono font-bold">
                Tamat: {formatClockTime(session.endTime)}
              </div>
            </div>
          </div>

          {/* High-Resolution QR Display Box */}
          <div className="p-5 rounded-2xl bg-white text-slate-950 flex flex-col items-center justify-center text-center shadow-lg border-4 border-amber-400/80 relative">
            <div className="text-[11px] font-mono font-black uppercase tracking-widest text-slate-800 mb-2">
              IMBAS UNTUK PANTAU MASA & BUNYI ALARM
            </div>

            {isGenerating ? (
              <div className="w-48 h-48 flex items-center justify-center font-mono text-xs text-slate-500">
                Menjana QR Code...
              </div>
            ) : qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt="QR Live Tracker Sesi"
                className="w-52 h-52 object-contain rounded-lg filter drop-shadow-md"
              />
            ) : (
              <div className="w-48 h-48 flex items-center justify-center font-mono text-xs text-rose-500">
                Gagal memuatkan QR
              </div>
            )}

            <div className="mt-2 text-[10px] font-mono font-bold text-slate-600 uppercase tracking-wider">
              📱 Segerak Masa Nyata dengan Penggera Automatik
            </div>

            {liveUrl && (
              <div className="mt-2 px-3 py-1 rounded-full bg-slate-100 border border-slate-300 text-[11px] font-mono font-bold text-slate-800 max-w-full truncate select-all">
                {liveUrl.replace(/^https?:\/\//, '')}
              </div>
            )}
          </div>

          {/* WhatsApp Direct Send Section */}
          <div className="p-4 rounded-2xl bg-[#0e1624] border border-emerald-500/30 space-y-3">
            <div className="flex items-center gap-2 text-emerald-400">
              <MessageCircle className="w-4 h-4" />
              <span className="text-xs font-chakra font-black uppercase tracking-wide">
                Hantar Link Terus ke WhatsApp Pelanggan
              </span>
            </div>

            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="tel"
                  id="input-customer-whatsapp"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="Cth: 0123456789 (pilihan)"
                  className="w-full bg-[#080d15] border border-slate-700 focus:border-emerald-400 rounded-xl px-3 py-2.5 text-xs font-mono text-white placeholder-slate-500 outline-none"
                />
              </div>

              <button
                type="button"
                id="btn-send-whatsapp"
                onClick={handleOpenWhatsApp}
                className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 font-chakra font-black text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer whitespace-nowrap"
              >
                <MessageCircle className="w-3.5 h-3.5 fill-slate-950" />
                <span>Hantar WA</span>
              </button>
            </div>
          </div>

          {/* Quick Action Utilities: Copy Link & Open Live View */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              id="btn-copy-live-link"
              onClick={handleCopyLink}
              className={`p-3 rounded-xl border text-xs font-chakra font-black uppercase tracking-wider flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer ${
                copied
                  ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                  : 'bg-[#151f2e] hover:bg-[#1a283c] border-slate-700 text-slate-200'
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>Disalin!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-amber-400" />
                  <span>Salin Pautan</span>
                </>
              )}
            </button>

            <button
              type="button"
              id="btn-open-live-preview"
              onClick={handleOpenLiveView}
              className="p-3 rounded-xl bg-[#151f2e] hover:bg-[#1a283c] border border-slate-700 text-slate-200 font-chakra font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer"
            >
              <ExternalLink className="w-4 h-4 text-amber-400" />
              <span>Buka Live HUD</span>
            </button>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-[#0c121d] border-t border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-chakra font-black text-xs uppercase tracking-wider shadow-md transition-transform active:scale-95 cursor-pointer"
          >
            Selesai / Teruskan
          </button>
        </div>
      </div>
    </div>
  );
};
