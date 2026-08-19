import { ShieldAlert } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Logo } from '@/components/Logo';

export function NotFoundPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-neutral-50 px-4 text-center">
      <Logo size="lg" />
      <div className="mt-8">
        <p className="text-6xl font-bold text-primary-700">404</p>
        <p className="mt-2 text-lg font-medium text-neutral-700">Page introuvable</p>
        <p className="mt-1 text-sm text-neutral-500">La page que vous cherchez n'existe pas ou a été déplacée.</p>
        <Link to="/" className="btn-primary mt-6">Retour à l'accueil</Link>
      </div>
    </div>
  );
}

export function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-neutral-50 px-4 text-center">
      <div className="h-16 w-16 rounded-full bg-warning-100 flex items-center justify-center">
        <ShieldAlert className="h-8 w-8 text-warning-500" />
      </div>
      <p className="mt-4 text-lg font-medium text-neutral-700">Accès non autorisé</p>
      <p className="mt-1 text-sm text-neutral-500">Vous n'avez pas les permissions nécessaires pour accéder à cette page.</p>
      <Link to="/" className="btn-primary mt-6">Retour à l'accueil</Link>
    </div>
  );
}

export function SuspendedPage() {
  const { signOut } = useSuspendedHook();
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-neutral-50 px-4 text-center">
      <div className="h-16 w-16 rounded-full bg-error-100 flex items-center justify-center">
        <ShieldAlert className="h-8 w-8 text-error-500" />
      </div>
      <p className="mt-4 text-lg font-medium text-neutral-700">Compte suspendu</p>
      <p className="mt-1 text-sm text-neutral-500 max-w-sm">
        Votre compte a été suspendu. Pour plus d'informations, veuillez contacter l'administration d'Étudi'Move.
      </p>
      <button onClick={() => signOut().then(() => window.location.href = '/login')} className="btn-secondary mt-6">
        Se déconnecter
      </button>
    </div>
  );
}

import { useAuth } from '@/auth/AuthContext';
function useSuspendedHook() {
  return useAuth();
}
