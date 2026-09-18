import type {
  AccountStatus,
  UserRole,
  TripDirection,
  PaymentMethod,
  PaymentStatus,
  BookingStatus,
} from '@/types';

export function directionLabel(direction: TripDirection): string {
  return direction === 'to_campus' ? 'Vers le campus' : 'Depuis le campus';
}

export function formatFcfa(amount: number): string {
  return `${amount.toLocaleString('fr-FR')} F`;
}

export const PAYMENT_METHODS: { id: PaymentMethod; label: string; hint: string }[] = [
  { id: 'mtn_momo', label: 'MTN MoMo', hint: 'Mobile Money' },
  { id: 'moov_money', label: 'Moov Money', hint: 'Mobile Money' },
  { id: 'celtiis_cash', label: 'Celtiis Cash', hint: 'Mobile Money' },
  { id: 'cash', label: 'Espèces', hint: 'Au conducteur' },
];

export function isMobileMoney(method: PaymentMethod | null): boolean {
  return method !== null && method !== 'cash';
}

export function paymentMethodLabel(method: PaymentMethod | null): string {
  return PAYMENT_METHODS.find(m => m.id === method)?.label ?? 'Espèces';
}

export function paymentStatusLabel(status: PaymentStatus, method: PaymentMethod | null): string {
  if (status === 'paid') return 'Payé';
  if (status === 'refunded') return 'Remboursé';
  return method === 'cash' || method === null ? 'À payer au conducteur' : 'Non payé';
}

export function paymentStatusColor(status: PaymentStatus): string {
  switch (status) {
    case 'paid':
      return 'bg-success-100 text-success-700';
    case 'refunded':
      return 'bg-neutral-100 text-neutral-600';
    default:
      return 'bg-warning-100 text-warning-700';
  }
}

export function bookingStatusLabel(status: BookingStatus): string {
  switch (status) {
    case 'pending':
      return 'En attente du conducteur';
    case 'accepted':
      return 'Acceptée';
    case 'declined':
      return 'Refusée';
    case 'cancelled':
      return 'Annulée';
    default:
      return status;
  }
}

export function bookingStatusColor(status: BookingStatus): string {
  switch (status) {
    case 'accepted':
      return 'bg-success-100 text-success-700';
    case 'pending':
      return 'bg-warning-100 text-warning-700';
    default:
      return 'bg-neutral-100 text-neutral-600';
  }
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
