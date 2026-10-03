import { Metadata } from "next";
import { getSiteSettings } from "@/features/settings/queries/get-site-settings";
import { CartView } from "@/features/cart";

export const metadata: Metadata = {
  title: "Shopping Bag | Velaash",
  description: "Review and manage items in your shopping bag before checkout.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function CartPage() {
  const siteSettings = await getSiteSettings();

  const shippingPolicy = {
    free_shipping_threshold: siteSettings.shippingPolicy.free_shipping_threshold,
    standard_shipping_fee: siteSettings.shippingPolicy.standard_shipping_fee,
  };

  const returnWindowDays = siteSettings.returnsPolicy.return_window_days;

  return (
    <main className="min-h-[70vh] bg-brand-cream/20">
      <CartView
        shippingPolicy={shippingPolicy}
        returnWindowDays={returnWindowDays}
        requireSignInToOrder={siteSettings.checkoutPolicy?.require_sign_in_to_order ?? false}
      />
    </main>
  );
}
