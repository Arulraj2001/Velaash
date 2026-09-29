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

export interface OrderConfirmationEmailItem {
  title: string;
  size: string;
  color: string;
  quantity: number;
  unitPrice: number;
  lineSubtotal: number;
  imageUrl?: string;
}

export interface OrderConfirmationEmailProps {
  orderNumber: string;
  customerName: string;
  orderDate: string;
  paymentMethod: "cod" | "razorpay";
  paymentStatus: "paid" | "pending";
  items: OrderConfirmationEmailItem[];
  subtotal: number;
  discountAmount: number;
  couponCode?: string | null;
  shippingCharge: number;
  codHandlingFee?: number;
  totalAmount: number;
  shippingAddress: {
    fullName: string;
    phone: string;
    addressLine1: string;
    addressLine2?: string | null;
    city: string;
    state: string;
    pincode: string;
  };
  orderViewUrl: string;
}

export const OrderConfirmationEmail = ({
  orderNumber,
  customerName,
  orderDate,
  paymentMethod,
  paymentStatus,
  items,
  subtotal,
  discountAmount,
  couponCode,
  shippingCharge,
  codHandlingFee = 0,
  totalAmount,
  shippingAddress,
  orderViewUrl,
}: OrderConfirmationEmailProps) => {
  const isPaid = paymentStatus === "paid";
  const paymentMethodLabel =
    paymentMethod === "cod" ? "Cash on Delivery" : "Online Payment (Razorpay)";

  return (
    <Html>
      <Head />
      <Preview>Order Confirmed: {orderNumber} - Thank you for shopping with Velaash</Preview>
      <Body style={mainStyle}>
        <Container style={containerStyle}>
          {/* Header */}
          <Section style={headerSectionStyle}>
            <Text style={brandLogoStyle}>VELAASH</Text>
            <Text style={brandSubtitleStyle}>ORDER CONFIRMATION</Text>
          </Section>

          {/* Greeting */}
          <Section style={contentSectionStyle}>
            <Heading style={headingStyle}>Thank you for your order, {customerName}!</Heading>
            <Text style={textStyle}>
              Your order <strong style={{ color: "#4D2A00" }}>{orderNumber}</strong> placed on{" "}
              {orderDate} has been confirmed and is being prepared for dispatch.
            </Text>

            {/* Status Pills */}
            <Section style={statusContainerStyle}>
              <Text style={statusLabelStyle}>
                Payment:{" "}
                <span style={{ fontWeight: 600, color: isPaid ? "#166534" : "#CC6F00" }}>
                  {paymentMethodLabel} ({isPaid ? "Paid" : "Payable on Delivery"})
                </span>
              </Text>
              <Text style={statusLabelStyle}>
                Est. Delivery:{" "}
                <span style={{ fontWeight: 600, color: "#4D2A00" }}>5–7 Business Days</span>
              </Text>
            </Section>

            <Hr style={dividerStyle} />

            {/* Items Table */}
            <Text style={subheadingStyle}>Items in Your Order</Text>
            {items.map((item, idx) => (
              <Section key={idx} style={itemRowStyle}>
                <Text style={itemTitleStyle}>
                  {item.title} (Qty: {item.quantity})
                </Text>
                <Text style={itemMetaStyle}>
                  Size: {item.size} • Color: {item.color}
                </Text>
                <Text style={itemPriceStyle}>₹{item.lineSubtotal.toLocaleString("en-IN")}</Text>
              </Section>
            ))}

            <Hr style={dividerStyle} />

            {/* Price Breakdown */}
            <Section style={pricingSectionStyle}>
              <Section style={pricingRowStyle}>
                <Text style={pricingLabelStyle}>Subtotal</Text>
                <Text style={pricingValueStyle}>₹{subtotal.toLocaleString("en-IN")}</Text>
              </Section>

              {discountAmount > 0 && (
                <Section style={pricingRowStyle}>
                  <Text style={pricingLabelStyle}>
                    Discount {couponCode ? `(${couponCode})` : ""}
                  </Text>
                  <Text style={{ ...pricingValueStyle, color: "#166534" }}>
                    -₹{discountAmount.toLocaleString("en-IN")}
                  </Text>
                </Section>
              )}

              <Section style={pricingRowStyle}>
                <Text style={pricingLabelStyle}>Shipping</Text>
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

              <Hr style={dividerStyle} />

              <Section style={pricingRowStyle}>
                <Text style={totalLabelStyle}>Total Amount</Text>
                <Text style={totalValueStyle}>₹{totalAmount.toLocaleString("en-IN")}</Text>
              </Section>
            </Section>

            <Hr style={dividerStyle} />

            {/* Delivery Address */}
            <Text style={subheadingStyle}>Delivery Destination</Text>
            <Text style={addressTextStyle}>
              {shippingAddress.fullName}
              <br />
              {shippingAddress.addressLine1}
              {shippingAddress.addressLine2 ? `, ${shippingAddress.addressLine2}` : ""}
              <br />
              {shippingAddress.city}, {shippingAddress.state} - {shippingAddress.pincode}
              <br />
              Phone: {shippingAddress.phone}
            </Text>

            {/* CTA */}
            <Section style={ctaSectionStyle}>
              <Link href={orderViewUrl} style={buttonStyle}>
                View Order Details & Tracking
              </Link>
            </Section>

            {/* Explainer */}
            <Text style={noteTextStyle}>
              What happens next? We will notify you once your parcel is handed over to our
              courier partner, along with your tracking details.
            </Text>
          </Section>

          {/* Footer */}
          <Section style={footerSectionStyle}>
            <Text style={footerTextStyle}>
              Need assistance? Email us at{" "}
              <Link href="mailto:support@velaash.com" style={{ color: "#CC6F00" }}>
                support@velaash.com
              </Link>
            </Text>
            <Text style={legalTextStyle}>VELAASH TRADER&apos;S</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default OrderConfirmationEmail;

// Inline Email Styles (Calibrated to Velaash Brand Palette)
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
  padding: "28px 24px",
  textAlign: "center",
};

const brandLogoStyle: React.CSSProperties = {
  color: "#FFFBF0",
  fontFamily: "'Cormorant Garamond', Georgia, serif",
  fontSize: "26px",
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
  padding: "32px 36px",
};

const headingStyle: React.CSSProperties = {
  color: "#4D2A00",
  fontFamily: "'Cormorant Garamond', Georgia, serif",
  fontSize: "22px",
  fontWeight: "600",
  margin: "0 0 12px 0",
};

const textStyle: React.CSSProperties = {
  color: "#555555",
  fontSize: "14px",
  lineHeight: "22px",
  margin: "0 0 16px 0",
};

const statusContainerStyle: React.CSSProperties = {
  backgroundColor: "#FFFBF0",
  borderRadius: "6px",
  padding: "12px 16px",
  border: "1px solid #F9E6A8",
  margin: "16px 0",
};

const statusLabelStyle: React.CSSProperties = {
  color: "#666666",
  fontSize: "13px",
  margin: "4px 0",
};

const dividerStyle: React.CSSProperties = {
  borderColor: "#E8DCC2",
  margin: "20px 0",
};

const subheadingStyle: React.CSSProperties = {
  color: "#4D2A00",
  fontFamily: "'Cormorant Garamond', Georgia, serif",
  fontSize: "16px",
  fontWeight: "600",
  margin: "0 0 12px 0",
};

const itemRowStyle: React.CSSProperties = {
  padding: "8px 0",
};

const itemTitleStyle: React.CSSProperties = {
  fontSize: "14px",
  fontWeight: "600",
  color: "#4D2A00",
  margin: 0,
};

const itemMetaStyle: React.CSSProperties = {
  fontSize: "12px",
  color: "#777777",
  margin: "2px 0",
};

const itemPriceStyle: React.CSSProperties = {
  fontSize: "13px",
  fontWeight: "600",
  color: "#CC6F00",
  margin: "2px 0",
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
  fontSize: "16px",
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

const addressTextStyle: React.CSSProperties = {
  fontSize: "13px",
  lineHeight: "20px",
  color: "#555555",
  margin: 0,
};

const ctaSectionStyle: React.CSSProperties = {
  textAlign: "center",
  margin: "28px 0",
};

const buttonStyle: React.CSSProperties = {
  backgroundColor: "#CC6F00",
  color: "#FFFFFF",
  padding: "12px 28px",
  fontSize: "13px",
  fontWeight: "600",
  textDecoration: "none",
  borderRadius: "4px",
  display: "inline-block",
  letterSpacing: "0.5px",
};

const noteTextStyle: React.CSSProperties = {
  fontSize: "12px",
  color: "#777777",
  lineHeight: "18px",
  textAlign: "center",
  margin: "16px 0 0 0",
};

const footerSectionStyle: React.CSSProperties = {
  backgroundColor: "#FFFBF0",
  padding: "20px 24px",
  textAlign: "center",
  borderTop: "1px solid #E8DCC2",
};

const footerTextStyle: React.CSSProperties = {
  fontSize: "12px",
  color: "#666666",
  margin: "0 0 4px 0",
};

const legalTextStyle: React.CSSProperties = {
  fontSize: "10px",
  color: "#999999",
  margin: 0,
  letterSpacing: "1px",
};
