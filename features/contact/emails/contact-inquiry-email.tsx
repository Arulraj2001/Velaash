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
  Preview,
  Section,
  Text,
} from "@react-email/components";

export interface ContactInquiryEmailProps {
  name: string;
  email: string;
  subject: string;
  message: string;
  submittedAt?: string;
}

export const ContactInquiryEmail = ({
  name,
  email,
  subject,
  message,
  submittedAt = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
}: ContactInquiryEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>New Customer Inquiry: {subject} from {name}</Preview>
      <Body style={mainStyle}>
        <Container style={containerStyle}>
          {/* Header */}
          <Section style={headerSectionStyle}>
            <Text style={brandLogoStyle}>VELAASH</Text>
            <Text style={brandSubtitleStyle}>NEW STORE INQUIRY</Text>
          </Section>

          {/* Main Content */}
          <Section style={contentSectionStyle}>
            <Heading style={headingStyle}>New Website Inquiry</Heading>
            <Text style={metaTextStyle}>
              Received on <strong>{submittedAt}</strong> (IST)
            </Text>

            <Section style={customerCardStyle}>
              <Text style={customerDetailStyle}>
                <strong>Sender Name:</strong> {name}
              </Text>
              <Text style={customerDetailStyle}>
                <strong>Sender Email:</strong>{" "}
                <a href={`mailto:${email}`} style={{ color: "#CC6F00", textDecoration: "underline" }}>
                  {email}
                </a>
              </Text>
              <Text style={customerDetailStyle}>
                <strong>Subject:</strong> {subject}
              </Text>
            </Section>

            <Hr style={dividerStyle} />

            <Text style={sectionTitleStyle}>Message Content:</Text>
            <Section style={messageBoxStyle}>
              <Text style={messageTextStyle}>{message}</Text>
            </Section>

            <Hr style={dividerStyle} />

            <Text style={replyNoteStyle}>
              You can reply directly to this customer inquiry by replying to this email or writing to{" "}
              <strong style={{ color: "#4D2A00" }}>{email}</strong>.
            </Text>
          </Section>

          {/* Footer */}
          <Section style={footerSectionStyle}>
            <Text style={footerTextStyle}>
              VELAASH TRADER&apos;S &bull; Online Customer Service &bull; All Rights Reserved
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

// Styling tokens aligned with established Velaash brand palette
const mainStyle: React.CSSProperties = {
  backgroundColor: "#FFFBF0",
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif',
  padding: "24px 0",
};

const containerStyle: React.CSSProperties = {
  backgroundColor: "#FFFFFF",
  margin: "0 auto",
  maxWidth: "580px",
  borderRadius: "12px",
  overflow: "hidden",
  border: "1px solid #E8DCC2",
};

const headerSectionStyle: React.CSSProperties = {
  backgroundColor: "#4D2A00",
  padding: "28px 24px",
  textAlign: "center" as const,
};

const brandLogoStyle: React.CSSProperties = {
  color: "#F2A900",
  fontSize: "26px",
  letterSpacing: "4px",
  fontWeight: 700,
  margin: "0 0 4px 0",
};

const brandSubtitleStyle: React.CSSProperties = {
  color: "#F9E6A8",
  fontSize: "10px",
  letterSpacing: "2.5px",
  margin: "0",
  textTransform: "uppercase" as const,
};

const contentSectionStyle: React.CSSProperties = {
  padding: "32px 28px",
};

const headingStyle: React.CSSProperties = {
  color: "#4D2A00",
  fontSize: "20px",
  fontWeight: 600,
  margin: "0 0 6px 0",
};

const metaTextStyle: React.CSSProperties = {
  color: "#666666",
  fontSize: "12px",
  margin: "0 0 20px 0",
};

const customerCardStyle: React.CSSProperties = {
  backgroundColor: "#FFFBF0",
  border: "1px solid #F9E6A8",
  borderRadius: "8px",
  padding: "16px",
  margin: "16px 0",
};

const customerDetailStyle: React.CSSProperties = {
  color: "#4D2A00",
  fontSize: "13px",
  lineHeight: "22px",
  margin: "4px 0",
};

const dividerStyle: React.CSSProperties = {
  borderColor: "#E8DCC2",
  margin: "24px 0",
};

const sectionTitleStyle: React.CSSProperties = {
  color: "#4D2A00",
  fontSize: "14px",
  fontWeight: 600,
  margin: "0 0 10px 0",
};

const messageBoxStyle: React.CSSProperties = {
  backgroundColor: "#FFFBF0",
  borderLeft: "3px solid #CC6F00",
  borderTop: "1px solid #F9E6A8",
  borderRight: "1px solid #F9E6A8",
  borderBottom: "1px solid #F9E6A8",
  padding: "16px 20px",
  borderRadius: "0 8px 8px 0",
  margin: "12px 0",
};

const messageTextStyle: React.CSSProperties = {
  color: "#4D2A00",
  fontSize: "13px",
  lineHeight: "22px",
  whiteSpace: "pre-wrap" as const,
  margin: "0",
};

const replyNoteStyle: React.CSSProperties = {
  color: "#666666",
  fontSize: "12px",
  lineHeight: "18px",
  margin: "16px 0 0 0",
};

const footerSectionStyle: React.CSSProperties = {
  backgroundColor: "#FFFBF0",
  padding: "16px 24px",
  textAlign: "center" as const,
  borderTop: "1px solid #E8DCC2",
};

const footerTextStyle: React.CSSProperties = {
  color: "#888888",
  fontSize: "11px",
  margin: "0",
};
