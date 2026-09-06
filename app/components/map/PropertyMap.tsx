"use client";

import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
} from "react-leaflet";



import L from "leaflet";

type PropertyMapProps = {
  lat: number;
  lng: number;
  title?: string;
};

const icon = new L.Icon({
  iconUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",

  shadowUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",

  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

export default function PropertyMap({
  lat,
  lng,
  title,
}: PropertyMapProps) {

  return (
    <div
      className="
        overflow-hidden
        rounded-[32px]
        border border-[#e2ddd3]
      "
    >

      <MapContainer
        center={[lat, lng]}
        zoom={13}
        scrollWheelZoom={false}
        className="h-[400px] w-full"
      >

        <TileLayer
          attribution='&copy; OpenStreetMap'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <Marker
          position={[lat, lng]}
          icon={icon}
        >

          <Popup>
            {title || "Ingatlan"}
          </Popup>

        </Marker>

      </MapContainer>

    </div>
  );

}