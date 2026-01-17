
import React, { useState } from 'react';
import { analyzeFinances } from '../services/geminiService';
import { Transaction, Account, Goal } from '../types';
import { NeumorphicButton } from './NeumorphicButton';

interface Props {
  transactions: Transaction[];
  accounts: Account[];
  goals: Goal[];
}

export const FinancialAnalysis: React.FC<Props> = ({ transactions, accounts, goals }) => {
  const [analysis, setAnalysis] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const triggerAnalysis = async () => {
    setLoading(true);
    const result = await analyzeFinances(transactions, accounts, goals);
    setAnalysis(result);
    setLoading(false);
  };

  return (
    <div className="neu-card p-6 md:p-10 mb-10 no-print border-t-8 border-purple-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-6">
        <div className="flex items-center gap-4">
           <div className="w-16 h-16 rounded-full bg-purple-500/10 flex items-center justify-center text-3xl animate-pulse">
             🧠
           </div>
           <div>
            <h3 className="text-2xl font-black text-primary">AI Strategy Center</h3>
            <p className="text-sm text-secondary">Analisa prediktif & optimasi budget v4.1</p>
          </div>
        </div>
        <NeumorphicButton 
          onClick={triggerAnalysis} 
          disabled={loading} 
          className={`w-full md:w-auto px-10 py-5 ${loading ? 'opacity-50' : 'bg-purple-500/10 text-purple-500'}`}
        >
          {loading ? 'Consulting Gemini 3...' : '✨ Jalankan Analisa Deep Reasoning'}
        </NeumorphicButton>
      </div>

      {analysis ? (
        <div className="neu-inset p-8 rounded-[30px] text-primary leading-relaxed whitespace-pre-wrap animate-in slide-in-from-top duration-700 text-sm md:text-base border border-purple-500/10 shadow-purple-500/5">
          {analysis}
          <div className="mt-8 pt-6 border-t border-gray-300/10 flex justify-between items-center text-[10px] font-black text-secondary uppercase tracking-widest">
            <span>Verified by Dompet v4.1 Core</span>
            <span>Accuracy: High (Gemini 3 Pro)</span>
          </div>
        </div>
      ) : (
        <div className="text-center py-20 neu-inset rounded-[30px]">
          <div className="text-4xl mb-4 opacity-20">📡</div>
          <p className="text-secondary font-bold max-w-xs mx-auto">
            Klik tombol di atas untuk memulai sesi konsultasi keuangan dengan AI Pro.
          </p>
        </div>
      )}
    </div>
  );
};
