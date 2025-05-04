import React, { useState, useEffect } from 'react';
import { usePayment } from '../hooks/usePayment';
import { useWallet } from '../hooks/useWallet';
import { AmountInput } from './AmountInput';
import { AddressInput } from './AddressInput';
import { PaymentStatus } from './PaymentStatus';
import { WalletButton } from './WalletButton';
import { GlobeIcon } from 'lucide-react';

export const PaymentForm: React.FC = () => {
  const [amount, setAmount] = useState('');
  const [recipient, setRecipient] = useState('');
  const { status, result, processPayment } = usePayment();
  const { status: walletStatus, switchToAlfajores } = useWallet();
  
  const isValidAmount = () => {
    const num = parseFloat(amount);
    return !isNaN(num) && num > 0;
  };
  
  const isValidAddress = () => {
    return /^0x[a-fA-F0-9]{40}$/.test(recipient);
  };
  
  const isFormValid = () => {
    return isValidAmount() && isValidAddress();
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid()) return;
    
    // Ensure we're on the correct network
    await switchToAlfajores();
    await processPayment(amount, recipient);
  };
  
  const isProcessing = status === 'loading';
  const isWalletConnected = walletStatus === 'connected';
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex justify-end">
        <WalletButton />
      </div>

      <div className="space-y-4">
        <label className="block text-sm font-medium text-gray-700">
          Payment Amount
        </label>
        <AmountInput 
          value={amount} 
          onChange={setAmount}
          disabled={isProcessing || !isWalletConnected} 
        />
        {amount && !isValidAmount() && (
          <p className="text-red-600 text-sm mt-1">
            Please enter a valid amount greater than 0
          </p>
        )}
      </div>
      
      <div className="space-y-2">
        <div className="flex items-center text-gray-500 text-sm">
          <GlobeIcon className="w-4 h-4 mr-1" />
          <span>Will be converted to cKES</span>
        </div>
      </div>
      
      <div className="space-y-4">
        <label className="block text-sm font-medium text-gray-700">
          Freelancer's Wallet Address
        </label>
        <AddressInput 
          value={recipient} 
          onChange={setRecipient}
          disabled={isProcessing || !isWalletConnected} 
        />
        {recipient && !isValidAddress() && (
          <p className="text-red-600 text-sm mt-1">
            Please enter a valid Celo address
          </p>
        )}
      </div>
      
      <button
        type="submit"
        disabled={!isFormValid() || isProcessing || !isWalletConnected}
        className={`button-primary ${
          (!isFormValid() || !isWalletConnected) ? 'opacity-60 cursor-not-allowed' : ''
        }`}
      >
        {isProcessing ? 'Processing...' : 'Send Payment'}
      </button>
      
      <PaymentStatus status={status} result={result} />
    </form>
  );
};