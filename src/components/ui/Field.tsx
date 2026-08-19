import { useState, type InputHTMLAttributes, type ReactNode } from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  icon?: ReactNode;
}

export function Field({ label, error, icon, type = 'text', className = '', id, ...rest }: FieldProps) {
  const [showPassword, setShowPassword] = useState(false);
  const inputId = id || `field-${label.toLowerCase().replace(/\s+/g, '-')}`;
  const isPassword = type === 'password';
  const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

  return (
    <div className={className}>
      <label htmlFor={inputId} className="label">{label}</label>
      <div className="relative">
        {icon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none">
            {icon}
          </span>
        )}
        <input
          id={inputId}
          type={inputType}
          className={`input ${icon ? 'pl-10' : ''} ${isPassword ? 'pr-10' : ''} ${error ? 'border-error-500 focus:border-error-500 focus:ring-error-200' : ''}`}
          {...rest}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(s => !s)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 transition-colors"
            tabIndex={-1}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        )}
      </div>
      {error && <p className="mt-1 text-xs text-error-600">{error}</p>}
    </div>
  );
}
