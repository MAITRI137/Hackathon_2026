import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { deliverEmail } from "@/lib/email";

export async function GET(request: Request) {
  // In production, you would verify an Authorization header matching a cron secret here.
  const authHeader = request.headers.get("Authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const today = new Date();
    const threshold = new Date(today.getTime() + 15 * 24 * 60 * 60 * 1000); // 15 days from now

    // Find drivers whose licenses expire before the threshold and after today (not already expired)
    const expiringDrivers = await db.driver.findMany({
      where: {
        licenceExpiry: {
          lte: threshold,
          gte: today,
        },
        status: {
          not: "SUSPENDED" // Don't remind for suspended drivers
        }
      },
    });

    if (expiringDrivers.length === 0) {
      return NextResponse.json({ message: "No licenses expiring soon." });
    }

    const recipient = "safety@transitops.local";
    const subject = `TransitOps Action Required: ${expiringDrivers.length} Driver Licenses Expiring Soon`;
    
    const driverList = expiringDrivers.map(d => 
      `• ${d.name} (License: ${d.licenceNumber}) expires on ${d.licenceExpiry.toLocaleDateString('en-IN')}`
    ).join("\n");

    const body = `Hello Safety Team,\n\nThe following drivers have licenses expiring within the next 15 days:\n\n${driverList}\n\nPlease ensure they renew their licenses to remain compliant.\n\n— TransitOps Automated System`;

    // Create Outbox entry
    const outbox = await db.emailOutbox.create({
      data: { recipient, subject, body },
    });

    // Send email
    const result = await deliverEmail(recipient, subject, body);

    // Update outbox
    await db.emailOutbox.update({
      where: { id: outbox.id },
      data: result.ok
        ? { status: "SENT", sentAt: new Date() }
        : { status: "FAILED", failureMessage: result.message },
    });

    // Also create compliance alerts for these so they show on the dashboard
    for (const driver of expiringDrivers) {
      const existingAlert = await db.complianceAlert.findFirst({
        where: {
          entityType: "Driver",
          entityId: driver.id,
          message: { contains: "License expires" },
          status: "OPEN"
        }
      });
      
      if (!existingAlert) {
        await db.complianceAlert.create({
          data: {
            severity: "WARNING",
            entityType: "Driver",
            entityId: driver.id,
            message: `License expires soon (${driver.licenceExpiry.toLocaleDateString('en-IN')})`,
            dueDate: driver.licenceExpiry,
            status: "OPEN"
          }
        });
      }
    }

    return NextResponse.json({ 
      message: `Sent reminders for ${expiringDrivers.length} drivers`,
      success: result.ok
    });

  } catch (error) {
    console.error("Cron Error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
