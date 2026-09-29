import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

export const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full font-medium tracking-wide transition-colors select-none",
  {
    variants: {
      variant: {
        default:
          "bg-brand-gold text-brand-dark hover:bg-brand-gold-hover border border-brand-gold/30",
        accent:
          "bg-brand-accent text-brand-cream hover:bg-brand-accent-hover border border-brand-accent/20",
        subtle: "bg-brand-light text-brand-dark border border-brand-gold/20",
        outline:
          "border border-brand-gold/60 text-brand-dark bg-transparent hover:bg-brand-light/30",
        dark: "bg-brand-dark text-brand-cream hover:bg-brand-dark-muted",
      },
      size: {
        sm: "px-2.5 py-0.5 text-[11px] uppercase tracking-wider",
        md: "px-3 py-1 text-xs uppercase tracking-wider",
        lg: "px-4 py-1.5 text-sm tracking-wide",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {
  icon?: React.ReactNode;
}

export const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant, size, icon, children, ...props }, ref) => {
    return (
      <div ref={ref} className={cn(badgeVariants({ variant, size, className }))} {...props}>
        {icon && <span className="inline-flex shrink-0">{icon}</span>}
        {children}
      </div>
    );
  }
);

Badge.displayName = "Badge";
