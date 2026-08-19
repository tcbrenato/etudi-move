import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { AppLayout } from '@/layouts/AppLayout';
import type { Profile } from '@/types';
import { roleLabel, statusLabel, statusColor, roleColor, initials, fullName } from '@/utils/format';
import { Badge, ErrorState, Spinner, EmptyState } from '@/components/ui/Feedback';
import { Search, Users, Ban, CheckCircle, X } from 'lucide-react';

const navItems = [
  { to: '/admin', label: 'Dashboard' },
  { to: '/admin/users', label: 'Utilisateurs' },
  { to: '/admin/profile', label: 'Profil' },
];

export function AdminUsersPage() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data, error: queryError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      if (queryError) throw queryError;
      setUsers((data as Profile[]) ?? []);
    } catch {
      setError('Impossible de charger les utilisateurs.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  async function toggleStatus(user: Profile) {
    setUpdatingId(user.id);
    const newStatus = user.status === 'active' ? 'suspended' : 'active';
    try {
      const { error: rpcError } = await supabase.rpc('admin_set_account_status', {
        p_user_id: user.id,
        p_status: newStatus,
      });
      if (rpcError) throw rpcError;
      setUsers(prev =>
        prev.map(u => (u.id === user.id ? { ...u, status: newStatus } : u))
      );
    } catch {
      setError('Impossible de modifier le statut du compte.');
    } finally {
      setUpdatingId(null);
    }
  }

  const filtered = users.filter(u => {
    const q = search.toLowerCase();
    return (
      fullName(u.first_name, u.last_name).toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.phone.toLowerCase().includes(q)
    );
  });

  return (
    <AppLayout navItems={navItems}>
      <div className="animate-fade-in">
        <h1 className="text-2xl font-bold text-neutral-800">Utilisateurs</h1>
        <p className="mt-1 text-sm text-neutral-500">Gérez les comptes de la plateforme.</p>

        <div className="mt-6 relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
          <input
            type="text"
            placeholder="Rechercher par nom, email ou téléphone…"
            className="input pl-10"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Spinner className="text-2xl text-primary-600" />
          </div>
        ) : error ? (
          <ErrorState message={error} onRetry={loadUsers} />
        ) : filtered.length === 0 ? (
          <EmptyState
            title={search ? 'Aucun utilisateur trouvé' : 'Aucun utilisateur'}
            message={search ? 'Essayez une autre recherche.' : 'Les utilisateurs inscrits apparaîtront ici.'}
          />
        ) : (
          <div className="mt-6 card overflow-hidden p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-neutral-100 bg-neutral-50">
                    <th className="text-left text-xs font-semibold text-neutral-500 uppercase px-4 py-3">Utilisateur</th>
                    <th className="text-left text-xs font-semibold text-neutral-500 uppercase px-4 py-3 hidden sm:table-cell">Email</th>
                    <th className="text-left text-xs font-semibold text-neutral-500 uppercase px-4 py-3 hidden md:table-cell">Téléphone</th>
                    <th className="text-left text-xs font-semibold text-neutral-500 uppercase px-4 py-3">Rôle</th>
                    <th className="text-left text-xs font-semibold text-neutral-500 uppercase px-4 py-3">Statut</th>
                    <th className="text-right text-xs font-semibold text-neutral-500 uppercase px-4 py-3">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-50">
                  {filtered.map(user => (
                    <tr key={user.id} className="hover:bg-neutral-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-semibold shrink-0">
                            {initials(user.first_name, user.last_name)}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-neutral-800 truncate">
                              {fullName(user.first_name, user.last_name)}
                            </p>
                            <p className="text-xs text-neutral-500 sm:hidden truncate">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <span className="text-sm text-neutral-600">{user.email}</span>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span className="text-sm text-neutral-600">{user.phone}</span>
                      </td>
                      <td className="px-4 py-3">
                        <Badge className={roleColor(user.role)}>{roleLabel(user.role)}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge className={statusColor(user.status)}>{statusLabel(user.status)}</Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => toggleStatus(user)}
                          disabled={updatingId === user.id || user.role === 'admin'}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                            user.status === 'active'
                              ? 'text-error-600 hover:bg-error-50'
                              : 'text-success-600 hover:bg-success-50'
                          }`}
                          title={user.role === 'admin' ? 'Impossible de suspendre un administrateur' : ''}
                        >
                          {updatingId === user.id ? (
                            <Spinner />
                          ) : user.status === 'active' ? (
                            <><Ban className="h-3.5 w-3.5" /> Suspendre</>
                          ) : (
                            <><CheckCircle className="h-3.5 w-3.5" /> Activer</>
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {!loading && !error && filtered.length > 0 && (
          <p className="mt-3 text-xs text-neutral-400 flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5" /> {filtered.length} utilisateur{filtered.length > 1 ? 's' : ''} affiché{filtered.length > 1 ? 's' : ''}
          </p>
        )}
      </div>
    </AppLayout>
  );
}
