/**
 * Utility functions for parsing and serializing admin metadata (courier tracking, internal admin notes)
 * stored resiliently within orders.notes and/or dedicated table columns.
 */

const METADATA_DELIMITER = "\n\n--- VELAASH_ORDER_METADATA ---\n";

export interface OrderMetadataPayload {
  adminNotes?: string | null;
  trackingNumber?: string | null;
  courierName?: string | null;
}

export interface ParsedOrderNotes {
  customerNotes: string | null;
  adminNotes: string | null;
  trackingNumber: string | null;
  courierName: string | null;
}

/**
 * Parses the raw orders.notes text into customer-visible notes and internal metadata.
 */
export function parseOrderMetadata(rawNotes: string | null | undefined): ParsedOrderNotes {
  if (!rawNotes || !rawNotes.trim()) {
    return {
      customerNotes: null,
      adminNotes: null,
      trackingNumber: null,
      courierName: null,
    };
  }

  const parts = rawNotes.split(METADATA_DELIMITER);
  const customerNotes = parts[0]?.trim() || null;

  if (parts.length < 2) {
    return {
      customerNotes,
      adminNotes: null,
      trackingNumber: null,
      courierName: null,
    };
  }

  try {
    const metaJson = JSON.parse(parts[1].trim()) as OrderMetadataPayload;
    return {
      customerNotes,
      adminNotes: metaJson.adminNotes?.trim() || null,
      trackingNumber: metaJson.trackingNumber?.trim() || null,
      courierName: metaJson.courierName?.trim() || null,
    };
  } catch {
    return {
      customerNotes,
      adminNotes: null,
      trackingNumber: null,
      courierName: null,
    };
  }
}

/**
 * Serializes updated admin metadata into the orders.notes text, preserving any customer notes.
 */
export function serializeOrderNotes(
  currentRawNotes: string | null | undefined,
  updates: Partial<OrderMetadataPayload>
): string {
  const parsed = parseOrderMetadata(currentRawNotes);

  const mergedMetadata: OrderMetadataPayload = {
    adminNotes: updates.adminNotes !== undefined ? updates.adminNotes : parsed.adminNotes,
    trackingNumber: updates.trackingNumber !== undefined ? updates.trackingNumber : parsed.trackingNumber,
    courierName: updates.courierName !== undefined ? updates.courierName : parsed.courierName,
  };

  const hasAnyMetadata =
    Boolean(mergedMetadata.adminNotes?.trim()) ||
    Boolean(mergedMetadata.trackingNumber?.trim()) ||
    Boolean(mergedMetadata.courierName?.trim());

  const customerText = parsed.customerNotes || "";

  if (!hasAnyMetadata) {
    return customerText;
  }

  const metaString = JSON.stringify(mergedMetadata);
  return customerText ? `${customerText}${METADATA_DELIMITER}${metaString}` : `${METADATA_DELIMITER}${metaString}`.trimStart();
}

/**
 * Extracts tracking information from an order, checking dedicated columns first
 * then falling back to metadata inside orders.notes.
 */
export function extractTrackingInfo(order: {
  tracking_number?: string | null;
  courier_name?: string | null;
  notes?: string | null;
}): { trackingNumber: string | null; courierName: string | null } {
  // If dedicated columns are present and non-empty
  if (order.tracking_number || order.courier_name) {
    return {
      trackingNumber: order.tracking_number?.trim() || null,
      courierName: order.courier_name?.trim() || null,
    };
  }

  // Fallback to metadata block in notes
  const parsed = parseOrderMetadata(order.notes);
  return {
    trackingNumber: parsed.trackingNumber,
    courierName: parsed.courierName,
  };
}

/**
 * Extracts internal admin notes, checking dedicated column first then metadata.
 */
export function extractAdminNotes(order: {
  admin_notes?: string | null;
  notes?: string | null;
}): string | null {
  if (order.admin_notes && order.admin_notes.trim()) {
    return order.admin_notes.trim();
  }
  const parsed = parseOrderMetadata(order.notes);
  return parsed.adminNotes;
}

/**
 * Extracts customer notes (cleansed of internal admin metadata).
 */
export function extractCustomerNotes(order: { notes?: string | null }): string | null {
  const parsed = parseOrderMetadata(order.notes);
  return parsed.customerNotes;
}
