import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ios: {
          bg: "#F2F2F7",       // System Gray 6
          card: "#FFFFFF",     // Pure White
          blue: "#007AFF",     // System Blue
          text: "#000000",     // System Black
          sub: "#8E8E93",      // System Gray
          border: "#C6C6C8",   // Separators
        }
      },
      fontFamily: {
        sans: ["-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "Helvetica", "Arial", "sans-serif"],
      },
      boxShadow: {
        'ios': '0 1px 2px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.02)',
      }
    },
  },
  plugins: [],
};
export default config;