import React from 'react';
import { CeloIcon } from './icons/CeloIcon';

interface AmountInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export const AmountInput: React.FC<AmountInputProps> = ({ 
  value, 
  onChange,
  disabled = false
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow numbers and decimals
    const newValue = e.target.value.replace(/[^0-9.]/g, '');
    
    // Prevent multiple decimal points
    const decimalCount = (newValue.match(/\./g) || []).length;
    if (decimalCount > 1) return;
    
    // Prevent more than 6 decimal places
    const parts = newValue.split('.');
    if (parts.length > 1 && parts[1].length > 6) return;
    
    onChange(newValue);
  };

  return (
    <div className="relative">
      <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
        <CeloIcon className="w-6 h-6 text-blue-600" />
      </div>
      <input
        type="text"
        value={value}
        onChange={handleChange}
        disabled={disabled}
        placeholder="0.00"
        className="input-field pl-12 text-lg font-medium"
        aria-label="Amount in cUSD"
      />
      <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500">
        cUSD
      </div>
    </div>
  );
};