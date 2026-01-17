
import React, { useState } from 'react';
import { parseTelegramCommand, ParsedCommand } from '../services/geminiService';
import { NeumorphicButton } from './NeumorphicButton';

interface Props {
  onAddTransaction: (cmd: ParsedCommand) => void;
}

export const TelegramSimulation: React.FC<Props> = ({ onAddTransaction }) => {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState('');

  const handleSend = async () => {
    if (!input.trim()) return;
    setLoading(true);
    setFeedback('AI sedang memproses command...');
    
    const result = await parseTelegramCommand(input);
    if (result) {
      onAddTransaction(result);
      setFeedback(`Berhasil! ${result.type}: ${result.note} (${result.amount})`);
      setInput('');
    } else {
      setFeedback('Maaf, saya tidak mengerti command tersebut.');
    }
    setLoading(false);
    setTimeout(() => setFeedback(''), 5000);
  };

  return (
    <div className="neu-card p-4 md:p-6 mb-10 border-l-8 border-blue-500 no-print">
      <div className="flex items-center mb-4">
        <span className="bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300 px-3 py-1 rounded-full text-[10px] md:text-xs font-bold uppercase tracking-widest mr-3 shrink-0">Bot Sim</span>
        <h3 className="text-base md:text-lg font-bold text-primary truncate">Telegram Command Input</h3>
      </div>
      <p className="text-[11px] md:text-xs text-secondary mb-4 italic">
        Contoh: "Beli kopi susu 25000 pakai BCA", "Terima bonus 1juta ke BCA", "Bayar listrik 200rb dari Gopay"
      </p>
      <div className="flex flex-col md:flex-row gap-3 md:gap-4">
        <input 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Tulis command anda di sini..."
          className="w-full md:flex-1 neu-inset rounded-2xl px-5 py-3 md:px-6 md:py-4 bg-transparent outline-none text-primary placeholder:text-secondary focus:ring-2 ring-blue-300 text-sm md:text-base"
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
        />
        <NeumorphicButton 
          onClick={handleSend}
          disabled={loading}
          className="w-full md:w-auto bg-blue-500 text-white md:min-w-[120px] py-3 md:py-4 border-none shadow-blue-500/20"
        >
          {loading ? '...' : 'Kirim'}
        </NeumorphicButton>
      </div>
      {feedback && (
        <div className="mt-4 text-[11px] md:text-sm font-medium animate-pulse text-blue-500 bg-blue-500/10 p-2 md:p-3 rounded-xl text-center">
          {feedback}
        </div>
      )}
    </div>
  );
};
