import type { ReactNode } from 'react';

export function Badge({
  children,
  kind,
}: {
  children: ReactNode;
  kind: 'material' | 'exercise' | 'worksheet' | 'game';
}) {
  return <span className={'lb-badge kind-' + kind}>{children}</span>;
}
