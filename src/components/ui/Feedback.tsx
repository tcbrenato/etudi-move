import type { ReactNode } from 'react';
import { AlertCircle } from 'lucide-react';

export function Spinner({ className = '' }: { className?: string }) {
  return (
    <div className={`inline-block animate-spin rounded-full border-2 border-neutral-200 border-t-primary-600 ${className}`} style={{ width: '1em', height: '1em' }} />
  );
}

export function FullPageSpinner({ label = 'Chargement…' }: { label?: string }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-neutral-50">
      <Spinner className="text-3xl text-primary-600" />
      <p className="text-sm text-neutral-500">{label}</p>
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
      <div className="h-12 w-12 rounded-full bg-error-50 flex items-center justify-center">
        <AlertCircle className="h-6 w-6 text-error-500" />
      </div>
      <p className="text-sm text-neutral-600 max-w-sm">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="btn-secondary mt-1">
          Réessayer
        </button>
      )}
    </div>
  );
}

export function EmptyState({ title, message, action }: { title: string; message?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
      <p className="text-base font-medium text-neutral-700">{title}</p>
      {message && <p className="text-sm text-neutral-500 max-w-sm">{message}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

export function Badge({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${className}`}>
      {children}
    </span>
  );
}
