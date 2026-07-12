import { z } from "zod";

export const vehicleInput = z.object({
  registrationNumber: z
    .string()
    .trim()
    .min(3)
    .max(30)
    .transform((value) => value.toUpperCase()),
  name: z.string().trim().min(2).max(80),
  type: z.string().trim().min(2).max(40),
  maxLoadCapacity: z.coerce.number().positive(),
  odometer: z.coerce.number().nonnegative(),
  status: z.enum(["AVAILABLE", "IN_SHOP", "RETIRED"]),
});

export const driverInput = z.object({
  name: z.string().trim().min(2).max(80),
  employeeId: z.string().trim().min(2).max(30),
  licenceNumber: z
    .string()
    .trim()
    .min(3)
    .max(40)
    .transform((value) => value.toUpperCase()),
  licenceCategory: z.string().trim().min(1).max(30),
  licenceExpiry: z.coerce.date(),
  contactNumber: z.string().trim().min(7).max(20),
  safetyScore: z.coerce.number().min(0).max(100),
  status: z.enum(["AVAILABLE", "OFF_DUTY", "SUSPENDED"]),
});

export function driverCompliance(
  driver: { status: string; licenceExpiry: Date },
  now = new Date()
) {
  if (driver.status === "SUSPENDED") return "Suspended";
  const days = (driver.licenceExpiry.getTime() - now.getTime()) / 86_400_000;
  if (days < 0) return "Expired";
  if (days <= 30) return "Expiring Soon";
  return "Compliant";
}
