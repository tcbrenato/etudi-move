import { Link } from 'react-router-dom';
import { useAuth } from '@/auth/AuthContext';
import { AppLayout } from '@/layouts/AppLayout';
import { roleLabel, statusLabel, statusColor } from '@/utils/format';
import { Badge } from '@/components/ui/Feedback';
import { Bus, Compass, Bell } from 'lucide-react';

const navItems = [
  { to: '/dashboard', label: 'Accueil' },
  { to: '/trajets', label: 'Trajets' },
  { to: '/messages', label: 'Messages' },
  { to: '/profile', label: 'Profil' },
];

export function UserDashboard() {
  const { profile } = useAuth();
  if (!profile) return null;

  return (
    <AppLayout navItems={navItems}>
      <div className="animate-fade-in">
        <h1 className="text-2xl font-bold text-neutral-800">
          Bonjour, {profile.first_name} 👋
        </h1>
        <p className="mt-1 text-sm text-neutral-500">
          Bienvenue sur votre espace Étudi'Move.
        </p>

        <div className="mt-6 flex items-center gap-2">
          <Badge className={statusColor(profile.status)}>{statusLabel(profile.status)}</Badge>
          <Badge className="bg-primary-100 text-primary-700">{roleLabel(profile.role)}</Badge>
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { icon: Compass, title: 'Recherche de trajets', desc: 'Trouvez un étudiant en moto qui va dans votre direction.', to: '/trajets' },
            { icon: Bus, title: 'Bus étudiant', desc: 'Bientôt disponible — consultez les itinéraires et horaires.', soon: true },
            { icon: Bell, title: 'Notifications', desc: 'Bientôt disponible — recevez des alertes sur vos trajets.', soon: true },
          ].map(card => {
            const content = (
              <>
                {card.soon && (
                  <span className="absolute top-4 right-4 text-xs font-medium text-neutral-400 bg-neutral-100 px-2 py-0.5 rounded-full">
                    Bientôt
                  </span>
                )}
                <div className="h-10 w-10 rounded-lg bg-primary-50 flex items-center justify-center">
                  <card.icon className="h-5 w-5 text-primary-600" />
                </div>
                <h3 className="mt-3 font-semibold text-neutral-800">{card.title}</h3>
                <p className="mt-1 text-sm text-neutral-500">{card.desc}</p>
              </>
            );
            return card.to ? (
              <Link key={card.title} to={card.to} className="card relative hover:shadow-card-hover transition-shadow">
                {content}
              </Link>
            ) : (
              <div key={card.title} className="card relative">
                {content}
              </div>
            );
          })}
        </div>
      </div>
    </AppLayout>
  );
}
