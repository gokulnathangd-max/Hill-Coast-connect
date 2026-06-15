import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

export default function LoginPortal() {
    const [loginMode, setLoginMode] = useState('BUYER'); // BUYER or PRODUCER
    const [credentials, setCredentials] = useState({ username: '', password: '' }); // CHANGED: email -> username
    const [errorMsg, setErrorMsg] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleInputChange = (e) => {
        setCredentials({ ...credentials, [e.target.name]: e.target.value });
    };

    const handleLoginSubmit = async (e) => {
        e.preventDefault();
        setErrorMsg('');
        setLoading(true);
        
        try {
            // Target your Spring Boot authentication backend endpoint directly
            const response = await axios.post('http://localhost:8080/api/auth/login', {
                username: credentials.username, // CHANGED: Sending username payload field
                password: credentials.password,
                role: `ROLE_${loginMode}`
            });

            if (response.data && response.data.token) {
                localStorage.setItem('auth_token', response.data.token);
                localStorage.setItem('user_role', response.data.role); // ROLE_BUYER or ROLE_PRODUCER
                localStorage.setItem('user_name', response.data.username || credentials.username);

                navigate('/dashboard');
            } else {
                throw new Error('Authentication parameters missing fields.');
            }
        } catch (err) {
            console.error("Login handshake error:", err);
            setErrorMsg(err.response?.data?.message || err.response?.data || 'Invalid authentication token sequence.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#f1f5f9', fontFamily: 'system-ui, sans-serif' }}>
            <div style={{ backgroundColor: '#ffffff', padding: '2.5rem', borderRadius: '1rem', width: '380px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
                
                <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                    <h2 style={{ margin: '0 0 0.25rem 0', color: '#0f172a', fontSize: '1.75rem' }}>HillCoast Connect</h2>
                    <p style={{ margin: 0, color: '#64748b', fontSize: '0.85rem' }}>Industrial Extraction & Supply Chain Network</p>
                </div>
                
                {/* PORTAL GATEWAY SELECTOR TABS */}
                <div style={{ display: 'flex', marginBottom: '1.5rem', borderRadius: '0.5rem', overflow: 'hidden', border: '1px solid #cbd5e1', backgroundColor: '#f8fafc', padding: '2px' }}>
                    <button 
                        type="button"
                        onClick={() => setLoginMode('BUYER')}
                        style={{ flex: 1, padding: '0.6rem', border: 'none', borderRadius: '0.375rem', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem', transition: 'all 0.2s', backgroundColor: loginMode === 'BUYER' ? '#3b82f6' : 'transparent', color: loginMode === 'BUYER' ? '#ffffff' : '#475569' }}
                    >
                        🛍️ Buyer Portal
                    </button>
                    <button 
                        type="button"
                        onClick={() => setLoginMode('PRODUCER')}
                        style={{ flex: 1, padding: '0.6rem', border: 'none', borderRadius: '0.375rem', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem', transition: 'all 0.2s', backgroundColor: loginMode === 'PRODUCER' ? '#10b981' : 'transparent', color: loginMode === 'PRODUCER' ? '#ffffff' : '#475569' }}
                    >
                        🚜 Producer Portal
                    </button>
                </div>

                {errorMsg && (
                    <div style={{ color: '#ef4444', backgroundColor: '#fef2f2', padding: '0.6rem', borderRadius: '0.375rem', marginBottom: '1rem', fontSize: '0.8rem', textAlign: 'center', border: '1px solid #fee2e2' }}>
                        {errorMsg}
                    </div>
                )}

                <form onSubmit={handleLoginSubmit}>
                    {/* CHANGED FIELD: Label and name updated to username */}
                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.25rem', color: '#475569', textTransform: 'uppercase' }}>Network Username</label>
                        <input type="text" name="username" required value={credentials.username} onChange={handleInputChange} placeholder="Enter your username" style={{ width: '100%', padding: '0.6rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1', fontSize: '0.9rem', boxSizing: 'border-box' }} />
                    </div>
                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.25rem', color: '#475569', textTransform: 'uppercase' }}>Secure Passkey</label>
                        <input type="password" name="password" required value={credentials.password} onChange={handleInputChange} placeholder="••••••••" style={{ width: '100%', padding: '0.6rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1', fontSize: '0.9rem', boxSizing: 'border-box' }} />
                    </div>
                    
                    <button 
                        type="submit" 
                        disabled={loading}
                        style={{ width: '100%', padding: '0.75rem', border: 'none', borderRadius: '0.375rem', color: '#fff', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.9rem', backgroundColor: loginMode === 'BUYER' ? '#3b82f6' : '#10b981', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}
                    >
                        {loading ? 'Validating Signatures...' : `Access ${loginMode === 'BUYER' ? 'Buyer' : 'Producer'} Terminal`}
                    </button>
                </form>

                <div style={{ marginTop: '1.75rem', textAlign: 'center', fontSize: '0.85rem', color: '#64748b', borderTop: '1px solid #f1f5f9', paddingTop: '1.25rem' }}>
                    New entity node on the network?{' '}
                    <Link to="/register" style={{ color: '#6366f1', textDecoration: 'none', fontWeight: 700 }}>
                        👤 Create New Account
                    </Link>
                </div>

            </div>
        </div>
    );
}