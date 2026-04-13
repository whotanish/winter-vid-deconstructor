import type { Plan } from "./db";

export interface PlanConfig {
  name: string;
  plan: Plan;
  productId: string;
  interval: "week" | "month";
}

export function getPlanByName(name: string): PlanConfig | null {
  const plans: Record<string, PlanConfig> = {
    weekly: {
      name: "Weekly",
      plan: "weekly",
      productId: (process.env.DODO_PRODUCT_WEEKLY || "").trim(),
      interval: "week",
    },
    monthly: {
      name: "Monthly",
      plan: "monthly",
      productId: (process.env.DODO_PRODUCT_MONTHLY || "").trim(),
      interval: "month",
    },
  };
  return plans[name.toLowerCase()] ?? null;
}

export function getPlanByProductId(productId: string): PlanConfig | null {
  const plans: PlanConfig[] = [
    {
      name: "Weekly",
      plan: "weekly",
      productId: (process.env.DODO_PRODUCT_WEEKLY || "").trim(),
      interval: "week",
    },
    {
      name: "Monthly",
      plan: "monthly",
      productId: (process.env.DODO_PRODUCT_MONTHLY || "").trim(),
      interval: "month",
    },
  ];
  return plans.find((p) => p.productId === productId) ?? null;
}
