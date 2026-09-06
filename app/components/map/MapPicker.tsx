"use client";

import {
  MapContainer,
  TileLayer,
  Marker,
  useMapEvents,
} from "react-leaflet";

import L from "leaflet";

type MapPickerProps = {
  lat: number;
  lng: number;

  setLat: (lat: number) => void;
  setLng: (lng: number) => void;
};

const icon = new L.Icon({
  iconUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",

  shadowUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",

  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

function LocationMarker({
  lat,
  lng,
  setLat,
  setLng,
}: MapPickerProps) {

  useMapEvents({
    click(e) {

      setLat(e.latlng.lat);
      setLng(e.latlng.lng);

    },
  });

  return (
    <Marker
      position={[lat, lng]}
      icon={icon}
    />
  );
}

export default function MapPicker({
  lat,
  lng,
  setLat,
  setLng,
}: MapPickerProps) {

  return (
    <div
      className="
        overflow-hidden
        rounded-3xl
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
          attribution="&copy; OpenStreetMap"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <LocationMarker
          lat={lat}
          lng={lng}
          setLat={setLat}
          setLng={setLng}
        />

      </MapContainer>

    </div>
  );
}