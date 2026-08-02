import type { ReactNode } from "react";

type FormFieldProps = {
  id: string;
  label: string;
  error?: string | null;
  hint?: string;
  children: ReactNode;
};

export function FormField({ id, label, error, hint, children }: FormFieldProps) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-foreground">
        {label}
      </label>
      {children}
      {hint && !error ? (
        <p className="mt-1.5 text-xs text-muted">{hint}</p>
      ) : null}
      {error ? (
        <p className="mt-1.5 text-xs text-error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
