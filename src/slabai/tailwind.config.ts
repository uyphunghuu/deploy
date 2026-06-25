import type { Config } from "tailwindcss";
import { slabaiTheme } from "./design/tailwind-theme";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}", "./design/**/*.{ts,tsx}"],
  theme: {
    extend: {
      ...slabaiTheme,
      spacing: {
        token1: "var(--slabai-space-1)",
        token2: "var(--slabai-space-2)",
        token3: "var(--slabai-space-3)",
        token4: "var(--slabai-space-4)",
        token6: "var(--slabai-space-6)",
        token8: "var(--slabai-space-8)",
        token12: "var(--slabai-space-12)",
        token16: "var(--slabai-space-16)"
      }
    }
  },
  plugins: []
};

export default config;
