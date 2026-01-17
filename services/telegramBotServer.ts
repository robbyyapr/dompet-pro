import express, { Request, Response } from 'express';
import TelegramBot from 'node-telegram-bot-api';
import * as db from './database';
import { Transaction, Account, Goal, Budget } from '../types';
import { parseTelegramCommand, ParsedCommand } from './geminiService';

const app = express();
app.use(express.json());

const botToken = process.env.TELEGRAM_BOT_TOKEN;
const webhookUrl = process.env.TELEGRAM_WEBHOOK_URL;
const webBaseUrl = process.env.VITE_BASE_URL || process.env.VITE_API_BASE_URL;
const bot = botToken ? new TelegramBot(botToken, { polling: false }) : null;

// User state for multi-step interactions
interface UserState {
  action?: string;
  step?: number;
  data?: any;
  lastBotMessageId?: number;
  lastUserMessageId?: number;
}
const userStates = new Map<string, UserState>();

// Helper to delete messages silently
const deleteMessageSafe = async (chatId: string, messageId: number) => {
  try {
    await bot?.deleteMessage(chatId, messageId);
  } catch (e) {
    // Ignore errors (message might be too old or already deleted)
  }
};

// Clean old messages - keep only the last bot message
const cleanChat = async (chatId: string, keepMessageId?: number) => {
  const state = userStates.get(chatId);
  if (state?.lastUserMessageId) {
    await deleteMessageSafe(chatId, state.lastUserMessageId);
  }
};

const formatCurrency = (amount: number): string => {
  return `Rp ${amount.toLocaleString('id-ID')}`;
};

const parseAmount = (text: string): number | null => {
  const cleaned = text.toLowerCase().replace(/[^\d.,kjtrb]/g, '');
  let amount = parseFloat(cleaned.replace(/,/g, '.'));
  if (text.toLowerCase().includes('k')) amount *= 1000;
  if (text.toLowerCase().includes('jt') || text.toLowerCase().includes('j')) amount *= 1000000;
  if (text.toLowerCase().includes('rb') || text.toLowerCase().includes('r')) amount *= 1000;
  if (text.toLowerCase().includes('m') && !text.toLowerCase().includes('jt')) amount *= 1000000;
  if (text.toLowerCase().includes('b') || text.toLowerCase().includes('t')) amount *= 1000000000;
  return isNaN(amount) ? null : amount;
};

// Keyboard builders with beautiful design
const buildMainMenuKeyboard = (): TelegramBot.InlineKeyboardMarkup => ({
  inline_keyboard: [
    [
      { text: '💰 Cek Saldo', callback_data: 'menu_balance' },
      { text: '📜 Riwayat', callback_data: 'menu_list' }
    ],
    [
      { text: '🏦 Akun', callback_data: 'menu_accounts' },
      { text: '📊 Laporan', callback_data: 'menu_report' }
    ],
    [
      { text: '🎯 Goals', callback_data: 'menu_goals' },
      { text: '💸 Budget', callback_data: 'menu_budgets' }
    ],
    [
      { text: '🏷️ Kategori', callback_data: 'menu_categories' },
      { text: '📖 Bantuan', callback_data: 'menu_help' }
    ],
    [
      { text: '🗑️ Hapus Semua Data', callback_data: 'menu_clear_all' }
    ],
    ...(webBaseUrl ? [[{ text: '🌐 Buka Dashboard Web', url: webBaseUrl }]] : [])
  ]
});

const buildBackButton = (target: string): TelegramBot.InlineKeyboardButton[] => [
  { text: '⬅️ Kembali', callback_data: target }
];

const buildAccountsMenuKeyboard = (): TelegramBot.InlineKeyboardMarkup => ({
  inline_keyboard: [
    [
      { text: '💰 Edit Saldo', callback_data: 'acc_edit_balance' },
      { text: '➕ Tambah Akun', callback_data: 'acc_add' }
    ],
    [
      { text: '🗑️ Hapus Akun', callback_data: 'acc_delete' },
      { text: '📋 List Akun', callback_data: 'acc_list' }
    ],
    buildBackButton('back_main')
  ]
});

const buildAccountSelectKeyboard = (action: string): TelegramBot.InlineKeyboardMarkup => {
  const accounts = db.getAccounts();
  const buttons: TelegramBot.InlineKeyboardButton[][] = [];
  for (let i = 0; i < accounts.length; i += 2) {
    const row: TelegramBot.InlineKeyboardButton[] = [];
    row.push({ text: `${accounts[i].icon} ${accounts[i].name}`, callback_data: `${action}_${accounts[i].id}` });
    if (accounts[i + 1]) {
      row.push({ text: `${accounts[i + 1].icon} ${accounts[i + 1].name}`, callback_data: `${action}_${accounts[i + 1].id}` });
    }
    buttons.push(row);
  }
  buttons.push(buildBackButton('menu_accounts'));
  return { inline_keyboard: buttons };
};

const buildReportMenuKeyboard = (): TelegramBot.InlineKeyboardMarkup => ({
  inline_keyboard: [
    [
      { text: '📅 Hari Ini', callback_data: 'report_today' },
      { text: '📆 Kemarin', callback_data: 'report_yesterday' }
    ],
    [
      { text: '📊 Minggu Ini', callback_data: 'report_week' },
      { text: '📈 Bulan Ini', callback_data: 'report_month' }
    ],
    [
      { text: '🗓️ Tanggal Tertentu', callback_data: 'report_date' },
      { text: '📉 Range Tanggal', callback_data: 'report_range' }
    ],
    buildBackButton('back_main')
  ]
});

const buildAccountTypeKeyboard = (): TelegramBot.InlineKeyboardMarkup => ({
  inline_keyboard: [
    [
      { text: '🏦 Bank', callback_data: 'type_Bank' },
      { text: '📱 E-Wallet', callback_data: 'type_E-Wallet' }
    ],
    [
      { text: '💵 Cash', callback_data: 'type_Cash' },
      { text: '💳 Credit', callback_data: 'type_Credit' }
    ],
    buildBackButton('menu_accounts')
  ]
});

const buildConfirmKeyboard = (yesCallback: string, noCallback: string): TelegramBot.InlineKeyboardMarkup => ({
  inline_keyboard: [
    [
      { text: '✅ Ya', callback_data: yesCallback },
      { text: '❌ Tidak', callback_data: noCallback }
    ]
  ]
});

// Goals menu keyboards
const buildGoalsMenuKeyboard = (): TelegramBot.InlineKeyboardMarkup => ({
  inline_keyboard: [
    [
      { text: '➕ Tambah Goal', callback_data: 'goal_add' },
      { text: '📋 List Goals', callback_data: 'goal_list' }
    ],
    [
      { text: '✏️ Edit Goal', callback_data: 'goal_edit' },
      { text: '🗑️ Hapus Goal', callback_data: 'goal_delete' }
    ],
    [
      { text: '💰 Tambah Tabungan', callback_data: 'goal_add_amount' }
    ],
    buildBackButton('back_main')
  ]
});

const buildGoalSelectKeyboard = (action: string): TelegramBot.InlineKeyboardMarkup => {
  const goals = db.getGoals();
  const buttons: TelegramBot.InlineKeyboardButton[][] = [];
  for (const goal of goals) {
    buttons.push([{ text: `${goal.icon} ${goal.name} (${Math.round(goal.currentAmount/goal.targetAmount*100)}%)`, callback_data: `${action}_${goal.id}` }]);
  }
  buttons.push(buildBackButton('menu_goals'));
  return { inline_keyboard: buttons };
};

const GOAL_ICONS = ['🎯', '🛡️', '🏠', '🚗', '✈️', '💻', '📱', '💰', '🎓', '💍'];
const GOAL_COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#ec4899'];

const buildGoalIconKeyboard = (): TelegramBot.InlineKeyboardMarkup => {
  const buttons: TelegramBot.InlineKeyboardButton[][] = [];
  for (let i = 0; i < GOAL_ICONS.length; i += 5) {
    const row = GOAL_ICONS.slice(i, i + 5).map(icon => ({ text: icon, callback_data: `gicon_${icon}` }));
    buttons.push(row);
  }
  buttons.push(buildBackButton('menu_goals'));
  return { inline_keyboard: buttons };
};

const buildGoalColorKeyboard = (): TelegramBot.InlineKeyboardMarkup => {
  const colorNames: Record<string, string> = {
    '#10b981': '🟢', '#3b82f6': '🔵', '#8b5cf6': '🟣', 
    '#f59e0b': '🟠', '#ef4444': '🔴', '#ec4899': '🩷'
  };
  const buttons: TelegramBot.InlineKeyboardButton[][] = [];
  const row = GOAL_COLORS.map(color => ({ text: colorNames[color], callback_data: `gcolor_${color}` }));
  buttons.push(row);
  buttons.push(buildBackButton('menu_goals'));
  return { inline_keyboard: buttons };
};

// Budget menu keyboards
const buildBudgetsMenuKeyboard = (): TelegramBot.InlineKeyboardMarkup => ({
  inline_keyboard: [
    [
      { text: '➕ Tambah Budget', callback_data: 'budget_add' },
      { text: '📋 List Budgets', callback_data: 'budget_list' }
    ],
    [
      { text: '✏️ Edit Budget', callback_data: 'budget_edit' },
      { text: '🗑️ Hapus Budget', callback_data: 'budget_delete' }
    ],
    [
      { text: '🔄 Reset Semua', callback_data: 'budget_reset_all' }
    ],
    buildBackButton('back_main')
  ]
});

