import React from 'react';
import { Account } from '../types';
import { BankIcon } from './BankIcon';
import { getBankColor } from '../constants/bankIcons';

interface Props {
  accounts: Account[];
  selectedAccountId: string | null;
  onSelectAccount: (id: string | null) => void;
}

export const AccountSection: React.FC<Props> = ({ accounts, selectedAccountId, onSelectAccount }) => {
  // Calculate total balance
  const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);
  
  if (accounts.length === 0) {
    return (
      <div className="neu-card p-6 text-center no-print">
        <p className="text-secondary text-sm">Belum ada akun. Tambahkan via Telegram Bot.</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-3 no-print">
      {/* Total Balance Card - Mobile Only */}
      <div className="block md:hidden neu-card p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] text-secondary uppercase tracking-wider font-bold mb-1">Total Saldo</p>
            <p className="text-xl font-black text-primary">
              Rp {totalBalance.toLocaleString('id-ID')}
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
            <span className="text-2xl">💰</span>
          </div>
        </div>
      </div>

      {/* Grid on mobile - fixed overflow */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3 md:gap-4 w-full overflow-hidden">
        {accounts.map(account => {
          const isSelected = selectedAccountId === account.id;
          const accentColor = getBankColor(account.name);
          
          return (
            <button
              key={account.id}
              onClick={() => onSelectAccount(isSelected ? null : account.id)}
              className={`neu-card p-2 sm:p-3 md:p-4 text-left transition-all min-w-0 overflow-hidden ${
                isSelected 
                  ? 'ring-2 ring-offset-2 ring-offset-[var(--bg)]' 
                  : ''
              }`}
              style={{
                borderLeft: `3px solid ${accentColor}`,
                ...(isSelected && { 
                  '--tw-ring-color': accentColor 
                } as React.CSSProperties)
              }}
            >
              <div className="flex items-start justify-between mb-1.5 sm:mb-2 md:mb-3 gap-1">
                <BankIcon name={account.name} size="sm" />
                <span 
                  className="text-[6px] sm:text-[8px] md:text-[9px] font-bold uppercase tracking-wider px-1 py-0.5 rounded flex-shrink-0"
                  style={{ 
                    backgroundColor: `${accentColor}15`,
                    color: accentColor
                  }}
                >
                  {account.type === 'E-Wallet' ? 'E-W' : account.type === 'Bank' ? 'Bank' : account.type.slice(0,4)}
                </span>
              </div>
              <h3 className="text-secondary text-[8px] sm:text-[10px] md:text-xs font-medium truncate mb-0.5">
                {account.name}
              </h3>
              <p className="text-primary text-[10px] sm:text-xs md:text-base font-bold truncate">
                Rp {account.balance.toLocaleString('id-ID')}
              </p>
              {isSelected && (
                <div 
                  className="mt-1 sm:mt-1.5 md:mt-2 text-[6px] sm:text-[8px] md:text-[9px] font-bold uppercase flex items-center gap-1"
                  style={{ color: accentColor }}
                >
                  <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full animate-pulse" style={{ backgroundColor: accentColor }}></span>
                  Active
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
