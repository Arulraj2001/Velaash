import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      type = "text",
      label,
      helperText,
      error,
      leftIcon,
      rightIcon,
      id,
      disabled,
      ...props
    },
    ref
  ) => {
    const generatedId = React.useId();
    const inputId = id || generatedId;
    const errorId = `${inputId}-error`;
    const helperId = `${inputId}-helper`;

    return (
      <div className="w-full space-y-1.5 text-left">
        {label && (
          <label
            htmlFor={inputId}
            className="text-brand-muted block text-xs font-medium tracking-wider uppercase"
          >
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {leftIcon && (
            <div className="text-brand-muted pointer-events-none absolute left-3 flex items-center">
              {leftIcon}
            </div>
          )}
          <input
            id={inputId}
            ref={ref}
            type={type}
            disabled={disabled}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? errorId : helperText ? helperId : undefined}
            className={cn(
              "border-brand-border bg-brand-card text-brand-dark placeholder:text-brand-subtle flex h-11 w-full rounded-md border px-3.5 py-2 text-sm transition-colors duration-150",
              "focus-visible:border-brand-gold focus-visible:ring-brand-gold/30 focus-visible:ring-2 focus-visible:outline-none",
              "disabled:bg-brand-cream/50 disabled:cursor-not-allowed disabled:opacity-60",
              leftIcon && "pl-10",
              rightIcon && "pr-10",
              error && "border-red-500 focus-visible:border-red-500 focus-visible:ring-red-400/30",
              className
            )}
            {...props}
          />
          {rightIcon && (
            <div className="text-brand-muted absolute right-3 flex items-center">{rightIcon}</div>
          )}
        </div>
        {error && (
          <p id={errorId} className="text-xs text-red-600">
            {error}
          </p>
        )}
        {!error && helperText && (
          <p id={helperId} className="text-brand-muted text-xs">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
