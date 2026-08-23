export const BASE_SEPOLIA_CHAIN_ID = 84532;

export const TOKENS = {
  ETH: {
    symbol: "ETH",
    name: "Ethereum",
    address: "0x0000000000000000000000000000000000000000",
    decimals: 18,
  },
  WETH: {
    symbol: "WETH",
    name: "Wrapped Ether",
    address: "0x4200000000000000000000000000000000000006",
    decimals: 18,
  },
} as const;

export const SEPOLIA_EXPLORER = "https://sepolia.basescan.org";