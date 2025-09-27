import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import MuseumsPage from './components/meseum/MuseumsPage';
import UsersPage from './components/Users/UsersPage';
import RoomsPage from './components/rooms/RoomsPage';
import ObjectsPage from './components/object_mesuem/ObjectsPage';
import TicketsPage from './components/tickets/TicketsPage';
import Login from './components/register/Login';
// import Signup from './components/register/Signup';
import AnalyticsPage from './components/analytics/AnalyticsPage';
import { AuthProvider } from './contexts/AuthContext';
import { useAuth } from './contexts/AuthContext';

// Protected Route Component
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  return children;
}

// Superadmin Only Route Component
function SuperadminRoute({ children }) {  // Renamed to SuperadminRoute
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user || user.status !== 'superadmin') {
    return <Navigate to="/rooms" />;  // Or another appropriate route
  }

  return children;
}

// Main content wrapper
function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div style={{ display: 'flex' }}>
      {user && <Sidebar />}

      <div style={{
        flexGrow: 1,
        // marginLeft: user ? '240px' : '0',
        padding: '20px'
      }}>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={
            user ? <Navigate to={user.status === 'superadmin' ? '/museums' : '/rooms'} /> : <Login />
          } />
          {/* <Route path="/signup" element={
            user ? <Navigate to={user.status === 'superadmin' ? '/museums' : '/rooms'} /> : <Signup />
          } /> */}

          {/* Protected Routes */}
          <Route path="/museums" element={
            <ProtectedRoute>
              <SuperadminRoute>  {/* Changed to SuperadminRoute */}
                <MuseumsPage />
              </SuperadminRoute>
            </ProtectedRoute>
          } />

          <Route path="/rooms" element={
            <ProtectedRoute>
              <RoomsPage />
            </ProtectedRoute>
          } />

          <Route path="/objects" element={
            <ProtectedRoute>
              <ObjectsPage />
            </ProtectedRoute>
          } />

          <Route path="/tickets" element={
            <ProtectedRoute>
              <TicketsPage />
            </ProtectedRoute>
          } />

          <Route path="/analytics" element={
  <ProtectedRoute>
    <SuperadminRoute>
      <AnalyticsPage />
    </SuperadminRoute>
  </ProtectedRoute>
} />


          {/* Superadmin Only Route */}
          <Route path="/users" element={
            <ProtectedRoute>
              <SuperadminRoute>  {/* Changed to SuperadminRoute */}
                <UsersPage />
              </SuperadminRoute>
            </ProtectedRoute>
          } />

          {/* Default Route */}
          <Route path="/" element={
            <Navigate to={
              !user ? '/login' :
                user.status === 'superadmin' ? '/museums' : '/rooms'
            } />
          } />

          {/* Catch all route */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

export default App;