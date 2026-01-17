
import React from 'react';
import { Goal } from '../types';

interface Props {
  goals: Goal[];
}

export const GoalsSection: React.FC<Props> = ({ goals }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
      {goals.map(goal => {
        const percentage = Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100));
        return (
          <div key={goal.id} className="neu-card p-6 relative overflow-hidden group">
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 neu-button rounded-2xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                {goal.icon}
              </div>
              <div className="text-right">
                <p className="text-[10px] text-secondary font-black uppercase tracking-widest">Progress</p>
                <p className="text-lg font-black text-primary">{percentage}%</p>
              </div>
            </div>
            
            <h4 className="text-primary font-bold text-lg mb-1">{goal.name}</h4>
            <p className="text-xs text-secondary mb-4">Target: Rp {goal.targetAmount.toLocaleString('id-ID')}</p>
            
            <div className="relative h-4 w-full neu-inset rounded-full overflow-hidden">
              <div 
                className="absolute top-0 left-0 h-full transition-all duration-1000 ease-out rounded-full shadow-[0_0_15px_rgba(0,0,0,0.1)]"
                style={{ 
                  width: `${percentage}%`, 
                  backgroundColor: goal.color,
                  boxShadow: `0 0 15px ${goal.color}44`
                }}
              />
            </div>
            
            <div className="flex justify-between mt-2 text-[10px] font-bold text-secondary uppercase tracking-tight">
              <span>Rp {goal.currentAmount.toLocaleString('id-ID')}</span>
              <span>Sisa: Rp {(goal.targetAmount - goal.currentAmount).toLocaleString('id-ID')}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
};
