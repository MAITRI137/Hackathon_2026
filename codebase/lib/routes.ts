import { db } from "@/lib/db";

export const locations: Record<string, [number, number]> = {
  Mumbai: [19.076, 72.8777],
  Pune: [18.5204, 73.8567],
  Delhi: [28.6139, 77.209],
  Jaipur: [26.9124, 75.7873],
  Ahmedabad: [23.0225, 72.5714],
  Surat: [21.1702, 72.8311],
  Bengaluru: [12.9716, 77.5946],
  Mysuru: [12.2958, 76.6394],
  Hyderabad: [17.385, 78.4867],
  Vijayawada: [16.5062, 80.648],
  Chennai: [13.0827, 80.2707],
  Goa: [15.2993, 74.124],
  "North Hub": [28.7041, 77.1025],
  "West Depot": [19.1136, 72.8697],
  "Central Yard": [18.6298, 73.7997],
  "Airport Terminal": [19.0896, 72.8656],
  "Downtown Terminal": [18.9388, 72.8354],
};

export type RouteResult = {
  start: [number, number];
  end: [number, number];
  distanceKm: number;
  durationMinutes: number;
  points: [number, number][];
  isFallback: boolean;
};

export function fallbackRoute(
  source: string,
  destination: string
): RouteResult {
  const start = locations[source] ?? locations.Mumbai;
  const end = locations[destination] ?? locations.Pune;
  const rad = Math.PI / 180;
  const a =
    Math.sin(((end[0] - start[0]) * rad) / 2) ** 2 +
    Math.cos(start[0] * rad) *
      Math.cos(end[0] * rad) *
      Math.sin(((end[1] - start[1]) * rad) / 2) ** 2;
  const distanceKm = Math.max(
    1,
    Math.round(6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 1.18)
  );
  return {
    start,
    end,
    distanceKm,
    durationMinutes: Math.round((distanceKm / 48) * 60),
    points: [
      start,
      [(start[0] + end[0]) / 2 + 0.12, (start[1] + end[1]) / 2 - 0.08] as [
        number,
        number,
      ],
      end,
    ],
    isFallback: true,
  };
}

async function fetchOsrmRoute(
  source: string,
  destination: string
): Promise<RouteResult | null> {
  const start = locations[source];
  const end = locations[destination];
  if (!start || !end) return null;
  const url = `https://router.project-osrm.org/route/v1/driving/${start[1]},${start[0]};${end[1]},${end[0]}?overview=full&geometries=geojson`;
  const response = await fetch(url, {
    signal: AbortSignal.timeout(4000),
    headers: { "User-Agent": "TransitOps-POC/1.0" },
  });
  if (!response.ok) return null;
  const data = await response.json();
  const route = data?.routes?.[0];
  if (!route?.geometry?.coordinates?.length) return null;
  const coords: [number, number][] = route.geometry.coordinates.map(
    ([lng, lat]: [number, number]) => [lat, lng]
  );
  // keep the polyline compact for DB caching — ~120 points is plenty at city scale
  const step = Math.max(1, Math.ceil(coords.length / 120));
  const points = coords.filter((_, i) => i % step === 0);
  if (points[points.length - 1] !== coords[coords.length - 1])
    points.push(coords[coords.length - 1]);
  return {
    start,
    end,
    distanceKm: Math.max(1, Math.round(route.distance / 1000)),
    durationMinutes: Math.max(1, Math.round(route.duration / 60)),
    points,
    isFallback: false,
  };
}

/**
 * Live OSRM route with a database cache and a deterministic offline fallback,
 * so the demo never depends on the public routing service being reachable.
 */
export async function resolveRoute(
  source: string,
  destination: string
): Promise<RouteResult> {
  const cached = await db.routeCache
    .findUnique({ where: { source_destination: { source, destination } } })
    .catch(() => null);
  if (cached && !cached.isFallback) {
    return {
      start: locations[source] ?? locations.Mumbai,
      end: locations[destination] ?? locations.Pune,
      distanceKm: cached.distanceKm,
      durationMinutes: cached.durationMinutes,
      points: JSON.parse(cached.polylineJson),
      isFallback: false,
    };
  }
  try {
    const live = await fetchOsrmRoute(source, destination);
    if (live) {
      await db.routeCache
        .upsert({
          where: { source_destination: { source, destination } },
          update: {
            distanceKm: live.distanceKm,
            durationMinutes: live.durationMinutes,
            polylineJson: JSON.stringify(live.points),
            isFallback: false,
          },
          create: {
            source,
            destination,
            distanceKm: live.distanceKm,
            durationMinutes: live.durationMinutes,
            polylineJson: JSON.stringify(live.points),
            isFallback: false,
          },
        })
        .catch(() => undefined);
      return live;
    }
  } catch {
    // fall through to cache/fallback
  }
  if (cached) {
    return {
      start: locations[source] ?? locations.Mumbai,
      end: locations[destination] ?? locations.Pune,
      distanceKm: cached.distanceKm,
      durationMinutes: cached.durationMinutes,
      points: JSON.parse(cached.polylineJson),
      isFallback: cached.isFallback,
    };
  }
  return fallbackRoute(source, destination);
}
