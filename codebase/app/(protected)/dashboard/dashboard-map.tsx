"use client";

import { RouteMap } from "@/components/ui/dynamic-map";

interface DashboardMapProps {
  routes: {
    source: [number, number];
    destination: [number, number];
    label?: string;
    color?: string;
  }[];
}

export function DashboardMap({ routes }: DashboardMapProps) {
  return <RouteMap routes={routes} height="340px" />;
}
