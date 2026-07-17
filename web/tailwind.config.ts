import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        kc: {
          blue: "#1b4f9c",
          "blue-deep": "#0e2f66",
          "blue-soft": "#4f7ec8",
          purple: "#6b3d9a",
          "purple-deep": "#4a256e",
          "purple-soft": "#8f6bb8",
          mist: "#f4f1fa",
          ink: "#1a1d2e",
          muted: "#5c6478",
        },
      },
      maxWidth: {
        reading: "42rem",
      },
      boxShadow: {
        soft: "0 10px 30px rgba(14, 47, 102, 0.08)",
      },
    },
  },
  plugins: [],
} satisfies Config;
