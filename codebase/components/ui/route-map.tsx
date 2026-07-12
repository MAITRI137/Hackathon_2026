"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface RouteMapProps {
  routes?: {
    source: [number, number];
    destination: [number, number];
    waypoints?: [number, number][];
    label?: string;
    color?: string;
  }[];
  center?: [number, number];
  zoom?: number;
  className?: string;
  height?: string;
}

/** Real Leaflet map with OpenStreetMap tiles and polyline routes. */
export default function RouteMap({
  routes = [],
  center = [20.5937, 78.9629], // India center
  zoom = 5,
  className = "",
  height = "320px",
}: RouteMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center,
      zoom,
      zoomControl: true,
      attributionControl: false,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 18,
    }).addTo(map);

    // Render routes
    const bounds = L.latLngBounds([]);

    routes.forEach((route, i) => {
      const points: L.LatLngExpression[] = [
        route.source,
        ...(route.waypoints || []),
        route.destination,
      ];
      const color =
        route.color ||
        ["#5D7052", "#C18C5D", "#4A90D9", "#D94A4A", "#8B5CF6"][i % 5];

      L.polyline(points, {
        color,
        weight: 4,
        opacity: 0.85,
        dashArray: "8 6",
      }).addTo(map);

      // Source marker
      L.circleMarker(route.source, {
        radius: 7,
        fillColor: color,
        fillOpacity: 1,
        color: "#fff",
        weight: 2,
      })
        .bindTooltip(route.label ? `${route.label} (Start)` : "Start", {
          permanent: false,
        })
        .addTo(map);

      // Destination marker
      L.circleMarker(route.destination, {
        radius: 7,
        fillColor: "#C18C5D",
        fillOpacity: 1,
        color: "#fff",
        weight: 2,
      })
        .bindTooltip(route.label ? `${route.label} (End)` : "End", {
          permanent: false,
        })
        .addTo(map);

      points.forEach((p) => bounds.extend(p));
    });

    if (routes.length > 0 && bounds.isValid()) {
      map.fitBounds(bounds, { padding: [30, 30] });
    }

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      ref={containerRef}
      className={`w-full overflow-hidden rounded-2xl ${className}`}
      style={{ height, minHeight: "200px" }}
    />
  );
}
