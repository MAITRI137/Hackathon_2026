import { destroyCurrentSession, getCurrentSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";

export async function GET() {
  const user = await getCurrentSession();
  await destroyCurrentSession();
  if (user)
    await db.auditLog.create({
      data: {
        actorId: user.id,
        action: "LOGOUT",
        entityType: "User",
        entityId: user.id,
      },
    });
  redirect("/login");
}
