import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4">
        <div className="w-10 h-10 border-3 border-white/5 border-t-accent-primary rounded-full animate-spin"></div>
        <p className="text-text-secondary font-sans text-sm">
          Verifying secure session...
        </p>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect to login page but save the attempted location
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && (!user || !allowedRoles.includes(user.role))) {
    // If authenticated but role not allowed, redirect to Dashboard
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
