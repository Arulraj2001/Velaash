/**
 * Admin Notification Email Template for New Orders
 * 
 * Established Velaash Brand Tokens:
 * - Primary Gold: #F2A900
 * - Deep Accent: #CC6F00
 * - Dark Brand Brown: #4D2A00
 * - Light Gold Background: #F9E6A8
 * - Cream Base: #FFFBF0
 */

import * as React from "react";
import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";

export interface AdminNewOrderEmailItem {
  title: string;
  size?: string;
  color?: string;
  quantity: number;
  unitPrice: number;
  lineSubtotal: number;
}

export interface AdminNewOrderEmailProps {
  orderNumber: string;
  orderDate: string;
  paymentMethod: "cod" | "razorpay";
  paymentStatus: "paid" | "pending";
  items: AdminNewOrderEmailItem[];
  subtotal: number;
  discountAmount?: number;
  couponCode?: string | null;
  shippingCharge: number;
  codHandlingFee?: number;
  totalAmount: number;
  customer: {
    fullName: string;
    email: string;
    phone: string;
  };
  shippingAddress: {
    fullName: string;
    phone: string;
    addressLine1: string;
    addressLine2?: string | null;
    city: string;
    state: string;
    pincode: string;
  };
  adminOrderUrl: string;
}

export const AdminNewOrderEmail = ({
  orderNumber,
  orderDate,
  paymentMethod,
  paymentStatus,
  items,
  subtotal,
  discountAmount = 0,
  couponCode,
  shippingCharge,
  codHandlingFee = 0,
  totalAmount,
  customer,
  shippingAddress,
  adminOrderUrl,
}: AdminNewOrderEmailProps) => {
  const isPaid = paymentStatus === "paid";
  const paymentMethodLabel =
    paymentMethod === "cod" ? "Cash on Delivery" : "Online Payment (Razorpay)";
  const paymentStatusBadgeColor = isPaid ? "#166534" : "#9A3412";
  const paymentStatusBadgeBg = isPaid ? "#DCFCE7" : "#FFEDD5";
  const paymentStatusText = isPaid ? "Payment Verified (Paid)" : "Payment Pending (Collect on Delivery)";

  return (
    <Html>
      <Head />
      <Preview>
        New Order #{orderNumber} - ₹{totalAmount.toLocaleString("en-IN")} from {customer.fullName}
      </Preview>
      <Body style={mainStyle}>
        <Container style={containerStyle}>
          {/* Header */}
          <Section style={headerSectionStyle}>
            <Text style={brandLogoStyle}>VELAASH</Text>
            <Text style={brandSubtitleStyle}>ADMIN NOTIFICATION • NEW ORDER</Text>
          </Section>

          <Section style={contentSectionStyle}>
            {/* Headline */}
            <Heading style={headingStyle}>
              🎉 New Customer Order Received!
            </Heading>
            <Text style={textStyle}>
              Order <strong style={{ color: "#4D2A00" }}>#{orderNumber}</strong> was placed on{" "}
              {orderDate} by <strong style={{ color: "#4D2A00" }}>{customer.fullName}</strong>.
            </Text>

            {/* Quick Summary Pill */}
            <Section style={summaryBoxStyle}>
              <Section style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <Text style={summaryLabelStyle}>ORDER TOTAL</Text>
                  <Text style={summaryTotalStyle}>₹{totalAmount.toLocaleString("en-IN")}</Text>
                </div>
                <div style={{ textAlign: "right" }}>
                  <span
                    style={{
                      ...badgeStyle,
                      backgroundColor: paymentStatusBadgeBg,
                      color: paymentStatusBadgeColor,
                    }}
                  >
                    {paymentMethodLabel}
                  </span>
                  <div style={{ marginTop: "4px" }}>
                    <span style={{ fontSize: "11px", color: paymentStatusBadgeColor, fontWeight: 600 }}>
                      {paymentStatusText}
                    </span>
                  </div>
                </div>
              </Section>
            </Section>

            {/* Action CTA Button */}
            <Section style={ctaSectionStyle}>
              <Link href={adminOrderUrl} style={buttonStyle}>
                Open Order #{orderNumber} in Admin Portal →
              </Link>
            </Section>

            <Hr style={dividerStyle} />

            {/* Customer & Shipping Details */}
            <Text style={subheadingStyle}>Customer & Delivery Details</Text>
            <Section style={infoCardStyle}>
              <Text style={infoLineStyle}>
                <strong>Customer Name:</strong> {customer.fullName}
              </Text>
              <Text style={infoLineStyle}>
                <strong>Email Address:</strong>{" "}
                <Link href={`mailto:${customer.email}`} style={{ color: "#CC6F00" }}>
                  {customer.email}
                </Link>
              </Text>
              <Text style={infoLineStyle}>
                <strong>Phone Number:</strong>{" "}
                <Link href={`tel:${customer.phone}`} style={{ color: "#CC6F00" }}>
                  {customer.phone}
                </Link>
              </Text>
              <Hr style={innerDividerStyle} />
              <Text style={infoLineStyle}>
                <strong>Shipping Address:</strong>
                <br />
                {shippingAddress.fullName}
                <br />
                {shippingAddress.addressLine1}
                {shippingAddress.addressLine2 ? `, ${shippingAddress.addressLine2}` : ""}
                <br />
                {shippingAddress.city}, {shippingAddress.state} - {shippingAddress.pincode}
                <br />
                Phone: {shippingAddress.phone}
              </Text>
            </Section>

            <Hr style={dividerStyle} />

            {/* Ordered Items */}
            <Text style={subheadingStyle}>Ordered Items ({items.length})</Text>
            {items.map((item, idx) => (
              <Section key={idx} style={itemRowStyle}>
                <Section style={{ display: "flex", justifyContent: "space-between" }}>
                  <Text style={itemTitleStyle}>
                    {item.title}{" "}
                    <span style={{ fontWeight: 400, color: "#666666" }}>
                      × {item.quantity}
                    </span>
                  </Text>
                  <Text style={itemPriceStyle}>
                    ₹{item.lineSubtotal.toLocaleString("en-IN")}
                  </Text>
                </Section>
                {(item.size || item.color) && (
                  <Text style={itemMetaStyle}>
                    {[
                      item.size ? `Size: ${item.size}` : null,
                      item.color ? `Color: ${item.color}` : null,
                      `Unit: ₹${item.unitPrice.toLocaleString("en-IN")}`,
                    ]
                      .filter(Boolean)
                      .join(" • ")}
                  </Text>
                )}
              </Section>
            ))}

            <Hr style={dividerStyle} />

            {/* Price Breakdown */}
            <Section style={pricingSectionStyle}>
              <Section style={pricingRowStyle}>
                <Text style={pricingLabelStyle}>Items Subtotal</Text>
                <Text style={pricingValueStyle}>₹{subtotal.toLocaleString("en-IN")}</Text>
              </Section>

              {discountAmount > 0 && (
                <Section style={pricingRowStyle}>
                  <Text style={pricingLabelStyle}>
                    Discount Applied {couponCode ? `(${couponCode})` : ""}
                  </Text>
                  <Text style={{ ...pricingValueStyle, color: "#166534" }}>
                    -₹{discountAmount.toLocaleString("en-IN")}
                  </Text>
                </Section>
              )}

              <Section style={pricingRowStyle}>
                <Text style={pricingLabelStyle}>Shipping Charge</Text>
                <Text style={pricingValueStyle}>
                  {shippingCharge === 0 ? "FREE" : `₹${shippingCharge.toLocaleString("en-IN")}`}
                </Text>
              </Section>

              {codHandlingFee > 0 && (
                <Section style={pricingRowStyle}>
                  <Text style={pricingLabelStyle}>COD Convenience Fee</Text>
                  <Text style={pricingValueStyle}>₹{codHandlingFee.toLocaleString("en-IN")}</Text>
                </Section>
              )}

              <Hr style={innerDividerStyle} />

              <Section style={pricingRowStyle}>
                <Text style={totalLabelStyle}>Total Amount</Text>
                <Text style={totalValueStyle}>₹{totalAmount.toLocaleString("en-IN")}</Text>
              </Section>
            </Section>
          </Section>

          {/* Footer */}
          <Section style={footerSectionStyle}>
            <Text style={footerTextStyle}>
              This is an automated notification from your Velaash E-Commerce Platform.
            </Text>
            <Text style={legalTextStyle}>VELAASH TRADER&apos;S • STORE ENGINE</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default AdminNewOrderEmail;

// Inline Email Styles
const mainStyle: React.CSSProperties = {
  backgroundColor: "#FFFBF0",
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
  padding: "24px 0",
};

const containerStyle: React.CSSProperties = {
  backgroundColor: "#FFFFFF",
  margin: "0 auto",
  maxWidth: "600px",
  borderRadius: "8px",
  overflow: "hidden",
  border: "1px solid #E8DCC2",
};

const headerSectionStyle: React.CSSProperties = {
  backgroundColor: "#4D2A00",
  padding: "24px",
  textAlign: "center",
};

const brandLogoStyle: React.CSSProperties = {
  color: "#FFFBF0",
  fontFamily: "'Cormorant Garamond', Georgia, serif",
  fontSize: "24px",
  fontWeight: "700",
  letterSpacing: "4px",
  margin: 0,
};

const brandSubtitleStyle: React.CSSProperties = {
  color: "#F2A900",
  fontSize: "11px",
  fontWeight: "600",
  letterSpacing: "2px",
  margin: "6px 0 0 0",
};

const contentSectionStyle: React.CSSProperties = {
  padding: "28px 32px",
};

const headingStyle: React.CSSProperties = {
  color: "#4D2A00",
  fontFamily: "'Cormorant Garamond', Georgia, serif",
  fontSize: "22px",
  fontWeight: "600",
  margin: "0 0 8px 0",
};

const textStyle: React.CSSProperties = {
  color: "#555555",
  fontSize: "14px",
  lineHeight: "22px",
  margin: "0 0 16px 0",
};

const summaryBoxStyle: React.CSSProperties = {
  backgroundColor: "#FFFBF0",
  borderRadius: "8px",
  padding: "16px 20px",
  border: "1px solid #F9E6A8",
  margin: "16px 0 20px 0",
};

const summaryLabelStyle: React.CSSProperties = {
  fontSize: "11px",
  fontWeight: "700",
  letterSpacing: "1px",
  color: "#78350F",
  margin: "0 0 2px 0",
};

const summaryTotalStyle: React.CSSProperties = {
  fontSize: "22px",
  fontWeight: "700",
  color: "#4D2A00",
  margin: 0,
};

const badgeStyle: React.CSSProperties = {
  display: "inline-block",
  padding: "4px 10px",
  borderRadius: "9999px",
  fontSize: "11px",
  fontWeight: "700",
  letterSpacing: "0.5px",
};

const ctaSectionStyle: React.CSSProperties = {
  textAlign: "center",
  margin: "20px 0 24px 0",
};

const buttonStyle: React.CSSProperties = {
  backgroundColor: "#4D2A00",
  color: "#FFFFFF",
  padding: "12px 28px",
  fontSize: "13px",
  fontWeight: "600",
  textDecoration: "none",
  borderRadius: "6px",
  display: "inline-block",
  letterSpacing: "0.5px",
};

const dividerStyle: React.CSSProperties = {
  borderColor: "#E8DCC2",
  margin: "20px 0",
};

const innerDividerStyle: React.CSSProperties = {
  borderColor: "#F3E8D0",
  margin: "12px 0",
};

const subheadingStyle: React.CSSProperties = {
  color: "#4D2A00",
  fontFamily: "'Cormorant Garamond', Georgia, serif",
  fontSize: "16px",
  fontWeight: "600",
  margin: "0 0 10px 0",
};

const infoCardStyle: React.CSSProperties = {
  backgroundColor: "#FAFAFA",
  borderRadius: "6px",
  padding: "14px 16px",
  border: "1px solid #EEEEEE",
};

const infoLineStyle: React.CSSProperties = {
  fontSize: "13px",
  color: "#444444",
  lineHeight: "20px",
  margin: "4px 0",
};

const itemRowStyle: React.CSSProperties = {
  padding: "8px 0",
  borderBottom: "1px dashed #F0EAE1",
};

const itemTitleStyle: React.CSSProperties = {
  fontSize: "13px",
  fontWeight: "600",
  color: "#4D2A00",
  margin: 0,
};

const itemMetaStyle: React.CSSProperties = {
  fontSize: "12px",
  color: "#777777",
  margin: "2px 0 0 0",
};

const itemPriceStyle: React.CSSProperties = {
  fontSize: "13px",
  fontWeight: "600",
  color: "#CC6F00",
  margin: 0,
  textAlign: "right",
};

const pricingSectionStyle: React.CSSProperties = {
  margin: "12px 0",
};

const pricingRowStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  margin: "4px 0",
};

const pricingLabelStyle: React.CSSProperties = {
  fontSize: "13px",
  color: "#666666",
  margin: 0,
};

const pricingValueStyle: React.CSSProperties = {
  fontSize: "13px",
  fontWeight: "500",
  color: "#4D2A00",
  margin: 0,
  textAlign: "right",
};

const totalLabelStyle: React.CSSProperties = {
  fontSize: "15px",
  fontWeight: "700",
  color: "#4D2A00",
  margin: 0,
};

const totalValueStyle: React.CSSProperties = {
  fontSize: "18px",
  fontWeight: "700",
  color: "#CC6F00",
  margin: 0,
  textAlign: "right",
};

const footerSectionStyle: React.CSSProperties = {
  backgroundColor: "#FFFBF0",
  padding: "16px 24px",
  textAlign: "center",
  borderTop: "1px solid #E8DCC2",
};

const footerTextStyle: React.CSSProperties = {
  fontSize: "11px",
  color: "#777777",
  margin: "0 0 4px 0",
};

const legalTextStyle: React.CSSProperties = {
  fontSize: "10px",
  color: "#999999",
  margin: 0,
  letterSpacing: "1px",
};
