import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'text';
  loading?: boolean;
};

export function Button({
  children,
  variant = 'primary',
  className = '',
  type = 'button',
  disabled,
  loading = false,
  ...props
}: Props) {
  const modifier = variant === 'primary' ? '' : ' lb-button--' + variant;
  return (
    <button
      type={type}
      className={'lb-button' + modifier + ' ' + className}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? <span aria-hidden="true">◌ </span> : null}
      {children}
    </button>
  );
}
