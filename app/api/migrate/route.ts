import { runMigrations } from "@/lib/db";

// Call this once after each deploy: GET /api/migrate?secret=YOUR_MIGRATE_SECRET
// Protect it with a secret so random people can't hammer it.
export async function GET(req: Request) {
  const secret = new URL(req.url).searchParams.get("secret");
  if (secret !== process.env.MIGRATE_SECRET) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }
  await runMigrations();
  return Response.json({ ok: true, message: "Migrations complete" });
}
