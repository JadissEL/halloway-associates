import { forwardRef, useId } from "react";
import { cn } from "@/lib/utils";

// Shared field chrome (label + control + help/error text) so every form on
// the platform gets the same spacing, focus ring, and error presentation —
// previously each form (PropertyForm, ContactForm, SignInForm, the
// properties/professionals filter bars) hand-rolled its own `inputClass`
// string with small drifts. Error text now always uses the destructive
// design token instead of a hardcoded Tailwind red (a real inconsistency
// found while auditing PropertyForm.tsx).
const controlClass =
  "w-full rounded-none border border-luxury-border bg-luxury-input px-4 py-2.5 text-sm text-luxury-ivory outline-none transition-colors duration-200 placeholder:text-luxury-muted-foreground focus:border-luxury-gold focus:shadow-[0_0_0_1px_var(--color-luxury-gold)] disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-luxury-destructive";

interface FieldShellProps {
  label?: string;
  htmlFor: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}

function FieldShell({ label, htmlFor, error, hint, required, children, className }: FieldShellProps) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {label && (
        <label htmlFor={htmlFor} className="text-sm font-medium text-luxury-ivory">
          {label}
          {required && <span className="ml-0.5 text-luxury-gold">*</span>}
        </label>
      )}
      {children}
      {error ? (
        <p className="text-xs text-luxury-destructive" role="alert">{error}</p>
      ) : hint ? (
        <p className="text-xs text-luxury-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
  hint?: string;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, className, id, required, ...props }, ref) => {
    const autoId = useId();
    const inputId = id ?? autoId;
    return (
      <FieldShell label={label} htmlFor={inputId} error={error} hint={hint} required={required}>
        <input
          ref={ref}
          id={inputId}
          required={required}
          aria-invalid={Boolean(error)}
          className={cn(controlClass, className)}
          {...props}
        />
      </FieldShell>
    );
  },
);
Input.displayName = "Input";

type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string;
  error?: string;
  hint?: string;
};

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, hint, className, id, required, rows = 4, ...props }, ref) => {
    const autoId = useId();
    const inputId = id ?? autoId;
    return (
      <FieldShell label={label} htmlFor={inputId} error={error} hint={hint} required={required}>
        <textarea
          ref={ref}
          id={inputId}
          required={required}
          rows={rows}
          aria-invalid={Boolean(error)}
          className={cn(controlClass, "resize-none", className)}
          {...props}
        />
      </FieldShell>
    );
  },
);
Textarea.displayName = "Textarea";

type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
  error?: string;
  hint?: string;
};

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, hint, className, id, required, children, ...props }, ref) => {
    const autoId = useId();
    const inputId = id ?? autoId;
    return (
      <FieldShell label={label} htmlFor={inputId} error={error} hint={hint} required={required}>
        <select
          ref={ref}
          id={inputId}
          required={required}
          aria-invalid={Boolean(error)}
          className={cn(controlClass, "cursor-pointer", className)}
          {...props}
        >
          {children}
        </select>
      </FieldShell>
    );
  },
);
Select.displayName = "Select";
