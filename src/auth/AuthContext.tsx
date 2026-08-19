import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import type { Profile, UserRole } from '@/types';

interface AuthState {
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (identifier: string, password: string) => Promise<void>;
  signUp: (data: SignUpData) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateProfile: (updates: ProfileUpdate) => Promise<void>;
}

interface SignUpData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  role: 'user' | 'driver';
}

interface ProfileUpdate {
  first_name?: string;
  last_name?: string;
  phone?: string;
  profile_photo?: string | null;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  async function fetchProfile(userId: string): Promise<Profile | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.error('Failed to fetch profile:', error.message);
      return null;
    }
    return data as Profile | null;
  }

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(async ({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      if (data.session) {
        const p = await fetchProfile(data.session.user.id);
        if (mounted) setProfile(p);
      }
      if (mounted) setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        (async () => {
          if (!mounted) return;
          setSession(newSession);
          if (newSession) {
            const p = await fetchProfile(newSession.user.id);
            if (mounted) setProfile(p);
          } else {
            setProfile(null);
          }
          setLoading(false);
        })();
      }
    );

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  async function signIn(identifier: string, password: string) {
    const email = identifier.includes('@') ? identifier : identifier;
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw new Error(mapAuthError(error.message));
  }

  async function signUp(data: SignUpData) {
    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          first_name: data.firstName,
          last_name: data.lastName,
          phone: data.phone,
          role: data.role,
        },
      },
    });
    if (error) throw new Error(mapAuthError(error.message));
  }

  async function signOut() {
    await supabase.auth.signOut();
    setProfile(null);
    setSession(null);
  }

  async function resetPassword(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) throw new Error(mapAuthError(error.message));
  }

  async function refreshProfile() {
    if (!session) return;
    const p = await fetchProfile(session.user.id);
    setProfile(p);
  }

  async function updateProfile(updates: ProfileUpdate) {
    if (!session) throw new Error('Non connecté');
    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', session.user.id);
    if (error) throw new Error('Impossible de mettre à jour le profil.');
    await refreshProfile();
  }

  return (
    <AuthContext.Provider
      value={{
        session,
        profile,
        loading,
        signIn,
        signUp,
        signOut,
        resetPassword,
        refreshProfile,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

function mapAuthError(msg: string): string {
  const m = msg.toLowerCase();
  if (m.includes('invalid login credentials'))
    return 'Email ou mot de passe incorrect.';
  if (m.includes('user already registered'))
    return 'Un compte existe déjà avec cet email.';
  if (m.includes('email should not be empty'))
    return 'L\'email est requis.';
  if (m.includes('password should be at least'))
    return 'Le mot de passe doit contenir au moins 6 caractères.';
  if (m.includes('rate limit')) return 'Trop de tentatives. Réessayez plus tard.';
  return 'Une erreur est survenue. Veuillez réessayer.';
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export function hasRole(profile: Profile | null, ...roles: UserRole[]): boolean {
  return !!profile && roles.includes(profile.role);
}
