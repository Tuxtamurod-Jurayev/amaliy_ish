import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#14213d",
        accent: "#f97316",
        mist: "#f7f4ee",
        night: "#101828",
        card: "#fffaf2",
      },
      boxShadow: {
        soft: "0 24px 80px -32px rgba(15, 23, 42, 0.25)",
      },
      fontFamily: {
        display: ["Aptos Display", "Segoe UI Variable Display", "Trebuchet MS", "Candara", "sans-serif"],
        body: ["Aptos", "Segoe UI Variable Text", "Calibri", "Tahoma", "sans-serif"],
      },
      backgroundImage: {
        grid: "linear-gradient(to right, rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.06) 1px, transparent 1px)"
      }
    },
  },
  plugins: [],
} satisfies Config;
