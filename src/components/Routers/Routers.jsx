import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Employee from '../pages/Employee';
import Client from '../pages/Ticketing';
import Admin from "../pages/Admin";
import ClientDashboard from '../pages/ClientDashboard';
import ClientTickets from '../pages/ClientTickets';
import Login from '../pages/Login';
import Register from '../Register';
import AdminTickets from '../pages/AdminTickets';
import PropTypes from 'prop-types';
import { auth, db } from '../../firebase/config';
import { onAuthStateChanged } from 'firebase/auth';
import { query, collection, where, getDocs } from 'firebase/firestore';
 
// Protected Route component
function ProtectedRoute({ children }) {
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);
 
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsAuthenticated(!!user);
      setIsLoading(false);
    });
 
    return () => unsubscribe();
  }, []);
 
  if (isLoading) {
    return <div>Loading...</div>;
  }
 
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }
 
  return children;
}
ProtectedRoute.propTypes = {
  children: PropTypes.node.isRequired,
};
 
// Admin Route component
function AdminRoute({ children }) {
  const [isAdmin, setIsAdmin] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);
 
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Check if user is admin in users collection
        const userQuery = query(
          collection(db, 'users'),
          where('email', '==', user.email),
          where('role', '==', 'admin')
        );
        const userSnapshot = await getDocs(userQuery);
        setIsAdmin(!userSnapshot.empty);
      } else {
        setIsAdmin(false);
      }
      setIsLoading(false);
    });
 
    return () => unsubscribe();
  }, []);
 
  if (isLoading) {
    return <div>Loading...</div>;
  }
 
  if (!isAdmin) {
    return <Navigate to="/clientdashboard" replace />;
  }
 
  return children;
}
AdminRoute.propTypes = {
  children: PropTypes.node.isRequired,
};
function Routers() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route
        path="/employee"
        element={
          <ProtectedRoute>
            <Employee />
          </ProtectedRoute>
        }
      />
      <Route
        path="/ticketing"
        element={
          <ProtectedRoute>
            <Client />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <AdminRoute>
              <Admin />
            </AdminRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/clientdashboard"
        element={
          <ProtectedRoute>
            <ClientDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admintickets"
        element={
          <ProtectedRoute>
            <AdminRoute>
              <AdminTickets />
            </AdminRoute>
          </ProtectedRoute>
        }
        />
      <Route
        path="/client-tickets"
        element={
          <ProtectedRoute>
            <ClientTickets />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
 
export default Routers;
 
 