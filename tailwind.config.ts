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
        background: "var(--bg-primary)",
        foreground: "var(--text-primary)",
        surface: {
          DEFAULT: "var(--bg-secondary)",
          elevated: "var(--bg-elevated)",
          hover: "var(--bg-surface)",
        },
        accent: {
          50: "var(--accent-50)",
          100: "var(--accent-100)",
          200: "var(--accent-200)",
          300: "var(--accent-300)",
          400: "var(--accent-400)",
          500: "var(--accent-500)",
          600: "var(--accent-600)",
          700: "var(--accent-700)",
          800: "var(--accent-800)",
          900: "var(--accent-900)",
          950: "var(--accent-950)",
        },
        dim: {
          DEFAULT: "var(--text-secondary)",
          muted: "var(--text-muted)",
        },
        edge: {
          DEFAULT: "var(--border-default)",
          subtle: "var(--border-subtle)",
          hover: "var(--border-hover)",
        },
      },
    },
  },
  plugins: [],
};
export default config;
