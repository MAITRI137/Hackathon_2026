"use client";
import Form from "next/form";

import { useEffect, useRef, useState, useActionState } from "react";
import { useFormStatus } from "react-dom";
import { loginAction } from "@/app/login/actions";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Leaf, Eye, EyeOff, ChevronDown } from "lucide-react";

export function LoginForm() {
  const [state, formAction] = useActionState(loginAction, {
    message: null,
    errors: {},
  });
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  const handleRoleSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const email = e.target.value;
    if (email && emailRef.current && passwordRef.current) {
      emailRef.current.value = email;
      passwordRef.current.value = "password123";
    }
  };

  useEffect(() => {
    if (state?.message === "Success") {
      router.push("/dashboard");
    } else if (state?.message && state.message !== "Success") {
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: state.errors?.global?.[0] || state.message,
      });
    }
  }, [state, router, toast]);

  return (
    <Card className="w-full max-w-sm overflow-hidden rounded-[2rem] border-0 bg-card p-2 pb-8 shadow-2xl sm:p-6">
      <CardHeader className="items-center space-y-4 pb-8 pt-4 text-center">
        <div className="mb-2 flex items-center justify-center space-x-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Leaf className="h-4 w-4" />
          </div>
          <span className="font-heading text-2xl font-bold tracking-tight text-primary">
            TransitOps
          </span>
        </div>
        <div className="space-y-2">
          <CardTitle className="font-heading text-2xl font-bold text-foreground">
            Sign in to account
          </CardTitle>
          <CardDescription className="text-xs">
            Configure your credentials/role below to login
          </CardDescription>
        </div>
      </CardHeader>
      <Form action={formAction} ref={formRef}>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-xs">
              Email Address
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              ref={emailRef}
              placeholder="fleet@transitops.local"
              required
              aria-describedby="email-error"
              className="h-11 rounded-xl border-0 bg-background"
            />
            {state?.errors?.email && (
              <p id="email-error" className="text-xs text-destructive">
                {state.errors.email[0]}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="text-xs">
              Password
            </Label>
            <div className="relative">
              <Input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                ref={passwordRef}
                defaultValue="password123"
                required
                aria-describedby="password-error"
                className="h-11 rounded-xl border-0 bg-background pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {state?.errors?.password && (
              <p id="password-error" className="text-xs text-destructive">
                {state.errors.password[0]}
              </p>
            )}
          </div>

          <div className="space-y-2 pt-2">
            <Label htmlFor="role" className="text-xs">
              Select System Scope (RBAC)
            </Label>
            <div className="relative">
              <select
                id="role"
                onChange={handleRoleSelect}
                className="flex h-11 w-full appearance-none items-center justify-between rounded-xl border-0 bg-background px-3 py-2 pr-8 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">Select a role...</option>
                <option value="fleet@transitops.local">Fleet Manager</option>
                <option value="driver@transitops.local">Driver</option>
                <option value="safety@transitops.local">Safety Officer</option>
                <option value="finance@transitops.local">
                  Financial Analyst
                </option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                <ChevronDown className="h-4 w-4 opacity-50" />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="remember"
                className="h-3.5 w-3.5 rounded border-muted-foreground/30 text-primary focus:ring-primary"
              />
              <label
                htmlFor="remember"
                className="cursor-pointer text-xs text-muted-foreground"
              >
                Remember me
              </label>
            </div>
            <a
              href="#"
              className="text-xs text-muted-foreground transition-colors hover:text-primary"
            >
              Forgot a password?
            </a>
          </div>

          <div className="pt-4">
            <SubmitButton />
          </div>
        </CardContent>
      </Form>
    </Card>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      className="h-12 w-full rounded-full text-sm font-medium"
      disabled={pending}
    >
      {pending ? "Signing in..." : "Sign in"}
    </Button>
  );
}
