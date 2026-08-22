import React, { useState } from 'react';
import { X, Receipt, DollarSign, Calendar, Trash2, Download, Filter, Search, CheckCircle2 } from 'lucide-react';
import { TransactionRecord, AppSettings } from '../types';
import { formatClockTime } from '../utils/format';
import { playTapSound } from '../utils/sound';

interface TransactionsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: TransactionRecord[];
  settings: AppSettings;
  onClearTransactions: () => void;
}

export const TransactionsDrawer: React.FC<TransactionsDrawerProps> = ({
  isOpen,
  onClose,
  transactions,
  settings,
  onClearTransactions,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showClearConfirm, setShowClearConfirm] = useState(false);

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

  // Filter transactions
  const filtered = transactions.filter((t) => {
    const matchesSearch =
      t.machineName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.packageName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.customerName && t.customerName.toLowerCase().includes(searchQuery.toLowerCase()));

    if (filterStatus === 'all') return matchesSearch;
    return matchesSearch && t.status === filterStatus;
  });

  const totalRevenue = transactions
    .filter((t) => t.status === 'COMPLETED' || t.status === 'EXTENDED')
    .reduce((sum, t) => sum + t.price, 0);

  const completedCount = transactions.filter((t) => t.status === 'COMPLETED' || t.status === 'EXTENDED').length;

  const handleExportCSV = () => {
    playTapSound(settings.soundEnabled);
    if (transactions.length === 0) return;

    const headers = ['ID', 'Mesin', 'Pakej', 'Minit', 'Harga (RM)', 'Pelanggan', 'Masa Mula', 'Masa Tamat', 'Status'];
    const rows = transactions.map((t) => [
      t.id,
      t.machineName,
      t.packageName,
      t.durationMinutes,
      t.price,
      t.customerName || 'Walk-in',
      new Date(t.startTime).toLocaleTimeString(),
      new Date(t.endTime).toLocaleTimeString(),
      t.status,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.map((val) => `"${val}"`).join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `rc_transactions_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 w-full max-w-lg h-full shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-250"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center border border-emerald-500/20">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
                Rekod Transaksi Sesi
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                Log aktiviti dan jualan tunggangan RC
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

        {/* Total Summary Cards */}
        <div className="p-4 bg-slate-100/70 dark:bg-slate-950/40 border-b border-slate-200 dark:border-slate-800 grid grid-cols-2 gap-3">
          <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase block">
              Jumlah Sesi Selesai
            </span>
            <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
              {completedCount} <span className="text-xs font-semibold text-slate-400">sesi</span>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase block">
              Jumlah Kutipan
            </span>
            <div className="text-2xl font-black text-emerald-800 dark:text-emerald-300 mt-1">
              {settings.currencySymbol}{totalRevenue}
            </div>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="p-3 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari mesin / pelanggan..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {transactions.length > 0 && (
            <button
              type="button"
              onClick={handleExportCSV}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs flex items-center gap-1 border border-slate-300 dark:border-slate-700 transition-colors"
              title="Eksport ke CSV"
            >
              <Download className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Transactions List */}
        <div className="p-4 space-y-2.5 overflow-y-auto flex-1">
          {filtered.length === 0 ? (
            <div className="py-12 px-4 text-center rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-700">
              <Receipt className="w-10 h-10 text-slate-400 mx-auto mb-2 opacity-50" />
              <p className="font-bold text-sm text-slate-700 dark:text-slate-300">
                Tiada Rekod Transaksi
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                {transactions.length === 0
                  ? 'Rekod akan muncul secara automatik apabila sesuatu sesi ditamatkan.'
                  : 'Tiada hasil padanan untuk carian ini.'}
              </p>
            </div>
          ) : (
            filtered.map((record) => (
              <div
                key={record.id}
                className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-900 shadow-xs flex items-center justify-between gap-2.5"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                      {record.machineName}
                    </span>
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold border border-slate-200 dark:border-slate-700">
                      {record.packageName}
                    </span>
                  </div>
                  <div className="text-xs text-slate-600 dark:text-slate-300 mt-1 flex items-center gap-2">
                    <span>Pelanggan: <strong className="text-slate-700 dark:text-slate-300">{record.customerName || 'Walk-in'}</strong></span>
                    <span>•</span>
                    <span>{formatClockTime(record.startTime)} - {formatClockTime(record.endTime)}</span>
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-black text-base text-emerald-800 dark:text-emerald-300">
                    +{settings.currencySymbol}{record.price}
                  </div>
                  <div className="text-[10px] text-emerald-700 dark:text-emerald-300 font-semibold flex items-center justify-end gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Selesai</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer actions */}
        {transactions.length > 0 && (
          <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex items-center justify-between">
            {!showClearConfirm ? (
              <button
                type="button"
                onClick={() => setShowClearConfirm(true)}
                className="text-xs text-red-700 dark:text-red-300 hover:underline flex items-center gap-1 font-semibold"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Padam Semua Rekod</span>
              </button>
            ) : (
              <div className="flex items-center gap-2 w-full justify-between">
                <span className="text-xs text-red-700 dark:text-red-300 font-bold">
                  Sahkan padam?
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      playTapSound(settings.soundEnabled);
                      onClearTransactions();
                      setShowClearConfirm(false);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold text-xs"
                  >
                    Ya, Padam
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowClearConfirm(false)}
                    className="px-2.5 py-1 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold"
                  >
                    Batal
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
