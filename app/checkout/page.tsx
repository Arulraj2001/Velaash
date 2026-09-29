import { Metadata } from "next";
import { getSiteSettings } from "@/features/settings/queries/get-site-settings";
import { getCurrentUser } from "@/features/auth/queries/get-current-user";
import { getCustomerAddresses } from "@/features/checkout/queries/get-customer-addresses";
import { CheckoutView } from "@/features/checkout";

export const metadata: Metadata = {
  title: "Checkout | Velaash",
  description: "Complete your order with secure shipping and payment options.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function CheckoutPage() {
  const [siteSettings, authSession] = await Promise.all([
    getSiteSettings(),
    getCurrentUser(),
  ]);

  const savedAddresses = authSession?.user
    ? await getCustomerAddresses(authSession.user.id)
    : [];

  return (
    <main className="min-h-[70vh] bg-brand-cream/20">
      <CheckoutView
        siteSettings={siteSettings}
        currentUser={
          authSession?.user
            ? { id: authSession.user.id, email: authSession.user.email }
            : null
        }
        customerProfile={authSession?.customer || null}
        savedAddresses={savedAddresses}
      />
    </main>
  );
}
