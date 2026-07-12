import { ReactNode } from "react";
import { Bus, CarFront, Truck } from "lucide-react";
import { cn } from "@/lib/utils";

/** Hand-drawn line-art sprig used as a decorative botanical accent. */
export function Sprig({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 120"
      fill="none"
      aria-hidden
      className={cn("text-primary", className)}
    >
      <path
        d="M20 108C38 84 52 58 60 14"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <path
        d="M60 26c-14-2-22-10-24-22 12 0 22 8 24 22Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M58 44c12-6 16-14 15-26-10 4-16 14-15 26Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M52 64c-13 1-21-4-26-14 11-2 21 3 26 14Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M46 82c11-1 19 2 25 11-10 3-20-1-25-11Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Soft ambient blob wash for section backgrounds. */
export function BlobWash({
  className,
  tone = "moss",
}: {
  className?: string;
  tone?: "moss" | "clay" | "sand";
}) {
  const fill =
    tone === "moss"
      ? "bg-primary/10"
      : tone === "clay"
        ? "bg-secondary/15"
        : "bg-accent/40";
  return (
    <div
      aria-hidden
      className={cn("pointer-events-none absolute blur-3xl", fill, className)}
      style={{ borderRadius: "60% 40% 30% 70% / 60% 30% 70% 40%" }}
    />
  );
}

/** Small leaf mark used beside eyebrows and in the brand block. */
export function LeafMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      className={cn("h-4 w-4 text-primary", className)}
    >
      <path
        d="M12 21C7 16 5 10 6 4c6 0 11 3 12 9 .7 4-2 7-6 8Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M8.5 17.5C10 13 12 9.5 15.5 7"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

const avatarTones = [
  "bg-primary/15 text-primary",
  "bg-secondary/20 text-[#8a6136] dark:text-secondary-foreground",
  "bg-accent/60 text-[#4A4A40] dark:bg-accent/30 dark:text-accent-foreground",
  "bg-destructive/10 text-destructive",
];

/** Deterministic initials avatar in warm organic tones — matches the reference people chips. */
export function PersonAvatar({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  const tone =
    avatarTones[
      (name.charCodeAt(0) + (name.charCodeAt(1) || 0)) % avatarTones.length
    ];
  const initials = name
    .trim()
    .split(/\s+/)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <span
      aria-hidden
      className={cn(
        "grid h-10 w-10 shrink-0 place-items-center rounded-full text-sm font-bold",
        tone,
        className
      )}
    >
      {initials}
    </span>
  );
}

const vehicleIcons: [RegExp, ReactNode][] = [
  [/bus/i, <Bus key="bus" className="h-5 w-5" strokeWidth={2} />],
  [/truck/i, <Truck key="truck" className="h-5 w-5" strokeWidth={2} />],
  [/./, <CarFront key="van" className="h-5 w-5" strokeWidth={2} />],
];

/** Vehicle thumbnail tile like the registry cards in the reference images. */
export function VehicleAvatar({
  type,
  className,
}: {
  type: string;
  className?: string;
}) {
  const icon = vehicleIcons.find(([re]) => re.test(type))?.[1];
  return (
    <span
      aria-hidden
      className={cn(
        "grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary",
        className
      )}
    >
      {icon}
    </span>
  );
}
