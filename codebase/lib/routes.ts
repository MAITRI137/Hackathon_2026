export const locations: Record<string, [number, number]> = {
  Mumbai: [19.076, 72.8777], Pune: [18.5204, 73.8567], Delhi: [28.6139, 77.209], Jaipur: [26.9124, 75.7873], Ahmedabad: [23.0225, 72.5714], Surat: [21.1702, 72.8311], Bengaluru: [12.9716, 77.5946], Mysuru: [12.2958, 76.6394], Hyderabad: [17.385, 78.4867], Vijayawada: [16.5062, 80.648], Chennai: [13.0827, 80.2707], Goa: [15.2993, 74.124], "North Hub": [28.7041, 77.1025], "West Depot": [19.1136, 72.8697], "Central Yard": [18.6298, 73.7997], "Airport Terminal": [19.0896, 72.8656], "Downtown Terminal": [18.9388, 72.8354],
};

export function fallbackRoute(source: string, destination: string) {
  const start = locations[source] ?? locations.Mumbai;
  const end = locations[destination] ?? locations.Pune;
  const rad = Math.PI / 180;
  const a = Math.sin((end[0] - start[0]) * rad / 2) ** 2 + Math.cos(start[0] * rad) * Math.cos(end[0] * rad) * Math.sin((end[1] - start[1]) * rad / 2) ** 2;
  const distanceKm = Math.max(1, Math.round(6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 1.18));
  return { start, end, distanceKm, durationMinutes: Math.round(distanceKm / 48 * 60), points: [start, [(start[0] + end[0]) / 2 + .12, (start[1] + end[1]) / 2 - .08] as [number, number], end], isFallback: true };
}
