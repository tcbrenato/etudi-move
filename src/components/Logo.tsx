import { Link } from 'react-router-dom';
import { Bus } from 'lucide-react';

export function Logo({ to = '/', size = 'md' }: { to?: string; size?: 'sm' | 'md' | 'lg' }) {
  const dims = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-14 w-14',
  }[size];

  const text = {
    sm: 'text-base',
    md: 'text-lg',
    lg: 'text-2xl',
  }[size];

  return (
    <Link to={to} className="flex items-center gap-2.5 group">
      <div className={`${dims} rounded-xl bg-primary-700 flex items-center justify-center text-white shadow-sm transition-transform group-hover:scale-105`}>
        <Bus className="h-1/2 w-1/2" />
      </div>
      <span className={`${text} font-bold text-primary-700 tracking-tight`}>
        Étudi'<span className="text-accent-500">Move</span>
      </span>
    </Link>
  );
}