const buildBudgetSelectKeyboard = (action: string): TelegramBot.InlineKeyboardMarkup => {
  const budgets = db.getBudgets();
  const buttons: TelegramBot.InlineKeyboardButton[][] = [];
  for (const budget of budgets) {
    const pct = Math.round(budget.spent / budget.limit * 100);
    const status = pct >= 100 ? '🔴' : pct >= 85 ? '🟠' : '🟢';
    buttons.push([{ text: `${status} ${budget.category} (${pct}%)`, callback_data: `${action}_${budget.category}` }]);
  }
  buttons.push(buildBackButton('menu_budgets'));
  return { inline_keyboard: buttons };
};

const buildBudgetCategoryKeyboard = (): TelegramBot.InlineKeyboardMarkup => {
  const existingCategories = db.getBudgets().map(b => b.category);
  const categories = db.getCategories().filter(c => c.type === 'Expense');
  const availableCategories = categories.filter(c => !existingCategories.includes(c.name));
  const buttons: TelegramBot.InlineKeyboardButton[][] = [];
  for (let i = 0; i < availableCategories.length; i += 2) {
    const row: TelegramBot.InlineKeyboardButton[] = [];
    row.push({ text: `${availableCategories[i].icon} ${availableCategories[i].name}`, callback_data: `bcat_${availableCategories[i].name}` });
    if (availableCategories[i + 1]) {
      row.push({ text: `${availableCategories[i + 1].icon} ${availableCategories[i + 1].name}`, callback_data: `bcat_${availableCategories[i + 1].name}` });
    }
    buttons.push(row);
  }
  buttons.push(buildBackButton('menu_budgets'));
  return { inline_keyboard: buttons };
};

// Category menu keyboards
const buildCategoriesMenuKeyboard = (): TelegramBot.InlineKeyboardMarkup => ({
  inline_keyboard: [
    [
      { text: '➕ Tambah Kategori', callback_data: 'cat_add' },
      { text: '📋 List Kategori', callback_data: 'cat_list' }
    ],
    [
      { text: '✏️ Edit Kategori', callback_data: 'cat_edit' },
      { text: '🗑️ Hapus Kategori', callback_data: 'cat_delete' }
    ],
    [
      { text: '🔑 Edit Keywords', callback_data: 'cat_keywords' }
    ],
    buildBackButton('back_main')
  ]
});

const buildCategorySelectKeyboard = (action: string): TelegramBot.InlineKeyboardMarkup => {
  const categories = db.getCategories();
  const buttons: TelegramBot.InlineKeyboardButton[][] = [];
  for (let i = 0; i < categories.length; i += 2) {
    const row: TelegramBot.InlineKeyboardButton[] = [];
    row.push({ text: `${categories[i].icon} ${categories[i].name}`, callback_data: `${action}_${categories[i].id}` });
    if (categories[i + 1]) {
      row.push({ text: `${categories[i + 1].icon} ${categories[i + 1].name}`, callback_data: `${action}_${categories[i + 1].id}` });
    }
    buttons.push(row);
  }
  buttons.push(buildBackButton('menu_categories'));
  return { inline_keyboard: buttons };
};

const buildCategoryTypeKeyboard = (): TelegramBot.InlineKeyboardMarkup => ({
  inline_keyboard: [
    [
      { text: '📉 Expense (Pengeluaran)', callback_data: 'cattype_Expense' },
    ],
    [
      { text: '📈 Income (Pemasukan)', callback_data: 'cattype_Income' },
    ],
    buildBackButton('menu_categories')
  ]
});

const CATEGORY_ICONS = ['🍔', '🚗', '🛍️', '📄', '🏥', '🎬', '📚', '📈', '💼', '🎁', '💻', '🏠', '✈️', '🎮', '💰', '📦'];

