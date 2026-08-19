import { Navigate } from 'react-router-dom';
import { useAuth } from '@/auth/AuthContext';
import { FullPageSpinner } from '@/components/ui/Feedback';

export function PublicRoute({ children }: { children: React.ReactNode }) {
  const { session, profile, loading } = useAuth();

  if (loading) return <FullPageSpinner />;
  // If session exists but profile is still being fetched, keep showing the spinner
  // rather than flashing the login page briefly.
  if (session && !profile) return <FullPageSpinner label="Chargement du profil…" />;
  if (session && profile) return <Navigate to={dashboardPath(profile.role)} replace />;
  return <>{children}</>;
}

function dashboardPath(role: string): string {
  switch (role) {
    case 'admin': return '/admin';
    case 'driver': return '/driver';
    default: return '/dashboard';
  }
}
