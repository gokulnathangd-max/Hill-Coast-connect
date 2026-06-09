import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import API from '../api/axiosConfig';
import { User, Lock, Mail, ShieldAlert, CheckCircle2 } from 'lucide-react';

export const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    role: 'BUYER' // Default fallback tier role
  });
  
  const [status, setStatus] = useState({ error: '', success: false, loading: false });
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ error: '', success: false, loading: true });

    try {
      // Reaches directly to your Spring Boot registration controller mapping
      await API.post('/auth/register', formData);
      setStatus({ error: '', success: true, loading: false });
      
      // Auto-route to login workspace panel after a brief message window delay
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      setStatus({ 
        error: err.response?.data || 'System onboarding constraint validation failure.', 
        success: false, 
        loading: false 
      });
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc', padding: '1rem', fontFamily: 'sans-serif' }}>
      <div style={{ maxWidth: '450px', width: '100%', backgroundColor: '#ffffff', borderRadius: '1rem', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0', padding: '2.5rem', boxSizing: 'border-box' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>Create Account</h2>
          <p style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.5rem' }}>Join HillCoast Supply Chain Cluster</p>
        </div>

        {status.error && (
          <div style={{ marginBottom: '1.5rem', padding: '1rem', backgroundColor: '#fef2f2', border: '1px solid #fee2e2', color: '#991b1b', fontSize: '0.85rem', borderRadius: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <ShieldAlert size={18} />
            <span>{status.error}</span>
          </div>
        )}

        {status.success && (
          <div style={{ marginBottom: '1.5rem', padding: '1rem', backgroundColor: '#ecfdf5', border: '1px solid #d1fae5', color: '#065f46', fontSize: '0.85rem', borderRadius: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <CheckCircle2 size={18} />
            <span>Profile provisioned! Routing to sign-in matrix...</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.5rem' }}>Username</label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', left: '0.75rem', color: '#94a3b8', display: 'flex' }}><User size={18} /></span>
              <input
                type="text"
                name="username"
                required
                style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.5rem', border: '1px solid #cbd5e1', borderRadius: '0.5rem', fontSize: '0.95rem', boxSizing: 'border-box', outline: 'none' }}
                placeholder="Choose alphanumeric alias"
                value={formData.username}
                onChange={handleChange}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.5rem' }}>Email Address</label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', left: '0.75rem', color: '#94a3b8', display: 'flex' }}><Mail size={18} /></span>
              <input
                type="email"
                name="email"
                required
                style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.5rem', border: '1px solid #cbd5e1', borderRadius: '0.5rem', fontSize: '0.95rem', boxSizing: 'border-box', outline: 'none' }}
                placeholder="corporate@domain.com"
                value={formData.email}
                onChange={handleChange}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.5rem' }}>Account Authority Classification</label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              style={{ width: '100%', padding: '0.75rem', border: '1px solid #cbd5e1', borderRadius: '0.5rem', fontSize: '0.95rem', backgroundColor: '#ffffff', boxSizing: 'border-box', outline: 'none' }}
            >
              <option value="BUYER">BUYER (Commercial Procurement Sourcing)</option>
              <option value="PRODUCER">PRODUCER (Regional Agricultural Supply Node)</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.5rem' }}>Password</label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', left: '0.75rem', color: '#94a3b8', display: 'flex' }}><Lock size={18} /></span>
              <input
                type="password"
                name="password"
                required
                style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.5rem', border: '1px solid #cbd5e1', borderRadius: '0.5rem', fontSize: '0.95rem', boxSizing: 'border-box', outline: 'none' }}
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={status.loading || status.success}
            style={{ width: '100%', backgroundColor: '#0f172a', color: '#ffffff', border: 'none', padding: '0.85rem', borderRadius: '0.5rem', fontWeight: 600, fontSize: '1rem', cursor: 'pointer', marginTop: '0.5rem' }}
          >
            {status.loading ? 'Registering Security Node...' : 'Initialize Provisioning'}
          </button>
        </form>

        <p style={{ textAlign: 'center', fontSize: '0.85rem', color: '#64748b', marginTop: '1.5rem', marginBottom: 0 }}>
          Already integrated? <Link to="/login" style={{ color: '#059669', fontWeight: 600, textDecoration: 'none' }}>Access Workspace</Link>
        </p>

      </div>
    </div>
  );
};