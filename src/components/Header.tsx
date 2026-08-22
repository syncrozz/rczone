import React, { useState, useEffect } from 'react';
import { 
  Trophy, 
  Volume2, 
  VolumeX, 
  Sun, 
  Users, 
  Receipt, 
  Settings, 
  Plus, 
  BellRing,
  Activity
} from 'lucide-react';
import { AppSettings, Machine, Session, QueueItem } from '../types';
import { deriveMachineStatus } from '../utils/format';
import { playTapSound, playTimeUpAlarm } from '../utils/sound';

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
    <header className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30 shadow-xs backdrop-blur-md bg-white/95 dark:bg-slate-900/95">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 sm:py-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 sm:gap-4">
          
          {/* Brand & Eyebrow */}
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[11px] font-black tracking-[0.2em] text-slate-400 dark:text-slate-500 uppercase">
                  Syncrozz SES v4.3
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                  Control Board
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                <span>{settings.businessName.toUpperCase()}</span>
                <span className="text-blue-600 dark:text-blue-400">CONTROL BOARD</span>
              </h1>
            </div>

            {/* Mobile Action Controls */}
            <div className="flex items-center gap-2 lg:hidden">
              <button
                type="button"
                id="btn-mobile-sound-toggle"
                onClick={handleToggleSound}
                className={`p-2 rounded-xl border transition-colors ${
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
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 text-xs shadow-md shadow-blue-500/20 active:scale-95 transition-transform"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>SESI</span>
              </button>
            </div>
          </div>

          {/* Right Bento Modules: Clock, Live Pill Counts & Action Buttons */}
          <div className="flex flex-wrap items-center justify-between lg:justify-end gap-3 sm:gap-4">
            
            {/* Live Metrics Pill Group */}
            <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700/70 text-xs font-bold">
              <div className="flex items-center gap-1.5" title="Mesin Sedia">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
                <span className="text-emerald-700 dark:text-emerald-400">{readyCount} Sedia</span>
              </div>
              <span className="text-slate-300 dark:text-slate-600">•</span>
              <div className="flex items-center gap-1.5" title="Sesi Berjalan">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block"></span>
                <span className="text-blue-700 dark:text-blue-400">{runningCount + endingSoonCount} Aktif</span>
              </div>
              {timeUpCount > 0 && (
                <>
                  <span className="text-slate-300 dark:text-slate-600">•</span>
                  <div className="flex items-center gap-1.5 animate-bounce" title="Masa Tamat">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-600 inline-block"></span>
                    <span className="text-rose-600 dark:text-rose-400 font-black">{timeUpCount} Tamat!</span>
                  </div>
                </>
              )}
            </div>

            {/* System Clock Tile */}
            <div className="hidden sm:flex flex-col text-right px-2.5 py-1 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/60 dark:border-slate-700/40">
              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider">System Clock</p>
              <p className="text-sm font-mono font-black text-slate-800 dark:text-slate-200">{timeString}</p>
            </div>

            {/* Desktop Action Navigation */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              {/* Queue Button */}
              <button
                type="button"
                id="btn-header-queue"
                onClick={() => {
                  playTapSound(settings.soundEnabled);
                  onOpenQueue();
                }}
                className="relative px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Senarai Menunggu (Queue)"
              >
                <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span className="hidden md:inline">Menunggu</span>
                {queue.length > 0 && (
                  <span className="bg-slate-900 text-white dark:bg-blue-500 dark:text-slate-950 font-black px-1.5 py-0.2 rounded-full text-[10px]">
                    {queue.length}
                  </span>
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
                className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Rekod Transaksi / Sesi Hari Ini"
              >
                <Receipt className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span className="hidden md:inline">Transaksi</span>
              </button>

              {/* Sound Toggle */}
              <button
                type="button"
                id="btn-header-sound"
                onClick={handleToggleSound}
                className={`hidden md:flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-bold transition-colors cursor-pointer ${
                  settings.soundEnabled
                    ? 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-slate-800 dark:border-slate-700 dark:text-blue-400'
                    : 'bg-slate-100 border-slate-200 text-slate-400 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-500'
                }`}
                title={settings.soundEnabled ? 'Bunyi Aktif' : 'Bunyi Dimatikan'}
              >
                {settings.soundEnabled ? <Volume2 className="w-4 h-4 text-blue-600 dark:text-blue-400" /> : <VolumeX className="w-4 h-4" />}
                <span>{settings.soundEnabled ? 'Audio ON' : 'Audio OFF'}</span>
              </button>

              {/* Screen Wake Lock */}
              <button
                type="button"
                id="btn-header-wakelock"
                onClick={onToggleWakeLock}
                className={`hidden xl:flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-bold transition-colors cursor-pointer ${
                  wakeLockActive
                    ? 'bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-950/40 dark:border-amber-700/50 dark:text-amber-300'
                    : 'bg-slate-100 border-slate-200 text-slate-600 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400'
                }`}
                title="Kekalkan skrin sentiasa menyala"
              >
                <Sun className={`w-4 h-4 ${wakeLockActive ? 'text-amber-500' : 'text-slate-400'}`} />
                <span>{wakeLockActive ? 'Awake' : 'Sleep'}</span>
              </button>

              {/* Settings */}
              <button
                type="button"
                id="btn-header-settings"
                onClick={() => {
                  playTapSound(settings.soundEnabled);
                  onOpenSettings();
                }}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-slate-900 transition-colors cursor-pointer"
                title="Tetapan Mesin & Sistem"
              >
                <Settings className="w-4 h-4" />
              </button>

              {/* Big New Session Button (Desktop) */}
              <button
                type="button"
                id="btn-header-new-session"
                onClick={() => {
                  playTapSound(settings.soundEnabled);
                  onOpenNewSession();
                }}
                className="hidden lg:flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-2.5 rounded-xl text-xs shadow-lg shadow-blue-500/20 active:scale-95 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>NEW SESSION</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
