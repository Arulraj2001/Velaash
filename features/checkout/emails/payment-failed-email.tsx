/**
 * Established Velaash Brand Tokens for Transactional Emails:
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

export interface PaymentFailedEmailProps {
  orderNumber: string;
  customerName: string;
  totalAmount: number;
  failureReason?: string;
  retryPaymentUrl: string;
  supportEmail?: string;
}

export const PaymentFailedEmail = ({
  orderNumber,
  customerName,
  totalAmount,
  failureReason = "Payment could not be completed by your banking institution.",
  retryPaymentUrl,
  supportEmail,
}: PaymentFailedEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>Action Required: Payment for Order {orderNumber} was unsuccessful</Preview>
      <Body style={mainStyle}>
        <Container style={containerStyle}>
          {/* Header */}
          <Section style={headerSectionStyle}>
            <Text style={brandLogoStyle}>VELAASH</Text>
            <Text style={brandSubtitleStyle}>PAYMENT NOTICE</Text>
          </Section>

          {/* Main Body */}
          <Section style={contentSectionStyle}>
            <Heading style={headingStyle}>Payment Unsuccessful for Order {orderNumber}</Heading>
            <Text style={textStyle}>Dear {customerName},</Text>
            <Text style={textStyle}>
              We noticed that your recent online payment attempt for order{" "}
              <strong style={{ color: "#4D2A00" }}>{orderNumber}</strong> of ₹
              {totalAmount.toLocaleString("en-IN")} was not completed successfully.
            </Text>

            {/* Error Details */}
            <Section style={alertBoxStyle}>
              <Text style={alertHeadingStyle}>Reason Reported:</Text>
              <Text style={alertTextStyle}>{failureReason}</Text>
            </Section>

            <Text style={textStyle}>
              Your selected items have been kept in your order. You can securely retry your payment
              now or select another payment option such as UPI, Netbanking, or another card.
            </Text>

            {/* CTA Button */}
            <Section style={ctaSectionStyle}>
              <Link href={retryPaymentUrl} style={buttonStyle}>
                Complete Your Payment
              </Link>
            </Section>

            <Hr style={dividerStyle} />

            {/* Reassurance Notice */}
            <Section style={supportContainerStyle}>
              <Text style={noteTextStyle}>
                <strong>Was your account debited?</strong> In the event that money was deducted from
                your account despite this failure notice, banks typically reverse the funds
                automatically within 3 to 5 business days.
              </Text>
              <Text style={{ ...noteTextStyle, marginBottom: 0 }}>
                If the amount is not reversed or you need assistance, please contact us
                {supportEmail ? <> at <Link href={`mailto:${supportEmail}`} style={{ color: "#CC6F00" }}>{supportEmail}</Link></> : " through our customer support page"}
                {" "}with your order reference <strong>{orderNumber}</strong>.
              </Text>
            </Section>
          </Section>

          {/* Footer */}
          <Section style={footerSectionStyle}>
            <Text style={footerTextStyle}>
              {supportEmail ? (
                <>Need assistance? Email us at <Link href={`mailto:${supportEmail}`} style={{ color: "#CC6F00" }}>{supportEmail}</Link></>
              ) : "Need assistance? Contact our customer support team."}
            </Text>
            <Text style={legalTextStyle}>VELAASH TRADER&apos;S</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default PaymentFailedEmail;

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
  color: "#991B1B", // Warning dark red
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

const alertBoxStyle: React.CSSProperties = {
  backgroundColor: "#FEF2F2",
  borderRadius: "6px",
  padding: "12px 16px",
  border: "1px solid #FEE2E2",
  margin: "16px 0",
};

const alertHeadingStyle: React.CSSProperties = {
  color: "#991B1B",
  fontSize: "12px",
  fontWeight: "600",
  margin: "0 0 4px 0",
  textTransform: "uppercase",
  letterSpacing: "0.5px",
};

const alertTextStyle: React.CSSProperties = {
  color: "#B91C1C",
  fontSize: "13px",
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

const dividerStyle: React.CSSProperties = {
  borderColor: "#E8DCC2",
  margin: "24px 0",
};

const supportContainerStyle: React.CSSProperties = {
  backgroundColor: "#FFFBF0",
  border: "1px solid #F9E6A8",
  borderRadius: "6px",
  padding: "12px 16px",
  margin: "16px 0",
};

const noteTextStyle: React.CSSProperties = {
  fontSize: "12px",
  color: "#777777",
  lineHeight: "18px",
  margin: "8px 0",
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
