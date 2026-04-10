import type { Plan } from "./db";

export interface PlanConfig {
  name: string;
  credits: number;
  productId: string;
  plan: Plan;
}

const PLANS: Record<string, PlanConfig> = {
  starter: {
    name: "Starter",
    credits: 10,
    productId: process.env.DODO_PRODUCT_STARTER!,
    plan: "creator",
  },
  creator: {
    name: "Creator",
    credits: 40,
    productId: process.env.DODO_PRODUCT_CREATOR!,
    plan: "creator",
  },
  pro: {
    name: "Pro",
    credits: 100,
    productId: process.env.DODO_PRODUCT_PRO!,
    plan: "pro",
  },
};

export function getPlanByName(name: string): PlanConfig | null {
  return PLANS[name.toLowerCase()] ?? null;
}

export function getPlanByProductId(productId: string): PlanConfig | null {
  return Object.values(PLANS).find((p) => p.productId === productId) ?? null;
}
