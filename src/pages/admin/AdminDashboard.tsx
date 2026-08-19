import { useEffect, useState } from 'react';
import { useAuth } from '@/auth/AuthContext';
import { supabase } from '@/lib/supabase';
import { AppLayout } from '@/layouts/AppLayout';
import type { AdminStats } from '@/types';
import { Users, Car, ShieldCheck } from 'lucide-react';
import { ErrorState, Spinner } from '@/components/ui/Feedback';

const navItems = [
  { to: '/admin', label: 'Dashboard' },
  { to: '/admin/users', label: 'Utilisateurs' },
  { to: '/admin/profile', label: 'Profil' },
];

export function AdminDashboard() {
  const { profile } = useAuth();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function loadStats() {
    setLoading(true);
    setError('');
    try {
      const { data, error: rpcError } = await supabase.rpc('get_admin_stats');
      if (rpcError) throw rpcError;
      setStats(data as AdminStats);
    } catch {
      setError('Impossible de charger les statistiques.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadStats();
  }, []);

  if (!profile) return null;

  const cards = [
    { icon: Users, label: 'Utilisateurs', value: stats?.total_users, color: 'primary' as const },
    { icon: Car, label: 'Conducteurs', value: stats?.total_drivers, color: 'accent' as const },
    { icon: ShieldCheck, label: 'Administrateurs', value: stats?.total_admins, color: 'neutral' as const },
  ];

  return (
    <AppLayout navItems={navItems}>
      <div className="animate-fade-in">
        <h1 className="text-2xl font-bold text-neutral-800">Tableau de bord</h1>
        <p className="mt-1 text-sm text-neutral-500">Vue d'ensemble de la plateforme Étudi'Move.</p>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Spinner className="text-2xl text-primary-600" />
          </div>
        ) : error ? (
          <ErrorState message={error} onRetry={loadStats} />
        ) : (
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
            {cards.map(card => (
              <div key={card.label} className="card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-neutral-500">{card.label}</p>
                    <p className="mt-1 text-3xl font-bold text-neutral-800">{card.value ?? 0}</p>
                  </div>
                  <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${
                    card.color === 'primary' ? 'bg-primary-50' :
                    card.color === 'accent' ? 'bg-accent-50' : 'bg-neutral-100'
                  }`}>
                    <card.icon className={`h-6 w-6 ${
                      card.color === 'primary' ? 'text-primary-600' :
                      card.color === 'accent' ? 'text-accent-600' : 'text-neutral-600'
                    }`} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
