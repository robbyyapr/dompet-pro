import Database from 'better-sqlite3';
import path from 'path';
import { Account, Transaction, Goal, Budget, AppState } from '../types';
import { INITIAL_ACCOUNTS, INITIAL_BUDGETS, INITIAL_GOALS, INITIAL_TRANSACTIONS } from '../constants';

const DB_PATH = process.env.DB_PATH || path.join(process.cwd(), 'dompet.db');
const db = new Database(DB_PATH);

// Initialize tables
db.exec(`
  CREATE TABLE IF NOT EXISTS accounts (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    balance REAL NOT NULL,
    icon TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS transactions (
    id TEXT PRIMARY KEY,
    accountId TEXT NOT NULL,
    toAccountId TEXT,
    amount REAL NOT NULL,
    type TEXT NOT NULL,
    category TEXT NOT NULL,
    date TEXT NOT NULL,
    note TEXT NOT NULL,
    FOREIGN KEY (accountId) REFERENCES accounts(id)
  );

  CREATE TABLE IF NOT EXISTS goals (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    targetAmount REAL NOT NULL,
    currentAmount REAL NOT NULL,
    deadline TEXT,
    icon TEXT NOT NULL,
    color TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS budgets (
    category TEXT PRIMARY KEY,
    budgetLimit REAL NOT NULL,
    spent REAL NOT NULL
  );

  CREATE TABLE IF NOT EXISTS sessions (
    chatId TEXT PRIMARY KEY,
    otpCode TEXT,
    isAuthenticated INTEGER DEFAULT 0,
    createdAt TEXT NOT NULL,
    lastActive TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS users (
    username TEXT PRIMARY KEY,
    chatId TEXT NOT NULL,
    firstName TEXT,
    updatedAt TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS otp_codes (
    chatId TEXT PRIMARY KEY,
    code TEXT NOT NULL,
    createdAt TEXT NOT NULL,
    expiresAt TEXT NOT NULL,
    attempts INTEGER DEFAULT 0,
    lastAttemptAt TEXT
  );

  CREATE TABLE IF NOT EXISTS otp_rate_limits (
    chatId TEXT PRIMARY KEY,
    requestCount INTEGER DEFAULT 0,
    firstRequestAt TEXT NOT NULL,
    dailyCount INTEGER DEFAULT 0,
    dailyResetAt TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    icon TEXT NOT NULL,
    keywords TEXT NOT NULL,
    type TEXT DEFAULT 'Expense'
  );
`);

