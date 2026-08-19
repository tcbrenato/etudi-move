export type UserRole = 'user' | 'driver' | 'admin';

export type AccountStatus = 'active' | 'suspended' | 'pending';

export interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  role: UserRole;
  status: AccountStatus;
  profile_photo: string | null;
  created_at: string;
  updated_at: string;
}

export interface AdminStats {
  total_users: number;
  total_drivers: number;
  total_admins: number;
}
