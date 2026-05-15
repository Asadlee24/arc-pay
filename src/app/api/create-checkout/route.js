import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const body = await request.json();
    const { amount, publicKey, orderId } = body;

    if (!amount || !publicKey) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // In a production app, we would register this checkout intent in a database
    // and potentially create a Circle payment intent here.
    const paymentId = `arc_${Math.random().toString(36).substr(2, 9)}`;

    return NextResponse.json({
      success: true,
      paymentId: paymentId,
      amount,
      recipient: publicKey || process.env.NEXT_PUBLIC_MERCHANT_WALLET,
      network: "Arc Testnet",
      chainId: process.env.NEXT_PUBLIC_ARC_CHAIN_ID,
      usdcAddress: process.env.NEXT_PUBLIC_USDC_ADDRESS,
      status: "pending"
    });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
