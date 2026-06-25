import React, { useState, useEffect } from 'react';
import AnalyticsPanels from '../components/AnalyticsPanels';
import { MapCanvas } from '../components/MapCanvas'; 
import API from '../api/axiosConfig';

export function Dashboard() {
    const [products, setProducts] = useState([]);
    const [mapCenter, setMapCenter] = useState({ lat: 11.0168, lng: 76.9558 }); 
    const [scanRadius, setScanRadius] = useState(10);
    const [systemMessage, setSystemMessage] = useState('');

    const [newNode, setNewNode] = useState({ name: '', price: '', quantity: '', latitude: '', longitude: '' });
    const [submitting, setSubmitting] = useState(false);

    // --- NEW PROCUREMENT SYSTEM STATE FLAGS ---
    const [selectedProcureItem, setSelectedProcureItem] = useState(null);
    const [procureQuantity, setProcureQuantity] = useState(1);

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
            if (isNaN(mapCenter.lat) || isNaN(mapCenter.lng)) {
                setSystemMessage('⚠️ Scan Aborted: Active coordinate inputs must be valid numeric values.');
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
            setMapCenter({ lat: payload.latitude, lng: payload.longitude });
            setNewNode({ name: '', price: '', quantity: '', latitude: '', longitude: '' });
            fetchMapTelemetry();
        } catch (err) {
            console.error("Asset deployment failed:", err);
            setSystemMessage(err.response?.data || 'Asset creation rejection.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteAsset = async (productId, productName) => {
        if (!window.confirm(`Are you certain you want to decommission node [${productName}]?`)) return;
        try {
            setSystemMessage(`Sending tear-down signal to node ${productId}...`);
            await API.delete(`/products/${productId}`);
            setSystemMessage(`🗑️ Node [${productName}] cleanly purged from regional tracking grid.`);
            setProducts(prevProducts => prevProducts.filter(item => item.id !== productId));
        } catch (err) {
            console.error("Node deletion breakdown:", err);
            setSystemMessage(err.response?.data || 'Failed to complete node decommission request.');
        }
    };

    // --- TRANSACTION EXECUTION SUBMIT HANDLER ---
    const handleExecuteProcurement = async () => {
        if (procureQuantity <= 0) return;
        try {
            setSystemMessage(`Transmitting procurement order authorization for ${selectedProcureItem.name}...`);
            const response = await API.post('/orders/procure', {
                productId: selectedProcureItem.id,
                quantity: procureQuantity
            });
            
            setSystemMessage(`🛍️ Order Authorized! Receipt #${response.data.orderId} generated. Total: ₹${response.data.totalCost}`);
            setSelectedProcureItem(null);
            setProcureQuantity(1);
            fetchMapTelemetry(); // Refresh local nodes map matrix grid to sync updated stock metrics
        } catch (err) {
            console.error("Procurement operation denied:", err);
            alert(err.response?.data || 'Purchase attempt failed.');
            setSystemMessage('Order system execution error.');
        }
    };

    const handleRecenterViewport = (lat, lng) => {
        if (!lat || !lng) return;
        setMapCenter({ lat: parseFloat(lat), lng: parseFloat(lng) });
        setSystemMessage(`Viewport lock established on resource node coordinates: [${lat.toFixed(4)}, ${lng.toFixed(4)}]`);
    };

    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', padding: '2rem', fontFamily: 'system-ui, sans-serif', position: 'relative' }}>
            
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

            <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '2rem' }}>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {/* PROXIMITY CALCULATOR FILTER */}
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

                    {userRole === 'ROLE_PRODUCER' ? (
                        <div style={{ backgroundColor: '#ffffff', padding: '1.25rem', borderRadius: '0.75rem', border: '1px solid #e2e8f0', borderTop: '4px solid #10b981' }}>
                            <h4 style={{ margin: '0 0 1rem 0', color: '#0f172a' }}>🚜 Deploy Tracking Node</h4>
                            <form onSubmit={handleAddAssetSubmit}>
                                <div style={{ marginBottom: '0.5rem' }}>
                                    <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: 700 }}>MATERIAL CODENAME</label>
                                    <input type="text" required value={newNode.name} onChange={(e) => setNewNode({...newNode, name: e.target.value})} placeholder="E.g., Silk Saree Batch" style={{ width: '100%', padding: '0.4rem', borderRadius: '0.25rem', border: '1px solid #cbd5e1', fontSize: '0.85rem' }} />
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
                        <div style={{ backgroundColor: '#ffffff', padding: '1.25rem', borderRadius: '0.75rem', border: '1px solid #e2e8f0', borderTop: '4px solid #3b82f6' }}>
                            <h4 style={{ margin: '0 0 0.5rem 0', color: '#1e3a8a' }}>🛍️ Buyer Procurement Area</h4>
                            <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b', lineHeight: '1.4' }}>
                                Map artisan outposts using the tools above, then secure your stock parameters using the panel procurement triggers below.
                            </p>
                        </div>
                    )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    {/* LEAFLET CONTAINER CANVAS LAYER */}
                    <div style={{ backgroundColor: '#ffffff', padding: '1.5rem', borderRadius: '0.75rem', border: '1px solid #e2e8f0' }}>
                        <h3 style={{ margin: '0 0 1rem 0', color: '#1e293b', fontSize: '1.1rem' }}>🗺️ Telemetry Map View</h3>
                        <div style={{ height: '450px', width: '100%', borderRadius: '0.5rem', overflow: 'hidden', border: '1px solid #cbd5e1' }}>
                            <MapCanvas items={products} center={mapCenter} />
                        </div>
                    </div>

                    {/* LIVE CARD NETWORK GRID VIEWPORT */}
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
                                        style={{ 
                                            border: '1px solid #e2e8f0', padding: '1rem', borderRadius: '0.5rem', backgroundColor: '#ffffff', borderLeft: node.quantity === 0 ? '4px solid #94a3b8' : '4px solid #6366f1', opacity: node.quantity === 0 ? 0.6 : 1, cursor: 'pointer', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                                        }}
                                        title="Click to anchor viewport tracking focus"
                                    >
                                        <div>
                                            {node.distanceText && (
                                                <span style={{ float: 'right', fontSize: '0.65rem', backgroundColor: '#e0e7ff', color: '#4338ca', padding: '0.2rem 0.4rem', borderRadius: '0.25rem', fontWeight: 700 }}>
                                                    📡 {node.distanceText}
                                                </span>
                                            )}
                                            
                                            <div style={{ fontWeight: 700, color: '#0f172a', maxWidth: '70%' }}>{node.name}</div>
                                            <div style={{ fontSize: '1.2rem', fontWeight: 800, margin: '0.25rem 0', color: node.quantity === 0 ? '#64748b' : '#059669' }}>
                                                {node.quantity === 0 ? 'OUT OF STOCK' : `₹${node.price}`}
                                            </div>
                                            <div style={{ fontSize: '0.7rem', color: '#64748b', fontFamily: 'monospace' }}>LOC: {node.latitude?.toFixed(4)}, {node.longitude?.toFixed(4)}</div>
                                            <div style={{ fontSize: '0.75rem', color: '#475569', marginTop: '0.25rem', fontWeight: node.quantity === 0 ? 700 : 400 }}>
                                                Stock: {node.quantity} units
                                            </div>
                                        </div>

                                        {/* CONDITIONAL ACTION CORES FOR PRODUCERS VS BUYERS */}
                                        {userRole === 'ROLE_PRODUCER' ? (
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); handleDeleteAsset(node.id, node.name); }}
                                                style={{ width: '100%', backgroundColor: '#fee2e2', color: '#dc2626', border: '1px solid #fca5a5', padding: '0.35rem', borderRadius: '0.25rem', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', marginTop: '0.5rem' }}
                                            >
                                                🛑 Decommission Node
                                            </button>
                                        ) : (
                                            <button 
                                                disabled={node.quantity === 0}
                                                onClick={(e) => { 
                                                    e.stopPropagation(); 
                                                    setSelectedProcureItem(node); 
                                                }}
                                                style={{ width: '100%', backgroundColor: node.quantity === 0 ? '#cbd5e1' : '#2563eb', color: '#fff', border: 'none', padding: '0.35rem', borderRadius: '0.25rem', fontSize: '0.75rem', fontWeight: 600, cursor: node.quantity === 0 ? 'not-allowed' : 'pointer', marginTop: '0.5rem' }}
                                            >
                                                🛍️ Procure Stock
                                            </button>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* --- SYSTEM INTERCEPT MODAL OVERLAY SHEET FOR PURCHASES --- */}
            {selectedProcureItem && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(15, 23, 42, 0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999 }}>
                    <div style={{ backgroundColor: '#ffffff', padding: '2rem', borderRadius: '0.75rem', width: '380px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>
                        <h3 style={{ margin: '0 0 0.5rem 0', color: '#0f172a' }}>Secure Procurement</h3>
                        <p style={{ margin: '0 0 1.5rem 0', color: '#64748b', fontSize: '0.85rem' }}>Finalizing transaction allocation channels for: <strong style={{ color: '#1e293b' }}>{selectedProcureItem.name}</strong></p>
                        
                        <div style={{ marginBottom: '1.25rem' }}>
                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.5rem', color: '#334155' }}>
                                ORDER QUANTITY (Max Available: {selectedProcureItem.quantity})
                            </label>
                            <input 
                                type="number" 
                                min="1" 
                                max={selectedProcureItem.quantity} 
                                value={procureQuantity} 
                                onChange={(e) => setProcureQuantity(Math.min(selectedProcureItem.quantity, Math.max(1, parseInt(e.target.value) || 1)))} 
                                style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1', fontSize: '1rem' }} 
                            />
                        </div>

                        <div style={{ backgroundColor: '#f8fafc', padding: '0.75rem 1rem', borderRadius: '0.5rem', marginBottom: '1.5rem', fontSize: '0.9rem', color: '#334155', display: 'flex', justifyContent: 'between' }}>
                            <span>Total Invoiced Cost:</span>
                            <strong style={{ color: '#059669', marginLeft: 'auto' }}>₹{(selectedProcureItem.price * procureQuantity).toLocaleString()}</strong>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <button onClick={() => { setSelectedProcureItem(null); setProcureQuantity(1); }} style={{ backgroundColor: '#e2e8f0', color: '#475569', border: 'none', padding: '0.5rem', borderRadius: '0.375rem', fontWeight: 600, cursor: 'pointer' }}>
                                Cancel
                            </button>
                            <button onClick={handleExecuteProcurement} style={{ backgroundColor: '#059669', color: '#ffffff', border: 'none', padding: '0.5rem', borderRadius: '0.375rem', fontWeight: 600, cursor: 'pointer' }}>
                                Confirm Order
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <AnalyticsPanels products={products} />
        </div>
    );
}