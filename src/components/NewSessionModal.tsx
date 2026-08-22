import React, { useState, useEffect } from 'react';
import { X, Play, Clock, DollarSign, User, Sparkles, AlertCircle, Check } from 'lucide-react';
import { Machine, RidePackage, QueueItem, AppSettings } from '../types';
import { playTapSound } from '../utils/sound';

interface NewSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableMachines: Machine[];
  packages: RidePackage[];
  queue: QueueItem[];
  preselectedMachineId?: string;
  preselectedQueueItem?: QueueItem;
  settings: AppSettings;
  onStart: (machineId: string, packageId: string, customerName?: string, queueItemId?: string) => void;
}

export const NewSessionModal: React.FC<NewSessionModalProps> = ({
  isOpen,
  onClose,
  availableMachines,
  packages,
  queue,
  preselectedMachineId,
  preselectedQueueItem,
  settings,
  onStart,
}) => {
  const [selectedMachineId, setSelectedMachineId] = useState<string>('');
  const [selectedPackageId, setSelectedPackageId] = useState<string>('');
  const [customerName, setCustomerName] = useState<string>('');
  const [selectedQueueItemId, setSelectedQueueItemId] = useState<string | undefined>(undefined);

  const prevOpenRef = React.useRef(false);

  useEffect(() => {
    if (isOpen && !prevOpenRef.current) {
      // Initialize only when modal opens
      if (preselectedMachineId && availableMachines.some((m) => m.id === preselectedMachineId)) {
        setSelectedMachineId(preselectedMachineId);
      } else if (availableMachines.length > 0) {
        setSelectedMachineId(availableMachines[0].id);
      } else {
        setSelectedMachineId('');
      }

      if (preselectedQueueItem) {
        setCustomerName(preselectedQueueItem.customerName);
        setSelectedQueueItemId(preselectedQueueItem.id);
        if (preselectedQueueItem.packageId && packages.some((p) => p.id === preselectedQueueItem.packageId)) {
          setSelectedPackageId(preselectedQueueItem.packageId);
        } else if (packages.length > 0) {
          const popular = packages.find((p) => p.isPopular) || packages[0];
          setSelectedPackageId(popular.id);
        }
      } else {
        setCustomerName('');
        setSelectedQueueItemId(undefined);
        if (packages.length > 0) {
          const popular = packages.find((p) => p.isPopular) || packages[0];
          setSelectedPackageId(popular.id);
        }
      }
    }
    prevOpenRef.current = isOpen;
  }, [isOpen, preselectedMachineId, preselectedQueueItem]);

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

  const handleSelectQueueItem = (item: QueueItem) => {
    playTapSound(settings.soundEnabled);
    setCustomerName(item.customerName);
    setSelectedQueueItemId(item.id);
    if (item.packageId && packages.some((p) => p.id === item.packageId)) {
      setSelectedPackageId(item.packageId);
    }
    if (item.preferredMachineId && availableMachines.some((m) => m.id === item.preferredMachineId)) {
      setSelectedMachineId(item.preferredMachineId);
    }
  };

  const handleStartSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMachineId || !selectedPackageId) return;

    playTapSound(settings.soundEnabled);
    onStart(
      selectedMachineId,
      selectedPackageId,
      customerName.trim() || undefined,
      selectedQueueItemId
    );
    onClose();
  };

  const chosenPackage = packages.find((p) => p.id === selectedPackageId);
  const chosenMachine = availableMachines.find((m) => m.id === selectedMachineId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300">
              Sesi Baru
            </span>
            <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
              Mula Sesi RC Fun Ride
            </h2>
          </div>
          <button
            type="button"
            onClick={() => {
              playTapSound(settings.soundEnabled);
              onClose();
            }}
            className="p-2 rounded-xl text-slate-600 hover:text-slate-800 dark:text-slate-300 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form */}
        <form onSubmit={handleStartSubmit} className="p-4 sm:p-5 space-y-5 overflow-y-auto">
          {/* 1. Pilih Mesin */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
              1. Pilih Mesin Tersedia ({availableMachines.length})
            </label>

            {availableMachines.length === 0 ? (
              <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 text-amber-800 dark:text-amber-300 text-sm flex items-start gap-2.5">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Semua mesin sedang berjalan atau dalam penyelenggaraan.</p>
                  <p className="text-xs mt-0.5">
                    Sila tunggu sesi semasa selesai atau masukkan pelanggan ke dalam Senarai Menunggu (Queue).
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2.5">
                {availableMachines.map((m) => {
                  const isSelected = selectedMachineId === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      id={`opt-machine-${m.id}`}
                      onClick={() => {
                        playTapSound(settings.soundEnabled);
                        setSelectedMachineId(m.id);
                      }}
                      className={`p-3 rounded-2xl border-2 text-left transition-all flex items-center justify-between cursor-pointer ${
                        isSelected
                          ? 'border-amber-500 bg-amber-50/70 dark:bg-amber-500/10 ring-2 ring-amber-500/20'
                          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900'
                      }`}
                    >
                      <div>
                        <div className="font-extrabold text-sm text-slate-900 dark:text-white">
                          {m.name}
                        </div>
                        <div className="text-[11px] text-slate-600 dark:text-slate-300 capitalize font-medium">
                          {m.customTypeLabel || m.type}
                        </div>
                      </div>
                      {isSelected && (
                        <div className="w-5 h-5 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center font-bold text-xs">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* 2. Pilih Pakej Masa */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
              2. Pilih Pakej Masa
            </label>
            {packages.length === 0 ? (
              <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs flex items-center gap-2 font-medium">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>Tiada pakej masa didaftarkan. Sila daftarkan pakej di menu Tetapan terlebih dahulu.</span>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2.5 pt-1.5">
                {packages.map((pkg) => {
                  const isSelected = selectedPackageId === pkg.id;
                  return (
                    <button
                      key={pkg.id}
                      type="button"
                      id={`opt-pkg-${pkg.id}`}
                      onClick={() => {
                        playTapSound(settings.soundEnabled);
                        setSelectedPackageId(pkg.id);
                      }}
                      className={`p-3.5 rounded-2xl border-2 text-center transition-all relative flex flex-col items-center justify-between cursor-pointer ${
                        isSelected
                          ? 'border-amber-500 bg-amber-50/90 dark:bg-amber-950/40 ring-2 ring-amber-500/40 scale-[1.03] shadow-md shadow-amber-500/15 z-10'
                          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900 opacity-90 hover:opacity-100'
                      }`}
                    >
                      {pkg.isPopular && (
                        <span className="absolute -top-2.5 bg-amber-500 text-slate-950 text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider shadow-xs">
                          ★ POPULAR
                        </span>
                      )}
                      <span className={`font-extrabold text-sm mt-0.5 ${isSelected ? 'text-amber-950 dark:text-amber-200' : 'text-slate-900 dark:text-white'}`}>
                        {pkg.name}
                      </span>
                      <span className={`text-base font-black mt-1 ${isSelected ? 'text-amber-600 dark:text-amber-400' : 'text-slate-700 dark:text-slate-300'}`}>
                        {settings.currencySymbol}{pkg.price}
                      </span>
                      {isSelected && (
                        <div className="mt-1.5 flex items-center gap-1 text-[10px] font-black text-amber-700 dark:text-amber-300 uppercase tracking-tight">
                          <Check className="w-3 h-3 stroke-[3]" />
                          <span>Dipilih</span>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* 3. Maklumat Pelanggan (Optional) & Queue Fast Pick */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                3. Nama Pelanggan (Pilihan / Walk-in)
              </label>
              {queue.length > 0 && (
                <span className="text-[11px] font-semibold text-amber-800 dark:text-amber-300">
                  {queue.length} dalam giliran
                </span>
              )}
            </div>

            {/* Quick Pick from Queue if available */}
            {queue.length > 0 && (
              <div className="mb-2.5 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 block mb-1.5 px-1">
                  Pilih Dari Senarai Menunggu:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {queue.map((q) => (
                    <button
                      key={q.id}
                      type="button"
                      onClick={() => handleSelectQueueItem(q)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
                        selectedQueueItemId === q.id
                          ? 'bg-amber-500 text-slate-950 border-amber-500'
                          : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-amber-400'
                      }`}
                    >
                      {q.customerName}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="relative">
              <input
                type="text"
                id="input-customer-name"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="cth: Ahmad / Walk-in"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white placeholder-slate-400 text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500"
              />
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            </div>
          </div>

          {/* Quick Summary Strip */}
          {chosenMachine && chosenPackage && (
            <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between text-xs">
              <div>
                <span className="text-slate-600 dark:text-slate-300 block text-[10px]">Ringkasan:</span>
                <span className="font-extrabold text-slate-900 dark:text-white text-sm">
                  {chosenMachine.name} • {chosenPackage.name}
                </span>
              </div>
              <div className="text-right">
                <span className="text-slate-600 dark:text-slate-300 block text-[10px]">Jumlah:</span>
                <span className="font-black text-amber-800 dark:text-amber-300 text-base">
                  {settings.currencySymbol}{chosenPackage.price}
                </span>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              id="btn-confirm-start-session"
              disabled={!selectedMachineId || !selectedPackageId || availableMachines.length === 0}
              className="w-full py-3.5 px-4 rounded-2xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] text-slate-950 font-black text-base flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 transition-all cursor-pointer"
            >
              <Play className="w-5 h-5 fill-slate-950" />
              <span>MULA SESI SEKARANG</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
