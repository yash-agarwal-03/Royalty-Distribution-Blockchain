import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { WalletContext } from '../context/WalletContext';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { userRole, isLoading } = useContext(WalletContext);

  // In ProtectedRoute.jsx
if (isLoading) {
    return (
        <div className="d-flex justify-content-center align-items-center vh-100 bg-dark">
            <div className="spinner-border text-info" role="status"></div>
        </div>
    );
}

  // 1. If not logged in at all -> Kick to Landing
  if (!userRole) {
    return <Navigate to="/" replace />;
  }

  // 2. If logged in but wrong role -> Kick to Landing (or unauthorized page)
  if (allowedRoles && !allowedRoles.includes(userRole)) {
    return <Navigate to="/" replace />;
  }

  // 3. Allowed -> Render the Page
  return children;
};

export default ProtectedRoute;