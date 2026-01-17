
import React from 'react';
import { Account } from '../types';

interface Props {
  accounts: Account[];
  selectedAccountId: string | null;
  onSelectAccount: (id: string | null) => void;
}

export const AccountSection: React.FC<Props> = ({ accounts, selectedAccountId, onSelectAccount }) => {
  return (
    <div className="flex overflow-x-auto gap-4 pb-6 mb-4 no-print snap-x md:grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 md:pb-0 md:mb-10 custom-scrollbar">
      {accounts.map(account => (
        <div 
          key={account.id} 
          onClick={() => onSelectAccount(selectedAccountId === account.id ? null : account.id)}
          className={`neu-card p-4 md:p-5 flex flex-col justify-between min-h-[110px] md:min-h-[130px] shrink-0 w-[160px] md:w-auto snap-center cursor-pointer transition-all duration-300 ${
            selectedAccountId === account.id ? 'ring-4 ring-blue-500 transform scale-105 z-10' : 'hover:translate-y-[-4px]'
          }`}
        >
          <div className="flex justify-between items-center mb-2">
            <span className="text-xl md:text-2xl">{account.icon}</span>
            <span className="text-[8px] md:text-[10px] font-bold text-secondary tracking-wider uppercase bg-white/10 px-2 py-1 rounded-lg">
              {account.type}
            </span>
          </div>
          <div>
            <h3 className="text-secondary font-medium text-[10px] md:text-xs truncate mb-1">{account.name}</h3>
            <p className="text-sm md:text-lg font-bold text-primary whitespace-nowrap">
              Rp {account.balance.toLocaleString('id-ID')}
            </p>
          </div>
          {selectedAccountId === account.id && (
            <div className="text-[8px] md:text-[9px] text-blue-500 font-bold mt-1 md:mt-2 uppercase tracking-tighter">Selected</div>
          )}
        </div>
      ))}
    </div>
  );
};
