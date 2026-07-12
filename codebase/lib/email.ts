import nodemailer from "nodemailer";

/**
 * Best-effort local delivery (Mailpit in Docker on :1025). The outbox row is the
 * source of truth for the demo, so SMTP failure is recorded, never thrown.
 */
export async function deliverEmail(
  recipient: string,
  subject: string,
  body: string
) {
  try {
    const transport = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "127.0.0.1",
      port: Number(process.env.SMTP_PORT || 1025),
      secure: false,
      connectionTimeout: 3000,
    });
    await transport.sendMail({
      from: "TransitOps <noreply@transitops.local>",
      to: recipient,
      subject,
      text: body,
    });
    return { ok: true as const };
  } catch (error) {
    return {
      ok: false as const,
      message: error instanceof Error ? error.message : "SMTP unavailable",
    };
  }
}
