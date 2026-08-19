import { useState, type FormEvent } from 'react';
import { useAuth } from '@/auth/AuthContext';
import { AppLayout } from '@/layouts/AppLayout';
import { roleLabel, statusLabel, statusColor, roleColor, initials } from '@/utils/format';
import { Badge, Spinner } from '@/components/ui/Feedback';
import { Field } from '@/components/ui/Field';
import { User, Mail, Phone, Save, CheckCircle } from 'lucide-react';

interface NavConfig {
  items: { to: string; label: string }[];
}

function getNavConfig(role: string): NavConfig {
  switch (role) {
    case 'admin':
      return { items: [
        { to: '/admin', label: 'Dashboard' },
        { to: '/admin/users', label: 'Utilisateurs' },
        { to: '/admin/profile', label: 'Profil' },
      ]};
    case 'driver':
      return { items: [
        { to: '/driver', label: 'Dashboard' },
        { to: '/driver/profile', label: 'Profil' },
      ]};
    default:
      return { items: [
        { to: '/dashboard', label: 'Accueil' },
        { to: '/profile', label: 'Profil' },
      ]};
  }
}

export function ProfilePage() {
  const { profile, updateProfile } = useAuth();
  const [firstName, setFirstName] = useState(profile?.first_name ?? '');
  const [lastName, setLastName] = useState(profile?.last_name ?? '');
  const [phone, setPhone] = useState(profile?.phone ?? '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  if (!profile) return null;

  const navConfig = getNavConfig(profile.role);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setLoading(true);
    try {
      await updateProfile({ first_name: firstName, last_name: lastName, phone });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Impossible de mettre à jour le profil.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppLayout navItems={navConfig.items}>
      <div className="animate-fade-in max-w-2xl">
        <h1 className="text-2xl font-bold text-neutral-800">Mon profil</h1>
        <p className="mt-1 text-sm text-neutral-500">Consultez et modifiez vos informations.</p>

        <div className="mt-6 card">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xl font-semibold">
              {initials(profile.first_name, profile.last_name)}
            </div>
            <div>
              <p className="text-lg font-semibold text-neutral-800">
                {profile.first_name} {profile.last_name}
              </p>
              <p className="text-sm text-neutral-500">{profile.email}</p>
              <div className="mt-1.5 flex items-center gap-2">
                <Badge className={roleColor(profile.role)}>{roleLabel(profile.role)}</Badge>
                <Badge className={statusColor(profile.status)}>{statusLabel(profile.status)}</Badge>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 card">
          <h2 className="text-lg font-semibold text-neutral-800">Modifier mes informations</h2>

          {error && (
            <div className="mt-4 p-3 rounded-lg bg-error-50 border border-error-100 text-sm text-error-700">
              {error}
            </div>
          )}

          {success && (
            <div className="mt-4 p-3 rounded-lg bg-success-50 border border-success-100 text-sm text-success-700 flex items-center gap-2">
              <CheckCircle className="h-4 w-4" /> Profil mis à jour avec succès.
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field
                label="Prénom"
                required
                value={firstName}
                onChange={e => setFirstName(e.target.value)}
                icon={<User className="h-4 w-4" />}
              />
              <Field
                label="Nom"
                required
                value={lastName}
                onChange={e => setLastName(e.target.value)}
              />
            </div>
            <Field
              label="Email"
              type="email"
              value={profile.email}
              disabled
              icon={<Mail className="h-4 w-4" />}
            />
            <p className="text-xs text-neutral-400 -mt-2">L'email ne peut pas être modifié.</p>
            <Field
              label="Téléphone"
              type="tel"
              required
              value={phone}
              onChange={e => setPhone(e.target.value)}
              icon={<Phone className="h-4 w-4" />}
            />

            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? <Spinner /> : <><Save className="h-4 w-4" /> Enregistrer</>}
            </button>
          </form>
        </div>
      </div>
    </AppLayout>
  );
}
