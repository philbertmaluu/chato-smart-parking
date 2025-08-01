import React from "react";

interface PasswordResetEmailProps {
  userName: string;
  resetLink: string;
  expiryTime: string;
}

export function PasswordResetEmail({
  userName,
  resetLink,
  expiryTime,
}: PasswordResetEmailProps) {
  return (
    <div
      style={{
        fontFamily: "Arial, sans-serif",
        maxWidth: "600px",
        margin: "0 auto",
        padding: "20px",
      }}
    >
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: "30px" }}>
        <div
          style={{
            backgroundColor: "#3B82F6",
            color: "white",
            padding: "20px",
            borderRadius: "10px",
            marginBottom: "20px",
          }}
        >
          <h1 style={{ margin: 0, fontSize: "24px", fontWeight: "bold" }}>
            🚗 Smart Parking System
          </h1>
          <p style={{ margin: "10px 0 0 0", opacity: 0.9 }}>
            Password Reset Request
          </p>
        </div>
      </div>

      {/* Content */}
      <div
        style={{
          backgroundColor: "#f8fafc",
          padding: "30px",
          borderRadius: "10px",
        }}
      >
        <h2 style={{ color: "#1e293b", marginBottom: "20px" }}>
          Hello {userName},
        </h2>

        <p
          style={{ color: "#475569", lineHeight: "1.6", marginBottom: "20px" }}
        >
          We received a request to reset your password for your Smart Parking
          System account. If you didn't make this request, you can safely ignore
          this email.
        </p>

        <p
          style={{ color: "#475569", lineHeight: "1.6", marginBottom: "30px" }}
        >
          To reset your password, click the button below:
        </p>

        {/* Reset Button */}
        <div style={{ textAlign: "center", marginBottom: "30px" }}>
          <a
            href={resetLink}
            style={{
              backgroundColor: "#dc2626",
              color: "white",
              padding: "15px 30px",
              textDecoration: "none",
              borderRadius: "8px",
              display: "inline-block",
              fontWeight: "bold",
              fontSize: "16px",
            }}
          >
            Reset Password
          </a>
        </div>

        {/* Alternative Link */}
        <p style={{ color: "#64748b", fontSize: "14px", marginBottom: "20px" }}>
          If the button doesn't work, copy and paste this link into your
          browser:
        </p>
        <p
          style={{
            backgroundColor: "#e2e8f0",
            padding: "10px",
            borderRadius: "5px",
            wordBreak: "break-all",
            fontSize: "12px",
            color: "#475569",
          }}
        >
          {resetLink}
        </p>

        {/* Security Notice */}
        <div
          style={{
            backgroundColor: "#fef3c7",
            border: "1px solid #f59e0b",
            borderRadius: "8px",
            padding: "15px",
            marginTop: "30px",
          }}
        >
          <h4 style={{ color: "#92400e", margin: "0 0 10px 0" }}>
            ⚠️ Security Notice
          </h4>
          <ul style={{ color: "#92400e", margin: 0, paddingLeft: "20px" }}>
            <li>This link will expire in {expiryTime}</li>
            <li>Only use this link on a device you trust</li>
            <li>Never share this link with anyone</li>
            <li>
              If you didn't request this, please contact support immediately
            </li>
          </ul>
        </div>
      </div>

      {/* Footer */}
      <div
        style={{
          textAlign: "center",
          marginTop: "30px",
          padding: "20px",
          borderTop: "1px solid #e2e8f0",
          color: "#64748b",
          fontSize: "14px",
        }}
      >
        <p style={{ margin: "0 0 10px 0" }}>
          Need help? Contact our support team at{" "}
          <a
            href="mailto:support@smartparking.com"
            style={{ color: "#3B82F6" }}
          >
            support@smartparking.com
          </a>
        </p>
        <p style={{ margin: 0 }}>
          © 2024 Smart Parking System. All rights reserved.
        </p>
      </div>
    </div>
  );
}

export default PasswordResetEmail;
