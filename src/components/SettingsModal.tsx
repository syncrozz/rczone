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
  AlertTriangle
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center justify-center">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
                Tetapan Sistem & Mesin
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                Pengurusan armada RC, pakej harga dan amaran
              </p>
            </div>
          </div>
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

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-100/60 dark:bg-slate-950/40 px-4 pt-2 gap-2 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('machines')}
            className={`px-3.5 py-2 text-xs font-bold rounded-t-xl transition-all border-b-2 whitespace-nowrap ${
              activeTab === 'machines'
                ? 'border-amber-500 text-amber-500 bg-white dark:bg-slate-900'
                : 'border-transparent text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Mesin ({machines.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('packages')}
            className={`px-3.5 py-2 text-xs font-bold rounded-t-xl transition-all border-b-2 whitespace-nowrap ${
              activeTab === 'packages'
                ? 'border-amber-500 text-amber-500 bg-white dark:bg-slate-900'
                : 'border-transparent text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Pakej Masa ({packages.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('alerts')}
            className={`px-3.5 py-2 text-xs font-bold rounded-t-xl transition-all border-b-2 whitespace-nowrap ${
              activeTab === 'alerts'
                ? 'border-amber-500 text-amber-500 bg-white dark:bg-slate-900'
                : 'border-transparent text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Audio & Amaran
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('system')}
            className={`px-3.5 py-2 text-xs font-bold rounded-t-xl transition-all border-b-2 whitespace-nowrap ${
              activeTab === 'system'
                ? 'border-amber-500 text-amber-500 bg-white dark:bg-slate-900'
                : 'border-transparent text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Sistem
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
                    className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
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
                  className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase text-amber-800 dark:text-amber-300">
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
                    className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-sm"
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
                          className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition-colors ${
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
                          className="p-1.5 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
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
                    className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
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
                  className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase text-amber-800 dark:text-amber-300">
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
                        Tempoh (Minit) *
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
                    className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-sm"
                  >
                    SIMPAN PAKEJ
                  </button>
                </form>
              )}

              {/* Package list */}
              {packages.length === 0 ? (
                <div className="p-8 text-center rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-700">
                  <p className="font-bold text-sm text-slate-700 dark:text-slate-300">
                    Tiada pakej didaftarkan.
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                    Klik "Tambah Pakej" untuk mendaftar pilihan pakej masa dan harga.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {packages.map((pkg) => (
                    <div
                      key={pkg.id}
                      className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 flex items-center justify-between"
                    >
                      <div>
                        <div className="font-extrabold text-sm text-slate-900 dark:text-white">
                          {pkg.name}
                        </div>
                        <div className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                          {pkg.durationMinutes} minit • <span className="font-bold text-amber-800 dark:text-amber-300">{settings.currencySymbol}{pkg.price}</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          playTapSound(settings.soundEnabled);
                          onDeletePackage(pkg.id);
                        }}
                        className="p-1.5 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                        title="Padam Pakej"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
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
                        className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                          isSelected
                            ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-sm'
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
                    className="w-5 h-5 rounded accent-amber-500 cursor-pointer"
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
                    className="w-5 h-5 rounded accent-amber-500 cursor-pointer"
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
                    className="px-2.5 py-1.5 rounded-xl bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/30 text-xs font-bold"
                  >
                    Uji Amaran
                  </button>
                  <button
                    type="button"
                    onClick={() => playTimeUpAlarm(true, false)}
                    className="px-2.5 py-1.5 rounded-xl bg-red-600 text-white text-xs font-bold shadow-sm"
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
                  Tetapan Sistem & Identiti
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  Nama perniagaan dan pengurusan simpanan data tempatan
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

              {/* SES 4.3 Data Integrity info & Factory Reset */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
                <div className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800/40 text-xs text-slate-600 dark:text-slate-300 space-y-1">
                  <span className="font-bold block text-slate-800 dark:text-slate-200">
                    Standard Integriti Data (SES 4.3):
                  </span>
                  <p>
                    Data disimpan secara local pada peranti anda. Sesiapa memadam mesin atau rekod tidak akan di-populate semula secara paksa.
                  </p>
                </div>

                {!showResetConfirm ? (
                  <button
                    type="button"
                    onClick={() => setShowResetConfirm(true)}
                    className="w-full py-2.5 px-3 rounded-xl border border-red-300 dark:border-red-900/60 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
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
                        className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs"
                      >
                        Ya, Set Semula
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowResetConfirm(false)}
                        className="px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold"
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
