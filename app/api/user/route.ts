import { auth, currentUser } from "@clerk/nextjs/server";
import { upsertUser } from "@/lib/db";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const clerkUser = await currentUser();
  const email = clerkUser?.emailAddresses[0]?.emailAddress ?? "";

  const user = await upsertUser(userId, email);
  return Response.json({ credits: user.credits, plan: user.plan });
}
