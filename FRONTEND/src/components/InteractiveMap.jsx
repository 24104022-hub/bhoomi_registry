import React, { useEffect, useRef, useState } from "react";
import L from "leaflet";

// Fix default Leaflet icon paths in Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

export default function InteractiveMap({
  coordinates = { lat: 9.9252, lng: 78.1198 },
  onChange,
  readonly = false,
  height = "320px",
  initialAddress = "",
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [currentCoords, setCurrentCoords] = useState(coordinates);
  const [layerType, setLayerType] = useState("streets"); // "streets" | "satellite"

  // Base tile layers
  const streetsUrl = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
  const satelliteUrl = "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const initialLat = coordinates?.lat || 9.9252;
      const initialLng = coordinates?.lng || 78.1198;

      const map = L.map(mapContainerRef.current, {
        center: [initialLat, initialLng],
        zoom: 13,
        zoomControl: true,
      });

      const tileLayer = L.tileLayer(streetsUrl, {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      mapInstanceRef.current = map;
      mapInstanceRef.current._tileLayer = tileLayer;

      // Add draggable/clickable marker
      const marker = L.marker([initialLat, initialLng], {
        draggable: !readonly,
      }).addTo(map);

      marker.bindPopup(`<b>Selected Land Parcel</b><br/>Lat: ${initialLat.toFixed(5)}<br/>Lng: ${initialLng.toFixed(5)}`).openPopup();
      markerRef.current = marker;

      if (!readonly) {
        // Map click handler
        map.on("click", (e) => {
          const { lat, lng } = e.latlng;
          updateMarker(lat, lng, true);
        });

        // Marker drag handler
        marker.on("dragend", () => {
          const pos = marker.getLatLng();
          updateMarker(pos.lat, pos.lng, true);
        });
      }
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update marker position and reverse geocode
  async function updateMarker(lat, lng, shouldGeocode = false) {
    setCurrentCoords({ lat, lng });
    if (markerRef.current) {
      markerRef.current.setLatLng([lat, lng]);
      markerRef.current.getPopup().setContent(
        `<b>Selected Land Parcel</b><br/>Lat: ${lat.toFixed(5)}<br/>Lng: ${lng.toFixed(5)}`
      ).openPopup();
    }
    if (mapInstanceRef.current) {
      mapInstanceRef.current.panTo([lat, lng]);
    }

    let resolvedAddress = "";

    if (shouldGeocode) {
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`);
        if (res.ok) {
          const data = await res.json();
          if (data && data.display_name) {
            resolvedAddress = data.display_name;
          }
        }
      } catch (err) {
        console.warn("Reverse geocode failed:", err);
      }
    }

    if (onChange) {
      onChange({ lat, lng, address: resolvedAddress });
    }
  }

  // Switch between Road & Satellite view
  function toggleLayer(type) {
    setLayerType(type);
    if (!mapInstanceRef.current || !mapInstanceRef.current._tileLayer) return;

    mapInstanceRef.current.removeLayer(mapInstanceRef.current._tileLayer);

    const url = type === "satellite" ? satelliteUrl : streetsUrl;
    const attribution = type === "satellite" ? "Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS" : "&copy; OpenStreetMap";

    const newLayer = L.tileLayer(url, { maxZoom: 19, attribution }).addTo(mapInstanceRef.current);
    mapInstanceRef.current._tileLayer = newLayer;
  }

  // Search location
  async function handleSearch(e) {
    e.preventDefault();
    if (!searchQuery.trim() || searching) return;

    setSearching(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQuery)}&format=json&limit=1`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.length > 0) {
          const lat = parseFloat(data[0].lat);
          const lng = parseFloat(data[0].lon);
          updateMarker(lat, lng, false);
          if (onChange) {
            onChange({ lat, lng, address: data[0].display_name });
          }
        } else {
          alert("Location not found. Please try a different locality name or click directly on the map.");
        }
      }
    } catch (err) {
      console.error("Geocoding error:", err);
    } finally {
      setSearching(false);
    }
  }

  // Current GPS Location
  function handleUseCurrentLocation() {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        updateMarker(pos.coords.latitude, pos.coords.longitude, true);
      },
      (err) => {
        alert(`Could not fetch your location: ${err.message}`);
      }
    );
  }

  return (
    <div className="interactive-map-wrapper" style={{ marginBottom: "18px" }}>
      {!readonly && (
        <div style={{ display: "flex", gap: "8px", marginBottom: "8px", flexWrap: "wrap", alignItems: "center" }}>
          <form onSubmit={handleSearch} style={{ display: "flex", gap: "6px", flex: 1, minWidth: "240px" }}>
            <input
              type="text"
              placeholder="Search town, survey village, or landmark..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ flex: 1, padding: "7px 10px", fontSize: "0.85rem", border: "1px solid var(--line-strong)", borderRadius: "var(--radius-sm)" }}
            />
            <button type="submit" className="btn btn-secondary btn-sm" disabled={searching}>
              {searching ? "Searching…" : "Search"}
            </button>
          </form>

          <button type="button" className="btn btn-ghost btn-sm" onClick={handleUseCurrentLocation} title="Use GPS Location">
            📍 My Location
          </button>

          <div style={{ display: "flex", borderRadius: "var(--radius-sm)", overflow: "hidden", border: "1px solid var(--line-strong)" }}>
            <button
              type="button"
              className={`btn btn-sm ${layerType === "streets" ? "btn-primary" : "btn-ghost"}`}
              style={{ borderRadius: 0, padding: "4px 8px", fontSize: "0.78rem" }}
              onClick={() => toggleLayer("streets")}
            >
              Road Map
            </button>
            <button
              type="button"
              className={`btn btn-sm ${layerType === "satellite" ? "btn-primary" : "btn-ghost"}`}
              style={{ borderRadius: 0, padding: "4px 8px", fontSize: "0.78rem" }}
              onClick={() => toggleLayer("satellite")}
            >
              Satellite
            </button>
          </div>
        </div>
      )}

      <div
        ref={mapContainerRef}
        style={{
          height,
          width: "100%",
          borderRadius: "var(--radius-md)",
          overflow: "hidden",
          border: "1px solid var(--line-strong)",
          zIndex: 1,
        }}
      />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "6px", fontSize: "0.78rem", color: "var(--ink-soft)" }}>
        <span>
          <strong>Coordinates:</strong> {currentCoords?.lat?.toFixed(5) || "9.92520"}° N, {currentCoords?.lng?.toFixed(5) || "78.11980"}° E
        </span>
        {!readonly && <span>💡 Click anywhere on the map or drag the pin to select cadastral boundaries</span>}
      </div>
    </div>
  );
}
