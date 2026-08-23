import { NextRequest, NextResponse } from "next/server";

const UNISWAP_API =
  "https://trade-api.gateway.uniswap.org/v1/quote";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!process.env.UNISWAP_API_KEY) {
      return NextResponse.json(
        { error: "Missing UNISWAP_API_KEY" },
        { status: 500 }
      );
    }

    const response = await fetch(UNISWAP_API, {
      method: "POST",
      headers: {
        "x-api-key": process.env.UNISWAP_API_KEY,
        "Content-Type": "application/json",
        Accept: "application/json",
        "x-universal-router-version": "2.2.0",
        "x-erc20eth-enabled": "false",
        "x-permit2-disabled": "false",
      },
      body: JSON.stringify({
        type: "EXACT_INPUT",
        amount: body.amount,
        tokenInChainId: body.tokenInChainId,
        tokenOutChainId: body.tokenOutChainId,
        tokenIn: body.tokenIn,
        tokenOut: body.tokenOut,
        swapper: body.swapper,
        slippageTolerance: 0.5,
        protocols: body.protocols, 
      }),
      cache: "no-store",
    });

    const data = await response.json();

    return NextResponse.json(data, {
      status: response.status,
    });
  } catch (error) {
    console.error("QUOTE ERROR:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch quote",
      },
      { status: 500 }
    );
  }
}