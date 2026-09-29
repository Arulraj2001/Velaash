import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./features/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          gold: "#F2A900",
          "gold-hover": "#D99600",
          accent: "#CC6F00",
          "accent-hover": "#B36000",
          dark: "#4D2A00",
          "dark-muted": "#6B3C02",
          light: "#F9E6A8",
          cream: "#FFFBF0",
          "cream-dark": "#F3EBD8",
          card: "#FFFFFF",
          "card-muted": "#FFFEFA",
          border: "#E8DCC2",
          "border-gold": "#F2A900",
        },
      },
      fontFamily: {
        heading: ["var(--font-heading)", "Cormorant Garamond", "Georgia", "serif"],
        sans: ["var(--font-sans)", "Plus Jakarta Sans", "system-ui", "sans-serif"],
      },
      borderRadius: {
        xs: "2px",
        sm: "4px",
        md: "8px",
        lg: "12px",
        xl: "16px",
        "2xl": "20px",
        full: "9999px",
      },
      boxShadow: {
        "gold-sm": "0 2px 8px -2px rgba(242, 169, 0, 0.15)",
        "gold-md": "0 4px 16px -4px rgba(242, 169, 0, 0.22)",
        "gold-lg": "0 10px 25px -5px rgba(242, 169, 0, 0.28)",
        luxury: "0 10px 30px -10px rgba(77, 42, 0, 0.08)",
        "luxury-hover": "0 14px 40px -10px rgba(77, 42, 0, 0.15)",
      },
    },
  },
  plugins: [],
};

export default config;
