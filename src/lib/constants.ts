export const BASE_SEPOLIA_CHAIN_ID = 84532;

export const TOKENS = {
  ETH: {
    symbol: "ETH",
    name: "Ethereum",
    address: "0x0000000000000000000000000000000000000000",
    decimals: 18,
  },

  USDC: {
    symbol: "USDC",
    name: "USD Coin",
    address: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
    decimals: 6,
  },
} as const;

export const BASE_SEPOLIA_EXPLORER =
  "https://sepolia-explorer.base.org";