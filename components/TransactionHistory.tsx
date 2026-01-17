
import React, { useState, useMemo } from 'react';
import { Transaction, Account } from '../types';
import { NeumorphicButton } from './NeumorphicButton';
import { BulkActionModal } from './BulkActionModal';

interface Props {
  transactions: Transaction[];
  accounts: Account[];
  selectedAccountId: string | null;
  onUpdateTransactions: (ids: string[], updates: { category?: string; accountId?: string }) => void;
  onDeleteTransactions: (ids: string[]) => void;
}

export const TransactionHistory: React.FC<Props> = ({ 
  transactions, 
  accounts, 
  selectedAccountId, 
  onUpdateTransactions,
  onDeleteTransactions
}) => {
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showBulkModal, setShowBulkModal] = useState(false);

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const matchAccount = selectedAccountId ? t.accountId === selectedAccountId : true;
      const matchSearch = t.note.toLowerCase().includes(search.toLowerCase()) || 
                          t.category.toLowerCase().includes(search.toLowerCase());
      const transactionDate = new Date(t.date).toISOString().split('T')[0];
      const matchStart = startDate ? transactionDate >= startDate : true;
      const matchEnd = endDate ? transactionDate <= endDate : true;

      return matchAccount && matchSearch && matchStart && matchEnd;
    });
  }, [transactions, selectedAccountId, search, startDate, endDate]);

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const selectAll = () => {
    if (selectedIds.size === filteredTransactions.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredTransactions.map(t => t.id)));
    }
  };

  const handleBulkUpdateApply = (updates: { category?: string; accountId?: string }) => {
    onUpdateTransactions(Array.from(selectedIds), updates);
    setSelectedIds(new Set());
    setShowBulkModal(false);
  };

  const handleBulkDelete = () => {
    if (window.confirm(`Hapus ${selectedIds.size} transaksi terpilih?`)) {
      onDeleteTransactions(Array.from(selectedIds));
      setSelectedIds(new Set());
    }
  };

  return (
    <div className="neu-card p-4 md:p-8 relative">
      {/* Bulk Toolbar */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 glass-card p-4 rounded-full shadow-2xl vibrant-glow flex items-center gap-6 animate-in slide-in-from-bottom duration-500 no-print">
          <div className="flex flex-col pl-4">
             <span className="text-white font-black text-sm">{selectedIds.size} Selected</span>
             <span className="text-white/60 text-[8px] font-bold uppercase tracking-widest">Bulk Actions Mode</span>
          </div>
          <div className="flex gap-2 pr-2">
            <NeumorphicButton onClick={() => setShowBulkModal(true)} className="bg-blue-500 text-white !px-4 !py-2 text-[10px] rounded-full">EDIT CATEGORY/ACCOUNT</NeumorphicButton>
            <NeumorphicButton onClick={handleBulkDelete} className="bg-red-500 text-white !px-4 !py-2 text-[10px] rounded-full">DELETE ALL</NeumorphicButton>
            <NeumorphicButton onClick={() => setSelectedIds(new Set())} className="bg-white/10 text-white !px-4 !py-2 text-[10px] rounded-full">CANCEL</NeumorphicButton>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 no-print">
        <div>
          <h3 className="text-xl font-bold text-primary">
            {selectedAccountId ? `History: ${accounts.find(a => a.id === selectedAccountId)?.name}` : 'History Harian'}
          </h3>
          <p className="text-sm text-secondary">{filteredTransactions.length} Transaksi ditemukan</p>
        </div>
        <div className="flex flex-wrap gap-2">
           <NeumorphicButton onClick={selectAll} className="text-xs">
             {selectedIds.size === filteredTransactions.length ? 'Deselect All' : 'Select All'}
           </NeumorphicButton>
           <NeumorphicButton onClick={() => {setStartDate(''); setEndDate(''); setSearch(''); setSelectedIds(new Set());}} className="text-xs">Reset Filter</NeumorphicButton>
           <NeumorphicButton onClick={() => window.print()} className="bg-green-500/10 text-green-500 text-xs">📄 Report (PDF)</NeumorphicButton>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 no-print">
        <input 
          type="text" 
          placeholder="Cari catatan..."
          className="neu-inset px-4 py-3 rounded-xl outline-none bg-transparent text-primary placeholder:text-secondary"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <input 
          type="date" 
          className="neu-inset px-4 py-3 rounded-xl outline-none bg-transparent text-primary"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
        />
        <input 
          type="date" 
          className="neu-inset px-4 py-3 rounded-xl outline-none bg-transparent text-primary"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
        />
      </div>

      <div className="space-y-4">
        {filteredTransactions.length > 0 ? filteredTransactions.map(t => {
          const account = accounts.find(a => a.id === t.accountId);
          const isExpense = t.type === 'Expense';
          const isIncome = t.type === 'Income';
          const isSelected = selectedIds.has(t.id);
          
          return (
            <div 
              key={t.id} 
              className={`flex items-center gap-4 p-4 rounded-2xl transition-all duration-300 ${
                isSelected ? 'neu-inset' : 'neu-flat hover:translate-x-1'
              }`}
            >
              <input 
                type="checkbox" 
                checked={isSelected}
                onChange={() => toggleSelect(t.id)}
                className="custom-checkbox shrink-0"
              />
              <div className="flex-1 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl neu-button shadow-sm`}>
                    {isIncome ? '📈' : isExpense ? '📉' : '🔄'}
                  </div>
                  <div>
                    <h4 className="font-semibold text-primary text-sm md:text-base">{t.note || t.category}</h4>
                    <p className="text-[10px] md:text-xs text-secondary">{account?.name} • {t.category} • {new Date(t.date).toLocaleDateString('id-ID', {day: '2-digit', month: 'short', year: 'numeric'})}</p>
                  </div>
                </div>
                <div className={`font-black text-sm md:text-base ${isIncome ? 'text-green-500' : isExpense ? 'text-red-500' : 'text-blue-500'}`}>
                  {isIncome ? '+' : isExpense ? '-' : ''} Rp {t.amount.toLocaleString('id-ID')}
                </div>
              </div>
            </div>
          );
        }) : (
          <div className="text-center p-10 text-secondary italic">Tidak ada transaksi yang ditemukan.</div>
        )}
      </div>

      {showBulkModal && (
        <BulkActionModal 
          selectedCount={selectedIds.size}
          accounts={accounts}
          onCancel={() => setShowBulkModal(false)}
          onApply={handleBulkUpdateApply}
        />
      )}
    </div>
  );
};
