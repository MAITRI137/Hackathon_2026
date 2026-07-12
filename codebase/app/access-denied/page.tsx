import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ShieldAlert } from "lucide-react";

export default function AccessDeniedPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-background">
      <div className="text-center max-w-md space-y-6">
        <div className="flex justify-center">
          <div className="h-24 w-24 rounded-full bg-destructive/10 flex items-center justify-center text-destructive">
            <ShieldAlert size={48} />
          </div>
        </div>
        <h1 className="text-3xl font-heading font-bold text-foreground">Access Denied</h1>
        <p className="text-muted-foreground">
          You do not have the required permissions to access this page. If you believe this is an error, please contact your administrator.
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
