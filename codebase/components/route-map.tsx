"use client";

import dynamic from "next/dynamic";

const RouteMapInner = dynamic(() => import("./route-map-inner"), {
  ssr: false,
  loading: () => (
    <div className="grid h-52 place-items-center bg-muted text-sm text-muted-foreground">
      Loading route map…
    </div>
  ),
});
export function RouteMap(props: {
  points: [number, number][];
  source: string;
  destination: string;
}) {
  return (
    <div className="h-52 overflow-hidden rounded-[1.5rem]">
      <RouteMapInner {...props} />
    </div>
  );
}
