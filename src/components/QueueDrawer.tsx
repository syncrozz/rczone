import React, { useState, useEffect } from 'react';
import { 
  X, 
  Users, 
  Plus, 
  Trash2, 
  ArrowRight, 
  Clock, 
  Truck,
  Play,
  Zap,
} from 'lucide-react';
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
  onRequireAdmin: (action?: () => void, title?: string, desc?: string) => void;
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
  onRequireAdmin,
}) => {
  const [customerName, setCustomerName] = useState('');
  const [selectedMachineId, setSelectedMachineId] = useState('');
  const [selectedPackageId, setSelectedPackageId] = useState('');
  const [notes, setNotes] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

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

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim()) return;

    playTapSound(settings.soundEnabled);
    const selectedPkg = packages.find((p) => p.id === selectedPackageId);

    onAddToQueue({
      customerName: customerName.trim(),
      preferredMachineId: selectedMachineId || undefined,
      packageId: selectedPackageId || undefined,
      packageName: selectedPkg ? selectedPkg.name : undefined,
      notes: notes.trim() || undefined,
    });

    setCustomerName('');
    setSelectedMachineId('');
    setSelectedPackageId('');
    setNotes('');
    setShowAddForm(false);
  };

  const handleRemove = (id: string) => {
    onRequireAdmin(
      () => {
        playTapSound(settings.soundEnabled);
        onRemoveFromQueue(id);
      },
      'Padam Pelanggan Giliran',
      'Pengesahan Admin diperlukan untuk memadam giliran pelanggan.'
    );
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/80 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
      <div 
        className="w-full max-w-md bg-[#101723] border-l border-slate-800 h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-200 font-mono"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-[#0c121c]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                WAITING QUEUE
              </span>
              <h2 className="text-base sm:text-lg font-black text-white tracking-tight uppercase mt-0.5">
                Senarai Menunggu ({queue.length})
              </h2>
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

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
          {!showAddForm && (
            <button
              type="button"
              onClick={() => setShowAddForm(true)}
              className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all cursor-pointer active:scale-[0.98]"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>+ TAMBAH KE GILIRAN</span>
            </button>
          )}

          {/* Add Queue Form */}
          {showAddForm && (
            <form onSubmit={handleAddSubmit} className="p-4 rounded-2xl bg-[#0c121c] border border-slate-800 space-y-3">
              <div className="flex justify-between items-center pb-1">
                <span className="text-xs font-black uppercase text-amber-400">
                  Daftar Giliran Baru
                </span>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  Batal
                </button>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">
                  Nama Pelanggan *
                </label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="cth: Kamal"
                  className="w-full px-3 py-2 rounded-xl border border-slate-700 bg-[#151f2e] text-white text-xs font-bold focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">
                  Pakej Pilihan (Pilihan)
                </label>
                <select
                  value={selectedPackageId}
                  onChange={(e) => setSelectedPackageId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-700 bg-[#151f2e] text-white text-xs font-bold focus:border-amber-400 focus:outline-none"
                >
                  <option value="">-- Sebarang Pakej --</option>
                  {packages.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({settings.currencySymbol}{p.price})
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider transition-colors cursor-pointer"
              >
                SIMPAN GILIRAN
              </button>
            </form>
          )}

          {/* Queue Items */}
          {queue.length === 0 ? (
            <div className="py-12 px-4 text-center rounded-2xl bg-[#0c121c] border border-dashed border-slate-800">
              <Users className="w-10 h-10 text-slate-600 mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-400">
                Tiada pelanggan dalam giliran
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {queue.map((item, idx) => (
                <div
                  key={item.id}
                  className="p-3.5 rounded-2xl bg-[#0c121c] border border-slate-800 flex items-center justify-between gap-3 hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center font-black text-xs">
                      #{idx + 1}
                    </div>
                    <div>
                      <h4 className="font-black text-sm text-white">{item.customerName}</h4>
                      <p className="text-[10px] text-slate-400">
                        Pakej: <strong className="text-amber-400">{item.packageName || 'Bebas'}</strong>
                      </p>
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
                      className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-[11px] uppercase tracking-wider transition-colors cursor-pointer"
                    >
                      ASSIGN
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemove(item.id)}
                      className="p-1.5 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 transition-colors cursor-pointer"
                      title="Padam"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
