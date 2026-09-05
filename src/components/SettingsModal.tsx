import React, { useState, useEffect } from 'react';
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
  KeyRound,
  Zap,
  Download,
  Smartphone,
  CheckCircle2,
  Edit2,
  Tag,
  Boxes,
  Truck,
} from 'lucide-react';
import { Machine, RidePackage, AppSettings, MachineType, AssetType } from '../types';
import { resolveAssetType } from '../utils/storage';
import { AssetIcon, isImageUrl } from './AssetIcon';
import { playTapSound, playTimeUpAlarm, playEndingSoonSound } from '../utils/sound';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  machines: Machine[];
  assetTypes: AssetType[];
  packages: RidePackage[];
  settings: AppSettings;
  onUpdateSettings: (settings: AppSettings) => void;
  onAddMachine: (machine: Omit<Machine, 'id' | 'status'>) => void;
  onDeleteMachine: (id: string) => void;
  onToggleMachineMaintenance: (machine: Machine) => void;
  onAddAssetType: (assetType: Omit<AssetType, 'id'>) => void;
  onUpdateAssetType: (assetType: AssetType) => void;
  onToggleAssetTypeActive: (id: string) => void;
  onDeleteAssetType: (id: string) => void;
  onAddPackage: (pkg: Omit<RidePackage, 'id'>) => void;
  onDeletePackage: (id: string) => void;
  onResetFactory: () => void;
  isAdminMode: boolean;
  onLockAdmin: () => void;
}

