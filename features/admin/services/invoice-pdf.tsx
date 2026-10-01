import React from "react";
import fs from "fs";
import path from "path";
import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
  renderToBuffer,
  Font,
} from "@react-pdf/renderer";
import type { AdminOrderDetail } from "../types/orders";
import { BRAND } from "@/lib/constants";

// Register hyphenation callback to prevent runtime issues with dynamic hyphenation files
Font.registerHyphenationCallback((word) => [word]);

/**
 * Converts a numerical INR amount into formal Indian English words.
 * Handles Crores, Lakhs, Thousands, Hundreds, and Paise.
 */
function numberToIndianWords(num: number): string {
  if (!num || isNaN(num) || num <= 0) return "Zero Rupees Only";
  const ones = [
    "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
    "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
    "Seventeen", "Eighteen", "Nineteen",
  ];
  const tens = [
    "", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety",
  ];

  function convertTwoDigits(n: number): string {
    if (n < 20) return ones[n];
    return tens[Math.floor(n / 10)] + (n % 10 ? " " + ones[n % 10] : "");
  }

  function convertThreeDigits(n: number): string {
    let str = "";
    if (Math.floor(n / 100) > 0) {
      str += ones[Math.floor(n / 100)] + " Hundred";
      if (n % 100) str += " and ";
    }
    str += convertTwoDigits(n % 100);
    return str.trim();
  }

  const intPart = Math.floor(num);
  const decimalPart = Math.round((num - intPart) * 100);

  let result = "";
  let remaining = intPart;

  const crore = Math.floor(remaining / 10000000);
  remaining %= 10000000;
  const lakh = Math.floor(remaining / 100000);
  remaining %= 100000;
  const thousand = Math.floor(remaining / 1000);
  remaining %= 1000;
  const hundred = remaining;

  if (crore > 0) result += convertThreeDigits(crore) + " Crore ";
  if (lakh > 0) result += convertThreeDigits(lakh) + " Lakh ";
  if (thousand > 0) result += convertThreeDigits(thousand) + " Thousand ";
  if (hundred > 0) result += convertThreeDigits(hundred) + " ";

  result = result.trim() + " Rupees";
  if (decimalPart > 0) {
    result += " and " + convertTwoDigits(decimalPart) + " Paise";
  }
  return result + " Only";
}

