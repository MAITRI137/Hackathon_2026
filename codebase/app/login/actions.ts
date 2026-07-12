"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { verifyPassword } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";

const loginSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  password: z.string().min(1, { message: "Password is required" }),
});

export type LoginState = {
  errors?: {
    email?: string[];
    password?: string[];
    global?: string[];
  };
  message?: string | null;
};

export async function loginAction(
  prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const validatedFields = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Missing Fields. Failed to Login.",
    };
  }

  const { email, password } = validatedFields.data;

  try {
    const user = await db.user.findUnique({
      where: { email },
    });

    if (!user) {
      return {
        errors: { global: ["Invalid email or password."] },
        message: "Failed to Login.",
      };
    }

    if (user.status !== "ACTIVE") {
      return {
        errors: { global: ["Your account is disabled."] },
        message: "Failed to Login.",
      };
    }

    const isPasswordValid = await verifyPassword(password, user.passwordHash);

    if (!isPasswordValid) {
      return {
        errors: { global: ["Invalid email or password."] },
        message: "Failed to Login.",
      };
    }

    await createSession(user.id);
  } catch (error) {
    console.error("Login error:", error);
    return {
      errors: { global: ["An unexpected error occurred."] },
      message: "Failed to Login.",
    };
  }

  return { message: "Success" };
}
