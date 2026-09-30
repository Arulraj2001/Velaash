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

export interface AccountWelcomeEmailProps {
  customerName: string;
  email: string;
  loginUrl: string;
}

export const AccountWelcomeEmail = ({
  customerName,
  email,
  loginUrl,
}: AccountWelcomeEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>Welcome to Velaash — Your Account is Ready</Preview>
      <Body style={mainStyle}>
        <Container style={containerStyle}>
          {/* Brand Header */}
          <Section style={headerSectionStyle}>
            <Text style={brandLogoStyle}>VELAASH</Text>
            <Text style={brandSubtitleStyle}>WELCOME TO OUR COMMUNITY</Text>
          </Section>

          {/* Content Area */}
          <Section style={contentSectionStyle}>
            <Heading style={headingStyle}>Welcome, {customerName}!</Heading>
            <Text style={textStyle}>
              Your customer account for <strong style={{ color: "#4D2A00" }}>{email}</strong> has
              been created successfully.
            </Text>

            <Section style={otpNoticeBoxStyle}>
              <Text style={otpNoticeHeadingStyle}>Simple, Passwordless Login</Text>
              <Text style={otpNoticeTextStyle}>
                You can log in anytime using this email address. We will send you a fast 6-digit
                access code directly to your inbox — no password to create or remember.
              </Text>
            </Section>

            <Hr style={dividerStyle} />

            <Text style={subheadingStyle}>What you can do with your account:</Text>
            <Text style={bulletStyle}>
              • <strong>Track Orders:</strong> View live dispatch status, order history, and invoices.
            </Text>
            <Text style={bulletStyle}>
              • <strong>Saved Addresses:</strong> Your delivery address has already been saved to your account as default. You can manage or add additional addresses anytime.
            </Text>
            <Text style={bulletStyle}>
              • <strong>Wishlist:</strong> Save and sync your favorite pieces across all your devices.
            </Text>

            {/* CTA Button */}
            <Section style={ctaSectionStyle}>
              <Link href={loginUrl} style={buttonStyle}>
                Sign In to Your Account
              </Link>
            </Section>

            <Text style={noteTextStyle}>
              If you did not request this account during checkout, you can safely ignore this email.
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

export default AccountWelcomeEmail;

// Email Styles Calibrated to Velaash Brand Palette
const mainStyle: React.CSSProperties = {
  backgroundColor: "#FAF7F2",
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
  margin: 0,
  padding: "24px 0",
};

const containerStyle: React.CSSProperties = {
  backgroundColor: "#FFFFFF",
  border: "1px solid #E6DBC9",
  borderRadius: "12px",
  maxWidth: "580px",
  margin: "0 auto",
  overflow: "hidden",
};

const headerSectionStyle: React.CSSProperties = {
  backgroundColor: "#4D2A00",
  padding: "28px 24px",
  textAlign: "center",
};

const brandLogoStyle: React.CSSProperties = {
  color: "#D4AF37",
  fontSize: "24px",
  fontWeight: 700,
  letterSpacing: "0.2em",
  margin: 0,
};

const brandSubtitleStyle: React.CSSProperties = {
  color: "#E6DBC9",
  fontSize: "10px",
  letterSpacing: "0.25em",
  margin: "6px 0 0 0",
};

const contentSectionStyle: React.CSSProperties = {
  padding: "32px 28px",
};

const headingStyle: React.CSSProperties = {
  color: "#2C1810",
  fontSize: "20px",
  fontWeight: 600,
  margin: "0 0 12px 0",
};

const subheadingStyle: React.CSSProperties = {
  color: "#2C1810",
  fontSize: "14px",
  fontWeight: 600,
  margin: "18px 0 8px 0",
};

const textStyle: React.CSSProperties = {
  color: "#4A3E3D",
  fontSize: "14px",
  lineHeight: "1.6",
  margin: "0 0 16px 0",
};

const bulletStyle: React.CSSProperties = {
  color: "#4A3E3D",
  fontSize: "13px",
  lineHeight: "1.6",
  margin: "0 0 6px 0",
};

const otpNoticeBoxStyle: React.CSSProperties = {
  backgroundColor: "#FDF8F0",
  border: "1px solid #E6DBC9",
  borderRadius: "8px",
  padding: "16px 18px",
  marginTop: "16px",
  marginBottom: "16px",
};

const otpNoticeHeadingStyle: React.CSSProperties = {
  color: "#804700",
  fontSize: "13px",
  fontWeight: 600,
  margin: "0 0 4px 0",
};

const otpNoticeTextStyle: React.CSSProperties = {
  color: "#4A3E3D",
  fontSize: "13px",
  lineHeight: "1.5",
  margin: 0,
};

const dividerStyle: React.CSSProperties = {
  borderColor: "#E6DBC9",
  margin: "20px 0",
};

const ctaSectionStyle: React.CSSProperties = {
  textAlign: "center",
  marginTop: "24px",
  marginBottom: "16px",
};

const buttonStyle: React.CSSProperties = {
  backgroundColor: "#804700",
  color: "#FFFFFF",
  display: "inline-block",
  fontSize: "14px",
  fontWeight: 600,
  padding: "12px 28px",
  borderRadius: "8px",
  textDecoration: "none",
  textAlign: "center",
};

const noteTextStyle: React.CSSProperties = {
  color: "#7D6E68",
  fontSize: "12px",
  fontStyle: "italic",
  margin: "16px 0 0 0",
  textAlign: "center",
};

const footerSectionStyle: React.CSSProperties = {
  backgroundColor: "#FAF7F2",
  borderTop: "1px solid #E6DBC9",
  padding: "20px",
  textAlign: "center",
};

const footerTextStyle: React.CSSProperties = {
  color: "#7D6E68",
  fontSize: "12px",
  margin: "0 0 6px 0",
};

const legalTextStyle: React.CSSProperties = {
  color: "#A89A93",
  fontSize: "10px",
  letterSpacing: "0.15em",
  margin: 0,
};
