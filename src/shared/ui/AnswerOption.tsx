import type { ReactNode } from 'react';

export function AnswerOption({
  selected,
  onClick,
  children,
  disabled = false,
}: {
  selected: boolean;
  onClick: () => void;
  children: ReactNode;
  disabled?: boolean;
}) {
  return (
    <button
      className="lb-answer-option"
      type="button"
      aria-pressed={selected}
      disabled={disabled}
      onClick={onClick}
    >
      <span className="lb-answer-check" aria-hidden="true">
        {selected ? '✓' : '○'}
      </span>
      <span>{children}</span>
    </button>
  );
}
