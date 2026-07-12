"use client";

import { useRouter } from "next/navigation";
import { ReactNode } from "react";

export function ClickableCard({
  href,
  children,
  className,
}: {
  href: string;
  children: ReactNode;
  className?: string;
}) {
  const router = useRouter();
  return (
    <article
      className={`cursor-pointer ${className || ""}`}
      onClick={(e) => {
        if (!(e.target as HTMLElement).closest("a, button, details, input, select")) {
          router.push(href);
        }
      }}
    >
      {children}
    </article>
  );
}
