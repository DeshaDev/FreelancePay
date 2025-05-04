import React from 'react';
import { WalletIcon } from './icons/WalletIcon';

interface AddressInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export const AddressInput: React.FC<AddressInputProps> = ({ 
  value, 
  onChange,
  disabled = false
}) => {
  return (
    <div className="relative">
      <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
        <WalletIcon className="w-5 h-5 text-blue-600" />
      </div>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder="0x..."
        className="input-field pl-12 font-mono text-sm md:text-base"
        aria-label="Freelancer's Celo Address"
      />
    </div>
  );
};