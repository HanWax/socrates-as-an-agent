import type { Appearance } from "@clerk/tanstack-react-start";

/**
 * Miró-inspired Clerk theme — matches the app's warm canvas palette
 * with cobalt blue, vermillion red, and biomorphic rounded shapes.
 */
export const clerkAppearance: Appearance = {
  variables: {
    colorPrimary: "#1D3557",
    colorDanger: "#D62828",
    colorSuccess: "#2D6A4F",
    colorNeutral: "#1a1a1a",
    colorBackground: "#ffffff",
    colorInputBackground: "#ffffff",
    colorInputText: "#1a1a1a",
    colorText: "#1a1a1a",
    colorTextSecondary: "#6f6f6f",
    borderRadius: "0.75rem",
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif',
  },
  elements: {
    /* ── Card ────────────────────────────────────────────────── */
    /* Make the Clerk card transparent so the outer wrapper is the visual container */
    card: {
      backgroundColor: "transparent",
      boxShadow: "none",
      border: "none",
      padding: "0",
    },
    cardBox: {
      boxShadow: "none",
    },

    /* ── Header ─────────────────────────────────────────────── */
    /* Hide the default Clerk header — branding lives above the card */
    headerTitle: {
      display: "none",
    },
    headerSubtitle: {
      display: "none",
    },

    /* ── Primary button ─────────────────────────────────────── */
    formButtonPrimary: {
      background: "linear-gradient(135deg, #1d3557, #2d6a4f)",
      color: "#fff",
      fontWeight: "600",
      borderRadius: "12px",
      boxShadow: "3px 3px 0 rgba(26, 26, 26, 0.35)",
      transition: "all 0.15s ease",
      "&:hover": {
        background: "linear-gradient(135deg, #142a47, #1b4030)",
        boxShadow: "2px 2px 0 rgba(26, 26, 26, 0.4)",
      },
      "&:active": {
        boxShadow: "1px 1px 0 rgba(26, 26, 26, 0.4)",
        transform: "translate(1px, 1px)",
      },
    },

    /* ── Form inputs ────────────────────────────────────────── */
    formFieldInput: {
      borderRadius: "12px",
      border: "1.5px solid #d4cfc6",
      backgroundColor: "#fff",
      color: "#1a1a1a",
      boxShadow: "inset 0 1px 0 rgba(29, 53, 87, 0.04)",
      "&:focus": {
        borderColor: "#1d3557",
        boxShadow: "0 0 0 3px rgba(29, 53, 87, 0.12)",
      },
    },
    formFieldLabel: {
      color: "#1a1a1a",
      fontWeight: "500",
    },
    formFieldAction: {
      color: "#1D3557",
      fontWeight: "500",
      "&:hover": { color: "#D62828" },
    },

    /* ── Social / OAuth buttons ─────────────────────────────── */
    socialButtonsBlockButton: {
      borderRadius: "12px",
      border: "1.5px solid #d4cfc6",
      backgroundColor: "#fff",
      transition: "all 0.15s ease",
      "&:hover": {
        backgroundColor: "#f5f0e8",
        borderColor: "#1d3557",
      },
    },
    socialButtonsIconButton: {
      borderRadius: "12px",
      border: "1.5px solid #d4cfc6",
      backgroundColor: "#fff",
      "&:hover": {
        backgroundColor: "#f5f0e8",
        borderColor: "#1d3557",
      },
    },

    /* ── Divider ("or") ─────────────────────────────────────── */
    dividerLine: {
      borderColor: "#d4cfc6",
    },
    dividerText: {
      color: "#8b8b8b",
    },

    /* ── Footer links ───────────────────────────────────────── */
    footer: {
      "& a": { color: "#1D3557", fontWeight: "600" },
      "& a:hover": { color: "#D62828" },
    },
    footerActionLink: {
      color: "#1D3557",
      fontWeight: "600",
      "&:hover": { color: "#D62828" },
    },
    footerActionText: {
      color: "#6f6f6f",
    },

    /* ── UserButton popover ─────────────────────────────────── */
    userButtonPopoverCard: {
      backgroundColor: "#fff",
      border: "1.5px solid #d4cfc6",
      borderRadius: "16px",
      boxShadow: "0 12px 40px rgba(26, 26, 26, 0.12)",
    },
    userButtonPopoverActionButton: {
      borderRadius: "8px",
      "&:hover": {
        backgroundColor: "#f5f0e8",
      },
    },
    userButtonPopoverFooter: {
      borderTop: "1px solid #d4cfc6",
    },

    /* ── Alerts / errors ────────────────────────────────────── */
    alert: {
      borderRadius: "12px",
    },

    /* ── Identity preview ───────────────────────────────────── */
    identityPreview: {
      borderRadius: "12px",
      border: "1.5px solid #d4cfc6",
    },

    /* ── OTP input ──────────────────────────────────────────── */
    otpCodeFieldInput: {
      borderRadius: "10px",
      border: "1.5px solid #d4cfc6",
      "&:focus": {
        borderColor: "#1d3557",
        boxShadow: "0 0 0 3px rgba(29, 53, 87, 0.12)",
      },
    },
  },
};
