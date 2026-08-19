import type { AccountStatus, UserRole, TripDirection } from '@/types';

export function directionLabel(direction: TripDirection): string {
  return direction === 'to_campus' ? 'Vers le campus' : 'Depuis le campus';
}

export function roleLabel(role: UserRole): string {
  switch (role) {
    case 'user':
      return 'Utilisateur';
    case 'driver':
      return 'Conducteur';
    case 'admin':
      return 'Administrateur';
    default:
      return role;
  }
}

export function statusLabel(status: AccountStatus): string {
  switch (status) {
    case 'active':
      return 'Actif';
    case 'suspended':
      return 'Suspendu';
    case 'pending':
      return 'En attente';
    default:
      return status;
  }
}

export function statusColor(status: AccountStatus): string {
  switch (status) {
    case 'active':
      return 'bg-success-100 text-success-700';
    case 'suspended':
      return 'bg-error-100 text-error-700';
    case 'pending':
      return 'bg-warning-100 text-warning-700';
    default:
      return 'bg-neutral-100 text-neutral-600';
  }
}

export function roleColor(role: UserRole): string {
  switch (role) {
    case 'user':
      return 'bg-primary-100 text-primary-700';
    case 'driver':
      return 'bg-accent-100 text-accent-700';
    case 'admin':
      return 'bg-neutral-800 text-white';
    default:
      return 'bg-neutral-100 text-neutral-600';
  }
}

export function fullName(first: string, last: string): string {
  return `${first} ${last}`.trim();
}

export function initials(first: string, last: string): string {
  return `${first?.[0] ?? ''}${last?.[0] ?? ''}`.toUpperCase();
}
