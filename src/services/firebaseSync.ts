import { doc, setDoc, getDoc, onSnapshot, getDocFromServer } from 'firebase/firestore';
import { signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirebaseApp, getFirebaseDb, getFirebaseAuth, firebaseConfig } from './firebase';
import { Machine, RidePackage, Session, TransactionRecord, QueueItem, AppSettings, AssetType, CustomerAlert } from '../types';
import { DEFAULT_MACHINES, DEFAULT_ASSET_TYPES, DEFAULT_PACKAGES, DEFAULT_SETTINGS } from '../utils/storage';

// Initialize Firebase services from unified configuration
const app = getFirebaseApp();
export const db = getFirebaseDb()!;
export const auth = getFirebaseAuth()!;

export type CloudSyncStatus = 'CONNECTING' | 'CONNECTED' | 'ERROR' | 'OFFLINE';

export enum FirestoreOperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: FirestoreOperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: FirestoreOperationType, path: string | null): FirestoreErrorInfo {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth?.currentUser?.uid,
      email: auth?.currentUser?.email,
      emailVerified: auth?.currentUser?.emailVerified,
      isAnonymous: auth?.currentUser?.isAnonymous,
      tenantId: auth?.currentUser?.tenantId,
      providerInfo: auth?.currentUser?.providerData?.map((provider) => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  return errInfo;
}

export interface CloudSyncInfo {
  status: CloudSyncStatus;
  errorMessage?: string;
  lastSyncedAt?: number;
  projectId: string;
  databaseId: string;
}

let currentSyncStatus: CloudSyncStatus = 'CONNECTING';
let currentSyncError: string | undefined = undefined;
let lastSyncedTimestamp: number | undefined = undefined;

export const getCloudSyncInfo = (): CloudSyncInfo => ({
  status: currentSyncStatus,
  errorMessage: currentSyncError,
  lastSyncedAt: lastSyncedTimestamp,
  projectId: firebaseConfig.projectId || 'syncrozz-platform',
  databaseId: '(default)',
});

// Authenticate anonymously so security rules work seamlessly
let authPromise: Promise<void> | null = null;
export function ensureAuth(): Promise<void> {
  if (!authPromise) {
    authPromise = new Promise((resolve) => {
      if (!auth) {
        resolve();
        return;
      }
      onAuthStateChanged(auth, (user) => {
        if (user) {
          resolve();
        } else {
          signInAnonymously(auth)
            .then(() => resolve())
            .catch((err) => {
              console.warn('Anonymous auth warning (continuing without auth):', err);
              resolve();
            });
        }
      });
    });
  }
  return authPromise;
}

// Global Cloud Sync Root Document
const SYNC_COLLECTION = 'rc_system';
const SYNC_DOC_ID = 'state';

export interface CloudSystemState {
  machines: Machine[];
  assetTypes?: AssetType[];
  packages: RidePackage[];
  sessions: Session[];
  transactions: TransactionRecord[];
  queue: QueueItem[];
  settings: AppSettings;
  customerAlerts?: CustomerAlert[];
  updatedAt: number;
}

/**
 * Recursively strip undefined values so Firestore setDoc never throws Unsupported field value: undefined
 */
export function sanitizeForFirestore<T>(data: T): T {
  if (data === undefined || data === null) return data;
  return JSON.parse(JSON.stringify(data));
}

/**
 * Diagnostic test to verify live connection to Cloud Firestore
 */
export async function testFirestoreConnection(): Promise<{ ok: boolean; message: string }> {
  try {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return { ok: false, message: 'Peranti anda sedang berada di luar talian (No Internet Connection).' };
    }
    await ensureAuth();
    const docRef = doc(db, SYNC_COLLECTION, SYNC_DOC_ID);
    await getDocFromServer(docRef);
    currentSyncStatus = 'CONNECTED';
    currentSyncError = undefined;
    return { ok: true, message: 'Sambungan Cloud Firestore berjaya dan disahkan aktif.' };
  } catch (err: unknown) {
    handleFirestoreError(err, FirestoreOperationType.GET, `${SYNC_COLLECTION}/${SYNC_DOC_ID}`);
    const rawMsg = err instanceof Error ? err.message : String(err);
    currentSyncStatus = 'ERROR';
    let friendlyMsg = rawMsg;
    if (rawMsg.includes('offline') || rawMsg.includes('unavailable') || rawMsg.includes('not-found')) {
      friendlyMsg = `Pangkalan data Cloud Firestore bagi projek '${firebaseConfig.projectId}' belum wujud atau tidak aktif di rantau (default). Sila cipta pangkalan data di Firebase Console.`;
    } else if (rawMsg.includes('permission-denied')) {
      friendlyMsg = 'Akses ditolak (Permission Denied). Sila semak Firestore Security Rules.';
    }
    currentSyncError = friendlyMsg;
    return { ok: false, message: friendlyMsg };
  }
}

/**
 * Subscribe to real-time Cloud updates across all devices
 */
