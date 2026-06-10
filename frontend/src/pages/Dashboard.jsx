import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import API from '../api/axiosConfig';

// Import mandatory Leaflet CSS sheets directly to build the map viewport canvas layout
import 'leaflet/dist/leaflet.css';

// FIX: Override Leaflet's default broken marker asset paths caused by Webpack bundling builds
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import markerRetina from 'leaflet/dist/images/marker-icon-2x.png';

let DefaultIcon = L.icon({
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
    iconRetinaUrl: markerRetina,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// Custom alternative red pin marker icon for highlighting nodes targeted inside the geofence sweep
const RadarTargetIcon = L.icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    shadowUrl: markerShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

export const Dashboard = () => {
    const [products, setProducts] = useState([]);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    
    // Core node deployment form state
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: '',
        quantity: '',
        latitude: '',
        longitude: ''
    });

    // GEOFENCE RADAR STATES (Centered on your Ooty region coordinates)
    const [radarCoords, setRadarCoords] = useState({ latitude: '11.4102', longitude: '76.6950', radius: '10' });
    const [radarResults, setRadarResults] = useState([]);
    const [radarLoading, setRadarLoading] = useState(false);
    const [hasScanned, setHasScanned] = useState(false);

    // Active map reference hook to pan views dynamically during radar sweeps
    const [mapRef, setMapRef] = useState(null);

    // Fetch all active fleet nodes
    const fetchProducts = async () => {
        try {
            const response = await API.get('/products');
            setProducts(response.data);
            setError('');
            
            // If a radar scan has already run, recalculate intercepted targets with new coordinates
            if (hasScanned) {
                recalculateLiveIntercepts(response.data);
            }
        } catch (err) {
            console.error("Unable to read streaming telemetry vectors:", err);
            setError('Failed to fetch updated telemetry nodes from the server.');
        }
    };

    // Recalculates matching geofence intercepts on the client-side during the telemetry interval loop
    const recalculateLiveIntercepts = (latestProducts) => {
        const targetLat = parseFloat(radarCoords.latitude);
        const targetLng = parseFloat(radarCoords.longitude);
        const radiusKm = parseFloat(radarCoords.radius);

        if (isNaN(targetLat) || !targetLng || isNaN(radiusKm)) return;

        // Haversine calculation to verify proximity to current coordinates
        const filtered = latestProducts.filter(node => {
            if (!node.latitude || !node.longitude) return false;
            
            const R = 6371; // Earth radius in km
            const dLat = (node.latitude - targetLat) * Math.PI / 180;
            const dLon = (node.longitude - targetLng) * Math.PI / 180;
            const a = 
                Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(targetLat * Math.PI / 180) * Math.cos(node.latitude * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
            const distance = R * c;
            
            return distance <= radiusKm;
        });

        setRadarResults(filtered);
    };

    // Keeps fetching the latest positions from the backend simulation loop every 5 seconds automatically
    useEffect(() => {
        fetchProducts();

        const telemetryInterval = setInterval(() => {
            fetchProducts();
        }, 5000);

        return () => clearInterval(telemetryInterval);
    }, [hasScanned, radarCoords]); // Dependency triggers keep tracking precise map configurations

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleRadarChange = (e) => {
        const { name, value } = e.target;
        setRadarCoords(prev => ({ ...prev, [name]: value }));
    };

    // Form Submission: Deploy Fresh Node
    const handleDeployNode = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await API.post('/products', {
                name: formData.name,
                description: formData.description,
                price: parseFloat(formData.price),
                quantity: parseInt(formData.quantity, 10),
                latitude: parseFloat(formData.latitude),
                longitude: parseFloat(formData.longitude)
            });

            if (response.status === 200 || response.status === 201) {
                setFormData({ name: '', description: '', price: '', quantity: '', latitude: '', longitude: '' });
                await fetchProducts();
                alert('Telemetry node provisioned and deployed successfully!');
            }
        } catch (err) {
            console.error("Post Error Structure:", err);
            setError(err.response?.data?.message || err.response?.data || 'Failed to register new telemetry node.');
        } finally {
            setLoading(false);
        }
    };

    // Handle Geofence API Search Call
    const handleGeofenceScan = async (e) => {
        e.preventDefault();
        setRadarLoading(true);
        setError('');
        const targetLat = parseFloat(radarCoords.latitude);
        const targetLng = parseFloat(radarCoords.longitude);

        try {
            const response = await API.get(`/products/nearby`, {
                params: {
                    latitude: targetLat,
                    longitude: targetLng,
                    radius: radarCoords.radius
                }
            });
            setRadarResults(response.data);
            setHasScanned(true);

            if (mapRef) {
                mapRef.setView([targetLat, targetLng], 12);
            }
        } catch (err) {
            console.error("Geofence Scan Failure:", err);
            setError('Radar array calculation handshake error.');
        } finally {
            setRadarLoading(false);
        }
    };

    const isNodeIntercepted = (id) => radarResults.some(item => item.id === id);

    // Compute basic visual metrics for our dashboard overlay analytics
    const computeMetrics = () => {
        const totalItems = products.length;
        const totalValue = products.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);
        const interceptedCount = radarResults.length;
        const interceptPercentage = totalItems > 0 ? ((interceptedCount / totalItems) * 100).toFixed(1) : 0;

        return { totalItems, totalValue, interceptedCount, interceptPercentage };
    };

    const metrics = computeMetrics();

    // INTERNAL EVENT COMPONENT: Intercepts map grid clicks to auto-populate form variables
    const MapClickListener = () => {
        useMapEvents({
            click: (e) => {
                const { lat, lng } = e.latlng;
                setFormData(prev => ({
                    ...prev,
                    latitude: lat.toFixed(6),
                    longitude: lng.toFixed(6)
                }));
            },
        });
        return null; 
    };

    return (
        <div style={{ padding: '2rem', fontFamily: 'system-ui, sans-serif', backgroundColor: '#f8fafc', minHeight: '100vh' }}>
            <header style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 style={{ margin: 0, color: '#0f172a', fontSize: '1.75rem' }}>HillCoast Connect</h1>
                    <p style={{ margin: '0.25rem 0 0 0', color: '#64748b' }}>Active Fleet Node Spatial Geospatial Tracking Console</p>
                </div>
                <div style={{ backgroundColor: '#0f172a', color: '#fff', padding: '0.5rem 1rem', borderRadius: '0.5rem', fontWeight: 600, fontSize: '0.875rem' }}>
                    Active Network Relays: ({products.length})
                </div>
            </header>

            {/* LIVE ANALYTICS TILES BLOCK */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
                <div style={{ backgroundColor: '#ffffff', padding: '1rem', borderRadius: '0.5rem', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Global Nodes Tracked</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a', marginTop: '0.25rem' }}>{metrics.totalItems}</div>
                </div>
                <div style={{ backgroundColor: '#ffffff', padding: '1rem', borderRadius: '0.5rem', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Total Portfolio Inventory</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a', marginTop: '0.25rem' }}>₹{metrics.totalValue.toLocaleString('en-IN')}</div>
                </div>
                <div style={{ backgroundColor: '#ffffff', padding: '1rem', borderRadius: '0.5rem', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0', borderLeft: '4px solid #ef4444' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#ef4444', textTransform: 'uppercase' }}>Geofence Intercepts</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#ef4444', marginTop: '0.25rem' }}>{metrics.interceptedCount}</div>
                </div>
                <div style={{ backgroundColor: '#ffffff', padding: '1rem', borderRadius: '0.5rem', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Density Match Ring</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#3b82f6', marginTop: '0.25rem' }}>{metrics.interceptPercentage}%</div>
                </div>
            </div>

            {error && (
                <div style={{ padding: '1rem', backgroundColor: '#fef2f2', color: '#ef4444', borderRadius: '0.5rem', marginBottom: '1.5rem', border: '1px solid #fee2e2' }}>
                    {error}
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: '2rem' }}>
                
                {/* LEFT CONSOLE COLUMN: OPERATIONS CONTROL */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    
                    {/* Panel A: Provision Form */}
                    <section style={{ backgroundColor: '#ffffff', padding: '1.25rem', borderRadius: '0.75rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
                        <h2 style={{ marginTop: 0, marginBottom: '1rem', fontSize: '1.1rem', color: '#1e293b' }}>Provision Asset Node</h2>
                        <form onSubmit={handleDeployNode}>
                            <div style={{ marginBottom: '0.75rem' }}>
                                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.25rem', color: '#475569' }}>Asset Name</label>
                                <input type="text" name="name" required value={formData.name} onChange={handleInputChange} placeholder="e.g., Organic Nilgiri Tea Leaves" style={{ width: '100%', padding: '0.4rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1', boxSizing: 'border-box', fontSize: '0.85rem' }} />
                            </div>
                            <div style={{ marginBottom: '0.75rem' }}>
                                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.25rem', color: '#475569' }}>Description</label>
                                <input type="text" name="description" required value={formData.description} onChange={handleInputChange} placeholder="Yield metrics..." style={{ width: '100%', padding: '0.4rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1', boxSizing: 'border-box', fontSize: '0.85rem' }} />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.25rem', color: '#475569' }}>Price (₹)</label>
                                    <input type="number" name="price" required value={formData.price} onChange={handleInputChange} style={{ width: '100%', padding: '0.4rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1', boxSizing: 'border-box', fontSize: '0.85rem' }} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.25rem', color: '#475569' }}>Stock Quantity</label>
                                    <input type="number" name="quantity" required value={formData.quantity} onChange={handleInputChange} style={{ width: '100%', padding: '0.4rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1', boxSizing: 'border-box', fontSize: '0.85rem' }} />
                                </div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.25rem', color: '#475569' }}>Latitude</label>
                                    <input type="number" step="0.000001" name="latitude" required value={formData.latitude} onChange={handleInputChange} placeholder="11.4105" style={{ width: '100%', padding: '0.4rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1', boxSizing: 'border-box', fontSize: '0.85rem' }} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.25rem', color: '#475569' }}>Longitude</label>
                                    <input type="number" step="0.000001" name="longitude" required value={formData.longitude} onChange={handleInputChange} placeholder="76.6956" style={{ width: '100%', padding: '0.4rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1', boxSizing: 'border-box', fontSize: '0.85rem' }} />
                                </div>
                            </div>
                            <button type="submit" disabled={loading} style={{ width: '100%', backgroundColor: '#0f172a', color: '#ffffff', padding: '0.55rem', border: 'none', borderRadius: '0.375rem', fontWeight: 600, cursor: 'pointer', fontSize: '0.875rem' }}>
                                {loading ? 'Deploying...' : 'Deploy Asset Node'}
                            </button>
                        </form>
                    </section>

                    {/* Panel B: Geofence Radar Scanner */}
                    <section style={{ backgroundColor: '#ffffff', padding: '1.25rem', borderRadius: '0.75rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0', borderLeft: '4px solid #3b82f6' }}>
                        <h2 style={{ marginTop: 0, marginBottom: '1rem', fontSize: '1.1rem', color: '#1e293b' }}>Geofence Radar Array Scanner</h2>
                        <form onSubmit={handleGeofenceScan} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 600, marginBottom: '0.25rem', color: '#475569' }}>Center Lat</label>
                                <input type="number" step="0.0001" name="latitude" value={radarCoords.latitude} onChange={handleRadarChange} style={{ width: '100%', padding: '0.4rem', borderRadius: '0.25rem', border: '1px solid #cbd5e1', fontSize: '0.8rem' }} />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 600, marginBottom: '0.25rem', color: '#475569' }}>Center Lng</label>
                                <input type="number" step="0.0001" name="longitude" value={radarCoords.longitude} onChange={handleRadarChange} style={{ width: '100%', padding: '0.4rem', borderRadius: '0.25rem', border: '1px solid #cbd5e1', fontSize: '0.8rem' }} />
                            </div>
                            <div style={{ gridColumn: 'span 2' }}>
                                <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 600, marginBottom: '0.25rem', color: '#475569' }}>Radius (km)</label>
                                <input type="number" name="radius" value={radarCoords.radius} onChange={handleRadarChange} style={{ width: '100%', padding: '0.4rem', borderRadius: '0.25rem', border: '1px solid #cbd5e1', fontSize: '0.8rem' }} />
                            </div>
                            <button type="submit" style={{ gridColumn: 'span 2', marginTop: '0.25rem', backgroundColor: '#3b82f6', color: '#ffffff', padding: '0.5rem', border: 'none', borderRadius: '0.375rem', fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem' }}>
                                {radarLoading ? 'Scanning Radius Formulas...' : 'Execute Geofence Radar Scan'}
                            </button>
                        </form>
                    </section>
                </div>

                {/* RIGHT CONSOLE COLUMN: SPATIAL MAP INTERFACE VISUALS */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    
                    <div style={{ height: '480px', width: '100%', borderRadius: '0.75rem', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', border: '1px solid #cbd5e1', zIndex: 1 }}>
                        <MapContainer 
                            center={[11.4102, 76.6950]} 
                            zoom={13} 
                            style={{ height: '100%', width: '100%' }}
                            ref={setMapRef}
                        >
                            <TileLayer
                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            />

                            <MapClickListener />

                            {products.map((node) => {
                                if (!node.latitude || !node.longitude) return null;
                                const intercepted = isNodeIntercepted(node.id);

                                return (
                                    <Marker 
                                        key={node.id} 
                                        position={[node.latitude, node.longitude]}
                                        icon={intercepted ? RadarTargetIcon : DefaultIcon}
                                    >
                                        <Popup>
                                            <div style={{ fontFamily: 'sans-serif', minWidth: '160px' }}>
                                                <h4 style={{ margin: '0 0 4px 0', color: '#0f172a', fontSize: '0.95rem' }}>{node.name}</h4>
                                                <p style={{ margin: '0 0 6px 0', fontSize: '0.75rem', color: '#475569' }}>{node.description}</p>
                                                <div style={{ fontSize: '0.75rem', borderTop: '1px solid #e2e8f0', paddingTop: '4px' }}>
                                                    <div>Price: <strong>₹{node.price}</strong></div>
                                                    <div>Quantity: <strong>{node.quantity || 0}</strong></div>
                                                    {intercepted && <div style={{ color: '#ef4444', fontWeight: 'bold', marginTop: '4px' }}>🎯 RADAR INTERCEPTED</div>}
                                                </div>
                                            </div>
                                        </Popup>
                                    </Marker>
                                );
                            })}

                            {hasScanned && (
                                <Circle
                                    center={[parseFloat(radarCoords.latitude), parseFloat(radarCoords.longitude)]}
                                    radius={parseFloat(radarCoords.radius) * 1000}
                                    pathOptions={{
                                        color: '#3b82f6',
                                        fillColor: '#93c5fd',
                                        fillOpacity: 0.25,
                                        weight: 2,
                                        dashArray: '5, 5'
                                    }}
                                />
                            )}
                        </MapContainer>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                        <section style={{ backgroundColor: '#eff6ff', padding: '1rem', borderRadius: '0.75rem', border: '1px dashed #bfdbfe' }}>
                            <h3 style={{ marginTop: 0, marginBottom: '0.5rem', fontSize: '1rem', color: '#1d4ed8' }}>🎯 Intercept Array Targets ({radarResults.length})</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', maxHeight: '110px', overflowY: 'auto' }}>
                                {radarResults.map(node => (
                                    <div key={node.id} style={{ backgroundColor: '#ffffff', padding: '0.4rem 0.75rem', borderRadius: '0.375rem', fontSize: '0.8rem', display: 'flex', justifyContent: 'space-between', borderLeft: '3px solid #ef4444' }}>
                                        <span><strong>{node.name}</strong></span>
                                        <span style={{ color: '#64748b' }}>Lat: {node.latitude.toFixed(3)} | Lng: {node.longitude.toFixed(3)}</span>
                                    </div>
                                ))}
                            </div>
                        </section>

                        <section style={{ backgroundColor: '#ffffff', padding: '1rem', borderRadius: '0.75rem', border: '1px solid #e2e8f0' }}>
                            <h3 style={{ marginTop: 0, marginBottom: '0.5rem', fontSize: '1rem', color: '#1e293b' }}>Global Registry Map Logs</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', maxHeight: '110px', overflowY: 'auto' }}>
                                {products.map(node => (
                                    <div key={node.id} style={{ backgroundColor: '#f8fafc', padding: '0.4rem 0.75rem', borderRadius: '0.375rem', fontSize: '0.8rem', display: 'flex', justifyContent: 'space-between' }}>
                                        <span>{node.name}</span>
                                        <span style={{ color: '#64748b' }}>Qty: {node.quantity || 0}</span>
                                    </div>
                                ))}
                            </div>
                        </section>
                    </div>

                </div>
            </div>
        </div>
    );
};