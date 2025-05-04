import React from 'react';
import { CreditCardIcon } from 'lucide-react';

export const Header: React.FC = () => {
  return (
    <header className="text-center">
      <div className="inline-flex items-center justify-center p-2 mb-2 bg-blue-100 rounded-full">
        <CreditCardIcon className="h-7 w-7 text-blue-600" />
      </div>
      <h1 className="text-2xl font-bold text-gray-800">FreelancePay</h1>
      <p className="mt-2 text-gray-600 max-w-xs mx-auto">
        Pay freelancers instantly on the Celo network with automatic currency conversion
      </p>
    </header>
  );
};