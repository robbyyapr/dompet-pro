
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { AccountSection } from './components/AccountSection';
import { ChartsSection } from './components/ChartsSection';
import { TransactionHistory } from './components/TransactionHistory';
import { TelegramSimulation } from './components/TelegramSimulation';
import { FinancialAnalysis } from './components/FinancialAnalysis';
import { GoalsSection } from './components/GoalsSection';
import { BudgetSection } from './components/BudgetSection';
import { SystemHub } from './components/SystemHub';
import { PrivacyPolicy } from './components/PrivacyPolicy';
import { AuthLock } from './components/AuthLock';
import { INITIAL_ACCOUNTS, INITIAL_TRANSACTIONS, INITIAL_GOALS, INITIAL_BUDGETS } from './constants';
import { Account, Transaction, AppState, Goal, Budget, SystemLog } from './types';
import { ParsedCommand } from './services/geminiService';

const App: React.FC = () => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark' || 
           (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });

  const [state, setState] = useState<AppState>({
    accounts: INITIAL_ACCOUNTS,
    transactions: INITIAL_TRANSACTIONS,
    goals: INITIAL_GOALS,
    budgets: INITIAL_BUDGETS,
    logs: [],
    isLocked: true,
    otpCode: null
  });

  const [activeTab, setActiveTab] = useState<'dashboard' | 'history' | 'goals' | 'budget' | 'analysis' | 'system'>('dashboard');
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [showPrivacy, setShowPrivacy] = useState(false);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const addLog = useCallback((type: SystemLog['type'], message: string, status: SystemLog['status'] = 'SUCCESS', latency?: number) => {
    const newLog: SystemLog = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
      type,
      message,
      status,
      latency
    };
    setState(prev => ({ ...prev, logs: [...prev.logs, newLog] }));
  }, []);

  const handleBulkUpdate = useCallback((ids: string[], updates: { category?: string; accountId?: string }) => {
    setState(prev => {
      const { transactions, accounts } = prev;
      const newTransactions = transactions.map(t => {
        if (ids.includes(t.id)) {
          return { ...t, ...updates };
        }
        return t;
      });
      addLog('SYSTEM', `Bulk updated ${ids.length} transactions`, 'SUCCESS');
      return { ...prev, transactions: newTransactions };
    });
  }, [addLog]);

  const handleBulkDelete = useCallback((ids: string[]) => {
    setState(prev => {
      const filtered = prev.transactions.filter(t => !ids.includes(t.id));
      addLog('SECURITY', `Deleted ${ids.length} transactions permanently`, 'WARNING');
      return { ...prev, transactions: filtered };
    });
  }, [addLog]);

  const addTransaction = useCallback((cmd: ParsedCommand) => {
    const startTime = Date.now();
    setState(prev => {
      const { accounts, transactions, budgets } = prev;
      const accountIndex = accounts.findIndex(a => 
        a.name.toLowerCase().includes(cmd.accountName.toLowerCase())
      );

      if (accountIndex === -1) {
        addLog('AI_PARSE', `Account "${cmd.accountName}" not found`, 'ERROR');
        return prev;
      }

      const newAccounts = [...accounts];
      const targetAccount = newAccounts[accountIndex];
      
      const newTransaction: Transaction = {
        id: Math.random().toString(36).substr(2, 9),
        accountId: targetAccount.id,
        amount: cmd.amount,
        type: cmd.type,
        category: cmd.category,
        date: new Date().toISOString(),
        note: cmd.note
      };

      const newBudgets = budgets.map(b => {
        if (b.category.toLowerCase() === cmd.category.toLowerCase() && cmd.type === 'Expense') {
            return { ...b, spent: b.spent + cmd.amount };
        }
        return b;
      });

      if (cmd.type === 'Expense') targetAccount.balance -= cmd.amount;
      else if (cmd.type === 'Income') targetAccount.balance += cmd.amount;
      else if (cmd.type === 'Transfer' && cmd.toAccountName) {
        const toAccIndex = accounts.findIndex(a => a.name.toLowerCase().includes(cmd.toAccountName!.toLowerCase()));
        if (toAccIndex !== -1) {
            targetAccount.balance -= cmd.amount;
            newAccounts[toAccIndex].balance += cmd.amount;
        }
      }

      addLog('AI_PARSE', `Processed ${cmd.type} for ${cmd.amount}`, 'SUCCESS', Date.now() - startTime);
      return {
        ...prev,
        accounts: newAccounts,
        transactions: [newTransaction, ...transactions],
        budgets: newBudgets
      };
    });
  }, [addLog]);

  const totalBalance = useMemo(() => state.accounts.reduce((acc, curr) => acc + curr.balance, 0), [state.accounts]);

  const handleUnlock = () => {
    addLog('SECURITY', 'PIN access authorized', 'SUCCESS');
    setState(prev => ({ ...prev, isLocked: false }));
  };
  
  const handleLock = () => setState(prev => ({ ...prev, isLocked: true }));

  if (state.isLocked) {
    return <AuthLock onUnlock={handleUnlock} />;
  }

  const filteredTransactions = selectedAccountId 
    ? state.transactions.filter(t => t.accountId === selectedAccountId)
    : state.transactions;

  return (
    <div className={`min-h-screen p-4 md:p-8 lg:px-20 lg:py-12 print:p-0 transition-colors duration-400`}>
      {/* v3.6 Header */}
      <header className="flex justify-between items-center mb-10 no-print">
        <div className="relative">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-black text-primary tracking-tight">Dompet</h1>
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[9px] font-black px-2 py-0.5 rounded-full shadow-lg vibrant-glow">PRO v3.6</span>
          </div>
          <p className="text-secondary font-medium italic text-sm">Next-Gen Wealth Management</p>
        </div>
        <div className="flex items-center space-x-3 md:space-x-4">
          <div className="hidden md:flex flex-col text-right mr-4">
             <span className="text-[10px] font-black text-secondary uppercase tracking-widest">Global Assets</span>
             <span className="text-xl font-black text-blue-500 drop-shadow-sm">Rp {totalBalance.toLocaleString('id-ID')}</span>
          </div>
          <button onClick={() => setIsDarkMode(!isDarkMode)} className="neu-button w-12 h-12 rounded-2xl flex items-center justify-center text-xl">
            {isDarkMode ? '☀️' : '🌙'}
          </button>
          <button onClick={handleLock} className="neu-button w-12 h-12 rounded-2xl flex items-center justify-center text-xl">
            🔒
          </button>
          <div className="w-12 h-12 neu-card rounded-full overflow-hidden border-2 border-white/50 shadow-lg cursor-pointer hover:scale-110 hover:shadow-2xl transition-all">
            <img src="https://picsum.photos/seed/finance_v36/100" alt="Avatar" />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto">
        <div className="no-print">
          <AccountSection accounts={state.accounts} selectedAccountId={selectedAccountId} onSelectAccount={setSelectedAccountId} />
        </div>
        
        <TelegramSimulation onAddTransaction={addTransaction} />

        {/* Tab Navigation */}
        <div className="flex space-x-2 md:space-x-4 mb-8 overflow-x-auto pb-4 no-print scrollbar-hide">
          {(['dashboard', 'budget', 'goals', 'history', 'analysis', 'system'] as const).map(tab => (
            <button 
              key={tab}
              onClick={() => setActiveTab(tab)} 
              className={`px-5 py-3 rounded-2xl font-black transition-all whitespace-nowrap text-[11px] uppercase tracking-wider ${
                activeTab === tab ? 'neu-inset text-blue-500' : 'neu-button text-secondary'
              }`}
            >
              {tab === 'dashboard' ? '📊 Overview' : 
               tab === 'budget' ? '💸 Budget' :
               tab === 'goals' ? '🎯 Target' :
               tab === 'history' ? '🕒 History' :
               tab === 'analysis' ? '🧠 AI Advisor' : '⚙️ System'}
            </button>
          ))}
        </div>

        <div className="print:block min-h-[500px]">
            {activeTab === 'dashboard' && <ChartsSection transactions={filteredTransactions} isDarkMode={isDarkMode} />}
            {activeTab === 'budget' && <BudgetSection budgets={state.budgets} />}
            {activeTab === 'goals' && <GoalsSection goals={state.goals} />}
            {activeTab === 'history' && (
              <TransactionHistory 
                transactions={state.transactions} 
                accounts={state.accounts} 
                selectedAccountId={selectedAccountId}
                onUpdateTransactions={handleBulkUpdate}
                onDeleteTransactions={handleBulkDelete}
              />
            )}
            {activeTab === 'analysis' && <FinancialAnalysis transactions={filteredTransactions} accounts={state.accounts} goals={state.goals} />}
            {activeTab === 'system' && <SystemHub logs={state.logs} transactions={state.transactions} accounts={state.accounts} />}
        </div>
      </main>

      <footer className="mt-24 text-center pb-12 no-print border-t border-gray-300/20 pt-10">
        <div className="flex flex-col items-center">
          <div className="w-10 h-1 rounded-full bg-gray-300/30 mb-6"></div>
          <p className="text-primary text-xl font-black tracking-tighter">DOMPET PRO</p>
          <p className="text-secondary text-[10px] font-bold uppercase tracking-[0.4em] mt-1 mb-8">Intelligence Layer Activated</p>
          <div className="flex flex-wrap justify-center gap-4 md:gap-8 text-secondary text-[10px] font-black uppercase tracking-widest">
             <button onClick={() => { setActiveTab('system'); window.scrollTo(0,0); }} className="hover:text-blue-500 transition-colors flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" /> Security Audit
             </button>
             <button onClick={() => { setActiveTab('system'); window.scrollTo(0,0); }} className="hover:text-blue-500 transition-colors">AI Logs</button>
             <button onClick={() => { setActiveTab('system'); window.scrollTo(0,0); }} className="hover:text-blue-500 transition-colors">API Status</button>
             <button onClick={() => setShowPrivacy(true)} className="hover:text-blue-500 transition-colors">Privacy Policy</button>
          </div>
          <p className="text-secondary text-[10px] mt-10 opacity-40 font-medium">Build 3.6.0.STABLE • Developed for robbyaprianto</p>
        </div>
      </footer>

      {showPrivacy && <PrivacyPolicy onClose={() => setShowPrivacy(false)} />}
    </div>
  );
};

export default App;
