import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  Truck,
  Users,
  ArrowRight,
  TrendingUp,
  Tag,
  Radio,
  SlidersHorizontal,
  Activity,
  Zap,
  Settings,
  Boxes,
} from 'lucide-react';
import { Machine, Session, AppSettings, RidePackage, QueueItem, TransactionRecord, AssetType } from '../types';
import { MachineCard } from './MachineCard';
import { deriveMachineStatus } from '../utils/format';
import { playTapSound } from '../utils/sound';

interface ControlBoardProps {
  machines: Machine[];
  assetTypes?: AssetType[];
  sessions: Session[];
  packages: RidePackage[];
  queue: QueueItem[];
  transactions: TransactionRecord[];
  nowTimestamp: number;
  settings: AppSettings;
  isAdminMode?: boolean;
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
  onOpenQrModal?: (session: Session, machine: Machine) => void;
}

export const ControlBoard: React.FC<ControlBoardProps> = ({
  machines,
  assetTypes,
  sessions,
  packages,
  queue,
  transactions,
  nowTimestamp,
  settings,
  isAdminMode = false,
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
  onOpenQrModal,
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
  const readyCount = machinesWithStatus.filter((item) => item.liveStatus === 'READY').length;
  const runningCount = machinesWithStatus.filter((item) => item.liveStatus === 'RUNNING' || item.liveStatus === 'ENDING_SOON').length;

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
    <main className="max-w-7xl mx-auto px-4 sm:px-6 py-5 sm:py-6 space-y-6">
      {/* TIME UP NOTIFICATION BANNER */}
      {timeUpMachines.length > 0 && (
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-rose-900/90 via-rose-800 to-rose-900 border border-rose-500/80 text-white shadow-2xl shadow-rose-900/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-pulse">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-rose-950/80 border border-rose-400 flex items-center justify-center font-black text-xl shadow-md shrink-0">
              🚨
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-black uppercase px-2 py-0.5 rounded bg-rose-950 text-rose-200 border border-rose-500">
                  CRITICAL ALERT
                </span>
                <h4 className="font-black text-base sm:text-lg tracking-tight">
                  {timeUpMachines.length} Mesin Telah Tamat Masa!
                </h4>
              </div>
              <p className="text-xs text-rose-100/90 font-mono mt-0.5">
                {timeUpMachines.map((t) => t.machine.name).join(', ')} — Sila tamatkan atau sambung sesi operasi.
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
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-rose-900 font-black text-xs uppercase font-mono shadow-md transition-transform active:scale-95 cursor-pointer"
              >
                Tamatkan {timeUpMachines[0].machine.name}
              </button>
            )}
          </div>
        </div>
      )}

      {/* RACE CONTROL FILTER BAR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-[#101723] p-3 sm:p-4 rounded-2xl border border-slate-800 shadow-xl">
        {/* Status Tab Filters */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          <button
            type="button"
            id="filter-all"
            onClick={() => {
              playTapSound(settings.soundEnabled);
              setFilter('ALL');
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-chakra font-black transition-all whitespace-nowrap cursor-pointer uppercase tracking-wider flex items-center gap-1.5 ${
              filter === 'ALL'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'bg-[#151f2e] text-slate-300 hover:text-white hover:bg-[#1a283c] border border-slate-800'
            }`}
          >
            <span>ALL UNITS</span>
            <span className={`px-1.5 py-0.2 rounded text-[10px] font-mono font-bold ${filter === 'ALL' ? 'bg-slate-950 text-amber-400' : 'bg-[#0b0f17] text-slate-400'}`}>
              {machines.length}
            </span>
          </button>

          <button
            type="button"
            id="filter-ready"
            onClick={() => {
              playTapSound(settings.soundEnabled);
              setFilter('READY');
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-chakra font-black flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer uppercase tracking-wider border ${
              filter === 'READY'
                ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md shadow-emerald-500/20'
                : 'bg-[#151f2e] text-emerald-400 border-emerald-500/30 hover:bg-emerald-950/40'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${filter === 'READY' ? 'bg-slate-950' : 'bg-emerald-400'} animate-pulse`}></span>
            <span>READY</span>
            <span className={`px-1.5 py-0.2 rounded text-[10px] font-mono font-bold ${filter === 'READY' ? 'bg-slate-950 text-emerald-400' : 'bg-[#0b0f17] text-emerald-400'}`}>
              {readyCount}
            </span>
          </button>

          <button
            type="button"
            id="filter-running"
            onClick={() => {
              playTapSound(settings.soundEnabled);
              setFilter('RUNNING');
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-chakra font-black flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer uppercase tracking-wider border ${
              filter === 'RUNNING'
                ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-500/20'
                : 'bg-[#151f2e] text-amber-400 border-amber-500/30 hover:bg-amber-950/40'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${filter === 'RUNNING' ? 'bg-slate-950' : 'bg-amber-400'} animate-pulse`}></span>
            <span>RUNNING</span>
            <span className={`px-1.5 py-0.2 rounded text-[10px] font-mono font-bold ${filter === 'RUNNING' ? 'bg-slate-950 text-amber-400' : 'bg-[#0b0f17] text-amber-400'}`}>
              {runningCount}
            </span>
          </button>

          {endingSoonMachines.length > 0 && (
            <button
              type="button"
              id="filter-ending-soon"
              onClick={() => {
                playTapSound(settings.soundEnabled);
                setFilter('ENDING_SOON');
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-chakra font-black flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer uppercase tracking-wider border ${
                filter === 'ENDING_SOON'
                  ? 'bg-amber-400 text-slate-950 border-amber-300'
                  : 'bg-amber-950/40 text-amber-300 border-amber-500/50 animate-pulse'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-amber-400"></span>
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
              className={`px-3.5 py-2 rounded-xl text-xs font-chakra font-black flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer uppercase tracking-wider border ${
                filter === 'TIME_UP'
                  ? 'bg-rose-600 text-white border-rose-500'
                  : 'bg-rose-950/50 text-rose-300 border-rose-600/60 animate-bounce'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-rose-500"></span>
              <span>TIME UP ({timeUpMachines.length})</span>
            </button>
          )}
        </div>

        {/* Right side: Search Input & Quick Asset Settings Button */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-60">
            <Search className="w-4 h-4 text-amber-400/80 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari mesin / ID unit..."
              className="w-full pl-10 pr-3 py-2 rounded-xl border border-slate-700/80 bg-[#0c121c] text-white placeholder-slate-500 text-xs font-mono focus:border-amber-400 focus:ring-1 focus:ring-amber-400/40 focus:outline-none"
            />
          </div>

          <button
            type="button"
            id="btn-controlboard-manage-assets"
            onClick={() => {
              playTapSound(settings.soundEnabled);
              onOpenSettings();
            }}
            className="px-3.5 py-2 rounded-xl bg-[#151f2e] hover:bg-[#1f2e44] border border-amber-500/30 hover:border-amber-400 text-amber-400 text-xs font-chakra font-black uppercase tracking-wider flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer shrink-0 shadow-xs"
            title="Tambah atau Urus Koleksi Aset & Mesin"
          >
            <Boxes className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Urus Koleksi</span>
            <Settings className="w-3.5 h-3.5 text-slate-400" />
          </button>
        </div>
      </div>

      {/* MOTORSPORT MACHINE GRID */}
      {filteredMachines.length === 0 ? (
        <div className="py-16 px-4 text-center rounded-3xl bg-[#101723] border border-dashed border-slate-800 shadow-xl">
          <Truck className="w-12 h-12 text-amber-400/40 mx-auto mb-3" />
          <h3 className="text-base font-black text-white uppercase tracking-wider font-mono">
            {machines.length === 0 ? 'Tiada Mesin Didaftarkan' : 'Tiada Mesin Padan'}
          </h3>
          <p className="text-xs text-slate-400 font-mono mt-1 max-w-sm mx-auto">
            {machines.length === 0
              ? 'Daftar unit mesin pertama anda melalui menu Tetapan untuk memulakan pengurusan armada.'
              : 'Tukar tab filter atau kosongkan kotak carian untuk melihat unit lain.'}
          </p>
          {machines.length === 0 && (
            <button
              type="button"
              onClick={onOpenSettings}
              className="mt-4 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider inline-flex items-center gap-2 shadow-md cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Daftar Mesin Baru</span>
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
              assetTypes={assetTypes}
              onStartSession={() => onOpenNewSession(machine.id)}
              onPauseResumeSession={onPauseResumeSession}
              onCompleteSession={onCompleteSession}
              onExtendSession={onExtendSession}
              onOpenCustomExtend={onOpenCustomExtend}
              onCancelSession={onCancelSession}
              onToggleMaintenance={onToggleMaintenance}
              onOpenQrModal={onOpenQrModal}
            />
          ))}
        </div>
      )}

      {/* LOWER TELEMETRY & COMPANION GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        
        {/* Module 1: Waiting Queue Cockpit (2 Columns wide) */}
        <div className="lg:col-span-2 bg-[#101723] border border-slate-800 rounded-2xl p-5 sm:p-6 flex flex-col justify-between shadow-xl">
          <div>
            <div className="flex justify-between items-center mb-4 border-b border-slate-800/80 pb-3">
              <div className="flex items-center gap-2.5">
                <Users className="w-4 h-4 text-amber-400" />
                <h4 className="text-sm font-chakra font-black uppercase text-white tracking-wider">
                  WAITING QUEUE
                </h4>
              </div>
              <span className="bg-[#151f2e] text-amber-400 border border-amber-500/30 text-[10px] px-2.5 py-1 rounded-full font-mono font-black tracking-wider uppercase">
                {queue.length} PENDING
              </span>
            </div>

            {queue.length === 0 ? (
              <div className="py-6 px-4 text-center rounded-xl bg-[#0c121c] border border-dashed border-slate-800">
                <p className="text-xs font-mono font-bold text-slate-400">
                  Tiada pelanggan dalam senarai menunggu
                </p>
                <button
                  type="button"
                  onClick={onOpenQueue}
                  className="mt-2 text-xs font-chakra font-black text-amber-400 hover:text-amber-300 inline-flex items-center gap-1 cursor-pointer tracking-wider uppercase"
                >
                  + Tambah ke Giliran
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-2.5">
                {queue.slice(0, 3).map((item, idx) => (
                  <div
                    key={item.id}
                    className="flex justify-between items-center p-3 bg-[#0c121c] rounded-xl border border-slate-800 hover:border-slate-700 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center font-mono font-black text-xs">
                        {idx + 1}
                      </div>
                      <div>
                        <p className="font-chakra font-black text-white text-xs sm:text-sm uppercase tracking-wide">
                          {item.customerName}
                        </p>
                        <p className="text-[10px] text-slate-400 font-mono font-bold uppercase tracking-wider">
                          Pakej: {item.packageName || 'Walk-in'}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => onStartFromQueue(item)}
                      className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-chakra font-black text-[11px] uppercase tracking-wider transition-colors cursor-pointer"
                    >
                      ASSIGN
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/80 flex justify-between items-center">
            <span className="text-[11px] font-mono text-slate-400 font-bold">
              {queue.length > 3 ? `+${queue.length - 3} lagi dalam barisan` : 'Sistem giliran pantas'}
            </span>
            <button
              type="button"
              onClick={onOpenQueue}
              className="text-xs font-chakra font-black text-amber-400 hover:text-amber-300 uppercase tracking-wider flex items-center gap-1.5 cursor-pointer"
            >
              <span>MANAGE QUEUE</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Module 2: Today Telemetry KPI / Revenue (1 Column wide) */}
        <div className="lg:col-span-1 bg-[#101723] border border-slate-800 rounded-2xl p-5 sm:p-6 text-white flex flex-col justify-between shadow-xl">
          <div>
            <div className="flex items-center justify-between mb-4 border-b border-slate-800/80 pb-3">
              <h4 className="text-xs font-chakra font-black text-slate-400 uppercase tracking-widest">
                TODAY TELEMETRY
              </h4>
              <TrendingUp className="w-4 h-4 text-emerald-400" />
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-[10px] text-slate-400 font-mono uppercase font-black tracking-wider">
                  Total Revenue
                </p>
                <p className="text-3xl font-black text-emerald-400 font-mono tracking-tight mt-0.5">
                  {settings.currencySymbol} {totalRevenue.toFixed(2)}
                </p>
              </div>

              <div>
                <p className="text-[10px] text-slate-400 font-mono uppercase font-black tracking-wider">
                  Sessions Completed
                </p>
                <p className="text-2xl font-black text-white font-mono mt-0.5">
                  {transactions.length}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-5">
            <button
              type="button"
              onClick={onOpenTransactions}
              className="w-full bg-[#151f2e] hover:bg-[#1a283c] py-2.5 rounded-xl text-xs font-chakra font-black text-slate-200 uppercase tracking-widest border border-slate-700/80 transition-colors cursor-pointer text-center hover:text-amber-300"
            >
              View Analytics
            </button>
          </div>
        </div>

        {/* Module 3: Active Rate Specs / Packages (1 Column wide) */}
        <div className="lg:col-span-1 bg-[#101723] border border-slate-800 rounded-2xl p-5 sm:p-6 flex flex-col justify-between shadow-xl">
          <div>
            <div className="flex items-center justify-between mb-4 border-b border-slate-800/80 pb-3">
              <h4 className="text-xs font-chakra font-black text-slate-400 uppercase tracking-widest">
                RATE SPECIFICATIONS
              </h4>
              <Tag className="w-4 h-4 text-amber-400" />
            </div>

            <div className="space-y-2.5">
              {packages.map((pkg) => (
                <div
                  key={pkg.id}
                  className="flex justify-between items-center text-xs font-mono font-black border-b border-slate-800/60 pb-2"
                >
                  <span className="text-slate-300 uppercase font-chakra font-bold tracking-wide">
                    {pkg.name}
                  </span>
                  <span className="text-amber-400 font-mono font-bold">
                    {settings.currencySymbol} {pkg.price}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 bg-[#0c121c] p-2.5 rounded-xl border border-slate-800">
            <p className="text-[10px] text-amber-400/90 font-mono font-bold text-center uppercase tracking-wider">
              Standard Timing System Active
            </p>
          </div>
        </div>
      </div>

      {/* FOOTER TELEMETRY STATUS */}
      <footer className="mt-8 pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row justify-between items-center text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider gap-2">
        <div className="flex items-center gap-2">
          <span>SYSTEM: <strong className="text-emerald-400">ONLINE</strong></span>
          <span>&bull;</span>
          <span>DATABASE: <strong className="text-amber-400">SYNCED</strong></span>
          <span>&bull;</span>
          <span>SES V4.3 MOTORSPORT</span>
        </div>
        <div>
          Engineered by{' '}
          <a
            href="https://sites.google.com/view/khairi-innovation/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-amber-400 hover:text-amber-300 hover:underline transition-colors font-extrabold"
          >
            Syncrozz
          </a>
        </div>
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
          className="h-14 px-6 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 active:scale-95 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-2xl shadow-amber-500/50 border border-amber-400 transition-transform cursor-pointer"
        >
          <Plus className="w-5 h-5 stroke-[3]" />
          <span>SESI BARU</span>
        </button>
      </div>
    </main>
  );
};
