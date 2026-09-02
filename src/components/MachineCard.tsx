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
import { resolveAssetType } from '../utils/storage';
import { playTapSound } from '../utils/sound';

interface MachineCardProps {
  machine: Machine;
  session?: Session;
  nowTimestamp: number;
  settings: AppSettings;
  assetTypes?: AssetType[];
  onStartSession: (machine: Machine) => void;
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

  // Machine ID badge (e.g. M-EXC-1, M-BDZ-1, M-DTK-1)
  const machineCode = machine.id.toUpperCase().replace('M_', '').replace('_', '-');

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
    statusDotClass = 'bg-slate-400';
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
      className={`rounded-2xl border transition-all duration-200 p-2 sm:p-3.5 lg:p-4 shadow-lg relative overflow-hidden ${rowBgClass} ${rowBorderClass}`}
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
      {/* MOBILE COMPACT VIEW (< lg)                                */}
      {/* ========================================================= */}
      <div className="flex flex-col gap-1.5 lg:hidden">
        {/* ROW 1: [ID UNIT] (Left) + [STATUS & COUNTDOWN] (Right) */}
        <div className="flex items-center justify-between gap-1.5">
          {/* ID UNIT */}
          <div className="font-mono text-[11px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-[#080d15] text-amber-400 border border-slate-800/90 shrink-0 shadow-inner">
            {machineCode}
          </div>

          {/* STATUS CAPSULE */}
          <div className="flex items-center gap-1 shrink-0">
            {currentStatus === 'READY' && (
              <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-800/80 border border-slate-700 text-slate-300 font-mono text-[10px] font-black tracking-wider uppercase whitespace-nowrap shadow-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                <span>READY</span>
              </div>
            )}

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

        {/* ROW 2: [ICON + NAMA + SUBTITLE] (Left) + [COMPACT ACTIONS] (Right) */}
        <div className="flex items-center justify-between gap-2 min-w-0">
          {/* Unit Name + Category */}
          <div className="flex items-center gap-1.5 min-w-0 flex-1">
            <span className="text-lg filter drop-shadow shrink-0">{matchedAssetType.icon}</span>
            <div className="min-w-0 flex-1">
              <h3 className="text-xs sm:text-sm font-chakra font-black text-white tracking-wide uppercase truncate leading-tight">
                {machine.name}
              </h3>
              <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wider block truncate">
                {currentStatus === 'RUNNING' || currentStatus === 'ENDING_SOON' || currentStatus === 'TIME_UP'
                  ? (session?.customerName ? `${session.customerName} (${session.packageName || 'Walk-in'})` : machine.customTypeLabel || matchedAssetType.name)
                  : (machine.customTypeLabel || matchedAssetType.name)}
              </span>
            </div>
          </div>

          {/* Compact Action Controls */}
          <div className="flex items-center gap-1 shrink-0">
            {/* READY -> COMPACT MULA SESI */}
            {currentStatus === 'READY' && (
              <button
                type="button"
                id={`btn-start-session-mob-${machine.id}`}
                onClick={() => {
                  playTapSound(settings.soundEnabled);
                  onStartSession(machine);
                }}
                className="w-auto px-3 py-1 rounded-lg bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 active:scale-95 text-slate-950 font-chakra font-black text-[11px] uppercase tracking-wider flex items-center justify-center gap-1 shadow-md shadow-amber-500/25 transition-all cursor-pointer ring-1 ring-amber-300/40 whitespace-nowrap"
              >
                <Play className="w-3 h-3 fill-slate-950 text-slate-950 stroke-[3]" />
                <span>MULA SESI</span>
              </button>
            )}

