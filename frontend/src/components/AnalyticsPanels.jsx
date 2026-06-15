import React, { useState, useEffect } from 'react';
import API from '../api/axiosConfig';

export default function AnalyticsPanels({ products = [] }) {
    const userRole = localStorage.getItem('user_role') || 'ROLE_BUYER';
    const username = localStorage.getItem('user_name') || 'Network Node';
    
    const [producerMetrics, setProducerMetrics] = useState({ ownedNodesCount: 0, totalInventoryValue: 0, ownedNodes: [] });
    const [buyerOrders, setBuyerOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchIsolatedAnalytics = async () => {
            try {
                setLoading(true);
                if (userRole === 'ROLE_PRODUCER') {
                    // Pull metrics for assets deployed strictly by this producer
                    const response = await API.get('/analytics/producer/regional');
                    setProducerMetrics(response.data);
                } else {
                    // Pull order history strictly for items bought by this buyer
                    const response = await API.get('/orders/my-purchases');
                    setBuyerOrders(response.data);
                }
            } catch (err) {
                console.error("Error loading isolated telemetry streams:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchIsolatedAnalytics();
        // FIXED: Using products.length prevents infinite reference loop re-fetching ticks
    }, [userRole, products.length]); 

    if (loading) return <div style={{ color: '#64748b', fontSize: '0.85rem', padding: '1rem' }}>Processing regional ledger data...</div>;

    // --- VIEW A: REGIONAL PRODUCER ANALYTICS CONSOLE ---
    if (userRole === 'ROLE_PRODUCER') {
        return (
            <div style={{ marginTop: '2rem', backgroundColor: '#ffffff', padding: '1.5rem', borderRadius: '0.75rem', border: '1px solid #e2e8f0', borderTop: '4px solid #10b981' }}>
                <h3 style={{ margin: '0 0 1rem 0', color: '#0f172a', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>🚜 Regional Producer Analytics Console</span>
                    <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 'normal' }}>Operator: {username}</span>
                </h3>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                    <div style={{ backgroundColor: '#ecfdf5', padding: '1rem', borderRadius: '0.5rem', border: '1px solid #a7f3d0' }}>
                        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#065f46', textTransform: 'uppercase' }}>Your Deployed Nodes</div>
                        <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#064e3b' }}>{producerMetrics.ownedNodesCount} <span style={{ fontSize: '0.9rem', fontWeight: 400 }}>Active Nodes</span></div>
                    </div>
                    <div style={{ backgroundColor: '#f0fdf4', padding: '1rem', borderRadius: '0.5rem', border: '1px solid #bbf7d0' }}>
                        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#166534', textTransform: 'uppercase' }}>Your Private Inventory Stake</div>
                        <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#14532d' }}>₹{(producerMetrics.totalInventoryValue || 0).toLocaleString('en-IN')}</div>
                    </div>
                </div>

                <h4 style={{ fontSize: '0.9rem', color: '#334155', marginBottom: '0.5rem' }}>Your Regional Assets Ledger</h4>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                                <th style={{ padding: '0.5rem' }}>Asset Name</th>
                                <th style={{ padding: '0.5rem' }}>Stock Capacity</th>
                                <th style={{ padding: '0.5rem' }}>Unit Value</th>
                                <th style={{ padding: '0.5rem' }}>Spatial Telemetry</th>
                            </tr>
                        </thead>
                        <tbody>
                            {!producerMetrics.ownedNodes || producerMetrics.ownedNodes.length === 0 ? (
                                <tr><td colSpan="4" style={{ padding: '1rem', color: '#94a3b8', textAlign: 'center' }}>You haven't deployed any asset nodes to the network map yet.</td></tr>
                            ) : (
                                producerMetrics.ownedNodes.map(node => (
                                    <tr key={node.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                        <td style={{ padding: '0.5rem', fontWeight: 600 }}>{node.name}</td>
                                        <td style={{ padding: '0.5rem' }}>{node.quantity} units</td>
                                        <td style={{ padding: '0.5rem' }}>₹{node.price}</td>
                                        <td style={{ padding: '0.5rem', color: '#64748b' }}>{node.latitude?.toFixed(4)}, {node.longitude?.toFixed(4)}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    }

    // --- VIEW B: SECURE PROCUREMENT BUYER LEDGER ---
    return (
        <div style={{ marginTop: '2rem', backgroundColor: '#ffffff', padding: '1.5rem', borderRadius: '0.75rem', border: '1px solid #e2e8f0', borderTop: '4px solid #3b82f6' }}>
            <h3 style={{ margin: '0 0 1rem 0', color: '#0f172a', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>🛍️ Secure Procurement Buyer Ledger</span>
                <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 'normal' }}>Account: {username}</span>
            </h3>

            <div style={{ backgroundColor: '#eff6ff', padding: '1rem', borderRadius: '0.5rem', border: '1px solid #bfdbfe', marginBottom: '1.5rem' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#1e40af', textTransform: 'uppercase' }}>Verified Orders Secured</div>
                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#1e3a8a' }}>{buyerOrders.length} <span style={{ fontSize: '0.9rem', fontWeight: 400 }}>Procured Contracts</span></div>
            </div>

            <h4 style={{ fontSize: '0.9rem', color: '#334155', marginBottom: '0.5rem' }}>Your Supply Chain Contracts</h4>
            <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
                    <thead>
                        <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                            <th style={{ padding: '0.5rem' }}>Order Hash ID</th>
                            <th style={{ padding: '0.5rem' }}>Product Sourced</th>
                            <th style={{ padding: '0.5rem' }}>Status Mapping</th>
                        </tr>
                    </thead>
                    <tbody>
                        {buyerOrders.length === 0 ? (
                            <tr><td colSpan="3" style={{ padding: '1rem', color: '#94a3b8', textAlign: 'center' }}>No secured order contracts linked to this buyer identity alias.</td></tr>
                        ) : (
                            buyerOrders.map(order => (
                                <tr key={order.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                    <td style={{ padding: '0.5rem', fontFamily: 'monospace', color: '#6366f1' }}>#HC-00{order.id}</td>
                                    <td style={{ padding: '0.5rem', fontWeight: 600 }}>{order.productName || `Node Ref: ${order.productId}`}</td>
                                    <td style={{ padding: '0.5rem' }}><span style={{ backgroundColor: '#dcfce7', color: '#15803d', padding: '2px 6px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700 }}>VERIFIED</span></td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}