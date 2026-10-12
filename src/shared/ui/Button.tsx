import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Props = ButtonHTMLAttributes<HTMLButtonElement> & { children: ReactNode; variant?: 'primary' | 'secondary' | 'text' };

export function Button({ children, variant = 'primary', className = '', type = 'button', ...props }: Props) {
  const modifier = variant === 'primary' ? '' : ' lb-button--' + variant;
  return <button type={type} className={'lb-button' + modifier + ' ' + className} {...props}>{children}</button>;
}
