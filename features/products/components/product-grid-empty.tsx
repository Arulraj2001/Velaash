"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { Sparkles, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ProductGridEmpty() {
  const router = useRouter();
  const pathname = usePathname();

  const handleReset = () => {
    router.push(pathname, { scroll: false });
  };

  return (
    <div className="border-brand-border flex flex-col items-center justify-center rounded-2xl border border-dashed bg-white/50 px-6 py-16 text-center font-sans">
      <div className="bg-brand-light/30 text-brand-accent mb-4 flex h-12 w-12 items-center justify-center rounded-full">
        <Sparkles className="h-6 w-6" />
      </div>

      <h3 className="font-heading text-brand-dark mb-2 text-xl font-semibold sm:text-2xl">
        No matching designs found
      </h3>

      <p className="text-brand-muted mb-6 max-w-md text-xs leading-relaxed sm:text-sm">
        We couldn&apos;t find any pieces matching your chosen combination of filters. Try adjusting
        your size, color, or price preferences.
      </p>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button
          variant="primary"
          size="sm"
          leftIcon={<RotateCcw className="h-4 w-4" />}
          onClick={handleReset}
        >
          Reset All Filters
        </Button>
        <Link href="/shop">
          <Button variant="outline" size="sm">
            Browse All Styles
          </Button>
        </Link>
      </div>
    </div>
  );
}