export function subscribeToCloudSync(
  onUpdate: (data: Partial<CloudSystemState>) => void,
  onError?: (err: Error) => void,
  onStatusChange?: (status: CloudSyncStatus, errorMsg?: string) => void,
  options?: { isReadOnly?: boolean; initialAdminState?: CloudSystemState }
): () => void {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    currentSyncStatus = 'OFFLINE';
    currentSyncError = 'Tiada sambungan internet.';
    onStatusChange?.('OFFLINE', currentSyncError);
  } else {
    currentSyncStatus = 'CONNECTING';
    onStatusChange?.('CONNECTING');
  }

  ensureAuth();
  const docRef = doc(db, SYNC_COLLECTION, SYNC_DOC_ID);

  const unsubscribe = onSnapshot(
    docRef,
    (snapshot) => {
      currentSyncStatus = 'CONNECTED';
      currentSyncError = undefined;
      lastSyncedTimestamp = Date.now();
      onStatusChange?.('CONNECTED');

      if (snapshot.exists()) {
        const data = snapshot.data() as CloudSystemState;
        onUpdate(data);
      } else if (!options?.isReadOnly && options?.initialAdminState) {
        // Admin first-time seeding with existing local state (never wipe with empty sessions)
        const sanitizedSeed = sanitizeForFirestore({ ...options.initialAdminState, updatedAt: Date.now() });
        setDoc(docRef, sanitizedSeed, { merge: true }).catch((err) =>
          console.warn('Initial cloud seed error:', err)
        );
      }
    },
    (error) => {
      handleFirestoreError(error, FirestoreOperationType.GET, `${SYNC_COLLECTION}/${SYNC_DOC_ID}`);
      console.warn('Realtime cloud sync listener error:', error);
      currentSyncStatus = 'ERROR';
      const rawMsg = error.message || String(error);
      let friendlyMsg = rawMsg;
      if (rawMsg.includes('offline') || rawMsg.includes('unavailable') || rawMsg.includes('not-found')) {
        friendlyMsg = `Pangkalan data Cloud Firestore bagi projek '${firebaseConfig.projectId}' belum wujud atau tidak aktif di rantau (default).`;
      }
      currentSyncError = friendlyMsg;
      onStatusChange?.('ERROR', friendlyMsg);
      if (onError) onError(error);
    }
  );

  return unsubscribe;
}

/**
 * Push partial state changes to Cloud Firestore
 */
export async function pushCloudUpdate(partialState: Partial<CloudSystemState>): Promise<boolean> {
  try {
    await ensureAuth();
    const docRef = doc(db, SYNC_COLLECTION, SYNC_DOC_ID);
    const cleanPayload = sanitizeForFirestore({
      ...partialState,
      updatedAt: Date.now(),
    });
    await setDoc(docRef, cleanPayload, { merge: true });
    lastSyncedTimestamp = Date.now();
    return true;
  } catch (err) {
    handleFirestoreError(err, FirestoreOperationType.WRITE, `${SYNC_COLLECTION}/${SYNC_DOC_ID}`);
    console.warn('Error pushing update to Cloud Firestore:', err);
    currentSyncStatus = 'ERROR';
    const rawMsg = err instanceof Error ? err.message : String(err);
    if (rawMsg.includes('offline') || rawMsg.includes('unavailable') || rawMsg.includes('not-found')) {
      currentSyncError = `Pangkalan data Cloud Firestore bagi projek '${firebaseConfig.projectId}' belum wujud atau tidak aktif di rantau (default).`;
    }
    return false;
  }
}

/**
 * Notify Admin that customer stopped the alarm / requested early finish
 */
export async function notifyCustomerAlarmStopped(
  sessionId: string,
  machineId: string,
  machineName: string,
  customerName: string,
  reason: 'TIME_UP_STOPPED' | 'EARLY_STOPPED'
): Promise<void> {
  try {
    await ensureAuth();
    const docRef = doc(db, SYNC_COLLECTION, SYNC_DOC_ID);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return;

    const data = snap.data() as CloudSystemState;
    const currentSessions = data.sessions || [];
    const currentAlerts = data.customerAlerts || [];

    const now = Date.now();

    // 1. Update session status
    const updatedSessions = currentSessions.map((s) => {
      if (s.id === sessionId || s.machineId === machineId) {
        return {
          ...s,
          customerStoppedAlarmAt: now,
          customerStoppedAlarmReason: reason,
        };
      }
      return s;
    });

    // 2. Create customer alert for Admin HUD
    const newAlert: CustomerAlert = {
      id: `alert_${now}_${sessionId}`,
      sessionId,
      machineId,
      machineName,
      customerName,
      type: reason === 'EARLY_STOPPED' ? 'EARLY_STOP' : 'ALARM_STOPPED',
      message:
        reason === 'EARLY_STOPPED'
          ? `Pelanggan ${customerName} (${machineName}) telah menamatkan sesi lebih awal di telefon.`
          : `Pelanggan ${customerName} (${machineName}) telah menghentikan penggera siren masa tamat di telefon.`,
      timestamp: now,
      acknowledged: false,
    };

    // Keep max 20 latest alerts
    const updatedAlerts = [newAlert, ...currentAlerts.filter((a) => now - a.timestamp < 3600000)].slice(0, 20);

    const cleanPayload = sanitizeForFirestore({
      sessions: updatedSessions,
      customerAlerts: updatedAlerts,
      updatedAt: now,
    });

    await setDoc(docRef, cleanPayload, { merge: true });
  } catch (err) {
    console.warn('Error notifying customer alarm stop to admin:', err);
  }
}
