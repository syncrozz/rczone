import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Clock,
  Volume2,
  VolumeX,
  Share2,
  Bell,
  CheckCircle2,
  AlertTriangle,
  Radio,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  PhoneCall,
} from 'lucide-react';
import { formatClockTime, formatTimeRemaining } from '../utils/format';
import { resolveAssetType, loadInitialData } from '../utils/storage';

interface CustomerLiveViewProps {
  onBackToDashboard?: () => void;
}

export const CustomerLiveView: React.FC<CustomerLiveViewProps> = ({ onBackToDashboard }) => {
  // Parse query parameters
  const searchParams = useMemo(() => {
    if (typeof window === 'undefined') return new URLSearchParams();
    return new URLSearchParams(window.location.search);
  }, []);

  const sessionId = searchParams.get('session_id') || 'sess_demo';
  const machineName = searchParams.get('machine_name') || 'Excavator EX-01';
  const machineType = searchParams.get('machine_type') || 'excavator';
  const customerName = searchParams.get('customer') || 'Pelanggan';
  const packageName = searchParams.get('pkg') || 'Sesi Standard (20 Minit)';
  const durationMinutes = parseInt(searchParams.get('duration') || '20', 10);
  const price = parseFloat(searchParams.get('price') || '10');
  const startTime = parseInt(searchParams.get('start') || String(Date.now()), 10);
  const rawEndTime = parseInt(searchParams.get('end') || String(Date.now() + durationMinutes * 60 * 1000), 10);
  const businessName = searchParams.get('biz') || 'FUN RIDE RC ZONE';

  const [now, setNow] = useState<number>(Date.now());
  const [audioEnabled, setAudioEnabled] = useState<boolean>(false);
  const [isAlarmPlaying, setIsAlarmPlaying] = useState<boolean>(false);
  const [hasInteracted, setHasInteracted] = useState<boolean>(false);
  const [showShareToast, setShowShareToast] = useState<boolean>(false);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const alarmIntervalRef = useRef<number | null>(null);
  const alarmFiredRef = useRef<boolean>(false);

  // Live timer tick
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 500);
    return () => clearInterval(timer);
  }, []);

  // Calculate live remaining time
  const totalDurationMs = Math.max(1000, durationMinutes * 60 * 1000);
  const elapsedMs = Math.max(0, now - startTime);
  const remainingMs = Math.max(0, rawEndTime - now);
  const remainingSeconds = Math.ceil(remainingMs / 1000);
  const progressPercent = Math.min(100, Math.max(0, (elapsedMs / totalDurationMs) * 100));

  const isTimeUp = now >= rawEndTime;
  const isEndingSoon = !isTimeUp && remainingSeconds <= 60;

  // Initialize Web Audio context on user tap
  const initAudio = () => {
    try {
      if (!audioCtxRef.current) {
        const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (AudioCtxClass) {
          audioCtxRef.current = new AudioCtxClass();
        }
      }
      if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume();
      }
      setAudioEnabled(true);
      setHasInteracted(true);
    } catch (e) {
      console.warn('Audio init error:', e);
    }
  };

  // Sound Synthesizer: Alarm Siren
  const playSirenChime = () => {
    try {
      if (!audioCtxRef.current) {
        const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (AudioCtxClass) {
          audioCtxRef.current = new AudioCtxClass();
        }
      }
      const ctx = audioCtxRef.current;
      if (!ctx) return;

      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      // 4-note energetic motorsport finish fanfare
      const melody = [587.33, 739.99, 880.00, 1174.66]; // D5, F#5, A5, D6
      melody.forEach((freq, idx) => {
        const noteStart = ctx.currentTime + idx * 0.12;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, noteStart);

        gain.gain.setValueAtTime(0, noteStart);
        gain.gain.linearRampToValueAtTime(0.35, noteStart + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, noteStart + 0.28);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(noteStart);
        osc.stop(noteStart + 0.28);
      });
    } catch (e) {
      console.warn('Play siren error:', e);
    }
  };

  // Trigger Alarm when time hits 0
  useEffect(() => {
    if (isTimeUp && !alarmFiredRef.current) {
      alarmFiredRef.current = true;
      setIsAlarmPlaying(true);

      // Play sound
      if (audioEnabled) {
        playSirenChime();
        if (alarmIntervalRef.current) clearInterval(alarmIntervalRef.current);
        alarmIntervalRef.current = window.setInterval(() => {
          playSirenChime();
        }, 2200);
      }

      // Trigger mobile vibration
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        try {
          navigator.vibrate([400, 200, 400, 200, 800]);
        } catch (e) {}
      }
    }
  }, [isTimeUp, audioEnabled]);

  const handleStopAlarm = () => {
    if (alarmIntervalRef.current) {
      clearInterval(alarmIntervalRef.current);
      alarmIntervalRef.current = null;
    }
    setIsAlarmPlaying(false);
  };

  // Native Web Share or Copy Link
  const handleShare = async () => {
    if (typeof window === 'undefined') return;
    const url = window.location.href;
    const shareData = {
      title: `${businessName} - Live Sesi Tracker`,
      text: `Pantau sesi mainan RC ${machineName} (${customerName}) secara langsung:`,
      url,
    };

    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        // user cancelled
      }
    } else {
      try {
        await navigator.clipboard.writeText(url);
        setShowShareToast(true);
        setTimeout(() => setShowShareToast(false), 3000);
      } catch (e) {}
    }
  };

  const getMachineEmoji = () => {
    try {
      const initial = loadInitialData();
      const resolved = resolveAssetType(machineType, initial.assetTypes);
      return resolved.icon || '🏎️';
    } catch {
      return '🏎️';
    }
  };

  return (
    <div className={`min-h-screen flex flex-col justify-between text-slate-100 font-sans p-4 sm:p-6 transition-colors duration-500 ${
      isTimeUp
        ? 'bg-gradient-to-b from-[#2a0b12] via-[#1a080d] to-[#0a0406]'
        : isEndingSoon
        ? 'bg-gradient-to-b from-[#24170a] via-[#151008] to-[#0b0c10]'
        : 'bg-gradient-to-b from-[#0b121e] via-[#080d16] to-[#05080e]'
    }`}>
      {/* Background Motorsport Ambient Glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div
          className={`absolute -top-40 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full blur-3xl opacity-25 transition-all duration-700 ${
            isTimeUp ? 'bg-rose-500' : isEndingSoon ? 'bg-amber-500' : 'bg-amber-400'
          }`}
        ></div>
      </div>

      {/* Top Header & Telemetry Status */}
      <header className="relative z-10 w-full max-w-md mx-auto flex items-center justify-between pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-lg shadow-md">
            {getMachineEmoji()}
          </div>
          <div>
            <span className="text-[10px] font-mono font-black uppercase tracking-widest text-amber-400 block leading-tight">
              {businessName}
            </span>
            <span className="text-xs font-chakra font-black uppercase text-white tracking-wide">
              LIVE SESSION HUD
            </span>
          </div>
        </div>

        {/* Live Indicator */}
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#101927] border border-slate-700 text-[11px] font-mono font-bold">
          <span className={`w-2 h-2 rounded-full ${isTimeUp ? 'bg-rose-500 animate-ping' : 'bg-emerald-400 animate-pulse'}`}></span>
          <span className={isTimeUp ? 'text-rose-400' : 'text-emerald-300'}>
            {isTimeUp ? 'TIME UP' : 'LIVE'}
          </span>
        </div>
      </header>

      {/* Main Container Content */}
      <main className="relative z-10 w-full max-w-md mx-auto my-auto py-4 space-y-4">
        {/* Audio Siren Enable Callout (if not yet enabled) */}
        {!hasInteracted && (
          <button
            type="button"
            onClick={initAudio}
            className="w-full p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/20 via-amber-500/10 to-amber-500/20 border border-amber-400/60 flex items-center justify-between gap-3 text-left shadow-lg shadow-amber-500/10 animate-bounce active:scale-98 transition-all cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-black shrink-0">
                <Bell className="w-5 h-5 animate-spin" />
              </div>
              <div>
                <p className="text-xs font-black text-amber-300 uppercase tracking-wide">
                  Aktifkan Penggera Telefon
                </p>
                <p className="text-[11px] text-slate-300 font-mono">
                  Tekan sini supaya bunyi siren berdering apabila masa tamat!
                </p>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-lg bg-amber-400 text-slate-950 text-[10px] font-mono font-black uppercase tracking-wider shrink-0">
              AKTIFKAN
            </span>
          </button>
        )}

        {/* TIME UP ALARM ACTIVE BANNER */}
        {isTimeUp && (
          <div className="p-4 rounded-2xl bg-rose-600/90 border border-rose-400 text-white text-center shadow-2xl shadow-rose-600/50 animate-pulse space-y-2">
            <div className="text-3xl">🚨</div>
            <h2 className="text-xl font-chakra font-black tracking-wider uppercase">
              MASA ANDA TELAH TAMAT!
            </h2>
            <p className="text-xs text-rose-100 font-mono">
              Sila hentikan kenderaan RC dan pulangkan alat kawalan kepada staf bertugas.
            </p>
            {isAlarmPlaying && (
              <button
                type="button"
                onClick={handleStopAlarm}
                className="mt-2 w-full py-2.5 px-4 rounded-xl bg-white hover:bg-slate-100 text-rose-950 font-chakra font-black text-xs uppercase tracking-wider shadow-md active:scale-95 transition-all cursor-pointer"
              >
                🔴 MATIKAN BUNYI SIREN
              </button>
            )}
          </div>
        )}

        {/* Live Digital Timer Card */}
        <div className={`p-6 rounded-3xl border relative overflow-hidden backdrop-blur-md transition-all duration-300 shadow-2xl ${
          isTimeUp
            ? 'bg-[#180d12]/90 border-rose-500/60 shadow-rose-950/40'
            : isEndingSoon
            ? 'bg-[#1a140a]/90 border-amber-400/60 shadow-amber-950/40'
            : 'bg-[#0f1725]/90 border-slate-700/80 shadow-slate-950/50'
        }`}>
          {/* Progress Bar (Top) */}
          <div className="absolute top-0 left-0 right-0 h-2 bg-slate-800/80">
            <div
              className={`h-full transition-all duration-500 ${
                isTimeUp
                  ? 'bg-rose-500 w-full animate-pulse'
                  : isEndingSoon
                  ? 'bg-amber-400'
                  : 'bg-gradient-to-r from-amber-500 via-amber-400 to-amber-300'
              }`}
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>

          {/* Machine & Customer Header Inside Card */}
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
            <div>
              <span className="text-[11px] font-mono text-slate-400 block uppercase">
                Pelanggan
              </span>
              <span className="text-base font-chakra font-black text-white tracking-wide">
                {customerName}
              </span>
            </div>
            <div className="text-right">
              <span className="text-[11px] font-mono text-slate-400 block uppercase">
                Unit RC
              </span>
              <span className="text-sm font-mono font-bold text-amber-400 flex items-center justify-end gap-1">
                <span>{getMachineEmoji()}</span>
                <span>{machineName}</span>
              </span>
            </div>
          </div>

          {/* Main Giant Countdown Clock */}
          <div className="text-center py-3">
            <span className="text-[11px] font-mono font-black uppercase tracking-widest text-slate-400 block mb-1">
              {isTimeUp ? 'TEMPOH TAMAT' : 'BAKI MASA SESI'}
            </span>
            <div
              className={`text-6xl sm:text-7xl font-mono font-black tracking-tight filter drop-shadow-lg ${
                isTimeUp
                  ? 'text-rose-500 animate-pulse'
                  : isEndingSoon
                  ? 'text-amber-400 animate-pulse'
                  : 'text-white'
              }`}
            >
              {formatTimeRemaining(remainingSeconds)}
            </div>
            <div className="flex items-center justify-center gap-2 mt-2">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold ${
                isTimeUp
                  ? 'bg-rose-950/80 text-rose-300 border border-rose-500/40'
                  : isEndingSoon
                  ? 'bg-amber-950/80 text-amber-300 border border-amber-500/40 animate-pulse'
                  : 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/40'
              }`}>
                <Clock className="w-3.5 h-3.5" />
                <span>
                  {isTimeUp
                    ? 'Sesi Selesai'
                    : isEndingSoon
                    ? 'Amaran: 1 Minit Terakhir!'
                    : 'Sesi Sedang Berjalan'}
                </span>
              </span>
            </div>
          </div>

          {/* Session Timeline Footnote */}
          <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-800 text-center text-xs font-mono">
            <div className="p-2.5 rounded-xl bg-[#0c121d] border border-slate-800">
              <span className="text-[10px] text-slate-400 block uppercase">Mula</span>
              <span className="font-bold text-slate-200">{formatClockTime(startTime)}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-[#0c121d] border border-slate-800">
              <span className="text-[10px] text-slate-400 block uppercase">Dijangka Tamat</span>
              <span className={`font-bold ${isTimeUp ? 'text-rose-400' : 'text-amber-400'}`}>
                {formatClockTime(rawEndTime)}
              </span>
            </div>
          </div>
        </div>

        {/* Package & Info Details Card */}
        <div className="p-4 rounded-2xl bg-[#0f1725]/80 border border-slate-800 space-y-2.5 text-xs font-mono">
          <div className="flex items-center justify-between text-slate-300">
            <span className="text-slate-400">Pakej Dipilih:</span>
            <span className="font-bold text-white">{packageName}</span>
          </div>
          <div className="flex items-center justify-between text-slate-300">
            <span className="text-slate-400">Tempoh Keseluruhan:</span>
            <span className="font-bold text-amber-300">{durationMinutes} Minit</span>
          </div>
          <div className="flex items-center justify-between text-slate-300">
            <span className="text-slate-400">Status Audio Penggera:</span>
            <span className="flex items-center gap-1.5 font-bold">
              {audioEnabled ? (
                <span className="text-emerald-400 flex items-center gap-1">
                  <Volume2 className="w-3.5 h-3.5" /> Aktif
                </span>
              ) : (
                <button
                  type="button"
                  onClick={initAudio}
                  className="text-amber-400 underline hover:text-amber-300 cursor-pointer flex items-center gap-1"
                >
                  <VolumeX className="w-3.5 h-3.5" /> Tekan Untuk Aktifkan
                </button>
              )}
            </span>
          </div>
        </div>

        {/* Action Buttons: Share & Test Siren */}
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={handleShare}
            className="p-3 rounded-xl bg-[#131d2e] hover:bg-[#18263c] border border-slate-700/80 text-slate-200 font-chakra font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer"
          >
            <Share2 className="w-4 h-4 text-amber-400" />
            <span>Kongsi Link</span>
          </button>

          <button
            type="button"
            onClick={() => {
              initAudio();
              playSirenChime();
            }}
            className="p-3 rounded-xl bg-[#131d2e] hover:bg-[#18263c] border border-slate-700/80 text-slate-200 font-chakra font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer"
          >
            <Bell className="w-4 h-4 text-amber-400" />
            <span>Uji Siren</span>
          </button>
        </div>

        {showShareToast && (
          <div className="p-3 rounded-xl bg-emerald-500 text-slate-950 text-xs font-mono font-bold text-center animate-fade-in shadow-lg">
            ✅ Pautan Live Tracker telah disalin ke papan klip!
          </div>
        )}
      </main>

      {/* Footer & Admin Switch Back */}
      <footer className="relative z-10 w-full max-w-md mx-auto pt-3 border-t border-slate-800/80 text-center space-y-2">
        <p className="text-[11px] font-mono text-slate-500">
          Sila kekalkan halaman ini dibuka untuk pemantauan masa berterusan.
        </p>

        {onBackToDashboard && (
          <button
            type="button"
            onClick={onBackToDashboard}
            className="text-[11px] font-mono text-amber-400/80 hover:text-amber-300 underline cursor-pointer"
          >
            Kembali ke Dashboard Pengurusan Admin
          </button>
        )}
      </footer>
    </div>
  );
};
