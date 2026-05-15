import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const body = await request.json();
    
    // In a real application, verify the signature from Circle
    console.log("Webhook received:", body);

    return NextResponse.json({ received: true });
  } catch (error) {
    return NextResponse.json({ error: "Webhook error" }, { status: 500 });
  }
}
