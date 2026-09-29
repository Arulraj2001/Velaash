import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAdminUser, signOutAdminAction, hasAdminPermission } from "@/features/auth";
import { Container, Card, Button, Badge } from "@/components/ui";
import { ShieldCheck, LogOut, Package, ShoppingBag, Settings } from "lucide-react";

export const metadata: Metadata = {
  title: "Administrative Console | Velaash",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminDashboardPage() {
  const admin = await getAdminUser();

  if (!admin) {
    redirect("/admin/login?returnUrl=/admin");
  }

  const isOwner = admin.role === "owner";

  return (
    <div className="bg-brand-dark text-brand-cream min-h-screen py-12 sm:py-16">
      <Container size="xl">
        <div className="space-y-8">
          {/* Header Bar */}
          <div className="border-brand-accent/20 flex flex-col justify-between gap-4 border-b pb-6 sm:flex-row sm:items-center">
            <div className="space-y-1">
              <div className="flex items-center gap-2.5">
                <span className="font-heading text-brand-gold text-3xl font-semibold sm:text-4xl">
                  Velaash Admin Console
                </span>
                <Badge
                  variant={isOwner ? "accent" : "subtle"}
                  size="sm"
                  className="font-mono tracking-widest uppercase"
                >
                  Role: {admin.role}
                </Badge>
              </div>
              <p className="text-brand-cream/70 font-sans text-xs">
                Logged in as <span className="text-brand-gold font-medium">{admin.fullName}</span> (
                {admin.email})
              </p>
            </div>

            <form action={signOutAdminAction}>
              <Button
                type="submit"
                variant="outline"
                size="sm"
                className="border-brand-accent/40 text-brand-cream hover:bg-brand-accent/20 hover:text-brand-gold"
                leftIcon={<LogOut className="h-4 w-4" />}
              >
                Sign Out Admin
              </Button>
            </form>
          </div>

          {/* Role Status & Permissions Alert */}
          <Card className="bg-brand-dark-muted/60 border-brand-accent/30 text-brand-cream p-6">
            <div className="flex items-start gap-3">
              <ShieldCheck className="text-brand-gold mt-0.5 h-6 w-6 shrink-0" />
              <div className="space-y-2">
                <h4 className="text-brand-gold text-sm font-semibold">
                  RBAC Gate Verification:{" "}
                  {isOwner ? "Proprietor (Owner) Access" : "Staff Member Access"}
                </h4>
                <p className="text-brand-cream/80 font-sans text-xs leading-relaxed">
                  Your identity has been authenticated against Supabase Auth and strictly verified
                  against the Postgres <code>admin_users</code> table via <code>is_admin()</code>.
                  Regular customer accounts are permanently rejected from accessing any{" "}
                  <code>/admin/*</code> routes.
                </p>
                <div className="flex flex-wrap gap-2 pt-2 font-mono text-[11px]">
                  <span className="border-brand-accent/30 text-brand-cream/90 rounded border bg-black/30 px-2.5 py-1">
                    Orders:{" "}
                    {hasAdminPermission(admin.role, "manage_orders")
                      ? "✓ Full Access"
                      : "✗ Restricted"}
                  </span>
                  <span className="border-brand-accent/30 text-brand-cream/90 rounded border bg-black/30 px-2.5 py-1">
                    Catalog:{" "}
                    {hasAdminPermission(admin.role, "manage_products")
                      ? "✓ Manage"
                      : "✗ Restricted"}
                  </span>
                  <span className="border-brand-accent/30 text-brand-cream/90 rounded border bg-black/30 px-2.5 py-1">
                    Catalog Deletion:{" "}
                    {hasAdminPermission(admin.role, "delete_products")
                      ? "✓ Allowed"
                      : "✗ Owner Only"}
                  </span>
                  <span className="border-brand-accent/30 text-brand-cream/90 rounded border bg-black/30 px-2.5 py-1">
                    Store Settings:{" "}
                    {hasAdminPermission(admin.role, "manage_settings")
                      ? "✓ Allowed"
                      : "✗ Owner Only"}
                  </span>
                  <span className="border-brand-accent/30 text-brand-cream/90 rounded border bg-black/30 px-2.5 py-1">
                    Admin Provisioning:{" "}
                    {hasAdminPermission(admin.role, "manage_admin_users")
                      ? "✓ Allowed"
                      : "✗ Owner Only"}
                  </span>
                </div>
              </div>
            </div>
          </Card>

          {/* Admin Feature Modules Grid */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <Card className="bg-brand-dark-muted/40 border-brand-accent/20 text-brand-cream space-y-3 p-6">
              <div className="flex items-center justify-between">
                <div className="bg-brand-accent/20 text-brand-gold rounded-lg p-2.5">
                  <Package className="h-5 w-5" />
                </div>
                <Badge variant="subtle" size="sm">
                  Fulfillment
                </Badge>
              </div>
              <h3 className="font-heading text-brand-gold text-xl font-semibold">
                Orders & Shipments
              </h3>
              <p className="text-brand-cream/70 text-xs">
                View incoming orders, verify Razorpay transactions, and transition order states.
              </p>
            </Card>

            <Card className="bg-brand-dark-muted/40 border-brand-accent/20 text-brand-cream space-y-3 p-6">
              <div className="flex items-center justify-between">
                <div className="bg-brand-accent/20 text-brand-gold rounded-lg p-2.5">
                  <ShoppingBag className="h-5 w-5" />
                </div>
                <Badge variant="subtle" size="sm">
                  Catalog
                </Badge>
              </div>
              <h3 className="font-heading text-brand-gold text-xl font-semibold">
                Products & Variants
              </h3>
              <p className="text-brand-cream/70 text-xs">
                Manage apparel catalog and inventory, update SKU stocks, and upload product media.
              </p>
            </Card>

            <Card className="bg-brand-dark-muted/40 border-brand-accent/20 text-brand-cream space-y-3 p-6">
              <div className="flex items-center justify-between">
                <div className="bg-brand-accent/20 text-brand-gold rounded-lg p-2.5">
                  <Settings className="h-5 w-5" />
                </div>
                <Badge variant="accent" size="sm">
                  {isOwner ? "Owner Master" : "Read Only"}
                </Badge>
              </div>
              <h3 className="font-heading text-brand-gold text-xl font-semibold">Store Settings</h3>
              <p className="text-brand-cream/70 text-xs">
                Configure GST tax rates, free shipping thresholds, COD rules, and brand
                announcements.
              </p>
            </Card>
          </div>
        </div>
      </Container>
    </div>
  );
}
