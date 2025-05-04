import React from 'react';

interface IconProps {
  className?: string;
}

export const CeloIcon: React.FC<IconProps> = ({ className = 'w-6 h-6' }) => {
  return (
    <svg 
      viewBox="0 0 100 100" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      fill="currentColor"
    >
      <path d="M50 0C22.4 0 0 22.4 0 50C0 77.6 22.4 100 50 100C77.6 100 100 77.6 100 50C100 22.4 77.6 0 50 0ZM50 75C36.2 75 25 63.8 25 50C25 36.2 36.2 25 50 25C63.8 25 75 36.2 75 50C75 63.8 63.8 75 50 75Z" />
      <path d="M50 41.5C44.5 41.5 40 46 40 51.5C40 57 44.5 61.5 50 61.5C55.5 61.5 60 57 60 51.5C60 46 55.5 41.5 50 41.5Z" />
    </svg>
  );
};