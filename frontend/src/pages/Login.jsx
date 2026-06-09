import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/axiosConfig'; // Ensure this points to your axios wrapper

export const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLoginSubmit = async (e) => {
        e.preventDefault();
        setError('');

        try {
            // CRITICAL FIX: Use the 'API' instance so it targets the correct URL dynamically!
            const res = await API.post('/auth/login', { username, password });
            
            if (res.data && (res.data.token || res.data.accessToken || res.data.jwt)) {
                const activeToken = res.data.token || res.data.accessToken || res.data.jwt;
                
                // Save it cleanly to the active browser context origin layout
                localStorage.setItem('token', activeToken.trim());
                
                // Route safely to the map workspace view dashboard
                navigate('/dashboard');
            } else {
                setError('Authentication succeeded, but no token sequence was returned.');
            }
        } catch (err) {
            console.error("Login Interface Network Error:", err);
            setError(err.response?.data?.message || err.response?.data || 'Invalid credentials');
        }
    };

    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#f8fafc' }}>
            <form onSubmit={handleLoginSubmit} style={{ width: '400px', padding: '2.5rem', backgroundColor: '#ffffff', borderRadius: '0.75rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
                <h2 style={{ margin: '0 0 0.25rem 0', color: '#0f172a' }}>HillCoast Connect</h2>
                <p style={{ margin: '0 0 1.5rem 0', color: '#64748b', fontSize: '0.875rem' }}>Node Operator Authorization Gateway</p>
                
                {error && <div style={{ padding: '0.75rem', backgroundColor: '#fef2f2', color: '#ef4444', border: '1px solid #fee2e2', borderRadius: '0.375rem', marginBottom: '1rem', fontSize: '0.875rem' }}>{error}</div>}
                
                <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#475569', marginBottom: '0.25rem' }}>Username</label>
                    <input type="text" required value={username} onChange={(e) => setUsername(e.target.value)} style={{ width: '100%', padding: '0.6rem', border: '1px solid #cbd5e1', borderRadius: '0.375rem', boxSizing: 'border-box' }} />
                </div>
                
                <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#475569', marginBottom: '0.25rem' }}>Security Password</label>
                    <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} style={{ width: '100%', padding: '0.6rem', border: '1px solid #cbd5e1', borderRadius: '0.375rem', boxSizing: 'border-box' }} />
                </div>

                <button type="submit" style={{ width: '100%', backgroundColor: '#0f172a', color: '#ffffff', padding: '0.75rem', border: 'none', borderRadius: '0.375rem', fontWeight: 600, cursor: 'pointer' }}>
                    Authenticate Credentials
                </button>
            </form>
        </div>
    );
};