import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/current-user";
import { hasAnyPermission } from "@/lib/auth/permissions";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return new NextResponse("Authentication required", { status: 401 });
  if (!hasAnyPermission(user, ["read:vehicles", "read:drivers", "read:finance", "read:maintenance"])) return new NextResponse("Forbidden", { status: 403 });
  const { id } = await params;
  const file = await db.storedFile.findUnique({ where: { id } });
  if (!file) return new NextResponse("Not found", { status: 404 });
  const filename = file.originalName.replace(/[^a-zA-Z0-9._-]/g, "_");
  return new NextResponse(new Uint8Array(file.data), { headers: { "Content-Type": file.mimeType, "Content-Length": String(file.size), "Content-Disposition": `attachment; filename="${filename}"`, "X-Content-Type-Options": "nosniff", "Cache-Control": "private, no-store" } });
}
