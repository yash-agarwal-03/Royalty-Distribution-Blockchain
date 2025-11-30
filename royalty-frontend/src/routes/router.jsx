import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ProtectedRoute from '../components/ProtectedRoute'; // Import the guard

// Pages
import LandingPage from '../pages/LandingPage';
import AdminDashboard from '../pages/AdminDashboard';
import ContributorDashboard from '../pages/ContributorDashboard'; 
import UserMarketplace from '../pages/UserMarketPlace';
import NetworkBanner from '../components/NetworkBanner';
const AppRouter = () => {
  return (
    <Router>
      <NetworkBanner/>
      <Routes>
        {/* Public Route */}
        <Route path="/" element={<LandingPage />} />

        {/* STRICT ADMIN ROUTE */}
        <Route 
          path="/admin" 
          element={
            <ProtectedRoute allowedRoles={['Admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          } 
        />

        {/* STRICT ARTIST/PRODUCER ROUTE */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute allowedRoles={['Contributor']}>
              <ContributorDashboard />
            </ProtectedRoute>
          } 
        />
        
        {/* STRICT USER/LISTENER ROUTE */}
        <Route 
          path="/browse" 
          element={
            <ProtectedRoute allowedRoles={['User']}>
               <UserMarketplace />
               {/* <h1>Marketplace Coming Soon</h1> */}
            </ProtectedRoute>
          } 
        />
      </Routes>
    </Router>
  );
};

export default AppRouter;