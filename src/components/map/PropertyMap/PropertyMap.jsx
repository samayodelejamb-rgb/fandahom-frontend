import { useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  CircleMarker,
  ZoomControl,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import { MapPin } from "lucide-react";

import {
  formatPriceCompact,
  isValidCoordinates,
  DEFAULT_MAP_CENTER,
} from "../../../utils/mapHelpers";

import PropertyCard from "./PropertyCard.jsx";
import PropertyBottomCard from "./PropertyBottomCard.jsx";
import "../../../styles/map-theme.css";
import "leaflet/dist/leaflet.css";
import "./PropertyMap.css";

/* Modern price-tag pin built from a Leaflet divIcon. */
function buildPinIcon(price, active) {
  return L.divIcon({
    className: "re-pm-marker",
    html: `<div class="re-pm-pin ${
      active ? "re-pm-pin--active" : ""
    }">
      <span>${formatPriceCompact(price)}</span>
    </div>`,
    iconSize: [92, 38],
    iconAnchor: [46, 38],
  });
}

/* Move map to selected property */
function FlyToSelected({ selected, single }) {
  const map = useMap();

  useEffect(() => {
    if (selected) {
      const lat = selected.lat ?? selected.latitude;
      const lng = selected.lng ?? selected.longitude;

      if (isValidCoordinates(lat, lng)) {
        map.flyTo(
          [Number(lat), Number(lng)],
          single ? 15 : Math.max(map.getZoom(), 13),
          {
            duration: 0.7,
          }
        );
      }
    }
  }, [selected, map, single]);

  return null;
}

/* Move map to user's current location */
function FlyToUserLocation({ location }) {
  const map = useMap();

  useEffect(() => {
    if (location) {
      map.flyTo(
        [location.lat, location.lng],
        14,
        {
          duration: 0.7,
        }
      );
    }
  }, [location, map]);

  return null;
}

/**
 * Reusable real-estate map.
 *
 * Standalone mode:
 * Pass properties to render multiple interactive markers.
 *
 * Single-property mode:
 * Pass singleProperty to render one property.
 *
 * Controlled selection:
 * Use selectedId and onSelect.
 *
 * User location:
 * Automatically requests browser location when userLocation
 * is not supplied by the parent component.
 */
export default function PropertyMap({
  properties = [],
  selectedId,
  onSelect,
  userLocation = null,
  onViewDetails,
  singleProperty = null,
}) {
  const [deviceLocation, setDeviceLocation] = useState(null);

  /* Get the user's actual device location */
  useEffect(() => {
    if (userLocation) return;

    if (
      typeof navigator === "undefined" ||
      !navigator.geolocation
    ) {
      return;
    }

    let active = true;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (active) {
          setDeviceLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        }
      },
      (error) => {
        if (active) {
          console.warn(
            "Unable to retrieve user location:",
            error.message
          );
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );

    return () => {
      active = false;
    };
  }, [userLocation]);

  /* Parent-provided location takes priority */
  const currentLocation = userLocation ?? deviceLocation;

  /* Support both lat/lng and latitude/longitude */
  const userLat =
    currentLocation?.lat ?? currentLocation?.latitude;

  const userLng =
    currentLocation?.lng ?? currentLocation?.longitude;

  const hasUserLocation =
    currentLocation != null &&
    isValidCoordinates(userLat, userLng);

  const normalizedUserLocation = hasUserLocation
    ? {
        lat: Number(userLat),
        lng: Number(userLng),
      }
    : null;

  const isSingle = Boolean(singleProperty);

  const list = isSingle
    ? [singleProperty]
    : properties;

  /* Only listings with valid coordinates can be shown */
  const mappable = list.filter(
    (property) =>
      isValidCoordinates(property.lat, property.lng) ||
      isValidCoordinates(
        property.latitude,
        property.longitude
      )
  );

  /* Preserve existing property selection behavior */
  const selected = isSingle
    ? singleProperty
    : mappable.find(
        (property) => property.id === selectedId
      ) ||
      mappable[0] ||
      null;

  const selectedCoords = selected
    ? [
        selected.lat ?? selected.latitude,
        selected.lng ?? selected.longitude,
      ]
    : null;

  const hasSelectedCoordinates =
    selectedCoords &&
    isValidCoordinates(
      selectedCoords[0],
      selectedCoords[1]
    );

  /* Explicit property selection takes priority.
     Otherwise, center on the user's location. */
  const hasExplicitSelection =
    isSingle || selectedId != null;

  const DEFAULT_CENTER = DEFAULT_MAP_CENTER;

  const center = hasExplicitSelection && hasSelectedCoordinates
    ? [
        Number(selectedCoords[0]),
        Number(selectedCoords[1]),
      ]
    : normalizedUserLocation
      ? [
          normalizedUserLocation.lat,
          normalizedUserLocation.lng,
        ]
      : hasSelectedCoordinates
        ? [
            Number(selectedCoords[0]),
            Number(selectedCoords[1]),
          ]
        : DEFAULT_CENTER;

  const showMap = isSingle
    ? mappable.length > 0
    : true;

  return (
    <div className="re-pm">
      {showMap ? (
        <MapContainer
          center={center}
          zoom={isSingle ? 15 : 11}
          scrollWheelZoom
          zoomControl={false}
          className="re-leaflet re-pm__leaflet"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <ZoomControl position="bottomright" />

          {/* User's current location */}
          {normalizedUserLocation && (
            <CircleMarker
              center={[
                normalizedUserLocation.lat,
                normalizedUserLocation.lng,
              ]}
              radius={12}
              pathOptions={{
                color: "blue",
                fillColor: "blue",
                fillOpacity: 1,
              }}
            />
          )}

          {/* Property markers */}
          {mappable.map((property) => {
            const lat =
              property.lat ?? property.latitude;

            const lng =
              property.lng ?? property.longitude;

            return (
              <Marker
                key={property.id}
                position={[
                  Number(lat),
                  Number(lng),
                ]}
                icon={buildPinIcon(
                  property.price,
                  property.id === selected?.id
                )}
                zIndexOffset={
                  property.id === selected?.id
                    ? 1000
                    : 0
                }
                eventHandlers={{
                  click: () =>
                    !isSingle &&
                    onSelect?.(property.id),
                }}
              />
            );
          })}

          {/* Fly to selected property when appropriate */}
          {selected && hasExplicitSelection && (
            <FlyToSelected
              selected={selected}
              single={isSingle}
            />
          )}

          {/* Fly to user's location when no property is explicitly selected */}
          {!hasExplicitSelection &&
            normalizedUserLocation && (
              <FlyToUserLocation
                location={normalizedUserLocation}
              />
            )}
        </MapContainer>
      ) : (
        <div className="re-pm__no-map">
          <MapPin size={24} />
          <p>Location unavailable</p>
        </div>
      )}

      {/* Desktop side panel */}
      {!isSingle && selected && (
        <aside className="re-pm__sidebar">
          <PropertyCard
            property={selected}
            onViewDetails={onViewDetails}
          />
        </aside>
      )}

      {/* Mobile bottom card */}
      {!isSingle && selected && (
        <div className="re-pm__bottom">
          <PropertyBottomCard
            property={selected}
            onViewDetails={onViewDetails}
          />
        </div>
      )}

      {/* Single-property attribution chip */}
      {isSingle && selected && (
        <div className="re-pm__single-chip">
          <MapPin size={14} />
          <span>{selected.location}</span>
        </div>
      )}

      {/* No mappable listings fallback */}
      {!isSingle && mappable.length === 0 && (
        <div className="re-pm__no-map">
          <MapPin size={24} />
          <p>
            No listings with map coordinates are available.
          </p>
        </div>
      )}
    </div>
  );
}
