import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { LeafMark } from "@/components/botanics";

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="mb-1 flex items-center gap-1.5 text-xs font-bold uppercase tracking-[.2em] text-primary">
          <LeafMark className="h-3.5 w-3.5" />
          {eyebrow}
        </p>
        <h1 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
          {title}
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          {description}
        </p>
      </div>
      {action}
    </header>
  );
}

export function StatusBadge({ children }: { children: ReactNode }) {
  const value = String(children);
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-1 text-xs font-bold",
        value.includes("AVAILABLE") ||
          value.includes("COMPLETED") ||
          value.includes("Compliant") ||
          value.includes("APPROVED") ||
          value.includes("SENT")
          ? "bg-primary/15 text-primary"
          : value.includes("CRITICAL") ||
              value.includes("Expired") ||
              value.includes("SUSPENDED") ||
              value.includes("CANCELLED") ||
              value.includes("REJECTED") ||
              value.includes("FAILED")
            ? "bg-destructive/15 text-destructive dark:text-destructive-foreground"
            : "bg-secondary/20 text-[#8a6136] dark:text-secondary-foreground"
      )}
    >
      {value.replaceAll("_", " ")}
    </span>
  );
}

const statCardRadii = [
  "1.75rem 2.25rem 1.75rem 2rem",
  "2.25rem 1.5rem 2rem 1.75rem",
  "1.5rem 2rem 1.5rem 2.5rem",
  "2rem 1.75rem 2.25rem 1.5rem",
];

export function StatCard({
  label,
  value,
  detail,
  seed = 0,
}: {
  label: string;
  value: ReactNode;
  detail?: string;
  seed?: number;
}) {
  return (
    <article
      className="shadow-moss hover:shadow-organic border border-border/60 bg-card p-5 transition-all duration-300 hover:-translate-y-1 motion-reduce:transform-none"
      style={{ borderRadius: statCardRadii[seed % statCardRadii.length] }}
    >
      <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="mt-3 font-heading text-3xl font-semibold tabular-nums">
        {value}
      </p>
      {detail && <p className="mt-2 text-xs text-muted-foreground">{detail}</p>}
    </article>
  );
}

export const fieldClass =
  "h-12 rounded-full border border-border bg-background/70 px-4 text-sm outline-none transition-shadow focus:ring-2 focus:ring-ring/40 focus:ring-offset-1";
export const buttonClass =
  "inline-flex min-h-11 items-center justify-center rounded-full bg-primary px-6 text-sm font-bold text-primary-foreground shadow-moss transition-all duration-300 hover:scale-105 hover:shadow-organic active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 motion-reduce:transform-none";
export const cardClass =
  "rounded-[2rem] border border-border/60 bg-card p-5 shadow-moss";

export function EmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-[2rem] border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">
      {children}
    </div>
  );
}
