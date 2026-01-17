
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export interface ParsedCommand {
  type: 'Income' | 'Expense' | 'Transfer';
  amount: number;
  accountName: string;
  toAccountName?: string;
  category: string;
  note: string;
}

const responseSchema = {
  type: Type.OBJECT,
  properties: {
    type: { type: Type.STRING, description: "Type of transaction: Income, Expense, or Transfer" },
    amount: { type: Type.NUMBER, description: "Numerical amount of money" },
    accountName: { type: Type.STRING, description: "Source account name mentioned" },
    toAccountName: { type: Type.STRING, description: "Destination account name for transfers" },
    category: { type: Type.STRING, description: "Broad category: Food, Transport, Rent, etc." },
    note: { type: Type.STRING, description: "Brief description of the transaction" },
  },
  required: ["type", "amount", "accountName", "category", "note"],
};

export const parseTelegramCommand = async (command: string): Promise<ParsedCommand | null> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Parse command keuangan ini untuk Dompet v3.0: "${command}". 
      Tentukan apakah ini Pengeluaran, Pemasukan, atau Transfer. Akun target dan nominal.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      },
    });

    if (response.text) {
      return JSON.parse(response.text.trim());
    }
    return null;
  } catch (error) {
    console.error("Gemini Parsing Error:", error);
    return null;
  }
};

export const analyzeFinances = async (transactions: any[], accounts: any[], goals: any[]): Promise<string> => {
  try {
    const dataSummary = `
      Akun: ${accounts.map(a => `${a.name}: Rp${a.balance}`).join(', ')}
      Target Tabungan: ${goals.map(g => `${g.name}: ${Math.round((g.currentAmount/g.targetAmount)*100)}% tercapai`).join('; ')}
      Transaksi Terakhir: ${transactions.slice(0, 15).map(t => `${t.type} ${t.amount} on ${t.category}`).join('; ')}
    `;
    
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: `Anda adalah Financial Strategist Dompet v3.0. 
      Berikan analisa mendalam dalam Bahasa Indonesia:
      1. Skor Kesehatan Keuangan (0-100).
      2. Prediksi saldo akhir bulan berdasarkan 'burn rate' saat ini.
      3. Strategi untuk mencapai Target Tabungan tercepat.
      4. Identifikasi pengeluaran impulsif.`,
      config: {
        thinkingConfig: { thinkingBudget: 4000 }
      }
    });

    return response.text || "Gagal melakukan analisa.";
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return "Maaf, sistem AI sedang melakukan kalibrasi.";
  }
};
