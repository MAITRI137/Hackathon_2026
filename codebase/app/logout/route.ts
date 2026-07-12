import { destroyCurrentSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";

export async function GET() {
  await destroyCurrentSession();
  redirect("/login");
}
