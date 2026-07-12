import { LoginForm } from "@/components/auth/login-form";
import { getCurrentUser } from "@/lib/auth/current-user";
import { redirect } from "next/navigation";
import { Leaf } from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-screen bg-background">
      <div className="absolute top-4 right-4 z-50">
        <ThemeToggle />
      </div>
      {/* Left Column */}
      <div className="hidden lg:flex w-1/2 flex-col justify-center px-16 xl:px-24 relative overflow-hidden border-r border-muted-foreground/20">
        {/* Subtle leaf graphic background */}
        <div className="absolute -bottom-24 -left-24 opacity-5 text-primary">
          <Leaf className="w-96 h-96" />
        </div>
        
        <div className="z-10 max-w-md">
          <div className="flex items-center space-x-3 mb-6">
            <div className="h-12 w-12 rounded-full bg-primary flex items-center justify-center text-primary-foreground">
              <Leaf className="w-6 h-6" />
            </div>
          </div>
          <h1 className="text-5xl font-heading font-bold text-primary mb-2">TransitOps</h1>
          <p className="text-xl font-heading italic text-muted-foreground mb-8">Organic dashboard prototype.</p>
          <p className="text-lg text-foreground">
            A calm, intelligent workspace for managing operations in harmony.
          </p>
        </div>
      </div>
      
      {/* Right Column */}
      <div className="flex w-full lg:w-1/2 flex-col items-center justify-center p-4">
        <LoginForm />
      </div>
    </div>
  );
}
