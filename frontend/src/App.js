import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPortal from './pages/Login'; // Importing as LoginPortal
import Register from './pages/Register';
import { Dashboard } from './pages/Dashboard';

// Secure Route Shielding Element
const ProtectedRoute = ({ children }) => {
    const token = localStorage.getItem('auth_token');
    return token ? children : <Navigate to="/" replace />;
};

// MASTER WRAPPER FUNCTION
export default function App() {
    return (
        <Router>
            <Routes>
                /* Public Gateway Paths */
                <Route path="/" element={<LoginPortal />} /> {/* FIXED: Changed from <Login /> to <LoginPortal /> */}
                <Route path="/register" element={<Register />} />

                /* Authenticated Dashboard Pipeline - Shielded by Token Filter */
                <Route 
                    path="/dashboard" 
                    element={
                        <ProtectedRoute>
                            <Dashboard />
                        </ProtectedRoute>
                    } 
                />
                
                /* Fallback Global Redirect */
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </Router>
    );
}