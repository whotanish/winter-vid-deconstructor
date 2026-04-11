import { NextRequest } from "next/server";
import { Webhook } from "standardwebhooks";
import { dodo } from "@/lib/dodo";
import { getPlanByProductId } from "@/lib/plans";
import { activateSubscription, updateSubscriptionStatus } from "@/lib/db";

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
    data: {
      payload_type: string;
      subscription_id?: string;
      payment_id?: string;
    };
  };

  if (payload.data.payload_type !== "Subscription") {
    return new Response("OK", { status: 200 });
  }

  const subscriptionId = payload.data.subscription_id;
  if (!subscriptionId) {
    console.error("No subscription_id in webhook payload");
    return new Response("OK", { status: 200 });
  }

  try {
    switch (payload.type) {
      case "subscription.active":
      case "subscription.renewed": {
        const subscription = await dodo().subscriptions.retrieve(subscriptionId);
        const userId = (subscription.metadata as Record<string, string>)?.user_id;
        if (!userId) {
          console.error("No user_id in subscription metadata:", subscriptionId);
          break;
        }

        const productId = subscription.product_id;
        const planConfig = productId ? getPlanByProductId(productId) : null;
        if (!planConfig) {
          console.error("Unknown product_id:", productId);
          break;
        }

        await activateSubscription(userId, subscriptionId, planConfig.plan);
        console.log(`Activated ${planConfig.name} subscription for user ${userId}`);
        break;
      }

      case "subscription.cancelled": {
        await updateSubscriptionStatus(subscriptionId, "cancelled");
        console.log(`Subscription ${subscriptionId} cancelled`);
        break;
      }

      case "subscription.on_hold": {
        await updateSubscriptionStatus(subscriptionId, "on_hold");
        console.log(`Subscription ${subscriptionId} on hold`);
        break;
      }

      case "subscription.failed": {
        await updateSubscriptionStatus(subscriptionId, "failed");
        console.log(`Subscription ${subscriptionId} failed`);
        break;
      }

      case "subscription.expired": {
        await updateSubscriptionStatus(subscriptionId, "expired");
        console.log(`Subscription ${subscriptionId} expired`);
        break;
      }
    }
  } catch (err) {
    console.error("Error processing subscription webhook:", err);
  }

  return new Response("OK", { status: 200 });
}
