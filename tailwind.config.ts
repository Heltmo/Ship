import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["var(--font-display)", "ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
        body: ["var(--font-body)", "ui-monospace", "SFMono-Regular", "Menlo", "monospace"]
      },
      boxShadow: {
        glow: "0 18px 45px -20px rgba(249, 115, 22, 0.55)"
      }
    }
  },
  plugins: []
};

export default config;
