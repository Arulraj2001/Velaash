import * as React from "react";

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-brand-cream/40 min-h-screen pb-20">
      {children}
    </div>
  );
}
