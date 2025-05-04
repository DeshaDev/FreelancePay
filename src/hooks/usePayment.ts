import { useState } from 'react';
import { createWalletClient, custom, parseEther, publicActions, getAddress } from 'viem';
import { celoAlfajores } from 'viem/chains';
import { BROKER_ADDRESS, CUSD_ADDRESS, CKES_ADDRESS } from '../constants/addresses';
import { brokerAbi, erc20Abi } from '../constants/abis';
import { toWei } from '../utils/formatter';

export type PaymentStatus = 'idle' | 'loading' | 'success' | 'error';

export interface PaymentResult {
  success: boolean;
  txHash?: string;
  error?: string;
  helpText?: string;
}

export function usePayment() {
  const [status, setStatus] = useState<PaymentStatus>('idle');
  const [result, setResult] = useState<PaymentResult | null>(null);

  const getClient = () => {
    if (!window.ethereum) {
      throw new Error('MiniPay not detected. Please open this app in MiniPay.');
    }

    return createWalletClient({
      chain: celoAlfajores,
      transport: custom(window.ethereum),
    }).extend(publicActions);
  };

  const resetState = () => {
    setStatus('idle');
    setResult(null);
  };

  const processPayment = async (amount: string, recipient: string) => {
    try {
      resetState();
      setStatus('loading');

      // Convert addresses to checksum format
      const checksumRecipient = getAddress(recipient);
      const checksumBroker = getAddress(BROKER_ADDRESS);
      const checksumCUSD = getAddress(CUSD_ADDRESS);
      const checksumCKES = getAddress(CKES_ADDRESS);

      const client = getClient();
      const [address] = await client.getAddresses();
      const weiAmount = toWei(amount);

      // Check initial cUSD balance
      const initialCusdBalance = await client.readContract({
        address: checksumCUSD,
        abi: erc20Abi,
        functionName: 'balanceOf',
        args: [address],
      });

      if (initialCusdBalance < weiAmount) {
        throw new Error('Insufficient cUSD balance. You can get test cUSD from the Celo Faucet at https://developers.celo.org/tools/faucet');
      }

      // Get initial cKES balance to calculate actual swap amount later
      const initialCkesBalance = await client.readContract({
        address: checksumCKES,
        abi: erc20Abi,
        functionName: 'balanceOf',
        args: [address],
      });

      console.log('Starting payment process...');
      console.log('Amount:', weiAmount.toString());
      console.log('From:', address);
      console.log('To:', checksumRecipient);

      // 1. Approve cUSD spending
      console.log('Approving cUSD for broker contract...');
      const approveTx = await client.writeContract({
        address: checksumCUSD,
        abi: erc20Abi,
        functionName: 'approve',
        args: [checksumBroker, weiAmount],
        account: address,
      });
      
      await client.waitForTransactionReceipt({ hash: approveTx });
      console.log('Approval confirmed:', approveTx);

      // 2. Execute swap with 5% slippage tolerance
      const minAmountOut = (weiAmount * BigInt(95)) / BigInt(100);
      console.log('Executing swap with minimum output:', minAmountOut.toString());

      const swapTx = await client.writeContract({
        address: checksumBroker,
        abi: brokerAbi,
        functionName: 'swapIn',
        args: [checksumCUSD, checksumCKES, weiAmount, minAmountOut],
        account: address,
      });

      await client.waitForTransactionReceipt({ hash: swapTx });
      console.log('Swap confirmed:', swapTx);

      // Get final cKES balance to determine actual swap amount
      const finalCkesBalance = await client.readContract({
        address: checksumCKES,
        abi: erc20Abi,
        functionName: 'balanceOf',
        args: [address],
      });

      const swappedAmount = finalCkesBalance - initialCkesBalance;
      
      if (swappedAmount <= BigInt(0)) {
        throw new Error('Swap failed: No cKES received');
      }

      if (swappedAmount < minAmountOut) {
        throw new Error('Swap failed: Received amount is less than minimum expected');
      }

      // 3. Transfer the swapped cKES to recipient
      console.log('Transferring cKES to recipient:', swappedAmount.toString());
      const transferTx = await client.writeContract({
        address: checksumCKES,
        abi: erc20Abi,
        functionName: 'transfer',
        args: [checksumRecipient, swappedAmount],
        account: address,
      });

      await client.waitForTransactionReceipt({ hash: transferTx });
      console.log('Transfer confirmed:', transferTx);

      setStatus('success');
      setResult({
        success: true,
        txHash: transferTx,
      });

      return { success: true, txHash: transferTx };
    } catch (error: any) {
      console.error('Payment error:', error);
      
      const helpText = error.message.includes('https://') 
        ? error.message.substring(error.message.indexOf('https://'))
        : undefined;
      
      setStatus('error');
      setResult({
        success: false,
        error: error.message || 'An unknown error occurred',
        helpText
      });
      return { success: false, error: error.message, helpText };
    }
  };

  return {
    status,
    result,
    processPayment,
    resetState,
  };
}