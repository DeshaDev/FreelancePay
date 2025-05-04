/**
 * Formats an amount to a readable string with a token symbol
 */
export function formatAmount(amount: string | number, symbol: string = ''): string {
  try {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(numAmount)) return '0 ' + symbol;
    
    return new Intl.NumberFormat('en-US', { 
      maximumFractionDigits: 6,
      minimumFractionDigits: 2
    }).format(numAmount) + (symbol ? ' ' + symbol : '');
  } catch (error) {
    console.error('Error formatting amount:', error);
    return '0 ' + symbol;
  }
}

/**
 * Truncates an address for display
 */
export function truncateAddress(address: string): string {
  if (!address || address.length < 10) return address;
  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
}

/**
 * Formats a transaction hash to a truncated display version
 */
export function formatTxHash(hash: string): string {
  if (!hash || hash.length < 10) return hash;
  return `${hash.substring(0, 10)}...${hash.substring(hash.length - 8)}`;
}

/**
 * Converts an amount to wei (with 18 decimals)
 */
export function toWei(amount: string | number): bigint {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(numAmount)) return BigInt(0);
  
  // Multiply by 10^18 for ERC20 tokens with 18 decimals
  return BigInt(Math.floor(numAmount * 10**18));
}