            {/* RUNNING / ENDING SOON -> COMPACT CONTROLS */}
            {(currentStatus === 'RUNNING' || currentStatus === 'ENDING_SOON') && session && (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  id={`btn-quick-ext-20-mob-${machine.id}`}
                  onClick={() => {
                    playTapSound(settings.soundEnabled);
                    onExtendSession(session, 20, 10);
                  }}
                  className="px-1.5 py-1 rounded-lg bg-[#080d14] hover:bg-[#121927] border border-slate-800 text-amber-300 font-mono font-bold text-[9px] uppercase transition-colors cursor-pointer whitespace-nowrap"
                  title="Tambah 20m"
                >
                  +20m
                </button>

                {onOpenQrModal && (
                  <button
                    type="button"
                    id={`btn-open-qr-mini-mob-${machine.id}`}
                    onClick={() => {
                      playTapSound(settings.soundEnabled);
                      onOpenQrModal(session, machine);
                    }}
                    className="p-1 rounded-lg bg-[#080d14] border border-slate-800 text-amber-300 transition-all cursor-pointer"
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
                  className="px-2 py-1 rounded-lg bg-[#151f2e] border border-slate-700/80 text-slate-200 font-chakra font-black text-[9px] uppercase tracking-wider transition-colors cursor-pointer whitespace-nowrap"
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
                  className="px-2 py-1 rounded-lg bg-[#182030] border border-slate-700/80 text-emerald-400 font-chakra font-black text-[9px] uppercase tracking-wider transition-colors cursor-pointer whitespace-nowrap"
                >
                  Tamat
                </button>
              </div>
            )}

            {/* TIME UP -> COMPACT CONTROLS */}
            {currentStatus === 'TIME_UP' && session && (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  id={`btn-timeup-ext-20-mob-${machine.id}`}
                  onClick={() => {
                    playTapSound(settings.soundEnabled);
                    onExtendSession(session, 20, 10);
                  }}
                  className="px-1.5 py-1 rounded-lg bg-[#151f2e] border border-amber-500/50 text-amber-300 font-chakra font-black text-[9px] uppercase tracking-wider transition-colors cursor-pointer whitespace-nowrap"
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
                  className="px-2.5 py-1 rounded-lg bg-rose-600 text-white font-chakra font-black text-[9px] uppercase tracking-wider shadow-sm shadow-rose-600/30 active:scale-95 transition-all cursor-pointer whitespace-nowrap"
                >
                  TAMATKAN
                </button>
              </div>
            )}

            {/* MAINTENANCE -> COMPACT CONTROL */}
            {currentStatus === 'MAINTENANCE' && (
              <button
                type="button"
                id={`btn-restore-ready-mob-${machine.id}`}
                onClick={() => {
                  playTapSound(settings.soundEnabled);
                  onToggleMaintenance(machine);
                }}
                className="px-2.5 py-1 rounded-lg bg-slate-800 text-white font-chakra font-black text-[9px] uppercase tracking-wider transition-colors cursor-pointer whitespace-nowrap"
              >
                READY
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* DESKTOP OPERATIONAL ROW VIEW (>= lg)                      */}
      {/* ========================================================= */}
      <div className="hidden lg:flex items-center justify-between gap-4">
        {/* LEFT SECTION: [ID UNIT] + [ICON + NAMA UNIT] + [JENIS UNIT] */}
        <div className="flex items-center gap-3 xl:gap-4 min-w-0">
          {/* 1. ID UNIT */}
          <div className="font-mono text-xs font-black uppercase tracking-wider px-2.5 py-1.5 rounded-xl bg-[#080d15] text-amber-400 border border-slate-800/90 shrink-0 text-center min-w-[76px] shadow-inner">
            {machineCode}
          </div>

          {/* 2. ICON + NAMA UNIT */}
          <div className="flex items-center gap-2.5 min-w-0 w-52 xl:w-60 shrink-0">
            <span className="text-2xl filter drop-shadow shrink-0">{matchedAssetType.icon}</span>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-chakra font-black text-white tracking-wide uppercase truncate leading-tight">
                {machine.name}
              </h3>
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block truncate">
                {machine.customTypeLabel || matchedAssetType.name}
              </span>
            </div>
          </div>

          {/* 3. JENIS UNIT (Kategori Badge) */}
          <div className="flex items-center shrink-0 w-28 xl:w-36">
            <span className="text-[10px] font-mono font-bold text-slate-300 uppercase bg-[#090f18] px-2.5 py-1 rounded-lg border border-slate-800/90 truncate">
              {machine.customTypeLabel || matchedAssetType.name}
            </span>
          </div>
        </div>

        {/* MIDDLE SECTION: [STATUS & LIVE TELEMETRY] */}
        <div className="flex-1 min-w-0 flex items-center justify-start gap-3">
          {/* READY STATUS */}
          {currentStatus === 'READY' && (
            <div className="flex items-center gap-2.5 flex-1">
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-slate-300 font-mono text-xs font-black tracking-wider uppercase whitespace-nowrap shadow-xs">
                <span className="w-2 h-2 rounded-full bg-slate-400" />
                <span>READY / STANDBY</span>
              </div>
            </div>
          )}

          {/* RUNNING / ENDING SOON STATUS */}
          {(currentStatus === 'RUNNING' || currentStatus === 'ENDING_SOON') && session && (
            <div className="flex items-center gap-3 flex-1 min-w-0">
              {/* Status Pill + Monospace Countdown */}
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

              {/* Session Metadata Capsule */}
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

              {/* Customer Alarm Stopped Notification Badge on Card */}
              {session.customerStoppedAlarmAt && (
                <div className="px-2 py-0.5 rounded-lg bg-rose-500/15 border border-rose-500/40 flex items-center gap-1.5 text-[10px] font-mono text-rose-300 animate-pulse whitespace-nowrap shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
                  <span>{session.customerStoppedAlarmReason === 'EARLY_STOPPED' ? 'Tamat Awal' : 'Alarm Ditutup'}</span>
                </div>
              )}
            </div>
          )}

          {/* TIME UP STATUS */}
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

          {/* MAINTENANCE STATUS */}
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
          {/* READY ACTION -> START SESSION */}
          {currentStatus === 'READY' && (
            <button
              type="button"
              id={`btn-start-session-${machine.id}`}
              onClick={() => {
                playTapSound(settings.soundEnabled);
                onStartSession(machine);
              }}
              className="w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 active:scale-95 text-slate-950 font-chakra font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md shadow-amber-500/25 transition-all cursor-pointer ring-1 ring-amber-300/40 whitespace-nowrap"
            >
              <Play className="w-3.5 h-3.5 fill-slate-950 text-slate-950 stroke-[3]" />
              <span>MULA SESI</span>
            </button>
          )}

          {/* RUNNING / ENDING SOON ACTIONS */}
          {(currentStatus === 'RUNNING' || currentStatus === 'ENDING_SOON') && session && (
            <div className="flex items-center gap-1.5 sm:gap-2 w-auto overflow-x-auto no-scrollbar">
              {/* Quick Extension Pills */}
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

              {/* QR Code Mini Modal trigger */}
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

              {/* Pause/Resume Switch */}
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

              {/* Complete / Tamatkan Sesi */}
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

          {/* TIME UP ACTIONS */}
          {currentStatus === 'TIME_UP' && session && (
            <div className="flex items-center gap-2 w-auto">
              {/* QR Code */}
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

          {/* MAINTENANCE ACTION */}
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
    </div>
  );
};

