// SLABAI Tailwind theme snippet
// Merge this into tailwind.config.ts

export const slabaiTheme = {
  colors: {
    brand: {
      blue: {
        50: "#F2F1FF",
        100: "#E5E2FF",
        500: "#5147FF",
        600: "#2E21FC",
        700: "#2418D8",
      },
      orange: {
        100: "#FFE4D7",
        500: "#F3662A",
        600: "#E24907",
        700: "#B93606",
      },
    },
    surface: "#FFFFFF",
    background: "#F8F7FC",
    muted: "#EFEDFA",
    ink: "#111827",
    secondary: "#667085",
    border: "#D0CEDC",
    success: "#35B86B",
    warning: "#FF7A3D",
    error: "#EF4444",
    info: "#4A78FF",
  },
  borderRadius: {
    sm: "8px",
    md: "12px",
    lg: "16px",
    xl: "20px",
    "2xl": "28px",
    pill: "999px",
  },
  boxShadow: {
    sm: "0 2px 8px rgba(17,24,39,0.06)",
    md: "0 8px 24px rgba(17,24,39,0.08)",
    lg: "0 12px 32px rgba(17,24,39,0.10)",
  },
  fontFamily: {
    sans: ["Inter", "Arial", "sans-serif"],
  },
  backgroundImage: {
    "brand-cta": "linear-gradient(90deg, #2E21FC 0%, #5147FF 58%, #E24907 100%)",
  },
}
