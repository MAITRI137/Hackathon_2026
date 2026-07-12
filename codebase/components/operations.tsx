import { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function PageHeader({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: ReactNode }) {
  return <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
    <div><p className="mb-1 text-xs font-bold uppercase tracking-[.2em] text-primary">{eyebrow}</p><h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h1><p className="mt-2 max-w-2xl text-sm text-muted-foreground">{description}</p></div>{action}
  </header>;
}

export function StatusBadge({ children }: { children: ReactNode }) {
  const value = String(children);
  return <span className={cn("inline-flex rounded-full px-2.5 py-1 text-xs font-bold", value.includes("AVAILABLE") || value.includes("COMPLETED") || value.includes("Compliant") || value.includes("APPROVED") ? "bg-primary/15 text-primary" : value.includes("CRITICAL") || value.includes("Expired") || value.includes("SUSPENDED") || value.includes("CANCELLED") || value.includes("REJECTED") ? "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300" : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200")}>{value.replaceAll("_", " ")}</span>;
}

export function StatCard({ label, value, detail }: { label: string; value: ReactNode; detail?: string }) {
  return <article className="rounded-[1.75rem] border bg-card p-5 shadow-moss"><p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{label}</p><p className="mt-3 font-heading text-3xl font-semibold tabular-nums">{value}</p>{detail && <p className="mt-2 text-xs text-muted-foreground">{detail}</p>}</article>;
}

export const fieldClass = "h-11 rounded-full border bg-background px-4 text-sm outline-none focus:ring-2 focus:ring-ring";
export const buttonClass = "inline-flex min-h-11 items-center justify-center rounded-full bg-primary px-5 text-sm font-bold text-primary-foreground transition hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50";
export const cardClass = "rounded-[2rem] border bg-card p-5 shadow-moss";

export function EmptyState({ children }: { children: ReactNode }) {
  return <div className="rounded-[2rem] border border-dashed bg-card p-10 text-center text-sm text-muted-foreground">{children}</div>;
}
