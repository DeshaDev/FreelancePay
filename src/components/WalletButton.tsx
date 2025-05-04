import React from 'react';
import { WalletIcon, LogOutIcon, Loader2Icon } from 'lucide-react';
import { useWallet } from '../hooks/useWallet';
import { truncateAddress } from '../utils/formatter';

export const WalletButton: React.FC = () => {
  const { status, account, connect, disconnect } = useWallet();

  if (status === 'connected' && account) {
    return (
      <div className="flex items-center space-x-2">
        <span className="text-sm text-gray-600 font-medium">
          {truncateAddress(account)}
        </span>
        <button
          onClick={disconnect}
          className="text-gray-600 hover:text-gray-800 p-2 rounded-lg hover:bg-gray-100 transition-colors"
          title="Disconnect wallet"
        >
          <LogOutIcon className="w-4 h-4" />
        </button>
      </div>
    );
  }

  if (status === 'connecting') {
    return (
      <button
        disabled
        className="button-primary flex items-center justify-center space-x-2 opacity-75 cursor-not-allowed"
      >
        <Loader2Icon className="w-5 h-5 animate-spin" />
        <span>Connecting...</span>
      </button>
    );
  }

  return (
    <button
      onClick={connect}
      className="button-primary flex items-center justify-center space-x-2"
    >
      <WalletIcon className="w-5 h-5" />
      <span>Connect Wallet</span>
    </button>
  );
};