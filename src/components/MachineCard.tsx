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
} from 'lucide-react';
import { Machine, Session, MachineStatus, AppSettings } from '../types';
import { calculateSessionTime, deriveMachineStatus, formatClockTime, formatTimeRemaining, getStatusBadgeConfig } from '../utils/format';
import { playTapSound } from '../utils/sound';

interface MachineCardProps {
  machine: Machine;
  session?: Session;
  nowTimestamp: number;
  settings: AppSettings;
  onStartSession: (machine: Machine) => void;
  onPauseResumeSession: (session: Session) => void;
  onCompleteSession: (session: Session) => void;
  onExtendSession: (session: Session, minutes: number, price?: number) => void;
  onOpenCustomExtend: (session: Session) => void;
  onCancelSession: (session: Session) => void;
  onToggleMaintenance: (machine: Machine) => void;
}

export const MachineCard: React.FC<MachineCardProps> = ({
  machine,
  session,
  nowTimestamp,
  settings,
  onStartSession,
  onPauseResumeSession,
  onCompleteSession,
  onExtendSession,
  onOpenCustomExtend,
  onCancelSession,
  onToggleMaintenance,
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

  // Helper for Machine Type icon
  const renderMachineTypeIcon = () => {
    switch (machine.type) {
      case 'excavator':
        return '🚜';
      case 'bulldozer':
        return '🚧';
      case 'dumptruck':
        return '🚛';
      case 'loader':
        return '🚜';
      case 'crane':
        return '🏗️';
      case 'generic':
      default:
        return '🎮';
    }
  };

  // Machine ID badge (e.g. M-EXC-1, M-BULL-1)
  const machineCode = machine.id.toUpperCase().replace('M_', '').replace('_', '-');

  // Motorsport Card Styles & Glowing Borders
  let cardBorderClass = 'border-slate-800 hover:border-slate-700';
  let cardBgClass = 'bg-[#121927]';
  let statusBadgeBg = 'bg-[#182335] text-slate-300 border-slate-700';
  let statusDotClass = 'bg-slate-500';
  let statusText = 'OFFLINE';

  if (currentStatus === 'READY') {
    cardBorderClass = 'border-emerald-500/40 hover:border-emerald-500/80';
    cardBgClass = 'bg-gradient-to-b from-[#131e2c] to-[#0f1723]';
    statusBadgeBg = 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40';
    statusDotClass = 'bg-emerald-400 ring-2 ring-emerald-500/30 animate-pulse';
    statusText = 'READY';
  } else if (currentStatus === 'RUNNING') {
    cardBorderClass = 'border-amber-500/50 hover:border-amber-400';
    cardBgClass = 'bg-gradient-to-b from-[#182234] to-[#111824]';
    statusBadgeBg = 'bg-amber-950/60 text-amber-300 border-amber-500/40';
    statusDotClass = 'bg-amber-400 ring-2 ring-amber-500/40 animate-pulse';
    statusText = 'RUNNING';
  } else if (currentStatus === 'ENDING_SOON') {
    cardBorderClass = 'border-amber-400 hover:border-amber-300';
    cardBgClass = 'bg-gradient-to-b from-[#221b18] to-[#15121b]';
    statusBadgeBg = 'bg-amber-500 text-slate-950 border-amber-300 font-black';
    statusDotClass = 'bg-amber-300 ring-2 ring-amber-400 animate-ping';
    statusText = 'ENDING SOON';
  } else if (currentStatus === 'TIME_UP') {
    cardBorderClass = 'border-rose-500 hover:border-rose-400 ring-1 ring-rose-500/40';
    cardBgClass = 'bg-gradient-to-b from-[#281318] to-[#180e12]';
    statusBadgeBg = 'bg-rose-600 text-white border-rose-400 font-black animate-pulse';
    statusDotClass = 'bg-rose-400 ring-2 ring-rose-500 animate-bounce';
    statusText = 'TIME UP';
  } else if (currentStatus === 'MAINTENANCE') {
    cardBorderClass = 'border-slate-800';
    cardBgClass = 'bg-[#0f141f]/70';
    statusBadgeBg = 'bg-slate-800 text-slate-400 border-slate-700';
    statusDotClass = 'bg-slate-500';
    statusText = 'SERVICE';
  }

  return (
    <div
      id={`machine-card-${machine.id}`}
      className={`rounded-2xl border transition-all duration-300 flex flex-col justify-between overflow-hidden relative p-5 shadow-xl ${cardBgClass} ${cardBorderClass}`}
    >
      {/* Top Technical Header: ID Badge + Live Telemetry LED */}
      <div className="flex items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-1.5">
          <span className="font-mono text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-[#0b0f17] text-amber-400/90 border border-slate-800">
            ID: {machineCode}
          </span>
          <span className="text-[10px] font-mono text-slate-400 uppercase">
            {machine.customTypeLabel || machine.type}
          </span>
        </div>

        {/* Operational Status Pill */}
        <div className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[10px] font-black tracking-wider uppercase font-mono ${statusBadgeBg}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${statusDotClass}`}></span>
          <span>{statusText}</span>
        </div>
      </div>

      {/* Machine Identity Section */}
      <div className="pt-3 pb-2">
        <div className="flex items-center gap-2.5">
          <span className="text-2xl filter drop-shadow-md">{renderMachineTypeIcon()}</span>
          <div className="min-w-0">
            <h3 className="text-xl font-chakra font-black text-white tracking-wide uppercase truncate">
              {machine.name}
            </h3>
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest block">
              CONTROL UNIT
            </span>
          </div>
        </div>
      </div>

      {/* Dynamic Telemetry Display according to State */}
      <div className="my-3">
        {/* READY STATE */}
        {currentStatus === 'READY' && (
          <div className="space-y-3">
            <div className="p-3.5 rounded-xl bg-[#0c121c] border border-emerald-500/20 text-center">
              <div className="text-[11px] font-mono text-emerald-400 font-bold uppercase tracking-widest flex items-center justify-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>UNIT OPERATIONAL</span>
              </div>
              <p className="text-[10px] text-slate-400 font-mono mt-0.5 uppercase tracking-wider">
                AVAILABLE FOR SESSION
              </p>
            </div>
          </div>
        )}

        {/* ACTIVE / RUNNING / ENDING SOON / TIME UP STATES */}
        {(currentStatus === 'RUNNING' || currentStatus === 'ENDING_SOON' || currentStatus === 'TIME_UP') && session && (
          <div className="space-y-2.5">
            {/* Digital Stopwatch Display */}
            <div className="p-3.5 rounded-xl bg-[#0c121c] border border-slate-800 text-center relative overflow-hidden">
              {/* Progress Bar Top */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-slate-800">
                <div
                  className={`h-full transition-all duration-500 ${
                    currentStatus === 'TIME_UP'
                      ? 'bg-rose-500 w-full animate-pulse'
                      : currentStatus === 'ENDING_SOON'
                      ? 'bg-amber-400'
                      : 'bg-gradient-to-r from-amber-500 to-amber-300'
                  }`}
                  style={{ width: currentStatus === 'TIME_UP' ? '100%' : `${progressPercent}%` }}
                ></div>
              </div>

              {/* Monospace Countdown Readout */}
              <div className="flex items-baseline justify-center gap-1 mt-0.5">
                <span
                  className={`text-4xl font-mono font-black tracking-tight ${
                    currentStatus === 'TIME_UP'
                      ? 'text-rose-500 animate-pulse'
                      : currentStatus === 'ENDING_SOON'
                      ? 'text-amber-400'
                      : 'text-white'
                  }`}
                >
                  {remainingFormatted}
                </span>
              </div>

              <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mt-1 pt-1 border-t border-slate-800/80">
                <span>MULA: {formatClockTime(session.startTime)}</span>
                <span className={currentStatus === 'TIME_UP' ? 'text-rose-400 font-bold' : 'text-slate-300'}>
                  TAMAT: {formatClockTime(session.endTime)}
                </span>
              </div>
            </div>

            {/* Session Metadata Capsule */}
            <div className="px-3 py-2 rounded-xl bg-[#0e1522] border border-slate-800 flex items-center justify-between text-[11px] font-mono">
              <span className="text-amber-400 font-bold truncate max-w-[120px]">
                {session.packageName} ({settings.currencySymbol}{session.price})
              </span>
              <span className="text-slate-200 font-semibold truncate max-w-[110px] text-right">
                {session.customerName || 'Walk-in'}
              </span>
            </div>
          </div>
        )}

        {/* MAINTENANCE STATE */}
        {currentStatus === 'MAINTENANCE' && (
          <div className="p-4 rounded-xl bg-[#0c121c] border border-slate-800 text-center">
            <Wrench className="w-6 h-6 mx-auto text-amber-500/80 mb-1.5" />
            <p className="text-xs font-mono font-black text-amber-400 uppercase tracking-widest">
              SERVICE / MAINTENANCE
            </p>
            <p className="text-[10px] text-slate-500 font-mono mt-0.5">
              Unit temporarily locked
            </p>
          </div>
        )}
      </div>

      {/* Card Action Hub Footer */}
      <div className="pt-3 border-t border-slate-800/80">
        {/* READY ACTION -> START RACE / START SESSION */}
        {currentStatus === 'READY' && (
          <button
            type="button"
            id={`btn-start-session-${machine.id}`}
            onClick={() => {
              playTapSound(settings.soundEnabled);
              onStartSession(machine);
            }}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 active:scale-[0.98] text-slate-950 font-chakra font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all cursor-pointer ring-1 ring-amber-300/40"
          >
            <Play className="w-3.5 h-3.5 fill-slate-950 text-slate-950" />
            <span>MULA SESI</span>
          </button>
        )}

        {/* RUNNING / ENDING SOON ACTIONS */}
        {(currentStatus === 'RUNNING' || currentStatus === 'ENDING_SOON') && session && (
          <div className="space-y-2">
            {/* Primary Race Switches: Pause & Complete */}
            <div className="flex gap-2">
              <button
                type="button"
                id={`btn-pause-resume-${machine.id}`}
                onClick={() => {
                  playTapSound(settings.soundEnabled);
                  onPauseResumeSession(session);
                }}
                className="bg-[#151f2e] hover:bg-[#1a283c] border border-slate-700/80 hover:border-slate-600 p-2.5 rounded-xl flex-1 text-slate-200 font-chakra font-black text-xs uppercase tracking-wider transition-colors cursor-pointer text-center"
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
                className="bg-[#182030] hover:bg-[#202c40] border border-slate-700/80 hover:border-emerald-500/40 p-2.5 rounded-xl flex-1 text-emerald-400 font-chakra font-black text-xs uppercase tracking-wider transition-colors cursor-pointer text-center"
              >
                Tamatkan
              </button>
            </div>

            {/* Quick Extension Telemetry Buttons */}
            <div className="flex items-center gap-1.5 pt-0.5">
              <button
                type="button"
                id={`btn-quick-ext-20-${machine.id}`}
                onClick={() => {
                  playTapSound(settings.soundEnabled);
                  onExtendSession(session, 20, 10);
                }}
                className="flex-1 py-1.5 px-2 rounded-lg bg-[#0c121c] border border-slate-800 hover:border-amber-500/50 text-amber-300 font-mono font-bold text-[10px] uppercase text-center transition-colors cursor-pointer"
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
                className="flex-1 py-1.5 px-2 rounded-lg bg-[#0c121c] border border-slate-800 hover:border-amber-500/50 text-amber-300 font-mono font-bold text-[10px] uppercase text-center transition-colors cursor-pointer"
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
                className="p-1.5 rounded-lg bg-[#0c121c] border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
                title="Pilihan Lanjut Tersuai"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* TIME UP ACTIONS */}
        {currentStatus === 'TIME_UP' && session && (
          <div className="flex flex-col gap-2">
            <button
              type="button"
              id={`btn-timeup-complete-${machine.id}`}
              onClick={() => {
                playTapSound(settings.soundEnabled);
                onCompleteSession(session);
              }}
              className="bg-rose-600 hover:bg-rose-500 text-white py-2.5 rounded-xl font-chakra font-black text-xs uppercase tracking-wider shadow-lg shadow-rose-600/30 active:scale-95 transition-all cursor-pointer"
            >
              TAMATKAN SESI
            </button>
            <button
              type="button"
              id={`btn-timeup-ext-20-${machine.id}`}
              onClick={() => {
                playTapSound(settings.soundEnabled);
                onExtendSession(session, 20, 10);
              }}
              className="bg-[#151f2e] border border-amber-500/50 text-amber-300 py-2 rounded-xl font-chakra font-black text-xs uppercase tracking-wider hover:bg-amber-500/10 transition-colors cursor-pointer"
            >
              SAMBUNG +20M (RM10)
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
            className="w-full py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-chakra font-black text-xs uppercase tracking-wider transition-colors cursor-pointer"
          >
            SET TO READY
          </button>
        )}
      </div>
    </div>
  );
};
