import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';

// Layout
import MainLayout from './components/layout/MainLayout';

// Pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import AuthCallback from './pages/AuthCallback';
import AdminDashboard from './pages/admin/AdminDashboard';
import EventEditor from './pages/admin/EventEditor';
import EventViewPage from './pages/events/EventViewPage';
import VotingPage from './pages/events/VotingPage';
import ResultsPage from './pages/events/ResultsPage';
import NotFoundPage from './pages/NotFoundPage';

// Components
import ProtectedRoute from './components/auth/ProtectedRoute';
import LoadingScreen from './components/common/LoadingScreen';

function App() {
  const { user, isLoading, checkAuth } = useAuth();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        {/* Public routes */}
        <Route index element={<HomePage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="auth/callback" element={<AuthCallback />} />
        
        {/* Admin routes */}
        <Route 
          path="admin" 
          element={
            <ProtectedRoute 
              isAllowed={!!user && user.role === 'admin'} 
              redirectPath="/login"
            >
              <AdminDashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="admin/events/new" 
          element={
            <ProtectedRoute 
              isAllowed={!!user && user.role === 'admin'} 
              redirectPath="/login"
            >
              <EventEditor />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="admin/events/:eventId/edit" 
          element={
            <ProtectedRoute 
              isAllowed={!!user && user.role === 'admin'} 
              redirectPath="/login"
            >
              <EventEditor />
            </ProtectedRoute>
          } 
        />
        
        {/* Event routes - require authentication but not admin */}
        <Route 
          path="event/:eventId" 
          element={
            <ProtectedRoute isAllowed={!!user} redirectPath="/login">
              <EventViewPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="event/:eventId/vote" 
          element={
            <ProtectedRoute isAllowed={!!user} redirectPath="/login">
              <VotingPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="event/:eventId/results" 
          element={
            <ProtectedRoute isAllowed={!!user} redirectPath="/login">
              <ResultsPage />
            </ProtectedRoute>
          } 
        />
        
        {/* 404 route */}
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}

export default App;