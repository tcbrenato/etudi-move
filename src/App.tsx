import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/auth/AuthContext';
import { ProtectedRoute } from '@/auth/ProtectedRoute';
import { PublicRoute } from '@/auth/PublicRoute';
import { LandingPage } from '@/pages/public/LandingPage';
import { LoginPage } from '@/pages/public/LoginPage';
import { RegisterPage } from '@/pages/public/RegisterPage';
import { ForgotPasswordPage } from '@/pages/public/ForgotPasswordPage';
import { UserDashboard } from '@/pages/user/UserDashboard';
import { SearchTripsPage } from '@/pages/user/SearchTripsPage';
import { DriverDashboard } from '@/pages/driver/DriverDashboard';
import { PublishTripPage } from '@/pages/driver/PublishTripPage';
import { AdminDashboard } from '@/pages/admin/AdminDashboard';
import { AdminUsersPage } from '@/pages/admin/AdminUsersPage';
import { ProfilePage } from '@/pages/profile/ProfilePage';
import { MessagesPage } from '@/pages/messages/MessagesPage';
import { NotFoundPage, UnauthorizedPage, SuspendedPage } from '@/pages/system/SystemPages';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/" element={<LandingPage />} />
          <Route
            path="/login"
            element={
              <PublicRoute>
                <LoginPage />
              </PublicRoute>
            }
          />
          <Route
            path="/register"
            element={
              <PublicRoute>
                <RegisterPage />
              </PublicRoute>
            }
          />
          <Route
            path="/forgot-password"
            element={
              <PublicRoute>
                <ForgotPasswordPage />
              </PublicRoute>
            }
          />

          {/* User */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute roles={['user']}>
                <UserDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute roles={['user']}>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/trajets"
            element={
              <ProtectedRoute roles={['user']}>
                <SearchTripsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/messages"
            element={
              <ProtectedRoute roles={['user', 'driver']}>
                <MessagesPage />
              </ProtectedRoute>
            }
          />

          {/* Driver */}
          <Route
            path="/driver"
            element={
              <ProtectedRoute roles={['driver']}>
                <DriverDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/driver/profile"
            element={
              <ProtectedRoute roles={['driver']}>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/driver/trips"
            element={
              <ProtectedRoute roles={['driver']}>
                <PublishTripPage />
              </ProtectedRoute>
            }
          />

          {/* Admin */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute roles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute roles={['admin']}>
                <AdminUsersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/profile"
            element={
              <ProtectedRoute roles={['admin']}>
                <ProfilePage />
              </ProtectedRoute>
            }
          />

          {/* System */}
          <Route path="/unauthorized" element={<UnauthorizedPage />} />
          <Route path="/suspended" element={<SuspendedPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
