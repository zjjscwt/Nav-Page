import { NextResponse } from "next/server";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    let symbol = searchParams.get("symbol");
    const apiKey = process.env.FINNHUB_API_KEY;

    if (!symbol) {
        return NextResponse.json({ error: "Symbol is required" }, { status: 400 });
    }

    // Map common user-friendly crypto symbols to Finnhub format
    if (symbol.toUpperCase() === "BTC-USD") symbol = "BINANCE:BTCUSDT";
    if (symbol.toUpperCase() === "ETH-USD") symbol = "BINANCE:ETHUSDT";

    if (!apiKey) {
        // If no key is configured, return mock data to avoid breaking the UI completely,
        // but include a flag so UI knows it's mock.
        return NextResponse.json({
            c: 0, d: 0, dp: 0,
            error: "MISSING_API_KEY"
        }, { status: 200 }); // Status 200 so UI receives the error payload
    }

    try {
        const res = await fetch(`https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${apiKey}`, {
            next: { revalidate: 60 } // Cache for 60 seconds
        });

        if (!res.ok) {
            throw new Error("Finnhub API error");
        }

        const data = await res.json();
        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch stock data" }, { status: 500 });
    }
}