const styles = StyleSheet.create({
  page: {
    paddingTop: 32,
    paddingBottom: 48,
    paddingHorizontal: 32,
    fontSize: 8.5,
    fontFamily: "Helvetica",
    color: "#27272a",
    backgroundColor: "#ffffff",
    lineHeight: 1.35,
  },

  /* --- HEADER BLOCK --- */
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    borderBottomWidth: 1.5,
    borderBottomColor: "#e4e4e7",
    paddingBottom: 14,
    marginBottom: 14,
  },
  brandBlock: {
    flexDirection: "row",
    alignItems: "center",
    maxWidth: 320,
  },
  brandLogo: {
    width: 52,
    height: 52,
    borderRadius: 6,
    marginRight: 10,
    borderWidth: 1,
    borderColor: "#e8dcc2",
  },
  brandInfo: {
    flexDirection: "column",
  },
  brandName: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    color: "#4d2a00",
    letterSpacing: 1.2,
  },
  brandTagline: {
    fontSize: 7.5,
    fontFamily: "Helvetica",
    color: "#7a5233",
    marginTop: 1,
  },
  brandWebsite: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: "#cc6f00",
    marginTop: 1.5,
  },
  legalEntity: {
    fontSize: 7.5,
    color: "#52525b",
    marginTop: 1.5,
  },
  brandContact: {
    fontSize: 7,
    color: "#71717a",
    marginTop: 1,
  },

  /* Header Right: Compliance & Title */
  headerRight: {
    alignItems: "flex-end",
    maxWidth: 200,
  },
  docTypeBadge: {
    backgroundColor: "#18181b",
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 3,
    marginBottom: 3,
  },
  docTypeBadgeText: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: "#ffffff",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  docSubtitle: {
    fontSize: 7,
    color: "#71717a",
    textAlign: "right",
    marginTop: 1,
  },
  gstinBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#faf8f5",
    borderWidth: 1,
    borderColor: "#e8dcc2",
    borderRadius: 3,
    paddingVertical: 2,
    paddingHorizontal: 6,
    marginTop: 5,
  },
  gstinLabel: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: "#7a5233",
    marginRight: 4,
  },
  gstinValue: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: "#18181b",
  },
  placeOfSupply: {
    fontSize: 7,
    color: "#71717a",
    marginTop: 3,
    textAlign: "right",
  },

  /* --- METADATA CARDS (ORDER & CUSTOMER) --- */
  metaCardsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  metaCard: {
    width: "48.5%",
    backgroundColor: "#fafaf9",
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#e4e4e7",
    overflow: "hidden",
  },
  metaCardHeader: {
    backgroundColor: "#f4f4f5",
    paddingVertical: 4.5,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#e4e4e7",
  },
  metaCardTitle: {
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    color: "#3f3f46",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  metaCardBody: {
    padding: 8,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 3,
  },
  metaKey: {
    width: 72,
    fontSize: 7.5,
    color: "#71717a",
    fontFamily: "Helvetica",
  },
  metaVal: {
    flex: 1,
    fontSize: 7.8,
    color: "#18181b",
    fontFamily: "Helvetica",
  },
  metaValBold: {
    flex: 1,
    fontSize: 8,
    color: "#18181b",
    fontFamily: "Helvetica-Bold",
  },
  statusBadgePaid: {
    flex: 1,
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    color: "#15803d",
  },
  statusBadgePending: {
    flex: 1,
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    color: "#b45309",
  },
  customerName: {
    fontSize: 8.5,
    fontFamily: "Helvetica-Bold",
    color: "#18181b",
    marginBottom: 2,
  },
  customerAddress: {
    fontSize: 7.8,
    color: "#3f3f46",
    lineHeight: 1.3,
  },
  cardDivider: {
    borderTopWidth: 1,
    borderTopColor: "#e4e4e7",
    marginVertical: 4,
  },

  /* --- TABLE STYLING --- */
  tableContainer: {
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e4e4e7",
    borderRadius: 4,
    overflow: "hidden",
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#18181b",
    borderBottomWidth: 2,
    borderBottomColor: "#f2a900",
    paddingVertical: 5,
    paddingHorizontal: 8,
    alignItems: "center",
  },
  tableHeaderCell: {
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    color: "#ffffff",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#f4f4f5",
    paddingVertical: 5.5,
    paddingHorizontal: 8,
    alignItems: "flex-start",
  },
  tableRowAlt: {
    backgroundColor: "#fafaf9",
  },
  tableCell: {
    fontSize: 8,
    color: "#27272a",
  },
  itemTitle: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: "#18181b",
  },
  itemSku: {
    fontSize: 6.8,
    color: "#71717a",
    marginTop: 1,
  },

  /* Exact Proportional Columns (Total = 100%) */
  colNo: { width: "5%" },
  colItem: { width: "44%" },
  colVariant: { width: "15%" },
  colQty: { width: "8%" },
  colRate: { width: "14%" },
  colAmount: { width: "14%" },

  /* Alignment Helpers */
  alignLeft: { textAlign: "left" },
  alignCenter: { textAlign: "center" },
  alignRight: { textAlign: "right" },

  /* --- BOTTOM DUAL-COLUMN SECTION --- */
  bottomSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  notesCol: {
    width: "53%",
    paddingRight: 8,
  },
  notesHeading: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: "#71717a",
    textTransform: "uppercase",
    letterSpacing: 0.4,
    marginBottom: 2,
  },
  amountInWords: {
    fontSize: 7.8,
    fontFamily: "Helvetica-Bold",
    color: "#4d2a00",
    lineHeight: 1.3,
    marginBottom: 6,
  },
  statutoryBox: {
    backgroundColor: "#faf8f5",
    borderWidth: 1,
    borderColor: "#e8dcc2",
    borderRadius: 3,
    padding: 6,
  },
  statutoryTitle: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: "#7a5233",
    marginBottom: 2,
  },
  statutoryItem: {
    fontSize: 6.8,
    color: "#52525b",
    lineHeight: 1.25,
    marginTop: 1,
  },

  /* Right Summary Block */
  summaryCol: {
    width: "45%",
    backgroundColor: "#fafaf9",
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#e4e4e7",
    padding: 8,
  },
  summaryLine: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 2,
  },
  summaryLabel: {
    fontSize: 7.8,
    color: "#71717a",
  },
  summaryVal: {
    fontSize: 8,
    color: "#18181b",
    fontFamily: "Helvetica-Bold",
  },
  discountLabel: {
    fontSize: 7.8,
    color: "#b45309",
  },
  discountVal: {
    fontSize: 8,
    color: "#b45309",
    fontFamily: "Helvetica-Bold",
  },
  totalDivider: {
    borderTopWidth: 1.5,
    borderTopColor: "#18181b",
    marginTop: 4,
    paddingTop: 4,
  },
  grandTotalLabel: {
    fontSize: 9.5,
    fontFamily: "Helvetica-Bold",
    color: "#18181b",
  },
  grandTotalVal: {
    fontSize: 10.5,
    fontFamily: "Helvetica-Bold",
    color: "#4d2a00",
  },

  /* --- FOOTER --- */
  footer: {
    position: "absolute",
    bottom: 20,
    left: 32,
    right: 32,
    borderTopWidth: 1,
    borderTopColor: "#e4e4e7",
    paddingTop: 6,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  footerText: {
    fontSize: 6.8,
    color: "#71717a",
  },
  footerBrand: {
    fontSize: 6.8,
    fontFamily: "Helvetica-Bold",
    color: "#4d2a00",
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
    logo_url?: string;
  } | null;
  logoDataUri?: string | null;
}

