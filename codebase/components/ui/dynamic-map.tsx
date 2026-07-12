"use client";

import dynamic from "next/dynamic";

/**
 * Dynamically imported RouteMap to prevent SSR issues with Leaflet.
 * Leaflet requires `window` and `document` which aren't available during SSR.
 */
const RouteMap = dynamic(() => import("@/components/ui/route-map"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[320px] w-full items-center justify-center rounded-2xl bg-muted/40">
      <p className="animate-pulse text-sm text-muted-foreground">
        Loading map…
      </p>
    </div>
  ),
});

export { RouteMap };
