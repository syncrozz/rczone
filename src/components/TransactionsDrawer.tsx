import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, 
  Receipt, 
  Trash2, 
  Download, 
  Search, 
  DollarSign, 
  Clock, 
  User, 
  Calendar,
  Zap,
  Edit2,
  Plus,
  Check,
  AlertCircle,
  CalendarDays,
  ChevronDown,
  RotateCcw,
} from 'lucide-react';
import { TransactionRecord, AppSettings, Machine } from '../types';
import { 
  formatClockTime, 
  formatDateFull, 
  formatDateShort, 
  formatDateHeading, 
  isToday, 
  isYesterday, 
  isWithinDays,
  getDateKey,
  isSameDay
} from '../utils/format';
import { AssetIcon } from './AssetIcon';
import { playTapSound } from '../utils/sound';

interface TransactionsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: TransactionRecord[];
  machines?: Machine[];
  settings: AppSettings;
  onClearTransactions: () => void;
  onUpdateTransaction?: (tx: TransactionRecord) => void;
  onDeleteTransaction?: (txId: string) => void;
  onAddTransaction?: (tx: TransactionRecord) => void;
  onRequireAdmin: (action?: () => void, title?: string, desc?: string) => void;
}

type DateFilterType = 'TODAY' | 'YESTERDAY' | '7DAYS' | 'ALL' | 'CUSTOM';