// Seed initial data if empty
const accountCount = db.prepare('SELECT COUNT(*) as count FROM accounts').get() as { count: number };
if (accountCount.count === 0) {
  const insertAccount = db.prepare('INSERT INTO accounts (id, name, type, balance, icon) VALUES (?, ?, ?, ?, ?)');
  for (const acc of INITIAL_ACCOUNTS) {
    insertAccount.run(acc.id, acc.name, acc.type, acc.balance, acc.icon);
  }

  const insertGoal = db.prepare('INSERT INTO goals (id, name, targetAmount, currentAmount, deadline, icon, color) VALUES (?, ?, ?, ?, ?, ?, ?)');
  for (const goal of INITIAL_GOALS) {
    insertGoal.run(goal.id, goal.name, goal.targetAmount, goal.currentAmount, goal.deadline || null, goal.icon, goal.color);
  }

  const insertBudget = db.prepare('INSERT INTO budgets (category, budgetLimit, spent) VALUES (?, ?, ?)');
  for (const budget of INITIAL_BUDGETS) {
    insertBudget.run(budget.category, budget.limit, budget.spent);
  }

  const insertTx = db.prepare('INSERT INTO transactions (id, accountId, toAccountId, amount, type, category, date, note) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
  for (const tx of INITIAL_TRANSACTIONS.slice(0, 20)) {
    insertTx.run(tx.id, tx.accountId, tx.toAccountId || null, tx.amount, tx.type, tx.category, tx.date, tx.note);
  }

  // Seed initial categories with keywords for auto-classification
  const initialCategories = [
    { id: 'cat1', name: 'Food', icon: '🍔', keywords: 'makan,makanan,food,bakso,mie,nasi,ayam,sate,gorengan,jajan,snack,kopi,coffee,starbucks,mcd,kfc,pizza,burger,resto,restaurant,warung,kantin,cafe,breakfast,lunch,dinner,sarapan,makan siang,makan malam,es,minuman,drink,boba,bubble tea,martabak,roti,bread,indomie,gofood,grabfood,shopeefood', type: 'Expense' },
    { id: 'cat2', name: 'Transport', icon: '🚗', keywords: 'transport,transportasi,gojek,grab,ojek,taxi,taksi,bus,kereta,train,mrt,lrt,transjakarta,tj,bensin,bbm,fuel,parkir,parking,tol,toll,uber,angkot,bajaj,ojol,motor,mobil,car,bike', type: 'Expense' },
    { id: 'cat3', name: 'Shopping', icon: '🛍️', keywords: 'shopping,belanja,beli,shop,mall,tokopedia,shopee,lazada,bukalapak,blibli,zalora,fashion,baju,celana,sepatu,shoes,tas,bag,jam,watch,aksesoris,accessories,elektronik,electronic,gadget,hp,phone,laptop,komputer,computer', type: 'Expense' },
    { id: 'cat4', name: 'Bills', icon: '📄', keywords: 'bills,tagihan,listrik,electricity,pln,air,pdam,gas,internet,wifi,indihome,telkom,pulsa,paket data,kuota,telepon,phone bill,tv kabel,netflix,spotify,subscription,langganan,iuran,cicilan,kredit,pinjaman,loan,asuransi,insurance,pajak,tax', type: 'Expense' },
    { id: 'cat5', name: 'Health', icon: '🏥', keywords: 'health,kesehatan,dokter,doctor,rumah sakit,hospital,klinik,clinic,obat,medicine,apotek,pharmacy,vitamin,suplemen,supplement,gym,fitness,olahraga,sport,medical,medis,sakit,sick,checkup,dental,gigi,mata,eye', type: 'Expense' },
    { id: 'cat6', name: 'Entertainment', icon: '🎬', keywords: 'entertainment,hiburan,nonton,bioskop,cinema,movie,film,konser,concert,game,gaming,steam,playstation,xbox,nintendo,karaoke,bar,club,party,pesta,liburan,vacation,holiday,travel,wisata,hotel,tiket,ticket,spotify,netflix,youtube,disney', type: 'Expense' },
    { id: 'cat7', name: 'Education', icon: '📚', keywords: 'education,pendidikan,sekolah,school,kuliah,university,kampus,buku,book,kursus,course,les,tutor,training,pelatihan,sertifikasi,certification,udemy,coursera,skillshare,workshop,seminar,webinar', type: 'Expense' },
    { id: 'cat8', name: 'Investment', icon: '📈', keywords: 'investment,investasi,saham,stock,reksadana,mutual fund,crypto,bitcoin,deposito,deposit,obligasi,bond,emas,gold,properti,property,trading,forex,bibit,ajaib,stockbit,pluang,bareksa', type: 'Expense' },
    { id: 'cat9', name: 'Other', icon: '📦', keywords: 'other,lainnya,lain,misc,miscellaneous', type: 'Expense' },
    { id: 'cat10', name: 'Salary', icon: '💼', keywords: 'salary,gaji,gajian,payroll,income,pendapatan,upah,honor,honorarium,bonus,thr,tunjangan,allowance', type: 'Income' },
    { id: 'cat11', name: 'Freelance', icon: '💻', keywords: 'freelance,freelancer,project,proyek,jasa,service,fee,bayaran,client,klien,side job,sampingan', type: 'Income' },
    { id: 'cat12', name: 'Gift', icon: '🎁', keywords: 'gift,hadiah,kado,angpao,angpau,THR,bonus,reward,cashback,refund,pengembalian', type: 'Income' },
  ];

  const insertCategory = db.prepare('INSERT OR IGNORE INTO categories (id, name, icon, keywords, type) VALUES (?, ?, ?, ?, ?)');
  for (const cat of initialCategories) {
    insertCategory.run(cat.id, cat.name, cat.icon, cat.keywords, cat.type);
  }
}

// Account operations
export const getAccounts = (): Account[] => {
  return db.prepare('SELECT * FROM accounts').all() as Account[];
};

export const updateAccountBalance = (accountId: string, newBalance: number) => {
  db.prepare('UPDATE accounts SET balance = ? WHERE id = ?').run(newBalance, accountId);
};

export const getAccountById = (id: string): Account | undefined => {
  return db.prepare('SELECT * FROM accounts WHERE id = ?').get(id) as Account | undefined;
};

export const getAccountByName = (name: string): Account | undefined => {
  return db.prepare('SELECT * FROM accounts WHERE LOWER(name) LIKE ?').get(`%${name.toLowerCase()}%`) as Account | undefined;
};

// Transaction operations
export const getTransactions = (): Transaction[] => {
  return db.prepare('SELECT * FROM transactions ORDER BY date DESC').all() as Transaction[];
};

export const addTransaction = (tx: Transaction) => {
  db.prepare('INSERT INTO transactions (id, accountId, toAccountId, amount, type, category, date, note) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
    .run(tx.id, tx.accountId, tx.toAccountId || null, tx.amount, tx.type, tx.category, tx.date, tx.note);
};

export const updateTransaction = (id: string, updates: Partial<Transaction>) => {
  const fields: string[] = [];
  const values: any[] = [];
  
  if (updates.category !== undefined) { fields.push('category = ?'); values.push(updates.category); }
  if (updates.accountId !== undefined) { fields.push('accountId = ?'); values.push(updates.accountId); }
  if (updates.amount !== undefined) { fields.push('amount = ?'); values.push(updates.amount); }
  if (updates.note !== undefined) { fields.push('note = ?'); values.push(updates.note); }
  
  if (fields.length > 0) {
    values.push(id);
    db.prepare(`UPDATE transactions SET ${fields.join(', ')} WHERE id = ?`).run(...values);
  }
};

export const deleteTransaction = (id: string) => {
  db.prepare('DELETE FROM transactions WHERE id = ?').run(id);
};

export const getTransactionById = (id: string): Transaction | undefined => {
  return db.prepare('SELECT * FROM transactions WHERE id = ?').get(id) as Transaction | undefined;
};

export const searchTransactions = (query: string): Transaction[] => {
  return db.prepare('SELECT * FROM transactions WHERE LOWER(note) LIKE ? OR LOWER(category) LIKE ? ORDER BY date DESC LIMIT 10')
    .all(`%${query.toLowerCase()}%`, `%${query.toLowerCase()}%`) as Transaction[];
};

// Goal operations
export const getGoals = (): Goal[] => {
  return db.prepare('SELECT * FROM goals').all() as Goal[];
};

export const getGoalById = (id: string): Goal | undefined => {
  return db.prepare('SELECT * FROM goals WHERE id = ?').get(id) as Goal | undefined;
};

export const addGoal = (goal: Goal) => {
  db.prepare('INSERT INTO goals (id, name, targetAmount, currentAmount, deadline, icon, color) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .run(goal.id, goal.name, goal.targetAmount, goal.currentAmount, goal.deadline || null, goal.icon, goal.color);
};

export const updateGoal = (id: string, updates: Partial<Goal>) => {
  const fields: string[] = [];
  const values: any[] = [];
  
  if (updates.name !== undefined) { fields.push('name = ?'); values.push(updates.name); }
  if (updates.targetAmount !== undefined) { fields.push('targetAmount = ?'); values.push(updates.targetAmount); }
  if (updates.currentAmount !== undefined) { fields.push('currentAmount = ?'); values.push(updates.currentAmount); }
  if (updates.deadline !== undefined) { fields.push('deadline = ?'); values.push(updates.deadline); }
  if (updates.icon !== undefined) { fields.push('icon = ?'); values.push(updates.icon); }
  if (updates.color !== undefined) { fields.push('color = ?'); values.push(updates.color); }
  
  if (fields.length > 0) {
    values.push(id);
    db.prepare(`UPDATE goals SET ${fields.join(', ')} WHERE id = ?`).run(...values);
  }
};

export const deleteGoal = (id: string) => {
  db.prepare('DELETE FROM goals WHERE id = ?').run(id);
};

export const addToGoal = (id: string, amount: number) => {
  const goal = getGoalById(id);
  if (goal) {
    const newAmount = goal.currentAmount + amount;
    db.prepare('UPDATE goals SET currentAmount = ? WHERE id = ?').run(newAmount, id);
  }
};

// Budget operations  
export const getBudgets = (): Budget[] => {
  const rows = db.prepare('SELECT category, budgetLimit as "limit", spent FROM budgets').all();
  return rows as Budget[];
};

export const updateBudgetSpent = (category: string, spent: number) => {
  db.prepare('UPDATE budgets SET spent = ? WHERE category = ?').run(spent, category);
};

export const getBudgetByCategory = (category: string): Budget | undefined => {
  const row = db.prepare('SELECT category, budgetLimit as "limit", spent FROM budgets WHERE LOWER(category) = ?')
    .get(category.toLowerCase()) as Budget | undefined;
  return row;
};

export const addBudget = (budget: Budget) => {
  db.prepare('INSERT INTO budgets (category, budgetLimit, spent) VALUES (?, ?, ?)')
    .run(budget.category, budget.limit, budget.spent);
};

export const updateBudget = (category: string, updates: { limit?: number; spent?: number }) => {
  const fields: string[] = [];
  const values: any[] = [];
  
  if (updates.limit !== undefined) { fields.push('budgetLimit = ?'); values.push(updates.limit); }
  if (updates.spent !== undefined) { fields.push('spent = ?'); values.push(updates.spent); }
  
  if (fields.length > 0) {
    values.push(category);
    db.prepare(`UPDATE budgets SET ${fields.join(', ')} WHERE category = ?`).run(...values);
  }
};

export const deleteBudget = (category: string) => {
  db.prepare('DELETE FROM budgets WHERE category = ?').run(category);
};

export const resetBudgetSpent = (category: string) => {
  db.prepare('UPDATE budgets SET spent = 0 WHERE category = ?').run(category);
};

export const resetAllBudgets = () => {
  db.prepare('UPDATE budgets SET spent = 0').run();
};

// OTP operations with rate limiting
const OTP_EXPIRY_MINUTES = 5;
const MAX_ATTEMPTS_PER_15MIN = 3;
const MAX_REQUESTS_PER_DAY = 10;
const SESSION_DURATION_HOURS = 5;

interface OTPRateLimitResult {
  allowed: boolean;
  error?: string;
  waitSeconds?: number;
  remainingDaily?: number;
}

export const checkOTPRateLimit = (chatId: string): OTPRateLimitResult => {
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  
  let rateLimit = db.prepare('SELECT * FROM otp_rate_limits WHERE chatId = ?').get(chatId) as any;
  
  if (!rateLimit) {
    return { allowed: true, remainingDaily: MAX_REQUESTS_PER_DAY };
  }
  
  // Reset daily count if new day
  const dailyResetDate = rateLimit.dailyResetAt.split('T')[0];
  if (dailyResetDate !== today) {
    db.prepare('UPDATE otp_rate_limits SET dailyCount = 0, dailyResetAt = ?, requestCount = 0, firstRequestAt = ? WHERE chatId = ?')
      .run(now.toISOString(), now.toISOString(), chatId);
    return { allowed: true, remainingDaily: MAX_REQUESTS_PER_DAY };
  }
  
  // Check daily limit
  if (rateLimit.dailyCount >= MAX_REQUESTS_PER_DAY) {
    return { allowed: false, error: 'Batas harian tercapai (10x/hari)', remainingDaily: 0 };
  }
  
  // Check 15-minute window
  const firstRequestTime = new Date(rateLimit.firstRequestAt);
  const fifteenMinAgo = new Date(now.getTime() - 15 * 60 * 1000);
  
  if (firstRequestTime > fifteenMinAgo && rateLimit.requestCount >= MAX_ATTEMPTS_PER_15MIN) {
    const waitMs = firstRequestTime.getTime() + 15 * 60 * 1000 - now.getTime();
    return { 
      allowed: false, 
      error: 'Terlalu banyak request', 
      waitSeconds: Math.ceil(waitMs / 1000),
      remainingDaily: MAX_REQUESTS_PER_DAY - rateLimit.dailyCount
    };
  }
  
  // Reset 15-min counter if window passed
  if (firstRequestTime <= fifteenMinAgo) {
    db.prepare('UPDATE otp_rate_limits SET requestCount = 0, firstRequestAt = ? WHERE chatId = ?')
      .run(now.toISOString(), chatId);
  }
  
  return { allowed: true, remainingDaily: MAX_REQUESTS_PER_DAY - rateLimit.dailyCount };
};

export const generateOTP = (chatId: string): { code: string; isExisting: boolean; expiresAt: Date } | null => {
  const now = new Date();
  const chatIdStr = chatId.toString();
  
  // Check rate limit
  const rateCheck = checkOTPRateLimit(chatIdStr);
  if (!rateCheck.allowed) {
    return null;
  }
  
  // Check for existing valid OTP
  const existing = db.prepare('SELECT * FROM otp_codes WHERE chatId = ?').get(chatIdStr) as any;
  if (existing) {
    const expiresAt = new Date(existing.expiresAt);
    if (now < expiresAt) {
      // Return existing OTP if still valid
      return { code: existing.code, isExisting: true, expiresAt };
    }
  }
  
  // Generate new OTP
  const code = Math.floor(1000 + Math.random() * 9000).toString();
  const expiresAt = new Date(now.getTime() + OTP_EXPIRY_MINUTES * 60 * 1000);
  
  db.prepare('INSERT OR REPLACE INTO otp_codes (chatId, code, createdAt, expiresAt, attempts, lastAttemptAt) VALUES (?, ?, ?, ?, 0, NULL)')
    .run(chatIdStr, code, now.toISOString(), expiresAt.toISOString());
  
  // Update rate limits
  const rateLimit = db.prepare('SELECT * FROM otp_rate_limits WHERE chatId = ?').get(chatIdStr) as any;
  if (rateLimit) {
    db.prepare('UPDATE otp_rate_limits SET requestCount = requestCount + 1, dailyCount = dailyCount + 1 WHERE chatId = ?')
      .run(chatIdStr);
  } else {
    db.prepare('INSERT INTO otp_rate_limits (chatId, requestCount, firstRequestAt, dailyCount, dailyResetAt) VALUES (?, 1, ?, 1, ?)')
      .run(chatIdStr, now.toISOString(), now.toISOString());
  }
  
  return { code, isExisting: false, expiresAt };
};

export const getOTPInfo = (chatId: string): { expiresAt: Date; attempts: number } | null => {
  const row = db.prepare('SELECT expiresAt, attempts FROM otp_codes WHERE chatId = ?').get(chatId.toString()) as any;
  if (!row) return null;
  
  const expiresAt = new Date(row.expiresAt);
  if (new Date() > expiresAt) return null;
  
  return { expiresAt, attempts: row.attempts || 0 };
};

export const verifyOTP = (chatId: string, code: string): { valid: boolean; error?: string; attemptsLeft?: number } => {
  const chatIdStr = chatId.toString();
  const row = db.prepare('SELECT * FROM otp_codes WHERE chatId = ?').get(chatIdStr) as any;
  
  if (!row) {
    return { valid: false, error: 'OTP tidak ditemukan' };
  }
  
  const now = new Date();
  const expiresAt = new Date(row.expiresAt);
  
  // Check if expired
  if (now > expiresAt) {
    db.prepare('DELETE FROM otp_codes WHERE chatId = ?').run(chatIdStr);
    return { valid: false, error: 'OTP kadaluarsa' };
  }
  
  // Check attempts (max 3 wrong attempts)
  const attempts = (row.attempts || 0) + 1;
  if (attempts > 3) {
    db.prepare('DELETE FROM otp_codes WHERE chatId = ?').run(chatIdStr);
    return { valid: false, error: 'Terlalu banyak percobaan salah' };
  }
  
  // Verify code
  if (row.code !== code) {
    db.prepare('UPDATE otp_codes SET attempts = ?, lastAttemptAt = ? WHERE chatId = ?')
      .run(attempts, now.toISOString(), chatIdStr);
    return { valid: false, error: 'OTP salah', attemptsLeft: 3 - attempts };
  }
  
  // OTP valid - delete it (one-time use)
  db.prepare('DELETE FROM otp_codes WHERE chatId = ?').run(chatIdStr);
  return { valid: true };
};

// Session operations (5-hour validity)
export const createSession = (chatId: string) => {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + SESSION_DURATION_HOURS * 60 * 60 * 1000);
  db.prepare('INSERT OR REPLACE INTO sessions (chatId, isAuthenticated, createdAt, lastActive) VALUES (?, 0, ?, ?)')
    .run(chatId.toString(), now.toISOString(), expiresAt.toISOString());
};

export const authenticateSession = (chatId: string): string => {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + SESSION_DURATION_HOURS * 60 * 60 * 1000);
  const expiresAtStr = expiresAt.toISOString();
  db.prepare('UPDATE sessions SET isAuthenticated = 1, lastActive = ? WHERE chatId = ?')
    .run(expiresAtStr, chatId.toString());
  return expiresAtStr; // Return expiry time for client
};

export const isSessionAuthenticated = (chatId: string): boolean => {
  const row = db.prepare('SELECT isAuthenticated, lastActive FROM sessions WHERE chatId = ?').get(chatId.toString()) as any;
  if (!row || row.isAuthenticated !== 1) return false;
  
  // Check if session expired (5 hours)
  const expiresAt = new Date(row.lastActive);
  if (new Date() > expiresAt) {
    db.prepare('UPDATE sessions SET isAuthenticated = 0 WHERE chatId = ?').run(chatId.toString());
    return false;
  }
  
  return true;
};

// User operations
export const registerUser = (username: string, chatId: string, firstName?: string) => {
  const now = new Date().toISOString();
  db.prepare('INSERT OR REPLACE INTO users (username, chatId, firstName, updatedAt) VALUES (?, ?, ?, ?)')
    .run(username.toLowerCase(), chatId, firstName || null, now);
};

export const getChatIdByUsername = (username: string): string | undefined => {
  const row = db.prepare('SELECT chatId FROM users WHERE username = ?').get(username.toLowerCase()) as { chatId: string } | undefined;
  return row?.chatId;
};

// Account management
export const addAccount = (account: Account) => {
  db.prepare('INSERT INTO accounts (id, name, type, balance, icon) VALUES (?, ?, ?, ?, ?)')
    .run(account.id, account.name, account.type, account.balance, account.icon);
};

export const deleteAccount = (id: string) => {
  db.prepare('DELETE FROM transactions WHERE accountId = ?').run(id);
  db.prepare('DELETE FROM accounts WHERE id = ?').run(id);
};

export const updateAccount = (id: string, updates: Partial<Account>) => {
  const fields: string[] = [];
  const values: any[] = [];
  
  if (updates.name !== undefined) { fields.push('name = ?'); values.push(updates.name); }
  if (updates.type !== undefined) { fields.push('type = ?'); values.push(updates.type); }
  if (updates.balance !== undefined) { fields.push('balance = ?'); values.push(updates.balance); }
  if (updates.icon !== undefined) { fields.push('icon = ?'); values.push(updates.icon); }
  
  if (fields.length > 0) {
    values.push(id);
    db.prepare(`UPDATE accounts SET ${fields.join(', ')} WHERE id = ?`).run(...values);
  }
};

// Transaction reports
export const getTransactionsByDateRange = (startDate: string, endDate: string): Transaction[] => {
  return db.prepare(
    'SELECT * FROM transactions WHERE date >= ? AND date <= ? ORDER BY date DESC'
  ).all(startDate, endDate) as Transaction[];
};

export const getTransactionsByDate = (date: string): Transaction[] => {
  const startOfDay = `${date}T00:00:00.000Z`;
  const endOfDay = `${date}T23:59:59.999Z`;
  return db.prepare(
    'SELECT * FROM transactions WHERE date >= ? AND date <= ? ORDER BY date DESC'
  ).all(startOfDay, endOfDay) as Transaction[];
};

// Full state for API
export const getFullState = (): Omit<AppState, 'logs' | 'isLocked' | 'otpCode'> => {
  return {
    accounts: getAccounts(),
    transactions: getTransactions(),
    goals: getGoals(),
    budgets: getBudgets()
  };
};

// Category operations
export interface Category {
  id: string;
  name: string;
  icon: string;
  keywords: string;
  type: 'Income' | 'Expense';
}

export const getCategories = (): Category[] => {
  return db.prepare('SELECT * FROM categories ORDER BY name').all() as Category[];
};

export const getCategoryById = (id: string): Category | undefined => {
  return db.prepare('SELECT * FROM categories WHERE id = ?').get(id) as Category | undefined;
};

export const getCategoryByName = (name: string): Category | undefined => {
  return db.prepare('SELECT * FROM categories WHERE LOWER(name) = ?').get(name.toLowerCase()) as Category | undefined;
};

export const addCategory = (category: Category) => {
  db.prepare('INSERT INTO categories (id, name, icon, keywords, type) VALUES (?, ?, ?, ?, ?)')
    .run(category.id, category.name, category.icon, category.keywords, category.type);
};

export const updateCategory = (id: string, updates: Partial<Category>) => {
  const fields: string[] = [];
  const values: any[] = [];
  
  if (updates.name !== undefined) { fields.push('name = ?'); values.push(updates.name); }
  if (updates.icon !== undefined) { fields.push('icon = ?'); values.push(updates.icon); }
  if (updates.keywords !== undefined) { fields.push('keywords = ?'); values.push(updates.keywords); }
  if (updates.type !== undefined) { fields.push('type = ?'); values.push(updates.type); }
  
  if (fields.length > 0) {
    values.push(id);
    db.prepare(`UPDATE categories SET ${fields.join(', ')} WHERE id = ?`).run(...values);
  }
};

export const deleteCategory = (id: string) => {
  db.prepare('DELETE FROM categories WHERE id = ?').run(id);
};

// Auto-classify transaction based on keywords
export const classifyTransaction = (text: string, transactionType: 'Income' | 'Expense' = 'Expense'): string => {
  const lowerText = text.toLowerCase();
  const categories = getCategories().filter(c => c.type === transactionType || transactionType === 'Expense');
  
  let bestMatch: { category: string; score: number } = { category: 'Other', score: 0 };
  
  for (const category of categories) {
    const keywords = category.keywords.split(',').map(k => k.trim().toLowerCase());
    let score = 0;
    
    for (const keyword of keywords) {
      if (keyword && lowerText.includes(keyword)) {
        // Longer keyword matches get higher score
        score += keyword.length;
      }
    }
    
    if (score > bestMatch.score) {
      bestMatch = { category: category.name, score };
    }
  }
  
  return bestMatch.category;
};

// Clear all data
export const clearAllData = () => {
  db.prepare('DELETE FROM transactions').run();
  db.prepare('DELETE FROM accounts').run();
  db.prepare('DELETE FROM goals').run();
  db.prepare('DELETE FROM budgets').run();
};

// Clear only transactions (keep accounts, goals, budgets)
export const clearAllTransactions = () => {
  db.prepare('DELETE FROM transactions').run();
};

// Sync functions for web -> database synchronization
export const syncAccounts = (accounts: Account[]) => {
  db.prepare('DELETE FROM accounts').run();
  const insert = db.prepare('INSERT INTO accounts (id, name, type, balance, icon) VALUES (?, ?, ?, ?, ?)');
  for (const acc of accounts) {
    insert.run(acc.id, acc.name, acc.type, acc.balance, acc.icon);
  }
};

export const syncTransactions = (transactions: Transaction[]) => {
  db.prepare('DELETE FROM transactions').run();
  const insert = db.prepare('INSERT INTO transactions (id, accountId, toAccountId, amount, type, category, date, note) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
  for (const tx of transactions) {
    insert.run(tx.id, tx.accountId, tx.toAccountId || null, tx.amount, tx.type, tx.category, tx.date, tx.note);
  }
};

export const syncGoals = (goals: Goal[]) => {
  db.prepare('DELETE FROM goals').run();
  const insert = db.prepare('INSERT INTO goals (id, name, targetAmount, currentAmount, deadline, icon, color) VALUES (?, ?, ?, ?, ?, ?, ?)');
  for (const goal of goals) {
    insert.run(goal.id, goal.name, goal.targetAmount, goal.currentAmount, goal.deadline || null, goal.icon, goal.color);
  }
};

export const syncBudgets = (budgets: Budget[]) => {
  db.prepare('DELETE FROM budgets').run();
  const insert = db.prepare('INSERT INTO budgets (category, budgetLimit, spent) VALUES (?, ?, ?)');
  for (const budget of budgets) {
    insert.run(budget.category, budget.limit, budget.spent);
  }
};

export default db;
