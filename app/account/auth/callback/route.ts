import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const returnUrl = requestUrl.searchParams.get("returnUrl") || "/account";

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      // Auto-provision or update customer record with Google full name & metadata
      const googleFullName =
        data.user.user_metadata?.full_name ||
        data.user.user_metadata?.name ||
        data.user.user_metadata?.given_name ||
        "Valued Customer";

      const { data: existingCustomer } = await supabase
        .from("customers")
        .select("id, full_name")
        .eq("id", data.user.id)
        .maybeSingle();

      if (!existingCustomer) {
        await supabase.from("customers").insert({
          id: data.user.id,
          full_name: googleFullName,
          phone: null,
        });
      } else if (
        existingCustomer.full_name === "Valued Customer" &&
        googleFullName !== "Valued Customer"
      ) {
        await supabase
          .from("customers")
          .update({ full_name: googleFullName })
          .eq("id", data.user.id);
      }
    }
  }

  // Redirect to requested return URL
  return NextResponse.redirect(new URL(returnUrl, request.url));
}
