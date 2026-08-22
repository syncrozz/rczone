export type MachineType = 'excavator' | 'bulldozer' | 'dumptruck' | 'crane' | 'loader' | 'generic';

export type MachineStatus = 'READY' | 'RUNNING' | 'ENDING_SOON' | 'TIME_UP' | 'MAINTENANCE';

export interface Machine {
  id: string;
  name: string;
  type: MachineType;
  customTypeLabel?: string;
  status: MachineStatus;
  activeSessionId?: string;
  color?: string;
}

export interface RidePackage {
  id: string;
  name: string;
  durationMinutes: number;
  price: number; // in MYR / RM
  isPopular?: boolean;
}

export interface Session {
  id: string;
  machineId: string;
  machineName: string;
  packageId: string;
  packageName: string;
  durationMinutes: number;
  price: number;
  customerName?: string;
  startTime: number; // timestamp (ms)
  endTime: number; // expected timestamp (ms) = startTime + durationMs + accumulatedPauseMs
  pausedAt?: number; // timestamp when paused
  accumulatedPauseMs: number;
  isPaused: boolean;
  status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  completedAt?: number;
  extensionsCount?: number;
}

export interface TransactionRecord {
  id: string;
  sessionId: string;
  machineId: string;
  machineName: string;
  packageName: string;
  durationMinutes: number;
  price: number;
  customerName?: string;
  startTime: number;
  endTime: number;
  status: 'COMPLETED' | 'CANCELLED' | 'EXTENDED';
  createdAt: number;
}

export interface QueueItem {
  id: string;
  customerName: string;
  preferredMachineType?: MachineType | 'any';
  preferredMachineId?: string;
  packageId?: string;
  pax?: number;
  notes?: string;
  createdAt: number;
}

export interface AppSettings {
  endingSoonThresholdSeconds: number; // Default 300 (5 minutes)
  soundEnabled: boolean;
  alarmRepeat: boolean;
  vibrationEnabled: boolean;
  wakeLockEnabled: boolean;
  businessName: string;
  currencySymbol: string;
  adminPin?: string; // Default '5313'
}
