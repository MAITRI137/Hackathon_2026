import { LoginForm } from "@/components/auth/login-form";
import { getCurrentUser } from "@/lib/auth/current-user";
import { redirect } from "next/navigation";
import { Leaf } from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { BlobWash, Sprig } from "@/components/botanics";

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) {
    redirect("/dashboard");
  }

  return (
    <div id="main-content" className="flex min-h-screen bg-background">
      <div className="absolute right-4 top-4 z-50">
        <ThemeToggle />
      </div>
      {/* Left Column */}
      <div className="relative hidden w-1/2 flex-col justify-center overflow-hidden border-r border-muted-foreground/20 px-16 lg:flex xl:px-24">
        <BlobWash tone="moss" className="-left-24 -top-32 h-96 w-96" />
        <BlobWash tone="clay" className="bottom-10 right-0 h-72 w-72" />
        <Sprig className="absolute bottom-10 left-12 h-32 w-32 opacity-25" />
        {/* Subtle leaf graphic background */}
        <div className="absolute -bottom-24 -left-24 text-primary opacity-5">
          <Leaf className="h-96 w-96" />
        </div>

        <div className="z-10 max-w-md">
          <div className="mb-6 flex items-center space-x-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Leaf className="h-6 w-6" />
            </div>
          </div>
          <h1 className="mb-2 font-heading text-5xl font-bold text-primary">
            TransitOps
          </h1>
          <p className="mb-8 font-heading text-xl italic text-muted-foreground">
            Organic dashboard prototype.
          </p>
          <p className="text-lg text-foreground">
            A calm, intelligent workspace for managing operations in harmony.
          </p>
        </div>
      </div>

      {/* Right Column */}
      <div className="flex w-full flex-col items-center justify-center p-4 lg:w-1/2">
        <LoginForm />
      </div>
    </div>
  );
}
