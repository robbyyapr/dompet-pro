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
// Data loaded from SQLite via API - no dummy data imports
import { Account, Transaction, AppState, Goal, Budget, SystemLog } from './types';
import { ParsedCommand } from './services/geminiService';
import { syncState, isSessionValid, clearSession, fetchState } from './services/apiClient';

const App: React.FC = () => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark' || 
           (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });

  const [state, setState] = useState<AppState>(() => {
    // Check if session is valid on initial load - persist session across refresh
    const hasValidSession = isSessionValid();
    console.log('[Auth] Session valid on load:', hasValidSession);
    return {
      accounts: [],
      transactions: [],
      goals: [],
      budgets: [],
      logs: [],
      isLocked: !hasValidSession,
      otpCode: null
    };
  });

  const [activeTab, setActiveTab] = useState<'dashboard' | 'history' | 'goals' | 'budget' | 'analysis' | 'system'>('dashboard');
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  // Load real data from database when unlocked
  useEffect(() => {
    const loadData = async () => {
      if (!state.isLocked && !dataLoaded) {
        const data = await fetchState();
        if (data) {
          setState(prev => ({
            ...prev,
            accounts: data.accounts || [],
            transactions: data.transactions || [],
            goals: data.goals || [],
            budgets: data.budgets || []
          }));
        }
        setDataLoaded(true);
      }
    };
    loadData();
  }, [state.isLocked, dataLoaded]);

  // Sync state to database whenever it changes
  useEffect(() => {
    if (!state.isLocked && dataLoaded) {
      const syncTimeout = setTimeout(() => {
        syncState({
          accounts: state.accounts,
          transactions: state.transactions,
          goals: state.goals,
          budgets: state.budgets
        });
      }, 500);
      return () => clearTimeout(syncTimeout);
    }
  }, [state.accounts, state.transactions, state.goals, state.budgets, state.isLocked, dataLoaded]);

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
      const { transactions } = prev;
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

  const handleClearAllTransactions = useCallback(() => {
    setState(prev => {
      addLog('SECURITY', `Cleared all ${prev.transactions.length} transactions`, 'WARNING');
      return { ...prev, transactions: [] };
    });
  }, [addLog]);

  // Goal handlers
  const handleAddGoal = useCallback((goal: Omit<Goal, 'id'>) => {
    const newGoal: Goal = { ...goal, id: Math.random().toString(36).substr(2, 9) };
    setState(prev => ({ ...prev, goals: [...prev.goals, newGoal] }));
    addLog('SYSTEM', `Added goal: ${goal.name}`, 'SUCCESS');
  }, [addLog]);

  const handleEditGoal = useCallback((goal: Goal) => {
    setState(prev => ({
      ...prev,
      goals: prev.goals.map(g => g.id === goal.id ? goal : g)
    }));
    addLog('SYSTEM', `Updated goal: ${goal.name}`, 'SUCCESS');
  }, [addLog]);

  const handleDeleteGoal = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      goals: prev.goals.filter(g => g.id !== id)
    }));
    addLog('SECURITY', 'Deleted goal permanently', 'WARNING');
  }, [addLog]);

  // Budget handlers
  const handleAddBudget = useCallback((budget: Budget) => {
    setState(prev => ({ ...prev, budgets: [...prev.budgets, budget] }));
    addLog('SYSTEM', `Added budget: ${budget.category}`, 'SUCCESS');
  }, [addLog]);

  const handleEditBudget = useCallback((category: string, budget: Budget) => {
    setState(prev => ({
      ...prev,
      budgets: prev.budgets.map(b => b.category === category ? budget : b)
    }));
    addLog('SYSTEM', `Updated budget: ${budget.category}`, 'SUCCESS');
  }, [addLog]);

  const handleDeleteBudget = useCallback((category: string) => {
    setState(prev => ({
      ...prev,
      budgets: prev.budgets.filter(b => b.category !== category)
    }));
    addLog('SECURITY', 'Deleted budget permanently', 'WARNING');
  }, [addLog]);

  // Account handlers
  const handleAddAccount = useCallback((account: Omit<Account, 'id'>) => {
    const newAccount: Account = { ...account, id: Math.random().toString(36).substr(2, 9) };
    setState(prev => ({ ...prev, accounts: [...prev.accounts, newAccount] }));
    addLog('SYSTEM', `Added account: ${account.name}`, 'SUCCESS');
  }, [addLog]);

  const handleEditAccount = useCallback((account: Account) => {
    setState(prev => ({
      ...prev,
      accounts: prev.accounts.map(a => a.id === account.id ? account : a)
    }));
    addLog('SYSTEM', `Updated account: ${account.name}`, 'SUCCESS');
  }, [addLog]);

  const handleDeleteAccount = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      accounts: prev.accounts.filter(a => a.id !== id)
    }));
    addLog('SECURITY', 'Deleted account permanently', 'WARNING');
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

  const handleUnlock = async () => {
    addLog('SECURITY', 'PIN access authorized', 'SUCCESS');
    // Force reload data from server to get latest Telegram changes
    setDataLoaded(false);
    setState(prev => ({ ...prev, isLocked: false }));
  };
  
  const handleLock = () => setState(prev => ({ ...prev, isLocked: true }));

  const handleClearAllData = () => {
    setState({
      accounts: [],
      transactions: [],
      goals: [],
      budgets: [],
      logs: [],
      isLocked: true,
      otpCode: null
    });
    addLog('SECURITY', 'All data cleared by user', 'WARNING');
  };

  if (state.isLocked) {
    return <AuthLock onUnlock={handleUnlock} onClearAllData={handleClearAllData} />;
  }

  const filteredTransactions = selectedAccountId 
    ? state.transactions.filter(t => t.accountId === selectedAccountId)
    : state.transactions;

  const tabs = [
    { id: 'dashboard', label: 'Overview', icon: '📊' },
    { id: 'budget', label: 'Budget', icon: '💸' },
    { id: 'goals', label: 'Goals', icon: '🎯' },
    { id: 'history', label: 'History', icon: '🕒' },
    { id: 'analysis', label: 'AI', icon: '🧠' },
    { id: 'system', label: 'System', icon: '⚙️' },
  ] as const;

  return (
    <div className="min-h-screen p-4 md:p-6 lg:p-8">
      {/* Header */}
      <header className="max-w-6xl mx-auto mb-6 md:mb-8">
        <div className="neu-card p-4 md:p-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-3">
                <h1 className="text-2xl md:text-3xl font-black text-primary">Dompet</h1>
                <span className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-[10px] font-bold px-2 py-1 rounded-full">
                  PRO
                </span>
              </div>
              <p className="text-secondary text-sm mt-1">Smart Finance Manager</p>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="hidden md:block text-right mr-2">
                <p className="text-[10px] text-secondary uppercase tracking-wider font-bold">Total Assets</p>
                <p className="text-lg font-black text-primary">Rp {totalBalance.toLocaleString('id-ID')}</p>
              </div>
              <button 
                onClick={() => setIsDarkMode(!isDarkMode)} 
                className="neu-button w-11 h-11 flex items-center justify-center text-lg"
              >
                {isDarkMode ? '☀️' : '🌙'}
              </button>
              <button 
                onClick={handleLock} 
                className="neu-button w-11 h-11 flex items-center justify-center text-lg"
              >
                🔒
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto space-y-6">
        {/* Account Cards */}
        <AccountSection 
          accounts={state.accounts} 
          selectedAccountId={selectedAccountId} 
          onSelectAccount={setSelectedAccountId} 
        />
        
        {/* Telegram Input */}
        <TelegramSimulation 
          onAddTransaction={addTransaction}
          accounts={state.accounts}
          goals={state.goals}
          budgets={state.budgets}
          onAddGoal={handleAddGoal}
          onEditGoal={handleEditGoal}
          onDeleteGoal={handleDeleteGoal}
          onAddBudget={handleAddBudget}
          onEditBudget={handleEditBudget}
          onDeleteBudget={handleDeleteBudget}
          onAddAccount={handleAddAccount}
          onEditAccount={handleEditAccount}
          onDeleteAccount={handleDeleteAccount}
        />

        {/* Tab Navigation */}
        <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0 no-print">
          <div className="flex gap-2 md:gap-3 min-w-max">
            {tabs.map(tab => (
              <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id)} 
                className={`px-4 py-2.5 rounded-xl font-semibold text-xs transition-all flex items-center gap-2 ${
                  activeTab === tab.id 
                    ? 'neu-inset text-blue-500' 
                    : 'neu-button text-secondary hover:text-primary'
                }`}
              >
                <span>{tab.icon}</span>
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="min-h-[400px] animate-fadeIn">
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
              onClearAllTransactions={handleClearAllTransactions}
            />
          )}
          {activeTab === 'analysis' && <FinancialAnalysis transactions={filteredTransactions} accounts={state.accounts} goals={state.goals} />}
          {activeTab === 'system' && <SystemHub logs={state.logs} transactions={state.transactions} accounts={state.accounts} />}
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-6xl mx-auto mt-12 pt-8 border-t border-gray-200/20 text-center no-print">
        <p className="text-primary font-bold text-lg">DOMPET PRO</p>
        <p className="text-secondary text-[10px] uppercase tracking-widest mt-1 mb-6">v4.1 • Smart Finance</p>
        <div className="flex flex-wrap justify-center gap-4 text-secondary text-[10px] font-semibold">
          <button onClick={() => setActiveTab('system')} className="hover:text-blue-500 transition-colors">
            System Logs
          </button>
          <button onClick={() => setShowPrivacy(true)} className="hover:text-blue-500 transition-colors">
            Privacy Policy
          </button>
        </div>
        <p className="text-secondary/50 text-[10px] mt-6">Built for robbyaprianto</p>
      </footer>

      {showPrivacy && <PrivacyPolicy onClose={() => setShowPrivacy(false)} />}
    </div>
  );
};

export default App;
