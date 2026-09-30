import type { AdminRole } from "@/types/database.types";

/**
 * ==============================================================================
 * CENTRAL ADMIN ROLE PERMISSION MATRIX
 * ==============================================================================
 * Single source of truth for administrative role-based access control (RBAC).
 *
 * OWNER: Full authority across store operations, catalog, settings, coupons,
 *        homepage builder, staff administration, and financial analytics.
 *
 * STAFF: Operational authority to process orders, view customer order details,
 *        inspect catalog, and perform basic inventory/stock count updates.
 *        Staff CANNOT access: financials/revenue, coupon configuration,
 *        site settings, homepage builder, staff management, or destructive deletions.
 * ==============================================================================
 */

export type AdminPermissionKey =
  | "view_dashboard"
  | "view_analytics" // Revenue, AOV, sales trends (Owner-only)
  | "view_orders"
  | "update_order_status" // Mark packed, shipped, delivered, etc.
  | "manage_orders" // Full operational order processing (both Owner and Staff)
  | "manage_refunds" // Financial refund/payment override (Owner-only)
  | "view_products"
  | "update_stock" // Basic stock count adjustment
  | "manage_products" // Full product create/edit/pricing/SEO (Owner-only)
  | "delete_products" // Owner-only
  | "view_categories"
  | "manage_categories" // Owner-only
  | "manage_coupons" // Owner-only
  | "manage_homepage" // Owner-only
  | "manage_settings" // Owner-only
  | "manage_staff"; // Owner-only

export const ROLE_PERMISSIONS: Record<AdminRole, readonly AdminPermissionKey[]> = {
  owner: [
    "view_dashboard",
    "view_analytics",
    "view_orders",
    "update_order_status",
    "manage_orders",
    "manage_refunds",
    "view_products",
    "update_stock",
    "manage_products",
    "delete_products",
    "view_categories",
    "manage_categories",
    "manage_coupons",
    "manage_homepage",
    "manage_settings",
    "manage_staff",
  ],
  staff: [
    "view_dashboard",
    "view_orders",
    "update_order_status",
    "manage_orders",
    "view_products",
    "update_stock",
    "view_categories",
  ],
};

/**
 * Navigation item specification for the persistent admin sidebar.
 */
export interface AdminNavItem {
  title: string;
  href: string;
  iconName:
    | "LayoutDashboard"
    | "ShoppingBag"
    | "Package"
    | "FolderTree"
    | "TicketPercent"
    | "Sliders"
    | "Settings"
    | "Users";
  requiredPermission: AdminPermissionKey;
  ownerOnly?: boolean;
  badgeText?: string;
}

export const ADMIN_NAV_ITEMS: readonly AdminNavItem[] = [
  {
    title: "Dashboard",
    href: "/admin",
    iconName: "LayoutDashboard",
    requiredPermission: "view_dashboard",
  },
  {
    title: "Orders",
    href: "/admin/orders",
    iconName: "ShoppingBag",
    requiredPermission: "view_orders",
  },
  {
    title: "Products",
    href: "/admin/products",
    iconName: "Package",
    requiredPermission: "view_products",
  },
  {
    title: "Categories",
    href: "/admin/categories",
    iconName: "FolderTree",
    requiredPermission: "view_categories",
  },
  {
    title: "Coupons",
    href: "/admin/coupons",
    iconName: "TicketPercent",
    requiredPermission: "manage_coupons",
    ownerOnly: true,
  },
  {
    title: "Homepage Builder",
    href: "/admin/homepage",
    iconName: "Sliders",
    requiredPermission: "manage_homepage",
    ownerOnly: true,
  },
  {
    title: "Settings",
    href: "/admin/settings",
    iconName: "Settings",
    requiredPermission: "manage_settings",
    ownerOnly: true,
  },
  {
    title: "Staff",
    href: "/admin/staff",
    iconName: "Users",
    requiredPermission: "manage_staff",
    ownerOnly: true,
  },
] as const;

/**
 * Checks whether an admin role holds a specific permission.
 */
export function hasAdminPermission(
  role: AdminRole,
  permission: AdminPermissionKey
): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

/**
 * Returns only the navigation items permitted for the specified admin role.
 * Staff users will NEVER see owner-only links in the sidebar.
 */
export function getVisibleNavItems(role: AdminRole): AdminNavItem[] {
  return ADMIN_NAV_ITEMS.filter((item) => hasAdminPermission(role, item.requiredPermission));
}

/**
 * Verifies if an admin role is authorized to visit a specific admin subpath.
 */
export function canAccessAdminRoute(role: AdminRole, pathname: string): boolean {
  if (!pathname.startsWith("/admin")) return false;
  if (pathname === "/admin" || pathname === "/admin/") return true;

  // Exact or prefix route mapping
  if (pathname.startsWith("/admin/staff")) {
    return hasAdminPermission(role, "manage_staff");
  }
  if (pathname.startsWith("/admin/settings")) {
    return hasAdminPermission(role, "manage_settings");
  }
  if (pathname.startsWith("/admin/coupons")) {
    return hasAdminPermission(role, "manage_coupons");
  }
  if (pathname.startsWith("/admin/homepage")) {
    return hasAdminPermission(role, "manage_homepage");
  }
  if (pathname.startsWith("/admin/orders")) {
    return hasAdminPermission(role, "view_orders");
  }
  if (pathname.startsWith("/admin/products")) {
    return hasAdminPermission(role, "view_products");
  }
  if (pathname.startsWith("/admin/categories")) {
    return hasAdminPermission(role, "view_categories");
  }

  return true;
}
