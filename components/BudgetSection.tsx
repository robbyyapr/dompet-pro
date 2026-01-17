
import React from 'react';
import { Budget } from '../types';

interface Props {
  budgets: Budget[];
}

export const BudgetSection: React.FC<Props> = ({ budgets }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
      {budgets.map(budget => {
        const percentage = Math.min(100, Math.round((budget.spent / budget.limit) * 100));
        const isNearLimit = percentage > 85;
        const isOver = percentage >= 100;

        return (
          <div key={budget.category} className="neu-card p-6 border-l-4" style={{ borderColor: isOver ? '#ef4444' : isNearLimit ? '#f59e0b' : '#3b82f6' }}>
            <div className="flex justify-between items-start mb-4">
              <div>
                <h4 className="text-primary font-bold text-lg">{budget.category}</h4>
                <p className="text-[10px] text-secondary font-black uppercase tracking-widest mt-1">Monthly Budget</p>
              </div>
              <div className="text-right">
                <span className={`text-[10px] font-black px-2 py-1 rounded-lg uppercase ${
                  isOver ? 'bg-red-500/10 text-red-500' : isNearLimit ? 'bg-orange-500/10 text-orange-500' : 'bg-blue-500/10 text-blue-500'
                }`}>
                  {isOver ? 'Limit Exceeded' : isNearLimit ? 'Warning' : 'Healthy'}
                </span>
              </div>
            </div>

            <div className="flex justify-between mb-2 text-xs font-bold text-primary">
              <span>Rp {budget.spent.toLocaleString('id-ID')}</span>
              <span className="text-secondary">Limit: Rp {budget.limit.toLocaleString('id-ID')}</span>
            </div>

            <div className="h-2 w-full neu-inset rounded-full overflow-hidden">
               <div 
                className={`h-full transition-all duration-700 ${isOver ? 'bg-red-500' : isNearLimit ? 'bg-orange-500' : 'bg-blue-500'}`}
                style={{ width: `${percentage}%` }}
               />
            </div>
            
            <div className="mt-4 flex justify-between items-center">
               <p className="text-[10px] text-secondary font-medium italic">Sisa Anggaran: Rp {(budget.limit - budget.spent).toLocaleString('id-ID')}</p>
               <span className="text-lg font-black text-primary">{percentage}%</span>
            </div>
          </div>
        );
      })}
    </div>
  );
};
