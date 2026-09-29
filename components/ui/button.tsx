import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium tracking-wide transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 select-none active:scale-[0.98]",
  {
    variants: {
      variant: {
        primary:
          "bg-brand-gold text-brand-dark hover:bg-brand-gold-hover shadow-gold-sm hover:shadow-gold-md font-semibold",
        secondary: "bg-brand-accent text-brand-cream hover:bg-brand-accent-hover shadow-sm",
        dark: "bg-brand-dark text-brand-cream hover:bg-brand-dark-muted shadow-sm",
        outline:
          "border border-brand-gold/60 text-brand-dark bg-transparent hover:bg-brand-light/25 hover:border-brand-gold",
        ghost: "text-brand-dark hover:bg-brand-light/30 hover:text-brand-dark",
        link: "text-brand-accent underline-offset-4 hover:underline p-0 h-auto font-normal",
      },
      size: {
        sm: "h-8 px-3 text-xs rounded-sm",
        md: "h-10 px-5 text-sm rounded-md",
        lg: "h-12 px-7 text-base rounded-lg",
        icon: "h-10 w-10 p-0 rounded-md",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      isLoading = false,
      leftIcon,
      rightIcon,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(buttonVariants({ variant, size, className }))}
        {...props}
      >
        {isLoading && <Loader2 className="h-4 w-4 animate-spin text-current" />}
        {!isLoading && leftIcon && <span className="inline-flex">{leftIcon}</span>}
        {children}
        {!isLoading && rightIcon && <span className="inline-flex">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = "Button";
