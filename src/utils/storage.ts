import { Machine, RidePackage, Session, TransactionRecord, QueueItem, AppSettings } from '../types';

const STORAGE_KEYS = {
  INITIALIZED: 'rc_fun_ride_initialized_v1',
  MACHINES: 'rc_fun_ride_machines_v1',
  PACKAGES: 'rc_fun_ride_packages_v1',
  SESSIONS: 'rc_fun_ride_sessions_v1',
  TRANSACTIONS: 'rc_fun_ride_transactions_v1',
  QUEUE: 'rc_fun_ride_queue_v1',
  SETTINGS: 'rc_fun_ride_settings_v1',
};

export const DEFAULT_PACKAGES: RidePackage[] = [
  { id: 'pkg-20m', name: '20 MIN', durationMinutes: 20, price: 10, isPopular: true },
  { id: 'pkg-30m', name: '30 MIN', durationMinutes: 30, price: 15 },
  { id: 'pkg-60m', name: '60 MIN', durationMinutes: 60, price: 25 },
];

export const DEFAULT_MACHINES: Machine[] = [
  { id: 'm-exc-1', name: 'Excavator 1', type: 'excavator', status: 'READY' },
  { id: 'm-exc-2', name: 'Excavator 2', type: 'excavator', status: 'READY' },
  { id: 'm-bdz-1', name: 'Bulldozer 1', type: 'bulldozer', status: 'READY' },
  { id: 'm-dtk-1', name: 'Dump Truck 1', type: 'dumptruck', status: 'READY' },
];

export const DEFAULT_SETTINGS: AppSettings = {
  endingSoonThresholdSeconds: 300, // 5 minutes
  soundEnabled: true,
  alarmRepeat: true,
  vibrationEnabled: true,
  wakeLockEnabled: true,
  businessName: 'RC FUN RIDE',
  currencySymbol: 'RM',
};

export function loadInitialData(): {
  machines: Machine[];
  packages: RidePackage[];
  sessions: Session[];
  transactions: TransactionRecord[];
  queue: QueueItem[];
  settings: AppSettings;
} {
  if (typeof window === 'undefined') {
    return {
      machines: DEFAULT_MACHINES,
      packages: DEFAULT_PACKAGES,
      sessions: [],
      transactions: [],
      queue: [],
      settings: DEFAULT_SETTINGS,
    };
  }

  const isInitialized = localStorage.getItem(STORAGE_KEYS.INITIALIZED);

  let machines: Machine[] = [];
  let packages: RidePackage[] = [];
  let sessions: Session[] = [];
  let transactions: TransactionRecord[] = [];
  let queue: QueueItem[] = [];
  let settings: AppSettings = DEFAULT_SETTINGS;

  if (!isInitialized) {
    // First time run setup
    machines = DEFAULT_MACHINES;
    packages = DEFAULT_PACKAGES;
    sessions = [];
    transactions = [];
    queue = [];
    settings = DEFAULT_SETTINGS;

    localStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true');
    localStorage.setItem(STORAGE_KEYS.MACHINES, JSON.stringify(machines));
    localStorage.setItem(STORAGE_KEYS.PACKAGES, JSON.stringify(packages));
    localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions));
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
    localStorage.setItem(STORAGE_KEYS.QUEUE, JSON.stringify(queue));
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  } else {
    // SES 4.3: Load strictly what is stored. Empty means empty.
    try {
      const storedMachines = localStorage.getItem(STORAGE_KEYS.MACHINES);
      machines = storedMachines ? JSON.parse(storedMachines) : [];
    } catch {
      machines = [];
    }

    try {
      const storedPackages = localStorage.getItem(STORAGE_KEYS.PACKAGES);
      packages = storedPackages ? JSON.parse(storedPackages) : [];
    } catch {
      packages = [];
    }

    try {
      const storedSessions = localStorage.getItem(STORAGE_KEYS.SESSIONS);
      sessions = storedSessions ? JSON.parse(storedSessions) : [];
    } catch {
      sessions = [];
    }

    try {
      const storedTransactions = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
      transactions = storedTransactions ? JSON.parse(storedTransactions) : [];
    } catch {
      transactions = [];
    }

    try {
      const storedQueue = localStorage.getItem(STORAGE_KEYS.QUEUE);
      queue = storedQueue ? JSON.parse(storedQueue) : [];
    } catch {
      queue = [];
    }

    try {
      const storedSettings = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      settings = storedSettings ? { ...DEFAULT_SETTINGS, ...JSON.parse(storedSettings) } : DEFAULT_SETTINGS;
    } catch {
      settings = DEFAULT_SETTINGS;
    }
  }

  return { machines, packages, sessions, transactions, queue, settings };
}

export function saveMachines(machines: Machine[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.MACHINES, JSON.stringify(machines));
}

export function savePackages(packages: RidePackage[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.PACKAGES, JSON.stringify(packages));
}

export function saveSessions(sessions: Session[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions));
}

export function saveTransactions(transactions: TransactionRecord[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
}

export function saveQueue(queue: QueueItem[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.QUEUE, JSON.stringify(queue));
}

export function saveSettings(settings: AppSettings): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
}

export function resetToFactoryDefaults(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEYS.INITIALIZED);
  localStorage.removeItem(STORAGE_KEYS.MACHINES);
  localStorage.removeItem(STORAGE_KEYS.PACKAGES);
  localStorage.removeItem(STORAGE_KEYS.SESSIONS);
  localStorage.removeItem(STORAGE_KEYS.TRANSACTIONS);
  localStorage.removeItem(STORAGE_KEYS.QUEUE);
  localStorage.removeItem(STORAGE_KEYS.SETTINGS);
}