export const InvoiceDocument: React.FC<InvoicePdfProps> = ({
  order,
  gstEnabled = false,
  gstin = null,
  storeProfile = null,
  logoDataUri = null,
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

  const totalAmount = Number(order.totalAmount || 0);
  const subtotal = Number(order.subtotal || 0);
  const discountAmount = Number(order.discountAmount || 0);
  const shippingFee = Number(order.shippingCharge ?? (order as any).shippingFee ?? 0);

  const destinationState = order.shippingAddress?.state || "Tamil Nadu";

  return (
    <Document title={`Invoice-${order.orderNumber}`}>
      <Page size="A4" style={styles.page}>
        {/* ========================================================
            1. HEADER BLOCK: Brand Logo, Identity & Compliance Badge
           ======================================================== */}
        <View style={styles.headerRow}>
          {/* Brand Identity & Logo */}
          <View style={styles.brandBlock}>
            {logoDataUri ? (
              <Image src={logoDataUri} style={styles.brandLogo} />
            ) : null}
            <View style={styles.brandInfo}>
              <Text style={styles.brandName}>{brandDisplayName.toUpperCase()}</Text>
              <Text style={styles.brandTagline}>Contemporary Everyday Luxury</Text>
              <Text style={styles.brandWebsite}>www.velaash.in</Text>
              <Text style={styles.legalEntity}>M/S {legalEntityName}</Text>
              <Text style={styles.brandContact}>
                Tamil Nadu, India • Care: {supportPhone}
              </Text>
              <Text style={styles.brandContact}>Email: {supportEmail}</Text>
            </View>
          </View>

          {/* Compliance & Document Title Badge */}
          <View style={styles.headerRight}>
            <View style={styles.docTypeBadge}>
              <Text style={styles.docTypeBadgeText}>
                {isGstActive ? "TAX INVOICE" : "BILL OF SUPPLY"}
              </Text>
            </View>
            <Text style={styles.docSubtitle}>
              {isGstActive
                ? "Original for Recipient"
                : "Not Liable to Pay Tax under GST (Composition)"}
            </Text>

            {isGstActive && gstin ? (
              <View style={styles.gstinBox}>
                <Text style={styles.gstinLabel}>GSTIN:</Text>
                <Text style={styles.gstinValue}>{gstin}</Text>
              </View>
            ) : null}

            <Text style={styles.placeOfSupply}>
              Place of Supply: {destinationState}
            </Text>
          </View>
        </View>

        {/* ========================================================
            2. STRUCTURED METADATA CARDS: Order Info & Billed To
           ======================================================== */}
        <View style={styles.metaCardsRow}>
          {/* Card A: Invoice & Order Details */}
          <View style={styles.metaCard}>
            <View style={styles.metaCardHeader}>
              <Text style={styles.metaCardTitle}>Invoice &amp; Order Details</Text>
            </View>
            <View style={styles.metaCardBody}>
              <View style={styles.metaRow}>
                <Text style={styles.metaKey}>Invoice No:</Text>
                <Text style={styles.metaValBold}>INV-{order.orderNumber}</Text>
              </View>
              <View style={styles.metaRow}>
                <Text style={styles.metaKey}>Order Date:</Text>
                <Text style={styles.metaVal}>{formattedDate}</Text>
              </View>
              <View style={styles.metaRow}>
                <Text style={styles.metaKey}>Order ID:</Text>
                <Text style={styles.metaValBold}>#{order.orderNumber}</Text>
              </View>
              <View style={styles.metaRow}>
                <Text style={styles.metaKey}>Payment Mode:</Text>
                <Text style={styles.metaVal}>
                  {order.paymentMethod === "cod"
                    ? "Cash on Delivery (COD)"
                    : "Online Prepaid (Razorpay)"}
                </Text>
              </View>
              <View style={styles.metaRow}>
                <Text style={styles.metaKey}>Payment Status:</Text>
                <Text
                  style={
                    order.paymentStatus === "paid"
                      ? styles.statusBadgePaid
                      : styles.statusBadgePending
                  }
                >
                  {order.paymentStatus.toUpperCase()}
                </Text>
              </View>
              {order.razorpayPaymentId ? (
                <View style={styles.metaRow}>
                  <Text style={styles.metaKey}>Transaction ID:</Text>
                  <Text style={styles.metaVal}>{order.razorpayPaymentId}</Text>
                </View>
              ) : null}
              {order.trackingNumber ? (
                <View style={styles.metaRow}>
                  <Text style={styles.metaKey}>Courier / AWB:</Text>
                  <Text style={styles.metaValBold}>
                    {order.courierName ? `${order.courierName} • ` : ""}
                    {order.trackingNumber}
                  </Text>
                </View>
              ) : null}
            </View>
          </View>

          {/* Card B: Customer Billed & Shipped To */}
          <View style={styles.metaCard}>
            <View style={styles.metaCardHeader}>
              <Text style={styles.metaCardTitle}>Billed &amp; Shipped To</Text>
            </View>
            <View style={styles.metaCardBody}>
              <Text style={styles.customerName}>
                {order.shippingAddress?.fullName || "Valued Customer"}
              </Text>
              <Text style={styles.customerAddress}>
                {order.shippingAddress?.addressLine1 || ""}
              </Text>
              {order.shippingAddress?.addressLine2 ? (
                <Text style={styles.customerAddress}>
                  {order.shippingAddress.addressLine2}
                </Text>
              ) : null}
              <Text style={styles.customerAddress}>
                {[order.shippingAddress?.city, order.shippingAddress?.state]
                  .filter(Boolean)
                  .join(", ")}
                {order.shippingAddress?.pincode
                  ? ` - ${order.shippingAddress.pincode}`
                  : ""}
              </Text>

              <View style={styles.cardDivider} />

              <View style={styles.metaRow}>
                <Text style={styles.metaKey}>Phone:</Text>
                <Text style={styles.metaVal}>
                  {order.shippingAddress?.phone || "—"}
                </Text>
              </View>
              <View style={styles.metaRow}>
                <Text style={styles.metaKey}>Email:</Text>
                <Text style={styles.metaVal}>
                  {order.shippingAddress?.email || "—"}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* ========================================================
            3. ITEMIZED PRODUCTS TABLE: Rebalanced & Aligned
           ======================================================== */}
        <View style={styles.tableContainer}>
          {/* Header Row */}
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, styles.colNo, styles.alignCenter]}>
              #
            </Text>
            <Text style={[styles.tableHeaderCell, styles.colItem, styles.alignLeft]}>
              Item Description &amp; SKU
            </Text>
            <Text style={[styles.tableHeaderCell, styles.colVariant, styles.alignLeft]}>
              Size / Color
            </Text>
            <Text style={[styles.tableHeaderCell, styles.colQty, styles.alignCenter]}>
              Qty
            </Text>
            <Text style={[styles.tableHeaderCell, styles.colRate, styles.alignRight]}>
              Unit Rate (Rs.)
            </Text>
            <Text style={[styles.tableHeaderCell, styles.colAmount, styles.alignRight]}>
              Amount (Rs.)
            </Text>
          </View>

          {/* Item Rows */}
          {order.items.map((item, idx) => {
            const uPrice = Number(item.unitPrice || 0);
            const qty = Number(item.quantity || 1);
            const lineAmt = Number(item.subtotal || uPrice * qty);
            const isAlt = idx % 2 === 1;

            return (
              <View
                key={item.id || idx}
                style={[styles.tableRow, isAlt ? styles.tableRowAlt : {}]}
              >
                <Text style={[styles.tableCell, styles.colNo, styles.alignCenter]}>
                  {idx + 1}
                </Text>
                <View style={[styles.colItem, styles.alignLeft]}>
                  <Text style={styles.itemTitle}>{item.productName}</Text>
                  {item.sku ? (
                    <Text style={styles.itemSku}>SKU: {item.sku}</Text>
                  ) : null}
                </View>
                <Text style={[styles.tableCell, styles.colVariant, styles.alignLeft]}>
                  {item.size || "Standard"}
                  {item.color ? ` • ${item.color}` : ""}
                </Text>
                <Text style={[styles.tableCell, styles.colQty, styles.alignCenter]}>
                  {qty}
                </Text>
                <Text style={[styles.tableCell, styles.colRate, styles.alignRight]}>
                  Rs. {uPrice.toFixed(2)}
                </Text>
                <Text style={[styles.tableCell, styles.colAmount, styles.alignRight]}>
                  Rs. {lineAmt.toFixed(2)}
                </Text>
              </View>
            );
          })}
        </View>

        {/* ========================================================
            4. BOTTOM SUMMARY: Amount in Words & Totals Breakdown
           ======================================================== */}
        <View style={styles.bottomSection}>
          {/* Left Column: Amount in Words & Statutory Notes */}
          <View style={styles.notesCol}>
            <Text style={styles.notesHeading}>Amount in Words:</Text>
            <Text style={styles.amountInWords}>
              {numberToIndianWords(totalAmount)}
            </Text>

            <View style={styles.statutoryBox}>
              <Text style={styles.statutoryTitle}>Statutory Declaration &amp; Notes:</Text>
              <Text style={styles.statutoryItem}>
                {isGstActive
                  ? "• All product rates are inclusive of applicable GST (CGST/SGST/IGST)."
                  : "• Bill of Supply issued under GST composition / non-liable provisions."}
              </Text>
              <Text style={styles.statutoryItem}>
                • Returns &amp; exchanges accepted within 7 days in original condition with tags intact.
              </Text>
              <Text style={styles.statutoryItem}>
                • For support, visit www.velaash.in/shipping-returns or call {supportPhone}.
              </Text>
            </View>
          </View>

          {/* Right Column: Pricing Summary Card */}
          <View style={styles.summaryCol}>
            <View style={styles.summaryLine}>
              <Text style={styles.summaryLabel}>
                Subtotal ({order.items.length} {order.items.length === 1 ? "item" : "items"}):
              </Text>
              <Text style={styles.summaryVal}>Rs. {subtotal.toFixed(2)}</Text>
            </View>

            {discountAmount > 0 ? (
              <View style={styles.summaryLine}>
                <Text style={styles.discountLabel}>
                  Discount {order.couponCode ? `(${order.couponCode})` : ""}:
                </Text>
                <Text style={styles.discountVal}>-Rs. {discountAmount.toFixed(2)}</Text>
              </View>
            ) : null}

            <View style={styles.summaryLine}>
              <Text style={styles.summaryLabel}>Shipping Charges:</Text>
              <Text style={styles.summaryVal}>
                {shippingFee === 0 ? "FREE" : `Rs. ${shippingFee.toFixed(2)}`}
              </Text>
            </View>

            <View style={[styles.summaryLine, styles.totalDivider]}>
              <Text style={styles.grandTotalLabel}>Grand Total:</Text>
              <Text style={styles.grandTotalVal}>Rs. {totalAmount.toFixed(2)}</Text>
            </View>
          </View>
        </View>

        {/* ========================================================
            5. FOOTER: Branding, Disclaimer & Page Info
           ======================================================== */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>
            <Text style={styles.footerBrand}>{brandDisplayName.toUpperCase()}</Text>
            {"  •  "}www.velaash.in{"  •  "}care@velaash.in{"  •  "}
            Ph: {supportPhone}
          </Text>
          <Text style={styles.footerText}>
            Computer-Generated Document • No Signature Required
          </Text>
        </View>
      </Page>
    </Document>
  );
};

// In-memory cache for the brand logo data URI so disk reads happen only once
let cachedLogoDataUri: string | null | undefined = undefined;

function getLogoDataUri(): string | null {
  if (cachedLogoDataUri !== undefined) {
    return cachedLogoDataUri;
  }
  try {
    const logoPath = path.join(process.cwd(), "public", "logo.png");
    if (fs.existsSync(logoPath)) {
      const buf = fs.readFileSync(logoPath);
      cachedLogoDataUri = `data:image/png;base64,${buf.toString("base64")}`;
      return cachedLogoDataUri;
    }
  } catch (err) {
    console.warn("Notice: could not load logo from public/logo.png for invoice:", err);
  }
  cachedLogoDataUri = null;
  return null;
}

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
    logo_url?: string;
  } | null,
  logoDataUriOverride?: string | null
): Promise<Buffer> {
  const logoDataUri = logoDataUriOverride ?? getLogoDataUri();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const doc = React.createElement(InvoiceDocument, {
    order,
    gstEnabled,
    gstin,
    storeProfile,
    logoDataUri,
  } as any);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return await renderToBuffer(doc as any);
}

