import { neon } from "@neondatabase/serverless";

function getDb() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not configured");
  return neon(url);
}

export type Plan = "free" | "creator" | "pro" | "agency";

export interface UserRecord {
  id: string;
  email: string;
  credits: number;
  plan: Plan;
  created_at: string;
}

/** Ensure tables exist (run once at startup / migration time) */
export async function runMigrations() {
  const sql = getDb();
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id          TEXT PRIMARY KEY,
      email       TEXT NOT NULL,
      credits     INTEGER NOT NULL DEFAULT 3,
      plan        TEXT NOT NULL DEFAULT 'free',
      created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS orders (
      id          TEXT PRIMARY KEY,
      user_id     TEXT NOT NULL REFERENCES users(id),
      plan        TEXT NOT NULL,
      credits     INTEGER NOT NULL,
      amount      INTEGER NOT NULL,
      currency    TEXT NOT NULL DEFAULT 'USD',
      status      TEXT NOT NULL DEFAULT 'succeeded',
      created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
}

/**
 * Get a user record. Returns null if not found.
 */
export async function getUser(clerkUserId: string): Promise<UserRecord | null> {
  const sql = getDb();
  const rows = await sql`
    SELECT id, email, credits, plan, created_at
    FROM users
    WHERE id = ${clerkUserId}
    LIMIT 1
  `;
  return (rows[0] as UserRecord) ?? null;
}

/**
 * Upsert a user (create on first sign-in with 3 free credits, no-op if already exists).
 */
export async function upsertUser(clerkUserId: string, email: string): Promise<UserRecord> {
  const sql = getDb();
  const rows = await sql`
    INSERT INTO users (id, email, credits, plan)
    VALUES (${clerkUserId}, ${email}, 3, 'free')
    ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email
    RETURNING id, email, credits, plan, created_at
  `;
  return rows[0] as UserRecord;
}

/**
 * Deduct one credit atomically. Returns the updated record, or null if the user
 * has 0 credits (caller should return 402).
 */
export async function deductCredit(clerkUserId: string): Promise<UserRecord | null> {
  const sql = getDb();
  const rows = await sql`
    UPDATE users
    SET credits = credits - 1
    WHERE id = ${clerkUserId} AND credits > 0
    RETURNING id, email, credits, plan, created_at
  `;
  return (rows[0] as UserRecord) ?? null;
}

/**
 * Add credits to a user (called from payment webhook).
 */
export async function addCredits(clerkUserId: string, amount: number, plan?: Plan): Promise<void> {
  const sql = getDb();
  if (plan) {
    await sql`
      UPDATE users
      SET credits = credits + ${amount}, plan = ${plan}
      WHERE id = ${clerkUserId}
    `;
  } else {
    await sql`
      UPDATE users
      SET credits = credits + ${amount}
      WHERE id = ${clerkUserId}
    `;
  }
}

/**
 * Insert an order record (audit trail for payments).
 * Returns true if the order was newly inserted, false if it already existed (idempotency).
 */
export async function insertOrder(
  paymentId: string,
  userId: string,
  plan: string,
  credits: number,
  amount: number,
  currency: string
): Promise<boolean> {
  const sql = getDb();
  const rows = await sql`
    INSERT INTO orders (id, user_id, plan, credits, amount, currency)
    VALUES (${paymentId}, ${userId}, ${plan}, ${credits}, ${amount}, ${currency})
    ON CONFLICT (id) DO NOTHING
    RETURNING id
  `;
  return rows.length > 0;
}
