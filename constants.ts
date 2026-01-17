
import { Account, Transaction, Goal, Budget } from './types';

export const INITIAL_ACCOUNTS: Account[] = [
  { id: '1', name: 'BCA Main', type: 'Bank', balance: 15420000, icon: '🏦' },
  { id: '2', name: 'GoPay', type: 'E-Wallet', balance: 1450000, icon: '📱' },
  { id: '3', name: 'Cash Wallet', type: 'Cash', balance: 550000, icon: '💵' },
  { id: '4', name: 'Mandiri', type: 'Bank', balance: 5200000, icon: '🏛️' },
  { id: '5', name: 'OVO', type: 'E-Wallet', balance: 825000, icon: '💜' },
];

export const INITIAL_GOALS: Goal[] = [
  { id: 'g1', name: 'Dana Darurat', targetAmount: 50000000, currentAmount: 12500000, icon: '🛡️', color: '#10b981' },
  { id: 'g2', name: 'Liburan Jepang', targetAmount: 25000000, currentAmount: 8400000, icon: '🇯🇵', color: '#3b82f6' },
  { id: 'g3', name: 'MacBook Pro', targetAmount: 35000000, currentAmount: 2000000, icon: '💻', color: '#8b5cf6' },
];

export const INITIAL_BUDGETS: Budget[] = [
  { category: 'Food', limit: 3000000, spent: 1200000 },
  { category: 'Transport', limit: 1000000, spent: 450000 },
  { category: 'Shopping', limit: 2000000, spent: 1850000 },
  { category: 'Bills', limit: 5000000, spent: 4800000 },
];

const generateHistory = (): Transaction[] => {
  const categories = ['Food', 'Transport', 'Shopping', 'Bills', 'Health', 'Entertainment', 'Education', 'Investment', 'Other'];
  const data: Transaction[] = [];
  const now = Date.now();
  
  for (let i = 0; i < 45; i++) {
    const date = new Date(now - i * 86400000).toISOString();
    data.push({
      id: `h${i}a`,
      accountId: (Math.floor(Math.random() * 5) + 1).toString(),
      amount: Math.floor(Math.random() * 250000) + 20000,
      type: 'Expense',
      category: categories[Math.floor(Math.random() * categories.length)],
      date,
      note: `Transaksi v4.1 #${i}`
    });
    
    if (i % 30 === 0) {
      data.push({
        id: `h${i}b`,
        accountId: '1',
        amount: 15000000,
        type: 'Income',
        category: 'Salary',
        date,
        note: 'Gaji Bulanan Utama'
      });
    }
  }
  return data;
};

export const INITIAL_TRANSACTIONS: Transaction[] = generateHistory();

export const CATEGORIES = [
  'Food', 'Transport', 'Shopping', 'Bills', 'Health', 'Entertainment', 'Education', 'Investment', 'Other', 'Salary'
];
