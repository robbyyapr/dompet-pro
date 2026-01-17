import React, { useState } from 'react';
import { findBankIcon, getBankEmoji, getBankColor } from '../constants/bankIcons';

interface Props {
  name: string;
  size?: 'sm' | 'md' | 'lg';
  showBackground?: boolean;
  className?: string;
}

const sizeMap = {
  sm: { container: 'w-8 h-8', logo: 'w-5 h-5', emoji: 'text-lg' },
  md: { container: 'w-10 h-10', logo: 'w-6 h-6', emoji: 'text-xl' },
  lg: { container: 'w-12 h-12', logo: 'w-8 h-8', emoji: 'text-2xl' }
};

export const BankIcon: React.FC<Props> = ({ 
  name, 
  size = 'md', 
  showBackground = true,
  className = '' 
}) => {
  const [imgError, setImgError] = useState(false);
  const bankInfo = findBankIcon(name);
  const sizes = sizeMap[size];
  const bgColor = getBankColor(name);
  
  const hasLogo = bankInfo?.logo && !imgError;

  if (hasLogo) {
    return (
      <div 
        className={`${sizes.container} rounded-xl flex items-center justify-center overflow-hidden ${className}`}
        style={{ 
          backgroundColor: showBackground ? `${bgColor}15` : 'transparent',
          border: showBackground ? `1px solid ${bgColor}30` : 'none'
        }}
      >
        <img 
          src={bankInfo.logo}
          alt={name}
          className={`${sizes.logo} object-contain`}
          onError={() => setImgError(true)}
          loading="lazy"
        />
      </div>
    );
  }

  // Emoji fallback
  const emoji = getBankEmoji(name);
  return (
    <div 
      className={`${sizes.container} rounded-xl flex items-center justify-center ${className}`}
      style={{ 
        backgroundColor: showBackground ? `${bgColor}15` : 'transparent',
        border: showBackground ? `1px solid ${bgColor}30` : 'none'
      }}
    >
      <span className={sizes.emoji}>{emoji}</span>
    </div>
  );
};

// Compact version for lists
export const BankIconCompact: React.FC<{ name: string; className?: string }> = ({ name, className = '' }) => {
  const [imgError, setImgError] = useState(false);
  const bankInfo = findBankIcon(name);
  
  if (bankInfo?.logo && !imgError) {
    return (
      <img 
        src={bankInfo.logo}
        alt={name}
        className={`w-5 h-5 rounded object-contain ${className}`}
        onError={() => setImgError(true)}
        loading="lazy"
      />
    );
  }
  
  return <span className={`text-lg ${className}`}>{getBankEmoji(name)}</span>;
};
