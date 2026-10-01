import * as React from "react";
import { Container } from "@/components/ui/container";

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-brand-cream/40 min-h-screen pb-20">
      {children}
    </div>
  );
}
