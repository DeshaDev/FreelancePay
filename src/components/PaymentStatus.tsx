import React from 'react';
import { LoaderIcon, CheckCircleIcon, AlertCircleIcon } from 'lucide-react';
import { PaymentStatus as Status, PaymentResult } from '../hooks/usePayment';
import { formatTxHash } from '../utils/formatter';

interface PaymentStatusProps {
  status: Status;
  result: PaymentResult | null;
}

export const PaymentStatus: React.FC<PaymentStatusProps> = ({ status, result }) => {
  if (status === 'idle') return null;

  return (
    <div
      className={`status-box ${
        status === 'loading'
          ? 'status-loading'
          : status === 'success'
          ? 'status-success'
          : 'status-error'
      }`}
    >
      {status === 'loading' && (
        <div className="flex items-center justify-center space-x-2">
          <LoaderIcon className="w-5 h-5 animate-spin" />
          <span>Processing payment...</span>
        </div>
      )}

      {status === 'success' && result?.txHash && (
        <div className="flex flex-col items-center justify-center">
          <CheckCircleIcon className="w-8 h-8 mb-2" />
          <div className="font-medium">Payment Successful!</div>
          <div className="mt-1 text-sm">
            Transaction: {formatTxHash(result.txHash)}
          </div>
        </div>
      )}

      {status === 'error' && (
        <div className="flex flex-col items-center justify-center">
          <AlertCircleIcon className="w-8 h-8 mb-2" />
          <div className="font-medium">Payment Failed</div>
          <div className="mt-1 text-sm break-words">
            {result?.error || 'An unknown error occurred'}
          </div>
        </div>
      )}
    </div>
  );
};