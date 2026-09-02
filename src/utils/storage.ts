import { Machine, RidePackage, Session, TransactionRecord, QueueItem, AppSettings, AssetType } from '../types';

const STORAGE_KEYS = {
  INITIALIZED: 'rc_fun_ride_initialized_v1',
  MACHINES: 'rc_fun_ride_machines_v1',
  ASSET_TYPES: 'rc_fun_ride_asset_types_v1',
  PACKAGES: 'rc_fun_ride_packages_v1',
  SESSIONS: 'rc_fun_ride_sessions_v1',
  TRANSACTIONS: 'rc_fun_ride_transactions_v1',
  QUEUE: 'rc_fun_ride_queue_v1',
  SETTINGS: 'rc_fun_ride_settings_v1',
};

export const DEFAULT_ASSET_TYPES: AssetType[] = [
  { id: 'excavator', name: 'Excavator', icon: '🚜', active: true, createdAt: 1700000000000 },
  { id: 'bulldozer', name: 'Bulldozer', icon: '🚧', active: true, createdAt: 1700000000000 },
  { id: 'dumptruck', name: 'Dump Truck', icon: '🚛', active: true, createdAt: 1700000000000 },
  { id: 'crane', name: 'Crane', icon: '🏗️', active: true, createdAt: 1700000000000 },
  { id: 'loader', name: 'Loader', icon: '🚜', active: true, createdAt: 1700000000000 },
  { id: 'generic', name: 'Generic', icon: '🎮', active: true, createdAt: 1700000000000 },
];

export const DEFAULT_PACKAGES: RidePackage[] = [
  { id: 'pkg-20m', name: '20 MIN', durationMinutes: 20, price: 10, isPopular: true },
  { id: 'pkg-30m', name: '30 MIN', durationMinutes: 30, price: 15 },
  { id: 'pkg-60m', name: '60 MIN', durationMinutes: 60, price: 25 },
];

export const DEFAULT_MACHINES: Machine[] = [
  { id: 'm-exc-1', name: 'Excavator 1', type: 'excavator', typeId: 'excavator', status: 'READY' },
  { id: 'm-exc-2', name: 'Excavator 2', type: 'excavator', typeId: 'excavator', status: 'READY' },
  { id: 'm-bdz-1', name: 'Bulldozer 1', type: 'bulldozer', typeId: 'bulldozer', status: 'READY' },
  { id: 'm-dtk-1', name: 'Dump Truck 1', type: 'dumptruck', typeId: 'dumptruck', status: 'READY' },
];

export const DEFAULT_SETTINGS: AppSettings = {
  endingSoonThresholdSeconds: 300, // 5 minutes
  bufferMinutes: 3, // Auto bonus/buffer time for settling in (default 3 minutes)
  soundEnabled: true,
  alarmRepeat: true,
  vibrationEnabled: true,
  wakeLockEnabled: true,
  businessName: 'RC FUN RIDE',
  currencySymbol: 'RM',
  adminPin: '6381',
};

/**
 * Dynamically resolves an AssetType details (icon, display name, status)
 * Supports legacy slug keys ('excavator'), custom IDs ('type_123'), or custom names ('Forklift')
 */
export function resolveAssetType(
  typeIdOrName: string | undefined,
  assetTypes: AssetType[] = DEFAULT_ASSET_TYPES
): AssetType {
  if (!typeIdOrName) {
    return { id: 'generic', name: 'Lain-lain', icon: '🎮', active: true };
  }

  const query = typeIdOrName.trim().toLowerCase();

  // 1. Direct ID match
  const matchById = assetTypes.find((t) => t.id.toLowerCase() === query);
  if (matchById) return matchById;

  // 2. Name match (case-insensitive)
  const matchByName = assetTypes.find((t) => t.name.toLowerCase() === query);
  if (matchByName) return matchByName;

  // 3. Fallback to default presets if custom list didn't include standard defaults
  const matchDefault = DEFAULT_ASSET_TYPES.find(
    (t) => t.id.toLowerCase() === query || t.name.toLowerCase() === query
  );
  if (matchDefault) return matchDefault;

  // 4. Dynamic unknown asset type fallback with neat capitalised title
  const formattedName = typeIdOrName.charAt(0).toUpperCase() + typeIdOrName.slice(1);
  return {
    id: typeIdOrName,
    name: formattedName,
    icon: '🏎️',
    active: true,
  };
}

