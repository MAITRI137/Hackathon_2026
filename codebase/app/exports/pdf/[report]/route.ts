import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/current-user";
import { hasPermission } from "@/lib/auth/permissions";
import { buildReportPdf } from "@/lib/pdf";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ report: string }> }
) {
  const user = await getCurrentUser();
  if (!user)
    return new NextResponse("Authentication required", { status: 401 });
  if (!hasPermission(user, "export:reports"))
    return new NextResponse(
      "Forbidden: exporting requires the reports export permission",
      { status: 403 }
    );
  const { report } = await params;
  const id = new URL(request.url).searchParams.get("id") || undefined;
  const result = await buildReportPdf(
    report,
    `${user.name} (${user.email})`,
    id
  );
  if (!result) return new NextResponse("Unknown report", { status: 404 });
  await db.auditLog.create({
    data: {
      actorId: user.id,
      action: "PDF_EXPORT",
      entityType: "Report",
      details: report,
    },
  });
  return new NextResponse(new Uint8Array(result.buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${result.filename}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
