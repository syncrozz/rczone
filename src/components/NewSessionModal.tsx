import React, { useState, useEffect } from 'react';
import { 
  X, 
  Play, 
  User, 
  Clock,
  CheckCircle2,
  SlidersHorizontal,
} from 'lucide-react';
import { Machine, RidePackage, QueueItem, AppSettings, AssetType } from '../types';
import { resolveAssetType, getAssetCategoryTextColor } from '../utils/storage';
import { AssetIcon } from './AssetIcon';
import { playTapSound } from '../utils/sound';

interface NewSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableMachines: Machine[];
  packages: RidePackage[];
  queue: QueueItem[];
  assetTypes?: AssetType[];
  preselectedMachineId?: string;
  preselectedQueueItem?: QueueItem;
  initialSetRemaining?: boolean;
  settings: AppSettings;
  onStart: (
    machineId: string,
    packageId: string,
    customerName?: string,
    queueItemId?: string,
    customRemainingSeconds?: number
  ) => void;
}

export const NewSessionModal: React.FC<NewSessionModalProps> = ({
  isOpen,
  onClose,
  availableMachines,
  packages,
  queue,
  assetTypes,
  preselectedMachineId,
  preselectedQueueItem,
  initialSetRemaining = false,
  settings,
  onStart,
}) => {
  const [selectedMachineId, setSelectedMachineId] = useState<string>('');
  const [selectedPackageId, setSelectedPackageId] = useState<string>('');
  const [customerName, setCustomerName] = useState<string>('');
  const [selectedQueueId, setSelectedQueueId] = useState<string>('');

  // Custom Remaining Time state for Admin
  const [isCustomRemaining, setIsCustomRemaining] = useState<boolean>(false);
  const [customMinutes, setCustomMinutes] = useState<number>(19);
  const [customSeconds, setCustomSeconds] = useState<number>(0);

  // Auto-fill states on open or changes
  useEffect(() => {
    if (isOpen) {
      if (preselectedMachineId) {
        setSelectedMachineId(preselectedMachineId);
      } else if (availableMachines.length > 0) {
        setSelectedMachineId(availableMachines[0].id);
      } else {
        setSelectedMachineId('');
      }

      let activePkg = packages[0];
      if (packages.length > 0) {
        const popular = packages.find((p) => p.isPopular);
        activePkg = popular ? popular : packages[0];
        setSelectedPackageId(activePkg.id);
      }

      if (preselectedQueueItem) {
        setCustomerName(preselectedQueueItem.customerName);
        setSelectedQueueId(preselectedQueueItem.id);
        if (preselectedQueueItem.packageId) {
          setSelectedPackageId(preselectedQueueItem.packageId);
          const found = packages.find((p) => p.id === preselectedQueueItem.packageId);
          if (found) activePkg = found;
        }
      } else {
        setCustomerName('');
        setSelectedQueueId('');
      }

      // Initialize custom remaining time
      const buffer = settings.bufferMinutes ?? 3;
      const totalPkgMins = (activePkg?.durationMinutes ?? 20) + buffer;
      if (initialSetRemaining) {
        setIsCustomRemaining(true);
        // Default to totalPkgMins (or 19 if 23 mins)
        setCustomMinutes(Math.max(1, totalPkgMins - 4));
        setCustomSeconds(0);
      } else {
        setIsCustomRemaining(false);
        setCustomMinutes(totalPkgMins);
        setCustomSeconds(0);
      }
    }
  }, [isOpen, preselectedMachineId, preselectedQueueItem, availableMachines, packages, initialSetRemaining, settings.bufferMinutes]);

  // Handle ESC key to close modal
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const selectedPkg = packages.find((p) => p.id === selectedPackageId);
  const bufferMinutes = settings.bufferMinutes ?? 3;
  const totalDurationMinutes = (selectedPkg?.durationMinutes ?? 20) + bufferMinutes;
  const totalDurationSeconds = totalDurationMinutes * 60;

  // Calculate elapsed info for live preview
  const customTotalSeconds = isCustomRemaining ? (customMinutes * 60 + customSeconds) : totalDurationSeconds;
  const elapsedSeconds = Math.max(0, totalDurationSeconds - customTotalSeconds);
  const elapsedMinutesPart = Math.floor(elapsedSeconds / 60);
  const elapsedSecondsPart = elapsedSeconds % 60;

  const handleSelectPackage = (pkg: RidePackage) => {
    playTapSound(settings.soundEnabled);
    setSelectedPackageId(pkg.id);
    if (!isCustomRemaining) {
      setCustomMinutes(pkg.durationMinutes + bufferMinutes);
      setCustomSeconds(0);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMachineId || !selectedPkg) return;

    let finalCustomSecs: number | undefined = undefined;
    if (isCustomRemaining) {
      const calcSecs = customMinutes * 60 + customSeconds;
      if (calcSecs <= 0) return;
      finalCustomSecs = calcSecs;
    }

    playTapSound(settings.soundEnabled);
    onStart(
      selectedMachineId,
      selectedPkg.id,
      customerName.trim() || 'Walk-in',
      selectedQueueId || undefined,
      finalCustomSecs
    );
    onClose();
  };

  const handleQueueSelect = (item: QueueItem) => {
    playTapSound(settings.soundEnabled);
    setCustomerName(item.customerName);
    setSelectedQueueId(item.id);
    if (item.preferredMachineId && availableMachines.some((m) => m.id === item.preferredMachineId)) {
      setSelectedMachineId(item.preferredMachineId);
    }
    if (item.packageId && packages.some((p) => p.id === item.packageId)) {
      setSelectedPackageId(item.packageId);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="bg-[#101723] border border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Simplified Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-[#0c121c]">
          <div>
            <h2 className="text-base sm:text-lg font-chakra font-black text-white tracking-wide uppercase">
              Mula Sesi Baru
            </h2>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              Pilih aset dan tempoh slot
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              playTapSound(settings.soundEnabled);
              onClose();
            }}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="Tutup (Esc)"
            aria-label="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {/* Quick Queue Auto-Fill Section if Queue Items exist */}
          {queue.length > 0 && !selectedQueueId && (
            <div className="p-3 rounded-2xl bg-[#0c121c] border border-slate-800/80 flex items-center gap-2 overflow-x-auto scrollbar-none">
              <span className="text-[10px] font-mono font-bold uppercase text-amber-400 shrink-0">
                Giliran ({queue.length}):
              </span>
              <div className="flex gap-2">
                {queue.map((q) => (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => handleQueueSelect(q)}
                    className="px-2.5 py-1 rounded-lg text-xs font-mono bg-[#151f2e] hover:bg-[#1c2a3e] border border-slate-700 text-slate-200 flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer"
                  >
                    <span className="font-semibold">{q.customerName}</span>
                    <span className="text-[10px] text-amber-400">({q.packageName})</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 1: PILIH ASET */}
          <div className="space-y-2">
            <label className="text-xs font-mono font-black uppercase text-slate-300 tracking-wider">
              ① PILIH ASET
            </label>

            {availableMachines.length === 0 ? (
              <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs font-mono text-center">
                Tiada mesin berstatus READY pada masa ini. Sila tamatkan sesi aktif atau tetapkan semula mod servis.
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2.5">
                {availableMachines.map((m) => {
                  const isSelected = selectedMachineId === m.id;
                  const assetTypeInfo = resolveAssetType(m.type || m.typeId, assetTypes);
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => {
                        playTapSound(settings.soundEnabled);
                        setSelectedMachineId(m.id);
                      }}
                      className={`p-3 rounded-2xl border text-left flex items-center gap-3 transition-all cursor-pointer ${
                        isSelected
                          ? 'border-amber-400 bg-[#162132] ring-2 ring-amber-400/40 shadow-md'
                          : 'border-slate-800 bg-[#0c121c] hover:bg-[#131a26] text-slate-300'
                      }`}
                    >
                      <span className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-slate-900/90 border border-slate-700/70 p-1 flex items-center justify-center shrink-0 shadow-inner">
                        <AssetIcon
                          icon={assetTypeInfo.icon}
                          name={m.name || assetTypeInfo.name}
                          size="lg"
                          className="w-7 h-7 sm:w-8 sm:h-8"
                        />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className={`font-mono font-black text-xs sm:text-sm truncate ${getAssetCategoryTextColor(m, assetTypeInfo.name)}`}>
                          {m.name}
                        </div>
                        <div className="text-[10px] font-mono text-emerald-400 font-bold uppercase tracking-wider mt-0.5">
                          READY
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* STEP 2: TEMPOH & BAYARAN */}
          <div className="space-y-2">
            <label className="text-xs font-mono font-black uppercase text-slate-300 tracking-wider">
              ② TEMPOH &amp; BAYARAN
            </label>

            <div className="grid grid-cols-3 gap-2 sm:gap-2.5">
              {packages.map((pkg) => {
                const isSelected = selectedPackageId === pkg.id;
                return (
                  <button
                    key={pkg.id}
                    type="button"
                    onClick={() => handleSelectPackage(pkg)}
                    className={`p-2.5 sm:p-3 rounded-2xl border flex flex-col items-center justify-center text-center transition-all cursor-pointer relative ${
                      isSelected
                        ? 'border-amber-400 bg-[#162132] ring-2 ring-amber-400/40 shadow-md'
                        : 'border-slate-800 bg-[#0c121c] hover:bg-[#131a26] text-slate-300'
                    }`}
                  >
                    {pkg.isPopular && (
                      <span className="absolute -top-2 right-1.5 bg-amber-500 text-slate-950 font-mono font-black text-[8px] sm:text-[9px] px-1.5 py-0.2 rounded-full uppercase tracking-wider shadow-xs">
                        POPULAR
                      </span>
                    )}
                    <div className="font-mono font-black text-xs sm:text-sm text-white">
                      {pkg.name || `${pkg.durationMinutes} MIN`}
                    </div>
                    <div className="mt-1 font-mono font-black text-sm sm:text-base text-amber-400">
                      {settings.currencySymbol}{pkg.price}
                    </div>
                    {bufferMinutes > 0 && (
                      <div className="text-[10px] font-mono text-emerald-400 font-semibold mt-0.5">
                        +{bufferMinutes} min
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* PILIHAN ADMIN: SET MASA BERBAKI */}
          <div className="p-3.5 rounded-2xl bg-[#0c121c] border border-slate-800 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="w-8 h-8 rounded-xl bg-[#151f2e] border border-slate-700 flex items-center justify-center text-amber-400 shrink-0">
                  <Clock className="w-4 h-4 text-amber-400" />
                </span>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-black uppercase text-white tracking-wider truncate">
                      SET MASA BERBAKI
                    </span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-amber-500/20 text-amber-400 border border-amber-500/40 font-mono font-bold shrink-0">
                      ADMIN
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 font-mono truncate">
                    Sesi telah dimulakan secara manual oleh pengganti
                  </p>
                </div>
              </div>

              <button
                type="button"
                id="btn-toggle-set-remaining"
                onClick={() => {
                  playTapSound(settings.soundEnabled);
                  const next = !isCustomRemaining;
                  setIsCustomRemaining(next);
                  if (next) {
                    if (customMinutes === 0 && customSeconds === 0) {
                      setCustomMinutes(Math.max(1, totalDurationMinutes - 4));
                      setCustomSeconds(0);
                    }
                  }
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono font-black uppercase transition-all cursor-pointer border shrink-0 flex items-center gap-1.5 ${
                  isCustomRemaining
                    ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-500/20 font-bold'
                    : 'bg-[#151f2e] text-slate-300 border-slate-700 hover:border-amber-500/40 hover:text-white'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>{isCustomRemaining ? 'AKTIF' : 'LARAS BAKI'}</span>
              </button>
            </div>

            {isCustomRemaining && (
              <div className="pt-2.5 border-t border-slate-800 space-y-3 animate-in fade-in duration-200">
                <div className="bg-[#151f2e] p-3 rounded-xl border border-amber-500/30">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[10px] font-mono font-black uppercase text-amber-400 tracking-wider">
                      MASUKKAN MASA SEBENAR YANG BERBAKI
                    </label>
                    <span className="text-[10px] font-mono text-slate-400">
                      Asal: {totalDurationMinutes}m
                    </span>
                  </div>

                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="flex-1">
                      <span className="text-[10px] font-mono text-slate-400 block mb-1">
                        Minit (0 - {Math.max(totalDurationMinutes, 120)}):
                      </span>
                      <input
                        type="number"
                        min={0}
                        max={Math.max(totalDurationMinutes, 180)}
                        value={customMinutes}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10);
                          setCustomMinutes(isNaN(val) ? 0 : Math.max(0, Math.min(val, 180)));
                        }}
                        className="w-full px-3 py-2 rounded-xl border border-amber-500/60 bg-[#0c121c] text-amber-400 text-lg sm:text-xl font-mono font-black text-center focus:border-amber-400 focus:outline-none ring-1 ring-amber-500/20"
                        placeholder="19"
                        autoFocus
                      />
                    </div>

                    <span className="text-amber-400 font-mono font-black text-2xl pt-4">:</span>

                    <div className="w-24 sm:w-28">
                      <span className="text-[10px] font-mono text-slate-400 block mb-1">
                        Saat (0 - 59):
                      </span>
                      <input
                        type="number"
                        min={0}
                        max={59}
                        value={customSeconds}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10);
                          setCustomSeconds(isNaN(val) ? 0 : Math.max(0, Math.min(val, 59)));
                        }}
                        className="w-full px-3 py-2 rounded-xl border border-amber-500/60 bg-[#0c121c] text-amber-400 text-lg sm:text-xl font-mono font-black text-center focus:border-amber-400 focus:outline-none ring-1 ring-amber-500/20"
                        placeholder="00"
                      />
                    </div>
                  </div>
                </div>

                {/* Butang Pintas Penyelarasan Minit */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                  <span className="text-[10px] font-mono text-slate-400 uppercase shrink-0">Pintas Laras:</span>
                  {[-1, -2, -3, -4, -5].map((diff) => (
                    <button
                      key={diff}
                      type="button"
                      onClick={() => {
                        playTapSound(settings.soundEnabled);
                        setCustomMinutes((prev) => Math.max(1, prev + diff));
                      }}
                      className="px-2 py-1 rounded-lg bg-[#151f2e] hover:bg-[#1d2a3d] border border-slate-700 text-xs font-mono font-bold text-slate-300 hover:text-white transition-colors cursor-pointer shrink-0"
                    >
                      {diff}m
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      playTapSound(settings.soundEnabled);
                      setCustomMinutes(totalDurationMinutes);
                      setCustomSeconds(0);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-[#151f2e] hover:bg-[#1d2a3d] border border-amber-500/30 text-xs font-mono font-bold text-amber-400 hover:text-amber-300 transition-colors cursor-pointer shrink-0"
                  >
                    Penuh ({totalDurationMinutes}m)
                  </button>
                </div>

                {/* Live Informational Breakdown */}
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs font-mono text-slate-200 space-y-1">
                  <div className="flex items-center gap-1.5 text-amber-400 font-bold mb-1">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Pratonton Penyelarasan Masa</span>
                  </div>
                  <p className="text-[11px] text-slate-300">
                    • Tempoh slot penuh: <span className="text-white font-bold">{totalDurationMinutes} minit</span>
                  </p>
                  <p className="text-[11px] text-slate-300">
                    • Anggaran telah berjalan manual:{' '}
                    <span className="text-amber-300 font-bold">
                      {elapsedMinutesPart} minit {elapsedSecondsPart > 0 ? `${elapsedSecondsPart} saat` : ''}
                    </span>
                  </p>
                  <p className="text-[11px] text-slate-300">
                    • Countdown platform bermula tepat pada:{' '}
                    <span className="text-emerald-400 font-bold text-xs sm:text-sm">
                      {String(customMinutes).padStart(2, '0')}:{String(customSeconds).padStart(2, '0')}
                    </span>{' '}
                    hingga <span className="text-rose-400 font-bold">00:00</span>
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* STEP 3: NAMA PELANGGAN (OPTIONAL) */}
          <div className="space-y-2">
            <label className="text-xs font-mono font-black uppercase text-slate-300 tracking-wider">
              ③ NAMA PELANGGAN (OPTIONAL)
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="👤 Contoh: Aiman / Walk-in"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-800 bg-[#0c121c] text-white text-xs font-mono placeholder-slate-500 focus:border-amber-400 focus:ring-1 focus:ring-amber-400/40 focus:outline-none"
              />
            </div>
          </div>

          {/* STEP 4: SUMMARY */}
          {selectedPkg && selectedMachineId && (
            <div className="p-3.5 sm:p-4 rounded-2xl bg-[#0c121c] border border-slate-800 flex items-center justify-between font-mono">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                  JUMLAH
                </span>
                <span className="text-lg sm:text-xl font-black text-emerald-400">
                  {settings.currencySymbol}{selectedPkg.price.toFixed(2)}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                  {isCustomRemaining ? 'BAKI MASA MULA' : 'TEMPOH'}
                </span>
                <span className="text-base sm:text-lg font-black text-amber-400">
                  {isCustomRemaining
                    ? `${String(customMinutes).padStart(2, '0')}:${String(customSeconds).padStart(2, '0')}`
                    : `${totalDurationMinutes} MIN`}
                </span>
                <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                  {isCustomRemaining
                    ? `Daripada pakej asal ${totalDurationMinutes} min`
                    : bufferMinutes > 0
                    ? `${selectedPkg.durationMinutes} min + ${bufferMinutes} min bertenang`
                    : `${selectedPkg.durationMinutes} min`}
                </span>
              </div>
            </div>
          )}

          {/* PRIMARY ACTION */}
          <button
            type="submit"
            disabled={
              !selectedMachineId || 
              !selectedPkg || 
              availableMachines.length === 0 || 
              (isCustomRemaining && customMinutes === 0 && customSeconds === 0)
            }
            className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 disabled:opacity-40 disabled:pointer-events-none text-slate-950 font-chakra font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all cursor-pointer active:scale-[0.98]"
          >
            <Play className="w-4 h-4 fill-slate-950 text-slate-950" />
            <span>
              {isCustomRemaining
                ? `MULAKAN SESI (BAKI ${String(customMinutes).padStart(2, '0')}:${String(customSeconds).padStart(2, '0')})`
                : 'MULAKAN SESI'}
            </span>
          </button>
        </form>
      </div>
    </div>
  );
};

