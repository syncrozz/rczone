import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
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
  Hand,
  Check,
  PauseCircle,
  HelpCircle,
} from 'lucide-react';
import { Session, Machine, AppSettings } from '../types';
import { formatClockTime, formatTimeRemaining } from '../utils/format';
import { resolveAssetType, loadInitialData } from '../utils/storage';
import { AssetIcon } from './AssetIcon';
import { notifyCustomerAlarmStopped, subscribeToCloudSync } from '../services/firebaseSync';
import { parseCustomerLiveRoute, LegacyCustomerParams } from '../utils/token';
import { getLiveSessionUrl } from '../utils/qr';
import { SupportModal } from './SupportModal';

interface CustomerLiveViewProps {
  token?: string;
  sessions?: Session[];
  machines?: Machine[];
  settings?: AppSettings;
  legacyParams?: LegacyCustomerParams;
  onBackToDashboard?: () => void;
}

export const CustomerLiveView: React.FC<CustomerLiveViewProps> = ({
  token: propToken,
  sessions: propSessions,
  machines: propMachines,
  settings: propSettings,
  legacyParams: propLegacyParams,
  onBackToDashboard,
}) => {
  // 1. Detect route information if not supplied by props
  const routeInfo = useMemo(() => {
    return parseCustomerLiveRoute();
  }, []);

  const activeToken = propToken || routeInfo.token || '';
  const legacyParams = propLegacyParams || routeInfo.legacyParams;

  // 2. Local fallback state in case rendered in isolation / direct browser tab
  const [internalSessions, setInternalSessions] = useState<Session[]>(() => {
    if (propSessions && propSessions.length > 0) return propSessions;
    try {
      return loadInitialData().sessions || [];
    } catch {
      return [];
    }
  });

  const [internalMachines, setInternalMachines] = useState<Machine[]>(() => {
    if (propMachines && propMachines.length > 0) return propMachines;
    try {
      return loadInitialData().machines || [];
    } catch {
      return [];
    }
  });

  const [internalSettings, setInternalSettings] = useState<AppSettings>(() => {
    if (propSettings) return propSettings;
    try {
      return loadInitialData().settings;
    } catch {
      return {
        businessName: 'FUN RIDE RC ZONE',
        adminPin: '6381',
        bufferMinutes: 3,
        soundEnabled: true,
        alarmVolume: 1,
        alarmRepeat: 3,
        vibrationEnabled: true,
        wakeLockEnabled: true,
        endingSoonThresholdSeconds: 60,
        currencySymbol: 'RM',
      };
    }
  });

  // Keep internal state synced when props change
  useEffect(() => {
    if (propSessions && propSessions.length > 0) {
      setInternalSessions(propSessions);
    }
  }, [propSessions]);

  useEffect(() => {
    if (propMachines && propMachines.length > 0) {
      setInternalMachines(propMachines);
    }
  }, [propMachines]);

  useEffect(() => {
    if (propSettings) {
      setInternalSettings(propSettings);
    }
  }, [propSettings]);

  // Connect directly to Firebase Cloud Sync if opened in isolation or propSessions is empty
  useEffect(() => {
    const unsubscribe = subscribeToCloudSync((cloudData) => {
      if (cloudData.sessions) setInternalSessions(cloudData.sessions);
      if (cloudData.machines) setInternalMachines(cloudData.machines);
      if (cloudData.settings) setInternalSettings((prev) => ({ ...prev, ...(cloudData.settings || {}) }));
    });
    return () => unsubscribe();
  }, []);

  // 3. Resolve active session from public token or legacy parameters
  const [isResolving, setIsResolving] = useState<boolean>(true);

  // Grace period timer for cloud connection on direct mobile page load
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsResolving(false);
    }, 1200);
    return () => clearTimeout(timer);
  }, []);

  const resolvedSession = useMemo<Session | null>(() => {
    const allSessions = propSessions && propSessions.length > 0 ? propSessions : internalSessions;

    if (activeToken) {
      const clean = activeToken.trim().toLowerCase();

      // 1. Direct match with publicSessionToken
      const byToken = allSessions.find((s) => s.publicSessionToken?.toLowerCase() === clean);
      if (byToken) return byToken;

      // 2. Direct match with session ID
      const byId = allSessions.find((s) => s.id.toLowerCase() === clean);
      if (byId) return byId;

      // 3. Match suffix of session ID (e.g. sess_1788606065429_tw74i -> tw74i)
      const bySuffix = allSessions.find((s) => s.id.toLowerCase().endsWith(clean));
      if (bySuffix) return bySuffix;
    }

    // 4. Fallback for legacy query string URLs (backward compatibility)
    if (legacyParams && legacyParams.sessionId) {
      return {
        id: legacyParams.sessionId,
        publicSessionToken: activeToken || legacyParams.sessionId.slice(-6),
        machineId: legacyParams.machineId,
        machineName: legacyParams.machineName,
        packageId: 'legacy_pkg',
        packageName: legacyParams.packageName,
        durationMinutes: legacyParams.durationMinutes,
        price: legacyParams.price,
        customerName: legacyParams.customerName,
        startTime: legacyParams.startTime,
        endTime: legacyParams.endTime,
        accumulatedPauseMs: legacyParams.accumulatedPauseMs,
        isPaused: legacyParams.isPaused,
        status: 'ACTIVE',
      };
    }

    return null;
  }, [propSessions, internalSessions, activeToken, legacyParams]);

  // Once session is found, dismiss resolving indicator immediately
  useEffect(() => {
    if (resolvedSession) {
      setIsResolving(false);
    }
  }, [resolvedSession]);

  const activeMachine = useMemo(() => {
    const allMachines = propMachines && propMachines.length > 0 ? propMachines : internalMachines;
    if (!resolvedSession) return null;
    return allMachines.find((m) => m.id === resolvedSession.machineId) || null;
  }, [propMachines, internalMachines, resolvedSession]);

  const businessName = propSettings?.businessName || internalSettings.businessName || 'FUN RIDE RC ZONE';
  const machineName = resolvedSession?.machineName || activeMachine?.name || legacyParams?.machineName || 'RC Machine';
  const machineType = activeMachine?.type || legacyParams?.machineType || 'excavator';
  const customerName = resolvedSession?.customerName || legacyParams?.customerName || 'Pelanggan';
  const packageName = resolvedSession?.packageName || legacyParams?.packageName || 'Sesi Standard';
  const durationMinutes = resolvedSession?.durationMinutes || legacyParams?.durationMinutes || 20;
  const startTime = resolvedSession?.startTime || legacyParams?.startTime || Date.now();
  const rawEndTime = resolvedSession?.endTime || legacyParams?.endTime || startTime + durationMinutes * 60 * 1000;
  const isPaused = Boolean(resolvedSession?.isPaused);
  const pausedAt = resolvedSession?.pausedAt;
  const sessionStatus = resolvedSession?.status || 'ACTIVE';

  const [now, setNow] = useState<number>(Date.now());
  const [audioContextReady, setAudioContextReady] = useState<boolean>(false);
  const [isAlarmPlaying, setIsAlarmPlaying] = useState<boolean>(false);
  const [hasStoppedAlarm, setHasStoppedAlarm] = useState<boolean>(false);
  const [stopSuccessMessage, setStopSuccessMessage] = useState<string | null>(null);
  const [showShareToast, setShowShareToast] = useState<boolean>(false);
  const [showEarlyFinishConfirm, setShowEarlyFinishConfirm] = useState<boolean>(false);
  const [supportModalOpen, setSupportModalOpen] = useState<boolean>(false);

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

  // Unlock AudioContext on ANY first touch / click across the mobile screen
  const unlockAudioContext = useCallback(() => {
    try {
      if (!audioCtxRef.current) {
        const AudioCtxClass =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (AudioCtxClass) {
          audioCtxRef.current = new AudioCtxClass();
        }
      }
      if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume();
      }
      setAudioContextReady(true);
    } catch (e) {
      console.warn('Audio Context unlock error:', e);
    }
  }, []);

  // Global listener to silently auto-prime AudioContext on first touch
  useEffect(() => {
    const handleFirstGesture = () => {
      unlockAudioContext();
      window.removeEventListener('click', handleFirstGesture);
      window.removeEventListener('touchstart', handleFirstGesture);
      window.removeEventListener('touchend', handleFirstGesture);
    };

    window.addEventListener('click', handleFirstGesture, { once: true });
    window.addEventListener('touchstart', handleFirstGesture, { once: true });
    window.addEventListener('touchend', handleFirstGesture, { once: true });

    return () => {
      window.removeEventListener('click', handleFirstGesture);
      window.removeEventListener('touchstart', handleFirstGesture);
      window.removeEventListener('touchend', handleFirstGesture);
    };
  }, [unlockAudioContext]);

  // Calculate live remaining time accounting for pause state
  const effectiveNow = isPaused && pausedAt ? pausedAt : now;
  const totalDurationMs = Math.max(1000, durationMinutes * 60 * 1000);
  const elapsedMs = Math.max(0, effectiveNow - startTime);
  const remainingMs = Math.max(0, rawEndTime - effectiveNow);
  const remainingSeconds = Math.ceil(remainingMs / 1000);
  const progressPercent = Math.min(100, Math.max(0, (elapsedMs / totalDurationMs) * 100));

  const isTimeUp = !isPaused && now >= rawEndTime && sessionStatus !== 'COMPLETED';
  const isEndingSoon = !isTimeUp && !isPaused && remainingSeconds <= 60 && sessionStatus === 'ACTIVE';

  // Sound Synthesizer: Loud Motorsport Alarm Siren
  const playSirenChime = useCallback(() => {
    try {
      if (!audioCtxRef.current) {
        const AudioCtxClass =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (AudioCtxClass) {
          audioCtxRef.current = new AudioCtxClass();
        }
      }
      const ctx = audioCtxRef.current;
      if (!ctx) return;

      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      // Motorsport energetic siren fanfare (D5, F#5, A5, D6, A5, D6)
      const melody = [587.33, 739.99, 880.0, 1174.66, 880.0, 1174.66];
      melody.forEach((freq, idx) => {
        const noteStart = ctx.currentTime + idx * 0.14;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, noteStart);

        gain.gain.setValueAtTime(0, noteStart);
        gain.gain.linearRampToValueAtTime(0.45, noteStart + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, noteStart + 0.32);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(noteStart);
        osc.stop(noteStart + 0.32);
      });
    } catch (e) {
      console.warn('Play siren error:', e);
    }
  }, []);

  // Trigger Alarm when time hits 0
  useEffect(() => {
    if (isTimeUp && !alarmFiredRef.current && !hasStoppedAlarm && sessionStatus === 'ACTIVE') {
      alarmFiredRef.current = true;
      setIsAlarmPlaying(true);

      // Play continuous alarm siren loop
      playSirenChime();
      if (alarmIntervalRef.current) clearInterval(alarmIntervalRef.current);
      alarmIntervalRef.current = window.setInterval(() => {
        playSirenChime();
      }, 1900);

      // Trigger phone vibration
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        try {
          navigator.vibrate([500, 250, 500, 250, 1000]);
        } catch (e) {}
      }
    }
  }, [isTimeUp, hasStoppedAlarm, sessionStatus, playSirenChime]);

  // Customer Action: STOP ALARM (Masa Tamat)
  const handleStopAlarm = async () => {
    if (alarmIntervalRef.current) {
      clearInterval(alarmIntervalRef.current);
      alarmIntervalRef.current = null;
    }
    setIsAlarmPlaying(false);
    setHasStoppedAlarm(true);
    setStopSuccessMessage('✅ Penggera telah dimatikan. Notifikasi dihantar ke kaunter Admin.');

    if (resolvedSession) {
      await notifyCustomerAlarmStopped(
        resolvedSession.id,
        resolvedSession.machineId,
        resolvedSession.machineName,
        resolvedSession.customerName || customerName,
        'TIME_UP_STOPPED'
      );
    }
  };

  // Customer Action: SELESAIKAN SESI LEBIH AWAL
  const handleConfirmEarlyFinish = async () => {
    if (alarmIntervalRef.current) {
      clearInterval(alarmIntervalRef.current);
      alarmIntervalRef.current = null;
    }
    setIsAlarmPlaying(false);
    setHasStoppedAlarm(true);
    setShowEarlyFinishConfirm(false);
    setStopSuccessMessage('🏁 Anda telah menamatkan sesi lebih awal. Sila pulangkan alat kawalan kepada staf.');

    if (resolvedSession) {
      await notifyCustomerAlarmStopped(
        resolvedSession.id,
        resolvedSession.machineId,
        resolvedSession.machineName,
        resolvedSession.customerName || customerName,
        'EARLY_STOPPED'
      );
    }
  };

  // Native Web Share or Copy Link (Copies short live URL)
  const handleShare = async () => {
    if (typeof window === 'undefined') return;
    const url = resolvedSession ? getLiveSessionUrl(resolvedSession) : window.location.href;
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

  const getMachineIcon = () => {
    try {
      const initial = loadInitialData();
      const resolved = resolveAssetType(machineType, initial.assetTypes);
      return resolved.icon || '🏎️';
    } catch {
      return '🏎️';
    }
  };

  // 4. Loading / Resolving View (Clean high-tech skeleton)
  if (isResolving && !resolvedSession) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0b121e] via-[#080d16] to-[#05080e] text-slate-100 flex flex-col items-center justify-center p-6 text-center select-none font-sans">
        <div className="w-16 h-16 rounded-3xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 mb-4 animate-pulse shadow-lg shadow-amber-500/20">
          <Radio className="w-8 h-8 animate-spin" />
        </div>
        <span className="text-xs font-mono font-black uppercase tracking-widest text-amber-400 block mb-1">
          {businessName}
        </span>
        <h2 className="text-xl font-chakra font-black uppercase text-white tracking-wide mb-2">
          Menyambung ke Live Telemetri...
        </h2>
        <p className="text-xs font-mono text-slate-400 max-w-xs leading-relaxed">
          Menyegerakkan data sesi masa nyata dengan kaunter RC Zone. Sila tunggu sebentar.
        </p>
      </div>
    );
  }

  // 5. Not Found / Expired Session View
  if (!resolvedSession) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#140b10] via-[#0e080c] to-[#080406] text-slate-100 flex flex-col justify-between p-6 select-none font-sans">
        <header className="w-full max-w-md mx-auto flex items-center justify-between pb-3 border-b border-slate-800">
          <span className="text-xs font-mono font-black uppercase tracking-widest text-amber-400">
            {businessName}
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
            DISCONNECTED
          </span>
        </header>

        <main className="w-full max-w-md mx-auto text-center py-10 space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 mx-auto shadow-lg shadow-rose-500/10">
            <AlertTriangle className="w-8 h-8" />
          </div>

          <h2 className="text-2xl font-chakra font-black uppercase text-white tracking-wide">
            Sesi Tidak Ditemui
          </h2>

          <div className="p-4 rounded-2xl bg-[#110d13] border border-rose-500/30 text-xs font-mono space-y-2">
            <p className="text-rose-300 font-bold">
              Pautan sesi ini mungkin telah tamat tempoh, telah dipadamkan, atau token tidak sah.
            </p>
            {activeToken && (
              <div className="text-[11px] text-slate-400">
                Token dicari: <span className="font-bold text-amber-400 font-mono">#{activeToken}</span>
              </div>
            )}
            <p className="text-[11px] text-slate-500">
              Sila pastikan anda mengimbas kod QR terkini di kaunter atau hubungi staf bertugas.
            </p>
          </div>

          <div className="flex gap-2 justify-center pt-2">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-chakra font-black text-xs uppercase tracking-wider flex items-center gap-1.5 shadow active:scale-95 cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Muat Semula</span>
            </button>

            {onBackToDashboard && (
              <button
                type="button"
                onClick={onBackToDashboard}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-chakra font-black text-xs uppercase tracking-wider active:scale-95 cursor-pointer"
              >
                Ke Kaunter
              </button>
            )}
          </div>
        </main>

        <footer className="w-full max-w-md mx-auto text-center pt-3 border-t border-slate-800 text-[11px] font-mono text-slate-500">
          Sistem Pengurusan RC Zone • Telemetri Sesi
        </footer>
      </div>
    );
  }

  // 6. Active Live Session View
  return (
    <div
      onClick={unlockAudioContext}
      onTouchStart={unlockAudioContext}
      className={`min-h-screen flex flex-col justify-between text-slate-100 font-sans p-4 sm:p-6 transition-colors duration-500 select-none ${
        sessionStatus === 'COMPLETED'
          ? 'bg-gradient-to-b from-[#0b1b15] via-[#08130e] to-[#040907]'
          : isTimeUp
          ? 'bg-gradient-to-b from-[#2a0b12] via-[#1a080d] to-[#0a0406]'
          : isEndingSoon
          ? 'bg-gradient-to-b from-[#24170a] via-[#151008] to-[#0b0c10]'
          : isPaused
          ? 'bg-gradient-to-b from-[#1c160c] via-[#120f09] to-[#08090d]'
          : 'bg-gradient-to-b from-[#0b121e] via-[#080d16] to-[#05080e]'
      }`}
    >
      {/* Background Motorsport Ambient Glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div
          className={`absolute -top-40 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full blur-3xl opacity-25 transition-all duration-700 ${
            sessionStatus === 'COMPLETED'
              ? 'bg-emerald-500'
              : isTimeUp
              ? 'bg-rose-500'
              : isEndingSoon
              ? 'bg-amber-500'
              : isPaused
              ? 'bg-amber-400'
              : 'bg-amber-400'
          }`}
        ></div>
      </div>

      {/* Top Header & Telemetry Status */}
      <header className="relative z-10 w-full max-w-md mx-auto flex items-center justify-between pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center p-1.5 shadow-md">
            <AssetIcon icon={getMachineIcon()} name={machineName} size="md" className="w-5 h-5" />
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

        {/* Live Status Indicator */}
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#101927] border border-slate-700 text-[11px] font-mono font-bold">
          {sessionStatus === 'COMPLETED' ? (
            <>
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span className="text-emerald-300">SELESAI</span>
            </>
          ) : isPaused ? (
            <>
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
              <span className="text-amber-300">DIHENTIKAN</span>
            </>
          ) : (
            <>
              <span
                className={`w-2 h-2 rounded-full ${isTimeUp ? 'bg-rose-500 animate-ping' : 'bg-emerald-400 animate-pulse'}`}
              ></span>
              <span className={isTimeUp ? 'text-rose-400' : 'text-emerald-300'}>
                {isTimeUp ? 'TIME UP' : 'LIVE'}
              </span>
            </>
          )}
        </div>
      </header>

      {/* Main Container Content */}
      <main className="relative z-10 w-full max-w-md mx-auto my-auto py-4 space-y-4">
        {/* Automatic Alarm Auto-Armed Badge */}
        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-500/15 via-[#101927] to-emerald-500/15 border border-emerald-500/40 flex items-center justify-between gap-3 shadow-lg shadow-emerald-500/5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-400/50 flex items-center justify-center text-emerald-400 shrink-0">
              <ShieldCheck className="w-4.5 h-4.5" />
            </div>
            <div>
              <p className="text-[11px] font-black text-emerald-300 uppercase tracking-wide flex items-center gap-1.5">
                <span>Penggera Telefon Automatik Aktif</span>
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              </p>
              <p className="text-[10px] text-slate-300 font-mono">
                Siren akan berdering secara automatik di telefon anda apabila masa tamat.
              </p>
            </div>
          </div>
          <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[9px] font-mono font-black uppercase tracking-wider shrink-0">
            AUTO-ARMED
          </span>
        </div>

        {/* PAUSED BANNER NOTICE IF ADMIN PAUSED SESSION */}
        {isPaused && (
          <div className="p-4 rounded-3xl bg-amber-500/20 border-2 border-amber-400 text-amber-200 text-center shadow-lg space-y-1.5 animate-pulse">
            <div className="flex items-center justify-center gap-2 text-amber-300 font-chakra font-black text-sm uppercase tracking-wide">
              <PauseCircle className="w-5 h-5" />
              <span>SESI DIHENTIKAN SEMENTARA</span>
            </div>
            <p className="text-xs font-mono text-amber-200/90">
              Sesi anda dihentikan seketika oleh staf (contoh: pertukaran bateri). Masa anda dibekukan dan tidak akan ditolak!
            </p>
          </div>
        )}

        {/* COMPLETED BANNER NOTICE */}
        {sessionStatus === 'COMPLETED' && (
          <div className="p-4 rounded-3xl bg-emerald-500/20 border-2 border-emerald-400 text-emerald-200 text-center shadow-lg space-y-2">
            <div className="text-3xl">🏁</div>
            <h2 className="text-lg font-chakra font-black tracking-wider uppercase text-emerald-300">
              SESI TELAH SELESAI
            </h2>
            <p className="text-xs font-mono text-emerald-200">
              Terima kasih telah bermain di {businessName}! Sila serahkan alat kawalan kepada staf bertugas.
            </p>
          </div>
        )}

        {/* TIME UP ALARM ACTIVE BANNER (SIREN PLAYING) */}
        {isTimeUp && isAlarmPlaying && (
          <div className="p-4 rounded-3xl bg-rose-600 border-2 border-rose-400 text-white text-center shadow-2xl shadow-rose-600/60 animate-bounce space-y-3">
            <div className="text-3xl">🚨</div>
            <h2 className="text-xl font-chakra font-black tracking-wider uppercase">
              MASA ANDA TELAH TAMAT!
            </h2>
            <p className="text-xs text-rose-100 font-mono">
              Penggera siren sedang berdering di telefon anda. Sila hentikan penggera dan pulangkan alat kawalan.
            </p>
            <button
              type="button"
              id="btn-customer-stop-alarm"
              onClick={handleStopAlarm}
              className="w-full py-3.5 px-4 rounded-2xl bg-white hover:bg-slate-100 text-rose-950 font-chakra font-black text-sm uppercase tracking-wider shadow-xl active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <VolumeX className="w-5 h-5 text-rose-600" />
              <span>🛑 HENTIKAN PENGGERA (STOP)</span>
            </button>
          </div>
        )}

        {/* STOP CONFIRMATION NOTICE */}
        {stopSuccessMessage && (
          <div className="p-3.5 rounded-2xl bg-emerald-500/20 border border-emerald-400/60 text-emerald-200 text-xs font-mono text-center flex items-center justify-center gap-2 shadow-lg">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{stopSuccessMessage}</span>
          </div>
        )}

        {/* Live Digital Timer Card */}
        <div
          className={`p-6 rounded-3xl border relative overflow-hidden backdrop-blur-md transition-all duration-300 shadow-2xl ${
            sessionStatus === 'COMPLETED'
              ? 'bg-[#0f1c16]/90 border-emerald-500/60 shadow-emerald-950/40'
              : isTimeUp
              ? 'bg-[#180d12]/90 border-rose-500/60 shadow-rose-950/40'
              : isEndingSoon
              ? 'bg-[#1a140a]/90 border-amber-400/60 shadow-amber-950/40'
              : 'bg-[#0f1725]/90 border-slate-700/80 shadow-slate-950/50'
          }`}
        >
          {/* Progress Bar (Top) */}
          <div className="absolute top-0 left-0 right-0 h-2 bg-slate-800/80">
            <div
              className={`h-full transition-all duration-500 ${
                sessionStatus === 'COMPLETED'
                  ? 'bg-emerald-400 w-full'
                  : isTimeUp
                  ? 'bg-rose-500 w-full animate-pulse'
                  : isEndingSoon
                  ? 'bg-amber-400'
                  : 'bg-gradient-to-r from-amber-500 via-amber-400 to-amber-300'
              }`}
              style={{ width: sessionStatus === 'COMPLETED' ? '100%' : `${progressPercent}%` }}
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
              <span className="text-sm font-mono font-bold text-amber-400 flex items-center justify-end gap-1.5">
                <AssetIcon
                  icon={getMachineIcon()}
                  name={machineName}
                  size="sm"
                  className="w-4 h-4 inline-block"
                />
                <span>{machineName}</span>
              </span>
            </div>
          </div>

          {/* Main Giant Countdown Clock */}
          <div className="text-center py-3">
            <span className="text-[11px] font-mono font-black uppercase tracking-widest text-slate-400 block mb-1">
              {sessionStatus === 'COMPLETED'
                ? 'SESI TELAH SELESAI'
                : isPaused
                ? 'MASA DIHENTIKAN SEMENTARA'
                : isTimeUp
                ? 'TEMPOH TAMAT'
                : 'BAKI MASA SESI'}
            </span>
            <div
              className={`text-6xl sm:text-7xl font-mono font-black tracking-tight filter drop-shadow-lg ${
                sessionStatus === 'COMPLETED'
                  ? 'text-emerald-400'
                  : isPaused
                  ? 'text-amber-300 animate-pulse'
                  : isTimeUp
                  ? 'text-rose-500 animate-pulse'
                  : isEndingSoon
                  ? 'text-amber-400 animate-pulse'
                  : 'text-white'
              }`}
            >
              {sessionStatus === 'COMPLETED' ? '00:00' : formatTimeRemaining(remainingSeconds)}
            </div>
            <div className="flex items-center justify-center gap-2 mt-2">
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold ${
                  sessionStatus === 'COMPLETED'
                    ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/40'
                    : isPaused
                    ? 'bg-amber-950/80 text-amber-300 border border-amber-500/40'
                    : isTimeUp
                    ? 'bg-rose-950/80 text-rose-300 border border-rose-500/40'
                    : isEndingSoon
                    ? 'bg-amber-950/80 text-amber-300 border border-amber-500/40 animate-pulse'
                    : 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/40'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>
                  {sessionStatus === 'COMPLETED'
                    ? 'Sesi Ditamatkan'
                    : isPaused
                    ? 'Masa Dibekukan (Pause)'
                    : isTimeUp
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
            <span className="text-slate-400">Pakej Sesi:</span>
            <span className="font-bold text-white">{packageName}</span>
          </div>
          <div className="flex items-center justify-between text-slate-300">
            <span className="text-slate-400">Tempoh Keseluruhan:</span>
            <span className="font-bold text-amber-300">{durationMinutes} Minit</span>
          </div>
          <div className="flex items-center justify-between text-slate-300">
            <span className="text-slate-400">Status Penggera Telefon:</span>
            <span className="flex items-center gap-1.5 font-bold text-emerald-400">
              <Volume2 className="w-3.5 h-3.5" />
              <span>Automatik Aktif (Auto-Armed)</span>
            </span>
          </div>
        </div>

        {/* Early Finish Action Button (Customer can stop anytime) */}
        {!isTimeUp && !hasStoppedAlarm && sessionStatus === 'ACTIVE' && (
          <div>
            {!showEarlyFinishConfirm ? (
              <button
                type="button"
                id="btn-customer-early-finish"
                onClick={() => setShowEarlyFinishConfirm(true)}
                className="w-full p-3 rounded-2xl bg-[#131d2e] hover:bg-[#18263c] border border-slate-700/80 hover:border-amber-400/50 text-slate-300 hover:text-amber-300 font-chakra font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer"
              >
                <Hand className="w-4 h-4 text-amber-400" />
                <span>Hentikan / Selesaikan Sesi Lebih Awal</span>
              </button>
            ) : (
              <div className="p-3.5 rounded-2xl bg-amber-500/15 border-2 border-amber-500/50 space-y-2 animate-in fade-in">
                <p className="text-xs font-mono text-amber-200 text-center font-bold">
                  Adakah anda pasti mahu menamatkan sesi RC sekarang?
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={handleConfirmEarlyFinish}
                    className="py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-chakra font-black text-xs uppercase tracking-wider shadow active:scale-95 cursor-pointer text-center"
                  >
                    Ya, Tamatkan Sesi
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowEarlyFinishConfirm(false)}
                    className="py-2 px-3 rounded-xl bg-[#101723] hover:bg-slate-800 text-slate-300 border border-slate-700 font-chakra font-black text-xs uppercase tracking-wider active:scale-95 cursor-pointer text-center"
                  >
                    Batal
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons: Share & Test Siren */}
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={handleShare}
            className="p-3 rounded-xl bg-[#131d2e] hover:bg-[#18263c] border border-slate-700/80 text-slate-200 font-chakra font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer"
          >
            <Share2 className="w-4 h-4 text-amber-400" />
            <span>Kongsi Pautan</span>
          </button>

          <button
            type="button"
            onClick={() => {
              unlockAudioContext();
              playSirenChime();
            }}
            className="p-3 rounded-xl bg-[#131d2e] hover:bg-[#18263c] border border-slate-700/80 text-slate-200 font-chakra font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer"
          >
            <Bell className="w-4 h-4 text-amber-400" />
            <span>Uji Siren Speaker</span>
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
          Kekalkan skrin ini dibuka. Sistem keselamatan akan memaklumkan kaunter apabila penggera dihentikan.
        </p>

        <div className="flex items-center justify-center gap-3 pt-0.5">
          <button
            type="button"
            id="btn-customer-footer-support"
            onClick={() => setSupportModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/5 text-white/50 hover:text-white/80 text-[11px] font-normal normal-case transition-colors cursor-pointer"
            title="Sokong Inovasi Ini"
          >
            <span>Support</span>
            <span className="text-rose-400/60">❤️</span>
          </button>

          {onBackToDashboard && (
            <>
              <span className="text-slate-700">&bull;</span>
              <button
                type="button"
                onClick={onBackToDashboard}
                className="text-[11px] font-mono text-amber-400/80 hover:text-amber-300 underline cursor-pointer"
              >
                Kembali ke Dashboard Pengurusan Admin
              </button>
            </>
          )}
        </div>
      </footer>

      {/* Support Popup Modal */}
      <SupportModal
        isOpen={supportModalOpen}
        onClose={() => setSupportModalOpen(false)}
      />
    </div>
  );
};
