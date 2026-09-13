import React from 'react';
import { 
  Play, 
  Pause, 
  CheckCircle2, 
  PlusCircle, 
  Clock, 
  User, 
  AlertTriangle, 
  Wrench, 
  Truck, 
  RotateCcw,
  Sparkles,
  ChevronRight,
  SlidersHorizontal,
  Activity,
  Zap,
  QrCode,
  BellRing,
} from 'lucide-react';
import { Machine, Session, MachineStatus, AppSettings, AssetType } from '../types';
import { calculateSessionTime, deriveMachineStatus, formatClockTime, formatTimeRemaining } from '../utils/format';
import { resolveAssetType, getAssetCategoryTextColor } from '../utils/storage';
import { AssetIcon } from './AssetIcon';
import { playTapSound } from '../utils/sound';

interface MachineCardProps {
  machine: Machine;
  session?: Session;
  nowTimestamp: number;
  settings: AppSettings;
  assetTypes?: AssetType[];
  isAdminMode?: boolean;
  onStartSession: (machine: Machine, setRemaining?: boolean) => void;
  onPauseResumeSession: (session: Session) => void;
  onCompleteSession: (session: Session) => void;
  onExtendSession: (session: Session, minutes: number, price?: number) => void;
  onOpenCustomExtend: (session: Session) => void;
  onCancelSession: (session: Session) => void;
  onToggleMaintenance: (machine: Machine) => void;
  onOpenQrModal?: (session: Session, machine: Machine) => void;
}

