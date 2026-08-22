import React, { useState, useEffect } from 'react';
import { 
  Volume2, 
  VolumeX, 
  Sun, 
  Moon,
  Users, 
  Receipt, 
  Settings, 
  Plus, 
  BellRing,
  Activity,
  Radio,
  Zap,
  CheckCircle2,
  Clock,
  Sparkles,
  ShieldCheck
} from 'lucide-react';
import { AppSettings, Machine, Session, QueueItem } from '../types';
import { deriveMachineStatus } from '../utils/format';
import { playTapSound } from '../utils/sound';

interface HeaderProps {
  settings: AppSettings;
  onUpdateSettings: (newSettings: AppSettings) => void;
  machines: Machine[];
  sessions: Session[];
  queue: QueueItem[];
  nowTimestamp: number;
  onOpenNewSession: () => void;
  onOpenQueue: () => void;
  onOpenTransactions: () => void;
  onOpenSettings: () => void;
  wakeLockActive: boolean;
  onToggleWakeLock: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  settings,
  onUpdateSettings,
  machines,
  sessions,
  queue,
  nowTimestamp,
  onOpenNewSession,
  onOpenQueue,
  onOpenTransactions,
  onOpenSettings,
  wakeLockActive,
  onToggleWakeLock,
}) => {
  const [timeString, setTimeString] = useState<string>('');
  const [dateString, setDateString] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeString(
        now.toLocaleTimeString('ms-MY', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        })
      );
      setDateString(
        now.toLocaleDateString('ms-MY', {
          weekday: 'short',
          day: 'numeric',
          month: 'short',
          year: 'numeric'
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Compute live machine counts
  const sessionMap = new Map<string, Session>(
    sessions.filter((s) => s.status === 'ACTIVE').map((s) => [s.machineId, s])
  );

  let readyCount = 0;
  let runningCount = 0;
  let endingSoonCount = 0;
  let timeUpCount = 0;

  machines.forEach((m) => {
    const activeSession = sessionMap.get(m.id);
    const liveStatus = deriveMachineStatus(m.status, activeSession, nowTimestamp, settings.endingSoonThresholdSeconds);
    if (liveStatus === 'READY') readyCount++;
    else if (liveStatus === 'RUNNING') runningCount++;
    else if (liveStatus === 'ENDING_SOON') endingSoonCount++;
    else if (liveStatus === 'TIME_UP') timeUpCount++;
  });

  const handleToggleSound = () => {
    playTapSound(settings.soundEnabled);
    const next = !settings.soundEnabled;
    onUpdateSettings({ ...settings, soundEnabled: next });
  };

  return (
    <header className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-b border-slate-200/80 dark:border-slate-800/80 sticky top-0 z-30 shadow-xs transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 sm:py-3.5">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 lg:gap-4">
          
          {/* Top/Left: Brand Logo & Title */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 sm:gap-3.5">
              {/* Brand Icon Badge */}
              <div className="relative group">
                <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 p-0.5 shadow-md shadow-blue-500/20 ring-2 ring-blue-500/20 group-hover:ring-blue-500/40 transition-all flex items-center justify-center">
                  <div className="w-full h-full bg-slate-900/40 rounded-[14px] flex items-center justify-center backdrop-blur-xs">
                    <Radio className="w-5 h-5 sm:w-6 sm:h-6 text-white animate-pulse" />
                  </div>
                </div>
                {/* Live Online Ping Indicator */}
                <span className="absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-white dark:border-slate-900"></span>
                </span>
              </div>

              {/* Title and Metadata */}
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/50">
                    <Zap className="w-2.5 h-2.5 text-blue-500 fill-blue-500" />
                    <span>Syncrozz SES v4.3</span>
                  </span>
                  <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    ONLINE
                  </span>
                </div>

                <div className="flex items-center flex-wrap gap-x-2.5 gap-y-0.5 mt-0.5">
                  <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                    {settings.businessName.toUpperCase()}
                  </h1>
                  <span className="px-2 py-0.5 rounded-md text-[11px] font-black uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-blue-600 dark:text-blue-400 border border-slate-200 dark:border-slate-700/60 shadow-2xs">
                    CONTROL BOARD
                  </span>
                </div>
              </div>
            </div>

            {/* Mobile Actions Shortcut (Visible on screens < lg) */}
            <div className="flex items-center gap-1.5 lg:hidden">
              <button
                type="button"
                id="btn-mobile-sound-toggle"
                onClick={handleToggleSound}
                className={`p-2.5 rounded-xl border transition-all active:scale-95 ${
                  settings.soundEnabled
                    ? 'bg-blue-50 border-blue-200 text-blue-600 dark:bg-slate-800 dark:border-slate-700 dark:text-blue-400'
                    : 'bg-slate-100 border-slate-200 text-slate-400 dark:bg-slate-800 dark:border-slate-700'
                }`}
                title={settings.soundEnabled ? 'Bunyi Aktif' : 'Bunyi Dimatikan'}
              >
                {settings.soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </button>

              <button
                type="button"
                id="btn-mobile-new-session"
                onClick={() => {
                  playTapSound(settings.soundEnabled);
                  onOpenNewSession();
                }}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black px-3.5 py-2.5 rounded-xl flex items-center gap-1.5 text-xs shadow-md shadow-blue-500/25 active:scale-95 transition-all"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>+ SESI</span>
              </button>
            </div>
          </div>

          {/* Right Section: Status Pills, Clock & Desktop Toolbar */}
          <div className="flex flex-wrap items-center justify-between lg:justify-end gap-2.5 sm:gap-3.5">
            
            {/* Live Metrics Pill Group (HUD Capsule) */}
            <div className="flex items-center gap-1.5 sm:gap-2 bg-slate-100/90 dark:bg-slate-800/80 p-1 rounded-2xl border border-slate-200/80 dark:border-slate-700/70 shadow-2xs backdrop-blur-sm">
              
              {/* Ready Pill */}
              <div 
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white/80 dark:bg-slate-900/60 border border-slate-200/50 dark:border-slate-700/40 text-xs font-bold shadow-2xs"
                title="Mesin Sedia Digunakan"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-emerald-500/30"></span>
                <span className="text-emerald-700 dark:text-emerald-400 font-extrabold">{readyCount}</span>
                <span className="text-slate-500 dark:text-slate-400 text-[11px] hidden sm:inline">Sedia</span>
              </div>

              {/* Running Pill */}
              <div 
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white/80 dark:bg-slate-900/60 border border-slate-200/50 dark:border-slate-700/40 text-xs font-bold shadow-2xs"
                title="Sesi Sedang Berjalan"
              >
                <span className="w-2 h-2 rounded-full bg-blue-500 ring-2 ring-blue-500/30 animate-pulse"></span>
                <span className="text-blue-700 dark:text-blue-400 font-extrabold">{runningCount + endingSoonCount}</span>
                <span className="text-slate-500 dark:text-slate-400 text-[11px] hidden sm:inline">Aktif</span>
              </div>

              {/* Time Up Alert Pill */}
              {timeUpCount > 0 && (
                <div 
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-rose-600 text-white text-xs font-black shadow-md shadow-rose-500/30 animate-bounce"
                  title="Ada sesi yang masa telah tamat!"
                >
                  <BellRing className="w-3.5 h-3.5 text-white animate-wiggle" />
                  <span>{timeUpCount} Tamat!</span>
                </div>
              )}
            </div>

            {/* Smart System Clock & Calendar Tile */}
            <div className="hidden md:flex items-center gap-2.5 px-3 py-1.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/70 dark:border-slate-700/50 shadow-2xs">
              <Clock className="w-4 h-4 text-blue-500 dark:text-blue-400 shrink-0" />
              <div className="flex flex-col text-left leading-tight">
                <span className="text-xs font-mono font-black text-slate-800 dark:text-slate-200 tracking-tight">
                  {timeString}
                </span>
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider">
                  {dateString}
                </span>
              </div>
            </div>

            {/* Desktop Action Buttons Toolbar */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              
              {/* Queue Button */}
              <button
                type="button"
                id="btn-header-queue"
                onClick={() => {
                  playTapSound(settings.soundEnabled);
                  onOpenQueue();
                }}
                className="relative px-3 py-2 rounded-xl bg-slate-100/90 hover:bg-slate-200 dark:bg-slate-800/90 dark:hover:bg-slate-700 border border-slate-200/80 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-2xs"
                title="Senarai Menunggu (Queue)"
              >
                <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span className="hidden xl:inline">Menunggu</span>
                {queue.length > 0 ? (
                  <span className="bg-amber-500 text-slate-950 font-black px-1.5 py-0.5 rounded-full text-[10px] min-w-4 text-center">
                    {queue.length}
                  </span>
                ) : (
                  <span className="text-slate-400 text-[10px] hidden sm:inline">(0)</span>
                )}
              </button>

              {/* Transactions History */}
              <button
                type="button"
                id="btn-header-transactions"
                onClick={() => {
                  playTapSound(settings.soundEnabled);
                  onOpenTransactions();
                }}
                className="px-3 py-2 rounded-xl bg-slate-100/90 hover:bg-slate-200 dark:bg-slate-800/90 dark:hover:bg-slate-700 border border-slate-200/80 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-2xs"
                title="Rekod Transaksi / Sesi Hari Ini"
              >
                <Receipt className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span className="hidden xl:inline">Transaksi</span>
              </button>

              {/* Audio Toggle */}
              <button
                type="button"
                id="btn-header-sound"
                onClick={handleToggleSound}
                className={`hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-bold transition-all active:scale-95 cursor-pointer shadow-2xs ${
                  settings.soundEnabled
                    ? 'bg-blue-50/80 border-blue-200 text-blue-700 dark:bg-blue-950/40 dark:border-blue-800 dark:text-blue-300'
                    : 'bg-slate-100/90 border-slate-200 text-slate-400 dark:bg-slate-800/90 dark:border-slate-700 dark:text-slate-500'
                }`}
                title={settings.soundEnabled ? 'Bunyi Aktif' : 'Bunyi Dimatikan'}
              >
                {settings.soundEnabled ? (
                  <>
                    <Volume2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span className="hidden lg:inline">Audio ON</span>
                  </>
                ) : (
                  <>
                    <VolumeX className="w-4 h-4" />
                    <span className="hidden lg:inline">Audio OFF</span>
                  </>
                )}
              </button>

              {/* Screen Wake Lock */}
              <button
                type="button"
                id="btn-header-wakelock"
                onClick={onToggleWakeLock}
                className={`hidden md:flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-bold transition-all active:scale-95 cursor-pointer shadow-2xs ${
                  wakeLockActive
                    ? 'bg-amber-50/90 border-amber-300 text-amber-900 dark:bg-amber-950/40 dark:border-amber-700 dark:text-amber-300'
                    : 'bg-slate-100/90 border-slate-200 text-slate-600 dark:bg-slate-800/90 dark:border-slate-700 dark:text-slate-400'
                }`}
                title="Kekalkan skrin sentiasa menyala tanpa mati"
              >
                <Sun className={`w-4 h-4 ${wakeLockActive ? 'text-amber-500 animate-[spin_10s_linear_infinite]' : 'text-slate-400'}`} />
                <span className="hidden lg:inline">{wakeLockActive ? 'Skrin Awake' : 'Skrin Auto'}</span>
              </button>

              {/* Settings Button */}
              <button
                type="button"
                id="btn-header-settings"
                onClick={() => {
                  playTapSound(settings.soundEnabled);
                  onOpenSettings();
                }}
                className="p-2.5 rounded-xl bg-slate-100/90 hover:bg-slate-200 dark:bg-slate-800/90 dark:hover:bg-slate-700 border border-slate-200/80 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all active:scale-95 cursor-pointer shadow-2xs"
                title="Tetapan Mesin & Sistem"
              >
                <Settings className="w-4 h-4 hover:rotate-45 transition-transform duration-300" />
              </button>

              {/* Big Primary New Session Button (Desktop) */}
              <button
                type="button"
                id="btn-header-new-session"
                onClick={() => {
                  playTapSound(settings.soundEnabled);
                  onOpenNewSession();
                }}
                className="hidden sm:flex items-center gap-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:via-indigo-500 hover:to-blue-600 text-white font-extrabold px-5 py-2.5 rounded-xl text-xs shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 transition-all duration-200 cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span className="tracking-wide uppercase">NEW SESSION</span>
              </button>
            </div>

          </div>
        </div>
      </div>
    </header>
  );
};
