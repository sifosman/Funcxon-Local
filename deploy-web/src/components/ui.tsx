// WEB ONLY — deploy-web/src/components/ui.tsx
import type { InputHTMLAttributes, ReactNode } from 'react';

type PrimaryButtonProps = {
  title: string;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
};

export function PrimaryButton({ title, onClick, disabled, className = '', type = 'button' }: PrimaryButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={[
        'fx-btn-primary inline-flex h-12 items-center justify-center rounded-lg px-6 text-base font-bold tracking-wide transition-colors focus:outline-none disabled:cursor-not-allowed disabled:opacity-60',
        className,
      ].join(' ')}
    >
      {title}
    </button>
  );
}

type OutlineButtonProps = {
  title: string;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
};

export function OutlineButton({ title, onClick, disabled, className = '', type = 'button' }: OutlineButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={[
        'fx-btn-outline inline-flex h-12 items-center justify-center rounded-lg px-6 text-base font-bold tracking-wide transition-colors focus:outline-none disabled:cursor-not-allowed disabled:opacity-60',
        className,
      ].join(' ')}
    >
      {title}
    </button>
  );
}

type ThemedInputProps = InputHTMLAttributes<HTMLInputElement> & {
  errorText?: string;
  label?: string;
  icon?: ReactNode;
};

export function ThemedInput({ errorText, label, icon, className = '', ...rest }: ThemedInputProps) {
  return (
    <div className={className}>
      {label ? <label className="mb-1.5 block text-sm font-medium text-on-surface">{label}</label> : null}
      <div className="relative">
        {icon ? <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">{icon}</span> : null}
        <input
          {...rest}
          className={[
            'fx-input w-full rounded-lg border bg-white px-4 py-2.5 text-sm text-on-surface placeholder:text-on-surface-variant focus:border-primary-container focus:outline-none focus:ring-1 focus:ring-primary-container',
            icon ? 'pl-10' : '',
            errorText ? 'border-error' : 'border-outline-variant',
          ].join(' ')}
        />
      </div>
      {errorText ? <p className="mt-1 text-xs text-error">{errorText}</p> : null}
    </div>
  );
}

type FilterChipProps = {
  label: string;
  selected?: boolean;
  onClick?: () => void;
  className?: string;
};

export function FilterChip({ label, selected, onClick, className = '' }: FilterChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'inline-flex items-center rounded-full px-4 py-2 text-sm font-medium transition-colors',
        selected
          ? 'bg-brand-teal text-white'
          : 'border border-outline-variant bg-white text-on-surface hover:bg-surface-container-low',
        className,
      ].join(' ')}
    >
      {label}
    </button>
  );
}

type SectionHeaderProps = {
  title: string;
  children?: ReactNode;
  className?: string;
};

export function SectionHeader({ title, children, className = '' }: SectionHeaderProps) {
  return (
    <div className={['mb-4 flex items-center justify-between', className].join(' ')}>
      <h2 className="font-display text-xl font-semibold text-on-surface">{title}</h2>
      {children}
    </div>
  );
}
