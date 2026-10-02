import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './LiveMap.css';

const pulseIcon = L.divIcon({
  className: 'live-map-pulse-icon',
  html: '<span class="live-map-pulse-ring"></span><span class="live-map-pulse-dot"></span>',
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

function RecenterOnChange({ lat, lng }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo([lat, lng], map.getZoom(), { duration: 1.1 });
  }, [lat, lng, map]);
  return null;
}

function LiveMap({ lat, lng, label }) {
  if (lat == null || lng == null) {
    return (
      <div className="live-map-fallback">
        Precise map location not set for this update yet — the admin can add coordinates
        from the shipment's detail page.
      </div>
    );
  }

  return (
    <div className="live-map-wrap">
      <MapContainer
        center={[lat, lng]}
        zoom={12}
        scrollWheelZoom={false}
        className="live-map-container"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={[lat, lng]} icon={pulseIcon} />
        <RecenterOnChange lat={lat} lng={lng} />
      </MapContainer>
      {label && <p className="live-map-caption">📍 {label}</p>}
    </div>
  );
}

export default LiveMap;