import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Header } from './components/Header';
import { ControlBoard } from './components/ControlBoard';
import { NewSessionModal } from './components/NewSessionModal';
import { SessionCompletionModal } from './components/SessionCompletionModal';
import { QuickExtendModal } from './components/QuickExtendModal';
import { QueueDrawer } from './components/QueueDrawer';
import { TransactionsDrawer } from './components/TransactionsDrawer';
import { SettingsModal } from './components/SettingsModal';
import { AdminPinModal } from './components/AdminPinModal';
import { OfflineBanner } from './components/OfflineBanner';
import { PwaInstallPrompt } from './components/PwaInstallPrompt';
import { SessionQrModal } from './components/SessionQrModal';
import { CustomerLiveView } from './components/CustomerLiveView';
import { generateUniquePublicToken, parseCustomerLiveRoute, CustomerLiveRouteResult } from './utils/token';
import { Machine, RidePackage, Session, TransactionRecord, QueueItem, AppSettings, AssetType, CustomerAlert } from './types';
import {
  loadInitialData,
  saveMachines,
  saveAssetTypes,
  savePackages,
  saveSessions,
  saveTransactions,
  saveQueue,
  saveSettings,
  resetToFactoryDefaults,
  upgradeAssetTypesWithImages,
  DEFAULT_MACHINES,
  DEFAULT_ASSET_TYPES,
  DEFAULT_PACKAGES,
  DEFAULT_SETTINGS,
} from './utils/storage';
import {
  subscribeToCloudSync,
  pushCloudUpdate,
  CloudSystemState,
} from './services/firebaseSync';
import {
  playTapSound,
  playSessionStartSound,
  playEndingSoonSound,
  playTimeUpAlarm,
  stopAlarm,
  triggerVibration,
} from './utils/sound';
import { requestWakeLock, releaseWakeLock, isWakeLockActive } from './utils/wakelock';
import { deriveMachineStatus, formatClockTime } from './utils/format';
import { VolumeX, Bell, CheckCircle2, AlertTriangle, ShieldAlert } from 'lucide-react';

