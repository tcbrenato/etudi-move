import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/auth/AuthContext';
import { Field } from '@/components/ui/Field';
import { Spinner } from '@/components/ui/Feedback';
import { Logo } from '@/components/Logo';

export function LoginPage() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string })?.from;

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signIn(identifier, password);
      setLoading(false);
      // PublicRoute will redirect automatically once the session is active.
      // If a redirect target was stored, use it; otherwise the role-based
      // dashboard redirect in PublicRoute handles navigation.
      if (from) navigate(from, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue.');
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-neutral-50">
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          <div className="text-center mb-6">
            <Logo size="lg" />
          </div>

          <div className="card animate-slide-up">
            <h1 className="text-xl font-semibold text-neutral-800">Connexion</h1>
            <p className="mt-1 text-sm text-neutral-500">Connectez-vous à votre compte Étudi'Move.</p>

            {error && (
              <div className="mt-4 p-3 rounded-lg bg-error-50 border border-error-100 text-sm text-error-700">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              <Field
                label="Email ou téléphone"
                type="text"
                autoComplete="username"
                required
                value={identifier}
                onChange={e => setIdentifier(e.target.value)}
                placeholder="vous@exemple.bj"
                icon={<Mail className="h-4 w-4" />}
              />
              <Field
                label="Mot de passe"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                icon={<Lock className="h-4 w-4" />}
              />

              <div className="flex justify-end">
                <Link to="/forgot-password" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                  Mot de passe oublié ?
                </Link>
              </div>

              <button type="submit" disabled={loading} className="btn-primary w-full">
                {loading ? <Spinner /> : 'Se connecter'}
              </button>
            </form>

            <p className="mt-5 text-center text-sm text-neutral-500">
              Pas encore de compte ?{' '}
              <Link to="/register" className="text-primary-600 hover:text-primary-700 font-medium">
                S'inscrire
              </Link>
            </p>
          </div>

          <div className="mt-4 text-center">
            <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-700">
              <ArrowLeft className="h-3.5 w-3.5" /> Retour à l'accueil
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
