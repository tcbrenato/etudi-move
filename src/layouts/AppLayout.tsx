import { useState, type ReactNode } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, LogOut, User as UserIcon } from 'lucide-react';
import { useAuth } from '@/auth/AuthContext';
import { Logo } from '@/components/Logo';
import { roleLabel, initials } from '@/utils/format';
import { Badge } from '@/components/ui/Feedback';
import { roleColor } from '@/utils/format';

interface NavItem {
  to: string;
  label: string;
}

export function AppLayout({ children, navItems }: { children: ReactNode; navItems: NavItem[] }) {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  async function handleSignOut() {
    await signOut();
    navigate('/login');
  }

  if (!profile) return null;

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col">
      <header className="bg-white border-b border-neutral-100 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-6">
              <Logo size="sm" />
              <nav className="hidden md:flex items-center gap-1">
                {navItems.map(item => {
                  const active = location.pathname === item.to;
                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        active
                          ? 'bg-primary-50 text-primary-700'
                          : 'text-neutral-600 hover:text-primary-700 hover:bg-neutral-50'
                      }`}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
            </div>

            <div className="hidden md:flex items-center gap-3">
              <Link to={profilePath(profile.role)} className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg hover:bg-neutral-50 transition-colors">
                <div className="h-8 w-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-semibold">
                  {initials(profile.first_name, profile.last_name)}
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-neutral-800 leading-tight">
                    {profile.first_name} {profile.last_name}
                  </p>
                  <Badge className={roleColor(profile.role)}>
                    {roleLabel(profile.role)}
                  </Badge>
                </div>
              </Link>
              <button onClick={handleSignOut} className="btn-ghost" title="Déconnexion">
                <LogOut className="h-4 w-4" />
              </button>
            </div>

            <button
              className="md:hidden p-2 rounded-lg text-neutral-600 hover:bg-neutral-100"
              onClick={() => setMobileOpen(o => !o)}
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div className="md:hidden border-t border-neutral-100 bg-white animate-fade-in">
            <div className="px-4 py-3 space-y-1">
              {navItems.map(item => (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileOpen(false)}
                  className={`block px-3 py-2.5 rounded-lg text-sm font-medium ${
                    location.pathname === item.to
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-neutral-600 hover:bg-neutral-50'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
              <Link
                to={profilePath(profile.role)}
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-neutral-600 hover:bg-neutral-50"
              >
                <UserIcon className="h-4 w-4" /> Profil
              </Link>
              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-error-600 hover:bg-error-50"
              >
                <LogOut className="h-4 w-4" /> Déconnexion
              </button>
            </div>
          </div>
        )}
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {children}
      </main>
    </div>
  );
}

function profilePath(role: string): string {
  switch (role) {
    case 'admin': return '/admin/profile';
    case 'driver': return '/driver/profile';
    default: return '/profile';
  }
}
