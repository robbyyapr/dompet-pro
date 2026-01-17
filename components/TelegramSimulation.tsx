import React, { useState } from 'react';
import { parseTelegramCommand, ParsedCommand } from '../services/geminiService';
import { sendTelegramCommandToApi } from '../services/apiClient';
import { Account, Goal, Budget } from '../types';
import { CATEGORIES } from '../constants';
import { BankIconCompact } from './BankIcon';
import { findBankIcon, getBankColor, BANK_ICONS } from '../constants/bankIcons';

const GOAL_ICONS = ['🎯', '🛡️', '🏠', '🚗', '✈️', '💻', '📱', '💰', '🎓', '💍', '🏖️', '🎮', '📚', '💎', '🎁'];
const GOAL_COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#ec4899', '#06b6d4', '#84cc16'];
const ACCOUNT_ICONS = ['🏦', '📱', '💵', '🏛️', '💜', '💳', '🪙', '💴'];

type MenuMode = 'main' | 'transaction' | 'goal' | 'budget' | 'account' | 'goal-list' | 'budget-list' | 'account-list';

interface Props {
  onAddTransaction: (cmd: ParsedCommand) => void;
  accounts?: Account[];
  goals?: Goal[];
  budgets?: Budget[];
  onAddGoal?: (goal: Omit<Goal, 'id'>) => void;
  onEditGoal?: (goal: Goal) => void;
  onDeleteGoal?: (id: string) => void;
  onAddBudget?: (budget: Budget) => void;
  onEditBudget?: (category: string, budget: Budget) => void;
  onDeleteBudget?: (category: string) => void;
  onEditAccount?: (account: Account) => void;
  onAddAccount?: (account: Omit<Account, 'id'>) => void;
  onDeleteAccount?: (id: string) => void;
}