// Generate report text
const generateReportText = (transactions: Transaction[], title: string): string => {
  if (transactions.length === 0) {
    return `📊 *${title}*\n\n📭 Tidak ada transaksi.`;
  }

  let totalIncome = 0;
  let totalExpense = 0;
  let text = `📊 *${title}*\n\n`;

  for (const tx of transactions) {
    const acc = db.getAccountById(tx.accountId);
    const icon = tx.type === 'Income' ? '📈' : tx.type === 'Expense' ? '📉' : '🔄';
    const date = new Date(tx.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
    
    text += `${icon} ${tx.note}\n`;
    text += `   ${formatCurrency(tx.amount)} • ${acc?.name || '-'}\n`;
    text += `   _${date}_\n\n`;

    if (tx.type === 'Income') totalIncome += tx.amount;
    if (tx.type === 'Expense') totalExpense += tx.amount;
  }

  text += `━━━━━━━━━━━━━━━\n`;
  text += `📈 Pemasukan: ${formatCurrency(totalIncome)}\n`;
  text += `📉 Pengeluaran: ${formatCurrency(totalExpense)}\n`;
  text += `💰 Selisih: ${formatCurrency(totalIncome - totalExpense)}`;

  return text;
};

// Response type
type BotResponse = { 
  text: string; 
  options?: TelegramBot.SendMessageOptions;
  editMessageId?: number;
};

// Handle text commands
const handleCommand = async (chatId: string, text: string, messageId?: number): Promise<BotResponse> => {
  const state = userStates.get(chatId);
  const lowerText = text.toLowerCase().trim();

  // Handle multi-step interactions
  if (state?.action) {
    return handleStateInput(chatId, text, state);
  }

  // Parse commands
  if (lowerText === '/start' || lowerText === '/help') {
    return {
      text: `━━━━━━━━━━━━━━━━━━━━\n` +
        `    🤖 *DOMPET PRO v4.1*\n` +
        `    _Smart Finance Manager_\n` +
        `━━━━━━━━━━━━━━━━━━━━\n\n` +
        `Selamat datang! 👋\n\n` +
        `*📝 Cara Catat Transaksi:*\n` +
        `• _"Beli kopi 25rb BCA"_\n` +
        `• _"Gaji 10jt ke Mandiri"_\n` +
        `• _"Transfer 500rb BCA ke Gopay"_\n\n` +
        `*⚡ Quick Commands:*\n` +
        `/saldo • /riwayat • /otp`,
      options: { reply_markup: buildMainMenuKeyboard() }
    };
  }

  if (lowerText === '/otp' || lowerText === 'otp') {
    const code = db.generateOTP(chatId);
    db.createSession(chatId);
    return { 
      text: `🔐 *Kode OTP Anda:*\n\n\`${code}\`\n\n⏰ Berlaku 5 menit`,
      options: { reply_markup: { inline_keyboard: [buildBackButton('back_main')] } }
    };
  }

  if (lowerText.startsWith('/verify ') || lowerText.startsWith('verify ')) {
    const code = lowerText.replace(/^\/?verify\s+/, '').trim();
    const isValid = db.verifyOTP(chatId, code);
    if (isValid) {
      db.authenticateSession(chatId);
      return { text: '✅ Verifikasi berhasil! Sesi Anda sudah aktif.' };
    }
    return { text: '❌ Kode OTP salah atau kadaluarsa.' };
  }

  if (lowerText === '/saldo' || lowerText === '/balance' || lowerText === 'saldo') {
    return buildBalanceResponse();
  }

  if (lowerText === '/riwayat' || lowerText === '/list' || lowerText === 'riwayat') {
    return buildListResponse();
  }

  if (lowerText === '/akun' || lowerText === '/accounts') {
    return {
      text: '🏦 *Kelola Akun*\n\nPilih aksi:',
      options: { reply_markup: buildAccountsMenuKeyboard() }
    };
  }

  if (lowerText === '/laporan' || lowerText === '/report') {
    return {
      text: '📊 *Laporan Keuangan*\n\nPilih periode:',
      options: { reply_markup: buildReportMenuKeyboard() }
    };
  }

  if (lowerText.startsWith('/hapus ') || lowerText.startsWith('hapus ')) {
    const query = lowerText.replace(/^\/?hapus\s+/, '').trim();
    return handleDeleteTransaction(query);
  }

  // Try to parse as transaction
  try {
    const parsed = await parseTelegramCommand(text);
    if (parsed) {
      return await handleAddTransaction(parsed);
    }
  } catch (error) {
    console.error('Parse error:', error);
  }

  return { 
    text: '❓ Tidak dikenali. Ketik /help untuk bantuan.',
    options: { reply_markup: buildMainMenuKeyboard() }
  };
};

// Handle state-based input
const handleStateInput = async (chatId: string, text: string, state: UserState): Promise<BotResponse> => {
  const clearState = () => userStates.delete(chatId);

  switch (state.action) {
    case 'edit_balance': {
      const amount = parseAmount(text);
      if (amount === null) {
        return { text: '❌ Format nominal tidak valid. Coba lagi (contoh: 500rb, 1.5jt):' };
      }
      const account = db.getAccountById(state.data.accountId);
      if (!account) {
        clearState();
        return { text: '❌ Akun tidak ditemukan.' };
      }
      db.updateAccountBalance(account.id, amount);
      clearState();
      return {
        text: `✅ *Saldo Diperbarui*\n\n${account.icon} ${account.name}\n💰 Saldo baru: ${formatCurrency(amount)}`,
        options: { reply_markup: { inline_keyboard: [buildBackButton('menu_accounts')] } }
      };
    }

    case 'add_account': {
      if (state.step === 1) {
        state.data = { name: text };
        state.step = 2;
        userStates.set(chatId, state);
        return {
          text: `📝 Nama: *${text}*\n\nPilih tipe akun:`,
          options: { reply_markup: buildAccountTypeKeyboard() }
        };
      }
      if (state.step === 3) {
        const amount = parseAmount(text);
        if (amount === null) {
          return { text: '❌ Format nominal tidak valid. Masukkan saldo awal (contoh: 500rb):' };
        }
        const iconMap: Record<string, string> = {
          'Bank': '🏦', 'E-Wallet': '📱', 'Cash': '💵', 'Credit': '💳'
        };
        const newAccount: Account = {
          id: Math.random().toString(36).slice(2, 9),
          name: state.data.name,
          type: state.data.type,
          balance: amount,
          icon: iconMap[state.data.type] || '💰'
        };
        db.addAccount(newAccount);
        clearState();
        return {
          text: `✅ *Akun Ditambahkan*\n\n${newAccount.icon} ${newAccount.name}\n📂 Tipe: ${newAccount.type}\n💰 Saldo: ${formatCurrency(amount)}`,
          options: { reply_markup: { inline_keyboard: [buildBackButton('menu_accounts')] } }
        };
      }
      break;
    }

    case 'report_date': {
      const dateMatch = text.match(/^(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})$/);
      if (!dateMatch) {
        return { text: '❌ Format tanggal tidak valid. Gunakan format DD-MM-YYYY:' };
      }
      const [, day, month, year] = dateMatch;
      const dateStr = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      const transactions = db.getTransactionsByDate(dateStr);
      clearState();
      return {
        text: generateReportText(transactions, `Laporan ${day}/${month}/${year}`),
        options: { reply_markup: { inline_keyboard: [buildBackButton('menu_report')] } }
      };
    }

    case 'report_range': {
      if (state.step === 1) {
        const dateMatch = text.match(/^(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})$/);
        if (!dateMatch) {
          return { text: '❌ Format tidak valid. Masukkan tanggal mulai (DD-MM-YYYY):' };
        }
        const [, day, month, year] = dateMatch;
        state.data = { startDate: `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}` };
        state.step = 2;
        userStates.set(chatId, state);
        return { text: '📅 Masukkan tanggal akhir (DD-MM-YYYY):' };
      }
      if (state.step === 2) {
        const dateMatch = text.match(/^(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})$/);
        if (!dateMatch) {
          return { text: '❌ Format tidak valid. Masukkan tanggal akhir (DD-MM-YYYY):' };
        }
        const [, day, month, year] = dateMatch;
        const endDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        const transactions = db.getTransactionsByDateRange(
          `${state.data.startDate}T00:00:00.000Z`,
          `${endDate}T23:59:59.999Z`
        );
        clearState();
        return {
          text: generateReportText(transactions, `Laporan ${state.data.startDate} s/d ${endDate}`),
          options: { reply_markup: { inline_keyboard: [buildBackButton('menu_report')] } }
        };
      }
      break;
    }

    // Goal states
    case 'add_goal': {
      if (state.step === 1) {
        state.data = { ...state.data, name: text };
        state.step = 2;
        userStates.set(chatId, state);
        return { 
          text: `📝 Nama: *${text}*\n\nMasukkan target nominal:`,
          options: { reply_markup: { inline_keyboard: [buildBackButton('menu_goals')] } }
        };
      }
      if (state.step === 2) {
        const amount = parseAmount(text);
        if (amount === null) {
          return { text: '❌ Format nominal tidak valid. Coba lagi (contoh: 10jt):' };
        }
        state.data = { ...state.data, targetAmount: amount };
        state.step = 3;
        userStates.set(chatId, state);
        return {
          text: `📝 Nama: *${state.data.name}*\n💰 Target: ${formatCurrency(amount)}\n\nPilih icon:`,
          options: { reply_markup: buildGoalIconKeyboard() }
        };
      }
      break;
    }

    case 'edit_goal': {
      const amount = parseAmount(text);
      if (amount === null) {
        return { text: '❌ Format nominal tidak valid. Coba lagi:' };
      }
      const goal = db.getGoalById(state.data.goalId);
      if (!goal) {
        clearState();
        return { text: '❌ Goal tidak ditemukan.' };
      }
      db.updateGoal(goal.id, { targetAmount: amount });
      clearState();
      return {
        text: `✅ *Goal Diperbarui*\n\n${goal.icon} ${goal.name}\n💰 Target baru: ${formatCurrency(amount)}`,
        options: { reply_markup: { inline_keyboard: [buildBackButton('menu_goals')] } }
      };
    }

    case 'add_to_goal': {
      const amount = parseAmount(text);
      if (amount === null) {
        return { text: '❌ Format nominal tidak valid. Coba lagi:' };
      }
      const goal = db.getGoalById(state.data.goalId);
      if (!goal) {
        clearState();
        return { text: '❌ Goal tidak ditemukan.' };
      }
      db.addToGoal(goal.id, amount);
      const updated = db.getGoalById(goal.id);
      clearState();
      return {
        text: `✅ *Tabungan Ditambahkan*\n\n${goal.icon} ${goal.name}\n➕ Ditambah: ${formatCurrency(amount)}\n💰 Total: ${formatCurrency(updated?.currentAmount || 0)}/${formatCurrency(goal.targetAmount)}`,
        options: { reply_markup: { inline_keyboard: [buildBackButton('menu_goals')] } }
      };
    }

    // Budget states
    case 'add_budget': {
      const amount = parseAmount(text);
      if (amount === null) {
        return { text: '❌ Format nominal tidak valid. Masukkan limit budget (contoh: 3jt):' };
      }
      const newBudget: Budget = {
        category: state.data.category,
        limit: amount,
        spent: 0
      };
      db.addBudget(newBudget);
      clearState();
      return {
        text: `✅ *Budget Ditambahkan*\n\n📂 ${newBudget.category}\n💰 Limit: ${formatCurrency(amount)}`,
        options: { reply_markup: { inline_keyboard: [buildBackButton('menu_budgets')] } }
      };
    }

    case 'edit_budget': {
      const amount = parseAmount(text);
      if (amount === null) {
        return { text: '❌ Format nominal tidak valid. Masukkan limit baru:' };
      }
      db.updateBudget(state.data.category, { limit: amount });
      clearState();
      return {
        text: `✅ *Budget Diperbarui*\n\n📂 ${state.data.category}\n💰 Limit baru: ${formatCurrency(amount)}`,
        options: { reply_markup: { inline_keyboard: [buildBackButton('menu_budgets')] } }
      };
    }

    // Category states
    case 'add_category': {
      if (state.step === 1) {
        state.data = { ...state.data, name: text.trim() };
        state.step = 2;
        userStates.set(chatId, state);
        return {
          text: `📝 Nama: *${text}*\n\nPilih tipe kategori:`,
          options: { reply_markup: buildCategoryTypeKeyboard() }
        };
      }
      if (state.step === 3) {
        // Keywords input
        const newCategory: db.Category = {
          id: Math.random().toString(36).slice(2, 9),
          name: state.data.name,
          icon: state.data.icon,
          keywords: text.toLowerCase().split(',').map((k: string) => k.trim()).join(','),
          type: state.data.type
        };
        db.addCategory(newCategory);
        clearState();
        return {
          text: `✅ *Kategori Ditambahkan*\n\n${newCategory.icon} ${newCategory.name}\n📝 Tipe: ${newCategory.type}\n🔑 Keywords: ${newCategory.keywords}`,
          options: { reply_markup: { inline_keyboard: [buildBackButton('menu_categories')] } }
        };
      }
      break;
    }

    case 'edit_category_name': {
      const category = db.getCategoryById(state.data.categoryId);
      if (!category) {
        clearState();
        return { text: '❌ Kategori tidak ditemukan.' };
      }
      db.updateCategory(category.id, { name: text.trim() });
      clearState();
      return {
        text: `✅ *Kategori Diperbarui*\n\n${category.icon} ${text.trim()}`,
        options: { reply_markup: { inline_keyboard: [buildBackButton('menu_categories')] } }
      };
    }

    case 'edit_category_keywords': {
      const category = db.getCategoryById(state.data.categoryId);
      if (!category) {
        clearState();
        return { text: '❌ Kategori tidak ditemukan.' };
      }
      const keywords = text.toLowerCase().split(',').map((k: string) => k.trim()).join(',');
      db.updateCategory(category.id, { keywords });
      clearState();
      return {
        text: `✅ *Keywords Diperbarui*\n\n${category.icon} ${category.name}\n🔑 Keywords baru:\n${keywords.split(',').slice(0, 10).join(', ')}${keywords.split(',').length > 10 ? '...' : ''}`,
        options: { reply_markup: { inline_keyboard: [buildBackButton('menu_categories')] } }
      };
    }
  }

  clearState();
  return { text: '❓ Sesi berakhir. Silakan mulai ulang.' };
};

// Build balance response
const buildBalanceResponse = (): BotResponse => {
  const accounts = db.getAccounts();
  const total = accounts.reduce((sum, acc) => sum + acc.balance, 0);
  let msg = `💰 *Saldo Akun:*\n\n`;
  for (const acc of accounts) {
    msg += `${acc.icon} ${acc.name}: ${formatCurrency(acc.balance)}\n`;
  }
  msg += `\n━━━━━━━━━━━━━━━\n📊 *Total:* ${formatCurrency(total)}`;
  return { 
    text: msg,
    options: { reply_markup: { inline_keyboard: [buildBackButton('back_main')] } }
  };
};

