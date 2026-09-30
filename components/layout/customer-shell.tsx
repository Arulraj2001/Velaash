"use client";

import React from "react";
import { usePathname } from "next/navigation";

interface CustomerShellProps {
  header: React.ReactNode;
  footer: React.ReactNode;
  overlays?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * CustomerShell guards the storefront chrome (Header, Footer, Cart Toast, Cookie Banner)
 * so that they are strictly unmounted and completely absent from any Admin routes (/admin/*).
 *
 * It accepts server-rendered Header and Footer as props so they execute safely on the server
 * without bundling server dependencies (next/headers) into the client.
 */
export function CustomerShell({
  header,
  footer,
  overlays,
  children,
}: CustomerShellProps) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin");

  if (isAdmin) {
    // Admin routes must never mount customer Header, Footer, or Cart overlays
    return <>{children}</>;
  }

  return (
    <>
      {header}
      <main className="flex-1">{children}</main>
      {footer}
      {overlays}
    </>
  );
}