const POPULAR_EMOJIS = [
  '🚜', '🚧', '🚛', '🏗️', '🎮', '🏎️', '🚚', '🛠️', 
  '⚙️', '🚤', '🚁', '⚡', '🛞', '🚒', '🚑', '🛻', 
  '🚂', '🤖', '🚗', '🛵', '🏁', '🛸', '🚜', '🛳️'
];

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  machines,
  assetTypes,
  packages,
  settings,
  onUpdateSettings,
  onAddMachine,
  onDeleteMachine,
  onToggleMachineMaintenance,
  onAddAssetType,
  onUpdateAssetType,
  onToggleAssetTypeActive,
  onDeleteAssetType,
  onAddPackage,
  onDeletePackage,
  onResetFactory,
  isAdminMode,
  onLockAdmin,
}) => {
  const [activeTab, setActiveTab] = useState<'machines' | 'assetTypes' | 'packages' | 'alerts' | 'system'>('machines');

  // New machine / asset state
  const [newMachineName, setNewMachineName] = useState('');
  const [selectedAssetTypeId, setSelectedAssetTypeId] = useState<string>('');
  const [showAddMachine, setShowAddMachine] = useState(false);

  // Dynamic Asset Type state
  const [showAddAssetType, setShowAddAssetType] = useState(false);
  const [newTypeName, setNewTypeName] = useState('');
  const [newTypeIcon, setNewTypeIcon] = useState('🚜');
  const [newTypeActive, setNewTypeActive] = useState(true);
  const [typeError, setTypeError] = useState('');

  // Editing existing Asset Type
  const [editingAssetType, setEditingAssetType] = useState<AssetType | null>(null);

  // New package state
  const [newPkgName, setNewPkgName] = useState('');
  const [newPkgDuration, setNewPkgDuration] = useState<number>(45);
  const [newPkgPrice, setNewPkgPrice] = useState<number>(20);
  const [showAddPkg, setShowAddPkg] = useState(false);

  // Factory reset confirm
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Admin PIN change state
  const [editingPin, setEditingPin] = useState(settings.adminPin || '6381');
  const [pinSavedMessage, setPinSavedMessage] = useState(false);

  // Auto-select first active asset type when opening Add Machine
  useEffect(() => {
    if (assetTypes && assetTypes.length > 0 && !selectedAssetTypeId) {
      const firstActive = assetTypes.find((t) => t.active) || assetTypes[0];
      if (firstActive) {
        setSelectedAssetTypeId(firstActive.id);
      }
    }
  }, [assetTypes, selectedAssetTypeId]);

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

  const handleAddMachineSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMachineName.trim() || !selectedAssetTypeId) return;

    playTapSound(settings.soundEnabled);
    const matchedType = assetTypes.find((t) => t.id === selectedAssetTypeId);

    onAddMachine({
      name: newMachineName.trim(),
      type: selectedAssetTypeId,
      typeId: selectedAssetTypeId,
      customTypeLabel: matchedType ? matchedType.name : undefined,
    });

    setNewMachineName('');
    setShowAddMachine(false);
  };

  const handleAddAssetTypeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = newTypeName.trim();
    if (!cleanName) return;

    // Check duplicate
    const isDuplicate = assetTypes.some(
      (t) => t.name.toLowerCase() === cleanName.toLowerCase()
    );
    if (isDuplicate) {
      setTypeError(`Jenis aset "${cleanName}" sudah wujud.`);
      return;
    }

    playTapSound(settings.soundEnabled);
    onAddAssetType({
      name: cleanName,
      icon: newTypeIcon.trim() || '🚜',
      active: newTypeActive,
    });

    setNewTypeName('');
    setNewTypeIcon('🚜');
    setNewTypeActive(true);
    setTypeError('');
    setShowAddAssetType(false);
  };

  const handleUpdateAssetTypeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAssetType || !editingAssetType.name.trim()) return;

    // Check duplicate with another asset type
    const isDuplicate = assetTypes.some(
      (t) =>
        t.id !== editingAssetType.id &&
        t.name.toLowerCase() === editingAssetType.name.trim().toLowerCase()
    );
    if (isDuplicate) {
      setTypeError(`Jenis aset "${editingAssetType.name.trim()}" sudah wujud.`);
      return;
    }

    playTapSound(settings.soundEnabled);
    onUpdateAssetType({
      ...editingAssetType,
      name: editingAssetType.name.trim(),
      icon: editingAssetType.icon.trim() || '🎮',
      updatedAt: Date.now(),
    });

    setEditingAssetType(null);
    setTypeError('');
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

  // Count active assets linked to an AssetType
  const getLinkedAssetCount = (typeId: string, typeName: string) => {
    return machines.filter(
      (m) =>
        m.typeId === typeId ||
        m.type.toLowerCase() === typeId.toLowerCase() ||
        m.type.toLowerCase() === typeName.toLowerCase()
    ).length;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="bg-[#101723] border border-slate-800 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150 font-mono"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-[#0c121c]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#151f2e] p-1 border border-amber-500/30 flex items-center justify-center overflow-hidden shrink-0 shadow-xs">
              <img
                src="https://raw.githubusercontent.com/syncrozz/syncrozz-assets/main/logo/RC%20Zone/android-chrome-192x192.png"
                alt="RC Zone"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-white tracking-tight uppercase">
                  Pengurusan Aset & Sistem
                </h2>
                {isAdminMode && (
                  <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/40">
                    <ShieldCheck className="w-3 h-3 text-amber-400" />
                    Admin Mode
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                Pengurusan fleksibel jenis mesin/aset, unit armada dan keselamatan
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isAdminMode && (
              <button
                type="button"
                onClick={() => {
                  playTapSound(settings.soundEnabled);
                  onLockAdmin();
                  onClose();
                }}
                className="px-3 py-1.5 rounded-xl border border-slate-700 bg-[#151f2e] hover:bg-[#1d2a3d] text-slate-300 text-xs font-black flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Kunci Mod Admin Semula"
              >
                <Lock className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">Kunci Admin</span>
              </button>
            )}
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
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 bg-[#0c121c] px-4 pt-2 gap-2 overflow-x-auto">
          <button
            type="button"
            onClick={() => {
              playTapSound(settings.soundEnabled);
              setActiveTab('machines');
            }}
            className={`px-3.5 py-2 text-xs font-black uppercase tracking-wider rounded-t-xl transition-all border-b-2 whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'machines'
                ? 'border-amber-400 text-amber-400 bg-[#101723]'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Truck className="w-3.5 h-3.5" />
            <span>Unit Aset ({machines.length})</span>
          </button>

          <button
            type="button"
            onClick={() => {
              playTapSound(settings.soundEnabled);
              setActiveTab('assetTypes');
            }}
            className={`px-3.5 py-2 text-xs font-black uppercase tracking-wider rounded-t-xl transition-all border-b-2 whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'assetTypes'
                ? 'border-amber-400 text-amber-400 bg-[#101723]'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Boxes className="w-3.5 h-3.5" />
            <span>Jenis Aset ({assetTypes.length})</span>
          </button>

          <button
            type="button"
            onClick={() => {
              playTapSound(settings.soundEnabled);
              setActiveTab('packages');
            }}
            className={`px-3.5 py-2 text-xs font-black uppercase tracking-wider rounded-t-xl transition-all border-b-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'packages'
                ? 'border-amber-400 text-amber-400 bg-[#101723]'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            Pakej Masa ({packages.length})
          </button>

          <button
            type="button"
            onClick={() => {
              playTapSound(settings.soundEnabled);
              setActiveTab('alerts');
            }}
            className={`px-3.5 py-2 text-xs font-black uppercase tracking-wider rounded-t-xl transition-all border-b-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'alerts'
                ? 'border-amber-400 text-amber-400 bg-[#101723]'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            Audio & Amaran
          </button>

          <button
            type="button"
            onClick={() => {
              playTapSound(settings.soundEnabled);
              setActiveTab('system');
            }}
            className={`px-3.5 py-2 text-xs font-black uppercase tracking-wider rounded-t-xl transition-all border-b-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'system'
                ? 'border-amber-400 text-amber-400 bg-[#101723]'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            Sistem & Keselamatan
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
          
          {/* 1. ASSET UNITS TAB */}
          {activeTab === 'machines' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-black text-sm text-white uppercase tracking-wider">
                    Senarai Unit Aset / Mesin
                  </h3>
                  <p className="text-xs text-slate-400">
                    Konfigurasi setiap unit fizikal dalam inventori RC Zone
                  </p>
                </div>

                {!showAddMachine && (
                  <button
                    type="button"
                    onClick={() => setShowAddMachine(true)}
                    className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
                  >
                    <Plus className="w-4 h-4 stroke-[3]" />
                    <span>TAMBAH ASET</span>
                  </button>
                )}
              </div>

              {/* Add Asset Unit Form */}
              {showAddMachine && (
                <form
                  onSubmit={handleAddMachineSubmit}
                  className="p-4 rounded-2xl bg-[#0c121c] border border-slate-800 space-y-3 animate-in fade-in"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase text-amber-400">
                      Tambah Unit Aset Baru
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowAddMachine(false)}
                      className="text-xs text-slate-400 hover:text-white"
                    >
                      Batal
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">
                        Nama Unit Aset *
                      </label>
                      <input
                        type="text"
                        required
                        value={newMachineName}
                        onChange={(e) => setNewMachineName(e.target.value)}
                        placeholder="cth: Forklift 1 / Bulldozer Pro"
                        className="w-full px-3 py-2 rounded-xl border border-slate-700 bg-[#151f2e] text-white text-xs font-bold focus:border-amber-400 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">
                        Jenis / Kategori Aset *
                      </label>
                      <select
                        value={selectedAssetTypeId}
                        onChange={(e) => setSelectedAssetTypeId(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-700 bg-[#151f2e] text-white text-xs font-bold focus:border-amber-400 focus:outline-none"
                      >
                        {assetTypes
                          .filter((t) => t.active)
                          .map((t) => (
                            <option key={t.id} value={t.id}>
                              {isImageUrl(t.icon) ? t.name : `${t.icon} ${t.name}`}
                            </option>
                          ))}
                      </select>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    SIMPAN UNIT ASET
                  </button>
                </form>
              )}

              {/* Machine Items List */}
              <div className="space-y-2">
                {machines.length === 0 ? (
                  <div className="py-8 text-center bg-[#0c121c] border border-dashed border-slate-800 rounded-2xl">
                    <p className="text-xs text-slate-400 font-bold">
                      Tiada unit aset berdaftar. Sila klik "Tambah Aset" di atas.
                    </p>
                  </div>
                ) : (
                  machines.map((m) => {
                    const resolved = resolveAssetType(m.type || m.typeId, assetTypes);
                    return (
                      <div
                        key={m.id}
                        className="p-3.5 rounded-2xl border border-slate-800 bg-[#0c121c] flex items-center justify-between gap-3 hover:border-slate-700 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-xl bg-[#151f2e] border border-slate-700 flex items-center justify-center shrink-0 p-1">
                            <AssetIcon icon={resolved.icon} name={m.name || resolved.name} size="md" className="w-6 h-6" />
                          </div>
                          <div className="min-w-0">
                            <div className="font-black text-sm text-white truncate">
                              {m.name}
                            </div>
                            <div className="text-[10px] text-slate-400 uppercase truncate">
                              Status:{' '}
                              <span
                                className={`font-bold ${
                                  m.status === 'READY'
                                    ? 'text-emerald-400'
                                    : m.status === 'MAINTENANCE'
                                    ? 'text-rose-400'
                                    : 'text-amber-400'
                                }`}
                              >
                                {m.status}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              playTapSound(settings.soundEnabled);
                              onToggleMachineMaintenance(m);
                            }}
                            className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase border transition-colors cursor-pointer ${
                              m.status === 'MAINTENANCE'
                                ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                                : 'bg-[#151f2e] text-slate-300 border-slate-700 hover:border-amber-500/40'
                            }`}
                            title="Tukar mod penyelenggaraan"
                          >
                            <Wrench className="w-3.5 h-3.5 inline mr-1" />
                            <span className="hidden sm:inline">
                              {m.status === 'MAINTENANCE' ? 'Servis Aktif' : 'Servis'}
                            </span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              playTapSound(settings.soundEnabled);
                              onDeleteMachine(m.id);
                            }}
                            className="p-2 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 transition-colors cursor-pointer"
                            title="Padam Unit Aset"
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
          )}

          {/* 2. DYNAMIC ASSET TYPES TAB */}
          {activeTab === 'assetTypes' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-black text-sm text-white uppercase tracking-wider">
                    Pengurusan Jenis Aset (Asset Types)
                  </h3>
                  <p className="text-xs text-slate-400">
                    Tambah jenis aset baharu (contoh: Forklift, Backhoe, RC Boat) tanpa ubah kod
                  </p>
                </div>

                {!showAddAssetType && !editingAssetType && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddAssetType(true);
                      setTypeError('');
                    }}
                    className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
                  >
                    <Plus className="w-4 h-4 stroke-[3]" />
                    <span>TAMBAH JENIS ASET</span>
                  </button>
                )}
              </div>

              {/* Add Asset Type Form */}
              {showAddAssetType && (
                <form
                  onSubmit={handleAddAssetTypeSubmit}
                  className="p-4 rounded-2xl bg-[#0c121c] border border-amber-500/40 space-y-3 animate-in fade-in"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase text-amber-400 flex items-center gap-1.5">
                      <Tag className="w-4 h-4" />
                      Daftar Jenis Aset Baru
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddAssetType(false);
                        setTypeError('');
                      }}
                      className="text-xs text-slate-400 hover:text-white"
                    >
                      Batal
                    </button>
                  </div>

                  {typeError && (
                    <div className="p-2.5 rounded-xl bg-rose-950/50 border border-rose-500/40 text-rose-300 text-xs font-bold">
                      {typeError}
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">
                        Nama Jenis Aset *
                      </label>
                      <input
                        type="text"
                        required
                        value={newTypeName}
                        onChange={(e) => {
                          setNewTypeName(e.target.value);
                          setTypeError('');
                        }}
                        placeholder="cth: Forklift / Backhoe / RC Boat"
                        className="w-full px-3 py-2 rounded-xl border border-slate-700 bg-[#151f2e] text-white text-xs font-bold focus:border-amber-400 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">
                        Ikon Emoji *
                      </label>
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-xl bg-[#151f2e] border border-slate-700 flex items-center justify-center shrink-0 p-1">
                          <AssetIcon icon={newTypeIcon || '🎮'} name={newTypeName} size="md" className="w-6 h-6" />
                        </div>
                        <input
                          type="text"
                          required
                          value={newTypeIcon}
                          onChange={(e) => setNewTypeIcon(e.target.value)}
                          placeholder="cth: 🚜"
                          className="w-full px-3 py-2 rounded-xl border border-slate-700 bg-[#151f2e] text-white text-xs font-bold focus:border-amber-400 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Popular Emoji Palette */}
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">
                      Pilihan Pantas Emoji:
                    </label>
                    <div className="flex flex-wrap gap-1.5 p-2 rounded-xl bg-[#151f2e] border border-slate-800">
                      {POPULAR_EMOJIS.map((emoji, index) => (
                        <button
                          key={`${emoji}-${index}`}
                          type="button"
                          onClick={() => setNewTypeIcon(emoji)}
                          className={`w-8 h-8 rounded-lg text-lg flex items-center justify-center hover:bg-slate-700 transition-colors cursor-pointer ${
                            newTypeIcon === emoji ? 'bg-amber-500/30 border border-amber-400' : ''
                          }`}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newTypeActive}
                        onChange={(e) => setNewTypeActive(e.target.checked)}
                        className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                      />
                      <span className="text-xs font-bold text-slate-300">
                        Status Aktif (Tersedia untuk pendaftaran unit)
                      </span>
                    </label>

                    <button
                      type="submit"
                      className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider transition-colors cursor-pointer"
                    >
                      SIMPAN JENIS ASET
                    </button>
                  </div>
                </form>
              )}

              {/* Edit Asset Type Modal/Form */}
              {editingAssetType && (
                <form
                  onSubmit={handleUpdateAssetTypeSubmit}
                  className="p-4 rounded-2xl bg-[#0c121c] border border-cyan-500/40 space-y-3 animate-in fade-in"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase text-cyan-400 flex items-center gap-1.5">
                      <Edit2 className="w-4 h-4" />
                      Sunting Jenis Aset ({editingAssetType.name})
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingAssetType(null);
                        setTypeError('');
                      }}
                      className="text-xs text-slate-400 hover:text-white"
                    >
                      Batal
                    </button>
                  </div>

                  {typeError && (
                    <div className="p-2.5 rounded-xl bg-rose-950/50 border border-rose-500/40 text-rose-300 text-xs font-bold">
                      {typeError}
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">
                        Nama Jenis Aset *
                      </label>
                      <input
                        type="text"
                        required
                        value={editingAssetType.name}
                        onChange={(e) =>
                          setEditingAssetType({ ...editingAssetType, name: e.target.value })
                        }
                        className="w-full px-3 py-2 rounded-xl border border-slate-700 bg-[#151f2e] text-white text-xs font-bold focus:border-cyan-400 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">
                        Ikon Emoji *
                      </label>
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-xl bg-[#151f2e] border border-slate-700 flex items-center justify-center shrink-0 p-1">
                          <AssetIcon icon={editingAssetType.icon || '🎮'} name={editingAssetType.name} size="md" className="w-6 h-6" />
                        </div>
                        <input
                          type="text"
                          required
                          value={editingAssetType.icon}
                          onChange={(e) =>
                            setEditingAssetType({ ...editingAssetType, icon: e.target.value })
                          }
                          className="w-full px-3 py-2 rounded-xl border border-slate-700 bg-[#151f2e] text-white text-xs font-bold focus:border-cyan-400 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Popular Emoji Palette */}
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">
                      Pilihan Pantas Emoji:
                    </label>
                    <div className="flex flex-wrap gap-1.5 p-2 rounded-xl bg-[#151f2e] border border-slate-800">
                      {POPULAR_EMOJIS.map((emoji, index) => (
                        <button
                          key={`edit-${emoji}-${index}`}
                          type="button"
                          onClick={() =>
                            setEditingAssetType({ ...editingAssetType, icon: emoji })
                          }
                          className={`w-8 h-8 rounded-lg text-lg flex items-center justify-center hover:bg-slate-700 transition-colors cursor-pointer ${
                            editingAssetType.icon === emoji ? 'bg-cyan-500/30 border border-cyan-400' : ''
                          }`}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editingAssetType.active}
                        onChange={(e) =>
                          setEditingAssetType({ ...editingAssetType, active: e.target.checked })
                        }
                        className="w-4 h-4 accent-cyan-500 rounded cursor-pointer"
                      />
                      <span className="text-xs font-bold text-slate-300">
                        Status Aktif
                      </span>
                    </label>

                    <button
                      type="submit"
                      className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs uppercase tracking-wider transition-colors cursor-pointer"
                    >
                      KEMASKINI JENIS ASET
                    </button>
                  </div>
                </form>
              )}

              {/* Asset Types List */}
              <div className="space-y-2">
                {assetTypes.map((type) => {
                  const linkedUnitsCount = getLinkedAssetCount(type.id, type.name);
                  return (
                    <div
                      key={type.id}
                      className={`p-3.5 rounded-2xl border bg-[#0c121c] flex items-center justify-between gap-3 transition-colors ${
                        type.active
                          ? 'border-slate-800 hover:border-slate-700'
                          : 'border-slate-850 opacity-60'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-11 h-11 rounded-xl bg-[#151f2e] border border-slate-700 flex items-center justify-center shrink-0 p-1.5">
                          <AssetIcon icon={type.icon} name={type.name} size="lg" className="w-7 h-7" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-black text-sm text-white truncate">
                              {type.name}
                            </span>
                            <span
                              className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border ${
                                type.active
                                  ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40'
                                  : 'bg-slate-800 text-slate-400 border-slate-700'
                              }`}
                            >
                              {type.active ? 'AKTIF' : 'TIDAK AKTIF'}
                            </span>
                          </div>
                          <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                            ID: <span className="text-amber-400">{type.id}</span> &bull;{' '}
                            <span className="text-slate-300 font-bold">
                              {linkedUnitsCount} Unit Aset Terpaut
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {/* Toggle Active Button */}
                        <button
                          type="button"
                          onClick={() => {
                            playTapSound(settings.soundEnabled);
                            onToggleAssetTypeActive(type.id);
                          }}
                          className={`px-2.5 py-1.5 rounded-xl text-xs font-black uppercase border transition-colors cursor-pointer ${
                            type.active
                              ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20'
                              : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                          }`}
                          title={type.active ? 'Nyahaktifkan Jenis' : 'Aktifkan Jenis'}
                        >
                          {type.active ? 'Aktif' : 'Nyahaktif'}
                        </button>

                        {/* Edit Button */}
                        <button
                          type="button"
                          onClick={() => {
                            playTapSound(settings.soundEnabled);
                            setEditingAssetType(type);
                            setShowAddAssetType(false);
                          }}
                          className="p-2 rounded-xl text-slate-400 hover:text-cyan-300 hover:bg-[#151f2e] border border-transparent hover:border-slate-700 transition-colors cursor-pointer"
                          title="Sunting Jenis Aset"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        {/* Delete Button (Allowed if 0 linked assets) */}
                        {linkedUnitsCount === 0 && (
                          <button
                            type="button"
                            onClick={() => {
                              playTapSound(settings.soundEnabled);
                              onDeleteAssetType(type.id);
                            }}
                            className="p-2 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 transition-colors cursor-pointer"
                            title="Padam Jenis Aset"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 3. PACKAGES TAB */}
          {activeTab === 'packages' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-black text-sm text-white uppercase tracking-wider">
                    Pakej Tempoh & Harga
                  </h3>
                  <p className="text-xs text-slate-400">
                    Konfigurasi masa tunggangan dan kadar caj
                  </p>
                </div>

                {!showAddPkg && (
                  <button
                    type="button"
                    onClick={() => setShowAddPkg(true)}
                    className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
                  >
                    <Plus className="w-4 h-4 stroke-[3]" />
                    <span>TAMBAH PAKEJ</span>
                  </button>
                )}
              </div>

              {/* AUTOMATIC GRACE PERIOD / MASA BERTENANG CARD */}
              <div className="p-4 rounded-2xl bg-[#0c121c] border border-emerald-500/40 space-y-3 shadow-lg shadow-emerald-950/20">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-emerald-950/80 border border-emerald-500/50 flex items-center justify-center text-emerald-400 shrink-0">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black uppercase text-emerald-400 tracking-wide">
                          Masa Bertenang Automatik (Bonus Time)
                        </span>
                        <span className="text-[9px] font-mono font-black uppercase px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-500/40">
                          {settings.bufferMinutes ?? 3} Minit Ekstra
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Masa tambahan automatik diberi kepada setiap sesi supaya pelanggan sempat duduk dan ambil kedudukan tanpa rasa rugi masa.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 pt-1 border-t border-slate-800">
                  <div className="flex justify-between items-center font-mono">
                    <span className="text-xs text-slate-300 font-bold">
                      Nilai Tambahan Masa:
                    </span>
                    <span className="text-xs font-black text-emerald-300 bg-[#151f2e] px-2.5 py-1 rounded-lg border border-emerald-500/30">
                      +{(settings.bufferMinutes ?? 3)} Minit (Automatik)
                    </span>
                  </div>

                  {/* Preset quick buttons */}
                  <div className="grid grid-cols-5 gap-1.5">
                    {[0, 2, 3, 5, 10].map((mins) => {
                      const isActive = (settings.bufferMinutes ?? 3) === mins;
                      return (
                        <button
                          key={`buf-${mins}`}
                          type="button"
                          onClick={() => {
                            playTapSound(settings.soundEnabled);
                            onUpdateSettings({
                              ...settings,
                              bufferMinutes: mins,
                            });
                          }}
                          className={`py-1.5 px-1 rounded-xl text-xs font-mono font-black uppercase tracking-wider transition-all cursor-pointer border ${
                            isActive
                              ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md shadow-emerald-500/20'
                              : 'bg-[#151f2e] text-slate-300 border-slate-700 hover:bg-[#1f2e44] hover:text-white'
                          }`}
                        >
                          {mins === 0 ? 'Tiada (0m)' : `+${mins} Minit`}
                        </button>
                      );
                    })}
                  </div>

                  {/* Simulation summary */}
                  <div className="p-2.5 rounded-xl bg-[#151f2e]/80 border border-slate-800 flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-400">
                      Contoh (Pakej 20 Minit @ RM10):
                    </span>
                    <span className="text-emerald-400 font-bold">
                      Dikira {20 + (settings.bufferMinutes ?? 3)} Minit Penuh
                    </span>
                  </div>
                </div>
              </div>

              {/* Add Package Form */}
              {showAddPkg && (
                <form
                  onSubmit={handleAddPkgSubmit}
                  className="p-4 rounded-2xl bg-[#0c121c] border border-slate-800 space-y-3 animate-in fade-in"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase text-amber-400">
                      Tambah Pakej Baru
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowAddPkg(false)}
                      className="text-xs text-slate-400 hover:text-white"
                    >
                      Batal
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">
                        Nama Pakej *
                      </label>
                      <input
                        type="text"
                        required
                        value={newPkgName}
                        onChange={(e) => setNewPkgName(e.target.value)}
                        placeholder="cth: 45 MIN / VIP 1 JAM"
                        className="w-full px-3 py-2 rounded-xl border border-slate-700 bg-[#151f2e] text-white text-xs font-bold focus:border-amber-400 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">
                        Tempoh (Minit) *
                      </label>
                      <input
                        type="number"
                        required
                        min="1"
                        value={newPkgDuration}
                        onChange={(e) => setNewPkgDuration(parseInt(e.target.value, 10) || 0)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-700 bg-[#151f2e] text-white text-xs font-bold focus:border-amber-400 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">
                        Harga ({settings.currencySymbol}) *
                      </label>
                      <input
                        type="number"
                        required
                        min="0"
                        step="1"
                        value={newPkgPrice}
                        onChange={(e) => setNewPkgPrice(parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-700 bg-[#151f2e] text-white text-xs font-bold focus:border-amber-400 focus:outline-none"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    SIMPAN PAKEJ
                  </button>
                </form>
              )}

              {/* Package Items */}
              <div className="space-y-2">
                {packages.map((pkg) => (
                  <div
                    key={pkg.id}
                    className="p-3.5 rounded-2xl border border-slate-800 bg-[#0c121c] flex items-center justify-between gap-3 hover:border-slate-700 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-black text-sm">
                        {pkg.durationMinutes}m
                      </div>
                      <div>
                        <div className="font-black text-sm text-white">
                          {pkg.name}
                        </div>
                        <div className="text-[10px] text-amber-400 font-bold">
                          {settings.currencySymbol} {pkg.price.toFixed(2)} &bull; {pkg.durationMinutes} Minit
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        playTapSound(settings.soundEnabled);
                        onDeletePackage(pkg.id);
                      }}
                      className="p-2 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 transition-colors cursor-pointer"
                      title="Padam Pakej"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 4. AUDIO & ALERTS TAB */}
          {activeTab === 'alerts' && (
            <div className="space-y-4">
              <div>
                <h3 className="font-black text-sm text-white uppercase tracking-wider">
                  Konfigurasi Audio & Penggera
                </h3>
                <p className="text-xs text-slate-400">
                  Tetapan bunyi siren, amaran awal dan getaran
                </p>
              </div>

              <div className="space-y-3">
                {/* Master Sound Switch */}
                <div className="p-4 rounded-2xl bg-[#0c121c] border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Volume2 className="w-5 h-5 text-amber-400" />
                    <div>
                      <div className="text-xs font-black uppercase text-white">
                        Sistem Audio & Bunyi
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Dayakan kesan bunyi butang, mula sesi & siren
                      </div>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.soundEnabled}
                      onChange={(e) =>
                        onUpdateSettings({ ...settings, soundEnabled: e.target.checked })
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                  </label>
                </div>

                {/* Alarm Repeat Mode */}
                <div className="p-4 rounded-2xl bg-[#0c121c] border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <BellRing className="w-5 h-5 text-rose-400" />
                    <div>
                      <div className="text-xs font-black uppercase text-white">
                        Ulang Siren TIME UP Berterusan
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Penggera akan berbunyi berterusan sehingga butang tamat ditekan
                      </div>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.alarmRepeat}
                      onChange={(e) =>
                        onUpdateSettings({ ...settings, alarmRepeat: e.target.checked })
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                  </label>
                </div>

                {/* Ending Soon Threshold */}
                <div className="p-4 rounded-2xl bg-[#0c121c] border border-slate-800 space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="text-xs font-black uppercase text-white">
                      Ambang Amaran Awal (Ending Soon)
                    </div>
                    <span className="text-xs font-black text-amber-400 font-mono">
                      {Math.floor(settings.endingSoonThresholdSeconds / 60)} Minit (
                      {settings.endingSoonThresholdSeconds}s)
                    </span>
                  </div>
                  <input
                    type="range"
                    min="60"
                    max="600"
                    step="60"
                    value={settings.endingSoonThresholdSeconds}
                    onChange={(e) =>
                      onUpdateSettings({
                        ...settings,
                        endingSoonThresholdSeconds: parseInt(e.target.value, 10),
                      })
                    }
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                    <span>1 MIN</span>
                    <span>5 MIN (Standard)</span>
                    <span>10 MIN</span>
                  </div>
                </div>

                {/* Test Sound Buttons */}
                <div className="p-4 rounded-2xl bg-[#0c121c] border border-slate-800 space-y-2">
                  <div className="text-xs font-black uppercase text-white">
                    Uji Audio Siren
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => playEndingSoonSound(true)}
                      className="py-2 px-3 rounded-xl bg-[#151f2e] hover:bg-[#1d2a3d] border border-slate-700 text-slate-200 text-xs font-bold transition-colors cursor-pointer"
                    >
                      🔔 Uji Amaran Awal
                    </button>
                    <button
                      type="button"
                      onClick={() => playTimeUpAlarm(true)}
                      className="py-2 px-3 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 border border-rose-500/40 text-rose-300 text-xs font-bold transition-colors cursor-pointer"
                    >
                      🚨 Uji Siren Time Up
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 5. SYSTEM & SECURITY TAB */}
          {activeTab === 'system' && (
            <div className="space-y-4">
              <div>
                <h3 className="font-black text-sm text-white uppercase tracking-wider">
                  Sistem & Keselamatan Operasi
                </h3>
                <p className="text-xs text-slate-400">
                  Konfigurasi nama perniagaan, PIN keselamatan dan sandaran
                </p>
              </div>

              <div className="space-y-3">
                {/* Business Info Form */}
                <div className="p-4 rounded-2xl bg-[#0c121c] border border-slate-800 space-y-3">
                  <div className="text-xs font-black uppercase text-white flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-400" />
                    <span>Maklumat Perniagaan</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">
                        Nama Perniagaan
                      </label>
                      <input
                        type="text"
                        value={settings.businessName}
                        onChange={(e) =>
                          onUpdateSettings({ ...settings, businessName: e.target.value })
                        }
                        className="w-full px-3 py-2 rounded-xl border border-slate-700 bg-[#151f2e] text-white text-xs font-bold focus:border-amber-400 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">
                        Simbol Mata Wang
                      </label>
                      <input
                        type="text"
                        value={settings.currencySymbol}
                        onChange={(e) =>
                          onUpdateSettings({ ...settings, currencySymbol: e.target.value })
                        }
                        className="w-full px-3 py-2 rounded-xl border border-slate-700 bg-[#151f2e] text-white text-xs font-bold focus:border-amber-400 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Admin PIN Change */}
                <form
                  onSubmit={handleSavePin}
                  className="p-4 rounded-2xl bg-[#0c121c] border border-slate-800 space-y-3"
                >
                  <div className="text-xs font-black uppercase text-white flex items-center gap-2">
                    <KeyRound className="w-4 h-4 text-amber-400" />
                    <span>Tukar PIN Keselamatan Admin</span>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="password"
                      maxLength={8}
                      value={editingPin}
                      onChange={(e) => setEditingPin(e.target.value)}
                      placeholder="Masukkan PIN 4-digit baharu"
                      className="flex-1 px-3 py-2 rounded-xl border border-slate-700 bg-[#151f2e] text-white text-xs font-bold tracking-widest focus:border-amber-400 focus:outline-none"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider transition-colors cursor-pointer"
                    >
                      KEMASKINI PIN
                    </button>
                  </div>
                  {pinSavedMessage && (
                    <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-bold animate-in fade-in">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>PIN Admin berjaya dikemaskini!</span>
                    </div>
                  )}
                </form>

                {/* Factory Reset */}
                <div className="p-4 rounded-2xl bg-rose-950/20 border border-rose-500/30 space-y-2">
                  <div className="flex items-center gap-2 text-rose-400 text-xs font-black uppercase">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Tetapan Semula Kilang (Reset Data)</span>
                  </div>
                  <p className="text-[10px] text-slate-400">
                    Memadam semua mesin kustom, pakej, sesi aktif dan rekod transaksi. Gunakan dengan berhati-hati.
                  </p>
                  {!showResetConfirm ? (
                    <button
                      type="button"
                      onClick={() => setShowResetConfirm(true)}
                      className="px-4 py-2 rounded-xl bg-rose-950/60 hover:bg-rose-900 border border-rose-500/50 text-rose-300 font-black text-xs uppercase tracking-wider transition-colors cursor-pointer"
                    >
                      RESET KE TETAPAN ASAL
                    </button>
                  ) : (
                    <div className="p-3 rounded-xl bg-rose-950 border border-rose-500 space-y-2">
                      <p className="text-xs font-bold text-white">
                        Adakah anda pasti? Tindakan ini tidak boleh dibatalkan.
                      </p>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            onResetFactory();
                            setShowResetConfirm(false);
                            onClose();
                          }}
                          className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-black text-xs uppercase cursor-pointer"
                        >
                          YA, PADAM SEMUA DATA
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowResetConfirm(false)}
                          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs uppercase cursor-pointer"
                        >
                          Batal
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-[#0c121c] flex justify-between items-center text-xs text-slate-500">
          <span>RC Zone SES V4.3 Motorsport Engine</span>
          <button
            type="button"
            onClick={() => {
              playTapSound(settings.soundEnabled);
              onClose();
            }}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-black text-xs uppercase tracking-wider transition-colors cursor-pointer"
          >
            TUTUP
          </button>
        </div>
      </div>
    </div>
  );
};