// Build list response
const buildListResponse = (): BotResponse => {
  const transactions = db.getTransactions().slice(0, 5);
  if (transactions.length === 0) {
    return { 
      text: '📭 Belum ada transaksi.',
      options: { reply_markup: { inline_keyboard: [buildBackButton('back_main')] } }
    };
  }
  let msg = `📋 *5 Transaksi Terakhir:*\n\n`;
  for (const tx of transactions) {
    const acc = db.getAccountById(tx.accountId);
    const icon = tx.type === 'Income' ? '📈' : tx.type === 'Expense' ? '📉' : '🔄';
    const date = new Date(tx.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
    msg += `${icon} \`${tx.id}\`\n   ${tx.note} - ${formatCurrency(tx.amount)}\n   _${acc?.name || '-'} • ${date}_\n\n`;
  }
  return { 
    text: msg,
    options: { reply_markup: { inline_keyboard: [buildBackButton('back_main')] } }
  };
};

// Handle delete transaction
const handleDeleteTransaction = (query: string): BotResponse => {
  let txToDelete = db.getTransactionById(query);
  if (!txToDelete) {
    const results = db.searchTransactions(query);
    if (results.length === 0) {
      return { text: `❌ Transaksi "${query}" tidak ditemukan.` };
    }
    if (results.length > 1) {
      let msg = `⚠️ Ditemukan ${results.length} transaksi:\n\n`;
      for (const tx of results.slice(0, 5)) {
        msg += `• \`${tx.id}\` - ${tx.note} (${formatCurrency(tx.amount)})\n`;
      }
      msg += `\nGunakan: /hapus [id]`;
      return { text: msg };
    }
    txToDelete = results[0];
  }

  const acc = db.getAccountById(txToDelete.accountId);
  if (acc) {
    if (txToDelete.type === 'Expense') db.updateAccountBalance(acc.id, acc.balance + txToDelete.amount);
    else if (txToDelete.type === 'Income') db.updateAccountBalance(acc.id, acc.balance - txToDelete.amount);
  }
  db.deleteTransaction(txToDelete.id);
  
  return {
    text: `🗑️ *Transaksi Dihapus:*\n\n${txToDelete.note}\n${formatCurrency(txToDelete.amount)}\n\n_Saldo ${acc?.name} disesuaikan._`,
    options: { reply_markup: { inline_keyboard: [buildBackButton('back_main')] } }
  };
};

// Handle add transaction
const handleAddTransaction = async (parsed: ParsedCommand): Promise<BotResponse> => {
  const sourceAccount = db.getAccountByName(parsed.accountName);
  if (!sourceAccount) {
    const accounts = db.getAccounts();
    return { text: `❌ Akun "${parsed.accountName}" tidak ditemukan.\n\nAkun tersedia: ${accounts.map(a => a.name).join(', ')}` };
  }

  // Auto-classify category based on keywords
  const classifyType = parsed.type === 'Transfer' ? 'Expense' : parsed.type;
  const autoCategory = db.classifyTransaction(parsed.note, classifyType);
  const finalCategory = autoCategory !== 'Other' ? autoCategory : parsed.category;

  const transaction: Transaction = {
    id: Math.random().toString(36).slice(2, 9),
    accountId: sourceAccount.id,
    amount: parsed.amount,
    type: parsed.type,
    category: finalCategory,
    date: new Date().toISOString(),
    note: parsed.note
  };

  if (parsed.type === 'Expense') {
    db.updateAccountBalance(sourceAccount.id, sourceAccount.balance - parsed.amount);
  } else if (parsed.type === 'Income') {
    db.updateAccountBalance(sourceAccount.id, sourceAccount.balance + parsed.amount);
  } else if (parsed.type === 'Transfer' && parsed.toAccountName) {
    const targetAccount = db.getAccountByName(parsed.toAccountName);
    if (targetAccount) {
      db.updateAccountBalance(sourceAccount.id, sourceAccount.balance - parsed.amount);
      db.updateAccountBalance(targetAccount.id, targetAccount.balance + parsed.amount);
      transaction.toAccountId = targetAccount.id;
    }
  }

  const budgets = db.getBudgets();
  const budget = budgets.find(b => b.category.toLowerCase() === finalCategory.toLowerCase() && parsed.type === 'Expense');
  if (budget) db.updateBudgetSpent(budget.category, budget.spent + parsed.amount);

  db.addTransaction(transaction);

  const typeIcon = parsed.type === 'Income' ? '📈' : parsed.type === 'Expense' ? '📉' : '🔄';
  const newBalance = db.getAccountById(sourceAccount.id)?.balance || 0;
  const categoryInfo = db.getCategoryByName(finalCategory);
  const categoryDisplay = categoryInfo ? `${categoryInfo.icon} ${finalCategory}` : `🏷️ ${finalCategory}`;
  const autoClassifiedNote = autoCategory !== 'Other' && autoCategory !== parsed.category ? ' _(auto)_' : '';

  return {
    text: `${typeIcon} *${parsed.type} Tercatat!*\n\n💵 ${formatCurrency(parsed.amount)}\n📝 ${parsed.note}\n🏦 ${sourceAccount.name}\n${categoryDisplay}${autoClassifiedNote}\n🆔 \`${transaction.id}\`\n\n_Saldo: ${formatCurrency(newBalance)}_`,
    options: { reply_markup: { inline_keyboard: [buildBackButton('back_main')] } }
  };
};

// Handle callback queries
const resolveCallback = async (chatId: string, data: string, messageId: number): Promise<BotResponse & { shouldEdit: boolean }> => {
  // Back buttons
  if (data === 'back_main') {
    userStates.delete(chatId);
    return {
      text: `━━━━━━━━━━━━━━━━━━━━\n` +
        `    🤖 *DOMPET PRO v4.1*\n` +
        `━━━━━━━━━━━━━━━━━━━━\n\n` +
        `Pilih menu di bawah:`,
      options: { reply_markup: buildMainMenuKeyboard() },
      shouldEdit: true
    };
  }

  // Main menu
  if (data === 'menu_balance') {
    const response = buildBalanceResponse();
    return { ...response, shouldEdit: true };
  }
  if (data === 'menu_list') {
    const response = buildListResponse();
    return { ...response, shouldEdit: true };
  }
  if (data === 'menu_otp') {
    const code = db.generateOTP(chatId);
    db.createSession(chatId);
    return {
      text: `🔐 *Kode OTP Anda:*\n\n\`${code}\`\n\n⏰ Berlaku 5 menit`,
      options: { reply_markup: { inline_keyboard: [buildBackButton('back_main')] } },
      shouldEdit: true
    };
  }
  if (data === 'menu_help') {
    return {
      text: `━━━━━━━━━━━━━━━━━━━━\n` +
        `       📖 *PANDUAN*\n` +
        `━━━━━━━━━━━━━━━━━━━━\n\n` +
        `*💬 Catat Transaksi:*\n` +
        `• _"Beli kopi 25rb BCA"_\n` +
        `• _"Gaji 10jt ke BCA"_\n` +
        `• _"Transfer 500rb BCA ke Gopay"_\n\n` +
        `*⌨️ Perintah:*\n` +
        `• /saldo - Cek semua saldo\n` +
        `• /riwayat - 5 transaksi terakhir\n` +
        `• /hapus [id] - Hapus transaksi`,
      options: { reply_markup: { inline_keyboard: [buildBackButton('back_main')] } },
      shouldEdit: true
    };
  }

  // Clear all data menu
  if (data === 'menu_clear_all') {
    return {
      text: `🗑️ *Hapus Semua Data*\n\n⚠️ *PERINGATAN!*\n\nSemua data berikut akan dihapus:\n• Akun dan saldo\n• Transaksi\n• Goals\n• Budget\n\n*Tindakan ini tidak dapat dibatalkan!*\n\nYakin ingin menghapus?`,
      options: { reply_markup: buildConfirmKeyboard('confirm_clear_all', 'back_main') },
      shouldEdit: true
    };
  }

  if (data === 'confirm_clear_all') {
    db.clearAllData();
    return {
      text: `✅ *Data Berhasil Dihapus*\n\nSemua akun, transaksi, goals, dan budget telah dihapus.\n\nSilakan mulai dari awal atau sync dari web.`,
      options: { reply_markup: { inline_keyboard: [buildBackButton('back_main')] } },
      shouldEdit: true
    };
  }

  // Accounts menu
  if (data === 'menu_accounts') {
    userStates.delete(chatId);
    return {
      text: '🏦 *Kelola Akun*\n\nPilih aksi:',
      options: { reply_markup: buildAccountsMenuKeyboard() },
      shouldEdit: true
    };
  }
  if (data === 'acc_list') {
    const accounts = db.getAccounts();
    let msg = '📋 *Daftar Akun:*\n\n';
    for (const acc of accounts) {
      msg += `${acc.icon} *${acc.name}*\n   Tipe: ${acc.type}\n   Saldo: ${formatCurrency(acc.balance)}\n   ID: \`${acc.id}\`\n\n`;
    }
    return {
      text: msg,
      options: { reply_markup: { inline_keyboard: [buildBackButton('menu_accounts')] } },
      shouldEdit: true
    };
  }
  if (data === 'acc_edit_balance') {
    return {
      text: '💰 *Edit Saldo*\n\nPilih akun yang ingin diedit:',
      options: { reply_markup: buildAccountSelectKeyboard('sel_edit') },
      shouldEdit: true
    };
  }
  if (data === 'acc_add') {
    userStates.set(chatId, { action: 'add_account', step: 1, data: {} });
    return {
      text: '➕ *Tambah Akun Baru*\n\nMasukkan nama akun:',
      options: { reply_markup: { inline_keyboard: [buildBackButton('menu_accounts')] } },
      shouldEdit: true
    };
  }
  if (data === 'acc_delete') {
    return {
      text: '🗑️ *Hapus Akun*\n\n⚠️ Semua transaksi akun akan dihapus!\n\nPilih akun:',
      options: { reply_markup: buildAccountSelectKeyboard('sel_del') },
      shouldEdit: true
    };
  }

  // Account selection for edit balance
  if (data.startsWith('sel_edit_')) {
    const accountId = data.replace('sel_edit_', '');
    const account = db.getAccountById(accountId);
    if (!account) {
      return { text: '❌ Akun tidak ditemukan.', shouldEdit: true };
    }
    userStates.set(chatId, { action: 'edit_balance', data: { accountId } });
    return {
      text: `💰 *Edit Saldo*\n\n${account.icon} ${account.name}\nSaldo saat ini: ${formatCurrency(account.balance)}\n\nMasukkan saldo baru:`,
      options: { reply_markup: { inline_keyboard: [buildBackButton('menu_accounts')] } },
      shouldEdit: true
    };
  }

  // Account selection for delete
  if (data.startsWith('sel_del_')) {
    const accountId = data.replace('sel_del_', '');
    const account = db.getAccountById(accountId);
    if (!account) {
      return { text: '❌ Akun tidak ditemukan.', shouldEdit: true };
    }
    return {
      text: `🗑️ *Hapus Akun*\n\n${account.icon} ${account.name}\nSaldo: ${formatCurrency(account.balance)}\n\n⚠️ Yakin ingin menghapus?`,
      options: { reply_markup: buildConfirmKeyboard(`confirm_del_${accountId}`, 'menu_accounts') },
      shouldEdit: true
    };
  }

  // Confirm delete account
  if (data.startsWith('confirm_del_')) {
    const accountId = data.replace('confirm_del_', '');
    const account = db.getAccountById(accountId);
    if (!account) {
      return { text: '❌ Akun tidak ditemukan.', shouldEdit: true };
    }
    db.deleteAccount(accountId);
    return {
      text: `✅ *Akun Dihapus*\n\n${account.icon} ${account.name} berhasil dihapus.`,
      options: { reply_markup: { inline_keyboard: [buildBackButton('menu_accounts')] } },
      shouldEdit: true
    };
  }

  // Account type selection for add
  if (data.startsWith('type_')) {
    const type = data.replace('type_', '');
    const state = userStates.get(chatId);
    if (state?.action === 'add_account' && state.step === 2) {
      state.data.type = type;
      state.step = 3;
      userStates.set(chatId, state);
      return {
        text: `📝 Nama: *${state.data.name}*\n📂 Tipe: *${type}*\n\nMasukkan saldo awal:`,
        options: { reply_markup: { inline_keyboard: [buildBackButton('menu_accounts')] } },
        shouldEdit: true
      };
    }
    return { text: '❓ Sesi berakhir. Silakan mulai ulang.', shouldEdit: true };
  }

  // Report menu
  if (data === 'menu_report') {
    userStates.delete(chatId);
    return {
      text: '📊 *Laporan Keuangan*\n\nPilih periode:',
      options: { reply_markup: buildReportMenuKeyboard() },
      shouldEdit: true
    };
  }

  // Report shortcuts
  if (data === 'report_today') {
    const today = new Date().toISOString().split('T')[0];
    const transactions = db.getTransactionsByDate(today);
    return {
      text: generateReportText(transactions, 'Laporan Hari Ini'),
      options: { reply_markup: { inline_keyboard: [buildBackButton('menu_report')] } },
      shouldEdit: true
    };
  }
  if (data === 'report_yesterday') {
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    const transactions = db.getTransactionsByDate(yesterday);
    return {
      text: generateReportText(transactions, 'Laporan Kemarin'),
      options: { reply_markup: { inline_keyboard: [buildBackButton('menu_report')] } },
      shouldEdit: true
    };
  }
  if (data === 'report_week') {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 86400000);
    const transactions = db.getTransactionsByDateRange(weekAgo.toISOString(), now.toISOString());
    return {
      text: generateReportText(transactions, 'Laporan Minggu Ini'),
      options: { reply_markup: { inline_keyboard: [buildBackButton('menu_report')] } },
      shouldEdit: true
    };
  }
  if (data === 'report_month') {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const transactions = db.getTransactionsByDateRange(monthStart.toISOString(), now.toISOString());
    return {
      text: generateReportText(transactions, 'Laporan Bulan Ini'),
      options: { reply_markup: { inline_keyboard: [buildBackButton('menu_report')] } },
      shouldEdit: true
    };
  }
  if (data === 'report_date') {
    userStates.set(chatId, { action: 'report_date', step: 1 });
    return {
      text: '🗓️ *Laporan Tanggal Tertentu*\n\nMasukkan tanggal (DD-MM-YYYY):',
      options: { reply_markup: { inline_keyboard: [buildBackButton('menu_report')] } },
      shouldEdit: true
    };
  }
  if (data === 'report_range') {
    userStates.set(chatId, { action: 'report_range', step: 1, data: {} });
    return {
      text: '📉 *Laporan Range Tanggal*\n\nMasukkan tanggal mulai (DD-MM-YYYY):',
      options: { reply_markup: { inline_keyboard: [buildBackButton('menu_report')] } },
      shouldEdit: true
    };
  }

  // Goals menu
  if (data === 'menu_goals') {
    userStates.delete(chatId);
    return {
      text: '🎯 *Kelola Goals*\n\nPilih aksi:',
      options: { reply_markup: buildGoalsMenuKeyboard() },
      shouldEdit: true
    };
  }

  if (data === 'goal_list') {
    const goals = db.getGoals();
    if (goals.length === 0) {
      return {
        text: '📭 Belum ada goals.',
        options: { reply_markup: { inline_keyboard: [buildBackButton('menu_goals')] } },
        shouldEdit: true
      };
    }
    let msg = '🎯 *Daftar Goals:*\n\n';
    for (const goal of goals) {
      const pct = Math.round(goal.currentAmount / goal.targetAmount * 100);
      msg += `${goal.icon} *${goal.name}*\n`;
      msg += `   Progress: ${pct}%\n`;
      msg += `   ${formatCurrency(goal.currentAmount)} / ${formatCurrency(goal.targetAmount)}\n`;
      msg += `   Sisa: ${formatCurrency(goal.targetAmount - goal.currentAmount)}\n\n`;
    }
    return {
      text: msg,
      options: { reply_markup: { inline_keyboard: [buildBackButton('menu_goals')] } },
      shouldEdit: true
    };
  }

  if (data === 'goal_add') {
    userStates.set(chatId, { action: 'add_goal', step: 1, data: {} });
    return {
      text: '➕ *Tambah Goal Baru*\n\nMasukkan nama goal:',
      options: { reply_markup: { inline_keyboard: [buildBackButton('menu_goals')] } },
      shouldEdit: true
    };
  }

  if (data === 'goal_edit') {
    return {
      text: '✏️ *Edit Goal*\n\nPilih goal yang ingin diedit:',
      options: { reply_markup: buildGoalSelectKeyboard('gedit') },
      shouldEdit: true
    };
  }

  if (data === 'goal_delete') {
    return {
      text: '🗑️ *Hapus Goal*\n\nPilih goal yang ingin dihapus:',
      options: { reply_markup: buildGoalSelectKeyboard('gdel') },
      shouldEdit: true
    };
  }

  if (data === 'goal_add_amount') {
    return {
      text: '💰 *Tambah Tabungan*\n\nPilih goal:',
      options: { reply_markup: buildGoalSelectKeyboard('gadd') },
      shouldEdit: true
    };
  }

  // Goal icon selection
  if (data.startsWith('gicon_')) {
    const icon = data.replace('gicon_', '');
    const state = userStates.get(chatId);
    if (state?.action === 'add_goal' && state.step === 3) {
      state.data.icon = icon;
      state.step = 4;
      userStates.set(chatId, state);
      return {
        text: `📝 Nama: *${state.data.name}*\n💰 Target: ${formatCurrency(state.data.targetAmount)}\n${icon} Icon: ${icon}\n\nPilih warna:`,
        options: { reply_markup: buildGoalColorKeyboard() },
        shouldEdit: true
      };
    }
    return { text: '❓ Sesi berakhir.', shouldEdit: true };
  }

  // Goal color selection
  if (data.startsWith('gcolor_')) {
    const color = data.replace('gcolor_', '');
    const state = userStates.get(chatId);
    if (state?.action === 'add_goal' && state.step === 4) {
      const newGoal: Goal = {
        id: Math.random().toString(36).slice(2, 9),
        name: state.data.name,
        targetAmount: state.data.targetAmount,
        currentAmount: 0,
        icon: state.data.icon,
        color: color
      };
      db.addGoal(newGoal);
      userStates.delete(chatId);
      return {
        text: `✅ *Goal Ditambahkan*\n\n${newGoal.icon} ${newGoal.name}\n💰 Target: ${formatCurrency(newGoal.targetAmount)}`,
        options: { reply_markup: { inline_keyboard: [buildBackButton('menu_goals')] } },
        shouldEdit: true
      };
    }
    return { text: '❓ Sesi berakhir.', shouldEdit: true };
  }

  // Goal edit selection
  if (data.startsWith('gedit_')) {
    const goalId = data.replace('gedit_', '');
    const goal = db.getGoalById(goalId);
    if (!goal) {
      return { text: '❌ Goal tidak ditemukan.', shouldEdit: true };
    }
    userStates.set(chatId, { action: 'edit_goal', data: { goalId } });
    return {
      text: `✏️ *Edit Goal*\n\n${goal.icon} ${goal.name}\nTarget saat ini: ${formatCurrency(goal.targetAmount)}\n\nMasukkan target baru:`,
      options: { reply_markup: { inline_keyboard: [buildBackButton('menu_goals')] } },
      shouldEdit: true
    };
  }

  // Goal delete selection
  if (data.startsWith('gdel_')) {
    const goalId = data.replace('gdel_', '');
    const goal = db.getGoalById(goalId);
    if (!goal) {
      return { text: '❌ Goal tidak ditemukan.', shouldEdit: true };
    }
    return {
      text: `🗑️ *Hapus Goal*\n\n${goal.icon} ${goal.name}\n\n⚠️ Yakin ingin menghapus?`,
      options: { reply_markup: buildConfirmKeyboard(`gconfirm_del_${goalId}`, 'menu_goals') },
      shouldEdit: true
    };
  }

  // Confirm delete goal
  if (data.startsWith('gconfirm_del_')) {
    const goalId = data.replace('gconfirm_del_', '');
    const goal = db.getGoalById(goalId);
    if (!goal) {
      return { text: '❌ Goal tidak ditemukan.', shouldEdit: true };
    }
    db.deleteGoal(goalId);
    return {
      text: `✅ Goal "${goal.name}" berhasil dihapus.`,
      options: { reply_markup: { inline_keyboard: [buildBackButton('menu_goals')] } },
      shouldEdit: true
    };
  }

  // Goal add amount selection
  if (data.startsWith('gadd_')) {
    const goalId = data.replace('gadd_', '');
    const goal = db.getGoalById(goalId);
    if (!goal) {
      return { text: '❌ Goal tidak ditemukan.', shouldEdit: true };
    }
    userStates.set(chatId, { action: 'add_to_goal', data: { goalId } });
    return {
      text: `💰 *Tambah Tabungan*\n\n${goal.icon} ${goal.name}\nProgress: ${formatCurrency(goal.currentAmount)} / ${formatCurrency(goal.targetAmount)}\n\nMasukkan jumlah yang ingin ditambahkan:`,
      options: { reply_markup: { inline_keyboard: [buildBackButton('menu_goals')] } },
      shouldEdit: true
    };
  }

  // Budgets menu
  if (data === 'menu_budgets') {
    userStates.delete(chatId);
    return {
      text: '💸 *Kelola Budget*\n\nPilih aksi:',
      options: { reply_markup: buildBudgetsMenuKeyboard() },
      shouldEdit: true
    };
  }

  if (data === 'budget_list') {
    const budgets = db.getBudgets();
    if (budgets.length === 0) {
      return {
        text: '📭 Belum ada budget.',
        options: { reply_markup: { inline_keyboard: [buildBackButton('menu_budgets')] } },
        shouldEdit: true
      };
    }
    let msg = '💸 *Daftar Budget:*\n\n';
    for (const budget of budgets) {
      const pct = Math.round(budget.spent / budget.limit * 100);
      const status = pct >= 100 ? '🔴' : pct >= 85 ? '🟠' : '🟢';
      msg += `${status} *${budget.category}*\n`;
      msg += `   ${formatCurrency(budget.spent)} / ${formatCurrency(budget.limit)} (${pct}%)\n`;
      msg += `   Sisa: ${formatCurrency(budget.limit - budget.spent)}\n\n`;
    }
    return {
      text: msg,
      options: { reply_markup: { inline_keyboard: [buildBackButton('menu_budgets')] } },
      shouldEdit: true
    };
  }

  if (data === 'budget_add') {
    return {
      text: '➕ *Tambah Budget*\n\nPilih kategori:',
      options: { reply_markup: buildBudgetCategoryKeyboard() },
      shouldEdit: true
    };
  }

  if (data === 'budget_edit') {
    return {
      text: '✏️ *Edit Budget*\n\nPilih budget yang ingin diedit:',
      options: { reply_markup: buildBudgetSelectKeyboard('bedit') },
      shouldEdit: true
    };
  }

  if (data === 'budget_delete') {
    return {
      text: '🗑️ *Hapus Budget*\n\nPilih budget yang ingin dihapus:',
      options: { reply_markup: buildBudgetSelectKeyboard('bdel') },
      shouldEdit: true
    };
  }

  if (data === 'budget_reset_all') {
    return {
      text: '🔄 *Reset Semua Budget*\n\n⚠️ Semua pengeluaran akan direset ke 0!\n\nYakin?',
      options: { reply_markup: buildConfirmKeyboard('bconfirm_reset_all', 'menu_budgets') },
      shouldEdit: true
    };
  }

  if (data === 'bconfirm_reset_all') {
    db.resetAllBudgets();
    return {
      text: '✅ Semua budget berhasil direset.',
      options: { reply_markup: { inline_keyboard: [buildBackButton('menu_budgets')] } },
      shouldEdit: true
    };
  }

  // Budget category selection for add
  if (data.startsWith('bcat_')) {
    const category = data.replace('bcat_', '');
    userStates.set(chatId, { action: 'add_budget', data: { category } });
    return {
      text: `➕ *Tambah Budget*\n\n📂 Kategori: ${category}\n\nMasukkan limit budget:`,
      options: { reply_markup: { inline_keyboard: [buildBackButton('menu_budgets')] } },
      shouldEdit: true
    };
  }

  // Budget edit selection
  if (data.startsWith('bedit_')) {
    const category = data.replace('bedit_', '');
    const budget = db.getBudgetByCategory(category);
    if (!budget) {
      return { text: '❌ Budget tidak ditemukan.', shouldEdit: true };
    }
    userStates.set(chatId, { action: 'edit_budget', data: { category } });
    return {
      text: `✏️ *Edit Budget*\n\n📂 ${budget.category}\nLimit saat ini: ${formatCurrency(budget.limit)}\n\nMasukkan limit baru:`,
      options: { reply_markup: { inline_keyboard: [buildBackButton('menu_budgets')] } },
      shouldEdit: true
    };
  }

  // Budget delete selection
  if (data.startsWith('bdel_')) {
    const category = data.replace('bdel_', '');
    const budget = db.getBudgetByCategory(category);
    if (!budget) {
      return { text: '❌ Budget tidak ditemukan.', shouldEdit: true };
    }
    return {
      text: `🗑️ *Hapus Budget*\n\n📂 ${budget.category}\n\n⚠️ Yakin ingin menghapus?`,
      options: { reply_markup: buildConfirmKeyboard(`bconfirm_del_${category}`, 'menu_budgets') },
      shouldEdit: true
    };
  }

  // Confirm delete budget
  if (data.startsWith('bconfirm_del_')) {
    const category = data.replace('bconfirm_del_', '');
    db.deleteBudget(category);
    return {
      text: `✅ Budget "${category}" berhasil dihapus.`,
      options: { reply_markup: { inline_keyboard: [buildBackButton('menu_budgets')] } },
      shouldEdit: true
    };
  }

  // Categories menu
  if (data === 'menu_categories') {
    userStates.delete(chatId);
    return {
      text: '🏷️ *Kelola Kategori*\n\nKategori digunakan untuk klasifikasi otomatis transaksi berdasarkan keywords.\n\nPilih aksi:',
      options: { reply_markup: buildCategoriesMenuKeyboard() },
      shouldEdit: true
    };
  }

  if (data === 'cat_list') {
    const categories = db.getCategories();
    if (categories.length === 0) {
      return {
        text: '📭 Belum ada kategori.',
        options: { reply_markup: { inline_keyboard: [buildBackButton('menu_categories')] } },
        shouldEdit: true
      };
    }
    let msg = '🏷️ *Daftar Kategori:*\n\n';
    const expenseCategories = categories.filter(c => c.type === 'Expense');
    const incomeCategories = categories.filter(c => c.type === 'Income');
    
    if (expenseCategories.length > 0) {
      msg += '*📉 Pengeluaran:*\n';
      for (const cat of expenseCategories) {
        const keywordCount = cat.keywords.split(',').length;
        msg += `${cat.icon} ${cat.name} _(${keywordCount} keywords)_\n`;
      }
      msg += '\n';
    }
    
    if (incomeCategories.length > 0) {
      msg += '*📈 Pemasukan:*\n';
      for (const cat of incomeCategories) {
        const keywordCount = cat.keywords.split(',').length;
        msg += `${cat.icon} ${cat.name} _(${keywordCount} keywords)_\n`;
      }
    }
    
    return {
      text: msg,
      options: { reply_markup: { inline_keyboard: [buildBackButton('menu_categories')] } },
      shouldEdit: true
    };
  }

  if (data === 'cat_add') {
    userStates.set(chatId, { action: 'add_category', step: 1, data: {} });
    return {
      text: '➕ *Tambah Kategori Baru*\n\nMasukkan nama kategori:',
      options: { reply_markup: { inline_keyboard: [buildBackButton('menu_categories')] } },
      shouldEdit: true
    };
  }

  if (data === 'cat_edit') {
    return {
      text: '✏️ *Edit Kategori*\n\nPilih kategori yang ingin diedit:',
      options: { reply_markup: buildCategorySelectKeyboard('cedit') },
      shouldEdit: true
    };
  }

  if (data === 'cat_delete') {
    return {
      text: '🗑️ *Hapus Kategori*\n\nPilih kategori yang ingin dihapus:',
      options: { reply_markup: buildCategorySelectKeyboard('cdel') },
      shouldEdit: true
    };
  }

  if (data === 'cat_keywords') {
    return {
      text: '🔑 *Edit Keywords*\n\nPilih kategori:',
      options: { reply_markup: buildCategorySelectKeyboard('ckw') },
      shouldEdit: true
    };
  }

  // Category type selection
  if (data.startsWith('cattype_')) {
    const type = data.replace('cattype_', '') as 'Income' | 'Expense';
    const state = userStates.get(chatId);
    if (state?.action === 'add_category' && state.step === 2) {
      state.data.type = type;
      // Show icon selection
      const iconButtons: TelegramBot.InlineKeyboardButton[][] = [];
      for (let i = 0; i < CATEGORY_ICONS.length; i += 4) {
        const row = CATEGORY_ICONS.slice(i, i + 4).map(icon => ({ text: icon, callback_data: `cicon_${icon}` }));
        iconButtons.push(row);
      }
      iconButtons.push(buildBackButton('menu_categories'));
      
      return {
        text: `📝 Nama: *${state.data.name}*\n📝 Tipe: *${type}*\n\nPilih icon:`,
        options: { reply_markup: { inline_keyboard: iconButtons } },
        shouldEdit: true
      };
    }
    return { text: '❓ Sesi berakhir.', shouldEdit: true };
  }

  // Category icon selection
  if (data.startsWith('cicon_')) {
    const icon = data.replace('cicon_', '');
    const state = userStates.get(chatId);
    if (state?.action === 'add_category') {
      state.data.icon = icon;
      state.step = 3;
      userStates.set(chatId, state);
      return {
        text: `📝 Nama: *${state.data.name}*\n📝 Tipe: *${state.data.type}*\n${icon} Icon: ${icon}\n\nMasukkan keywords (pisahkan dengan koma):\n\nContoh: _makan, bakso, nasi goreng, ayam_`,
        options: { reply_markup: { inline_keyboard: [buildBackButton('menu_categories')] } },
        shouldEdit: true
      };
    }
    return { text: '❓ Sesi berakhir.', shouldEdit: true };
  }

  // Category edit selection
  if (data.startsWith('cedit_')) {
    const categoryId = data.replace('cedit_', '');
    const category = db.getCategoryById(categoryId);
    if (!category) {
      return { text: '❌ Kategori tidak ditemukan.', shouldEdit: true };
    }
    userStates.set(chatId, { action: 'edit_category_name', data: { categoryId } });
    return {
      text: `✏️ *Edit Kategori*\n\n${category.icon} ${category.name}\n\nMasukkan nama baru:`,
      options: { reply_markup: { inline_keyboard: [buildBackButton('menu_categories')] } },
      shouldEdit: true
    };
  }

  // Category delete selection
  if (data.startsWith('cdel_')) {
    const categoryId = data.replace('cdel_', '');
    const category = db.getCategoryById(categoryId);
    if (!category) {
      return { text: '❌ Kategori tidak ditemukan.', shouldEdit: true };
    }
    return {
      text: `🗑️ *Hapus Kategori*\n\n${category.icon} ${category.name}\n\n⚠️ Yakin ingin menghapus?`,
      options: { reply_markup: buildConfirmKeyboard(`cconfirm_del_${categoryId}`, 'menu_categories') },
      shouldEdit: true
    };
  }

  // Confirm delete category
  if (data.startsWith('cconfirm_del_')) {
    const categoryId = data.replace('cconfirm_del_', '');
    const category = db.getCategoryById(categoryId);
    if (!category) {
      return { text: '❌ Kategori tidak ditemukan.', shouldEdit: true };
    }
    db.deleteCategory(categoryId);
    return {
      text: `✅ Kategori "${category.name}" berhasil dihapus.`,
      options: { reply_markup: { inline_keyboard: [buildBackButton('menu_categories')] } },
      shouldEdit: true
    };
  }

  // Category keywords edit
  if (data.startsWith('ckw_')) {
    const categoryId = data.replace('ckw_', '');
    const category = db.getCategoryById(categoryId);
    if (!category) {
      return { text: '❌ Kategori tidak ditemukan.', shouldEdit: true };
    }
    userStates.set(chatId, { action: 'edit_category_keywords', data: { categoryId } });
    const currentKeywords = category.keywords.split(',').slice(0, 15).join(', ');
    return {
      text: `🔑 *Edit Keywords*\n\n${category.icon} ${category.name}\n\n*Keywords saat ini:*\n${currentKeywords}${category.keywords.split(',').length > 15 ? '...' : ''}\n\nMasukkan keywords baru (pisahkan dengan koma):`,
      options: { reply_markup: { inline_keyboard: [buildBackButton('menu_categories')] } },
      shouldEdit: true
    };
  }

  return { text: '❓ Menu tidak dikenali.', shouldEdit: false };
};

