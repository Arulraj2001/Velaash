import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/features/auth";
import { CustomerLoginForm } from "@/features/auth";
import { Container } from "@/components/ui";

export const metadata: Metadata = {
  title: "Sign In | Velaash",
  description:
    "Sign in to your Velaash account to view order history, manage addresses, or access your wishlist.",
};

export default async function CustomerLoginPage(props: {
  searchParams: Promise<{ returnUrl?: string }>;
}) {
  const searchParams = await props.searchParams;
  const returnUrl = searchParams.returnUrl || "/account";

  // If already authenticated as customer, redirect directly
  const currentUser = await getCurrentUser();
  if (currentUser) {
    redirect(returnUrl);
  }

  return (
    <div className="bg-brand-cream flex min-h-[calc(100vh-220px)] items-center justify-center py-12 sm:py-20">
      <Container size="sm">
        <CustomerLoginForm />
      </Container>
    </div>
  );
}
