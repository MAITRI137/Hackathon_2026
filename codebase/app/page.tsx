import { db } from "@/lib/db";

export default async function Home() {
  // Simple check to verify DB is connected
  let dbStatus = "Checking...";
  try {
    const checks = await db.healthCheck.findMany({ take: 1 });
    dbStatus = checks ? "Connected" : "No records";
  } catch (error) {
    dbStatus = "Error: Database not ready";
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 w-full max-w-5xl items-center justify-between rounded-lg border border-border bg-slate-900/50 p-8 font-mono text-sm">
        <h1 className="mb-4 text-4xl font-bold">
          TransitOps workspace is ready.
        </h1>
        <div className="mt-8 space-y-2">
          <p className="text-lg">Environment Status:</p>
          <ul className="list-inside list-disc text-slate-300">
            <li>App running: ✅</li>
            <li>Database configured: ✅</li>
            <li>
              Prisma client available: {dbStatus === "Connected" ? "✅" : "❌"}
            </li>
            <li>Database status: {dbStatus}</li>
          </ul>
        </div>
      </div>
    </main>
  );
}
