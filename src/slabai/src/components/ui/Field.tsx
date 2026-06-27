import React, { forwardRef, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes } from "react";

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
  leading?: ReactNode;
}

export const Field = forwardRef<HTMLInputElement, FieldProps>(function Field(
  { label, id, error, hint, leading, ...props },
  ref
) {
  const inputId = id ?? props.name ?? label;
  const errorId = `${inputId}-error`;
  const hintId = `${inputId}-hint`;
  const describedBy = [error ? errorId : "", hint ? hintId : ""].filter(Boolean).join(" ") || undefined;

  return (
    <label className="field" htmlFor={inputId}>
      <span className="field__label">{label}</span>
      <span className="field__control-wrap">
        {leading}
        <input
          aria-describedby={describedBy}
          aria-invalid={Boolean(error)}
          className="field__control"
          id={inputId}
          ref={ref}
          {...props}
        />
      </span>
      {hint && (
        <p className="field__hint" id={hintId}>
          {hint}
        </p>
      )}
      {error && (
        <p className="field__error" id={errorId}>
          {error}
        </p>
      )}
    </label>
  );
});

interface SelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  error?: string;
  hint?: string;
  options: Array<{ label: string; value: string }>;
}

export function SelectField({ label, id, error, hint, options, ...props }: SelectFieldProps) {
  const selectId = id ?? props.name ?? label;
  const errorId = `${selectId}-error`;
  const hintId = `${selectId}-hint`;
  const describedBy = [error ? errorId : "", hint ? hintId : ""].filter(Boolean).join(" ") || undefined;

  return (
    <label className="field" htmlFor={selectId}>
      <span className="field__label">{label}</span>
      <select
        aria-describedby={describedBy}
        aria-invalid={Boolean(error)}
        className="field__control"
        id={selectId}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {hint && (
        <p className="field__hint" id={hintId}>
          {hint}
        </p>
      )}
      {error && (
        <p className="field__error" id={errorId}>
          {error}
        </p>
      )}
    </label>
  );
}
