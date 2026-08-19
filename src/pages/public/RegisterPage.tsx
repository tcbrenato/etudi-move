import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Phone, ArrowLeft, Bike, GraduationCap } from 'lucide-react';
import { useAuth } from '@/auth/AuthContext';
import { Field } from '@/components/ui/Field';
import { Spinner } from '@/components/ui/Feedback';
import { Logo } from '@/components/Logo';

interface FormErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  password?: string;
  confirmPassword?: string;
}

export function RegisterPage() {
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const [role, setRole] = useState<'user' | 'driver'>('user');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitError, setSubmitError] = useState('');
  const [loading, setLoading] = useState(false);

  function validate(): boolean {
    const e: FormErrors = {};
    if (!firstName.trim()) e.firstName = 'Le prénom est requis.';
    if (!lastName.trim()) e.lastName = 'Le nom est requis.';
    if (!email.trim()) e.email = 'L\'email est requis.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'Email invalide.';
    if (!phone.trim()) e.phone = 'Le téléphone est requis.';
    if (!password) e.password = 'Le mot de passe est requis.';
    else if (password.length < 6) e.password = 'Au moins 6 caractères.';
    if (password !== confirmPassword) e.confirmPassword = 'Les mots de passe ne correspondent pas.';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitError('');
    if (!validate()) return;
    setLoading(true);
    try {
      await signUp({ firstName, lastName, email, phone, password, role });
      navigate('/login', { replace: true, state: { registered: true } });
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Une erreur est survenue.');
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
            <h1 className="text-xl font-semibold text-neutral-800">Inscription</h1>
            <p className="mt-1 text-sm text-neutral-500">Créez votre compte Étudi'Move.</p>

            {submitError && (
              <div className="mt-4 p-3 rounded-lg bg-error-50 border border-error-100 text-sm text-error-700">
                {submitError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              <div>
                <label className="label">Je m'inscris en tant que</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setRole('user')}
                    className={`flex flex-col items-center gap-1.5 rounded-lg border-2 px-3 py-3 text-sm font-medium transition-colors ${
                      role === 'user'
                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                        : 'border-neutral-200 text-neutral-500 hover:border-neutral-300'
                    }`}
                  >
                    <GraduationCap className="h-5 w-5" />
                    Étudiant
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('driver')}
                    className={`flex flex-col items-center gap-1.5 rounded-lg border-2 px-3 py-3 text-sm font-medium transition-colors ${
                      role === 'driver'
                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                        : 'border-neutral-200 text-neutral-500 hover:border-neutral-300'
                    }`}
                  >
                    <Bike className="h-5 w-5" />
                    Conducteur
                  </button>
                </div>
                <p className="mt-1.5 text-xs text-neutral-400">
                  {role === 'driver'
                    ? 'Vous pourrez publier des trajets en moto et être contacté par des étudiants.'
                    : 'Vous pourrez rechercher des trajets et contacter des conducteurs.'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Field
                  label="Prénom"
                  required
                  value={firstName}
                  onChange={e => setFirstName(e.target.value)}
                  error={errors.firstName}
                  placeholder="Jean"
                  icon={<User className="h-4 w-4" />}
                />
                <Field
                  label="Nom"
                  required
                  value={lastName}
                  onChange={e => setLastName(e.target.value)}
                  error={errors.lastName}
                  placeholder="Dupont"
                />
              </div>
              <Field
                label="Email"
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                error={errors.email}
                placeholder="vous@exemple.bj"
                icon={<Mail className="h-4 w-4" />}
              />
              <Field
                label="Téléphone"
                type="tel"
                required
                value={phone}
                onChange={e => setPhone(e.target.value)}
                error={errors.phone}
                placeholder="+229 00 00 00 00"
                icon={<Phone className="h-4 w-4" />}
              />
              <Field
                label="Mot de passe"
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                error={errors.password}
                placeholder="••••••••"
                icon={<Lock className="h-4 w-4" />}
              />
              <Field
                label="Confirmer le mot de passe"
                type="password"
                required
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                error={errors.confirmPassword}
                placeholder="••••••••"
                icon={<Lock className="h-4 w-4" />}
              />

              <button type="submit" disabled={loading} className="btn-primary w-full">
                {loading ? <Spinner /> : 'Créer mon compte'}
              </button>
            </form>

            <p className="mt-5 text-center text-sm text-neutral-500">
              Déjà un compte ?{' '}
              <Link to="/login" className="text-primary-600 hover:text-primary-700 font-medium">
                Se connecter
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
