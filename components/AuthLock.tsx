
import React, { useState, useEffect } from 'react';
import { NeumorphicButton } from './NeumorphicButton';

interface Props {
  onUnlock: () => void;
}

export const AuthLock: React.FC<Props> = ({ onUnlock }) => {
  const [pin, setPin] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [error, setError] = useState(false);

  useEffect(() => {
    // Simulate bot generating a code
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    setGeneratedCode(code);
  }, []);

  const handleKeypad = (num: string) => {
    if (pin.length < 4) {
      const newPin = pin + num;
      setPin(newPin);
      
      // Auto-unlock logic
      if (newPin.length === 4) {
        if (newPin === generatedCode) {
          onUnlock();
        } else {
          setError(true);
          setTimeout(() => {
            setError(false);
            setPin('');
          }, 600);
        }
      }
    }
  };

  const handleClear = () => setPin('');

  return (
    <div className="fixed inset-0 bg-[#e0e5ec] dark:bg-[#1a1c1e] flex flex-col items-center justify-center p-6 z-50 transition-colors duration-400">
      <div className="neu-card p-6 md:p-10 max-w-md w-full flex flex-col items-center">
        <div className="w-16 h-16 md:w-20 md:h-20 neu-button rounded-full flex items-center justify-center text-3xl mb-6 md:mb-8">
          🔒
        </div>
        <h2 className="text-xl md:text-2xl font-bold text-primary mb-2">Akses Terkunci</h2>
        <p className="text-secondary text-center mb-6 text-sm">Buka Telegram Bot Anda untuk mendapatkan kode OTP akses.</p>
        
        <div className="bg-yellow-500/10 border border-yellow-500/20 p-3 rounded-xl mb-8 text-sm text-yellow-600 dark:text-yellow-400 text-center italic w-full">
          [Simulasi Bot Telegram] Kode Anda: <span className="font-bold text-lg">{generatedCode}</span>
        </div>

        <div className={`flex gap-4 mb-10 ${error ? 'animate-shake text-red-500' : ''}`}>
          {[...Array(4)].map((_, i) => (
            <div key={i} className={`w-4 h-4 rounded-full transition-all duration-300 ${pin.length > i ? 'bg-blue-500 scale-125 shadow-[0_0_10px_rgba(59,130,246,0.5)]' : 'neu-inset'}`} />
          ))}
        </div>

        <div className="grid grid-cols-3 gap-4 md:gap-6 mb-8 w-full max-w-[280px]">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '⌫'].map(val => (
            <button
              key={val}
              onClick={() => {
                if (val === 'C') handleClear();
                else if (val === '⌫') setPin(prev => prev.slice(0, -1));
                else handleKeypad(val);
              }}
              className={`neu-button w-14 h-14 md:w-16 md:h-16 rounded-full text-lg md:text-xl font-bold ${
                val === 'C' ? 'text-red-500' : val === '⌫' ? 'text-orange-500' : 'text-primary'
              }`}
            >
              {val}
            </button>
          ))}
        </div>

        <p className="text-[10px] text-secondary mt-4 uppercase tracking-widest font-black">Sync Secured with Bot Telegram</p>
      </div>
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        .animate-shake {
          animation: shake 0.2s cubic-bezier(.36,.07,.19,.97) both;
          animation-iteration-count: 2;
        }
      `}</style>
    </div>
  );
};