// Express routes
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), database: 'connected' });
});

// Secure password hash (bcrypt style comparison)
import crypto from 'crypto';

// Password hash - generate with: echo -n "yourpassword" | sha256sum
// CHANGE THIS to your own password hash!
const PASSWORD_HASH = process.env.APP_PASSWORD_HASH || 'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3'; // default: 123

const hashPassword = (password: string): string => {
  return crypto.createHash('sha256').update(password).digest('hex');
};

const SESSION_DURATION_HOURS = 5;

// Login rate limiting
const loginAttempts = new Map<string, { count: number; lastAttempt: Date }>();
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;

app.post('/api/auth/login', (req: Request, res: Response) => {
  const { password } = req.body ?? {};
  const clientIP = req.ip || req.socket.remoteAddress || 'unknown';
  
  if (!password) {
    return res.status(400).json({ error: 'Password required' });
  }

  // Check rate limiting
  const attempts = loginAttempts.get(clientIP);
  if (attempts) {
    const lockoutEnd = new Date(attempts.lastAttempt.getTime() + LOCKOUT_MINUTES * 60 * 1000);
    if (attempts.count >= MAX_LOGIN_ATTEMPTS && new Date() < lockoutEnd) {
      const waitMinutes = Math.ceil((lockoutEnd.getTime() - Date.now()) / 60000);
      return res.status(429).json({ error: `Terlalu banyak percobaan. Coba lagi dalam ${waitMinutes} menit.` });
    }
    // Reset if lockout period passed
    if (new Date() >= lockoutEnd) {
      loginAttempts.delete(clientIP);
    }
  }

  // Verify password
  const inputHash = hashPassword(password);
  if (inputHash !== PASSWORD_HASH) {
    // Track failed attempt
    const current = loginAttempts.get(clientIP) || { count: 0, lastAttempt: new Date() };
    current.count++;
    current.lastAttempt = new Date();
    loginAttempts.set(clientIP, current);
    
    const remaining = MAX_LOGIN_ATTEMPTS - current.count;
    console.log(`[Auth] Failed login attempt from ${clientIP}. Remaining: ${remaining}`);
    
    return res.status(401).json({ 
      error: remaining > 0 ? `Password salah. ${remaining}x percobaan tersisa.` : 'Akun terkunci sementara.'
    });
  }

  // Success - clear attempts and create session
  loginAttempts.delete(clientIP);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + SESSION_DURATION_HOURS * 60 * 60 * 1000);
  
  console.log(`[Auth] Successful login from ${clientIP}`);
  
  return res.json({ 
    success: true, 
    sessionExpiresAt: expiresAt.toISOString() 
  });
});