export const TransactionsDrawer: React.FC<TransactionsDrawerProps> = ({
  isOpen,
  onClose,
  transactions,
  machines = [],
  settings,
  onClearTransactions,
  onUpdateTransaction,
  onDeleteTransaction,
  onAddTransaction,
  onRequireAdmin,
}) => {
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState<DateFilterType>('TODAY');
  const [customDate, setCustomDate] = useState<string>(getDateKey(Date.now()));

  // Edit Transaction Modal State
  const [editingTx, setEditingTx] = useState<TransactionRecord | null>(null);
  const [editPrice, setEditPrice] = useState<number>(0);
  const [editCustomer, setEditCustomer] = useState<string>('');
  const [editNotes, setEditNotes] = useState<string>('');
  const [editStatus, setEditStatus] = useState<'COMPLETED' | 'CANCELLED' | 'EXTENDED'>('COMPLETED');
  const [editMachineName, setEditMachineName] = useState<string>('');

  // Add Manual Transaction Modal State
  const [manualModalOpen, setManualModalOpen] = useState(false);
  const [manualMachineName, setManualMachineName] = useState('');
  const [manualCustomer, setManualCustomer] = useState('Pelanggan Walk-in');
  const [manualPackageName, setManualPackageName] = useState('Manual Entry / Tunai');
  const [manualPrice, setManualPrice] = useState<number>(10);
  const [manualMinutes, setManualMinutes] = useState<number>(20);
  const [manualNotes, setManualNotes] = useState('Pelarasan tunai / Sesi manual');

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !editingTx && !manualModalOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, editingTx, manualModalOpen]);

  // Set default manual machine if available
  useEffect(() => {
    if (machines.length > 0 && !manualMachineName) {
      setManualMachineName(machines[0].name);
    }
  }, [machines, manualMachineName]);

  // 1. Filter by date
  const dateFilteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      const txTime = tx.createdAt || tx.startTime;
      if (dateFilter === 'TODAY') {
        return isToday(txTime);
      }
      if (dateFilter === 'YESTERDAY') {
        return isYesterday(txTime);
      }
      if (dateFilter === '7DAYS') {
        return isWithinDays(txTime, 7);
      }
      if (dateFilter === 'CUSTOM') {
        if (!customDate) return true;
        const txDateKey = getDateKey(txTime);
        return txDateKey === customDate;
      }
      return true; // 'ALL'
    });
  }, [transactions, dateFilter, customDate]);

  // 2. Filter by search query
  const filteredTransactions = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return dateFilteredTransactions;
    return dateFilteredTransactions.filter(
      (t) =>
        t.machineName.toLowerCase().includes(q) ||
        (t.customerName && t.customerName.toLowerCase().includes(q)) ||
        t.packageName.toLowerCase().includes(q) ||
        (t.notes && t.notes.toLowerCase().includes(q))
    );
  }, [dateFilteredTransactions, search]);

  // KPI calculations for currently filtered view
  const totalRevenue = useMemo(() => {
    return filteredTransactions.reduce(
      (acc, t) => acc + (t.status !== 'CANCELLED' ? t.price : 0),
      0
    );
  }, [filteredTransactions]);

  const completedCount = useMemo(() => {
    return filteredTransactions.filter((t) => t.status !== 'CANCELLED').length;
  }, [filteredTransactions]);

  const cancelledCount = useMemo(() => {
    return filteredTransactions.filter((t) => t.status === 'CANCELLED').length;
  }, [filteredTransactions]);

  if (!isOpen) return null;

  // Handle Export CSV
  const handleExportCSV = () => {
    playTapSound(settings.soundEnabled);
    if (filteredTransactions.length === 0) return;

    const headers = [
      'ID',
      'Mesin',
      'Pelanggan',
      'Pakej',
      'Tempoh (Minit)',
      'Harga (RM)',
      'Status',
      'Catatan',
      'Masa Mula',
      'Masa Tamat',
      'Tarikh Rekod',
    ];
    const rows = filteredTransactions.map((t) => [
      t.id,
      `"${t.machineName}"`,
      `"${t.customerName || 'Walk-in'}"`,
      `"${t.packageName}"`,
      t.durationMinutes,
      t.price,
      `"${t.status}"`,
      `"${t.notes || ''}"`,
      `"${formatDateFull(t.startTime)}"`,
      `"${formatDateFull(t.endTime)}"`,
      `"${formatDateShort(t.createdAt || t.startTime)}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    const dateLabel = dateFilter === 'CUSTOM' ? customDate : dateFilter.toLowerCase();
    link.setAttribute('download', `rc_fun_ride_transaksi_${dateLabel}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Clear all transactions confirmation
  const handleClearAll = () => {
    onRequireAdmin(
      () => {
        playTapSound(settings.soundEnabled);
        onClearTransactions();
      },
      'Kosongkan Semua Transaksi',
      'Pengesahan Admin diperlukan untuk memadam SEMUA rekod transaksi daripada pangkalan data.'
    );
  };

  // Open Edit Modal
  const handleOpenEdit = (tx: TransactionRecord) => {
    playTapSound(settings.soundEnabled);
    setEditingTx(tx);
    setEditPrice(tx.price);
    setEditCustomer(tx.customerName || '');
    setEditNotes(tx.notes || '');
    setEditStatus(tx.status || 'COMPLETED');
    setEditMachineName(tx.machineName);
  };

  // Save Edit Transaction
  const handleSaveEdit = () => {
    if (!editingTx) return;
    onRequireAdmin(
      () => {
        playTapSound(settings.soundEnabled);
        const updated: TransactionRecord = {
          ...editingTx,
          price: Number(editPrice) || 0,
          customerName: editCustomer.trim() || 'Walk-in',
          notes: editNotes.trim(),
          status: editStatus,
          machineName: editMachineName.trim() || editingTx.machineName,
        };
        onUpdateTransaction?.(updated);
        setEditingTx(null);
      },
      'Sahkan Kemas Kini Transaksi',
      'Pengesahan PIN Admin diperlukan untuk mengemas kini rekod transaksi supaya tally dengan tunai fizikal.'
    );
  };

  // Delete Individual Transaction
  const handleDeleteTx = (tx: TransactionRecord) => {
    onRequireAdmin(
      () => {
        playTapSound(settings.soundEnabled);
        onDeleteTransaction?.(tx.id);
      },
      'Padam Transaksi Ini',
      `Adakah anda pasti mahu memadam rekod "${tx.machineName} - RM${tx.price.toFixed(2)}" untuk selaraskan (tally) duit tunai diterima?`
    );
  };

  // Save Manual Transaction
  const handleSaveManualTx = () => {
    onRequireAdmin(
      () => {
        playTapSound(settings.soundEnabled);
        const now = Date.now();
        const newRecord: TransactionRecord = {
          id: `tx_manual_${now}_${Math.random().toString(36).substring(2, 6)}`,
          sessionId: `sess_manual_${now}`,
          machineId: `m_manual`,
          machineName: manualMachineName.trim() || 'Mesin Manual',
          packageName: manualPackageName.trim() || 'Manual',
          durationMinutes: Number(manualMinutes) || 0,
          price: Number(manualPrice) || 0,
          customerName: manualCustomer.trim() || 'Walk-in',
          startTime: now,
          endTime: now + (Number(manualMinutes) || 0) * 60 * 1000,
          status: 'COMPLETED',
          createdAt: now,
          notes: manualNotes.trim(),
        };
        onAddTransaction?.(newRecord);
        setManualModalOpen(false);
        // Reset manual form
        setManualNotes('Pelarasan tunai / Sesi manual');
        setManualCustomer('Pelanggan Walk-in');
      },
      'Tambah Transaksi Manual',
      'Pengesahan PIN Admin diperlukan untuk menambah rekod kutipan tunai manual.'
    );
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/80 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
      <div 
        className="w-full max-w-xl bg-[#101723] border-l border-slate-800 h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-200 font-mono text-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-[#0c121c]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  AUDIT & TRANSAKSI
                </span>
                <span className="text-[10px] font-mono font-bold text-slate-400">
                  ({filteredTransactions.length} rekod)
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-black text-white tracking-tight uppercase mt-0.5 font-chakra">
                Rekod & Penyelarasan Transaksi
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Add Manual Record */}
            <button
              type="button"
              onClick={() => {
                playTapSound(settings.soundEnabled);
                setManualModalOpen(true);
              }}
              className="px-2.5 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Tambah Transaksi Manual / Tally Tunai"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Laras Tunai</span>
            </button>

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

        {/* Date Filter Bar (Penapis Mengikut Hari) */}
        <div className="p-3 bg-[#0a0f18] border-b border-slate-800/80 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-black tracking-wider text-slate-400 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-amber-400" />
              <span>Paparan Mengikut Tarikh:</span>
            </span>
            {dateFilter === 'CUSTOM' && (
              <input
                type="date"
                value={customDate}
                onChange={(e) => setCustomDate(e.target.value)}
                className="px-2 py-0.5 bg-[#151f2e] border border-amber-500/40 rounded-lg text-[11px] text-white font-mono focus:outline-none focus:border-amber-400"
              />
            )}
          </div>

          <div className="grid grid-cols-5 gap-1.5">
            {[
              { key: 'TODAY' as const, label: 'Hari Ini' },
              { key: 'YESTERDAY' as const, label: 'Semalam' },
              { key: '7DAYS' as const, label: '7 Hari' },
              { key: 'CUSTOM' as const, label: 'Pilih Tarikh' },
              { key: 'ALL' as const, label: 'Semua' },
            ].map((tab) => {
              const active = dateFilter === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => {
                    playTapSound(settings.soundEnabled);
                    setDateFilter(tab.key);
                  }}
                  className={`py-1.5 px-1 rounded-xl text-[10px] sm:text-xs font-chakra font-black uppercase text-center transition-all cursor-pointer border ${
                    active
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-xs'
                      : 'bg-[#121927] text-slate-400 border-slate-800 hover:bg-[#182234] hover:text-slate-200'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Financial KPI Summary for Selected Date */}
        <div className="p-4 bg-[#0c121c] border-b border-slate-800 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                {dateFilter === 'TODAY' && `Kutipan Hari Ini (${formatDateShort(Date.now())})`}
                {dateFilter === 'YESTERDAY' && `Kutipan Semalam`}
                {dateFilter === '7DAYS' && `Kutipan 7 Hari Terakhir`}
                {dateFilter === 'CUSTOM' && `Kutipan Tarikh ${customDate}`}
                {dateFilter === 'ALL' && `Jumlah Keseluruhan (Semua Masa)`}
              </span>
            </div>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono">
                {settings.currencySymbol} {totalRevenue.toFixed(2)}
              </span>
              <span className="text-xs text-slate-400 font-mono">
                ({completedCount} sesi{cancelledCount > 0 ? `, ${cancelledCount} batal` : ''})
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportCSV}
              disabled={filteredTransactions.length === 0}
              className="px-3 py-1.5 rounded-xl bg-[#151f2e] hover:bg-[#1d2b40] border border-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 disabled:opacity-40 transition-colors cursor-pointer"
              title="Eksport rekod yang dipaparkan ke fail CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span>CSV</span>
            </button>
            <button
              type="button"
              onClick={handleClearAll}
              disabled={transactions.length === 0}
              className="p-2 rounded-xl border border-slate-800 text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 disabled:opacity-40 transition-colors cursor-pointer"
              title="Kosongkan Semua Rekod (Memerlukan PIN)"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="p-3 bg-[#101723] border-b border-slate-800">
          <div className="relative">
            <Search className="w-4 h-4 text-amber-400/80 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari mesin, nama pelanggan, pakej, atau catatan..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-700 bg-[#0c121c] text-white text-xs font-bold placeholder-slate-500 focus:border-amber-400 focus:outline-none"
            />
          </div>
        </div>

        {/* Transaction Records List */}
        <div className="p-4 overflow-y-auto flex-1 space-y-2.5">
          {filteredTransactions.length === 0 ? (
            <div className="py-12 px-4 text-center rounded-2xl bg-[#0c121c] border border-dashed border-slate-800 space-y-2">
              <Receipt className="w-10 h-10 text-slate-600 mx-auto" />
              <p className="text-xs font-bold text-slate-400">
                Tiada rekod transaksi dijumpai untuk paparan ini.
              </p>
              <p className="text-[11px] text-slate-500">
                {dateFilter === 'TODAY' 
                  ? 'Kutipan hari ini masih kosong atau belum dimulakan. Pilih "Semua" untuk melihat sejarah transaksi sebelum ini.' 
                  : 'Cuba tukar tarikh atau kata carian di atas.'}
              </p>
              {dateFilter !== 'ALL' && (
                <button
                  type="button"
                  onClick={() => setDateFilter('ALL')}
                  className="mt-2 px-3 py-1.5 rounded-xl bg-[#151f2e] text-amber-400 border border-amber-500/30 text-xs font-bold hover:bg-[#1a273b] cursor-pointer"
                >
                  Papar Semua Tarikh
                </button>
              )}
            </div>
          ) : (
            filteredTransactions.map((tx) => {
              const isCancelled = tx.status === 'CANCELLED';
              const isExtended = tx.status === 'EXTENDED';

              return (
                <div
                  key={tx.id}
                  className={`p-3.5 rounded-2xl bg-[#0c121c] border transition-all ${
                    isCancelled
                      ? 'border-rose-900/40 bg-rose-950/10'
                      : 'border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex justify-between items-start gap-2">
                    {/* Left: Machine & Customer Info */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-black text-sm text-white truncate">
                          {tx.machineName}
                        </span>
                        <span className="text-[10px] text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20 font-bold">
                          {tx.packageName}
                        </span>
                        {isCancelled && (
                          <span className="text-[9px] text-rose-400 bg-rose-500/20 px-1.5 py-0.5 rounded border border-rose-500/30 font-bold uppercase">
                            Dibatalkan
                          </span>
                        )}
                        {isExtended && (
                          <span className="text-[9px] text-indigo-400 bg-indigo-500/20 px-1.5 py-0.5 rounded border border-indigo-500/30 font-bold uppercase">
                            Dilanjutkan
                          </span>
                        )}
                      </div>

                      <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1.5 flex-wrap">
                        <span>
                          Pelanggan: <strong className="text-slate-200">{tx.customerName || 'Walk-in'}</strong>
                        </span>
                        <span>•</span>
                        <span>
                          {formatClockTime(tx.startTime)} - {formatClockTime(tx.endTime)}
                        </span>
                        <span>•</span>
                        <span className="text-slate-500">
                          {formatDateShort(tx.createdAt || tx.startTime)}
                        </span>
                      </div>

                      {tx.notes && (
                        <div className="mt-1.5 text-[11px] text-amber-300/90 bg-amber-500/10 border border-amber-500/20 rounded-lg px-2 py-1 inline-block">
                          <strong>Catatan:</strong> {tx.notes}
                        </div>
                      )}
                    </div>

                    {/* Right: Amount & Actions */}
                    <div className="text-right shrink-0 flex flex-col items-end gap-1.5">
                      <div
                        className={`text-base sm:text-lg font-black ${
                          isCancelled ? 'text-slate-500 line-through' : 'text-emerald-400'
                        }`}
                      >
                        +{settings.currencySymbol}
                        {tx.price.toFixed(2)}
                      </div>
                      <div className="text-[10px] text-slate-500 font-bold">
                        {tx.durationMinutes} min
                      </div>

                      {/* Admin Quick Action Buttons: Edit & Delete */}
                      <div className="flex items-center gap-1 mt-1">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(tx)}
                          className="p-1.5 rounded-lg bg-[#151f2e] hover:bg-amber-500/20 border border-slate-700 hover:border-amber-500/40 text-slate-300 hover:text-amber-300 transition-colors cursor-pointer"
                          title="Sunting Transaksi (Laras Tunai/Catatan)"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteTx(tx)}
                          className="p-1.5 rounded-lg bg-[#151f2e] hover:bg-rose-950/40 border border-slate-700 hover:border-rose-500/40 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                          title="Padam Transaksi (Tally Tunai)"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* MODAL 1: SUNTING TRANSAKSI (EDIT TRANSACTION) */}
        {editingTx && (
          <div className="fixed inset-0 z-60 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-[#121927] border border-slate-700 rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl space-y-4 font-mono text-slate-200 animate-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center">
                    <Edit2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-chakra font-black text-white uppercase">
                      Sunting Transaksi
                    </h3>
                    <p className="text-[10px] text-slate-400">
                      Laras harga atau maklumat untuk pastikan tally dengan duit laci
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingTx(null)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3">
                {/* 1. Price Adjustment */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">
                    Jumlah Bayaran / Tunai Diterima ({settings.currencySymbol}) *
                  </label>
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <span className="absolute left-3 top-2.5 text-xs text-emerald-400 font-bold">
                        {settings.currencySymbol}
                      </span>
                      <input
                        type="number"
                        step="0.50"
                        min="0"
                        value={editPrice}
                        onChange={(e) => setEditPrice(parseFloat(e.target.value) || 0)}
                        className="w-full pl-10 pr-3 py-2 bg-[#0c121c] border border-slate-700 rounded-xl text-white text-base font-black focus:border-emerald-400 focus:outline-none font-mono"
                      />
                    </div>
                    {/* Quick amount adjustment helpers */}
                    <button
                      type="button"
                      onClick={() => setEditPrice((prev) => Math.max(0, prev - 1))}
                      className="px-2.5 py-2 bg-[#1c2638] rounded-xl text-xs font-bold text-slate-300 hover:bg-slate-700 cursor-pointer"
                    >
                      -1
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditPrice((prev) => prev + 1)}
                      className="px-2.5 py-2 bg-[#1c2638] rounded-xl text-xs font-bold text-slate-300 hover:bg-slate-700 cursor-pointer"
                    >
                      +1
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditPrice(0)}
                      className="px-2.5 py-2 bg-rose-950/30 border border-rose-800/40 rounded-xl text-xs font-bold text-rose-300 hover:bg-rose-900/40 cursor-pointer"
                      title="Setkan Percuma RM0"
                    >
                      RM0
                    </button>
                  </div>
                </div>

                {/* 2. Customer Name */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">
                    Nama Pelanggan
                  </label>
                  <input
                    type="text"
                    value={editCustomer}
                    onChange={(e) => setEditCustomer(e.target.value)}
                    placeholder="Nama pelanggan..."
                    className="w-full px-3 py-2 bg-[#0c121c] border border-slate-700 rounded-xl text-white text-xs font-bold focus:border-amber-400 focus:outline-none"
                  />
                </div>

                {/* 3. Status */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">
                    Status Transaksi
                  </label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as any)}
                    className="w-full px-3 py-2 bg-[#0c121c] border border-slate-700 rounded-xl text-white text-xs font-bold focus:border-amber-400 focus:outline-none"
                  >
                    <option value="COMPLETED">COMPLETED (Kutipan Sah)</option>
                    <option value="CANCELLED">CANCELLED (Dibatalkan / Tidak Dikira)</option>
                    <option value="EXTENDED">EXTENDED (Lanjutan Masa)</option>
                  </select>
                </div>

                {/* 4. Notes / Reason for adjustment */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">
                    Catatan Pelarasan (Tally Tunai)
                  </label>
                  <input
                    type="text"
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    placeholder="Cth: Pelarasan duit tunai laci, diskaun keluarga, dsb."
                    className="w-full px-3 py-2 bg-[#0c121c] border border-slate-700 rounded-xl text-white text-xs font-bold focus:border-amber-400 focus:outline-none"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingTx(null)}
                  className="px-4 py-2 bg-[#1c2638] rounded-xl text-xs font-bold text-slate-300 hover:bg-slate-700 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleSaveEdit}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-xl text-xs font-bold text-white shadow-lg shadow-emerald-900/40 cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Simpan Perubahan</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL 2: TAMBAH TRANSAKSI MANUAL (MANUAL ENTRY / ADJUSTMENT) */}
        {manualModalOpen && (
          <div className="fixed inset-0 z-60 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-[#121927] border border-slate-700 rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl space-y-4 font-mono text-slate-200 animate-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center">
                    <Plus className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-chakra font-black text-white uppercase">
                      Laras / Tambah Transaksi
                    </h3>
                    <p className="text-[10px] text-slate-400">
                      Rekod bayaran tunai manual supaya tally dengan kutipan fizikal
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setManualModalOpen(false)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3">
                {/* 1. Mesin Terlibat */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">
                    Mesin / Unit RC
                  </label>
                  {machines.length > 0 ? (
                    <select
                      value={manualMachineName}
                      onChange={(e) => setManualMachineName(e.target.value)}
                      className="w-full px-3 py-2 bg-[#0c121c] border border-slate-700 rounded-xl text-white text-xs font-bold focus:border-amber-400 focus:outline-none"
                    >
                      {machines.map((m) => (
                        <option key={m.id} value={m.name}>
                          {m.name}
                        </option>
                      ))}
                      <option value="Mesin Manual (Lain-lain)">Mesin Manual (Lain-lain)</option>
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={manualMachineName}
                      onChange={(e) => setManualMachineName(e.target.value)}
                      placeholder="Cth: Excavator 1"
                      className="w-full px-3 py-2 bg-[#0c121c] border border-slate-700 rounded-xl text-white text-xs font-bold"
                    />
                  )}
                </div>

                {/* 2. Jumlah Bayaran */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">
                    Jumlah Duit Tunai ({settings.currencySymbol}) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-xs text-emerald-400 font-bold">
                      {settings.currencySymbol}
                    </span>
                    <input
                      type="number"
                      step="0.50"
                      min="0"
                      value={manualPrice}
                      onChange={(e) => setManualPrice(parseFloat(e.target.value) || 0)}
                      className="w-full pl-10 pr-3 py-2 bg-[#0c121c] border border-slate-700 rounded-xl text-white text-base font-black focus:border-emerald-400 focus:outline-none"
                    />
                  </div>
                </div>

                {/* 3. Pelanggan & Pakej */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">
                      Pelanggan
                    </label>
                    <input
                      type="text"
                      value={manualCustomer}
                      onChange={(e) => setManualCustomer(e.target.value)}
                      className="w-full px-3 py-2 bg-[#0c121c] border border-slate-700 rounded-xl text-white text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">
                      Pakej / Tempoh (Min)
                    </label>
                    <input
                      type="number"
                      value={manualMinutes}
                      onChange={(e) => setManualMinutes(parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 bg-[#0c121c] border border-slate-700 rounded-xl text-white text-xs font-bold"
                    />
                  </div>
                </div>

                {/* 4. Catatan */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">
                    Catatan Pelarasan
                  </label>
                  <input
                    type="text"
                    value={manualNotes}
                    onChange={(e) => setManualNotes(e.target.value)}
                    placeholder="Sebab pelarasan tunai..."
                    className="w-full px-3 py-2 bg-[#0c121c] border border-slate-700 rounded-xl text-white text-xs font-bold"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setManualModalOpen(false)}
                  className="px-4 py-2 bg-[#1c2638] rounded-xl text-xs font-bold text-slate-300 hover:bg-slate-700 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleSaveManualTx}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-xl text-xs font-bold text-white shadow-lg shadow-emerald-900/40 cursor-pointer flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tambah Rekod</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
