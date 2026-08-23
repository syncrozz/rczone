import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { TransactionRecord, AppSettings } from '../types';
import { formatClockTime, formatDateFull } from '../utils/format';
import { playTapSound } from '../utils/sound';

interface TransactionsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: TransactionRecord[];
  settings: AppSettings;
  onClearTransactions: () => void;
  onRequireAdmin: (action?: () => void, title?: string, desc?: string) => void;
}

export const TransactionsDrawer: React.FC<TransactionsDrawerProps> = ({
  isOpen,
  onClose,
  transactions,
  settings,
  onClearTransactions,
  onRequireAdmin,
}) => {
  const [search, setSearch] = useState('');

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

  const totalRevenue = transactions.reduce((acc, t) => acc + t.price, 0);

  const filteredTransactions = transactions.filter(
    (t) =>
      t.machineName.toLowerCase().includes(search.toLowerCase()) ||
      t.customerName.toLowerCase().includes(search.toLowerCase()) ||
      t.packageName.toLowerCase().includes(search.toLowerCase())
  );

  const handleExportCSV = () => {
    playTapSound(settings.soundEnabled);
    if (transactions.length === 0) return;

    const headers = ['ID', 'Mesin', 'Pelanggan', 'Pakej', 'Tempoh (Minit)', 'Harga (RM)', 'Masa Mula', 'Masa Tamat'];
    const rows = transactions.map((t) => [
      t.id,
      `"${t.machineName}"`,
      `"${t.customerName}"`,
      `"${t.packageName}"`,
      t.durationMinutes,
      t.price,
      `"${formatDateFull(t.startTime)}"`,
      `"${formatDateFull(t.endTime)}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `rc_fun_ride_transaksi_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleClear = () => {
    onRequireAdmin(
      () => {
        playTapSound(settings.soundEnabled);
        onClearTransactions();
      },
      'Padam Rekod Transaksi',
      'Pengesahan Admin diperlukan untuk mengosongkan semua rekod transaksi hari ini.'
    );
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/80 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
      <div 
        className="w-full max-w-lg bg-[#101723] border-l border-slate-800 h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-200 font-mono"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-[#0c121c]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                AUDIT LOGS
              </span>
              <h2 className="text-base sm:text-lg font-black text-white tracking-tight uppercase mt-0.5">
                Rekod Transaksi ({transactions.length})
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

        {/* Total Summary KPI */}
        <div className="p-4 bg-[#0c121c] border-b border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
              Jumlah Kutipan Sesi
            </span>
            <span className="text-2xl font-black text-emerald-400">
              {settings.currencySymbol} {totalRevenue.toFixed(2)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportCSV}
              disabled={transactions.length === 0}
              className="px-3 py-1.5 rounded-xl bg-[#151f2e] hover:bg-[#1d2b40] border border-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 disabled:opacity-40 transition-colors cursor-pointer"
              title="Eksport ke CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span>CSV</span>
            </button>
            <button
              type="button"
              onClick={handleClear}
              disabled={transactions.length === 0}
              className="p-2 rounded-xl border border-slate-800 text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 disabled:opacity-40 transition-colors cursor-pointer"
              title="Kosongkan Rekod"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="p-3 bg-[#101723] border-b border-slate-800">
          <div className="relative">
            <Search className="w-4 h-4 text-amber-400/80 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari transaksi / nama pelanggan..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-700 bg-[#0c121c] text-white text-xs font-bold placeholder-slate-500 focus:border-amber-400 focus:outline-none"
            />
          </div>
        </div>

        {/* Transaction Records List */}
        <div className="p-4 overflow-y-auto flex-1 space-y-2.5">
          {filteredTransactions.length === 0 ? (
            <div className="py-12 px-4 text-center rounded-2xl bg-[#0c121c] border border-dashed border-slate-800">
              <Receipt className="w-10 h-10 text-slate-600 mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-400">
                Tiada rekod transaksi dijumpai
              </p>
            </div>
          ) : (
            filteredTransactions.map((tx) => (
              <div
                key={tx.id}
                className="p-3.5 rounded-2xl bg-[#0c121c] border border-slate-800 hover:border-slate-700 transition-colors flex justify-between items-center"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-black text-sm text-white">{tx.machineName}</span>
                    <span className="text-[10px] text-amber-400 bg-amber-500/10 px-1.5 py-0.2 rounded border border-amber-500/20 font-bold">
                      {tx.packageName}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    Pelanggan: <strong className="text-slate-200">{tx.customerName}</strong> • {formatClockTime(tx.startTime)} - {formatClockTime(tx.endTime)}
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-base font-black text-emerald-400">
                    +{settings.currencySymbol}{tx.price}
                  </div>
                  <div className="text-[10px] text-slate-500 font-bold">
                    {tx.durationMinutes} min
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
