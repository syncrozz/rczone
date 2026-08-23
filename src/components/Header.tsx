import React, { useState, useEffect } from 'react';
import { 
  Volume2, 
  VolumeX, 
  Sun, 
  Users, 
  Receipt, 
  Settings, 
  Plus, 
  BellRing,
  Lock,
  Unlock,
  Clock,
  Zap,
  Activity,
  Shield,
  Radio,
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
  isAdminMode: boolean;
  onToggleAdminMode: () => void;
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
  isAdminMode,
  onToggleAdminMode,
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
          year: 'numeric',
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
    const liveStatus = deriveMachineStatus(
      m.status,
      activeSession,
      nowTimestamp,
      settings.endingSoonThresholdSeconds
    );
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
    <header className="bg-[#0b0f17]/95 backdrop-blur-xl border-b border-slate-800/80 sticky top-0 z-30 shadow-2xl transition-colors duration-200">
      {/* Top Motorsport Accent Line */}
      <div className="h-0.5 bg-gradient-to-r from-amber-500/20 via-amber-400 to-amber-500/20 w-full"></div>

      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 sm:py-3">
        {/* ========================================================= */}
        {/* MOBILE VIEW (< md) - Motorsport Compact Console           */}
        {/* ========================================================= */}
        <div className="flex flex-col gap-2 md:hidden">
          {/* Row 1: Logo + RC Zone Branding + Admin Access + Settings */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="relative shrink-0">
                <div className="w-9 h-9 rounded-xl bg-[#131b28] p-1 shadow-md ring-1 ring-amber-500/30 overflow-hidden flex items-center justify-center">
                  <img 
                    src="https://raw.githubusercontent.com/syncrozz/syncrozz-assets/main/logo/RC%20Zone/android-chrome-192x192.png" 
                    alt="RC Zone" 
                    className="w-full h-full object-contain"
                  />
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 border-2 border-[#0b0f17]"></span>
                </span>
              </div>

              <div className="flex flex-col min-w-0 leading-none">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-chakra font-black uppercase tracking-widest text-amber-400">
                    RC ZONE
                  </span>
                  <span className="text-[8px] font-mono px-1 py-0.2 rounded bg-slate-800 text-slate-300 font-bold border border-slate-700">
                    v4.3
                  </span>
                </div>
                <h1 className="text-sm font-chakra font-black text-white truncate tracking-wide uppercase mt-0.5">
                  {settings.businessName || 'FUN RIDE'}
                </h1>
                <span className="text-[8px] font-mono text-slate-400 uppercase tracking-widest">
                  MOTORSPORT CONTROL
                </span>
              </div>
            </div>

            {/* Top Right Admin & Settings */}
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                id="btn-mobile-admin-access"
                onClick={onToggleAdminMode}
                className={`px-2.5 py-1.5 rounded-xl border text-[10px] font-chakra font-black flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer ${
                  isAdminMode
                    ? 'bg-amber-500/20 border-amber-400 text-amber-300 ring-1 ring-amber-400/50 shadow-sm shadow-amber-500/20'
                    : 'bg-[#131b28] border-slate-700/80 text-slate-300 hover:border-amber-500/40 hover:text-amber-300'
                }`}
                title={isAdminMode ? 'Admin Aktif. Klik untuk Kunci.' : 'Buka Mod Admin'}
              >
                {isAdminMode ? (
                  <>
                    <Unlock className="w-3 h-3 text-amber-400" />
                    <span>ADMIN</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-3 h-3 text-amber-400/80" />
                    <span>ADMIN</span>
                  </>
                )}
              </button>

              <button
                type="button"
                id="btn-mobile-settings"
                onClick={() => {
                  playTapSound(settings.soundEnabled);
                  onOpenSettings();
                }}
                className={`p-2 rounded-xl border text-xs active:scale-95 transition-all cursor-pointer ${
                  isAdminMode
                    ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold shadow-md shadow-amber-500/20'
                    : 'border-slate-800 bg-[#131b28] text-slate-300 hover:text-white hover:border-slate-700'
                }`}
                title="Tetapan Sistem"
              >
                <Settings className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Row 2: Live Telemetry Modules + Quick Actions */}
          <div className="flex items-center justify-between gap-1.5 pt-1.5 border-t border-slate-800/80">
            {/* Live Count Telemetry Capsule */}
            <div className="flex items-center gap-1 bg-[#101723] p-1 rounded-xl border border-slate-800 text-[10px] font-black shrink-0">
              <span className="px-2 py-0.5 rounded-lg bg-[#162030] text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>{readyCount} READY</span>
              </span>
              <span className="px-2 py-0.5 rounded-lg bg-[#162030] text-amber-400 border border-amber-500/20 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
                <span>{runningCount + endingSoonCount} RUNNING</span>
              </span>
              {timeUpCount > 0 && (
                <span className="px-2 py-0.5 rounded-lg bg-rose-600 text-white flex items-center gap-1 font-black animate-bounce">
                  <BellRing className="w-2.5 h-2.5" />
                  {timeUpCount}
                </span>
              )}
            </div>

            {/* Quick Action Navigation */}
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
              <button
                type="button"
                onClick={() => {
                  playTapSound(settings.soundEnabled);
                  onOpenQueue();
                }}
                className="px-2.5 py-1.5 rounded-xl bg-[#131b28] hover:bg-[#1a2436] border border-slate-700/80 text-slate-200 text-[10px] font-bold flex items-center gap-1 active:scale-95 shrink-0"
              >
                <Users className="w-3 h-3 text-amber-400" />
                <span>Giliran</span>
                {queue.length > 0 && (
                  <span className="bg-amber-500 text-slate-950 font-black px-1.5 rounded-full text-[9px]">
                    {queue.length}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  playTapSound(settings.soundEnabled);
                  onOpenTransactions();
                }}
                className="px-2.5 py-1.5 rounded-xl bg-[#131b28] hover:bg-[#1a2436] border border-slate-700/80 text-slate-200 text-[10px] font-bold flex items-center gap-1 active:scale-95 shrink-0"
              >
                <Receipt className="w-3 h-3 text-emerald-400" />
                <span>Rekod</span>
              </button>

              <button
                type="button"
                onClick={handleToggleSound}
                className={`p-1.5 rounded-xl border shrink-0 ${
                  settings.soundEnabled
                    ? 'bg-[#131b28] border-amber-500/40 text-amber-400'
                    : 'bg-[#131b28] border-slate-800 text-slate-500'
                }`}
                title={settings.soundEnabled ? 'Bunyi Aktif' : 'Bunyi Dimatikan'}
              >
                {settings.soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
              </button>

              <button
                type="button"
                onClick={() => {
                  playTapSound(settings.soundEnabled);
                  onOpenNewSession();
                }}
                className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black px-3 py-1.5 rounded-xl flex items-center gap-1 text-[10px] uppercase tracking-wider shadow-md shadow-amber-500/20 active:scale-95 shrink-0"
              >
                <Plus className="w-3.5 h-3.5 stroke-[3]" />
                <span>SESI</span>
              </button>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* DESKTOP VIEW (>= md) - RC ZONE MOTORSPORT COMMAND CENTER  */}
        {/* ========================================================= */}
        <div className="hidden md:flex items-center justify-between gap-6">
          {/* Left: Brand Identity & Telemetry Tag */}
          <div className="flex items-center gap-4">
            <div className="relative group">
              <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-[#182232] to-[#0f1622] p-1.5 shadow-xl shadow-black/40 ring-1 ring-amber-500/30 group-hover:ring-amber-400/60 transition-all flex items-center justify-center overflow-hidden">
                <img 
                  src="https://raw.githubusercontent.com/syncrozz/syncrozz-assets/main/logo/RC%20Zone/android-chrome-192x192.png" 
                  alt="RC Zone" 
                  className="w-full h-full object-contain"
                />
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-[#0b0f17]"></span>
              </span>
            </div>

            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-chakra font-black uppercase tracking-wider bg-amber-500/15 text-amber-300 border border-amber-500/30">
                  <Zap className="w-2.5 h-2.5 text-amber-400 fill-amber-400" />
                  <span>RC ZONE MOTORSPORT</span>
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-mono font-bold bg-[#131b28] text-slate-300 border border-slate-700/80 tracking-wide">
                  <Radio className="w-2.5 h-2.5 text-emerald-400 animate-pulse" />
                  <span>TELEMETRY ONLINE</span>
                </span>
              </div>

              <div className="flex items-center gap-2.5 mt-1">
                <h1 className="text-2xl font-chakra font-black text-white tracking-wider uppercase">
                  {settings.businessName || 'FUN RIDE'}
                </h1>
                <span className="px-2.5 py-0.5 rounded-md text-[10px] font-mono font-black uppercase tracking-widest bg-[#151e2b] text-amber-400 border border-amber-500/30 shadow-xs">
                  CONTROL BOARD
                </span>
              </div>
            </div>
          </div>

          {/* Right Section: 2-Tier Motorsport Telemetry & Action Hub */}
          <div className="flex flex-col items-end gap-2.5">
            {/* Top Row: Live Telemetry HUD Modules, Precision Clock & Admin Key */}
            <div className="flex items-center gap-2.5">
              {/* Telemetry Status HUD */}
              <div className="flex items-center gap-1.5 bg-[#101723] p-1 rounded-2xl border border-slate-800/90 shadow-inner">
                {/* READY UNIT MODULE */}
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#151f2e] border border-emerald-500/30 text-xs font-bold shadow-xs">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-emerald-500/40 animate-pulse"></span>
                  <span className="text-white font-mono font-black text-base">{readyCount}</span>
                  <span className="text-emerald-400 font-chakra text-xs font-black tracking-wider uppercase">READY</span>
                </div>

                {/* RUNNING UNIT MODULE */}
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#151f2e] border border-amber-500/30 text-xs font-bold shadow-xs">
                  <span className="w-2 h-2 rounded-full bg-amber-400 ring-2 ring-amber-500/40 animate-pulse"></span>
                  <span className="text-white font-mono font-black text-base">{runningCount + endingSoonCount}</span>
                  <span className="text-amber-400 font-chakra text-xs font-black tracking-wider uppercase">RUNNING</span>
                </div>

                {/* TIME UP ALARM MODULE */}
                {timeUpCount > 0 && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600 text-white text-xs font-chakra font-black tracking-wider uppercase shadow-lg shadow-rose-600/40 animate-bounce">
                    <BellRing className="w-3.5 h-3.5 text-white" />
                    <span>{timeUpCount} TAMAT</span>
                  </div>
                )}
              </div>

              {/* Digital Precision Clock */}
              <div className="flex items-center gap-2.5 px-3.5 py-1.5 bg-[#101723] rounded-2xl border border-slate-800 shadow-inner">
                <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                <div className="flex flex-col text-left leading-tight">
                  <span className="text-sm font-mono font-black text-white tracking-widest">
                    {timeString || '--:--:--'}
                  </span>
                  <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest">
                    {dateString}
                  </span>
                </div>
              </div>

              {/* Admin Access Motorsport Key */}
              <button
                type="button"
                id="btn-top-admin-access"
                onClick={onToggleAdminMode}
                className={`px-3.5 py-1.5 rounded-2xl border text-xs font-chakra font-black flex items-center gap-2 transition-all active:scale-95 cursor-pointer ${
                  isAdminMode
                    ? 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 hover:from-amber-500/30 hover:to-orange-500/30 border-amber-400 text-amber-300 ring-2 ring-amber-500/30 shadow-md shadow-amber-500/10'
                    : 'bg-[#101723] hover:bg-[#151f2e] border-slate-700/80 hover:border-amber-500/50 text-slate-300 hover:text-amber-300'
                }`}
                title={isAdminMode ? 'Mod Admin Aktif. Klik untuk Kunci Semula.' : 'Klik untuk Buka Mod Admin.'}
              >
                {isAdminMode ? (
                  <>
                    <Unlock className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                    <span className="tracking-wider uppercase">ADMIN ACTIVE</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                  </>
                ) : (
                  <>
                    <Lock className="w-3.5 h-3.5 text-amber-400" />
                    <span className="tracking-wider uppercase">ADMIN ACCESS</span>
                  </>
                )}
              </button>
            </div>

            {/* Bottom Row: Control Center Toolbar */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                id="btn-header-queue"
                onClick={() => {
                  playTapSound(settings.soundEnabled);
                  onOpenQueue();
                }}
                className="relative px-3.5 py-1.5 rounded-xl bg-[#131b28] hover:bg-[#182334] border border-slate-700/80 text-slate-200 text-xs font-chakra font-black uppercase tracking-wider flex items-center gap-2 transition-all active:scale-95 cursor-pointer hover:border-amber-500/40"
                title="Senarai Menunggu (Queue)"
              >
                <Users className="w-4 h-4 text-amber-400" />
                <span>Menunggu</span>
                {queue.length > 0 ? (
                  <span className="bg-amber-500 text-slate-950 font-black px-1.5 py-0.5 rounded-full text-[10px] min-w-4 text-center font-mono">
                    {queue.length}
                  </span>
                ) : (
                  <span className="text-slate-500 text-[10px] font-mono">(0)</span>
                )}
              </button>

              <button
                type="button"
                id="btn-header-transactions"
                onClick={() => {
                  playTapSound(settings.soundEnabled);
                  onOpenTransactions();
                }}
                className="px-3.5 py-1.5 rounded-xl bg-[#131b28] hover:bg-[#182334] border border-slate-700/80 text-slate-200 text-xs font-chakra font-black uppercase tracking-wider flex items-center gap-2 transition-all active:scale-95 cursor-pointer hover:border-emerald-500/40"
                title="Rekod Transaksi / Sesi Hari Ini"
              >
                <Receipt className="w-4 h-4 text-emerald-400" />
                <span>Transaksi</span>
              </button>

              <button
                type="button"
                id="btn-header-sound"
                onClick={handleToggleSound}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-chakra font-black uppercase tracking-wider transition-all active:scale-95 cursor-pointer ${
                  settings.soundEnabled
                    ? 'bg-[#131b28] border-amber-500/40 text-amber-300'
                    : 'bg-[#101723] border-slate-800 text-slate-500 hover:text-slate-400'
                }`}
                title={settings.soundEnabled ? 'Bunyi Aktif' : 'Bunyi Dimatikan'}
              >
                {settings.soundEnabled ? (
                  <>
                    <Volume2 className="w-4 h-4 text-amber-400" />
                    <span className="font-mono text-[11px]">Audio ON</span>
                  </>
                ) : (
                  <>
                    <VolumeX className="w-4 h-4 text-slate-500" />
                    <span className="font-mono text-[11px]">Audio OFF</span>
                  </>
                )}
              </button>

              <button
                type="button"
                id="btn-header-wakelock"
                onClick={onToggleWakeLock}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-chakra font-black uppercase tracking-wider transition-all active:scale-95 cursor-pointer ${
                  wakeLockActive
                    ? 'bg-[#131b28] border-amber-400 text-amber-300'
                    : 'bg-[#101723] border-slate-800 text-slate-400 hover:text-slate-300'
                }`}
                title="Kekalkan skrin sentiasa menyala"
              >
                <Sun className={`w-4 h-4 ${wakeLockActive ? 'text-amber-400 animate-[spin_10s_linear_infinite]' : 'text-slate-500'}`} />
                <span className="font-mono text-[11px]">{wakeLockActive ? 'Awake' : 'Auto'}</span>
              </button>

              <button
                type="button"
                id="btn-header-settings"
                onClick={() => {
                  playTapSound(settings.soundEnabled);
                  onOpenSettings();
                }}
                className={`p-2 rounded-xl border transition-all active:scale-95 cursor-pointer ${
                  isAdminMode
                    ? 'bg-amber-500 text-slate-950 border-amber-400 font-extrabold shadow-md shadow-amber-500/20'
                    : 'bg-[#131b28] hover:bg-[#182334] border-slate-700/80 text-slate-300 hover:text-white hover:border-slate-600'
                }`}
                title="Tetapan Sistem & Mesin"
              >
                <Settings className="w-4 h-4" />
              </button>

              {/* Race Action Start Button */}
              <button
                type="button"
                id="btn-header-new-session"
                onClick={() => {
                  playTapSound(settings.soundEnabled);
                  onOpenNewSession();
                }}
                className="bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black px-4.5 py-1.5 rounded-xl flex items-center gap-2 text-xs uppercase tracking-wider shadow-lg shadow-amber-500/25 active:scale-95 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>+ SESI BARU</span>
              </button>
            </div>
          </div>
        </div>

      </div>
    </header>
  );
};
