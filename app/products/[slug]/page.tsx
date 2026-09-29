import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Sparkles } from "lucide-react";

interface ProductPlaceholderProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: ProductPlaceholderProps): Promise<Metadata> {
  const { slug } = await params;
  return {
    title: `${slug.replace(/-/g, " ")} | Velaash`,
    description: "View product details and tailored measurements at Velaash.",
  };
}

export default async function ProductDetailPage({ params }: ProductPlaceholderProps) {
  const { slug } = await params;

  return (
    <div className="bg-brand-cream/40 min-h-[calc(100vh-250px)] py-12 sm:py-16">
      <Container size="md">
        <div className="border-brand-border shadow-luxury space-y-5 rounded-2xl border bg-white p-8 text-center font-sans sm:p-12">
          <div className="bg-brand-light/40 text-brand-accent mx-auto flex h-14 w-14 items-center justify-center rounded-full">
            <Sparkles className="h-7 w-7" />
          </div>

          <div className="space-y-2">
            <span className="text-brand-accent text-[11px] font-semibold tracking-widest uppercase">
              Product Detail Shell
            </span>
            <h1 className="font-heading text-brand-dark text-2xl font-semibold capitalize sm:text-3xl">
              {slug.replace(/-/g, " ")}
            </h1>
            <p className="text-brand-dark/70 mx-auto max-w-md text-xs leading-relaxed sm:text-sm">
              You have navigated to the product detail route. Complete PDP styling, image gallery,
              size selection, and cart actions are scheduled in Phase 2B.
            </p>
          </div>

          <div className="pt-2">
            <Link href="/shop">
              <Button variant="outline" size="sm" leftIcon={<ArrowLeft className="h-4 w-4" />}>
                Back to Shop Catalog
              </Button>
            </Link>
          </div>
        </div>
      </Container>
    </div>
  );
}
