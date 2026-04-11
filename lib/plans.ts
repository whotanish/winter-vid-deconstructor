import type { Plan } from "./db";

export interface PlanConfig {
  name: string;
  plan: Plan;
  productId: string;
  interval: "week" | "month";
}

const PLANS: Record<string, PlanConfig> = {
  weekly: {
    name: "Weekly",
    plan: "weekly",
    productId: process.env.DODO_PRODUCT_WEEKLY!,
    interval: "week",
  },
  monthly: {
    name: "Monthly",
    plan: "monthly",
    productId: process.env.DODO_PRODUCT_MONTHLY!,
    interval: "month",
  },
};

export function getPlanByName(name: string): PlanConfig | null {
  return PLANS[name.toLowerCase()] ?? null;
}

export function getPlanByProductId(productId: string): PlanConfig | null {
  return Object.values(PLANS).find((p) => p.productId === productId) ?? null;
}