export default function App() {
  // Load persistent state
  const initialData = useRef(loadInitialData()).current;

  const [machines, setMachines] = useState<Machine[]>(initialData.machines);
  const [assetTypes, setAssetTypes] = useState<AssetType[]>(initialData.assetTypes);
  const [packages, setPackages] = useState<RidePackage[]>(initialData.packages);
  const [sessions, setSessions] = useState<Session[]>(initialData.sessions);
  const [transactions, setTransactions] = useState<TransactionRecord[]>(initialData.transactions);
  const [queue, setQueue] = useState<QueueItem[]>(initialData.queue);
  const [settings, setSettings] = useState<AppSettings>(() => {
    const s = initialData.settings;
    if (s.adminPin === '5313' || !s.adminPin) {
      return { ...s, adminPin: '6381' };
    }
    return s;
  });
  const [customerAlerts, setCustomerAlerts] = useState<CustomerAlert[]>([]);

  // Live timer clock
  const [nowTimestamp, setNowTimestamp] = useState<number>(Date.now());
  const [wakeLockState, setWakeLockState] = useState<boolean>(false);

  // Customer Live View routing state (/live/:token or legacy ?view=customer)
  const [customerRoute, setCustomerRoute] = useState<CustomerLiveRouteResult>(() => {
    return parseCustomerLiveRoute();
  });

  // Track browser back/forward buttons or route changes
  useEffect(() => {
    const handlePopState = () => {
      setCustomerRoute(parseCustomerLiveRoute());
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Modal dialog states
  const [newSessionOpen, setNewSessionOpen] = useState(false);
  const [preselectedMachineId, setPreselectedMachineId] = useState<string | undefined>(undefined);
  const [preselectedQueueItem, setPreselectedQueueItem] = useState<QueueItem | undefined>(undefined);

  // QR Live Tracker Modal
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [activeQrSession, setActiveQrSession] = useState<Session | null>(null);
  const [activeQrMachine, setActiveQrMachine] = useState<Machine | null>(null);

  const [completionModalOpen, setCompletionModalOpen] = useState(false);
  const [activeCompletingSession, setActiveCompletingSession] = useState<Session | null>(null);

  const [extendModalOpen, setExtendModalOpen] = useState(false);
  const [activeExtendingSession, setActiveExtendingSession] = useState<Session | null>(null);

  const [queueDrawerOpen, setQueueDrawerOpen] = useState(false);
  const [transactionsDrawerOpen, setTransactionsDrawerOpen] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);

  // Admin Mode state (Protected by PIN 6381)
  const [isAdminMode, setIsAdminMode] = useState<boolean>(false);
  const [adminPinModalOpen, setAdminPinModalOpen] = useState<boolean>(false);
  const [pendingAdminAction, setPendingAdminAction] = useState<(() => void) | null>(null);
  const [pinModalTitle, setPinModalTitle] = useState<string>('Akses Mod Admin');
  const [pinModalDesc, setPinModalDesc] = useState<string>('Sila masukkan 4-digit PIN keselamatan untuk aktifkan mod suntingan admin.');

  // Reference to track machine statuses to fire alarms only once on transition
  const previousStatusMap = useRef<Map<string, string>>(new Map());

  // 1. Live Countdown Loop (every 500ms for smooth UI)
  useEffect(() => {
    const interval = setInterval(() => {
      setNowTimestamp(Date.now());
    }, 500);
    return () => clearInterval(interval);
  }, []);

  // 2. Alarm & Sound Transition Detection
  useEffect(() => {
    const activeSessions = sessions.filter((s) => s.status === 'ACTIVE');
    const sessionMap = new Map<string, Session>(activeSessions.map((s) => [s.machineId, s]));

    let hasAnyTimeUp = false;

    machines.forEach((machine) => {
      const activeSession = sessionMap.get(machine.id);
      const currentStatus = deriveMachineStatus(
        machine.status,
        activeSession,
        nowTimestamp,
        settings.endingSoonThresholdSeconds
      );

      const prevStatus = previousStatusMap.current.get(machine.id);

      if (currentStatus === 'TIME_UP') {
        hasAnyTimeUp = true;
        // Trigger alarm on first transition into TIME_UP
        if (prevStatus !== 'TIME_UP') {
          playTimeUpAlarm(settings.soundEnabled, settings.alarmRepeat);
          triggerVibration([300, 150, 300, 150, 300], settings.vibrationEnabled);
        }
      } else if (currentStatus === 'ENDING_SOON' && prevStatus !== 'ENDING_SOON' && prevStatus !== 'TIME_UP') {
        // Trigger ending soon warning ping
        playEndingSoonSound(settings.soundEnabled);
        triggerVibration([200, 100, 200], settings.vibrationEnabled);
      }

      previousStatusMap.current.set(machine.id, currentStatus);
    });

    if (!hasAnyTimeUp) {
      stopAlarm();
    }
  }, [nowTimestamp, machines, sessions, settings]);

  // 3. WakeLock initialization
  useEffect(() => {
    if (settings.wakeLockEnabled) {
      requestWakeLock().then((active) => setWakeLockState(active));
    } else {
      releaseWakeLock().then(() => setWakeLockState(false));
    }
  }, [settings.wakeLockEnabled]);

  // 4. Realtime Cross-Device Firebase Cloud Sync
  useEffect(() => {
    const unsubscribe = subscribeToCloudSync((cloudData) => {
      if (cloudData.machines !== undefined) {
        setMachines(cloudData.machines);
        saveMachines(cloudData.machines);
      }
      if (cloudData.assetTypes !== undefined) {
        const upgraded = upgradeAssetTypesWithImages(cloudData.assetTypes);
        setAssetTypes(upgraded);
        saveAssetTypes(upgraded);
      }
      if (cloudData.packages !== undefined) {
        setPackages(cloudData.packages);
        savePackages(cloudData.packages);
      }
      if (cloudData.sessions !== undefined) {
        const withTokens = cloudData.sessions.map((s) => {
          if (!s.publicSessionToken && s.id) {
            const parts = s.id.split('_');
            const token = parts.length >= 3 && parts[parts.length - 1].length >= 4
              ? parts[parts.length - 1].toLowerCase()
              : s.id.replace(/[^a-zA-Z0-9]/g, '').slice(-6).toLowerCase() || '74tw4i';
            return { ...s, publicSessionToken: token };
          }
          return s;
        });
        setSessions(withTokens);
        saveSessions(withTokens);
      }
      if (cloudData.transactions !== undefined) {
        setTransactions(cloudData.transactions);
        saveTransactions(cloudData.transactions);
      }
      if (cloudData.queue !== undefined) {
        setQueue(cloudData.queue);
        saveQueue(cloudData.queue);
      }
      if (cloudData.settings !== undefined) {
        let incomingSettings = cloudData.settings;
        if (incomingSettings.adminPin === '5313' || !incomingSettings.adminPin) {
          incomingSettings = { ...incomingSettings, adminPin: '6381' };
          pushCloudUpdate({ settings: incomingSettings });
        }
        setSettings((prev) => ({ ...prev, ...incomingSettings }));
        saveSettings({ ...settings, ...incomingSettings });
      }
      if (cloudData.customerAlerts !== undefined) {
        setCustomerAlerts((prevAlerts) => {
          // Check if there are newly arrived alerts to play an alert chime
          const prevIds = new Set(prevAlerts.map((a) => a.id));
          const newAlerts = cloudData.customerAlerts!.filter((a) => !prevIds.has(a.id) && !a.acknowledged);
          if (newAlerts.length > 0) {
            playEndingSoonSound(settings.soundEnabled);
            triggerVibration([300, 100, 300], settings.vibrationEnabled);
          }
          return cloudData.customerAlerts!;
        });
      }
    });

    return () => unsubscribe();
  }, [settings.soundEnabled, settings.vibrationEnabled]);

  const handleDismissCustomerAlert = (alertId: string) => {
    setCustomerAlerts((prev) => {
      const next = prev.map((a) => (a.id === alertId ? { ...a, acknowledged: true } : a));
      pushCloudUpdate({ customerAlerts: next });
      return next;
    });
  };

  // 5. PWA Shortcuts & URL Query Actions Handler
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const urlParams = new URLSearchParams(window.location.search);
    const action = urlParams.get('action');

    if (action === 'new-session') {
      setNewSessionOpen(true);
    } else if (action === 'queue') {
      setQueueDrawerOpen(true);
    } else if (action === 'transactions') {
      setTransactionsDrawerOpen(true);
    }

    // Clean up query param from URL without page reload
    if (action) {
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, document.title, cleanUrl);
    }
  }, []);

  const handleToggleWakeLock = async () => {
    if (wakeLockState) {
      await releaseWakeLock();
      setWakeLockState(false);
      setSettings((prev) => {
        const next = { ...prev, wakeLockEnabled: false };
        saveSettings(next);
        pushCloudUpdate({ settings: next });
        return next;
      });
    } else {
      const success = await requestWakeLock();
      setWakeLockState(success);
      setSettings((prev) => {
        const next = { ...prev, wakeLockEnabled: true };
        saveSettings(next);
        pushCloudUpdate({ settings: next });
        return next;
      });
    }
  };

  // State Persistence Helpers (Local + Realtime Cloud Firestore)
  const updateMachinesState = (newMachines: Machine[]) => {
    setMachines(newMachines);
    saveMachines(newMachines);
    pushCloudUpdate({ machines: newMachines });
  };

  const updateAssetTypesState = (newAssetTypes: AssetType[]) => {
    setAssetTypes(newAssetTypes);
    saveAssetTypes(newAssetTypes);
    pushCloudUpdate({ assetTypes: newAssetTypes });
  };

  const updateSessionsState = (newSessions: Session[]) => {
    setSessions(newSessions);
    saveSessions(newSessions);
    pushCloudUpdate({ sessions: newSessions });
  };

  const updateTransactionsState = (newTransactions: TransactionRecord[]) => {
    setTransactions(newTransactions);
    saveTransactions(newTransactions);
    pushCloudUpdate({ transactions: newTransactions });
  };

  const updateQueueState = (newQueue: QueueItem[]) => {
    setQueue(newQueue);
    saveQueue(newQueue);
    pushCloudUpdate({ queue: newQueue });
  };

  const updateSettingsState = (newSettings: AppSettings) => {
    setSettings(newSettings);
    saveSettings(newSettings);
    pushCloudUpdate({ settings: newSettings });
  };

  // 4. Session Operations
  const handleStartSession = (
    machineId: string,
    packageId: string,
    customerName?: string,
    queueItemId?: string
  ) => {
    const targetMachine = machines.find((m) => m.id === machineId);
    const targetPackage = packages.find((p) => p.id === packageId || p.name === packageId) || packages[0];
    if (!targetMachine || !targetPackage) return;

    const extraBuffer = typeof settings.bufferMinutes === 'number' ? settings.bufferMinutes : 3;
    const totalDurationMinutes = targetPackage.durationMinutes + extraBuffer;
    const startTime = Date.now();
    const durationMs = totalDurationMinutes * 60 * 1000;
    const endTime = startTime + durationMs;

    const publicSessionToken = generateUniquePublicToken(sessions);
    const newSessionId = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const newSession: Session = {
      id: newSessionId,
      publicSessionToken,
      machineId,
      machineName: targetMachine.name,
      packageId,
      packageName: extraBuffer > 0 ? `${targetPackage.name} (+${extraBuffer}m bertenang)` : targetPackage.name,
      durationMinutes: totalDurationMinutes,
      price: targetPackage.price,
      customerName: customerName || undefined,
      startTime,
      endTime,
      accumulatedPauseMs: 0,
      isPaused: false,
      status: 'ACTIVE',
    };

    // Update sessions
    const updatedSessions = [...sessions.filter((s) => s.machineId !== machineId), newSession];
    updateSessionsState(updatedSessions);

    // Update machine status
    const updatedMachines = machines.map((m) =>
      m.id === machineId ? { ...m, status: 'RUNNING' as const, activeSessionId: newSessionId } : m
    );
    updateMachinesState(updatedMachines);

    // If from queue, remove from queue
    if (queueItemId) {
      const updatedQueue = queue.filter((q) => q.id !== queueItemId);
      updateQueueState(updatedQueue);
    }

    playSessionStartSound(settings.soundEnabled);

    // Auto open QR Live Tracker Modal for customer WhatsApp share or scan
    setActiveQrSession(newSession);
    setActiveQrMachine(targetMachine);
    setQrModalOpen(true);
  };

  const handleOpenQrModal = (session: Session, machine: Machine) => {
    setActiveQrSession(session);
    setActiveQrMachine(machine);
    setQrModalOpen(true);
  };

  const handlePauseResumeSession = (session: Session) => {
    const updatedSessions = sessions.map((s) => {
      if (s.id !== session.id) return s;

      if (!s.isPaused) {
        // Pausing
        return {
          ...s,
          isPaused: true,
          pausedAt: Date.now(),
        };
      } else {
        // Resuming
        const pausedDuration = s.pausedAt ? Date.now() - s.pausedAt : 0;
        const newAccumulated = s.accumulatedPauseMs + pausedDuration;
        return {
          ...s,
          isPaused: false,
          pausedAt: undefined,
          accumulatedPauseMs: newAccumulated,
          endTime: s.startTime + s.durationMinutes * 60 * 1000 + newAccumulated,
        };
      }
    });

    updateSessionsState(updatedSessions);
  };

  const handleOpenCompleteModal = (session: Session) => {
    setActiveCompletingSession(session);
    setCompletionModalOpen(true);
  };

  const handleConfirmCompleteAndRecord = (session: Session) => {
    stopAlarm();

    // 1. Mark session as completed
    const completedAt = Date.now();
    const updatedSessions = sessions.map((s) =>
      s.id === session.id ? { ...s, status: 'COMPLETED' as const, completedAt } : s
    );
    updateSessionsState(updatedSessions);

    // 2. Free machine to READY
    const updatedMachines = machines.map((m) =>
      m.id === session.machineId ? { ...m, status: 'READY' as const, activeSessionId: undefined } : m
    );
    updateMachinesState(updatedMachines);

    // 3. Create Transaction Record
    const newTx: TransactionRecord = {
      id: `tx_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      sessionId: session.id,
      machineId: session.machineId,
      machineName: session.machineName,
      packageName: session.packageName,
      durationMinutes: session.durationMinutes,
      price: session.price,
      customerName: session.customerName,
      startTime: session.startTime,
      endTime: completedAt,
      status: 'COMPLETED',
      createdAt: completedAt,
    };
    updateTransactionsState([newTx, ...transactions]);
  };

  const handleExtendSession = (session: Session, extensionMinutes: number, extensionPrice = 0) => {
    stopAlarm();
    const now = Date.now();

    const updatedSessions = sessions.map((s) => {
      if (s.id !== session.id) return s;

      const extensionMs = extensionMinutes * 60 * 1000;
      let newEndTime = s.endTime + extensionMs;

      // If already expired (overtime), re-anchor endTime from now
      if (s.endTime < now) {
        newEndTime = now + extensionMs;
      }

      return {
        ...s,
        durationMinutes: s.durationMinutes + extensionMinutes,
        price: s.price + extensionPrice,
        endTime: newEndTime,
        extensionsCount: (s.extensionsCount || 0) + 1,
        isPaused: false,
        pausedAt: undefined,
      };
    });

    updateSessionsState(updatedSessions);

    // Ensure machine is back to RUNNING
    const updatedMachines = machines.map((m) =>
      m.id === session.machineId ? { ...m, status: 'RUNNING' as const } : m
    );
    updateMachinesState(updatedMachines);
  };

  const handleCancelSession = (session: Session) => {
    stopAlarm();
    // Update session to CANCELLED
    const updatedSessions = sessions.map((s) =>
      s.id === session.id ? { ...s, status: 'CANCELLED' as const } : s
    );
    updateSessionsState(updatedSessions);

    // Free machine
    const updatedMachines = machines.map((m) =>
      m.id === session.machineId ? { ...m, status: 'READY' as const, activeSessionId: undefined } : m
    );
    updateMachinesState(updatedMachines);
  };

  const handleToggleMaintenance = (machine: Machine) => {
    const nextStatus = machine.status === 'MAINTENANCE' ? 'READY' : 'MAINTENANCE';
    const updatedMachines = machines.map((m) => (m.id === machine.id ? { ...m, status: nextStatus } : m));
    updateMachinesState(updatedMachines);
  };

  // Queue Operations
  const handleAddToQueue = (item: Omit<QueueItem, 'id' | 'createdAt'>) => {
    const newItem: QueueItem = {
      ...item,
      id: `q_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      createdAt: Date.now(),
    };
    updateQueueState([...queue, newItem]);
  };

  const handleRemoveFromQueue = (id: string) => {
    updateQueueState(queue.filter((q) => q.id !== id));
  };

  const handleStartFromQueue = (queueItem: QueueItem) => {
    setPreselectedQueueItem(queueItem);
    if (queueItem.preferredMachineId) {
      setPreselectedMachineId(queueItem.preferredMachineId);
    } else {
      // Find first READY machine
      const readyMachine = machines.find((m) => m.status === 'READY');
      setPreselectedMachineId(readyMachine?.id);
    }
    setNewSessionOpen(true);
  };

  // Machine Management
  const handleAddMachine = (newM: Omit<Machine, 'id' | 'status'>) => {
    const machine: Machine = {
      ...newM,
      id: `m_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      status: 'READY',
    };
    updateMachinesState([...machines, machine]);
  };

  const handleDeleteMachine = (id: string) => {
    updateMachinesState(machines.filter((m) => m.id !== id));
  };

  // Asset Types Management
  const handleAddAssetType = (newType: Omit<AssetType, 'id'>) => {
    // Generate clean slug ID from name
    const slug = newType.name.toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 20);
    const uniqueId = `type_${slug}_${Date.now().toString(36)}`;
    const assetType: AssetType = {
      ...newType,
      id: uniqueId,
      createdAt: Date.now(),
    };
    updateAssetTypesState([...assetTypes, assetType]);
  };

  const handleUpdateAssetType = (updatedType: AssetType) => {
    updateAssetTypesState(
      assetTypes.map((t) => (t.id === updatedType.id ? updatedType : t))
    );
  };

  const handleToggleAssetTypeActive = (id: string) => {
    updateAssetTypesState(
      assetTypes.map((t) => (t.id === id ? { ...t, active: !t.active, updatedAt: Date.now() } : t))
    );
  };

  const handleDeleteAssetType = (id: string) => {
    updateAssetTypesState(assetTypes.filter((t) => t.id !== id));
  };

  // Package Management
  const handleAddPackage = (newP: Omit<RidePackage, 'id'>) => {
    const pkg: RidePackage = {
      ...newP,
      id: `pkg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    };
    updatePackagesState([...packages, pkg]);
  };

  const updatePackagesState = (newPackages: RidePackage[]) => {
    setPackages(newPackages);
    savePackages(newPackages);
    pushCloudUpdate({ packages: newPackages });
  };

  const handleDeletePackage = (id: string) => {
    updatePackagesState(packages.filter((p) => p.id !== id));
  };

  // Transaction Management Handlers (Admin Edit, Delete, Add Manual for Cash Tally)
  const handleUpdateTransaction = (updatedTx: TransactionRecord) => {
    const nextTransactions = transactions.map((t) => (t.id === updatedTx.id ? updatedTx : t));
    updateTransactionsState(nextTransactions);
  };

  const handleDeleteTransaction = (txId: string) => {
    const nextTransactions = transactions.filter((t) => t.id !== txId);
    updateTransactionsState(nextTransactions);
  };

  const handleAddManualTransaction = (newTx: TransactionRecord) => {
    updateTransactionsState([newTx, ...transactions]);
  };

  // Admin Protected Action Interceptor
  const handleRequireAdmin = useCallback(
    (
      action?: () => void,
      customTitle: string = 'Akses Mod Admin',
      customDesc: string = 'Sila masukkan 4-digit PIN keselamatan untuk aktifkan mod suntingan admin.'
    ) => {
      if (isAdminMode) {
        action?.();
      } else {
        setPendingAdminAction(() => action || null);
        setPinModalTitle(customTitle);
        setPinModalDesc(customDesc);
        setAdminPinModalOpen(true);
      }
    },
    [isAdminMode]
  );

  const handleAdminPinSuccess = useCallback(() => {
    setIsAdminMode(true);
    if (pendingAdminAction) {
      pendingAdminAction();
      setPendingAdminAction(null);
    }
  }, [pendingAdminAction]);

  const handleToggleAdminMode = useCallback(() => {
    if (isAdminMode) {
      playTapSound(settings.soundEnabled);
      setIsAdminMode(false);
    } else {
      handleRequireAdmin(
        undefined,
        'Akses Mod Admin',
        'Sila masukkan 4-digit PIN keselamatan untuk aktifkan mod suntingan admin.'
      );
    }
  }, [isAdminMode, settings.soundEnabled, handleRequireAdmin]);

  const handleOpenSettingsWithAdmin = () => {
    handleRequireAdmin(
      () => setSettingsModalOpen(true),
      'Akses Tetapan Admin',
      'Sila masukkan Kod PIN Admin untuk membuka tetapan sistem dan mesin.'
    );
  };

  const handleCancelSessionProtected = (session: Session) => {
    handleRequireAdmin(
      () => handleCancelSession(session),
      'Batalkan Sesi',
      'Pengesahan PIN Admin diperlukan untuk membatalkan sesi pelanggan ini.'
    );
  };

  const handleToggleMaintenanceProtected = (machine: Machine) => {
    handleRequireAdmin(
      () => handleToggleMaintenance(machine),
      'Mod Penyelenggaraan',
      'Pengesahan PIN Admin diperlukan untuk menukar status mesin.'
    );
  };

  // Factory Reset
  const handleResetFactory = () => {
    resetToFactoryDefaults();
    setMachines(DEFAULT_MACHINES);
    setAssetTypes(DEFAULT_ASSET_TYPES);
    setPackages(DEFAULT_PACKAGES);
    setSessions([]);
    setTransactions([]);
    setQueue([]);
    setSettings(DEFAULT_SETTINGS);
    pushCloudUpdate({
      machines: DEFAULT_MACHINES,
      assetTypes: DEFAULT_ASSET_TYPES,
      packages: DEFAULT_PACKAGES,
      sessions: [],
      transactions: [],
      queue: [],
      settings: DEFAULT_SETTINGS,
    });
  };

  const availableMachines = useMemo(
    () => machines.filter((m) => m.status === 'READY'),
    [machines]
  );

  // If page was loaded via Short Live URL (/live/:token), QR Code, or WhatsApp Live link by the customer:
  if (customerRoute.isCustomerView) {
    return (
      <CustomerLiveView
        token={customerRoute.token}
        sessions={sessions}
        machines={machines}
        settings={settings}
        legacyParams={customerRoute.legacyParams}
        onBackToDashboard={() => {
          setCustomerRoute({ isCustomerView: false, isLegacy: false });
          window.history.replaceState({}, document.title, '/');
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#0b0f17] text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950 bg-carbon">
      {/* Top Application Header */}
      <Header
        settings={settings}
        onUpdateSettings={updateSettingsState}
        machines={machines}
        sessions={sessions}
        queue={queue}
        nowTimestamp={nowTimestamp}
        onOpenNewSession={() => {
          setPreselectedMachineId(undefined);
          setPreselectedQueueItem(undefined);
          setNewSessionOpen(true);
        }}
        onOpenQueue={() => setQueueDrawerOpen(true)}
        onOpenTransactions={() => setTransactionsDrawerOpen(true)}
        onOpenSettings={handleOpenSettingsWithAdmin}
        wakeLockActive={wakeLockState}
        onToggleWakeLock={handleToggleWakeLock}
        isAdminMode={isAdminMode}
        onToggleAdminMode={handleToggleAdminMode}
      />

      {/* Real-time Customer Alarm Stopped / Early Finish Notification Banner */}
      {customerAlerts.filter((a) => !a.acknowledged && (nowTimestamp - a.timestamp < 300000)).length > 0 && (
        <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 pt-3 space-y-2">
          {customerAlerts
            .filter((a) => !a.acknowledged && (nowTimestamp - a.timestamp < 300000))
            .map((alert) => (
              <div
                key={alert.id}
                className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-rose-900/90 via-rose-800/90 to-rose-900/90 border-2 border-rose-500 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xl shadow-rose-950/80 animate-pulse"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white text-rose-950 flex items-center justify-center font-black shrink-0 shadow-lg">
                    <VolumeX className="w-5 h-5 text-rose-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-chakra font-black tracking-wider uppercase bg-rose-950 px-2 py-0.5 rounded text-rose-200 border border-rose-500/50">
                        {alert.type === 'EARLY_STOP' ? '🚨 SESI TAMAT AWAL' : '🚨 PENGGERA DIHENTIKAN'}
                      </span>
                      <span className="text-[10px] font-mono text-rose-300">
                        {formatClockTime(alert.timestamp)}
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm font-bold text-white mt-1">
                      {alert.message}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleDismissCustomerAlert(alert.id)}
                  className="px-4 py-2 rounded-xl bg-white hover:bg-slate-100 text-rose-950 font-chakra font-black text-xs uppercase tracking-wider shadow-md active:scale-95 transition-all cursor-pointer shrink-0 text-center"
                >
                  SAHKAN / TUTUP
                </button>
              </div>
            ))}
        </div>
      )}

      {/* Main Control Board View */}
      <ControlBoard
        machines={machines}
        assetTypes={assetTypes}
        sessions={sessions}
        packages={packages}
        queue={queue}
        transactions={transactions}
        nowTimestamp={nowTimestamp}
        settings={settings}
        isAdminMode={isAdminMode}
        onOpenNewSession={(machineId) => {
          setPreselectedMachineId(machineId);
          setPreselectedQueueItem(undefined);
          setNewSessionOpen(true);
        }}
        onPauseResumeSession={handlePauseResumeSession}
        onCompleteSession={handleOpenCompleteModal}
        onExtendSession={handleExtendSession}
        onOpenCustomExtend={(session) => {
          setActiveExtendingSession(session);
          setExtendModalOpen(true);
        }}
        onCancelSession={handleCancelSessionProtected}
        onToggleMaintenance={handleToggleMaintenanceProtected}
        onOpenSettings={handleOpenSettingsWithAdmin}
        onOpenQueue={() => setQueueDrawerOpen(true)}
        onOpenTransactions={() => setTransactionsDrawerOpen(true)}
        onStartFromQueue={handleStartFromQueue}
        onOpenQrModal={handleOpenQrModal}
      />

      {/* 1. Modal Sesi Baru */}
      <NewSessionModal
        isOpen={newSessionOpen}
        onClose={() => {
          setNewSessionOpen(false);
          setPreselectedMachineId(undefined);
          setPreselectedQueueItem(undefined);
        }}
        availableMachines={availableMachines}
        assetTypes={assetTypes}
        packages={packages}
        queue={queue}
        preselectedMachineId={preselectedMachineId}
        preselectedQueueItem={preselectedQueueItem}
        settings={settings}
        onStart={handleStartSession}
      />

      {/* 2. Modal Sesi Selesai (Time Up / Manual Complete) */}
      <SessionCompletionModal
        isOpen={completionModalOpen}
        session={activeCompletingSession}
        onClose={() => {
          setCompletionModalOpen(false);
          setActiveCompletingSession(null);
        }}
        settings={settings}
        onCompleteAndRecord={handleConfirmCompleteAndRecord}
        onExtend={handleExtendSession}
      />

      {/* 3. Modal Tambah Masa (Quick Extend) */}
      <QuickExtendModal
        isOpen={extendModalOpen}
        session={activeExtendingSession}
        packages={packages}
        settings={settings}
        onClose={() => {
          setExtendModalOpen(false);
          setActiveExtendingSession(null);
        }}
        onExtend={handleExtendSession}
      />

      {/* 4. Drawer Senarai Menunggu (Queue) */}
      <QueueDrawer
        isOpen={queueDrawerOpen}
        onClose={() => setQueueDrawerOpen(false)}
        queue={queue}
        machines={machines}
        packages={packages}
        settings={settings}
        onAddToQueue={handleAddToQueue}
        onRemoveFromQueue={handleRemoveFromQueue}
        onStartFromQueue={handleStartFromQueue}
        onRequireAdmin={handleRequireAdmin}
      />

      {/* 5. Drawer Rekod Transaksi */}
      <TransactionsDrawer
        isOpen={transactionsDrawerOpen}
        onClose={() => setTransactionsDrawerOpen(false)}
        transactions={transactions}
        machines={machines}
        settings={settings}
        onClearTransactions={() => updateTransactionsState([])}
        onUpdateTransaction={handleUpdateTransaction}
        onDeleteTransaction={handleDeleteTransaction}
        onAddTransaction={handleAddManualTransaction}
        onRequireAdmin={handleRequireAdmin}
      />

      {/* 6. Modal Tetapan & Mesin */}
      <SettingsModal
        isOpen={settingsModalOpen}
        onClose={() => setSettingsModalOpen(false)}
        machines={machines}
        assetTypes={assetTypes}
        packages={packages}
        settings={settings}
        onUpdateSettings={updateSettingsState}
        onAddMachine={handleAddMachine}
        onDeleteMachine={handleDeleteMachine}
        onToggleMachineMaintenance={handleToggleMaintenance}
        onAddAssetType={handleAddAssetType}
        onUpdateAssetType={handleUpdateAssetType}
        onToggleAssetTypeActive={handleToggleAssetTypeActive}
        onDeleteAssetType={handleDeleteAssetType}
        onAddPackage={handleAddPackage}
        onDeletePackage={handleDeletePackage}
        onResetFactory={handleResetFactory}
        isAdminMode={isAdminMode}
        onLockAdmin={() => setIsAdminMode(false)}
      />

      {/* 7. Modal Pengesahan PIN Admin (6381) */}
      <AdminPinModal
        isOpen={adminPinModalOpen}
        onClose={() => {
          setAdminPinModalOpen(false);
          setPendingAdminAction(null);
        }}
        onSuccess={handleAdminPinSuccess}
        correctPin={settings.adminPin === '5313' ? '6381' : (settings.adminPin || '6381')}
        soundEnabled={settings.soundEnabled}
        title={pinModalTitle}
        description={pinModalDesc}
      />

      {/* 8. Modal QR Live Tracker & WhatsApp Sesi */}
      <SessionQrModal
        isOpen={qrModalOpen}
        onClose={() => {
          setQrModalOpen(false);
          setActiveQrSession(null);
          setActiveQrMachine(null);
        }}
        session={activeQrSession}
        machine={activeQrMachine}
        settings={settings}
      />

      {/* 9. PWA Offline Status Toast Indicator & PWA Install Banner */}
      <OfflineBanner />
      <PwaInstallPrompt />
    </div>
  );
}
