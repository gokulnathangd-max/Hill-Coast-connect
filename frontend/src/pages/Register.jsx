import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

export default function Register() {
    // FIXED: Changed 'name' field property directly to 'username' to match backend mapping requirements
    const [formData, setFormData] = useState({ username: '', email: '', password: '', role: 'ROLE_BUYER' });
    const [errorMsg, setErrorMsg] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleRegisterSubmit = async (e) => {
        e.preventDefault();
        setErrorMsg('');
        setLoading(true);

        try {
            // Reaches out to your updated AuthController registration endpoint mapping
            const response = await axios.post('http://localhost:8080/api/auth/register', formData);
            if (response.status === 200 || response.status === 201) {
                alert('Account node registered successfully! Proceeding to network gateway.');
                navigate('/'); // Redirect back to the login gateway selection tabs
            }
        } catch (err) {
            console.error("Registration node assignment failure:", err);
            // Extracts the exact error string returned by our Map.of("message", ...) handler
            setErrorMsg(err.response?.data?.message || err.response?.data || 'An unexpected tracking engine anomaly occurred.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#f1f5f9', fontFamily: 'system-ui, sans-serif' }}>
            <div style={{ backgroundColor: '#ffffff', padding: '2.5rem', borderRadius: '1rem', width: '380px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0' }}>
                
                <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                    <h3 style={{ margin: '0 0 0.25rem 0', color: '#0f172a', fontSize: '1.5rem' }}>Node Enlistment</h3>
                    <p style={{ margin: 0, color: '#64748b', fontSize: '0.85rem' }}>Initialize security and profile context mappings</p>
                </div>

                {errorMsg && (
                    <div style={{ color: '#ef4444', backgroundColor: '#fef2f2', padding: '0.6rem', borderRadius: '0.375rem', marginBottom: '1rem', fontSize: '0.8rem', textAlign: 'center', border: '1px solid #fee2e2' }}>
                        {errorMsg}
                    </div>
                )}

                <form onSubmit={handleRegisterSubmit}>
                    {/* FIXED: Input element re-mapped to use name="username" */}
                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.25rem', color: '#475569', textTransform: 'uppercase' }}>Network Username / Identity Alias</label>
                        <input type="text" name="username" required value={formData.username} onChange={handleInputChange} placeholder="e.g., gokul_nathan" style={{ width: '100%', padding: '0.6rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1', fontSize: '0.9rem', boxSizing: 'border-box' }} />
                    </div>
                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.25rem', color: '#475569', textTransform: 'uppercase' }}>System Communication Email</label>
                        <input type="email" name="email" required value={formData.email} onChange={handleInputChange} placeholder="gokul@hillcoast.id" style={{ width: '100%', padding: '0.6rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1', fontSize: '0.9rem', boxSizing: 'border-box' }} />
                    </div>
                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.25rem', color: '#475569', textTransform: 'uppercase' }}>Master Access Token Code (Password)</label>
                        <input type="password" name="password" required value={formData.password} onChange={handleInputChange} placeholder="••••••••" style={{ width: '100%', padding: '0.6rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1', fontSize: '0.9rem', boxSizing: 'border-box' }} />
                    </div>
                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.25rem', color: '#475569', textTransform: 'uppercase' }}>Functional Access Domain</label>
                        <select 
                            name="role"
                            value={formData.role} 
                            onChange={handleInputChange}
                            style={{ width: '100%', padding: '0.6rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1', fontSize: '0.9rem', backgroundColor: '#ffffff', boxSizing: 'border-box', cursor: 'pointer' }}
                        >
                            <option value="ROLE_BUYER">🛍️ Procurement Buyer Matrix</option>
                            <option value="ROLE_PRODUCER">🚜 Artisan / Commodities Producer</option>
                        </select>
                    </div>

                    <button 
                        type="submit" 
                        disabled={loading}
                        style={{ width: '100%', padding: '0.75rem', backgroundColor: '#6366f1', color: '#fff', border: 'none', borderRadius: '0.375rem', fontWeight: 'bold', fontSize: '0.9rem', cursor: 'pointer', boxShadow: '0 2px 4px rgba(99, 102, 241, 0.2)' }}
                    >
                        {loading ? 'Committing Block...' : 'Instantiate System Membership'}
                    </button>
                </form>

                <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.85rem', color: '#64748b', borderTop: '1px solid #f1f5f9', paddingTop: '1rem' }}>
                    Already hold system keys?{' '}
                    <Link to="/" style={{ color: '#6366f1', textDecoration: 'none', fontWeight: 700 }}>
                        Return to Gateway
                    </Link>
                </div>
            </div>
        </div>
    );
}