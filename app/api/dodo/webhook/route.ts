import { NextRequest } from "next/server";
import { Webhook } from "standardwebhooks";
import { dodo } from "@/lib/dodo";
import { getPlanByProductId } from "@/lib/plans";
import { addCredits, insertOrder } from "@/lib/db";

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const webhookHeaders = {
    "webhook-id": req.headers.get("webhook-id") || "",
    "webhook-signature": req.headers.get("webhook-signature") || "",
    "webhook-timestamp": req.headers.get("webhook-timestamp") || "",
  };

  try {
    const wh = new Webhook(process.env.DODO_WEBHOOK_SECRET!);
    wh.verify(rawBody, webhookHeaders);
  } catch {
    console.error("Webhook signature verification failed");
    return new Response("Invalid signature", { status: 401 });
  }

  const payload = JSON.parse(rawBody) as {
    type: string;
    data: { payload_type: string; payment_id: string };
  };

  if (
    payload.type === "payment.succeeded" &&
    payload.data.payload_type === "Payment"
  ) {
    try {
      const payment = await dodo().payments.retrieve(payload.data.payment_id);
      const userId = (payment.metadata as Record<string, string>)?.user_id;
      if (!userId) {
        console.error("No user_id in payment metadata:", payload.data.payment_id);
        return new Response("OK", { status: 200 });
      }

      const productId = payment.product_cart?.[0]?.product_id;
      const planConfig = productId ? getPlanByProductId(productId) : null;
      if (!planConfig) {
        console.error("Unknown product_id:", productId);
        return new Response("OK", { status: 200 });
      }

      // Insert order first — returns false if already processed (idempotency)
      const isNew = await insertOrder(
        payload.data.payment_id,
        userId,
        planConfig.name,
        planConfig.credits,
        payment.total_amount ?? 0,
        payment.currency ?? "USD"
      );

      if (isNew) {
        await addCredits(userId, planConfig.credits, planConfig.plan);
        console.log(
          `Added ${planConfig.credits} credits to user ${userId} (payment ${payload.data.payment_id})`
        );
      } else {
        console.log(`Duplicate webhook for payment ${payload.data.payment_id}, skipping`);
      }
    } catch (err) {
      console.error("Error processing payment webhook:", err);
    }
  }

  return new Response("OK", { status: 200 });
}
