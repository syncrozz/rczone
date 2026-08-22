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
  SlidersHorizontal
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

  const badgeConfig = getStatusBadgeConfig(currentStatus);

  const timeData = session ? calculateSessionTime(session, nowTimestamp) : null;
  const remainingFormatted = timeData ? formatTimeRemaining(timeData.remainingSeconds) : '--:--';

  // Helper for Machine Type icon / badge
  const renderMachineTypeIcon = () => {
    switch (machine.type) {
      case 'excavator':
        return '🚜';
      case 'bulldozer':
        return '🚧';
      case 'dumptruck':
        return '🚛';
      case 'loader':
      case 'crane':
      default:
        return '🎮';
    }
  };

  // Card Border, Background and Accent styles based on status in Bento Grid Theme
  let cardBorderClass = 'border-2 border-slate-200 dark:border-slate-800';
  let cardBgClass = 'bg-white dark:bg-slate-900';
  let cardGlow = 'shadow-sm';
  let statusDotClass = 'bg-slate-400';

  if (currentStatus === 'READY') {
    cardBorderClass = 'border-2 border-emerald-500/80 dark:border-emerald-500';
    statusDotClass = 'bg-emerald-500 animate-pulse';
  } else if (currentStatus === 'RUNNING') {
    cardBorderClass = 'border-2 border-blue-500 dark:border-blue-500';
    statusDotClass = 'bg-blue-500';
    cardGlow = 'shadow-md shadow-blue-500/5';
  } else if (currentStatus === 'ENDING_SOON') {
    cardBorderClass = 'border-2 border-amber-400 dark:border-amber-400';
    cardBgClass = 'bg-amber-50/60 dark:bg-amber-950/20';
    statusDotClass = 'bg-amber-500 animate-ping';
    cardGlow = 'shadow-md shadow-amber-500/10';
  } else if (currentStatus === 'TIME_UP') {
    cardBorderClass = 'border-2 border-rose-500 dark:border-rose-500';
    cardBgClass = 'bg-rose-50/70 dark:bg-rose-950/30';
    statusDotClass = 'bg-rose-600 animate-bounce';
    cardGlow = 'shadow-lg shadow-rose-500/20';
  } else if (currentStatus === 'MAINTENANCE') {
    cardBorderClass = 'border-2 border-slate-300 dark:border-slate-700';
    cardBgClass = 'bg-slate-50 dark:bg-slate-900/50';
    statusDotClass = 'bg-slate-400';
  }

  // Machine ID badge fallback (e.g. EX-01, BZ-01)
  const machineCode = machine.id.toUpperCase().replace('M_', '').replace('_', '-');

  return (
    <div
      id={`machine-card-${machine.id}`}
      className={`rounded-2xl transition-all duration-300 flex flex-col justify-between overflow-hidden relative p-5 ${cardBgClass} ${cardBorderClass} ${cardGlow}`}
    >
      {/* Top Right Live Dot Indicator */}
      <div className="absolute top-0 right-0 p-3">
        <span className={`flex h-3 w-3 rounded-full ${statusDotClass}`}></span>
      </div>

      {/* Top Header info */}
      <div>
        <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
          ID: {machineCode}
        </p>
        <div className="flex items-center gap-2">
          <span className="text-xl">{renderMachineTypeIcon()}</span>
          <h3 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tight">
            {machine.name}
          </h3>
        </div>
      </div>

      {/* Dynamic Body Content according to state */}
      <div className="my-4">
        {currentStatus === 'READY' && (
          <div>
            <div className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-sm font-black py-2.5 px-3 rounded-xl text-center uppercase tracking-widest border border-emerald-100 dark:border-emerald-800/60">
              READY
            </div>
            <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-[11px] font-bold text-slate-400">
              <span>Status: Sedia Beroperasi</span>
              <span className="text-emerald-600 dark:text-emerald-400">● AVAILABLE</span>
            </div>
          </div>
        )}

        {(currentStatus === 'RUNNING' || currentStatus === 'ENDING_SOON' || currentStatus === 'TIME_UP') && session && (
          <div>
            <div className="text-center">
              <p
                className={`text-4xl font-mono font-black mb-2 tracking-tight ${
                  currentStatus === 'TIME_UP'
                    ? 'text-rose-600 dark:text-rose-400'
                    : currentStatus === 'ENDING_SOON'
                    ? 'text-amber-600 dark:text-amber-400'
                    : 'text-blue-600 dark:text-blue-400'
                }`}
              >
                {remainingFormatted}
              </p>
              <div
                className={`text-sm font-black py-2 px-3 rounded-xl uppercase tracking-widest text-center shadow-xs ${
                  currentStatus === 'TIME_UP'
                    ? 'bg-rose-600 text-white'
                    : currentStatus === 'ENDING_SOON'
                    ? 'bg-amber-400 text-white'
                    : 'bg-blue-600 text-white'
                }`}
              >
                {currentStatus === 'TIME_UP'
                  ? 'TIME UP'
                  : currentStatus === 'ENDING_SOON'
                  ? 'ENDING SOON'
                  : 'RUNNING'}
              </div>
            </div>

            {/* Session Info Ribbon */}
            <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] font-bold">
              <span className="text-slate-500 dark:text-slate-400">
                Pakej: {session.packageName} ({settings.currencySymbol}{session.price})
              </span>
              <span className="text-slate-700 dark:text-slate-300 font-semibold truncate max-w-[120px]">
                {session.customerName || 'Walk-in'}
              </span>
            </div>
          </div>
        )}

        {currentStatus === 'MAINTENANCE' && (
          <div className="py-4 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-center">
            <Wrench className="w-6 h-6 mx-auto text-slate-400 mb-1" />
            <p className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest">
              MAINTENANCE
            </p>
          </div>
        )}
      </div>

      {/* Card Action Footer */}
      <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80">
        {currentStatus === 'READY' && (
          <button
            type="button"
            id={`btn-start-session-${machine.id}`}
            onClick={() => {
              playTapSound(settings.soundEnabled);
              onStartSession(machine);
            }}
            className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md shadow-blue-500/20 transition-all cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-white" />
            <span>MULA SESI</span>
          </button>
        )}

        {(currentStatus === 'RUNNING' || currentStatus === 'ENDING_SOON') && session && (
          <div className="space-y-2">
            <div className="flex gap-2">
              <button
                type="button"
                id={`btn-pause-resume-${machine.id}`}
                onClick={() => {
                  playTapSound(settings.soundEnabled);
                  onPauseResumeSession(session);
                }}
                className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 p-2.5 rounded-xl flex-1 text-slate-700 dark:text-slate-200 font-bold text-xs uppercase transition-colors cursor-pointer text-center"
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
                className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 p-2.5 rounded-xl flex-1 text-slate-700 dark:text-slate-200 font-bold text-xs uppercase transition-colors cursor-pointer text-center"
              >
                Tamatkan
              </button>
            </div>

            {/* Quick Extension Mini Bar */}
            <div className="flex items-center gap-1.5 pt-1">
              <button
                type="button"
                id={`btn-quick-ext-20-${machine.id}`}
                onClick={() => {
                  playTapSound(settings.soundEnabled);
                  onExtendSession(session, 20, 10);
                }}
                className="flex-1 py-1 px-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold text-[10px] uppercase text-center hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer"
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
                className="flex-1 py-1 px-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold text-[10px] uppercase text-center hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer"
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
                className="p-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer"
                title="Pilihan Lanjut"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {currentStatus === 'TIME_UP' && session && (
          <div className="flex flex-col gap-2">
            <button
              type="button"
              id={`btn-timeup-complete-${machine.id}`}
              onClick={() => {
                playTapSound(settings.soundEnabled);
                onCompleteSession(session);
              }}
              className="bg-rose-700 hover:bg-rose-800 text-white py-2.5 rounded-xl font-black text-xs uppercase tracking-wider shadow-md active:scale-95 transition-all cursor-pointer"
            >
              TAMATKAN
            </button>
            <button
              type="button"
              id={`btn-timeup-ext-20-${machine.id}`}
              onClick={() => {
                playTapSound(settings.soundEnabled);
                onExtendSession(session, 20, 10);
              }}
              className="bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 py-2 rounded-xl font-black text-xs uppercase tracking-wider hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
            >
              SAMBUNG +20M
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
            className="w-full py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
          >
            SET TO READY
          </button>
        )}
      </div>
    </div>
  );
};
