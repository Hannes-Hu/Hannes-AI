import type { Config } from "tailwindcss";
import colors from "tailwindcss/colors";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        zinc: colors.neutral,
        brand: colors.neutral,
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        mono: ["var(--font-jetbrains-mono)", "Menlo", "monospace"],
      },
      animation: {
        "fade-in": "fadeIn 0.2s ease-out",
        "slide-up": "slideUp 0.3s ease-out",
        "pulse-dot": "pulseDot 1.4s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { transform: "translateY(8px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        pulseDot: {
          "0%, 80%, 100%": { transform: "scale(0.6)", opacity: "0.4" },
          "40%": { transform: "scale(1)", opacity: "1" },
        },
      },
      typography: {
        DEFAULT: {
          css: {
            "--tw-prose-body": "rgb(64 64 64)",
            "--tw-prose-headings": "rgb(23 23 23)",
            "--tw-prose-links": "rgb(23 23 23)",
            "--tw-prose-bold": "rgb(23 23 23)",
            "--tw-prose-code": "rgb(64 64 64)",
            "--tw-prose-pre-bg": "rgb(23 23 23)",
            "--tw-prose-invert-body": "rgb(212 212 212)",
            "--tw-prose-invert-headings": "rgb(245 245 245)",
            "--tw-prose-invert-links": "rgb(245 245 245)",
            "--tw-prose-invert-bold": "rgb(245 245 245)",
            "--tw-prose-invert-code": "rgb(212 212 212)",
            "--tw-prose-invert-pre-bg": "rgb(10 10 10)",
            maxWidth: "none",
          },
        },
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};

export default config;