app.post('/api/auth/request-otp', async (req: Request, res: Response) => {
  const { username } = req.body ?? {};
  if (!username) return res.status(400).json({ error: 'Username is required' });

  const chatId = db.getChatIdByUsername(username);
  if (!chatId) return res.status(404).json({ error: 'User not found. Pastikan sudah /start di bot Telegram.' });

  if (!bot) {
    return res.status(503).json({ error: 'Bot tidak tersedia. Cek TELEGRAM_BOT_TOKEN.' });
  }

  try {
    // Check rate limit first
    const rateCheck = db.checkOTPRateLimit(chatId);
    if (!rateCheck.allowed) {
      return res.status(429).json({ 
        error: rateCheck.error, 
        waitSeconds: rateCheck.waitSeconds,
        remainingDaily: rateCheck.remainingDaily 
      });
    }

    const otpResult = db.generateOTP(chatId);
    if (!otpResult) {
      return res.status(429).json({ error: 'Rate limit exceeded' });
    }

    db.createSession(chatId);
    
    const expiresIn = Math.ceil((otpResult.expiresAt.getTime() - Date.now()) / 1000);
    const statusText = otpResult.isExisting ? '(kode sama)' : '(kode baru)';
    
    await bot.sendMessage(chatId, 
      `🔐 *OTP Login* ${statusText}\n\n` +
      `Kode: \`${otpResult.code}\`\n\n` +
      `⏰ Berlaku ${Math.ceil(expiresIn / 60)} menit\n` +
      `⚠️ Jangan berikan ke siapapun!`, 
      { parse_mode: 'Markdown' }
    );
    
    return res.json({ 
      success: true, 
      isExisting: otpResult.isExisting,
      expiresAt: otpResult.expiresAt.toISOString(),
      expiresIn,
      remainingDaily: rateCheck.remainingDaily ? rateCheck.remainingDaily - 1 : 9
    });
  } catch (error: any) {
    console.error('OTP send error:', error?.message || error);
    if (error?.response?.body?.description) {
      return res.status(500).json({ error: error.response.body.description });
    }
    return res.status(500).json({ error: 'Gagal kirim OTP. Pastikan bot tidak diblokir.' });
  }
});

