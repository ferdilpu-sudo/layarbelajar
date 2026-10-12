import type { ReactNode } from 'react';

export function Alert({
  children,
  tone = 'error',
}: {
  children: ReactNode;
  tone?: 'error' | 'success';
}) {
  return (
    <div className={'lb-alert lb-alert--' + tone} role={tone === 'error' ? 'alert' : 'status'}>
      {children}
    </div>
  );
}
