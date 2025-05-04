import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="mt-8 text-center text-gray-500 text-sm">
      <p>Running on Celo Alfajores Testnet</p>
      <p className="mt-1">
        <a 
          href="https://docs.celo.org/developer" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline"
        >
          Built on Celo
        </a>
      </p>
    </footer>
  );
};