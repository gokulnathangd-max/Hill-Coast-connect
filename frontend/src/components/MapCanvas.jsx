import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet's default marker asset paths so standard pins render correctly
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Helper sub-component to automatically center the camera whenever products update
const ChangeView = ({ center }) => {
  const map = useMap();
  map.setView(center, map.getZoom());
  return null;
};

export const MapCanvas = ({ items = [] }) => {
  // Filter out any entries that missing spatial parameters to avoid component crashes
  const validItems = items.filter(item => item && item.latitude != null && item.longitude != null);

  // Default camera tracking focal point (e.g., Coimbatore hub center or first item coordinate)
  const defaultCenter = validItems.length > 0 ? [validItems[0].latitude, validItems[0].longitude] : [11.0168, 76.9558];

  return (
    <div style={{ height: '100%', width: '100%', borderRadius: '0.75rem', overflow: 'hidden', position: 'relative' }}>
      <MapContainer 
        center={defaultCenter} 
        zoom={11} 
        style={{ height: '100%', width: '100%' }}
      >
        <ChangeView center={defaultCenter} />
        
        {/* OpenStreetMap public map tile server integration */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Dynamic coordinate marker pinpoint loops */}
        {validItems.map((item) => (
          <Marker key={item.id} position={[item.latitude, item.longitude]}>
            <Popup>
              <div style={{ fontFamily: 'sans-serif', padding: '0.25rem' }}>
                <strong style={{ color: '#0f172a', fontSize: '0.9rem' }}>{item.name}</strong>
                {/* MATCH FIXED: Changed item.stockQuantity to item.quantity to align with your Spring entity layout */}
                <p style={{ margin: '0.25rem 0 0', color: '#64748b', fontSize: '0.8rem' }}>Stock: {item.quantity != null ? item.quantity : 0} units</p>
                <p style={{ margin: '0.25rem 0 0', color: '#059669', fontSize: '0.8rem', fontWeight: 'bold' }}>₹{item.price}</p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};