"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";

interface FooterAccordionItemProps {
  title: string;
  children: React.ReactNode;
}

export function FooterAccordionItem({ title, children }: FooterAccordionItemProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <div className="border-brand-cream/10 border-b pb-3 md:border-b-0 md:pb-0">
      {/* Mobile toggle button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="text-brand-gold flex w-full items-center justify-between py-2 text-left text-xs font-semibold tracking-widest uppercase md:hidden"
        aria-expanded={isOpen}
      >
        <span>{title}</span>
        <ChevronDown
          className={`text-brand-gold/60 h-4 w-4 transition-transform duration-200 ${
            isOpen ? "text-brand-gold rotate-180" : ""
          }`}
        />
      </button>

      {/* Desktop static heading */}
      <h4 className="text-brand-gold mb-3 hidden text-xs font-semibold tracking-widest uppercase md:block">
        {title}
      </h4>

      {/* Accordion Content */}
      <div className={`${isOpen ? "block pt-2" : "hidden"} md:block`}>{children}</div>
    </div>
  );
}