app.post('/api/telegram/command', async (req: Request, res: Response) => {
  const { message } = req.body ?? {};
  if (!message) return res.status(400).json({ error: 'message is required' });

  try {
    const parsed = await parseTelegramCommand(message);
    if (!parsed) return res.status(422).json({ error: 'Unable to parse' });

    const sourceAccount = db.getAccountByName(parsed.accountName);
    if (!sourceAccount) return res.status(400).json({ error: `Account '${parsed.accountName}' not found` });

    const transaction: Transaction = {
      id: Math.random().toString(36).slice(2, 9),
      accountId: sourceAccount.id,
      amount: parsed.amount,
      type: parsed.type,
      category: parsed.category,
      date: new Date().toISOString(),
      note: parsed.note
    };

    if (parsed.type === 'Expense') db.updateAccountBalance(sourceAccount.id, sourceAccount.balance - parsed.amount);
    else if (parsed.type === 'Income') db.updateAccountBalance(sourceAccount.id, sourceAccount.balance + parsed.amount);
    else if (parsed.type === 'Transfer' && parsed.toAccountName) {
      const target = db.getAccountByName(parsed.toAccountName);
      if (target) {
        db.updateAccountBalance(sourceAccount.id, sourceAccount.balance - parsed.amount);
        db.updateAccountBalance(target.id, target.balance + parsed.amount);
        transaction.toAccountId = target.id;
      }
    }

    db.addTransaction(transaction);
    return res.json({ parsed, transaction, accounts: db.getAccounts(), budgets: db.getBudgets() });
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/otp/verify', (req: Request, res: Response) => {
  const { username, code } = req.body ?? {};
  if (!code) return res.status(400).json({ error: 'code is required' });

  const chatId = username ? db.getChatIdByUsername(username) : undefined;
  if (!chatId) return res.status(400).json({ error: 'Invalid session' });

  const result = db.verifyOTP(chatId, code);
  
  let sessionExpiresAt: string | undefined;
  if (result.valid) {
    sessionExpiresAt = db.authenticateSession(chatId);
  }
  
  return res.json({ 
    valid: result.valid, 
    error: result.error,
    attemptsLeft: result.attemptsLeft,
    sessionExpiresAt // Return session expiry for browser storage
  });
});

app.get('/api/state', (_req: Request, res: Response) => {
  return res.json(db.getFullState());
});

// Clear all data (requires OTP verification first)
app.post('/api/data/clear-all', (req: Request, res: Response) => {
  try {
    db.clearAllData();
    return res.json({ success: true, message: 'All data cleared' });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to clear data' });
  }
});

// Clear only transactions
app.post('/api/data/clear-transactions', (req: Request, res: Response) => {
  try {
    db.clearAllTransactions();
    return res.json({ success: true, message: 'All transactions cleared' });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to clear transactions' });
  }
});

// Sync state from web to database
app.post('/api/state/sync', (req: Request, res: Response) => {
  const { accounts, transactions, goals, budgets } = req.body ?? {};
  try {
    if (accounts) db.syncAccounts(accounts);
    if (transactions) db.syncTransactions(transactions);
    if (goals) db.syncGoals(goals);
    if (budgets) db.syncBudgets(budgets);
    return res.json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: 'Sync failed' });
  }
});

