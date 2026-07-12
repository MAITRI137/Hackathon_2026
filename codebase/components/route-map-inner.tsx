"use client";

import {
  CircleMarker,
  MapContainer,
  Polyline,
  Popup,
  TileLayer,
} from "react-leaflet";

export default function RouteMapInner({
  points,
  source,
  destination,
}: {
  points: [number, number][];
  source: string;
  destination: string;
}) {
  return (
    <MapContainer
      bounds={points}
      boundsOptions={{ padding: [32, 32] }}
      scrollWheelZoom={false}
      className="h-full w-full"
      aria-label={`${source} to ${destination} OpenStreetMap route`}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Polyline
        positions={points}
        pathOptions={{ color: "#5D7052", weight: 5, dashArray: "9 8" }}
      />
      <CircleMarker
        center={points[0]}
        radius={8}
        pathOptions={{ color: "#5D7052", fillOpacity: 1 }}
      >
        <Popup>{source}</Popup>
      </CircleMarker>
      <CircleMarker
        center={points[points.length - 1]}
        radius={8}
        pathOptions={{ color: "#C18C5D", fillOpacity: 1 }}
      >
        <Popup>{destination}</Popup>
      </CircleMarker>
    </MapContainer>
  );
}
