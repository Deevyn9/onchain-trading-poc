"use client";

import { useMemo, useState } from "react";
import {
  useAccount,
  useBalance,
  useChainId,
  useConnect,
  useDisconnect,
  useSendTransaction,
  useWaitForTransactionReceipt,
} from "wagmi";
import { injected } from "wagmi/connectors";
import { baseSepolia } from "wagmi/chains";
import { formatUnits, parseEther, type Hex } from "viem";

import { BASE_SEPOLIA_EXPLORER, TOKENS } from "@/lib/constants";

type QuoteResponse = {
  quote?: {
    input?: {
      amount?: string;
    };
    output?: {
      amount?: string;
      minimumAmount?: string;
    };
    classicGasUseEstimateUSD?: string;
  };
  routing?: string;
  isTokenApprovalApplicable?: boolean;
  permitData?: unknown;
};

export default function Home() {
  const { address, isConnected } = useAccount();
  const { connect, isPending: isConnecting } = useConnect();
  const { disconnect } = useDisconnect();

  const chainId = useChainId();

  const { data: balance } = useBalance({
    address,
    chainId: baseSepolia.id,
  });

  const {
    sendTransaction,
    data: txHash,
    isPending: isSending,
    error: sendError,
  } = useSendTransaction();

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash: txHash,
    });

  const [amount, setAmount] = useState("0.1");
  const [quote, setQuote] = useState<QuoteResponse | null>(null);
  const [isQuoting, setIsQuoting] = useState(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [isBuildingSwap, setIsBuildingSwap] = useState(false);
  const [swapError, setSwapError] = useState<string | null>(null);

  const outputAmount = useMemo(() => {
    const raw = quote?.quote?.output?.amount;

    if (!raw) return null;

    return Number(formatUnits(BigInt(raw), TOKENS.USDC.decimals));
  }, [quote]);

  async function getQuote() {
    if (!address || !amount || Number(amount) <= 0) return;

    try {
      setIsQuoting(true);
      setQuoteError(null);

      const response = await fetch("/api/quote", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tokenIn: TOKENS.ETH.address,
          tokenOut: TOKENS.USDC.address,
          tokenInChainId: baseSepolia.id,
          tokenOutChainId: baseSepolia.id,
          type: "EXACT_INPUT",
          amount: parseEther(amount).toString(),
          swapper: address,
          slippageTolerance: 0.5,
          routingPreference: "BEST_PRICE",
          protocols: ["V3"],
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.detail || data?.message || "Unable to get quote");
      }

      setQuote(data);
    } catch (error) {
      setQuote(null);
      setQuoteError(
        error instanceof Error ? error.message : "Unable to get quote",
      );
    } finally {
      setIsQuoting(false);
    }
  }

  async function executeSwap() {
    if (!address || !quote?.quote) return;

    try {
      setIsBuildingSwap(true);
      setSwapError(null);

      const response = await fetch("/api/swap", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          quote: quote.quote,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.detail || data?.message || "Unable to build swap",
        );
      }

      const transaction = data.swap;

      if (!transaction?.to || !transaction?.data) {
        throw new Error("Uniswap returned an invalid transaction");
      }

      sendTransaction({
        to: transaction.to as `0x${string}`,
        data: transaction.data as Hex,
        value: BigInt(transaction.value ?? "0"),
      });
    } catch (error) {
      setSwapError(
        error instanceof Error ? error.message : "Unable to execute swap",
      );
    } finally {
      setIsBuildingSwap(false);
    }
  }

  const wrongNetwork = isConnected && chainId !== baseSepolia.id;

  const busy = isQuoting || isBuildingSwap || isSending || isConfirming;

  return (
    <main className="min-h-screen bg-[#080b0a] text-white">
      <header className="flex h-16 items-center justify-between border-b border-white/10 px-6">
        <div className="flex items-center gap-3">
          <div className="text-xl font-bold tracking-tight">Flow</div>

          <span className="rounded bg-emerald-400/10 px-2 py-1 text-xs text-emerald-400">
            Trade
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="rounded-md border border-white/10 px-3 py-2 text-xs text-white/60">
            Base Sepolia
          </div>

          {isConnected ? (
            <button
              onClick={() => disconnect()}
              className="rounded-md bg-emerald-400 px-4 py-2 text-sm font-semibold text-black"
            >
              {address?.slice(0, 6)}...
              {address?.slice(-4)}
            </button>
          ) : (
            <button
              onClick={() =>
                connect({
                  connector: injected(),
                  chainId: baseSepolia.id,
                })
              }
              disabled={isConnecting}
              className="rounded-md bg-emerald-400 px-4 py-2 text-sm font-semibold text-black disabled:opacity-50"
            >
              {isConnecting ? "Connecting..." : "Connect Wallet"}
            </button>
          )}
        </div>
      </header>

      <div className="grid min-h-[calc(100vh-4rem)] grid-cols-[240px_1fr_360px]">
        <aside className="border-r border-white/10 p-5">
          <p className="mb-4 text-xs uppercase tracking-wider text-white/40">
            Markets
          </p>

          <div className="rounded-lg border border-emerald-400/20 bg-emerald-400/5 p-3">
            <div className="flex justify-between">
              <span className="text-sm">ETH/USDC</span>

              <span className="text-xs text-emerald-400">SPOT</span>
            </div>

            <p className="mt-2 text-xs text-white/40">Base Sepolia</p>
          </div>
        </aside>

        <section className="p-6">
          <div className="mb-5">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-semibold">ETH/USDC</h1>

              <span className="rounded bg-emerald-400/10 px-2 py-1 text-xs text-emerald-400">
                SPOT
              </span>
            </div>

            <p className="mt-1 text-xs text-white/40">Onchain execution POC</p>
          </div>

          <div className="flex h-[620px] items-center justify-center rounded-xl border border-white/10 bg-[#0b0f0d]">
            <div className="text-center">
              <p className="text-sm text-white/30">ETH/USDC Market Chart</p>

              <p className="mt-2 text-xs text-white/20">
                Static visual placeholder
              </p>
            </div>
          </div>
        </section>

        <aside className="border-l border-white/10 p-5">
          <div className="mb-6 flex border-b border-white/10">
            <button className="border-b-2 border-emerald-400 px-4 pb-3 text-sm">
              Swap
            </button>

            <button className="px-4 pb-3 text-sm text-white/40">Limit</button>
          </div>

          <div className="space-y-4">
            <div>
              <div className="mb-2 flex justify-between text-xs text-white/40">
                <span>You Pay</span>

                <span>
                  Balance:{" "}
                  {balance
                    ? Number(
                        formatUnits(balance.value, balance.decimals),
                      ).toFixed(4)
                    : "—"}{" "}
                  ETH
                </span>
              </div>

              <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
                <div className="flex items-center justify-between">
                  <input
                    value={amount}
                    onChange={(event) => setAmount(event.target.value)}
                    type="number"
                    min="0"
                    step="0.01"
                    className="w-full bg-transparent text-2xl outline-none"
                  />

                  <span className="ml-3 rounded bg-white/10 px-2 py-1 text-sm">
                    ETH
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-center">
              <div className="rounded-full border border-white/10 bg-[#101512] px-3 py-2 text-xs text-white/50">
                ↓
              </div>
            </div>

            <div>
              <div className="mb-2 flex justify-between text-xs text-white/40">
                <span>You Receive</span>

                <span>Balance: —</span>
              </div>

              <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
                <div className="flex items-center justify-between">
                  <span className="text-2xl">
                    {isQuoting
                      ? "..."
                      : outputAmount
                        ? outputAmount.toFixed(2)
                        : "0.00"}
                  </span>

                  <span className="ml-3 rounded bg-white/10 px-2 py-1 text-sm">
                    USDC
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={getQuote}
              disabled={!isConnected || wrongNetwork || isQuoting}
              className="w-full rounded-lg border border-white/10 py-3 text-sm text-white/70 disabled:opacity-30"
            >
              {isQuoting ? "Fetching Quote..." : "Refresh Quote"}
            </button>

            {quote && (
              <div className="space-y-3 rounded-lg border border-white/10 bg-white/[0.02] p-4 text-xs">
                <div className="flex justify-between">
                  <span className="text-white/40">Rate</span>

                  <span>
                    1 ETH ≈{" "}
                    {outputAmount ? outputAmount / Number(amount || 1) : "—"}{" "}
                    USDC
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-white/40">Slippage</span>

                  <span>0.50%</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-white/40">Routing</span>

                  <span>{quote.routing ?? "—"}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-white/40">Gas estimate</span>

                  <span>${quote.quote?.classicGasUseEstimateUSD ?? "—"}</span>
                </div>
              </div>
            )}

            {quoteError && (
              <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-3 text-xs text-red-400">
                {quoteError}
              </div>
            )}

            {wrongNetwork && (
              <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/5 p-3 text-xs text-yellow-400">
                Switch your wallet to Base Sepolia.
              </div>
            )}

            {sendError && (
              <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-3 text-xs text-red-400">
                {sendError.message}
              </div>
            )}

            {swapError && (
              <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-3 text-xs text-red-400">
                {swapError}
              </div>
            )}

            {!isConnected ? (
              <button
                onClick={() =>
                  connect({
                    connector: injected(),
                    chainId: baseSepolia.id,
                  })
                }
                className="w-full rounded-lg bg-emerald-400 py-3 text-sm font-semibold text-black"
              >
                Connect Wallet to Trade
              </button>
            ) : (
              <button
                onClick={executeSwap}
                disabled={busy || !quote || wrongNetwork}
                className="w-full rounded-lg bg-emerald-400 py-3 text-sm font-semibold text-black disabled:opacity-40"
              >
                {isBuildingSwap
                  ? "Preparing Transaction..."
                  : isSending
                    ? "Waiting for Signature..."
                    : isConfirming
                      ? "Confirming Onchain..."
                      : isConfirmed
                        ? "Trade Complete"
                        : "Review Trade"}
              </button>
            )}

            {txHash && (
              <a
                href={`${BASE_SEPOLIA_EXPLORER}/tx/${txHash}`}
                target="_blank"
                rel="noreferrer"
                className="block text-center text-xs text-emerald-400 hover:underline"
              >
                View Transaction ↗
              </a>
            )}
          </div>
        </aside>
      </div>
    </main>
  );
}
