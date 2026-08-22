import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  Truck,
  Users,
  ArrowRight,
  TrendingUp,
  Tag
} from 'lucide-react';
import { Machine, Session, AppSettings, RidePackage, QueueItem, TransactionRecord } from '../types';
import { MachineCard } from './MachineCard';
import { deriveMachineStatus } from '../utils/format';
import { playTapSound } from '../utils/sound';

interface ControlBoardProps {
  machines: Machine[];
  sessions: Session[];
  packages: RidePackage[];
  queue: QueueItem[];
  transactions: TransactionRecord[];
  nowTimestamp: number;
  settings: AppSettings;
  onOpenNewSession: (preselectedMachineId?: string) => void;
  onPauseResumeSession: (session: Session) => void;
  onCompleteSession: (session: Session) => void;
  onExtendSession: (session: Session, minutes: number, price?: number) => void;
  onOpenCustomExtend: (session: Session) => void;
  onCancelSession: (session: Session) => void;
  onToggleMaintenance: (machine: Machine) => void;
  onOpenSettings: () => void;
  onOpenQueue: () => void;
  onOpenTransactions: () => void;
  onStartFromQueue: (queueItem: QueueItem) => void;
}

export const ControlBoard: React.FC<ControlBoardProps> = ({
  machines,
  sessions,
  packages,
  queue,
  transactions,
  nowTimestamp,
  settings,
  onOpenNewSession,
  onPauseResumeSession,
  onCompleteSession,
  onExtendSession,
  onOpenCustomExtend,
  onCancelSession,
  onToggleMaintenance,
  onOpenSettings,
  onOpenQueue,
  onOpenTransactions,
  onStartFromQueue,
}) => {
  const [filter, setFilter] = useState<'ALL' | 'READY' | 'RUNNING' | 'ENDING_SOON' | 'TIME_UP' | 'MAINTENANCE'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const sessionMap = new Map<string, Session>(
    sessions.filter((s) => s.status === 'ACTIVE').map((s) => [s.machineId, s])
  );

  // Group machines with their derived live status
  const machinesWithStatus = machines.map((machine) => {
    const activeSession = sessionMap.get(machine.id);
    const liveStatus = deriveMachineStatus(
      machine.status,
      activeSession,
      nowTimestamp,
      settings.endingSoonThresholdSeconds
    );
    return { machine, activeSession, liveStatus };
  });

  // Calculate today summary metrics
  const totalRevenue = transactions.reduce((acc, tx) => acc + tx.price, 0);

  // Check if any machine has TIME_UP or ENDING_SOON
  const timeUpMachines = machinesWithStatus.filter((item) => item.liveStatus === 'TIME_UP');
  const endingSoonMachines = machinesWithStatus.filter((item) => item.liveStatus === 'ENDING_SOON');

  // Filter machines based on selected status tab and search
  const filteredMachines = machinesWithStatus.filter(({ machine, liveStatus }) => {
    const matchesSearch =
      machine.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      machine.type.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (filter === 'ALL') return true;
    if (filter === 'RUNNING') return liveStatus === 'RUNNING' || liveStatus === 'ENDING_SOON';
    return liveStatus === filter;
  });

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6 space-y-6">
      {/* TIME UP NOTIFICATION BANNER */}
      {timeUpMachines.length > 0 && (
        <div className="p-4 sm:p-5 rounded-2xl bg-rose-600 text-white shadow-xl shadow-rose-600/25 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-pulse">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center font-black text-xl">
              🔴
            </div>
            <div>
              <h4 className="font-black text-base sm:text-lg tracking-tight">
                {timeUpMachines.length} Mesin Telah Tamat Masa!
              </h4>
              <p className="text-xs text-rose-100 font-medium">
                {timeUpMachines.map((t) => t.machine.name).join(', ')} — Sila tamatkan atau sambung sesi.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {timeUpMachines[0].activeSession && (
              <button
                type="button"
                id="btn-banner-complete-first"
                onClick={() => {
                  playTapSound(settings.soundEnabled);
                  onCompleteSession(timeUpMachines[0].activeSession!);
                }}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-rose-700 font-black text-xs uppercase shadow-md transition-transform active:scale-95 cursor-pointer"
              >
                Tamatkan {timeUpMachines[0].machine.name}
              </button>
            )}
          </div>
        </div>
      )}

      {/* CONTROL BOARD FILTER BAR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 sm:p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        {/* Status Tab Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          <button
            type="button"
            id="filter-all"
            onClick={() => {
              playTapSound(settings.soundEnabled);
              setFilter('ALL');
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all whitespace-nowrap cursor-pointer uppercase tracking-wider ${
              filter === 'ALL'
                ? 'bg-slate-900 text-white dark:bg-blue-600 dark:text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            Semua ({machines.length})
          </button>

          <button
            type="button"
            id="filter-ready"
            onClick={() => {
              playTapSound(settings.soundEnabled);
              setFilter('READY');
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all whitespace-nowrap cursor-pointer uppercase tracking-wider ${
              filter === 'READY'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/50'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>READY</span>
          </button>

          <button
            type="button"
            id="filter-running"
            onClick={() => {
              playTapSound(settings.soundEnabled);
              setFilter('RUNNING');
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all whitespace-nowrap cursor-pointer uppercase tracking-wider ${
              filter === 'RUNNING'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/50'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
            <span>RUNNING</span>
          </button>

          {endingSoonMachines.length > 0 && (
            <button
              type="button"
              id="filter-ending-soon"
              onClick={() => {
                playTapSound(settings.soundEnabled);
                setFilter('ENDING_SOON');
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all whitespace-nowrap cursor-pointer uppercase tracking-wider ${
                filter === 'ENDING_SOON'
                  ? 'bg-amber-400 text-slate-950 shadow-xs'
                  : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 animate-pulse'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              <span>ENDING SOON ({endingSoonMachines.length})</span>
            </button>
          )}

          {timeUpMachines.length > 0 && (
            <button
              type="button"
              id="filter-time-up"
              onClick={() => {
                playTapSound(settings.soundEnabled);
                setFilter('TIME_UP');
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all whitespace-nowrap cursor-pointer uppercase tracking-wider ${
                filter === 'TIME_UP'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 animate-bounce'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-rose-600"></span>
              <span>TIME UP ({timeUpMachines.length})</span>
            </button>
          )}
        </div>

        {/* Quick Search */}
        <div className="relative min-w-[220px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama mesin..."
            className="w-full pl-10 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>
      </div>

      {/* BENTO MACHINE GRID (TOP ROW) */}
      {filteredMachines.length === 0 ? (
        <div className="py-16 px-4 text-center rounded-3xl bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-800 shadow-xs">
          <Truck className="w-12 h-12 text-slate-400 mx-auto mb-3 opacity-40" />
          <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-200">
            {machines.length === 0 ? 'Tiada Mesin Didaftarkan' : 'Tiada Mesin Padan'}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            {machines.length === 0
              ? 'Daftar mesin pertama anda melalui menu Tetapan untuk mula mengurus sesi RC.'
              : 'Cuba tukar tab status atau kosongkan kotak carian.'}
          </p>
          {machines.length === 0 && (
            <button
              type="button"
              onClick={onOpenSettings}
              className="mt-4 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs inline-flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Daftar Mesin</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {filteredMachines.map(({ machine, activeSession }) => (
            <MachineCard
              key={machine.id}
              machine={machine}
              session={activeSession}
              nowTimestamp={nowTimestamp}
              settings={settings}
              onStartSession={() => onOpenNewSession(machine.id)}
              onPauseResumeSession={onPauseResumeSession}
              onCompleteSession={onCompleteSession}
              onExtendSession={onExtendSession}
              onOpenCustomExtend={onOpenCustomExtend}
              onCancelSession={onCancelSession}
              onToggleMaintenance={onToggleMaintenance}
            />
          ))}
        </div>
      )}

      {/* BENTO COMPANION GRID (LOWER ROW) */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        
        {/* Bento Tile 1: Waiting Queue (2 Columns wide) */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 flex flex-col justify-between shadow-xs">
          <div>
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <h4 className="text-sm font-black uppercase text-slate-800 dark:text-white tracking-wider">
                  Waiting Queue
                </h4>
              </div>
              <span className="bg-slate-900 dark:bg-blue-600 text-white text-[10px] px-2.5 py-1 rounded-full font-black tracking-wider uppercase">
                {queue.length} PENDING
              </span>
            </div>

            {queue.length === 0 ? (
              <div className="py-6 px-4 text-center rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-800">
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
                  Tiada pelanggan dalam senarai menunggu
                </p>
                <button
                  type="button"
                  onClick={onOpenQueue}
                  className="mt-2 text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
                >
                  + Tambah ke Giliran
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-2.5">
                {queue.slice(0, 3).map((item, idx) => (
                  <div
                    key={item.id}
                    className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-black text-slate-700 dark:text-slate-200 text-xs">
                        {idx + 1}
                      </div>
                      <div>
                        <p className="font-black text-slate-800 dark:text-slate-100 text-xs sm:text-sm">
                          {item.customerName}
                        </p>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">
                          Package: {item.packageName}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => onStartFromQueue(item)}
                      className="text-blue-600 dark:text-blue-400 font-black text-xs hover:underline uppercase tracking-wider cursor-pointer"
                    >
                      ASSIGN MACHINE
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
            <span className="text-[11px] text-slate-400 font-bold">
              {queue.length > 3 ? `+${queue.length - 3} lagi dalam barisan` : 'Sistem giliran pantas'}
            </span>
            <button
              type="button"
              onClick={onOpenQueue}
              className="text-xs font-black text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white uppercase tracking-wider flex items-center gap-1 cursor-pointer"
            >
              <span>MANAGE QUEUE</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Bento Tile 2: Today Summary / Revenue (1 Column wide) */}
        <div className="lg:col-span-1 bg-slate-900 rounded-2xl p-5 sm:p-6 text-white flex flex-col justify-between shadow-lg">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                Today Summary
              </h4>
              <TrendingUp className="w-4 h-4 text-emerald-400" />
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-[10px] text-slate-400 uppercase font-black tracking-wider">
                  Total Revenue
                </p>
                <p className="text-3xl font-black text-emerald-400 font-mono tracking-tight">
                  {settings.currencySymbol} {totalRevenue.toFixed(2)}
                </p>
              </div>

              <div>
                <p className="text-[10px] text-slate-400 uppercase font-black tracking-wider">
                  Sessions Completed
                </p>
                <p className="text-2xl font-black text-white font-mono">
                  {transactions.length}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-5">
            <button
              type="button"
              onClick={onOpenTransactions}
              className="w-full bg-slate-800 hover:bg-slate-700 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest border border-slate-700 transition-colors cursor-pointer text-center"
            >
              View Analytics
            </button>
          </div>
        </div>

        {/* Bento Tile 3: Active Packages (1 Column wide) */}
        <div className="lg:col-span-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 flex flex-col justify-between shadow-xs">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                Active Packages
              </h4>
              <Tag className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>

            <div className="space-y-2.5">
              {packages.map((pkg) => (
                <div
                  key={pkg.id}
                  className="flex justify-between items-center text-xs font-black border-b border-slate-100 dark:border-slate-800 pb-2"
                >
                  <span className="text-slate-600 dark:text-slate-300 uppercase">
                    {pkg.name}
                  </span>
                  <span className="text-slate-900 dark:text-white font-mono">
                    {settings.currencySymbol} {pkg.price}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 bg-blue-50 dark:bg-blue-950/40 p-2.5 rounded-xl border border-blue-100 dark:border-blue-800/60">
            <p className="text-[10px] text-blue-800 dark:text-blue-300 font-bold text-center italic">
              Most Popular: 30 MIN (RM15)
            </p>
          </div>
        </div>
      </div>

      {/* BENTO FOOTER TELEMETRY STATUS */}
      <footer className="mt-8 pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-tight gap-2">
        <div className="flex items-center gap-2">
          <span>SYSTEM STATUS: <strong className="text-emerald-600 dark:text-emerald-400">ONLINE</strong></span>
          <span>&bull;</span>
          <span>DATABASE: <strong className="text-blue-600 dark:text-blue-400">CONNECTED</strong></span>
          <span>&bull;</span>
          <span>SES V4.3</span>
        </div>
        <div>&copy; {new Date().getFullYear()} SYNCROZZ ENGINEERING STANDARD</div>
      </footer>

      {/* FLOATING ACTION BAR FOR MOBILE */}
      <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-30 md:hidden">
        <button
          type="button"
          id="btn-floating-new-session"
          onClick={() => {
            playTapSound(settings.soundEnabled);
            onOpenNewSession();
          }}
          className="h-14 px-6 rounded-full bg-blue-600 active:scale-95 text-white font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-2xl shadow-blue-500/50 border border-blue-400 transition-transform cursor-pointer"
        >
          <Plus className="w-5 h-5 stroke-[3]" />
          <span>SESI BARU</span>
        </button>
      </div>
    </main>
  );
};
