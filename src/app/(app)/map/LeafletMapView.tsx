"use client";

import "leaflet/dist/leaflet.css";

import { useEffect, useMemo } from "react";
import {
  MapContainer,
  ImageOverlay,
  CircleMarker,
  Tooltip,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import { MAP_PX, worldToPixels } from "@/lib/palworldCoords";

type PlayerView = {
  userId: string;
  name?: string;
  ping: number | null;
  location_x?: number;
  location_y?: number;
  online: boolean;
};

function FitBounds() {
  const map = useMap();

  useEffect(() => {
    const bounds = L.latLngBounds([0, 0], [MAP_PX, MAP_PX]);
    map.fitBounds(bounds, { padding: [10, 10] });
    map.setMaxBounds(bounds);
  }, [map]);

  return null;
}

export default function LeafletMapView({ online }: { online: PlayerView[] }) {
  const bounds = useMemo(() => L.latLngBounds([0, 0], [MAP_PX, MAP_PX]), []);

  const markers = useMemo(() => {
    return online
      .filter(
        (p) =>
          typeof p.location_x === "number" && typeof p.location_y === "number",
      )
      .map((p) => {
        const { px, py } = worldToPixels(
          p.location_x as number,
          p.location_y as number,
        );
        return { p, px, py };
      })
      .filter(
        (m) =>
          Number.isFinite(m.px) &&
          Number.isFinite(m.py) &&
          m.px >= 0 &&
          m.px <= MAP_PX &&
          m.py >= 0 &&
          m.py <= MAP_PX,
      );
  }, [online]);

  return (
    <div className="relative w-full h-[72vh] rounded-xl border border-base-300 overflow-hidden">
      <MapContainer
        crs={L.CRS.Simple}
        bounds={bounds}
        minZoom={-2}
        maxZoom={4}
        zoomSnap={0.125}
        zoomDelta={0.125}
        wheelPxPerZoomLevel={120}
        preferCanvas={true}
        style={{ width: "100%", height: "100%" }}
        maxBounds={bounds}
        maxBoundsViscosity={1.0}
        zoomAnimation={false}
        markerZoomAnimation={false}
        fadeAnimation={false}
        zoomControl={false}
        attributionControl={false}
      >
        <FitBounds />
        <ImageOverlay url="/maps/palworld.webp" bounds={bounds} />

        {markers.map(({ p, px, py }) => (
          <CircleMarker
            key={p.userId}
            center={[py, px]} // [lat(y), lng(x)]
            radius={5}
            pathOptions={{
              fillColor: "#7c3aed",
              color: "rgba(255,255,255,0.9)",
              weight: 2,
              opacity: 1,
              fillOpacity: 1,
            }}
          >
            {/* Permanent label above the dot */}
            <Tooltip
              permanent
              direction="top"
              offset={[0, -8]}
              opacity={1}
              className="bg-transparent! border-0! shadow-none! p-0!"
            >
              <div
                style={{
                  color: "white",
                  background: "rgba(20, 20, 20, 0.75)",
                  border: "1px solid rgba(255,255,255,0.15)",
                  borderRadius: "10px",
                  padding: "4px 8px",
                  fontSize: "12px",
                  fontWeight: 600,
                  whiteSpace: "nowrap",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.35)",
                }}
              >
                {p.name ?? "Unknown"}
              </div>
            </Tooltip>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  );
}
