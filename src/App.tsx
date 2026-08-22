import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Header } from './components/Header';
import { ControlBoard } from './components/ControlBoard';
import { NewSessionModal } from './components/NewSessionModal';
import { SessionCompletionModal } from './components/SessionCompletionModal';
import { QuickExtendModal } from './components/QuickExtendModal';
import { QueueDrawer } from './components/QueueDrawer';
import { TransactionsDrawer } from './components/TransactionsDrawer';
import { SettingsModal } from './components/SettingsModal';
import { AdminPinModal } from './components/AdminPinModal';
import { Machine, RidePackage, Session, TransactionRecord, QueueItem, AppSettings } from './types';
import {
  loadInitialData,
  saveMachines,
  savePackages,
  saveSessions,
  saveTransactions,
  saveQueue,
  saveSettings,
  resetToFactoryDefaults,
  DEFAULT_MACHINES,
  DEFAULT_PACKAGES,
  DEFAULT_SETTINGS,
} from './utils/storage';
import {
  playSessionStartSound,
  playEndingSoonSound,
  playTimeUpAlarm,
  stopAlarm,
  triggerVibration,
} from './utils/sound';
import { requestWakeLock, releaseWakeLock, isWakeLockActive } from './utils/wakelock';
import { deriveMachineStatus } from './utils/format';

