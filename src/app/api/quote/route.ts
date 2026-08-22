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
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });

    const data = await response.json();

    return NextResponse.json(data, {
      status: response.status,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch quote" },
      { status: 500 }
    );
  }
}