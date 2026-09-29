import * as React from "react";
import { Container } from "@/components/ui/container";

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-brand-cream/30 min-h-screen">
      <Container size="xl" className="py-6 sm:py-10">
        {children}
      </Container>
    </div>
  );
}
