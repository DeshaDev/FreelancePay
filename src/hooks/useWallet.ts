import { useState, useEffect } from 'react';

export type WalletStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

export interface WalletState {
  status: WalletStatus;
  account: string | null;
  error: string | null;
}

export function useWallet() {
  const [state, setState] = useState<WalletState>({
    status: 'disconnected',
    account: null,
    error: null,
  });

  const resetState = () => {
    setState({
      status: 'disconnected',
      account: null,
      error: null,
    });
  };

  const disconnect = async () => {
    if (window.ethereum?.removeAllListeners) {
      window.ethereum.removeAllListeners();
    }
    resetState();
    // Clear any cached provider state
    localStorage.removeItem('walletconnect');
    localStorage.removeItem('WALLETCONNECT_DEEPLINK_CHOICE');
  };

  const connect = async () => {
    if (!window.ethereum) {
      setState(prev => ({
        ...prev,
        status: 'error',
        error: 'No wallet detected. Please install MiniPay.',
      }));
      return false;
    }

    try {
      setState(prev => ({ ...prev, status: 'connecting' }));

      // Force MetaMask to show the account selector
      await window.ethereum.request({
        method: 'wallet_requestPermissions',
        params: [{ eth_accounts: {} }]
      });

      // Get the selected account
      const accounts = await window.ethereum.request({ 
        method: 'eth_accounts' 
      });

      if (!accounts || !accounts[0]) {
        throw new Error('No accounts found');
      }

      setState({
        status: 'connected',
        account: accounts[0],
        error: null,
      });

      return true;
    } catch (error: any) {
      console.error('Wallet connection error:', error);
      setState({
        status: 'error',
        account: null,
        error: error.message || 'Failed to connect wallet',
      });
      return false;
    }
  };

  const switchToAlfajores = async () => {
    if (!window.ethereum) return false;

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0xaef3' }], // Alfajores chainId
      });
      return true;
    } catch (error: any) {
      if (error.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: '0xaef3',
              chainName: 'Celo Alfajores',
              nativeCurrency: {
                name: 'Celo',
                symbol: 'CELO',
                decimals: 18,
              },
              rpcUrls: ['https://alfajores-forno.celo-testnet.org'],
              blockExplorerUrls: ['https://alfajores.celoscan.io'],
            }],
          });
          return true;
        } catch (addError) {
          console.error('Failed to add Alfajores network:', addError);
          return false;
        }
      }
      console.error('Failed to switch network:', error);
      return false;
    }
  };

  useEffect(() => {
    if (!window.ethereum) return;

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        disconnect();
      } else {
        setState(prev => ({
          ...prev,
          account: accounts[0],
          status: 'connected',
        }));
      }
    };

    const handleChainChanged = () => {
      // Reload the page on chain change as recommended by MetaMask
      window.location.reload();
    };

    const handleDisconnect = () => {
      disconnect();
    };

    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);
    window.ethereum.on('disconnect', handleDisconnect);

    // Check if already connected
    window.ethereum.request({ method: 'eth_accounts' })
      .then((accounts: string[]) => {
        if (accounts.length > 0) {
          setState({
            status: 'connected',
            account: accounts[0],
            error: null,
          });
        }
      });

    return () => {
      if (window.ethereum?.removeListener) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
        window.ethereum.removeListener('disconnect', handleDisconnect);
      }
    };
  }, []);

  return {
    ...state,
    connect,
    disconnect,
    switchToAlfajores,
  };
}