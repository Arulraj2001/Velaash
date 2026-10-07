/**
 * Velaash Customer Authentication OTP Email Template
 * Dispatched via Resend with exact brand palette and high-contrast typography.
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

export interface CustomerOtpEmailProps {
  otpCode: string;
  magicLinkUrl?: string;
  supportEmail?: string;
}

export const CustomerOtpEmail = ({
  otpCode,
  magicLinkUrl,
  supportEmail = "care@velaash.in",
}: CustomerOtpEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>Your Velaash verification code: {otpCode}</Preview>
      <Body style={mainStyle}>
        <Container style={containerStyle}>
          {/* Brand Header */}
          <Section style={headerSectionStyle}>
            <Text style={brandLogoStyle}>VELAASH</Text>
            <Text style={brandSubtitleStyle}>CONTEMPORARY EVERYDAY LUXURY</Text>
          </Section>

          {/* Main Card Body */}
          <Section style={contentSectionStyle}>
            <Heading style={headingStyle}>Your Sign-In Verification Code</Heading>
            <Text style={textStyle}>
              Use the verification code below to sign in to your Velaash account.
            </Text>

            {/* OTP Code Box */}
            <Section style={otpBoxStyle}>
              <Text style={otpCodeStyle}>{otpCode}</Text>
              <Text style={otpExpiryStyle}>This code expires in 10 minutes</Text>
            </Section>

            {magicLinkUrl && (
              <>
                <Text style={orTextStyle}>— OR —</Text>
                <Section style={ctaSectionStyle}>
                  <Link href={magicLinkUrl} style={buttonStyle}>
                    Sign In Directly
                  </Link>
                </Section>
              </>
            )}

            <Hr style={dividerStyle} />

            <Text style={securityNoticeStyle}>
              <strong>Security tip:</strong> Never share this code with anyone. Velaash staff will never ask you for your login verification code.
            </Text>

            <Text style={noteTextStyle}>
              If you did not request this verification code, you can safely ignore this email. No changes have been made to your account.
            </Text>
          </Section>

          {/* Footer */}
          <Section style={footerSectionStyle}>
            <Text style={footerTextStyle}>
              Questions? Reach our concierge at{" "}
              <Link href={`mailto:${supportEmail}`} style={footerLinkStyle}>
                {supportEmail}
              </Link>
            </Text>
            <Text style={footerCopyrightStyle}>
              © {new Date().getFullYear()} VELAASH. All rights reserved. • www.velaash.in
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

// ── Email Styles ─────────────────────────────────────────────────────────────

const mainStyle: React.CSSProperties = {
  backgroundColor: "#f8fafc",
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
  margin: "0 auto",
  padding: "40px 16px",
};

const containerStyle: React.CSSProperties = {
  maxWidth: "520px",
  margin: "0 auto",
  backgroundColor: "#ffffff",
  borderRadius: "16px",
  overflow: "hidden",
  border: "1px solid #e2e8f0",
  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.03)",
};

const headerSectionStyle: React.CSSProperties = {
  backgroundColor: "#2d1600",
  padding: "32px 24px 28px",
  textAlign: "center",
};

const brandLogoStyle: React.CSSProperties = {
  color: "#F2A900",
  fontSize: "26px",
  fontWeight: "800",
  letterSpacing: "4px",
  margin: "0 0 4px",
  textTransform: "uppercase",
};

const brandSubtitleStyle: React.CSSProperties = {
  color: "#e2d2b5",
  fontSize: "10px",
  fontWeight: "600",
  letterSpacing: "2.5px",
  margin: "0",
  textTransform: "uppercase",
};

const contentSectionStyle: React.CSSProperties = {
  padding: "36px 32px 28px",
};

const headingStyle: React.CSSProperties = {
  color: "#1e293b",
  fontSize: "20px",
  fontWeight: "700",
  margin: "0 0 12px",
  textAlign: "center",
};

const textStyle: React.CSSProperties = {
  color: "#475569",
  fontSize: "14px",
  lineHeight: "22px",
  margin: "0 0 24px",
  textAlign: "center",
};

const otpBoxStyle: React.CSSProperties = {
  backgroundColor: "#fffbeb",
  border: "1.5px dashed #fcd34d",
  borderRadius: "14px",
  padding: "24px 16px 20px",
  textAlign: "center",
  margin: "0 0 24px",
};

const otpCodeStyle: React.CSSProperties = {
  fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
  fontSize: "36px",
  fontWeight: "800",
  letterSpacing: "10px",
  color: "#78350f",
  margin: "0 0 6px",
  lineHeight: "1",
};

const otpExpiryStyle: React.CSSProperties = {
  color: "#b45309",
  fontSize: "11px",
  fontWeight: "600",
  margin: "0",
  textTransform: "uppercase",
  letterSpacing: "0.5px",
};

const orTextStyle: React.CSSProperties = {
  color: "#94a3b8",
  fontSize: "11px",
  fontWeight: "600",
  letterSpacing: "1.5px",
  textAlign: "center",
  margin: "0 0 16px",
};

const ctaSectionStyle: React.CSSProperties = {
  textAlign: "center",
  margin: "0 0 28px",
};

const buttonStyle: React.CSSProperties = {
  display: "inline-block",
  backgroundColor: "#1e293b",
  color: "#ffffff",
  fontSize: "13px",
  fontWeight: "600",
  textDecoration: "none",
  padding: "12px 28px",
  borderRadius: "8px",
};

const dividerStyle: React.CSSProperties = {
  borderColor: "#f1f5f9",
  margin: "24px 0",
};

const securityNoticeStyle: React.CSSProperties = {
  color: "#64748b",
  fontSize: "12px",
  lineHeight: "18px",
  margin: "0 0 10px",
};

const noteTextStyle: React.CSSProperties = {
  color: "#94a3b8",
  fontSize: "11px",
  lineHeight: "16px",
  margin: "0",
};

const footerSectionStyle: React.CSSProperties = {
  backgroundColor: "#f8fafc",
  borderTop: "1px solid #f1f5f9",
  padding: "20px 24px",
  textAlign: "center",
};

const footerTextStyle: React.CSSProperties = {
  color: "#64748b",
  fontSize: "11px",
  margin: "0 0 6px",
};

const footerLinkStyle: React.CSSProperties = {
  color: "#CC6F00",
  textDecoration: "underline",
};

const footerCopyrightStyle: React.CSSProperties = {
  color: "#94a3b8",
  fontSize: "10px",
  margin: "0",
};
