import React, { useState } from 'react';
import { X, Users, UserPlus, Play, Trash2, Clock, CheckCircle, HelpCircle } from 'lucide-react';
import { QueueItem, Machine, RidePackage, AppSettings } from '../types';
import { playTapSound } from '../utils/sound';

interface QueueDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  queue: QueueItem[];
  machines: Machine[];
  packages: RidePackage[];
  settings: AppSettings;
  onAddToQueue: (item: Omit<QueueItem, 'id' | 'createdAt'>) => void;
  onRemoveFromQueue: (id: string) => void;
  onStartFromQueue: (queueItem: QueueItem) => void;
}

export const QueueDrawer: React.FC<QueueDrawerProps> = ({
  isOpen,
  onClose,
  queue,
  machines,
  packages,
  settings,
  onAddToQueue,
  onRemoveFromQueue,
  onStartFromQueue,
}) => {
  const [customerName, setCustomerName] = useState('');
  const [preferredMachineType, setPreferredMachineType] = useState<string>('any');
  const [packageId, setPackageId] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  React.useEffect(() => {
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

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim()) return;

    playTapSound(settings.soundEnabled);
    onAddToQueue({
      customerName: customerName.trim(),
      preferredMachineType: preferredMachineType as any,
      packageId: packageId || undefined,
      notes: notes.trim() || undefined,
    });

    setCustomerName('');
    setNotes('');
    setShowAddForm(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 w-full max-w-md h-full shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-250"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center border border-amber-500/20">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
                Senarai Menunggu (Queue)
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                {queue.length} pelanggan sedang menunggu
              </p>
            </div>
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

        {/* Content Area */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1">
          {/* Quick Add Form Toggle Button */}
          {!showAddForm ? (
            <button
              type="button"
              onClick={() => {
                playTapSound(settings.soundEnabled);
                setShowAddForm(true);
              }}
              className="w-full py-3 px-4 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-sm flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>+ TAMBAH PELANGGAN KE GILIRAN</span>
            </button>
          ) : (
            <form
              onSubmit={handleAddSubmit}
              className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-3.5"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase text-amber-800 dark:text-amber-300">
                  Daftar Giliran Baru
                </span>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="text-xs text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white"
                >
                  Tutup
                </button>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-600 dark:text-slate-300 mb-1">
                  Nama Pelanggan *
                </label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="cth: Danish / Rayyan"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-600 dark:text-slate-300 mb-1">
                    Pilihan Mesin
                  </label>
                  <select
                    value={preferredMachineType}
                    onChange={(e) => setPreferredMachineType(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-xs"
                  >
                    <option value="any">Mana-mana Mesin</option>
                    <option value="excavator">Excavator</option>
                    <option value="bulldozer">Bulldozer</option>
                    <option value="dumptruck">Dump Truck</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-600 dark:text-slate-300 mb-1">
                    Pilihan Pakej
                  </label>
                  <select
                    value={packageId}
                    onChange={(e) => setPackageId(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-xs"
                  >
                    <option value="">Belum Pilih</option>
                    {packages.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({settings.currencySymbol}{p.price})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-600 dark:text-slate-300 mb-1">
                  Nota / Catatan (Pilihan)
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="cth: 2 orang kanak-kanak"
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-xs"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-sm transition-all"
              >
                SIMPAN KE GILIRAN
              </button>
            </form>
          )}

          {/* Queue List */}
          <div className="space-y-2.5">
            {queue.length === 0 ? (
              <div className="py-12 px-4 text-center rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-700">
                <Users className="w-10 h-10 text-slate-400 mx-auto mb-2 opacity-50" />
                <p className="font-bold text-sm text-slate-700 dark:text-slate-300">
                  Tiada Pelanggan Menunggu
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                  Senarai kosong. Tambah nama apabila semua mesin sedang beroperasi.
                </p>
              </div>
            ) : (
              queue.map((item, index) => {
                const pkg = packages.find((p) => p.id === item.packageId);
                const waitMinutes = Math.floor((Date.now() - item.createdAt) / 60000);

                return (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-amber-500 text-slate-950 font-black text-sm flex items-center justify-center">
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-extrabold text-sm text-slate-900 dark:text-white">
                          {item.customerName}
                        </div>
                        <div className="text-[11px] text-slate-600 dark:text-slate-300 flex items-center gap-1.5 mt-0.5">
                          <span className="capitalize">
                            {item.preferredMachineType === 'any'
                              ? 'Mana-mana Mesin'
                              : item.preferredMachineType}
                          </span>
                          {pkg && <span>• {pkg.name}</span>}
                          <span>• {waitMinutes}m lalu</span>
                        </div>
                        {item.notes && (
                          <div className="text-[10px] text-amber-800 dark:text-amber-300 italic mt-0.5">
                            {item.notes}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          playTapSound(settings.soundEnabled);
                          onStartFromQueue(item);
                          onClose();
                        }}
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1 shadow-sm transition-all"
                        title="Mula sesi untuk pelanggan ini"
                      >
                        <Play className="w-3 h-3 fill-white" />
                        <span>MULA</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          playTapSound(settings.soundEnabled);
                          onRemoveFromQueue(item.id);
                        }}
                        className="p-1.5 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                        title="Padam dari giliran"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
