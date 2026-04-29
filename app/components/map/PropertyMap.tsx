"use client";


import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
} from "react-leaflet";

import L from "leaflet";

// FIX LEAFLET ICON
delete (L.Icon.Default.prototype as any)._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",

  iconUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",

  shadowUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

type PropertyMapProps = {
  lat: number;
  lng: number;
  title: string;
  city: string;
};

export default function PropertyMap({
  lat,
  lng,
  title,
  city,
}: PropertyMapProps) {
  return (
    <div
      className="
        overflow-hidden
        rounded-[32px]
        border border-zinc-800
      "
    >

      <MapContainer
        center={[lat, lng]}
        zoom={13}
        scrollWheelZoom={false}
        className="h-[500px] w-full z-0"
      >

        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <Marker position={[lat, lng]}>

          <Popup>
            <div className="text-black">

              <strong>
                {title}
              </strong>

              <br />

              {city}

            </div>
          </Popup>

        </Marker>

      </MapContainer>

    </div>
  );
}