"use client";

import React from "react";

export interface BrandWordmarkProps {
  storeName?: string;
  isScrolled?: boolean;
  className?: string;
  showOrnament?: boolean;
}

/**
 * BrandWordmark
 *
 * Implements the exact aesthetic and typographic style of the "Velaash" text on the brand logo:
 * 1. High-contrast classical serif typography (Cormorant Garamond / Didone display serif).
 * 2. Burnished metallic gradient: warm golden-copper highlight -> rich amber terracotta -> deep espresso mahogany.
 * 3. Warm golden rim-lighting and dimensional drop-shadow.
 * 4. Distinctive initial capital "V" and calligraphic "h" terminal swash.
 * 5. Signature golden ornamental underline divider with central diamond facets and droplet jewel pendant.
 */
export function BrandWordmark({
  storeName = "Velaash",
  isScrolled = false,
  className = "",
  showOrnament = true,
}: BrandWordmarkProps) {
  const name = storeName || "Velaash";
  const isVelaash = name.trim().toLowerCase() === "velaash";

  return (
    <div className={`inline-flex flex-col items-start justify-center select-none ${className}`}>
      {/* Brand Text with Metallic Burnished Copper-to-Espresso Gradient */}
      <span
        className={`font-heading font-medium tracking-[0.015em] transition-all duration-300 leading-none ${
          isScrolled ? "text-2xl sm:text-[1.7rem]" : "text-2xl sm:text-[2.1rem]"
        }`}
        style={{
          background: "linear-gradient(180deg, #D68334 0%, #A34B0B 32%, #692904 70%, #341201 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}
      >
        {isVelaash ? (
          <span className="inline-flex items-baseline">
            {/* Signature Majestic Capital 'V' */}
            <span className="text-[1.16em] font-normal leading-none inline-block -mr-[0.03em] transform -translate-y-[1px]">
              V
            </span>
            {/* Lowercase 'elaas' with optical serif kerning */}
            <span className="tracking-[-0.01em]">elaas</span>
            {/* Lowercase 'h' with calligraphic swash flourish */}
            <span className="inline-block relative">
              h
              <span
                aria-hidden="true"
                className="absolute -right-[0.24em] bottom-[0.04em] text-[0.62em] select-none pointer-events-none transform rotate-12"
                style={{
                  background: "linear-gradient(180deg, #C86E24 0%, #6E2D06 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                ~
              </span>
            </span>
          </span>
        ) : (
          name
        )}
      </span>

      {/* Signature Ornamental Hairline Underline with Diamond Facets & Droplet Pendant */}
      {showOrnament && (
        <div className="relative flex items-center justify-center w-full mt-1 sm:mt-1.5 opacity-90 group-hover:opacity-100 transition-opacity duration-300">
          {/* Left Tapering Hairline */}
          <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-[#D49A3D]/70 to-[#B8860B]" />

          {/* Central Diamond Facet Cluster (exact motif from logo) */}
          <div className="flex items-center gap-0.5 px-1 shrink-0 text-[#B8860B]">
            <span className="text-[6px] sm:text-[7px] leading-none transform rotate-45 inline-block text-brand-gold/75">
              ◆
            </span>
            <span className="text-[8px] sm:text-[9px] leading-none transform rotate-45 inline-block text-[#D49A3D]">
              ◆
            </span>
            <span className="text-[6px] sm:text-[7px] leading-none transform rotate-45 inline-block text-brand-gold/75">
              ◆
            </span>
          </div>

          {/* Right Tapering Hairline */}
          <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent via-[#D49A3D]/70 to-[#B8860B]" />

          {/* Hanging Jewel Droplet Accent */}
          <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 text-[7px] text-[#A34B0B] leading-none pointer-events-none">
            ▾
          </div>
        </div>
      )}
    </div>
  );
}
