import React, { useState } from 'react';
import { 
  X, 
  Settings, 
  Wrench, 
  Plus, 
  Trash2, 
  Volume2, 
  BellRing, 
  Sun, 
  RotateCcw, 
  Check, 
  Layers, 
  Clock, 
  DollarSign,
  AlertTriangle,
  Lock,
  Unlock,
  ShieldCheck,
  KeyRound
} from 'lucide-react';
import { Machine, RidePackage, AppSettings, MachineType } from '../types';
import { playTapSound, playTimeUpAlarm, playEndingSoonSound } from '../utils/sound';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  machines: Machine[];
  packages: RidePackage[];
  settings: AppSettings;
  onUpdateSettings: (settings: AppSettings) => void;
  onAddMachine: (machine: Omit<Machine, 'id' | 'status'>) => void;
  onDeleteMachine: (id: string) => void;
  onToggleMachineMaintenance: (machine: Machine) => void;
  onAddPackage: (pkg: Omit<RidePackage, 'id'>) => void;
  onDeletePackage: (id: string) => void;
  onResetFactory: () => void;
  isAdminMode: boolean;
  onLockAdmin: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  machines,
  packages,
  settings,
  onUpdateSettings,
  onAddMachine,
  onDeleteMachine,
  onToggleMachineMaintenance,
  onAddPackage,
  onDeletePackage,
  onResetFactory,
  isAdminMode,
  onLockAdmin,
}) => {
  const [activeTab, setActiveTab] = useState<'machines' | 'packages' | 'alerts' | 'system'>('machines');

  // New machine state
  const [newMachineName, setNewMachineName] = useState('');
  const [newMachineType, setNewMachineType] = useState<MachineType>('excavator');
  const [showAddMachine, setShowAddMachine] = useState(false);

  // New package state
  const [newPkgName, setNewPkgName] = useState('');
  const [newPkgDuration, setNewPkgDuration] = useState<number>(45);
  const [newPkgPrice, setNewPkgPrice] = useState<number>(20);
  const [showAddPkg, setShowAddPkg] = useState(false);

  // Factory reset confirm
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Admin PIN change state
  const [editingPin, setEditingPin] = useState(settings.adminPin || '5313');
  const [pinSavedMessage, setPinSavedMessage] = useState(false);

  // Handle ESC key to close modal
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

  const handleAddMachineSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMachineName.trim()) return;

    playTapSound(settings.soundEnabled);
    onAddMachine({
      name: newMachineName.trim(),
      type: newMachineType,
    });

    setNewMachineName('');
    setShowAddMachine(false);
  };

  const handleAddPkgSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPkgName.trim() || newPkgDuration <= 0) return;

    playTapSound(settings.soundEnabled);
    onAddPackage({
      name: newPkgName.trim(),
      durationMinutes: newPkgDuration,
      price: newPkgPrice,
    });

    setNewPkgName('');
    setShowAddPkg(false);
  };

  const handleSavePin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPin || editingPin.length < 4) return;
    playTapSound(settings.soundEnabled);
    onUpdateSettings({ ...settings, adminPin: editingPin.trim() });
    setPinSavedMessage(true);
    setTimeout(() => setPinSavedMessage(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 p-0.5 border border-slate-200 dark:border-slate-700 flex items-center justify-center overflow-hidden shrink-0 shadow-2xs">
              <img
                src="https://raw.githubusercontent.com/syncrozz/syncrozz-assets/main/logo/RC%20Zone/android-chrome-192x192.png"
                alt="RC Zone"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
                  Tetapan Sistem & Mesin
                </h2>
                {isAdminMode && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                    <ShieldCheck className="w-3 h-3 text-amber-500" />
                    Admin Mode (5313)
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                Pengurusan armada RC, pakej harga dan keselamatan sistem
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            {isAdminMode && (
              <button
                type="button"
                onClick={() => {
                  playTapSound(settings.soundEnabled);
                  onLockAdmin();
                  onClose();
                }}
                className="px-2.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold flex items-center gap-1 transition-colors"
                title="Kunci Mod Admin Semula"
              >
                <Lock className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Kunci Admin</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                playTapSound(settings.soundEnabled);
                onClose();
              }}
              className="p-2 rounded-xl text-slate-600 hover:text-slate-800 dark:text-slate-300 dark:hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-100/60 dark:bg-slate-950/40 px-4 pt-2 gap-2 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('machines')}
            className={`px-3.5 py-2 text-xs font-bold rounded-t-xl transition-all border-b-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'machines'
                ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400 bg-white dark:bg-slate-900'
                : 'border-transparent text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Mesin ({machines.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('packages')}
            className={`px-3.5 py-2 text-xs font-bold rounded-t-xl transition-all border-b-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'packages'
                ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400 bg-white dark:bg-slate-900'
                : 'border-transparent text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Pakej Masa ({packages.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('alerts')}
            className={`px-3.5 py-2 text-xs font-bold rounded-t-xl transition-all border-b-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'alerts'
                ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400 bg-white dark:bg-slate-900'
                : 'border-transparent text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Audio & Amaran
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('system')}
            className={`px-3.5 py-2 text-xs font-bold rounded-t-xl transition-all border-b-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'system'
                ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400 bg-white dark:bg-slate-900'
                : 'border-transparent text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Sistem & Keselamatan
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
          {/* MACHINES TAB */}
          {activeTab === 'machines' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                    Senarai Mesin RC
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    Konfigurasi mesin aktif dan mod penyelenggaraan
                  </p>
                </div>

                {!showAddMachine && (
                  <button
                    type="button"
                    onClick={() => setShowAddMachine(true)}
                    className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                  >
                    <Plus className="w-4 h-4 stroke-[3]" />
                    <span>TAMBAH MESIN</span>
                  </button>
                )}
              </div>

              {/* Add Machine Form */}
              {showAddMachine && (
                <form
                  onSubmit={handleAddMachineSubmit}
                  className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 space-y-3 animate-in fade-in"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase text-blue-700 dark:text-blue-400">
                      Tambah Mesin Baru
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowAddMachine(false)}
                      className="text-xs text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white"
                    >
                      Batal
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold uppercase text-slate-600 dark:text-slate-300 mb-1">
                        Nama Mesin *
                      </label>
                      <input
                        type="text"
                        required
                        value={newMachineName}
                        onChange={(e) => setNewMachineName(e.target.value)}
                        placeholder="cth: Excavator 3 / Loader 1"
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold uppercase text-slate-600 dark:text-slate-300 mb-1">
                        Jenis Mesin
                      </label>
                      <select
                        value={newMachineType}
                        onChange={(e) => setNewMachineType(e.target.value as MachineType)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-xs"
                      >
                        <option value="excavator">Excavator 🚜</option>
                        <option value="bulldozer">Bulldozer 🚧</option>
                        <option value="dumptruck">Dump Truck 🚛</option>
                        <option value="loader">Wheel Loader 🚜</option>
                        <option value="crane">Crane 🏗️</option>
                        <option value="generic">Lain-lain 🎮</option>
                      </select>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-sm cursor-pointer"
                  >
                    SIMPAN MESIN
                  </button>
                </form>
              )}

              {/* Machine Items */}
              <div className="space-y-2">
                {machines.length === 0 ? (
                  <div className="p-8 text-center rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-700">
                    <p className="font-bold text-sm text-slate-700 dark:text-slate-300">
                      Tiada mesin didaftarkan.
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                      Klik "Tambah Mesin" untuk mendaftar mesin baru.
                    </p>
                  </div>
                ) : (
                  machines.map((m) => (
                    <div
                      key={m.id}
                      className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-900 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-lg">
                          {m.type === 'excavator'
                            ? '🚜'
                            : m.type === 'bulldozer'
                            ? '🚧'
                            : m.type === 'dumptruck'
                            ? '🚛'
                            : '🎮'}
                        </div>
                        <div>
                          <div className="font-extrabold text-sm text-slate-900 dark:text-white">
                            {m.name}
                          </div>
                          <div className="text-[11px] text-slate-600 dark:text-slate-300 capitalize">
                            {m.type} • Status: <span className="font-semibold">{m.status}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            playTapSound(settings.soundEnabled);
                            onToggleMachineMaintenance(m);
                          }}
                          className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
                            m.status === 'MAINTENANCE'
                              ? 'bg-amber-500/20 text-amber-800 dark:text-amber-300 border-amber-500/40'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700'
                          }`}
                          title="Tukar mod penyelenggaraan"
                        >
                          <Wrench className="w-3.5 h-3.5 inline mr-1" />
                          <span>{m.status === 'MAINTENANCE' ? 'Servis Aktif' : 'Servis'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            playTapSound(settings.soundEnabled);
                            onDeleteMachine(m.id);
                          }}
                          className="p-1.5 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
                          title="Padam Mesin"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* PACKAGES TAB */}
          {activeTab === 'packages' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                    Pakej Tempoh & Harga
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    Konfigurasi masa tunggangan dan kadar caj
                  </p>
                </div>

                {!showAddPkg && (
                  <button
                    type="button"
                    onClick={() => setShowAddPkg(true)}
                    className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                  >
                    <Plus className="w-4 h-4 stroke-[3]" />
                    <span>TAMBAH PAKEJ</span>
                  </button>
                )}
              </div>

              {/* Add Package Form */}
              {showAddPkg && (
                <form
                  onSubmit={handleAddPkgSubmit}
                  className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 space-y-3 animate-in fade-in"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase text-blue-700 dark:text-blue-400">
                      Tambah Pakej Baru
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowAddPkg(false)}
                      className="text-xs text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white"
                    >
                      Batal
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold uppercase text-slate-600 dark:text-slate-300 mb-1">
                        Nama Pakej *
                      </label>
                      <input
                        type="text"
                        required
                        value={newPkgName}
                        onChange={(e) => setNewPkgName(e.target.value)}
                        placeholder="cth: 45 MIN"
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold uppercase text-slate-600 dark:text-slate-300 mb-1">
                        Minit *
                      </label>
                      <input
                        type="number"
                        min="1"
                        required
                        value={newPkgDuration}
                        onChange={(e) => setNewPkgDuration(Number(e.target.value))}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold uppercase text-slate-600 dark:text-slate-300 mb-1">
                        Harga ({settings.currencySymbol}) *
                      </label>
                      <input
                        type="number"
                        min="0"
                        required
                        value={newPkgPrice}
                        onChange={(e) => setNewPkgPrice(Number(e.target.value))}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-xs"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-sm cursor-pointer"
                  >
                    SIMPAN PAKEJ
                  </button>
                </form>
              )}

              {/* Package Items */}
              <div className="space-y-2">
                {packages.length === 0 ? (
                  <div className="p-8 text-center rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-700">
                    <p className="font-bold text-sm text-slate-700 dark:text-slate-300">
                      Tiada pakej masa didaftarkan.
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                      Klik "Tambah Pakej" untuk mendaftar pakej baru.
                    </p>
                  </div>
                ) : (
                  packages.map((pkg) => (
                    <div
                      key={pkg.id}
                      className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-900 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 font-black text-xs flex items-center justify-center border border-blue-200 dark:border-blue-800/50">
                          {pkg.durationMinutes}m
                        </div>
                        <div>
                          <div className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                            <span>{pkg.name}</span>
                            {pkg.isPopular && (
                              <span className="bg-amber-500/20 text-amber-700 dark:text-amber-300 text-[10px] font-extrabold px-1.5 py-0.2 rounded-md">
                                Popular
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-600 dark:text-slate-300">
                            Tempoh: {pkg.durationMinutes} Minit • Harga: <strong>{settings.currencySymbol}{pkg.price}</strong>
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          playTapSound(settings.soundEnabled);
                          onDeletePackage(pkg.id);
                        }}
                        className="p-1.5 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
                        title="Padam Pakej"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* ALERTS TAB */}
          {activeTab === 'alerts' && (
            <div className="space-y-4">
              <div>
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                  Tetapan Amaran & Audio
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  Konfigurasi amaran masa hampir tamat dan buzzer penamat
                </p>
              </div>

              {/* Ending Soon Threshold */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-2">
                <label className="block text-xs font-bold uppercase text-slate-700 dark:text-slate-300">
                  Ambang Amaran 'Ending Soon' (Minit Sebelum Tamat)
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[60, 120, 180, 300].map((seconds) => {
                    const mins = seconds / 60;
                    const isSelected = settings.endingSoonThresholdSeconds === seconds;
                    return (
                      <button
                        key={seconds}
                        type="button"
                        onClick={() => {
                          playTapSound(settings.soundEnabled);
                          onUpdateSettings({ ...settings, endingSoonThresholdSeconds: seconds });
                        }}
                        className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                            : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700'
                        }`}
                      >
                        {mins} Minit
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Toggles */}
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <div>
                    <div className="font-bold text-xs text-slate-900 dark:text-white">
                      Bunyi Kesan & Audio Alarm
                    </div>
                    <div className="text-[11px] text-slate-600 dark:text-slate-300">
                      Mainkan bunyi beep dan siren masa tamat
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.soundEnabled}
                    onChange={(e) =>
                      onUpdateSettings({ ...settings, soundEnabled: e.target.checked })
                    }
                    className="w-5 h-5 rounded accent-blue-600 cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <div>
                    <div className="font-bold text-xs text-slate-900 dark:text-white">
                      Getaran (Vibration Feedback)
                    </div>
                    <div className="text-[11px] text-slate-600 dark:text-slate-300">
                      Getaran pada peranti mudah alih / tablet
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.vibrationEnabled}
                    onChange={(e) =>
                      onUpdateSettings({ ...settings, vibrationEnabled: e.target.checked })
                    }
                    className="w-5 h-5 rounded accent-blue-600 cursor-pointer"
                  />
                </div>
              </div>

              {/* Test Sound Buttons */}
              <div className="p-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <div>
                  <span className="font-bold text-xs text-slate-800 dark:text-slate-200 block">
                    Uji Bunyi Alarm
                  </span>
                  <span className="text-[11px] text-slate-600 dark:text-slate-300">
                    Pastikan kelantangan pembesar suara mencukupi
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => playEndingSoonSound(true)}
                    className="px-2.5 py-1.5 rounded-xl bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/30 text-xs font-bold cursor-pointer"
                  >
                    Uji Amaran
                  </button>
                  <button
                    type="button"
                    onClick={() => playTimeUpAlarm(true, false)}
                    className="px-2.5 py-1.5 rounded-xl bg-red-600 text-white text-xs font-bold shadow-sm cursor-pointer"
                  >
                    Uji Alarm Tamat
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* SYSTEM TAB */}
          {activeTab === 'system' && (
            <div className="space-y-4">
              <div>
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                  Tetapan Sistem & Keselamatan Admin
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  Nama perniagaan, Kod PIN Admin (5313) dan pengurusan data
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 dark:text-slate-300 mb-1">
                    Nama Pusat / Perniagaan
                  </label>
                  <input
                    type="text"
                    value={settings.businessName}
                    onChange={(e) => onUpdateSettings({ ...settings, businessName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-xs font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 dark:text-slate-300 mb-1">
                    Simbol Mata Wang
                  </label>
                  <input
                    type="text"
                    value={settings.currencySymbol}
                    onChange={(e) => onUpdateSettings({ ...settings, currencySymbol: e.target.value })}
                    className="w-24 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-xs font-semibold"
                  />
                </div>
              </div>

              {/* Admin PIN Configuration Box */}
              <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-xs text-slate-900 dark:text-white">
                      Kod PIN Admin (Semasa: {settings.adminPin || '5313'})
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      PIN ini digunakan untuk membuka mod admin bagi mengubah, menambah atau memadam data.
                    </p>
                  </div>
                </div>

                <form onSubmit={handleSavePin} className="flex items-center gap-2">
                  <input
                    type="text"
                    maxLength={6}
                    value={editingPin}
                    onChange={(e) => setEditingPin(e.target.value.replace(/\D/g, ''))}
                    placeholder="5313"
                    className="w-32 px-3 py-2 rounded-xl border border-amber-300 dark:border-amber-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono font-bold text-sm tracking-widest text-center"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-sm cursor-pointer"
                  >
                    Kemas Kini PIN
                  </button>
                  {pinSavedMessage && (
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <Check className="w-4 h-4" /> PIN Disimpan!
                    </span>
                  )}
                </form>
              </div>

              {/* SES 4.3 Data Integrity info & Factory Reset */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-white dark:bg-slate-900 p-1 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0 shadow-2xs overflow-hidden">
                    <img
                      src="https://raw.githubusercontent.com/syncrozz/syncrozz-assets/main/logo/RC%20Zone/android-chrome-192x192.png"
                      alt="RC Zone"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div>
                    <span className="font-extrabold text-xs text-slate-900 dark:text-white block">
                      RC Zone Control Board Manager
                    </span>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Standard Integriti Data (SES 4.3) • Simpanan tempatan selamat
                    </p>
                  </div>
                </div>

                {!showResetConfirm ? (
                  <button
                    type="button"
                    onClick={() => setShowResetConfirm(true)}
                    className="w-full py-2.5 px-3 rounded-xl border border-red-300 dark:border-red-900/60 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Set Semula Kepada Tetapan Asal (Factory Reset)</span>
                  </button>
                ) : (
                  <div className="p-3.5 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/80 space-y-2">
                    <span className="font-bold text-xs text-red-800 dark:text-red-200 block">
                      Adakah anda pasti untuk set semula data ke 4 mesin asal dan kosongkan transaksi?
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          onResetFactory();
                          setShowResetConfirm(false);
                          onClose();
                        }}
                        className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs cursor-pointer"
                      >
                        Ya, Set Semula
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowResetConfirm(false)}
                        className="px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold cursor-pointer"
                      >
                        Batal
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
