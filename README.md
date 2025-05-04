# FreelancePay - Cross-border Payments on Celo

FreelancePay is a decentralized application (dApp) built on the Celo blockchain that enables seamless cross-border payments for freelancers. By leveraging Celo's stable currencies and Mento's exchange protocol, FreelancePay allows clients to pay freelancers in their local currency with minimal fees and instant settlements.

## Features

- **Cross-border Payments**: Pay freelancers globally using Celo's stablecoins
- **Currency Conversion**: Automatic conversion from cUSD to cKES using Mento
- **Mobile-First**: Optimized for MiniPay and other Celo wallets
- **Low Fees**: Minimal transaction costs on the Celo network
- **Instant Settlement**: Real-time payments without traditional banking delays

## Technology Stack

- React + TypeScript
- Tailwind CSS for styling
- Viem for blockchain interactions
- Celo Alfajores testnet
- Mento exchange protocol

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Connect your Celo wallet (MiniPay recommended)

## How It Works

1. Client connects their Celo wallet
2. Enters payment amount in cUSD
3. Provides freelancer's Celo address
4. Payment is automatically converted to cKES via Mento
5. Freelancer receives payment in their local currency

## Development

This project uses:
- Vite for fast development
- TypeScript for type safety
- Tailwind CSS for styling
- Celo's contract interfaces
- Mento's broker contract for swaps

## Testing

The application is configured to work on the Celo Alfajores testnet. You can get test tokens from the [Celo Faucet](https://faucet.celo.org).

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License