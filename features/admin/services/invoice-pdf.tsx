import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  renderToBuffer,
  Font,
} from "@react-pdf/renderer";
import type { AdminOrderDetail } from "../types/orders";
import { BRAND } from "@/lib/constants";

// Register hyphenation callback to prevent runtime issues with dynamic hyphenation files
Font.registerHyphenationCallback((word) => [word]);

const styles = StyleSheet.create({
  page: {
    padding: 36,
    fontSize: 9,
    fontFamily: "Helvetica",
    color: "#27272a",
    backgroundColor: "#ffffff",
    lineHeight: 1.4,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    borderBottomWidth: 1,
    borderBottomColor: "#e4e4e7",
    paddingBottom: 16,
    marginBottom: 16,
  },
  brandName: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    color: "#18181b",
    letterSpacing: 0.5,
  },
  legalEntity: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: "#71717a",
    marginTop: 2,
  },
  brandMeta: {
    fontSize: 8,
    color: "#71717a",
    marginTop: 2,
  },
  invoiceBadgeBlock: {
    alignItems: "flex-end",
  },
  docTitle: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    color: "#09090b",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  docSubtitle: {
    fontSize: 7.5,
    color: "#71717a",
    marginTop: 2,
    textAlign: "right",
    maxWidth: 220,
  },
  gstinText: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: "#2563eb",
    marginTop: 4,
  },
  metaGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#f8fafc",
    borderRadius: 4,
    padding: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  metaCol: {
    width: "48%",
  },
  metaTitle: {
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    color: "#64748b",
    textTransform: "uppercase",
    marginBottom: 4,
  },
  metaTextBold: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: "#0f172a",
  },
  metaText: {
    fontSize: 8.5,
    color: "#334155",
    marginTop: 1.5,
  },
  table: {
    marginTop: 8,
    marginBottom: 16,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f1f5f9",
    borderBottomWidth: 1,
    borderBottomColor: "#cbd5e1",
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  tableHeaderCell: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: "#334155",
    textTransform: "uppercase",
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  tableCell: {
    fontSize: 8.5,
    color: "#1e293b",
  },
  colNo: { width: "6%" },
  colItem: { width: "50%" },
  colVariant: { width: "16%" },
  colQty: { width: "8%", textAlign: "center" },
  colRate: { width: "10%", textAlign: "right" },
  colAmount: { width: "10%", textAlign: "right" },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 4,
  },
  summaryBlock: {
    width: "45%",
    backgroundColor: "#f8fafc",
    padding: 10,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  summaryLine: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 2,
  },
  summaryLineBold: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#cbd5e1",
    paddingTop: 6,
    marginTop: 4,
  },
  summaryLabel: {
    fontSize: 8.5,
    color: "#64748b",
  },
  summaryVal: {
    fontSize: 8.5,
    color: "#0f172a",
    fontFamily: "Helvetica-Bold",
  },
  totalLabel: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: "#0f172a",
  },
  totalVal: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: "#0f172a",
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 36,
    right: 36,
    borderTopWidth: 1,
    borderTopColor: "#e4e4e7",
    paddingTop: 8,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  footerNote: {
    fontSize: 7.5,
    color: "#71717a",
  },
});

export interface InvoicePdfProps {
  order: AdminOrderDetail;
  gstEnabled?: boolean;
  gstin?: string | null;
  storeProfile?: {
    name?: string;
    legal_name?: string;
    email?: string;
    phone?: string;
  } | null;
}