export function loadInitialData(): {
  machines: Machine[];
  assetTypes: AssetType[];
  packages: RidePackage[];
  sessions: Session[];
  transactions: TransactionRecord[];
  queue: QueueItem[];
  settings: AppSettings;
} {
  if (typeof window === 'undefined') {
    return {
      machines: DEFAULT_MACHINES,
      assetTypes: DEFAULT_ASSET_TYPES,
      packages: DEFAULT_PACKAGES,
      sessions: [],
      transactions: [],
      queue: [],
      settings: DEFAULT_SETTINGS,
    };
  }

  const isInitialized = localStorage.getItem(STORAGE_KEYS.INITIALIZED);

  let machines: Machine[] = [];
  let assetTypes: AssetType[] = [];
  let packages: RidePackage[] = [];
  let sessions: Session[] = [];
  let transactions: TransactionRecord[] = [];
  let queue: QueueItem[] = [];
  let settings: AppSettings = DEFAULT_SETTINGS;

  if (!isInitialized) {
    // First time run setup
    machines = DEFAULT_MACHINES;
    assetTypes = DEFAULT_ASSET_TYPES;
    packages = DEFAULT_PACKAGES;
    sessions = [];
    transactions = [];
    queue = [];
    settings = DEFAULT_SETTINGS;

    localStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true');
    localStorage.setItem(STORAGE_KEYS.MACHINES, JSON.stringify(machines));
    localStorage.setItem(STORAGE_KEYS.ASSET_TYPES, JSON.stringify(assetTypes));
    localStorage.setItem(STORAGE_KEYS.PACKAGES, JSON.stringify(packages));
    localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions));
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
    localStorage.setItem(STORAGE_KEYS.QUEUE, JSON.stringify(queue));
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  } else {
    // Load stored data safely
    try {
      const storedMachines = localStorage.getItem(STORAGE_KEYS.MACHINES);
      machines = storedMachines ? JSON.parse(storedMachines) : [];
    } catch {
      machines = [];
    }

    try {
      const storedTypes = localStorage.getItem(STORAGE_KEYS.ASSET_TYPES);
      assetTypes = storedTypes ? JSON.parse(storedTypes) : DEFAULT_ASSET_TYPES;
      if (!Array.isArray(assetTypes) || assetTypes.length === 0) {
        assetTypes = DEFAULT_ASSET_TYPES;
      }
    } catch {
      assetTypes = DEFAULT_ASSET_TYPES;
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
      if (settings.adminPin === '5313' || !settings.adminPin) {
        settings.adminPin = '6381';
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
      }
    } catch {
      settings = DEFAULT_SETTINGS;
    }
  }

  return { machines, assetTypes, packages, sessions, transactions, queue, settings };
}

export function saveMachines(machines: Machine[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.MACHINES, JSON.stringify(machines));
}

export function saveAssetTypes(assetTypes: AssetType[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.ASSET_TYPES, JSON.stringify(assetTypes));
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
  localStorage.removeItem(STORAGE_KEYS.ASSET_TYPES);
  localStorage.removeItem(STORAGE_KEYS.PACKAGES);
  localStorage.removeItem(STORAGE_KEYS.SESSIONS);
  localStorage.removeItem(STORAGE_KEYS.TRANSACTIONS);
  localStorage.removeItem(STORAGE_KEYS.QUEUE);
  localStorage.removeItem(STORAGE_KEYS.SETTINGS);
}