export const TelegramSimulation: React.FC<Props> = ({ 
  onAddTransaction, 
  accounts = [], 
  goals = [], 
  budgets = [],
  onAddGoal,
  onEditGoal,
  onDeleteGoal,
  onAddBudget,
  onEditBudget,
  onDeleteBudget,
  onEditAccount,
  onAddAccount,
  onDeleteAccount
}) => {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [menuMode, setMenuMode] = useState<MenuMode>('main');
  const [showMenu, setShowMenu] = useState(false);
  
  // Goal form state
  const [goalForm, setGoalForm] = useState<Partial<Goal>>({ icon: '🎯', color: '#3b82f6' });
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  
  // Budget form state
  const [budgetForm, setBudgetForm] = useState<Partial<Budget>>({});
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  
  // Account form state
  const [accountForm, setAccountForm] = useState<Partial<Account>>({ icon: '🏦', type: 'Bank' });
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);

  const handleSend = async () => {
    if (!input.trim()) return;
    setLoading(true);
    setFeedback('Processing...');

    let result = await sendTelegramCommandToApi(input);
    if (!result) {
      result = await parseTelegramCommand(input);
    }

    if (result) {
      onAddTransaction(result);
      setFeedback(`✓ ${result.type}: ${result.note} (Rp ${result.amount.toLocaleString('id-ID')})`);
      setInput('');
    } else {
      setFeedback('Could not understand command');
    }
    setLoading(false);
    setTimeout(() => setFeedback(''), 4000);
  };

  const resetMenu = () => {
    setMenuMode('main');
    setGoalForm({ icon: '🎯', color: '#3b82f6' });
    setBudgetForm({});
    setAccountForm({ icon: '🏦', type: 'Bank' });
    setEditingGoal(null);
    setEditingBudget(null);
    setEditingAccount(null);
  };

  const handleSaveGoal = () => {
    if (!goalForm.name || !goalForm.targetAmount) {
      setFeedback('Please fill name and target amount');
      setTimeout(() => setFeedback(''), 3000);
      return;
    }
    
    const goalName = goalForm.name;
    if (editingGoal) {
      onEditGoal?.({ ...editingGoal, ...goalForm } as Goal);
      setFeedback(`✓ Goal "${goalName}" updated`);
    } else {
      onAddGoal?.({
        name: goalForm.name,
        targetAmount: goalForm.targetAmount,
        currentAmount: goalForm.currentAmount || 0,
        deadline: goalForm.deadline,
        icon: goalForm.icon || '🎯',
        color: goalForm.color || '#3b82f6'
      });
      setFeedback(`✓ Goal "${goalName}" added`);
    }
    setEditingGoal(null);
    setGoalForm({ icon: '🎯', color: '#3b82f6' });
    setMenuMode('goal-list');
    setTimeout(() => setFeedback(''), 3000);
  };

  const handleSaveBudget = () => {
    if (!budgetForm.category || !budgetForm.limit) {
      setFeedback('Please fill category and limit');
      setTimeout(() => setFeedback(''), 3000);
      return;
    }
    
    const budgetCategory = budgetForm.category;
    if (editingBudget) {
      onEditBudget?.(editingBudget.category, budgetForm as Budget);
      setFeedback(`✓ Budget "${budgetCategory}" updated`);
    } else {
      onAddBudget?.({
        category: budgetForm.category,
        limit: budgetForm.limit,
        spent: budgetForm.spent || 0
      });
      setFeedback(`✓ Budget "${budgetCategory}" added`);
    }
    setEditingBudget(null);
    setBudgetForm({});
    setMenuMode('budget-list');
    setTimeout(() => setFeedback(''), 3000);
  };

  const handleSaveAccount = () => {
    if (!accountForm.name || accountForm.balance === undefined) {
      setFeedback('Please fill name and balance');
      setTimeout(() => setFeedback(''), 3000);
      return;
    }
    
    const accountName = accountForm.name;
    if (editingAccount) {
      onEditAccount?.({ ...editingAccount, ...accountForm } as Account);
      setFeedback(`✓ Account "${accountName}" updated`);
    } else {
      onAddAccount?.({
        name: accountForm.name,
        type: accountForm.type || 'Bank',
        balance: accountForm.balance,
        icon: accountForm.icon || '🏦'
      });
      setFeedback(`✓ Account "${accountName}" added`);
    }
    setEditingAccount(null);
    setAccountForm({ icon: '🏦', type: 'Bank' });
    setMenuMode('account-list');
    setTimeout(() => setFeedback(''), 3000);
  };

  const handleEditGoal = (goal: Goal) => {
    setEditingGoal(goal);
    setGoalForm({ ...goal });
    setMenuMode('goal');
  };

  const handleEditBudget = (budget: Budget) => {
    setEditingBudget(budget);
    setBudgetForm({ ...budget });
    setMenuMode('budget');
  };

  const handleEditAccount = (account: Account) => {
    setEditingAccount(account);
    setAccountForm({ ...account });
    setMenuMode('account');
  };

  const renderMainMenu = () => (
    <div className="space-y-2">
      <p className="text-xs text-secondary mb-3">Select action:</p>
      <div className="grid grid-cols-2 gap-2">
        <button onClick={() => setMenuMode('goal')} className="neu-button p-3 rounded-xl text-left">
          <span className="text-lg">🎯</span>
          <p className="text-xs font-bold text-primary mt-1">Add Goal</p>
        </button>
        <button onClick={() => setMenuMode('goal-list')} className="neu-button p-3 rounded-xl text-left">
          <span className="text-lg">📋</span>
          <p className="text-xs font-bold text-primary mt-1">Manage Goals</p>
        </button>
        <button onClick={() => setMenuMode('budget')} className="neu-button p-3 rounded-xl text-left">
          <span className="text-lg">💸</span>
          <p className="text-xs font-bold text-primary mt-1">Add Budget</p>
        </button>
        <button onClick={() => setMenuMode('budget-list')} className="neu-button p-3 rounded-xl text-left">
          <span className="text-lg">📊</span>
          <p className="text-xs font-bold text-primary mt-1">Manage Budgets</p>
        </button>
        <button onClick={() => setMenuMode('account')} className="neu-button p-3 rounded-xl text-left">
          <span className="text-lg">🏦</span>
          <p className="text-xs font-bold text-primary mt-1">Add Account</p>
        </button>
        <button onClick={() => setMenuMode('account-list')} className="neu-button p-3 rounded-xl text-left">
          <span className="text-lg">💳</span>
          <p className="text-xs font-bold text-primary mt-1">Manage Accounts</p>
        </button>
      </div>
    </div>
  );

  const renderGoalForm = () => (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold text-primary">{editingGoal ? 'Edit Goal' : 'Add New Goal'}</p>
        <button onClick={resetMenu} className="text-secondary text-xs">← Back</button>
      </div>
      <input
        type="text"
        value={goalForm.name || ''}
        onChange={e => setGoalForm(f => ({ ...f, name: e.target.value }))}
        placeholder="Goal name"
        className="w-full neu-inset p-3 rounded-xl text-sm text-primary bg-transparent"
      />
      <input
        type="number"
        value={goalForm.targetAmount || ''}
        onChange={e => setGoalForm(f => ({ ...f, targetAmount: parseFloat(e.target.value) || 0 }))}
        placeholder="Target amount (Rp)"
        className="w-full neu-inset p-3 rounded-xl text-sm text-primary bg-transparent"
      />
      <input
        type="number"
        value={goalForm.currentAmount || ''}
        onChange={e => setGoalForm(f => ({ ...f, currentAmount: parseFloat(e.target.value) || 0 }))}
        placeholder="Current amount (Rp)"
        className="w-full neu-inset p-3 rounded-xl text-sm text-primary bg-transparent"
      />
      <input
        type="date"
        value={goalForm.deadline || ''}
        onChange={e => setGoalForm(f => ({ ...f, deadline: e.target.value }))}
        className="w-full neu-inset p-3 rounded-xl text-sm text-primary bg-transparent"
      />
      <div>
        <p className="text-xs text-secondary mb-2">Icon</p>
        <div className="flex flex-wrap gap-1">
          {GOAL_ICONS.map(icon => (
            <button
              key={icon}
              onClick={() => setGoalForm(f => ({ ...f, icon }))}
              className={`w-8 h-8 rounded-lg flex items-center justify-center ${goalForm.icon === icon ? 'neu-inset' : 'neu-button'}`}
            >
              {icon}
            </button>
          ))}
        </div>
      </div>
      <div>
        <p className="text-xs text-secondary mb-2">Color</p>
        <div className="flex flex-wrap gap-1">
          {GOAL_COLORS.map(color => (
            <button
              key={color}
              onClick={() => setGoalForm(f => ({ ...f, color }))}
              className={`w-8 h-8 rounded-lg ${goalForm.color === color ? 'ring-2 ring-offset-1' : ''}`}
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
      </div>
      <button onClick={handleSaveGoal} className="w-full neu-button py-3 rounded-xl font-bold text-blue-500">
        {editingGoal ? 'Save Changes' : 'Add Goal'}
      </button>
    </div>
  );

  const renderGoalList = () => (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold text-primary">Manage Goals</p>
        <button onClick={resetMenu} className="text-secondary text-xs">← Back</button>
      </div>
      {goals.length === 0 ? (
        <p className="text-xs text-secondary text-center py-4">No goals yet</p>
      ) : (
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {goals.map(goal => (
            <div key={goal.id} className="neu-inset p-3 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span>{goal.icon}</span>
                <div>
                  <p className="text-xs font-bold text-primary">{goal.name}</p>
                  <p className="text-[10px] text-secondary">Rp {goal.currentAmount.toLocaleString('id-ID')} / {goal.targetAmount.toLocaleString('id-ID')}</p>
                </div>
              </div>
              <div className="flex gap-1">
                <button onClick={() => handleEditGoal(goal)} className="neu-button w-7 h-7 rounded-lg flex items-center justify-center text-xs">✏️</button>
                <button onClick={() => { onDeleteGoal?.(goal.id); setFeedback(`✓ Goal deleted`); setTimeout(() => setFeedback(''), 3000); }} className="neu-button w-7 h-7 rounded-lg flex items-center justify-center text-xs">🗑️</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderBudgetForm = () => (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold text-primary">{editingBudget ? 'Edit Budget' : 'Add New Budget'}</p>
        <button onClick={resetMenu} className="text-secondary text-xs">← Back</button>
      </div>
      <select
        value={budgetForm.category || ''}
        onChange={e => setBudgetForm(f => ({ ...f, category: e.target.value }))}
        className="w-full neu-inset p-3 rounded-xl text-sm text-primary bg-transparent"
        disabled={!!editingBudget}
      >
        <option value="">Select category</option>
        {CATEGORIES.filter(c => !editingBudget && !budgets.find(b => b.category === c)).map(cat => (
          <option key={cat} value={cat}>{cat}</option>
        ))}
        {editingBudget && <option value={editingBudget.category}>{editingBudget.category}</option>}
      </select>
      <input
        type="number"
        value={budgetForm.limit || ''}
        onChange={e => setBudgetForm(f => ({ ...f, limit: parseFloat(e.target.value) || 0 }))}
        placeholder="Budget limit (Rp)"
        className="w-full neu-inset p-3 rounded-xl text-sm text-primary bg-transparent"
      />
      <input
        type="number"
        value={budgetForm.spent || ''}
        onChange={e => setBudgetForm(f => ({ ...f, spent: parseFloat(e.target.value) || 0 }))}
        placeholder="Already spent (Rp)"
        className="w-full neu-inset p-3 rounded-xl text-sm text-primary bg-transparent"
      />
      <button onClick={handleSaveBudget} className="w-full neu-button py-3 rounded-xl font-bold text-blue-500">
        {editingBudget ? 'Save Changes' : 'Add Budget'}
      </button>
    </div>
  );

  const renderBudgetList = () => (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold text-primary">Manage Budgets</p>
        <button onClick={resetMenu} className="text-secondary text-xs">← Back</button>
      </div>
      {budgets.length === 0 ? (
        <p className="text-xs text-secondary text-center py-4">No budgets yet</p>
      ) : (
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {budgets.map(budget => (
            <div key={budget.category} className="neu-inset p-3 rounded-xl flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-primary">{budget.category}</p>
                <p className="text-[10px] text-secondary">Rp {budget.spent.toLocaleString('id-ID')} / {budget.limit.toLocaleString('id-ID')}</p>
              </div>
              <div className="flex gap-1">
                <button onClick={() => handleEditBudget(budget)} className="neu-button w-7 h-7 rounded-lg flex items-center justify-center text-xs">✏️</button>
                <button onClick={() => { onDeleteBudget?.(budget.category); setFeedback(`✓ Budget deleted`); setTimeout(() => setFeedback(''), 3000); }} className="neu-button w-7 h-7 rounded-lg flex items-center justify-center text-xs">🗑️</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderAccountForm = () => {
    const detectedBank = accountForm.name ? findBankIcon(accountForm.name) : null;
    const bankColor = accountForm.name ? getBankColor(accountForm.name) : '#6b7280';
    
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-bold text-primary">{editingAccount ? 'Edit Account' : 'Add New Account'}</p>
          <button onClick={resetMenu} className="text-secondary text-xs">← Back</button>
        </div>
        
        {/* Name input with bank detection preview */}
        <div className="relative">
          <input
            type="text"
            value={accountForm.name || ''}
            onChange={e => setAccountForm(f => ({ ...f, name: e.target.value }))}
            placeholder="Nama akun (cth: BCA, GoPay)"
            className="w-full neu-inset p-3 pr-12 rounded-xl text-sm text-primary bg-transparent"
          />
          {detectedBank && (
            <div 
              className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold"
              style={{ backgroundColor: `${bankColor}20`, color: bankColor }}
            >
              <BankIconCompact name={accountForm.name || ''} />
              <span>{detectedBank.name}</span>
            </div>
          )}
        </div>
        
        <select
          value={accountForm.type || 'Bank'}
          onChange={e => setAccountForm(f => ({ ...f, type: e.target.value as Account['type'] }))}
          className="w-full neu-inset p-3 rounded-xl text-sm text-primary bg-transparent"
        >
          <option value="Bank">🏦 Bank</option>
          <option value="E-Wallet">📱 E-Wallet</option>
          <option value="Cash">💵 Cash</option>
        </select>
        
        <input
          type="number"
          value={accountForm.balance ?? ''}
          onChange={e => setAccountForm(f => ({ ...f, balance: parseFloat(e.target.value) || 0 }))}
          placeholder="Saldo (Rp)"
          className="w-full neu-inset p-3 rounded-xl text-sm text-primary bg-transparent"
        />
        
        {/* Quick bank/wallet selection */}
        <div>
          <p className="text-xs text-secondary mb-2">Quick Select</p>
          <div className="flex flex-wrap gap-1.5">
            {['BCA', 'Mandiri', 'BRI', 'BNI', 'GoPay', 'OVO', 'DANA', 'Cash'].map(name => {
              const bankInfo = findBankIcon(name);
              const color = getBankColor(name);
              const isSelected = accountForm.name?.toLowerCase().includes(name.toLowerCase());
              return (
                <button
                  key={name}
                  onClick={() => setAccountForm(f => ({ 
                    ...f, 
                    name,
                    type: name === 'Cash' ? 'Cash' : (bankInfo?.emoji === '📱' ? 'E-Wallet' : 'Bank'),
                    icon: bankInfo?.emoji || '💰'
                  }))}
                  className={`px-2 py-1.5 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all ${
                    isSelected ? 'ring-2' : 'hover:scale-105'
                  }`}
                  style={{ 
                    backgroundColor: `${color}15`, 
                    color,
                    ...(isSelected && { '--tw-ring-color': color } as React.CSSProperties)
                  }}
                >
                  <BankIconCompact name={name} />
                  {name}
                </button>
              );
            })}
          </div>
        </div>
        
        <button onClick={handleSaveAccount} className="w-full neu-button py-3 rounded-xl font-bold text-blue-500">
          {editingAccount ? 'Save Changes' : 'Add Account'}
        </button>
      </div>
    );
  };

  const renderAccountList = () => (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold text-primary">Manage Accounts</p>
        <button onClick={resetMenu} className="text-secondary text-xs">← Back</button>
      </div>
      {accounts.length === 0 ? (
        <p className="text-xs text-secondary text-center py-4">No accounts yet</p>
      ) : (
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {accounts.map(account => {
            const bankColor = getBankColor(account.name);
            return (
              <div 
                key={account.id} 
                className="neu-inset p-3 rounded-xl flex items-center justify-between"
                style={{ borderLeft: `3px solid ${bankColor}` }}
              >
                <div className="flex items-center gap-2">
                  <BankIconCompact name={account.name} />
                  <div>
                    <p className="text-xs font-bold text-primary">{account.name}</p>
                    <p className="text-[10px] text-secondary">Rp {account.balance.toLocaleString('id-ID')}</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => handleEditAccount(account)} className="neu-button w-7 h-7 rounded-lg flex items-center justify-center text-xs">✏️</button>
                  <button onClick={() => { onDeleteAccount?.(account.id); setFeedback(`✓ Account deleted`); setTimeout(() => setFeedback(''), 3000); }} className="neu-button w-7 h-7 rounded-lg flex items-center justify-center text-xs">🗑️</button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  const renderMenuContent = () => {
    switch (menuMode) {
      case 'goal': return renderGoalForm();
      case 'goal-list': return renderGoalList();
      case 'budget': return renderBudgetForm();
      case 'budget-list': return renderBudgetList();
      case 'account': return renderAccountForm();
      case 'account-list': return renderAccountList();
      default: return renderMainMenu();
    }
  };

  return (
    <div className="neu-card p-4 md:p-5 no-print">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-blue-500 text-lg">📱</span>
          <h3 className="text-primary font-bold text-sm">Quick Input</h3>
        </div>
        <button 
          onClick={() => { setShowMenu(!showMenu); if (!showMenu) resetMenu(); }}
          className={`neu-button px-3 py-1.5 rounded-lg text-xs font-bold ${showMenu ? 'text-red-500' : 'text-blue-500'}`}
        >
          {showMenu ? '✕ Close' : '☰ Menu'}
        </button>
      </div>
      
      {showMenu ? (
        <div className="animate-fadeIn">
          {renderMenuContent()}
        </div>
      ) : (
        <>
          <p className="text-secondary text-xs mb-4">
            Example: "Beli kopi 25rb BCA" or "Gaji 10jt ke BCA"
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <input 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type transaction..."
              className="flex-1 neu-inset rounded-xl px-4 py-3 text-sm text-primary placeholder:text-secondary/50 outline-none focus:ring-2 focus:ring-blue-500/30"
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            />
            <button 
              onClick={handleSend}
              disabled={loading || !input.trim()}
              className="neu-button px-6 py-3 rounded-xl font-bold text-sm text-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '...' : 'Add'}
            </button>
          </div>
        </>
      )}
      
      {feedback && (
        <div className={`mt-3 text-xs font-medium p-2 rounded-lg text-center ${
          feedback.startsWith('✓') ? 'bg-green-500/10 text-green-600' : 'bg-blue-500/10 text-blue-500'
        }`}>
          {feedback}
        </div>
      )}
    </div>
  );
};
