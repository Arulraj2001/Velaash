import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminUser, hasAdminPermission } from "@/features/auth";
import { getNewsletterSubscribers } from "@/features/newsletter/queries/get-newsletter-subscribers";

export const metadata: Metadata = {
  title: "Newsletter Subscribers | Admin | Velaash",
  robots: { index: false, follow: false },
};

export default async function AdminNewsletterPage() {
  const admin = await getAdminUser();
  if (!admin || !hasAdminPermission(admin.role, "manage_settings")) {
    redirect("/admin");
  }

  const { subscribers, totalCount } = await getNewsletterSubscribers();

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <Link href="/admin/settings" className="text-xs text-slate-500 hover:text-slate-900">
            Settings
          </Link>
          <h1 className="mt-1 text-2xl font-semibold text-slate-900">Newsletter subscribers</h1>
          <p className="mt-1 text-xs text-slate-500">{totalCount} total subscriptions</p>
        </div>
        <a
          href="/api/admin/newsletter/export"
          className="inline-flex h-9 items-center gap-2 rounded border border-slate-300 bg-white px-3 text-xs font-medium text-slate-700 hover:bg-slate-50"
        >
          Export CSV
        </a>
      </div>

      <div className="overflow-x-auto rounded border border-slate-200 bg-white">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-[11px] uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3 font-semibold">Email</th>
              <th className="px-4 py-3 font-semibold">Subscribed</th>
              <th className="px-4 py-3 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {subscribers.map((subscriber) => (
              <tr key={subscriber.id}>
                <td className="px-4 py-3 text-slate-900">{subscriber.email}</td>
                <td className="px-4 py-3 text-slate-600">
                  {new Date(subscriber.subscribed_at).toLocaleString("en-IN")}
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {subscriber.is_active ? "Active" : "Inactive"}
                </td>
              </tr>
            ))}
            {subscribers.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-10 text-center text-slate-500">
                  No subscribers yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {subscribers.length < totalCount && (
        <p className="text-xs text-slate-500">Showing the latest {subscribers.length} of {totalCount} subscribers. Export CSV for the full list.</p>
      )}
    </section>
  );
}