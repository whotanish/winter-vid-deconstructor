import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { dodo } from "@/lib/dodo";
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

    console.log("Creating checkout session:", {
      plan,
      productId: planConfig.productId,
      email,
      userId,
    });

    const session = await dodo().checkoutSessions.create({
      product_cart: [{ product_id: planConfig.productId, quantity: 1 }],
      customer: {
        email: email || "",
        name: user?.firstName || "",
      },
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/app`,
      metadata: {
        user_id: userId,
      },
    });

    console.log("Checkout session created:", session.session_id);

    return NextResponse.json({ url: session.checkout_url });
  } catch (err) {
    console.error("Checkout error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Checkout failed" },
      { status: 500 }
    );
  }
}
