import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { getPlanByName } from "@/lib/plans";

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await currentUser();
    const email = user?.emailAddresses[0]?.emailAddress;

    const { plan } = (await req.json()) as { plan: string };
    const planConfig = getPlanByName(plan);
    if (!planConfig) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    const apiKey = process.env.DODO_API_KEY?.trim();
    if (!apiKey) {
      return NextResponse.json(
        { error: "Payment service not configured" },
        { status: 500 }
      );
    }

    const response = await fetch("https://live.dodopayments.com/checkouts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        product_cart: [
          { product_id: planConfig.productId, quantity: 1 },
        ],
        customer: {
          email: email || "",
          name: user?.firstName || "",
        },
        return_url: `${process.env.NEXT_PUBLIC_APP_URL}/app`,
        metadata: {
          user_id: userId,
        },
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error("Dodo checkout error:", response.status, errorBody);
      return NextResponse.json(
        { error: `Checkout failed (${response.status}): ${errorBody}` },
        { status: 500 }
      );
    }

    const session = await response.json();
    return NextResponse.json({ url: session.checkout_url });
  } catch (err) {
    console.error("Checkout error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Checkout failed" },
      { status: 500 }
    );
  }
}
