# Flow — Onchain Trading POC

A minimal proof-of-concept demonstrating full client-side execution of an onchain swap: wallet connect, live quote, signature, and onchain settlement — using Uniswap's Trading API on Base Sepolia.

**Live demo:** https://onchain-poc.divineobeten.xyz/

## Flow

Connect wallet → enter ETH amount → get a live quote → review trade details → sign in MetaMask → transaction executes onchain → view on block explorer.

## Stack

- Next.js (App Router) + TypeScript
- wagmi + viem for wallet connection and transaction handling
- Uniswap Trading API for quotes and swap calldata
- Tailwind CSS
- Deployed on Vercel

## Network

This runs on **Base Sepolia** (chain ID `84532`), a public Ethereum L2 testnet. All transactions use test ETH with no real value.

## What it demonstrates

- Wallet connection via wagmi/MetaMask, with network validation
- Fetching a live swap quote from Uniswap's `/quote` endpoint
- Building swap transaction calldata via `/swap`
- Signing and broadcasting the transaction from the client
- Polling for onchain confirmation and linking to the block explorer

## A note on the trading pair

The demo currently swaps ETH → WETH (wrapping) rather than ETH → USDC. During development, ETH/USDC had no meaningful Uniswap liquidity on the available testnets, which caused Uniswap's routing engine to return malformed quotes. ETH/WETH uses the same real onchain execution path — quote, signature, settlement — with reliable liquidity. Swapping in a different liquid pair (e.g. against a token with a real testnet pool) is a straightforward config change; see `lib/constants.ts`.

## Running locally

\`\`\`bash
npm install
\`\`\`

Create a `.env.local` file:

\`\`\`
UNISWAP_API_KEY=your_key_here
\`\`\`

\`\`\`bash
npm run dev
\`\`\`

Connect a wallet on Base Sepolia (get testnet ETH from [a Base Sepolia faucet](https://docs.base.org/base-chain/network-information/network-faucets) or bridge from Ethereum Sepolia via [Superbridge](https://testnets.superbridge.app)).

## Known limitations

- Single trading pair, no token selector
- No slippage configuration in the UI (fixed at 0.5%)
- Market chart is a static placeholder, not live price data
- No transaction history / persistence between sessions
