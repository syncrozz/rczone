import React, { useState, useEffect } from 'react';
import { 
  X, 
  Play, 
  Clock, 
  User, 
  DollarSign, 
  Check, 
  Layers, 
  AlertCircle,
  Truck,
  Zap,
} from 'lucide-react';
import { Machine, RidePackage, QueueItem, AppSettings, AssetType } from '../types';
import { resolveAssetType } from '../utils/storage';
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
  settings: AppSettings;
  onStart: (
    machineId: string,
    packageId: string,
    customerName?: string,
    queueItemId?: string
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
  settings,
  onStart,
}) => {
  const [selectedMachineId, setSelectedMachineId] = useState<string>('');
  const [selectedPackageId, setSelectedPackageId] = useState<string>('');
  const [customerName, setCustomerName] = useState<string>('');
  const [selectedQueueId, setSelectedQueueId] = useState<string>('');

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

      if (packages.length > 0) {
        const popular = packages.find((p) => p.isPopular);
        setSelectedPackageId(popular ? popular.id : packages[0].id);
      }

      if (preselectedQueueItem) {
        setCustomerName(preselectedQueueItem.customerName);
        setSelectedQueueId(preselectedQueueItem.id);
        if (preselectedQueueItem.packageId) {
          setSelectedPackageId(preselectedQueueItem.packageId);
        }
      } else {
        setCustomerName('');
        setSelectedQueueId('');
      }
    }
  }, [isOpen, preselectedMachineId, preselectedQueueItem, availableMachines, packages]);

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMachineId || !selectedPkg) return;

    playTapSound(settings.soundEnabled);
    onStart(
      selectedMachineId,
      selectedPkg.id,
      customerName.trim() || 'Walk-in',
      selectedQueueId || undefined
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
        {/* Top Motorsport Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-[#0c121c]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center shadow-xs">
              <Zap className="w-5 h-5 fill-amber-400 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-chakra font-black uppercase tracking-widest px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  RACE CONTROL
                </span>
                <h2 className="text-base sm:text-lg font-chakra font-black text-white tracking-wide uppercase">
                  Mula Sesi Baru
                </h2>
              </div>
              <p className="text-xs text-slate-400 font-mono">
                Pilih unit mesin, pakej masa dan nama pelanggan
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              playTapSound(settings.soundEnabled);
              onClose();
            }}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {/* Quick Queue Auto-Fill Section if Queue Items exist */}
          {queue.length > 0 && !selectedQueueId && (
            <div className="p-3.5 rounded-2xl bg-[#0c121c] border border-slate-800 space-y-2">
              <span className="text-[11px] font-mono font-black uppercase text-amber-400 tracking-wider block">
                Ambil Daripada Giliran ({queue.length})
              </span>
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                {queue.map((q) => (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => handleQueueSelect(q)}
                    className="px-3 py-1.5 rounded-xl text-xs font-mono font-bold bg-[#151f2e] hover:bg-[#1c2a3e] border border-slate-700 text-slate-200 flex items-center gap-2 shrink-0 transition-colors cursor-pointer"
                  >
                    <span>{q.customerName}</span>
                    <span className="text-[10px] text-amber-400">({q.packageName})</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 1. MACHINE SELECTION */}
          <div className="space-y-2">
            <label className="text-xs font-mono font-black uppercase text-slate-300 tracking-wider flex items-center justify-between">
              <span>1. PILIH UNIT MESIN</span>
              <span className="text-amber-400 font-bold">
                {availableMachines.length} UNIT READY
              </span>
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
                      <span className="w-11 h-11 rounded-xl bg-slate-900/90 border border-slate-700/70 p-1 flex items-center justify-center shrink-0 shadow-inner">
                        <AssetIcon
                          icon={assetTypeInfo.icon}
                          name={m.name || assetTypeInfo.name}
                          size="lg"
                          className="w-8 h-8"
                        />
                      </span>
                      <div className="min-w-0">
                        <div className="font-mono font-black text-xs sm:text-sm text-white truncate">
                          {m.name}
                        </div>
                        <div className="text-[10px] font-mono text-emerald-400 font-bold uppercase tracking-wider">
                          READY &bull; {assetTypeInfo.name}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* 2. PACKAGE & DURATION SELECTION */}
          <div className="space-y-2">
            <label className="text-xs font-mono font-black uppercase text-slate-300 tracking-wider">
              2. PILIH PAKEJ TEMPOH & KADAR
            </label>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {packages.map((pkg) => {
                const isSelected = selectedPackageId === pkg.id;
                return (
                  <button
                    key={pkg.id}
                    type="button"
                    onClick={() => {
                      playTapSound(settings.soundEnabled);
                      setSelectedPackageId(pkg.id);
                    }}
                    className={`p-3 rounded-2xl border flex flex-col justify-between text-left transition-all cursor-pointer relative ${
                      isSelected
                        ? 'border-amber-400 bg-[#162132] ring-2 ring-amber-400/40 shadow-md'
                        : 'border-slate-800 bg-[#0c121c] hover:bg-[#131a26] text-slate-300'
                    }`}
                  >
                    {pkg.isPopular && (
                      <span className="absolute -top-2 right-2 bg-amber-500 text-slate-950 font-mono font-black text-[9px] px-2 py-0.5 rounded-full uppercase tracking-wider shadow-xs">
                        POPULAR
                      </span>
                    )}
                    <div>
                      <div className="font-mono font-black text-sm text-white">
                        {pkg.name}
                      </div>
                      <div className="text-[11px] font-mono text-slate-400 font-bold mt-0.5">
                        {pkg.durationMinutes} Minit
                        {(settings.bufferMinutes ?? 3) > 0 && (
                          <span className="ml-1 text-emerald-400 font-black">
                            (+{settings.bufferMinutes ?? 3}m)
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="mt-2 text-base font-mono font-black text-amber-400">
                      {settings.currencySymbol}{pkg.price}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. CUSTOMER NAME INPUT */}
          <div className="space-y-2">
            <label className="text-xs font-mono font-black uppercase text-slate-300 tracking-wider">
              3. NAMA PELANGGAN (PILIHAN)
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-amber-400/70 absolute left-3.5 top-3.5" />
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="cth: Ahmad / Walk-in"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-700 bg-[#0c121c] text-white text-xs font-mono placeholder-slate-500 focus:border-amber-400 focus:ring-1 focus:ring-amber-400/40 focus:outline-none"
              />
            </div>
          </div>

          {/* SUMMARY BOX */}
          {selectedPkg && selectedMachineId && (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-[#121b29] to-[#0d1420] border border-amber-500/30 flex items-center justify-between font-mono">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase block tracking-wider">
                  JUMLAH BAYARAN
                </span>
                <span className="text-xl font-black text-emerald-400">
                  {settings.currencySymbol} {selectedPkg.price.toFixed(2)}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 font-bold uppercase block tracking-wider">
                  TEMPOH OPERASI
                </span>
                <span className="text-sm font-black text-amber-400">
                  {selectedPkg.durationMinutes + (settings.bufferMinutes ?? 3)} MINIT
                </span>
                {(settings.bufferMinutes ?? 3) > 0 && (
                  <span className="text-[10px] text-emerald-400 font-mono block">
                    ({selectedPkg.durationMinutes}m + {settings.bufferMinutes ?? 3}m bertenang)
                  </span>
                )}
              </div>
            </div>
          )}

          {/* SUBMIT BUTTON */}
          <button
            type="submit"
            disabled={!selectedMachineId || !selectedPkg || availableMachines.length === 0}
            className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 disabled:opacity-50 disabled:pointer-events-none text-slate-950 font-chakra font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl shadow-amber-500/25 transition-all cursor-pointer active:scale-[0.98] ring-1 ring-amber-300/40"
          >
            <Play className="w-4 h-4 fill-slate-950 text-slate-950" />
            <span>MULA SESI SEKARANG</span>
          </button>
        </form>
      </div>
    </div>
  );
};
