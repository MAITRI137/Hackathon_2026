import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ShieldAlert } from "lucide-react";

export default function AccessDeniedPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="max-w-md space-y-6 text-center">
        <div className="flex justify-center">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <ShieldAlert size={48} />
          </div>
        </div>
        <h1 className="font-heading text-3xl font-bold text-foreground">
          Access Denied
        </h1>
        <p className="text-muted-foreground">
          You do not have the required permissions to access this page. If you
          believe this is an error, please contact your administrator.
        </p>
        <div className="pt-4">
          <Button asChild className="w-full">
            <Link href="/dashboard">Return to Dashboard</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
