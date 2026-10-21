import { useState } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import { MapPin } from "lucide-react";
import "leaflet/dist/leaflet.css";
import "../../styles/map-theme.css";
import { isValidCoordinates, DEFAULT_MAP_CENTER } from "../../utils/mapHelpers";
import "./LocationPicker.css";

const DEFAULT_CENTER = DEFAULT_MAP_CENTER;

function pickerIcon() {
  return L.divIcon({
    className: "re-loc-picker__marker",
    html: `<div class="re-loc-picker__pin"><svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#1f6c69" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3" fill="#1f6c69"/></svg></div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 28],
  });
}

function ClickHandler({ onPick }) {
  useMapEvents({
    click(e) {
      const point = e.latlng.wrap(); // longitude stays within -180..180
      onPick({ latitude: point.lat, longitude: point.lng });
    },
  });
  return null;
}

/**
 * Reusable location picker for a future Create Listing form.
 *
 * Props:
 *  - initialLatitude / initialLongitude: optional starting coordinates
 *  - onLocationSelect({ latitude, longitude }): called when the user clicks the map
 *  - height / className: optional layout props
 *
 * If initial coordinates are missing the map falls back to a sensible
 * default center. The parent always receives backend field names
 * (latitude / longitude) via onLocationSelect.
 */
export default function LocationPicker({
  initialLatitude,
  initialLongitude,
  onLocationSelect,
  height = 320,
  className = "",
}) {
  const hasInitial = isValidCoordinates(initialLatitude, initialLongitude);
  const center = hasInitial
    ? [initialLatitude, initialLongitude]
    : DEFAULT_CENTER;

  const [picked, setPicked] = useState(
    hasInitial
      ? { latitude: initialLatitude, longitude: initialLongitude }
      : null,
  );

  const handlePick = (coords) => {
    setPicked(coords);
    onLocationSelect?.(coords);
  };

  return (
    <div
      className={`re-loc-picker ${className}`}
      style={{ height }}
      role="group"
      aria-label="Location picker — click the map to select a location"
    >
      <MapContainer
        center={center}
        zoom={hasInitial ? 15 : 11}
        scrollWheelZoom
        className="re-leaflet re-loc-picker__map"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ClickHandler onPick={handlePick} />
        {picked && (
          <Marker
            position={[picked.latitude, picked.longitude]}
            icon={pickerIcon()}
          />
        )}
      </MapContainer>

      <div className="re-loc-picker__hint">
        <MapPin size={14} />
        <span>
          {picked
            ? `Selected: ${picked.latitude.toFixed(5)}, ${picked.longitude.toFixed(5)}`
            : "Click the map to select a location"}
        </span>
      </div>
    </div>
  );
}