// Allowed Telegram username - ONLY this user can access the bot
const ALLOWED_USERNAME = process.env.TELEGRAM_ALLOWED_USER || 'zwolf_dev';

// Check if user is authorized
const isAuthorizedUser = (username?: string): boolean => {
  if (!username) return false;
  return username.toLowerCase() === ALLOWED_USERNAME.toLowerCase();
};

// Telegram webhook
app.post('/api/telegram/webhook', async (req: Request, res: Response) => {
  const update = req.body;
  const callbackQuery = update?.callback_query;
  const message = update?.message;

  // Check authorization for callback queries
  const callbackUsername = callbackQuery?.from?.username;
  if (callbackQuery && !isAuthorizedUser(callbackUsername)) {
    console.log(`[Security] Unauthorized callback from @${callbackUsername || 'unknown'}`);
    await bot?.answerCallbackQuery(callbackQuery.id, { text: '⛔ Akses ditolak. Bot ini hanya untuk @zwolf_dev', show_alert: true });
    return res.sendStatus(200);
  }

  // Check authorization for messages
  const messageUsername = message?.from?.username;
  if (message && !isAuthorizedUser(messageUsername)) {
    console.log(`[Security] Unauthorized message from @${messageUsername || 'unknown'}`);
    await bot?.sendMessage(message.chat.id, '⛔ *Akses Ditolak*\n\nBot ini hanya dapat digunakan oleh @zwolf_dev.\n\nJika Anda pemilik bot ini, pastikan username Telegram Anda benar.', { parse_mode: 'Markdown' });
    return res.sendStatus(200);
  }

  try {
    if (callbackQuery?.message?.chat?.id) {
      const chatId = callbackQuery.message.chat.id.toString();
      const messageId = callbackQuery.message.message_id;
      const response = await resolveCallback(chatId, callbackQuery.data, messageId);
      
      await bot?.answerCallbackQuery(callbackQuery.id);
      
      // Always try to edit the existing message
      try {
        await bot?.editMessageText(response.text, {
          chat_id: chatId,
          message_id: messageId,
          parse_mode: 'Markdown',
          reply_markup: response.options?.reply_markup as TelegramBot.InlineKeyboardMarkup
        });
        // Update state with current bot message
        const state = userStates.get(chatId) || {};
        state.lastBotMessageId = messageId;
        userStates.set(chatId, state);
      } catch (editError: any) {
        if (!editError.message?.includes('message is not modified')) {
          // Delete old bot message and send new one
          const state = userStates.get(chatId);
          if (state?.lastBotMessageId && state.lastBotMessageId !== messageId) {
            await deleteMessageSafe(chatId, state.lastBotMessageId);
          }
          const newMsg = await bot?.sendMessage(chatId, response.text, { parse_mode: 'Markdown', ...response.options });
          if (newMsg) {
            const newState = userStates.get(chatId) || {};
            newState.lastBotMessageId = newMsg.message_id;
            userStates.set(chatId, newState);
          }
        }
      }
      return res.sendStatus(200);
    }

    if (message?.chat?.id && message?.text) {
      const chatId = message.chat.id.toString();
      const text = message.text;
      const userMsgId = message.message_id;
      
      if (message.from?.username) {
        db.registerUser(message.from.username, chatId, message.from.first_name);
      }

      const response = await handleCommand(chatId, text, userMsgId);
      
      // Get current state
      const state = userStates.get(chatId) || {};
      
      // Delete the user's message to keep chat clean
      await deleteMessageSafe(chatId, userMsgId);
      
      // Try to edit the last bot message, or send new one
      let messageSent = false;
      if (state.lastBotMessageId) {
        try {
          await bot?.editMessageText(response.text, {
            chat_id: chatId,
            message_id: state.lastBotMessageId,
            parse_mode: 'Markdown',
            reply_markup: response.options?.reply_markup as TelegramBot.InlineKeyboardMarkup
          });
          messageSent = true;
        } catch (e) {
          // Can't edit, will send new message
        }
      }
      
      if (!messageSent) {
        // Delete old bot message if exists
        if (state.lastBotMessageId) {
          await deleteMessageSafe(chatId, state.lastBotMessageId);
        }
        const newMsg = await bot?.sendMessage(chatId, response.text, { parse_mode: 'Markdown', ...response.options });
        if (newMsg) {
          state.lastBotMessageId = newMsg.message_id;
          userStates.set(chatId, state);
        }
      }
      
      console.log('Processed:', { chatId, text: text.substring(0, 50) });
    }
  } catch (error) {
    console.error('Webhook error:', error);
    const chatId = message?.chat?.id || callbackQuery?.message?.chat?.id;
    if (chatId) {
      const state = userStates.get(chatId.toString()) || {};
      if (state.lastBotMessageId) {
        try {
          await bot?.editMessageText('⚠️ Terjadi kesalahan. Coba lagi.', {
            chat_id: chatId,
            message_id: state.lastBotMessageId,
            parse_mode: 'Markdown',
            reply_markup: buildMainMenuKeyboard()
          });
        } catch (e) {
          await bot?.sendMessage(chatId, '⚠️ Terjadi kesalahan. Coba lagi nanti.');
        }
      } else {
        await bot?.sendMessage(chatId, '⚠️ Terjadi kesalahan. Coba lagi nanti.');
      }
    }
  }

  return res.sendStatus(200);
});

export const startTelegramApiServer = async (port = Number(process.env.PORT) || 8787) => {
  if (bot && webhookUrl) {
    try {
      await bot.setMyCommands([
        { command: 'start', description: 'Menu utama' },
        { command: 'help', description: 'Panduan penggunaan' },
        { command: 'saldo', description: 'Cek saldo akun' },
        { command: 'riwayat', description: 'Transaksi terakhir' },
        { command: 'akun', description: 'Kelola akun' },
        { command: 'laporan', description: 'Laporan keuangan' },
        { command: 'otp', description: 'Generate OTP' },
        { command: 'hapus', description: 'Hapus transaksi' }
      ]);
      await bot.setWebHook(webhookUrl.replace(/\/$/, ''));
      console.log(`Webhook set to: ${webhookUrl}`);
    } catch (e) {
      console.error('Failed to set webhook:', e);
    }
  }

  return new Promise<void>((resolve) => {
    app.listen(port, () => {
      console.log(`Telegram API server running on port ${port}`);
      console.log(`Webhook URL: ${webhookUrl}`);
      console.log(`Database: SQLite connected`);
      resolve();
    });
  });
};

if (process.env.START_TELEGRAM_SERVER === 'true') {
  startTelegramApiServer().catch(error => {
    console.error('Failed to start server:', error);
    process.exit(1);
  });
}
