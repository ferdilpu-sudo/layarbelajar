import { useId, type InputHTMLAttributes } from 'react';

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> & {
  label: string;
  id?: string;
  error?: string;
};

export function Input({ label, id, error, className = '', ...props }: Props) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const errorId = inputId + '-error';

  return (
    <div className="form-field">
      <label htmlFor={inputId}>{label}</label>
      <input
        {...props}
        id={inputId}
        className={'lb-input ' + className}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : props['aria-describedby']}
      />
      {error ? <span id={errorId} className="lb-field-error">{error}</span> : null}
    </div>
  );
}
