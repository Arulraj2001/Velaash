"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/features/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  CustomerAddressFormSchema,
  type CustomerAddressFormData,
  type AddressActionResult,
  type SavedCustomerAddress,
} from "../types";

/**
 * Core function to add an address for a specific customer.
 */
export async function executeAddAddress(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  customerId: string,
  rawInput: CustomerAddressFormData
): Promise<AddressActionResult> {
  const parseResult = CustomerAddressFormSchema.safeParse(rawInput);
  if (!parseResult.success) {
    const errorMsg = parseResult.error.errors[0]?.message || "Invalid address details.";
    return { success: false, error: errorMsg };
  }

  const input = parseResult.data;

  // Check if customer has any existing addresses
  const { count } = await supabase
    .from("addresses")
    .select("id", { count: "exact", head: true })
    .eq("customer_id", customerId);

  // If this is the customer's first address, automatically make it default
  const shouldBeDefault = count === 0 ? true : Boolean(input.isDefault);

  const { data: inserted, error: insertError } = await supabase
    .from("addresses")
    .insert({
      customer_id: customerId,
      full_name: input.fullName,
      phone: input.phone,
      address_line1: input.addressLine1,
      address_line2: input.addressLine2 || null,
      city: input.city,
      state: input.state,
      pincode: input.pincode,
      address_type: input.addressType,
      is_default: shouldBeDefault,
    })
    .select("id, full_name, phone, address_line1, address_line2, city, state, pincode, address_type, is_default, created_at, updated_at")
    .single();

  if (insertError || !inserted) {
    console.error("Failed to add customer address:", insertError);
    return {
      success: false,
      error: "Failed to save address. Please check details and try again.",
    };
  }

  const savedAddress: SavedCustomerAddress = {
    id: inserted.id,
    fullName: inserted.full_name,
    phone: inserted.phone,
    addressLine1: inserted.address_line1,
    addressLine2: inserted.address_line2,
    city: inserted.city,
    state: inserted.state,
    pincode: inserted.pincode,
    addressType: inserted.address_type,
    isDefault: inserted.is_default,
    createdAt: inserted.created_at,
    updatedAt: inserted.updated_at,
  };

  return {
    success: true,
    address: savedAddress,
  };
}

/**
 * Core function to update an existing address for a specific customer.
 */
export async function executeUpdateAddress(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  customerId: string,
  addressId: string,
  rawInput: CustomerAddressFormData
): Promise<AddressActionResult> {
  const parseResult = CustomerAddressFormSchema.safeParse(rawInput);
  if (!parseResult.success) {
    const errorMsg = parseResult.error.errors[0]?.message || "Invalid address details.";
    return { success: false, error: errorMsg };
  }

  const input = parseResult.data;

  // Verify ownership
  const { data: existing, error: fetchErr } = await supabase
    .from("addresses")
    .select("id, is_default")
    .eq("id", addressId)
    .eq("customer_id", customerId)
    .maybeSingle();

  if (fetchErr || !existing) {
    return { success: false, error: "Address not found or unauthorized." };
  }

  // If already default, keep it default unless explicitly changing
  const isDefaultToSave = input.isDefault ?? existing.is_default;

  const { data: updated, error: updateError } = await supabase
    .from("addresses")
    .update({
      full_name: input.fullName,
      phone: input.phone,
      address_line1: input.addressLine1,
      address_line2: input.addressLine2 || null,
      city: input.city,
      state: input.state,
      pincode: input.pincode,
      address_type: input.addressType,
      is_default: isDefaultToSave,
      updated_at: new Date().toISOString(),
    })
    .eq("id", addressId)
    .eq("customer_id", customerId)
    .select("id, full_name, phone, address_line1, address_line2, city, state, pincode, address_type, is_default, created_at, updated_at")
    .single();

  if (updateError || !updated) {
    console.error("Failed to update customer address:", updateError);
    return { success: false, error: "Failed to update address. Please try again." };
  }

  const savedAddress: SavedCustomerAddress = {
    id: updated.id,
    fullName: updated.full_name,
    phone: updated.phone,
    addressLine1: updated.address_line1,
    addressLine2: updated.address_line2,
    city: updated.city,
    state: updated.state,
    pincode: updated.pincode,
    addressType: updated.address_type,
    isDefault: updated.is_default,
    createdAt: updated.created_at,
    updatedAt: updated.updated_at,
  };

  return {
    success: true,
    address: savedAddress,
  };
}

/**
 * Core function to delete an address for a customer.
 * If the deleted address is default and other addresses exist:
 * Promotes user-specified newDefaultId or the most recent remaining address.
 */
