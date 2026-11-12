// src/components/common/AdminRoute.jsx
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const AdminRoute = ({ children }) => {
  const { user, userData, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-spinner" style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center', 
        minHeight: '100vh',
       background: `
  radial-gradient(ellipse 80% 60% at 20% 0%, 
    rgba(229, 231, 235, 0.6) 0%, 
    transparent 70%),
  linear-gradient(
    160deg,
    #b7b8b9 0%,
    #E5E7EB 50%,
    #D1D5DB 100%
  )
`
      }}>
        <div className="spinner" style={{
          width: '48px',
          height: '48px',
          border: '4px solid rgba(55, 53, 62, 0.08)',
          borderTopColor: '#040404',
          borderRadius: '50%',
          animation: 'spin 0.8s cubic-bezier(0.4, 0, 0.2, 1) infinite'
        }}></div>
        <p style={{ marginTop: '16px', color: '#040404', fontFamily: 'Inter, sans-serif' }}>
          Loading...
        </p>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg) scale(1); }
            50% { transform: rotate(180deg) scale(1.05); }
            100% { transform: rotate(360deg) scale(1); }
          }
        `}</style>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Check if user has admin role
  if (userData?.role !== 'admin') {
    // Redirect non-admin users to dashboard
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default AdminRoute;