export const MachineCard: React.FC<MachineCardProps> = ({
  machine,
  session,
  nowTimestamp,
  settings,
  assetTypes,
  isAdminMode,
  onStartSession,
  onPauseResumeSession,
  onCompleteSession,
  onExtendSession,
  onOpenCustomExtend,
  onCancelSession,
  onToggleMaintenance,
  onOpenQrModal,
}) => {
  const currentStatus: MachineStatus = deriveMachineStatus(
    machine.status,
    session,
    nowTimestamp,
    settings.endingSoonThresholdSeconds
  );

  const timeData = session ? calculateSessionTime(session, nowTimestamp) : null;
  const remainingFormatted = timeData ? formatTimeRemaining(timeData.remainingSeconds) : '--:--';
  const progressPercent = timeData ? timeData.progressPercent : 0;

  // Dynamic Asset Type resolution
  const matchedAssetType = resolveAssetType(machine.type || machine.typeId, assetTypes);
  const categoryTextColor = getAssetCategoryTextColor(machine, matchedAssetType.name);

  // Row Styling by Status
  let rowBorderClass = 'border-slate-800/90 hover:border-slate-700';
  let rowBgClass = 'bg-[#101723]';
  let statusBadgeBg = 'bg-[#151f2e] text-slate-400 border-slate-700';
  let statusDotClass = 'bg-slate-500';
  let statusText = 'OFFLINE';

  if (currentStatus === 'READY') {
    rowBorderClass = 'border-slate-800 hover:border-slate-700/80';
    rowBgClass = 'bg-[#0e1420]';
    statusBadgeBg = 'bg-slate-800/80 text-slate-300 border-slate-700 font-semibold';
    statusDotClass = 'bg-emerald-400';
    statusText = 'READY';
  } else if (currentStatus === 'RUNNING') {
    rowBorderClass = 'border-emerald-400/90 ring-1 ring-emerald-400/50 animate-active-green-glow shadow-xl shadow-emerald-500/20';
    rowBgClass = 'bg-gradient-to-r from-[#0c2a1e] via-[#092017] to-[#071913]';
    statusBadgeBg = 'bg-emerald-500 text-slate-950 border-emerald-300 font-black shadow-md shadow-emerald-500/30';
    statusDotClass = 'bg-slate-950 ring-2 ring-emerald-300 animate-ping';
    statusText = 'SESI AKTIF';
  } else if (currentStatus === 'ENDING_SOON') {
    rowBorderClass = 'border-amber-400 hover:border-amber-300 ring-2 ring-amber-400/50 animate-pulse';
    rowBgClass = 'bg-gradient-to-r from-[#281c0f] via-[#1a130a] to-[#110d07]';
    statusBadgeBg = 'bg-amber-500 text-slate-950 border-amber-300 font-black shadow-md shadow-amber-500/30';
    statusDotClass = 'bg-slate-950 ring-2 ring-amber-300 animate-ping';
    statusText = 'ENDING SOON';
  } else if (currentStatus === 'TIME_UP') {
    rowBorderClass = 'border-rose-500 hover:border-rose-400 ring-2 ring-rose-500/50 animate-pulse';
    rowBgClass = 'bg-gradient-to-r from-[#281318] via-[#1a0e13] to-[#10080b]';
    statusBadgeBg = 'bg-rose-600 text-white border-rose-400 font-black animate-pulse';
    statusDotClass = 'bg-rose-400 ring-2 ring-rose-500 animate-bounce';
    statusText = 'TIME UP';
  } else if (currentStatus === 'MAINTENANCE') {
    rowBorderClass = 'border-slate-800';
    rowBgClass = 'bg-[#0d121c]/80';
    statusBadgeBg = 'bg-slate-800 text-slate-400 border-slate-700';
    statusDotClass = 'bg-slate-500';
    statusText = 'SERVICE';
  }

  return (
    <div
      id={`machine-card-${machine.id}`}
      className={`rounded-2xl border transition-all duration-200 w-full min-w-0 max-w-full ${
        currentStatus === 'READY' ? 'p-2.5 sm:p-3 lg:p-3.5' : 'p-2.5 sm:p-3.5 lg:p-4'
      } shadow-lg relative overflow-hidden ${rowBgClass} ${rowBorderClass}`}
    >
      {/* Top progress bar for active sessions */}
      {(currentStatus === 'RUNNING' || currentStatus === 'ENDING_SOON' || currentStatus === 'TIME_UP') && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-slate-800">
          <div
            className={`h-full transition-all duration-500 ${
              currentStatus === 'TIME_UP'
                ? 'bg-rose-500 w-full animate-pulse'
                : currentStatus === 'ENDING_SOON'
                ? 'bg-amber-400'
                : 'bg-gradient-to-r from-emerald-500 via-emerald-400 to-teal-300'
            }`}
            style={{ width: currentStatus === 'TIME_UP' ? '100%' : `${progressPercent}%` }}
          />
        </div>
      )}

      {/* ========================================================= */}
      {/* CASE 1: READY STATUS — COMPACT RESPONSIVE ROW             */}
      {/* Target: 🚜 EXCAVATOR 1               ● READY [▶ MULA SESI] */}
      {/*           EXCAVATOR                                       */}
      {/* ========================================================= */}
      {currentStatus === 'READY' ? (
        <div className="flex items-center justify-between gap-2 sm:gap-4 w-full min-w-0">
          {/* ASSET INFO: ICON + NAMA + KATEGORI */}
          <div className="flex items-center gap-2 sm:gap-3.5 min-w-0 flex-1">
            <span className="w-9 h-9 sm:w-11 sm:h-11 lg:w-12 lg:h-12 rounded-xl bg-slate-900/80 border border-slate-700/60 p-1 sm:p-1.5 flex items-center justify-center shrink-0 shadow-md">
              <AssetIcon
                icon={matchedAssetType.icon}
                name={machine.name || matchedAssetType.name}
                size="md"
                className="w-6 h-6 sm:w-8 sm:h-8 lg:w-9 lg:h-9"
              />
            </span>
            <div className="min-w-0 flex-1">
              <h3 className={`text-xs sm:text-sm lg:text-base font-chakra font-black tracking-wide uppercase truncate leading-tight ${categoryTextColor}`}>
                {machine.name}
              </h3>
            </div>
          </div>

          {/* RIGHT SIDE: [● READY] + [⏱️ SET BAKI] + [▶ MULA SESI] DALAM ROW YANG SAMA */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            {/* ● READY */}
            <div className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full bg-slate-800/80 border border-slate-700 text-slate-300 font-mono text-[9px] sm:text-xs font-black tracking-wider uppercase whitespace-nowrap shadow-xs">
              <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-400" />
              <span>READY</span>
            </div>

            {/* [⏱️ SET BAKI] */}
            <button
              type="button"
              id={`btn-set-remaining-${machine.id}`}
              onClick={() => {
                playTapSound(settings.soundEnabled);
                onStartSession(machine, true);
              }}
              className="px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl bg-[#151f2e] hover:bg-[#1d2b3f] hover:border-amber-500/50 border border-slate-700 text-amber-400 font-chakra font-black text-[10px] sm:text-xs uppercase tracking-wider flex items-center justify-center gap-1 sm:gap-1.5 transition-all cursor-pointer whitespace-nowrap min-h-[34px] sm:min-h-[38px] shadow-xs"
              title="Set Masa Berbaki (Sesi Manual)"
            >
              <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-400" />
              <span className="hidden sm:inline">SET BAKI</span>
            </button>

            {/* [▶ MULA SESI] */}
            <button
              type="button"
              id={`btn-start-session-${machine.id}`}
              onClick={() => {
                playTapSound(settings.soundEnabled);
                onStartSession(machine, false);
              }}
              className="w-auto px-2.5 sm:px-5 py-1.5 sm:py-2 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 active:scale-95 text-slate-950 font-chakra font-black text-[11px] sm:text-xs uppercase tracking-wider flex items-center justify-center gap-1 sm:gap-2 shadow-md shadow-amber-500/25 transition-all cursor-pointer ring-1 ring-amber-300/40 whitespace-nowrap min-h-[34px] sm:min-h-[38px]"
            >
              <Play className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-slate-950 text-slate-950 stroke-[3]" />
              <span>MULA SESI</span>
            </button>
          </div>
        </div>
      ) : (
        /* ========================================================= */
        /* CASE 2: ACTIVE SESSIONS (RUNNING, ENDING, TIME UP, SVC)   */
        /* ========================================================= */
        <>
          {/* MOBILE VIEW (< lg) */}
          <div className="flex flex-col gap-2 lg:hidden w-full min-w-0">
            {/* ROW 1: [ICON + NAMA + INFO] (Left) + [STATUS & COUNTDOWN] (Right) */}
            <div className="flex items-center justify-between gap-2 w-full min-w-0">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <span className="w-9 h-9 rounded-xl bg-slate-900/80 border border-slate-700/60 p-1 flex items-center justify-center shrink-0 shadow-md">
                  <AssetIcon
                    icon={matchedAssetType.icon}
                    name={machine.name || matchedAssetType.name}
                    size="sm"
                    className="w-6 h-6"
                  />
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className={`text-xs sm:text-sm font-chakra font-black tracking-wide uppercase truncate leading-tight ${categoryTextColor}`}>
                    {machine.name}
                  </h3>
                  {session?.customerName && (
                    <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block truncate">
                      {session.customerName} ({session.packageName || 'Walk-in'})
                    </span>
                  )}
                </div>
              </div>

              {/* Status & Countdown */}
              <div className="flex items-center gap-1 shrink-0">
                {(currentStatus === 'RUNNING' || currentStatus === 'ENDING_SOON') && session && (
                  <div className="flex items-center gap-1">
                    <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full border text-[9px] font-mono font-black uppercase tracking-wider whitespace-nowrap ${statusBadgeBg}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${statusDotClass}`} />
                      <span>{statusText}</span>
                    </div>
                    <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded-md border shrink-0 ${
                      currentStatus === 'RUNNING'
                        ? 'bg-[#041710] border-emerald-500/40 text-emerald-300'
                        : 'bg-[#080d14] border-amber-500/40 text-amber-400'
                    }`}>
                      <Clock className={`w-2.5 h-2.5 ${
                        currentStatus === 'ENDING_SOON'
                          ? 'text-amber-400 animate-spin'
                          : 'text-emerald-400'
                      }`} />
                      <span className="font-mono text-[11px] font-black tracking-tight">
                        {remainingFormatted}
                      </span>
                    </div>
                  </div>
                )}

                {currentStatus === 'TIME_UP' && session && (
                  <div className="flex items-center gap-1">
                    <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-rose-600 text-white font-mono text-[9px] font-black tracking-wider uppercase animate-pulse border border-rose-400 shadow-sm shadow-rose-600/30 whitespace-nowrap">
                      <BellRing className="w-2.5 h-2.5 animate-bounce" />
                      <span>TAMAT</span>
                    </div>
                    <span className="font-mono text-[11px] font-black text-rose-400 bg-[#080d14] px-1.5 py-0.5 rounded-md border border-rose-900/80 animate-pulse">
                      {remainingFormatted}
                    </span>
                  </div>
                )}

                {currentStatus === 'MAINTENANCE' && (
                  <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-400 font-mono text-[9px] font-black tracking-wider uppercase whitespace-nowrap">
                    <Wrench className="w-2.5 h-2.5" />
                    <span>SERVICE</span>
                  </div>
                )}
              </div>
            </div>

            {/* ROW 2: ACTION CONTROLS */}
            <div className="flex items-center justify-between gap-1 pt-1.5 border-t border-slate-800/60 w-full min-w-0">
              {(currentStatus === 'RUNNING' || currentStatus === 'ENDING_SOON') && session && (
                <>
                  <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-400 min-w-0">
                    <span className="truncate">Tamat: {formatClockTime(session.endTime)}</span>
                    {session.customerStoppedAlarmAt && (
                      <span className="text-rose-400 font-bold shrink-0 animate-pulse">• Alarm Mati</span>
                    )}
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      id={`btn-quick-ext-20-mob-${machine.id}`}
                      onClick={() => {
                        playTapSound(settings.soundEnabled);
                        onExtendSession(session, 20, 10);
                      }}
                      className="px-2 py-1 rounded-lg bg-[#080d14] hover:bg-[#121927] border border-slate-800 text-amber-300 font-mono font-bold text-[10px] uppercase transition-colors cursor-pointer whitespace-nowrap active:scale-95"
                      title="Tambah 20m"
                    >
                      +20m
                    </button>

                    <button
                      type="button"
                      id={`btn-quick-ext-custom-mob-${machine.id}`}
                      onClick={() => {
                        playTapSound(settings.soundEnabled);
                        onOpenCustomExtend(session);
                      }}
                      className="p-1 rounded-lg bg-[#080d14] border border-slate-800 text-slate-400 hover:text-amber-300 transition-colors cursor-pointer active:scale-95 shrink-0"
                      title="Pilihan Masa Lain"
                    >
                      <SlidersHorizontal className="w-3 h-3" />
                    </button>

                    {onOpenQrModal && (
                      <button
                        type="button"
                        id={`btn-open-qr-mini-mob-${machine.id}`}
                        onClick={() => {
                          playTapSound(settings.soundEnabled);
                          onOpenQrModal(session, machine);
                        }}
                        className="p-1 rounded-lg bg-[#080d14] border border-slate-800 text-amber-300 transition-all cursor-pointer active:scale-95 shrink-0"
                        title="QR Tracker"
                      >
                        <QrCode className="w-3 h-3" />
                      </button>
                    )}

                    <button
                      type="button"
                      id={`btn-pause-resume-mob-${machine.id}`}
                      onClick={() => {
                        playTapSound(settings.soundEnabled);
                        onPauseResumeSession(session);
                      }}
                      className="px-2 py-1 rounded-lg bg-[#151f2e] border border-slate-700/80 text-slate-200 font-chakra font-black text-[10px] uppercase tracking-wider transition-colors cursor-pointer active:scale-95 whitespace-nowrap"
                    >
                      {session.isPaused ? 'Resume' : 'Pause'}
                    </button>

                    <button
                      type="button"
                      id={`btn-complete-mob-${machine.id}`}
                      onClick={() => {
                        playTapSound(settings.soundEnabled);
                        onCompleteSession(session);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-[#182030] border border-slate-700/80 text-emerald-400 font-chakra font-black text-[10px] uppercase tracking-wider transition-colors cursor-pointer active:scale-95 whitespace-nowrap"
                    >
                      Tamat
                    </button>
                  </div>
                </>
              )}

              {currentStatus === 'TIME_UP' && session && (
                <>
                  <div className="text-[10px] font-mono text-rose-400 font-bold truncate">
                    Masa tamat • Tindakan diperlukan
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      id={`btn-timeup-ext-20-mob-${machine.id}`}
                      onClick={() => {
                        playTapSound(settings.soundEnabled);
                        onExtendSession(session, 20, 10);
                      }}
                      className="px-2 py-1 rounded-lg bg-[#151f2e] border border-amber-500/50 text-amber-300 font-chakra font-black text-[10px] uppercase tracking-wider transition-colors cursor-pointer whitespace-nowrap active:scale-95"
                    >
                      +20m
                    </button>

                    <button
                      type="button"
                      id={`btn-timeup-complete-mob-${machine.id}`}
                      onClick={() => {
                        playTapSound(settings.soundEnabled);
                        onCompleteSession(session);
                      }}
                      className="px-3 py-1 rounded-lg bg-rose-600 text-white font-chakra font-black text-[10px] uppercase tracking-wider shadow-sm shadow-rose-600/30 active:scale-95 transition-all cursor-pointer whitespace-nowrap"
                    >
                      TAMATKAN
                    </button>
                  </div>
                </>
              )}

              {currentStatus === 'MAINTENANCE' && (
                <div className="flex items-center justify-between w-full">
                  <span className="text-[10px] font-mono text-slate-400">Unit dalam servis</span>
                  <button
                    type="button"
                    id={`btn-restore-ready-mob-${machine.id}`}
                    onClick={() => {
                      playTapSound(settings.soundEnabled);
                      onToggleMaintenance(machine);
                    }}
                    className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-chakra font-black text-[10px] uppercase tracking-wider transition-colors cursor-pointer whitespace-nowrap"
                  >
                    Set READY
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* DESKTOP ROW VIEW (>= lg) */}
          <div className="hidden lg:flex items-center justify-between gap-4">
            {/* LEFT SECTION: [ICON + NAMA UNIT] + [JENIS UNIT] */}
            <div className="flex items-center gap-3 xl:gap-4 min-w-0">
              <div className="flex items-center gap-3 min-w-0 w-60 xl:w-68 shrink-0">
                <span className="w-11 h-11 xl:w-12 xl:h-12 rounded-xl bg-slate-900/80 border border-slate-700/60 p-1.5 flex items-center justify-center shrink-0 shadow-md">
                  <AssetIcon
                    icon={matchedAssetType.icon}
                    name={machine.name || matchedAssetType.name}
                    size="md"
                    className="w-8 h-8 xl:w-9 xl:h-9"
                  />
                </span>
                <div className="min-w-0">
                  <h3 className={`text-sm sm:text-base font-chakra font-black tracking-wide uppercase truncate leading-tight ${categoryTextColor}`}>
                    {machine.name}
                  </h3>
                </div>
              </div>

              {/* JENIS UNIT (Kategori Badge) */}
              <div className="flex items-center shrink-0 w-28 xl:w-36">
                <span className="text-[10px] font-mono font-bold text-slate-300 uppercase bg-[#090f18] px-2.5 py-1 rounded-lg border border-slate-800/90 truncate">
                  {machine.customTypeLabel || matchedAssetType.name}
                </span>
              </div>
            </div>

            {/* MIDDLE SECTION: [STATUS & LIVE TELEMETRY] */}
            <div className="flex-1 min-w-0 flex items-center justify-start gap-3">
              {(currentStatus === 'RUNNING' || currentStatus === 'ENDING_SOON') && session && (
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="flex items-center gap-2 shrink-0">
                    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-mono font-black uppercase tracking-wider whitespace-nowrap ${statusBadgeBg}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${statusDotClass}`} />
                      <span>{statusText}</span>
                    </div>
                    <div className={`flex items-center gap-1.5 px-3 py-1 rounded-xl border shrink-0 ${
                      currentStatus === 'RUNNING'
                        ? 'bg-[#041710] border-emerald-500/40 text-emerald-300'
                        : 'bg-[#080d14] border-amber-500/40 text-amber-400'
                    }`}>
                      <Clock className={`w-3.5 h-3.5 ${
                        currentStatus === 'ENDING_SOON'
                          ? 'text-amber-400 animate-spin'
                          : 'text-emerald-400'
                      }`} />
                      <span className="font-mono text-base font-black tracking-tight">
                        {remainingFormatted}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs font-mono text-slate-300 min-w-0">
                    <span className={`font-bold truncate max-w-[130px] ${currentStatus === 'RUNNING' ? 'text-emerald-300' : 'text-amber-300'}`} title={session.customerName || 'Walk-in'}>
                      {session.customerName || 'Walk-in'}
                    </span>
                    <span className="text-slate-600">•</span>
                    <span className="text-slate-300 text-[11px] truncate max-w-[120px]" title={session.packageName}>
                      {session.packageName}
                    </span>
                    <span className="text-slate-600 hidden xl:inline">•</span>
                    <span className="text-slate-400 text-[11px] hidden xl:inline whitespace-nowrap">
                      Tamat: {formatClockTime(session.endTime)}
                    </span>
                  </div>

                  {session.customerStoppedAlarmAt && (
                    <div className="px-2 py-0.5 rounded-lg bg-rose-500/15 border border-rose-500/40 flex items-center gap-1.5 text-[10px] font-mono text-rose-300 animate-pulse whitespace-nowrap shrink-0">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
                      <span>{session.customerStoppedAlarmReason === 'EARLY_STOPPED' ? 'Tamat Awal' : 'Alarm Ditutup'}</span>
                    </div>
                  )}
                </div>
              )}

              {currentStatus === 'TIME_UP' && session && (
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-600 text-white font-mono text-xs font-black tracking-wider uppercase animate-pulse border border-rose-400 shadow-md shadow-rose-600/30 whitespace-nowrap">
                      <BellRing className="w-3.5 h-3.5 animate-bounce" />
                      <span>MASA TAMAT</span>
                    </div>
                    <span className="font-mono text-base font-black text-rose-400 bg-[#080d14] px-2.5 py-1 rounded-xl border border-rose-900/80 animate-pulse">
                      {remainingFormatted}
                    </span>
                  </div>
                  <div className="text-xs font-mono text-rose-200 truncate">
                    <span className="font-bold">{session.customerName || 'Pelanggan'}</span> — Sila pulangkan alat kawalan (Tamat: {formatClockTime(session.endTime)})
                  </div>
                </div>
              )}

              {currentStatus === 'MAINTENANCE' && (
                <div className="flex items-center gap-2.5 flex-1">
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-400 font-mono text-xs font-black tracking-wider uppercase whitespace-nowrap">
                    <Wrench className="w-3.5 h-3.5" />
                    <span>SERVICE / MAINTENANCE</span>
                  </div>
                </div>
              )}
            </div>

            {/* RIGHT SECTION: [ACTION BUTTONS] */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 justify-end">
              {(currentStatus === 'RUNNING' || currentStatus === 'ENDING_SOON') && session && (
                <div className="flex items-center gap-1.5 sm:gap-2 w-auto overflow-x-auto no-scrollbar">
                  <button
                    type="button"
                    id={`btn-quick-ext-20-${machine.id}`}
                    onClick={() => {
                      playTapSound(settings.soundEnabled);
                      onExtendSession(session, 20, 10);
                    }}
                    className="px-2.5 py-1.5 rounded-xl bg-[#080d14] hover:bg-[#121927] border border-slate-800 hover:border-amber-500/50 text-amber-300 font-mono font-bold text-[11px] uppercase transition-colors cursor-pointer whitespace-nowrap"
                    title="Tambah masa 20 minit (RM10)"
                  >
                    +20m
                  </button>
                  <button
                    type="button"
                    id={`btn-quick-ext-30-${machine.id}`}
                    onClick={() => {
                      playTapSound(settings.soundEnabled);
                      onExtendSession(session, 30, 15);
                    }}
                    className="px-2.5 py-1.5 rounded-xl bg-[#080d14] hover:bg-[#121927] border border-slate-800 hover:border-amber-500/50 text-amber-300 font-mono font-bold text-[11px] uppercase transition-colors cursor-pointer whitespace-nowrap"
                    title="Tambah masa 30 minit (RM15)"
                  >
                    +30m
                  </button>
                  <button
                    type="button"
                    id={`btn-quick-ext-custom-${machine.id}`}
                    onClick={() => {
                      playTapSound(settings.soundEnabled);
                      onOpenCustomExtend(session);
                    }}
                    className="p-1.5 rounded-xl bg-[#080d14] hover:bg-[#121927] border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer shrink-0"
                    title="Pilihan Masa Tersuai"
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5" />
                  </button>

                  {onOpenQrModal && (
                    <button
                      type="button"
                      id={`btn-open-qr-mini-${machine.id}`}
                      onClick={() => {
                        playTapSound(settings.soundEnabled);
                        onOpenQrModal(session, machine);
                      }}
                      className="p-1.5 rounded-xl bg-[#080d14] hover:bg-[#121927] border border-slate-800 hover:border-amber-500/50 text-amber-300 transition-all cursor-pointer shrink-0"
                      title="Buka QR Live Tracker & WhatsApp"
                    >
                      <QrCode className="w-3.5 h-3.5" />
                    </button>
                  )}

                  <button
                    type="button"
                    id={`btn-pause-resume-${machine.id}`}
                    onClick={() => {
                      playTapSound(settings.soundEnabled);
                      onPauseResumeSession(session);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-[#151f2e] hover:bg-[#1a283c] border border-slate-700/80 hover:border-slate-600 text-slate-200 font-chakra font-black text-xs uppercase tracking-wider transition-colors cursor-pointer whitespace-nowrap"
                  >
                    {session.isPaused ? 'Resume' : 'Pause'}
                  </button>

                  <button
                    type="button"
                    id={`btn-complete-${machine.id}`}
                    onClick={() => {
                      playTapSound(settings.soundEnabled);
                      onCompleteSession(session);
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-[#182030] hover:bg-[#202c40] border border-slate-700/80 hover:border-emerald-500/40 text-emerald-400 font-chakra font-black text-xs uppercase tracking-wider transition-colors cursor-pointer whitespace-nowrap"
                  >
                    Tamatkan
                  </button>
                </div>
              )}

              {currentStatus === 'TIME_UP' && session && (
                <div className="flex items-center gap-2 w-auto">
                  {onOpenQrModal && (
                    <button
                      type="button"
                      id={`btn-open-qr-mini-${machine.id}`}
                      onClick={() => {
                        playTapSound(settings.soundEnabled);
                        onOpenQrModal(session, machine);
                      }}
                      className="p-2 rounded-xl bg-[#080d14] border border-slate-800 text-amber-300 hover:border-amber-400 transition-all cursor-pointer shrink-0"
                      title="Buka QR Live Tracker"
                    >
                      <QrCode className="w-4 h-4" />
                    </button>
                  )}

                  <button
                    type="button"
                    id={`btn-timeup-ext-20-${machine.id}`}
                    onClick={() => {
                      playTapSound(settings.soundEnabled);
                      onExtendSession(session, 20, 10);
                    }}
                    className="px-3 py-2 rounded-xl bg-[#151f2e] border border-amber-500/50 hover:bg-amber-500/15 text-amber-300 font-chakra font-black text-xs uppercase tracking-wider transition-colors cursor-pointer whitespace-nowrap"
                  >
                    +20m (RM10)
                  </button>

                  <button
                    type="button"
                    id={`btn-timeup-complete-${machine.id}`}
                    onClick={() => {
                      playTapSound(settings.soundEnabled);
                      onCompleteSession(session);
                    }}
                    className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-chakra font-black text-xs uppercase tracking-wider shadow-lg shadow-rose-600/30 active:scale-95 transition-all cursor-pointer whitespace-nowrap"
                  >
                    TAMATKAN SESI
                  </button>
                </div>
              )}

              {currentStatus === 'MAINTENANCE' && (
                <button
                  type="button"
                  id={`btn-restore-ready-${machine.id}`}
                  onClick={() => {
                    playTapSound(settings.soundEnabled);
                    onToggleMaintenance(machine);
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-chakra font-black text-xs uppercase tracking-wider transition-colors cursor-pointer whitespace-nowrap"
                >
                  SET TO READY
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

