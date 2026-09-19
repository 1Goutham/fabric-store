"use client";
import { forwardRef, useId, type InputHTMLAttributes, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/client/cn";

interface FieldShellProps {
  label?: string;
  hint?: string;
  error?: string;
  id: string;
  children: React.ReactNode;
  className?: string;
}

function FieldShell({ label, hint, error, id, children, className }: FieldShellProps) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {label && (
        <label htmlFor={id} className="text-[12px] tracking-wide text-fg-muted">
          {label}
        </label>
      )}
      {children}
      {error ? (
        <p id={`${id}-error`} role="alert" className="text-[12px] text-danger">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-[12px] text-fg-faint">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

const control =
  "w-full rounded-[var(--r-md)] border border-line bg-surface px-3.5 text-[15px] text-fg placeholder:text-fg-faint transition-[border-color,box-shadow] duration-200 focus:border-line-strong focus:outline-none focus:ring-4 focus:ring-white/[0.05] disabled:opacity-50";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & { label?: string; hint?: string; error?: string; wrapperClassName?: string }>(
  function Input({ label, hint, error, className, wrapperClassName, id: idProp, ...rest }, ref) {
    const auto = useId();
    const id = idProp ?? auto;
    return (
      <FieldShell label={label} hint={hint} error={error} id={id} className={wrapperClassName}>
        <input ref={ref} id={id} aria-invalid={!!error} aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined} className={cn(control, "h-11", error && "border-danger/60", className)} {...rest} />
      </FieldShell>
    );
  }
);

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string; hint?: string; error?: string }>(
  function Textarea({ label, hint, error, className, id: idProp, ...rest }, ref) {
    const auto = useId();
    const id = idProp ?? auto;
    return (
      <FieldShell label={label} hint={hint} error={error} id={id}>
        <textarea ref={ref} id={id} aria-invalid={!!error} className={cn(control, "min-h-28 py-3 leading-relaxed", error && "border-danger/60", className)} {...rest} />
      </FieldShell>
    );
  }
);

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement> & { label?: string; hint?: string; error?: string }>(
  function Select({ label, hint, error, className, id: idProp, children, ...rest }, ref) {
    const auto = useId();
    const id = idProp ?? auto;
    return (
      <FieldShell label={label} hint={hint} error={error} id={id}>
        <select ref={ref} id={id} aria-invalid={!!error} className={cn(control, "h-11 appearance-none bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2212%22 height=%2212%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%23999%22 stroke-width=%222%22><path d=%22m6 9 6 6 6-6%22/></svg>')] bg-[length:12px] bg-[right_14px_center] bg-no-repeat pr-9", error && "border-danger/60", className)} {...rest}>
          {children}
        </select>
      </FieldShell>
    );
  }
);

export function Checkbox({ label, className, ...rest }: InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  const id = useId();
  return (
    <label htmlFor={id} className={cn("inline-flex cursor-pointer items-center gap-2.5 text-sm text-fg-soft", className)}>
      <span className="relative inline-flex h-4 w-4 items-center justify-center">
        <input id={id} type="checkbox" className="peer h-4 w-4 cursor-pointer appearance-none rounded-[4px] border border-line-strong bg-surface transition checked:border-fg checked:bg-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent" {...rest} />
        <svg aria-hidden viewBox="0 0 24 24" className="pointer-events-none absolute h-3 w-3 text-bg opacity-0 peer-checked:opacity-100" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="m5 12 5 5L20 7" />
        </svg>
      </span>
      {label}
    </label>
  );
}
