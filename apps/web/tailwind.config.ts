import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // The Guild brand palette — Industrial Professional
        forge: {
          50: "#f9f7f4",
          100: "#f0ebe3",
          200: "#e0d4c4",
          300: "#c9b89e",
          400: "#b09878",
          500: "#9a7d5e",
          600: "#8a6b50",
          700: "#735843",
          800: "#60493b",
          900: "#513e34",
          950: "#2b1f1a",
        },
        // Accent — Copper
        copper: {
          50: "#fdf6f0",
          100: "#faeadb",
          200: "#f4d0b5",
          300: "#ecaf84",
          400: "#e38451",
          500: "#dc6530",
          600: "#ce4f25",
          700: "#ab3c21",
          800: "#883123",
          900: "#6e2b20",
          950: "#3b130e",
        },
        // Neutral charcoal
        charcoal: {
          50: "#f6f7f8",
          100: "#eaecee",
          200: "#d1d6da",
          300: "#adb5bc",
          400: "#838e98",
          500: "#667280",
          600: "#545d6a",
          700: "#454d57",
          800: "#3b424b",
          900: "#343940",
          950: "#111827",
        },
      },
      fontFamily: {
        sans: ["Inter var", "Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      boxShadow: {
        card: "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
        "card-hover": "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
      },
      animation: {
        "fade-in": "fadeIn 0.2s ease-in-out",
        "slide-up": "slideUp 0.3s ease-out",
      },
      keyframes: {
        fadeIn: { "0%": { opacity: "0" }, "100%": { opacity: "1" } },
        slideUp: { "0%": { transform: "translateY(8px)", opacity: "0" }, "100%": { transform: "translateY(0)", opacity: "1" } },
      },
    },
  },
  plugins: [],
} satisfies Config;
