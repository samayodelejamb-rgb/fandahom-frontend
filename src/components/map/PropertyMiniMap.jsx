import { MapContainer, TileLayer, Marker, ZoomControl } from "react-leaflet";
import L from "leaflet";
import { MapPin } from "lucide-react";
import "leaflet/dist/leaflet.css";
import "../../styles/map-theme.css";
import { isValidCoordinates } from "../../utils/mapHelpers";
import "./PropertyMiniMap.css";

function miniMapIcon() {
  return L.divIcon({
    className: "re-minimap__marker",
    html: `<div class="re-minimap__pin"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1f6c69" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3" fill="#1f6c69"/></svg></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 24],
  });
}

/**
 * Reusable compact mini-map for a future Property Details page.
 *
 * Props:
 *  - latitude / longitude: property coordinates (backend field names)
 *  - height / className: optional layout props
 *
 * If latitude or longitude is missing/invalid, a graceful fallback
 * "Location unavailable" is shown instead of a broken map.
 */
export default function PropertyMiniMap({
  latitude,
  longitude,
  height = 240,
  className = "",
}) {
  if (!isValidCoordinates(latitude, longitude)) {
    return (
      <div
        className={`re-minimap re-minimap--fallback ${className}`}
        style={{ height }}
        role="status"
        aria-label="Location unavailable"
      >
        <MapPin size={22} />
        <span>Location unavailable</span>
      </div>
    );
  }

  return (
    <div
      className={`re-minimap ${className}`}
      style={{ height }}
      aria-label="Property location map"
    >
      <MapContainer
        center={[latitude, longitude]}
        zoom={14}
        scrollWheelZoom={false}
        zoomControl={false}
        className="re-leaflet re-minimap__leaflet"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ZoomControl position="bottomright" />
        <Marker position={[latitude, longitude]} icon={miniMapIcon()} />
      </MapContainer>
    </div>
  );
}
