import React, { useState, useEffect } from 'react';
import AnalyticsPanels from '../components/AnalyticsPanels';
import { MapCanvas } from '../components/MapCanvas'; 
import API from '../api/axiosConfig';

export function Dashboard() {
    const [products, setProducts] = useState([]);
    // Centered over your active operational area coordinate perimeter (Coimbatore Hub)
    const [mapCenter, setMapCenter] = useState({ lat: 11.0168, lng: 76.9558 }); 
    const [scanRadius, setScanRadius] = useState(10);
    const [systemMessage, setSystemMessage] = useState('');

    // Producer exclusive input matrix state
    const [newNode, setNewNode] = useState({ name: '', price: '', quantity: '', latitude: '', longitude: '' });
    const [submitting, setSubmitting] = useState(false);

    const userRole = localStorage.getItem('user_role') || 'ROLE_BUYER';
    const username = localStorage.getItem('user_name') || 'Network Operator';

    useEffect(() => {
        fetchMapTelemetry();
    }, []);

    const fetchMapTelemetry = async () => {
        try {
            setSystemMessage('Polling regional network array nodes...');
            const response = await API.get('/products');
            setProducts(response.data);
            setSystemMessage('');
        } catch (err) {
            console.error("Failed to extract active map data streams:", err);
            setSystemMessage('Failed to pull live map telemetry from the system core.');
        }
    };

    const handleGeofenceScan = async () => {
        try {
            // Defend against missing input strings before dispatching request actions
            if (isNaN(mapCenter.lat) || isNaN(mapCenter.lng)) {
                setSystemMessage('⚠️ Scan Aborted: Active coordinate inputs must be valid numeric floating points.');
                return;
            }

            setSystemMessage(`Initiating Haversine sweep: ${scanRadius}km range...`);
            const response = await API.get(`/products/nearby?latitude=${mapCenter.lat}&longitude=${mapCenter.lng}&radius=${scanRadius}`);
            setProducts(response.data);
            setSystemMessage(`Scan complete. Isolated ${response.data.length} proximal nodes within tracking range.`);
        } catch (err) {
            console.error("Geofence parsing exception:", err);
            setSystemMessage('Geofence boundary resolution failed.');
        }
    };

    const handleAddAssetSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const payload = {
                name: newNode.name,
                price: parseFloat(newNode.price),
                quantity: parseInt(newNode.quantity),
                latitude: parseFloat(newNode.latitude),
                longitude: parseFloat(newNode.longitude)
            };
            
            await API.post('/products', payload);
            setSystemMessage('🌟 Asset deployed successfully to the regional telemetry matrix!');
            
            // Re-target viewport frame map focus directly onto the newly deployed point location coordinates
            setMapCenter({ lat: payload.latitude, longitude: payload.longitude });
            
            setNewNode({ name: '', price: '', quantity: '', latitude: '', longitude: '' });
            fetchMapTelemetry();
        } catch (err) {
            console.error("Asset deployment failed:", err);
            setSystemMessage(err.response?.data || 'Asset creation rejection.');
        } finally {
            setSubmitting(false);
        }
    };

    // Helper utility method to shift Leaflet perspective viewport dynamically
    const handleRecenterViewport = (lat, lng) => {
        if (!lat || !lng) return;
        setMapCenter({ lat: parseFloat(lat), lng: parseFloat(lng) });
        setSystemMessage(`Viewport lock established on resource node coordinates: [${lat.toFixed(4)}, ${lng.toFixed(4)}]`);
    };

    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', padding: '2rem', fontFamily: 'system-ui, sans-serif' }}>
            
            {/* TERMINAL HEADER */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#0f172a', padding: '1.25rem 2rem', borderRadius: '0.75rem', color: '#ffffff', marginBottom: '2rem' }}>
                <div>
                    <h2 style={{ margin: 0, fontSize: '1.4rem' }}>HillCoast Connect • Operations Terminal</h2>
                    <p style={{ margin: '0.25rem 0 0 0', color: '#94a3b8', fontSize: '0.85rem' }}>Active Operator: <strong style={{ color: '#38bdf8' }}>{username}</strong> | Core Context: {userRole === 'ROLE_PRODUCER' ? '🚜 Producer Matrix' : '🛍️ Buyer Matrix'}</p>
                </div>
                <button onClick={() => { localStorage.clear(); window.location.href = '/'; }} style={{ backgroundColor: '#ef4444', color: '#fff', border: 'none', padding: '0.5rem 1rem', borderRadius: '0.375rem', cursor: 'pointer', fontWeight: 600 }}>🔒 Log Out</button>
            </div>

            {systemMessage && (
                <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', color: '#166534', padding: '0.75rem 1rem', borderRadius: '0.5rem', marginBottom: '1.5rem', fontSize: '0.85rem' }}>
                    📡 System: {systemMessage}
                </div>
            )}

            {/* MAIN INTERFACE SPLIT */}
            <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '2rem' }}>
                
                {/* ROLE-BASED INTEGRATED SIDE PANEL */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    
                    {/* ACCORDION MODULE A: SHARED PROXIMITY CALCULATOR */}
                    <div style={{ backgroundColor: '#ffffff', padding: '1.25rem', borderRadius: '0.75rem', border: '1px solid #e2e8f0' }}>
                        <h4 style={{ margin: '0 0 1rem 0', color: '#1e293b', borderBottom: '2px solid #f1f5f9', paddingBottom: '0.25rem' }}>🎯 Proximity Filter</h4>
                        <div style={{ marginBottom: '0.5rem' }}>
                            <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: 700, color: '#475569' }}>LATITUDE</label>
                            <input type="number" step="any" value={isNaN(mapCenter.lat) ? '' : mapCenter.lat} onChange={(e) => setMapCenter({ ...mapCenter, lat: parseFloat(e.target.value) })} style={{ width: '100%', padding: '0.4rem', borderRadius: '0.25rem', border: '1px solid #cbd5e1', fontSize: '0.85rem' }} />
                        </div>
                        <div style={{ marginBottom: '0.5rem' }}>
                            <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: 700, color: '#475569' }}>LONGITUDE</label>
                            <input type="number" step="any" value={isNaN(mapCenter.lng) ? '' : mapCenter.lng} onChange={(e) => setMapCenter({ ...mapCenter, lng: parseFloat(e.target.value) })} style={{ width: '100%', padding: '0.4rem', borderRadius: '0.25rem', border: '1px solid #cbd5e1', fontSize: '0.85rem' }} />
                        </div>
                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: 700, color: '#475569' }}>SCAN RANGE (KM)</label>
                            <input type="number" value={isNaN(scanRadius) ? '' : scanRadius} onChange={(e) => setScanRadius(parseInt(e.target.value) || 0)} style={{ width: '100%', padding: '0.4rem', borderRadius: '0.25rem', border: '1px solid #cbd5e1', fontSize: '0.85rem' }} />
                        </div>
                        <button onClick={handleGeofenceScan} style={{ width: '100%', backgroundColor: '#6366f1', color: '#fff', border: 'none', padding: '0.5rem', borderRadius: '0.25rem', fontWeight: 'bold', fontSize: '0.85rem', cursor: 'pointer' }}>Sweep Area</button>
                        <button onClick={fetchMapTelemetry} style={{ width: '100%', backgroundColor: 'transparent', color: '#64748b', border: '1px solid #e2e8f0', padding: '0.3rem', borderRadius: '0.25rem', fontSize: '0.75rem', marginTop: '0.5rem', cursor: 'pointer' }}>Reset Grid</button>
                    </div>

                    {/* ACCORDION MODULE B: PRODUCER INTERACTIVE DATA PANEL */}
                    {userRole === 'ROLE_PRODUCER' ? (
                        <div style={{ backgroundColor: '#ffffff', padding: '1.25rem', borderRadius: '0.75rem', border: '1px solid #e2e8f0', borderTop: '4px solid #10b981' }}>
                            <h4 style={{ margin: '0 0 1rem 0', color: '#0f172a' }}>🚜 Deploy Tracking Node</h4>
                            <form onSubmit={handleAddAssetSubmit}>
                                <div style={{ marginBottom: '0.5rem' }}>
                                    <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: 700 }}>MATERIAL CODENAME</label>
                                    <input type="text" required value={newNode.name} onChange={(e) => setNewNode({...newNode, name: e.target.value})} placeholder="E.g., Silk Weave Batch A" style={{ width: '100%', padding: '0.4rem', borderRadius: '0.25rem', border: '1px solid #cbd5e1', fontSize: '0.85rem' }} />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem', marginBottom: '0.5rem' }}>
                                    <input type="number" required placeholder="Price ₹" value={newNode.price} onChange={(e) => setNewNode({...newNode, price: e.target.value})} style={{ width: '100%', padding: '0.4rem', borderRadius: '0.25rem', border: '1px solid #cbd5e1', fontSize: '0.85rem' }} />
                                    <input type="number" required placeholder="Qty" value={newNode.quantity} onChange={(e) => setNewNode({...newNode, quantity: e.target.value})} style={{ width: '100%', padding: '0.4rem', borderRadius: '0.25rem', border: '1px solid #cbd5e1', fontSize: '0.85rem' }} />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem', marginBottom: '1rem' }}>
                                    <input type="number" step="any" required placeholder="Lat" value={newNode.latitude} onChange={(e) => setNewNode({...newNode, latitude: e.target.value})} style={{ width: '100%', padding: '0.4rem', borderRadius: '0.25rem', border: '1px solid #cbd5e1', fontSize: '0.85rem' }} />
                                    <input type="number" step="any" required placeholder="Lng" value={newNode.longitude} onChange={(e) => setNewNode({...newNode, longitude: e.target.value})} style={{ width: '100%', padding: '0.4rem', borderRadius: '0.25rem', border: '1px solid #cbd5e1', fontSize: '0.85rem' }} />
                                </div>
                                <button type="submit" disabled={submitting} style={{ width: '100%', backgroundColor: '#10b981', color: '#fff', border: 'none', padding: '0.5rem', borderRadius: '0.25rem', fontWeight: 700, cursor: 'pointer' }}>
                                    {submitting ? 'Registering...' : '➕ Inject Asset Node'}
                                </button>
                            </form>
                        </div>
                    ) : (
                        /* ACCORDION MODULE C: BUYER SPECIAL CONTEXT SUMMARY */
                        <div style={{ backgroundColor: '#ffffff', padding: '1.25rem', borderRadius: '0.75rem', border: '1px solid #e2e8f0', borderTop: '4px solid #3b82f6' }}>
                            <h4 style={{ margin: '0 0 0.5rem 0', color: '#1e3a8a' }}>🛍️ Buyer Procurement Area</h4>
                            <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b', lineHeight: '1.4' }}>
                                Use the range tool above to map logistics corridors and filter available resource stakes located nearby.
                            </p>
                        </div>
                    )}
                </div>

                {/* RIGHT SYSTEM GRID VISUALIZER */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    
                    {/* FIXED MODULE: MAP COMPONENT TARGETING CURRENT ACTIVE CENTER VIEWPORT */}
                    <div style={{ backgroundColor: '#ffffff', padding: '1.5rem', borderRadius: '0.75rem', border: '1px solid #e2e8f0' }}>
                        <h3 style={{ margin: '0 0 1rem 0', color: '#1e293b', fontSize: '1.1rem' }}>🗺️ Telemetry Map View</h3>
                        <div style={{ height: '450px', width: '100%', borderRadius: '0.5rem', overflow: 'hidden', border: '1px solid #cbd5e1' }}>
                            {/* Injected center configuration values straight to your Leaflet canvas container layer */}
                            <MapCanvas items={products} center={mapCenter} />
                        </div>
                    </div>

                    {/* LIVE CARD LISTENING ARRAY WITH RECENTERING TRIGGERS */}
                    <div style={{ backgroundColor: '#ffffff', padding: '1.5rem', borderRadius: '0.75rem', border: '1px solid #e2e8f0' }}>
                        <h3 style={{ margin: '0 0 1rem 0', color: '#1e293b', fontSize: '1.1rem' }}>🌐 Live Spatial Network Grid ({products.length} Rendered)</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem' }}>
                            {products.length === 0 ? (
                                <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem', color: '#94a3b8', border: '2px dashed #e2e8f0', borderRadius: '0.5rem' }}>
                                    No tracking structures parsed inside this boundary frame.
                                </div>
                            ) : (
                                products.map(node => (
                                    <div 
                                        key={node.id} 
                                        onClick={() => handleRecenterViewport(node.latitude, node.longitude)}
                                        style={{ border: '1px solid #e2e8f0', padding: '1rem', borderRadius: '0.5rem', backgroundColor: '#f8fafc', borderLeft: '4px solid #6366f1', cursor: 'pointer', transition: 'transform 0.2s' }}
                                        title="Click to anchor viewport tracking focus"
                                    >
                                        <div style={{ fontWeight: 700, color: '#0f172a' }}>{node.name}</div>
                                        <div style={{ fontSize: '1.1rem', fontWeight: 800, margin: '0.25rem 0' }}>₹{node.price}</div>
                                        <div style={{ fontSize: '0.7rem', color: '#64748b', fontFamily: 'monospace' }}>LOC: {node.latitude?.toFixed(3)}, {node.longitude?.toFixed(3)}</div>
                                        <div style={{ fontSize: '0.75rem', color: '#475569', marginTop: '0.25rem' }}>Stock: {node.quantity} units</div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* LOWER PORTAL: ROLE ISOLATED TELEMETRY */}
            <AnalyticsPanels products={products} />
        </div>
    );
}