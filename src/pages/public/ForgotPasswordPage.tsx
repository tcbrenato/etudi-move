import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import { useAuth } from '@/auth/AuthContext';
import { Field } from '@/components/ui/Field';
import { Spinner } from '@/components/ui/Feedback';
import { Logo } from '@/components/Logo';

export function ForgotPasswordPage() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await resetPassword(email);
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue.');
    } finally {
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
            {sent ? (
              <div className="text-center py-4">
                <div className="h-12 w-12 rounded-full bg-success-100 flex items-center justify-center mx-auto">
                  <CheckCircle className="h-6 w-6 text-success-600" />
                </div>
                <h1 className="mt-4 text-lg font-semibold text-neutral-800">Vérifiez votre boîte mail</h1>
                <p className="mt-2 text-sm text-neutral-500">
                  Si un compte existe avec l'adresse <span className="font-medium text-neutral-700">{email}</span>, vous recevrez un lien de réinitialisation.
                </p>
                <Link to="/login" className="btn-primary mt-6">Retour à la connexion</Link>
              </div>
            ) : (
              <>
                <h1 className="text-xl font-semibold text-neutral-800">Mot de passe oublié</h1>
                <p className="mt-1 text-sm text-neutral-500">
                  Saisissez votre email pour recevoir un lien de réinitialisation.
                </p>

                {error && (
                  <div className="mt-4 p-3 rounded-lg bg-error-50 border border-error-100 text-sm text-error-700">
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="mt-5 space-y-4">
                  <Field
                    label="Email"
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="vous@exemple.bj"
                    icon={<Mail className="h-4 w-4" />}
                  />
                  <button type="submit" disabled={loading} className="btn-primary w-full">
                    {loading ? <Spinner /> : 'Envoyer le lien'}
                  </button>
                </form>
              </>
            )}

            <div className="mt-4 text-center">
              <Link to="/login" className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-700">
                <ArrowLeft className="h-3.5 w-3.5" /> Retour à la connexion
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