export async function executeDeleteAddress(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  customerId: string,
  addressId: string,
  newDefaultId?: string
): Promise<AddressActionResult> {
  // 1. Verify existence & ownership
  const { data: target, error: fetchErr } = await supabase
    .from("addresses")
    .select("id, is_default")
    .eq("id", addressId)
    .eq("customer_id", customerId)
    .maybeSingle();

  if (fetchErr || !target) {
    return { success: false, error: "Address not found or unauthorized." };
  }

  let assignedDefaultId: string | undefined = undefined;

  // 2. If target is default, handle promoting another address
  if (target.is_default) {
    // Find remaining addresses
    const { data: remaining } = await supabase
      .from("addresses")
      .select("id, created_at")
      .eq("customer_id", customerId)
      .neq("id", addressId)
      .order("created_at", { ascending: false });

    if (remaining && remaining.length > 0) {
      if (newDefaultId && remaining.some((r: { id: string }) => r.id === newDefaultId)) {
        assignedDefaultId = newDefaultId;
      } else {
        // Automatically promote the most recently created remaining address
        assignedDefaultId = remaining[0].id;
      }

      // Set new default (DB trigger unsets any previous)
      await supabase
        .from("addresses")
        .update({ is_default: true, updated_at: new Date().toISOString() })
        .eq("id", assignedDefaultId)
        .eq("customer_id", customerId);
    }
  }

  // 3. Delete the target address
  const { error: deleteErr } = await supabase
    .from("addresses")
    .delete()
    .eq("id", addressId)
    .eq("customer_id", customerId);

  if (deleteErr) {
    console.error("Failed to delete address:", deleteErr);
    return { success: false, error: "Failed to delete address." };
  }

  return {
    success: true,
    newDefaultId: assignedDefaultId,
  };
}

/**
 * Core function to set an address as default.
 * Relies on the PostgreSQL single-default trigger to unset any previous default.
 */
export async function executeSetDefaultAddress(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  customerId: string,
  addressId: string
): Promise<AddressActionResult> {
  // Verify existence & ownership
  const { data: target, error: fetchErr } = await supabase
    .from("addresses")
    .select("id")
    .eq("id", addressId)
    .eq("customer_id", customerId)
    .maybeSingle();

  if (fetchErr || !target) {
    return { success: false, error: "Address not found or unauthorized." };
  }

  // Update is_default to true (database trigger automatically sets is_default = false on other addresses)
  const { error: updateErr } = await supabase
    .from("addresses")
    .update({ is_default: true, updated_at: new Date().toISOString() })
    .eq("id", addressId)
    .eq("customer_id", customerId);

  if (updateErr) {
    console.error("Failed to set default address:", updateErr);
    return { success: false, error: "Failed to set default address." };
  }

  return { success: true };
}

// ============================================================================
// SERVER ACTIONS (Authenticated Customer Context)
// ============================================================================

export async function addCustomerAddressAction(
  data: CustomerAddressFormData
): Promise<AddressActionResult> {
  const authData = await getCurrentUser();
  if (!authData || !authData.user) {
    return { success: false, error: "Please sign in to save delivery addresses." };
  }

  const supabase = createAdminClient();
  const result = await executeAddAddress(supabase, authData.user.id, data);

  if (result.success) {
    revalidatePath("/account/addresses");
    revalidatePath("/checkout");
  }

  return result;
}

export async function updateCustomerAddressAction(
  addressId: string,
  data: CustomerAddressFormData
): Promise<AddressActionResult> {
  const authData = await getCurrentUser();
  if (!authData || !authData.user) {
    return { success: false, error: "Please sign in to update your address." };
  }

  const supabase = createAdminClient();
  const result = await executeUpdateAddress(supabase, authData.user.id, addressId, data);

  if (result.success) {
    revalidatePath("/account/addresses");
    revalidatePath("/checkout");
  }

  return result;
}

export async function deleteCustomerAddressAction(
  addressId: string,
  newDefaultId?: string
): Promise<AddressActionResult> {
  const authData = await getCurrentUser();
  if (!authData || !authData.user) {
    return { success: false, error: "Please sign in to manage your addresses." };
  }

  const supabase = createAdminClient();
  const result = await executeDeleteAddress(supabase, authData.user.id, addressId, newDefaultId);

  if (result.success) {
    revalidatePath("/account/addresses");
    revalidatePath("/checkout");
  }

  return result;
}

export async function setDefaultAddressAction(
  addressId: string
): Promise<AddressActionResult> {
  const authData = await getCurrentUser();
  if (!authData || !authData.user) {
    return { success: false, error: "Please sign in to set your default address." };
  }

  const supabase = createAdminClient();
  const result = await executeSetDefaultAddress(supabase, authData.user.id, addressId);

  if (result.success) {
    revalidatePath("/account/addresses");
    revalidatePath("/checkout");
  }

  return result;
}
