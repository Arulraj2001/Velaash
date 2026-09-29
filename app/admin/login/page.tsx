import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAdminUser } from "@/features/auth";
import { AdminLoginForm } from "@/features/auth";
import { Container } from "@/components/ui";

export const metadata: Metadata = {
  title: "Staff Gate | Velaash Administrative Portal",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminLoginPage(props: {
  searchParams: Promise<{ returnUrl?: string }>;
}) {
  const searchParams = await props.searchParams;
  const returnUrl = searchParams.returnUrl || "/admin";

  // If already authenticated as an authorized admin, bypass gate
  const currentAdmin = await getAdminUser();
  if (currentAdmin) {
    redirect(returnUrl);
  }

  return (
    <div className="bg-brand-dark flex min-h-screen items-center justify-center p-4 py-16 sm:py-24">
      <Container size="sm">
        <AdminLoginForm />
      </Container>
    </div>
  );
}
