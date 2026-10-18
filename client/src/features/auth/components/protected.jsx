import { useAuth } from "../hooks/useAuth.js";
import { Navigate, useLocation } from "react-router";
import React from "react";

const Protected = ({ children }) => {
    const { loading, user } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '100vh',
                backgroundColor: '#0b0f19',
                color: '#e2e8f0',
                gap: '1rem',
                fontFamily: 'system-ui, sans-serif'
            }}>
                <div style={{
                    width: '40px',
                    height: '40px',
                    border: '3px solid rgba(99, 102, 241, 0.2)',
                    borderTopColor: '#6366f1',
                    borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite'
                }}></div>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                <p style={{ fontSize: '0.95rem', color: '#94a3b8' }}>Checking your Prepify session...</p>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return children;
};

export default Protected;
