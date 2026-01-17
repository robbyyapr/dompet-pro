
import React from 'react';

interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
  variant?: 'primary' | 'secondary' | 'danger';
}

export const NeumorphicButton: React.FC<Props> = ({ children, active, className, variant = 'primary', ...props }) => {
  const baseClasses = "neu-button rounded-2xl px-6 py-3 font-semibold text-primary active:scale-95 transition-all";
  const activeClasses = active ? "neu-button-active text-blue-500" : "";
  
  return (
    <button className={`${baseClasses} ${activeClasses} ${className}`} {...props}>
      {children}
    </button>
  );
};
