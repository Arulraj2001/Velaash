import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

export const sectionVariants = cva("w-full relative", {
  variants: {
    spacing: {
      none: "py-0",
      sm: "py-8 sm:py-12",
      md: "py-12 sm:py-16",
      lg: "py-16 sm:py-24",
      xl: "py-20 sm:py-32",
    },
    background: {
      default: "bg-transparent",
      cream: "bg-brand-cream",
      white: "bg-white",
      light: "bg-brand-light/20",
      dark: "bg-brand-dark text-brand-cream",
    },
  },
  defaultVariants: {
    spacing: "md",
    background: "default",
  },
});

export interface SectionProps
  extends React.HTMLAttributes<HTMLElement>, VariantProps<typeof sectionVariants> {}

export const Section = React.forwardRef<HTMLElement, SectionProps>(
  ({ className, spacing, background, children, ...props }, ref) => {
    return (
      <section
        ref={ref}
        className={cn(sectionVariants({ spacing, background, className }))}
        {...props}
      >
        {children}
      </section>
    );
  }
);

Section.displayName = "Section";

export interface SectionHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  align?: "left" | "center" | "right";
}

export const SectionHeader = React.forwardRef<HTMLDivElement, SectionHeaderProps>(
  ({ className, align = "center", children, ...props }, ref) => {
    const alignmentClass = {
      left: "text-left items-start",
      center: "text-center items-center mx-auto",
      right: "text-right items-end ml-auto",
    }[align];

    return (
      <div
        ref={ref}
        className={cn("mb-8 flex max-w-2xl flex-col sm:mb-12", alignmentClass, className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);

SectionHeader.displayName = "SectionHeader";

export const SectionTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h2
    ref={ref}
    className={cn(
      "font-heading text-3xl font-semibold tracking-tight text-inherit sm:text-4xl",
      className
    )}
    {...props}
  />
));

SectionTitle.displayName = "SectionTitle";

export const SectionDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("mt-2 font-sans text-sm opacity-75 sm:text-base", className)}
    {...props}
  />
));

SectionDescription.displayName = "SectionDescription";