export default function App() {
  // Load persistent state
  const initialData = useRef(loadInitialData()).current;

  const [machines, setMachines] = useState<Machine[]>(initialData.machines);
  const [packages, setPackages] = useState<RidePackage[]>(initialData.packages);
  const [sessions, setSessions] = useState<Session[]>(initialData.sessions);
  const [transactions, setTransactions] = useState<TransactionRecord[]>(initialData.transactions);
  const [queue, setQueue] = useState<QueueItem[]>(initialData.queue);
  const [settings, setSettings] = useState<AppSettings>(initialData.settings);

  // Live timer clock
  const [nowTimestamp, setNowTimestamp] = useState<number>(Date.now());
  const [wakeLockState, setWakeLockState] = useState<boolean>(false);

  // Modal dialog states
  const [newSessionOpen, setNewSessionOpen] = useState(false);
  const [preselectedMachineId, setPreselectedMachineId] = useState<string | undefined>(undefined);
  const [preselectedQueueItem, setPreselectedQueueItem] = useState<QueueItem | undefined>(undefined);

  const [completionModalOpen, setCompletionModalOpen] = useState(false);
  const [activeCompletingSession, setActiveCompletingSession] = useState<Session | null>(null);

  const [extendModalOpen, setExtendModalOpen] = useState(false);
  const [activeExtendingSession, setActiveExtendingSession] = useState<Session | null>(null);

  const [queueDrawerOpen, setQueueDrawerOpen] = useState(false);
  const [transactionsDrawerOpen, setTransactionsDrawerOpen] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);

  // Admin Mode state (Protected by PIN 5313)
  const [isAdminMode, setIsAdminMode] = useState<boolean>(false);
  const [adminPinModalOpen, setAdminPinModalOpen] = useState<boolean>(false);
  const [pendingAdminAction, setPendingAdminAction] = useState<(() => void) | null>(null);
  const [pinModalTitle, setPinModalTitle] = useState<string>('Pengesahan Mod Admin');
  const [pinModalDesc, setPinModalDesc] = useState<string>('Sila masukkan Kod PIN Admin (5313) untuk meneruskan tindakan ini.');

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

  const handleToggleWakeLock = async () => {
    if (wakeLockState) {
      await releaseWakeLock();
      setWakeLockState(false);
      setSettings((prev) => {
        const next = { ...prev, wakeLockEnabled: false };
        saveSettings(next);
        return next;
      });
    } else {
      const success = await requestWakeLock();
      setWakeLockState(success);
      setSettings((prev) => {
        const next = { ...prev, wakeLockEnabled: true };
        saveSettings(next);
        return next;
      });
    }
  };

  // State Persistence Helpers
  const updateMachinesState = (newMachines: Machine[]) => {
    setMachines(newMachines);
    saveMachines(newMachines);
  };

  const updateSessionsState = (newSessions: Session[]) => {
    setSessions(newSessions);
    saveSessions(newSessions);
  };

  const updateTransactionsState = (newTransactions: TransactionRecord[]) => {
    setTransactions(newTransactions);
    saveTransactions(newTransactions);
  };

  const updateQueueState = (newQueue: QueueItem[]) => {
    setQueue(newQueue);
    saveQueue(newQueue);
  };

  const updateSettingsState = (newSettings: AppSettings) => {
    setSettings(newSettings);
    saveSettings(newSettings);
  };

  // 4. Session Operations
  const handleStartSession = (
    machineId: string,
    packageId: string,
    customerName?: string,
    queueItemId?: string
  ) => {
    const targetMachine = machines.find((m) => m.id === machineId);
    const targetPackage = packages.find((p) => p.id === packageId);
    if (!targetMachine || !targetPackage) return;

    const startTime = Date.now();
    const durationMs = targetPackage.durationMinutes * 60 * 1000;
    const endTime = startTime + durationMs;

    const newSessionId = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const newSession: Session = {
      id: newSessionId,
      machineId,
      machineName: targetMachine.name,
      packageId,
      packageName: targetPackage.name,
      durationMinutes: targetPackage.durationMinutes,
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
  };

  const handleDeletePackage = (id: string) => {
    updatePackagesState(packages.filter((p) => p.id !== id));
  };

  // Admin Protected Action Interceptor
  const handleRequireAdmin = useCallback(
    (
      action?: () => void,
      customTitle: string = 'Pengesahan Mod Admin',
      customDesc: string = 'Sila masukkan Kod PIN Admin (5313) untuk kebenaran mengubah, menambah atau memadam data.'
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
        'Buka Mod Admin',
        'Sila masukkan Kod PIN Admin (5313) untuk mengaktifkan kebenaran pentadbir.'
      );
    }
  }, [isAdminMode, settings.soundEnabled, handleRequireAdmin]);

  const handleOpenSettingsWithAdmin = () => {
    handleRequireAdmin(
      () => setSettingsModalOpen(true),
      'Akses Tetapan Admin',
      'Sila masukkan Kod PIN Admin (5313) untuk membuka tetapan sistem dan mesin.'
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
    setPackages(DEFAULT_PACKAGES);
    setSessions([]);
    setTransactions([]);
    setQueue([]);
    setSettings(DEFAULT_SETTINGS);
  };

  const availableMachines = machines.filter((m) => m.status === 'READY');

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950">
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

      {/* Main Control Board View */}
      <ControlBoard
        machines={machines}
        sessions={sessions}
        packages={packages}
        queue={queue}
        transactions={transactions}
        nowTimestamp={nowTimestamp}
        settings={settings}
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
        settings={settings}
        onClearTransactions={() => updateTransactionsState([])}
        onRequireAdmin={handleRequireAdmin}
      />

      {/* 6. Modal Tetapan & Mesin */}
      <SettingsModal
        isOpen={settingsModalOpen}
        onClose={() => setSettingsModalOpen(false)}
        machines={machines}
        packages={packages}
        settings={settings}
        onUpdateSettings={updateSettingsState}
        onAddMachine={handleAddMachine}
        onDeleteMachine={handleDeleteMachine}
        onToggleMachineMaintenance={handleToggleMaintenance}
        onAddPackage={handleAddPackage}
        onDeletePackage={handleDeletePackage}
        onResetFactory={handleResetFactory}
        isAdminMode={isAdminMode}
        onLockAdmin={() => setIsAdminMode(false)}
      />

      {/* 7. Modal Pengesahan PIN Admin (5313) */}
      <AdminPinModal
        isOpen={adminPinModalOpen}
        onClose={() => {
          setAdminPinModalOpen(false);
          setPendingAdminAction(null);
        }}
        onSuccess={handleAdminPinSuccess}
        correctPin={settings.adminPin || '5313'}
        soundEnabled={settings.soundEnabled}
        title={pinModalTitle}
        description={pinModalDesc}
      />
    </div>
  );
}
