import type { ReactNode } from 'react';

export function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button type="button" className="lb-chip" aria-pressed={active} onClick={onClick}>
      {active ? '✓ ' : ''}
      {children}
    </button>
  );
}