export const InvoiceDocument: React.FC<InvoicePdfProps> = ({
  order,
  gstEnabled = false,
  gstin = null,
  storeProfile = null,
}) => {
  const isGstActive = Boolean(gstEnabled && gstin);
  const brandDisplayName = storeProfile?.name || BRAND.name;
  const legalEntityName = storeProfile?.legal_name || BRAND.legalName;
  const supportEmail = storeProfile?.email || BRAND.contactEmail;
  const supportPhone = storeProfile?.phone || BRAND.supportPhone;

  const formattedDate = new Date(order.createdAt).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <Document title={`Invoice-${order.orderNumber}`}>
      <Page size="A4" style={styles.page}>
        {/* Header Block */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.brandName}>{brandDisplayName.toUpperCase()}</Text>
            <Text style={styles.legalEntity}>Legal Entity: {legalEntityName}</Text>
            <Text style={styles.brandMeta}>Tamil Nadu, India</Text>
            <Text style={styles.brandMeta}>Support: {supportEmail} | {supportPhone}</Text>
          </View>
          <View style={styles.invoiceBadgeBlock}>
            <Text style={styles.docTitle}>
              {isGstActive ? "TAX INVOICE" : "BILL OF SUPPLY"}
            </Text>
            <Text style={styles.docSubtitle}>
              {isGstActive
                ? "Original for Recipient"
                : "Composition taxable person / Not liable to pay tax under GST (GST Not Applicable)"}
            </Text>
            {isGstActive && gstin && (
              <Text style={styles.gstinText}>GSTIN: {gstin}</Text>
            )}
          </View>
        </View>

        {/* Invoice & Customer Meta Grid */}
        <View style={styles.metaGrid}>
          <View style={styles.metaCol}>
            <Text style={styles.metaTitle}>Order &amp; Invoice Info</Text>
            <Text style={styles.metaTextBold}>Order Number: #{order.orderNumber}</Text>
            <Text style={styles.metaText}>Date: {formattedDate}</Text>
            <Text style={styles.metaText}>
              Payment Method:{" "}
              {order.paymentMethod === "cod"
                ? "Cash on Delivery (COD)"
                : "Online Prepaid (Razorpay)"}
            </Text>
            <Text style={styles.metaText}>
              Payment Status: {order.paymentStatus.toUpperCase()}
            </Text>
            {order.razorpayPaymentId && (
              <Text style={styles.metaText}>
                Razorpay ID: {order.razorpayPaymentId}
              </Text>
            )}
            {order.trackingNumber && (
              <Text style={styles.metaText}>
                Courier Tracking: {order.courierName ? `${order.courierName} - ` : ""}{order.trackingNumber}
              </Text>
            )}
          </View>

          <View style={styles.metaCol}>
            <Text style={styles.metaTitle}>Billed &amp; Shipped To</Text>
            <Text style={styles.metaTextBold}>
              {order.shippingAddress.fullName || "Customer"}
            </Text>
            <Text style={styles.metaText}>{order.shippingAddress.addressLine1}</Text>
            {order.shippingAddress.addressLine2 && (
              <Text style={styles.metaText}>{order.shippingAddress.addressLine2}</Text>
            )}
            <Text style={styles.metaText}>
              {order.shippingAddress.city}, {order.shippingAddress.state} -{" "}
              {order.shippingAddress.pincode}
            </Text>
            <Text style={styles.metaText}>
              Phone: {order.shippingAddress.phone} | Email: {order.shippingAddress.email}
            </Text>
          </View>
        </View>

        {/* Itemized Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, styles.colNo]}>#</Text>
            <Text style={[styles.tableHeaderCell, styles.colItem]}>Description</Text>
            <Text style={[styles.tableHeaderCell, styles.colVariant]}>Variant</Text>
            <Text style={[styles.tableHeaderCell, styles.colQty]}>Qty</Text>
            <Text style={[styles.tableHeaderCell, styles.colRate]}>Rate (INR)</Text>
            <Text style={[styles.tableHeaderCell, styles.colAmount]}>Amount (INR)</Text>
          </View>

          {order.items.map((item, idx) => (
            <View key={item.id || idx} style={styles.tableRow}>
              <Text style={[styles.tableCell, styles.colNo]}>{idx + 1}</Text>
              <Text style={[styles.tableCell, styles.colItem]}>
                {item.productName}
                {item.sku ? ` (${item.sku})` : ""}
              </Text>
              <Text style={[styles.tableCell, styles.colVariant]}>
                {item.size || "Standard"} {item.color ? `• ${item.color}` : ""}
              </Text>
              <Text style={[styles.tableCell, styles.colQty]}>{item.quantity}</Text>
              <Text style={[styles.tableCell, styles.colRate]}>
                ₹{item.unitPrice.toFixed(2)}
              </Text>
              <Text style={[styles.tableCell, styles.colAmount]}>
                ₹{(item.unitPrice * item.quantity).toFixed(2)}
              </Text>
            </View>
          ))}
        </View>

        {/* Pricing Summary */}
        <View style={styles.summaryRow}>
          <View style={styles.summaryBlock}>
            <View style={styles.summaryLine}>
              <Text style={styles.summaryLabel}>Subtotal:</Text>
              <Text style={styles.summaryVal}>₹{order.subtotal.toFixed(2)}</Text>
            </View>

            {Boolean(order.discountAmount && order.discountAmount > 0) && (
              <View style={styles.summaryLine}>
                <Text style={styles.summaryLabel}>
                  Discount {order.couponCode ? `(${order.couponCode})` : ""}:
                </Text>
                <Text style={styles.summaryVal}>
                  -₹{(order.discountAmount ?? 0).toFixed(2)}
                </Text>
              </View>
            )}

            <View style={styles.summaryLine}>
              <Text style={styles.summaryLabel}>Shipping Charges:</Text>
              <Text style={styles.summaryVal}>
                {(order.shippingCharge ?? (order as any).shippingFee ?? 0) === 0
                  ? "FREE"
                  : `₹${(order.shippingCharge ?? (order as any).shippingFee ?? 0).toFixed(2)}`}
              </Text>
            </View>

            <View style={styles.summaryLineBold}>
              <Text style={styles.totalLabel}>Total Payable:</Text>
              <Text style={styles.totalVal}>₹{(order.totalAmount ?? 0).toFixed(2)}</Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerNote}>
            Thank you for shopping with VELAASH TRADER&apos;S.
          </Text>
          <Text style={styles.footerNote}>
            Computer-generated document. No signature required.
          </Text>
        </View>
      </Page>
    </Document>
  );
};

/**
 * Server-side helper to render invoice document directly to a Node buffer.
 */
export async function generateInvoicePdfBuffer(
  order: AdminOrderDetail,
  gstEnabled = false,
  gstin?: string | null,
  storeProfile?: {
    name?: string;
    legal_name?: string;
    email?: string;
    phone?: string;
  } | null
): Promise<Buffer> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const doc = React.createElement(InvoiceDocument, { order, gstEnabled, gstin, storeProfile } as any);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return await renderToBuffer(doc as any);
}
