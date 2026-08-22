import { Session, MachineStatus } from '../types';

export function formatTimeRemaining(seconds: number): string {
  if (seconds <= 0) return '00:00';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export function formatClockTime(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function calculateSessionTime(
  session: Session,
  nowTimestamp: number
): {
  remainingSeconds: number;
  totalDurationSeconds: number;
  elapsedSeconds: number;
  progressPercent: number;
  isOvertime: boolean;
} {
  const totalDurationSeconds = session.durationMinutes * 60;

  // If paused, the effective current time is fixed at pausedAt
  const effectiveNow = session.isPaused && session.pausedAt ? session.pausedAt : nowTimestamp;

  // Effective end time is session.startTime + totalDurationMs + accumulatedPauseMs
  const effectiveEndTime = session.startTime + totalDurationSeconds * 1000 + session.accumulatedPauseMs;

  const diffMs = effectiveEndTime - effectiveNow;
  const remainingSeconds = Math.max(0, Math.ceil(diffMs / 1000));
  const elapsedSeconds = Math.max(0, totalDurationSeconds - remainingSeconds);
  const progressPercent = Math.min(100, Math.max(0, (elapsedSeconds / totalDurationSeconds) * 100));
  const isOvertime = diffMs <= 0;

  return {
    remainingSeconds,
    totalDurationSeconds,
    elapsedSeconds,
    progressPercent,
    isOvertime,
  };
}

export function deriveMachineStatus(
  status: MachineStatus,
  session: Session | undefined,
  nowTimestamp: number,
  endingSoonThresholdSeconds: number
): MachineStatus {
  if (status === 'MAINTENANCE') return 'MAINTENANCE';
  if (!session || session.status !== 'ACTIVE') return 'READY';

  const { remainingSeconds, isOvertime } = calculateSessionTime(session, nowTimestamp);

  if (isOvertime || remainingSeconds === 0) {
    return 'TIME_UP';
  }

  if (remainingSeconds <= endingSoonThresholdSeconds) {
    return 'ENDING_SOON';
  }

  return 'RUNNING';
}

export function getStatusBadgeConfig(status: MachineStatus) {
  switch (status) {
    case 'READY':
      return {
        label: 'READY',
        color: 'emerald',
        dot: 'bg-emerald-500',
        bg: 'bg-emerald-50 dark:bg-emerald-950/40',
        border: 'border-emerald-200 dark:border-emerald-800',
        text: 'text-emerald-700 dark:text-emerald-300',
        iconEmoji: '🟢',
      };
    case 'RUNNING':
      return {
        label: 'RUNNING',
        color: 'blue',
        dot: 'bg-blue-500',
        bg: 'bg-blue-50 dark:bg-blue-950/40',
        border: 'border-blue-200 dark:border-blue-800',
        text: 'text-blue-700 dark:text-blue-300',
        iconEmoji: '🔵',
      };
    case 'ENDING_SOON':
      return {
        label: 'ENDING SOON',
        color: 'amber',
        dot: 'bg-amber-500 animate-ping',
        bg: 'bg-amber-50 dark:bg-amber-950/40',
        border: 'border-amber-300 dark:border-amber-700 shadow-amber-500/10',
        text: 'text-amber-700 dark:text-amber-300',
        iconEmoji: '🟡',
      };
    case 'TIME_UP':
      return {
        label: 'TIME UP',
        color: 'red',
        dot: 'bg-red-500 animate-pulse',
        bg: 'bg-red-50 dark:bg-red-950/40',
        border: 'border-red-300 dark:border-red-700 shadow-red-500/20',
        text: 'text-red-700 dark:text-red-300',
        iconEmoji: '🔴',
      };
    case 'MAINTENANCE':
      return {
        label: 'MAINTENANCE',
        color: 'slate',
        dot: 'bg-slate-400',
        bg: 'bg-slate-100 dark:bg-slate-800/60',
        border: 'border-slate-300 dark:border-slate-700',
        text: 'text-slate-600 dark:text-slate-300',
        iconEmoji: '🔧',
      };
  }
}
