
import React, { useState } from 'react';
import { Account } from '../types';
import { NeumorphicButton } from './NeumorphicButton';
import { CATEGORIES } from '../constants';

interface Props {
  selectedCount: number;
  accounts: Account[];
  onApply: (data: { category?: string; accountId?: string }) => void;
  onCancel: () => void;
}

export const BulkActionModal: React.FC<Props> = ({ selectedCount, accounts, onApply, onCancel }) => {
  const [targetCategory, setTargetCategory] = useState('');
  const [targetAccountId, setTargetAccountId] = useState('');

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="neu-card w-full max-w-md p-8 shadow-2xl vibrant-glow">
        <div className="mb-6">
          <h3 className="text-xl font-black text-primary">Bulk Edit</h3>
          <p className="text-xs text-secondary font-bold uppercase tracking-widest mt-1">
            Modifying {selectedCount} Transactions
          </p>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-[10px] font-black text-secondary uppercase tracking-widest mb-2 ml-1">Change Category</label>
            <select 
              value={targetCategory}
              onChange={(e) => setTargetCategory(e.target.value)}
              className="w-full neu-inset px-4 py-3 rounded-xl outline-none bg-transparent text-primary text-sm appearance-none cursor-pointer"
            >
              <option value="">No Change</option>
              {CATEGORIES.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-black text-secondary uppercase tracking-widest mb-2 ml-1">Move to Account</label>
            <select 
              value={targetAccountId}
              onChange={(e) => setTargetAccountId(e.target.value)}
              className="w-full neu-inset px-4 py-3 rounded-xl outline-none bg-transparent text-primary text-sm appearance-none cursor-pointer"
            >
              <option value="">No Change</option>
              {accounts.map(a => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </div>

          <div className="p-4 bg-yellow-500/10 rounded-2xl border border-yellow-500/20 text-[10px] text-yellow-600 dark:text-yellow-400 font-bold leading-relaxed">
            ⚠️ PERHATIAN: Perubahan ini bersifat permanen dan akan langsung mengupdate saldo akun terkait.
          </div>
        </div>

        <div className="flex gap-4 mt-8">
          <NeumorphicButton onClick={onCancel} className="flex-1 text-red-500">Cancel</NeumorphicButton>
          <NeumorphicButton 
            onClick={() => onApply({ category: targetCategory || undefined, accountId: targetAccountId || undefined })}
            className="flex-1 bg-blue-500 text-white"
          >
            Apply Changes
          </NeumorphicButton>
        </div>
      </div>
    </div>
  );
};
