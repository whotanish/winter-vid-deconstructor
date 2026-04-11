import { neon } from "@neondatabase/serverless";

function getDb() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not configured");
  return neon(url);
}

export type Plan = "free" | "weekly" | "monthly";

export type SubscriptionStatus =
  | "active"
  | "cancelled"
  | "on_hold"
  | "failed"
  | "expired";

export interface UserRecord {
  id: string;
  email: string;
  plan: Plan;
  free_analyses: number;
  subscription_id: string | null;
  subscription_status: SubscriptionStatus | null;
  subscription_ends_at: string | null;
  created_at: string;
}

/** Ensure tables exist (run once at startup / migration time) */
export async function runMigrations() {
  const sql = getDb();
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id                    TEXT PRIMARY KEY,
      email                 TEXT NOT NULL,
      plan                  TEXT NOT NULL DEFAULT 'free',
      free_analyses         INTEGER NOT NULL DEFAULT 3,
      subscription_id       TEXT,
      subscription_status   TEXT,
      subscription_ends_at  TIMESTAMPTZ,
      created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  // Add columns that may be missing on existing tables
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS free_analyses INTEGER NOT NULL DEFAULT 3`;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_id TEXT`;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_status TEXT`;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_ends_at TIMESTAMPTZ`;
}

/**
 * Get a user record. Returns null if not found.
 */
export async function getUser(clerkUserId: string): Promise<UserRecord | null> {
  const sql = getDb();
  const rows = await sql`
    SELECT id, email, plan, free_analyses, subscription_id, subscription_status, subscription_ends_at, created_at
    FROM users
    WHERE id = ${clerkUserId}
    LIMIT 1
  `;
  return (rows[0] as UserRecord) ?? null;
}

/**
 * Upsert a user (create on first sign-in, no-op if already exists).
 */
export async function upsertUser(clerkUserId: string, email: string): Promise<UserRecord> {
  const sql = getDb();
  const rows = await sql`
    INSERT INTO users (id, email, plan, free_analyses)
    VALUES (${clerkUserId}, ${email}, 'free', 3)
    ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email
    RETURNING id, email, plan, free_analyses, subscription_id, subscription_status, subscription_ends_at, created_at
  `;
  return rows[0] as UserRecord;
}

/**
 * Check if a user has an active subscription.
 */
export function hasActiveSubscription(user: UserRecord): boolean {
  return user.subscription_status === "active" && user.plan !== "free";
}

/**
 * Check if a user can run an analysis (subscribed OR has free analyses left).
 */
export function canAnalyze(user: UserRecord): boolean {
  return hasActiveSubscription(user) || user.free_analyses > 0;
}

/**
 * Deduct one free analysis. Returns the updated record, or null if none left.
 */
export async function deductFreeAnalysis(clerkUserId: string): Promise<UserRecord | null> {
  const sql = getDb();
  const rows = await sql`
    UPDATE users
    SET free_analyses = free_analyses - 1
    WHERE id = ${clerkUserId} AND free_analyses > 0
    RETURNING id, email, plan, free_analyses, subscription_id, subscription_status, subscription_ends_at, created_at
  `;
  return (rows[0] as UserRecord) ?? null;
}

/**
 * Activate a subscription for a user (called from webhook on subscription.active).
 */
export async function activateSubscription(
  clerkUserId: string,
  subscriptionId: string,
  plan: Plan
): Promise<void> {
  const sql = getDb();
  await sql`
    UPDATE users
    SET plan = ${plan},
        subscription_id = ${subscriptionId},
        subscription_status = 'active',
        subscription_ends_at = NULL
    WHERE id = ${clerkUserId}
  `;
}

/**
 * Update subscription status (cancelled, on_hold, failed, expired).
 */
export async function updateSubscriptionStatus(
  subscriptionId: string,
  status: SubscriptionStatus
): Promise<void> {
  const sql = getDb();
  const plan = status === "active" ? undefined : "free";
  if (plan) {
    await sql`
      UPDATE users
      SET subscription_status = ${status}, plan = ${plan}
      WHERE subscription_id = ${subscriptionId}
    `;
  } else {
    await sql`
      UPDATE users
      SET subscription_status = ${status}
      WHERE subscription_id = ${subscriptionId}
    `;
  }
}
