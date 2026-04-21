import colors from "./colors";

export const theme = {
  colors: {
    primary: "#1A1A1A",
    secondary: "#F5F5F7",
    accent: "#D4AF37",
    ...colors.light,
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  radius: {
    sm: 8,
    md: 14,
    lg: 20,
    pill: 999,
  },
  typography: {
    h1: { fontSize: 32, fontFamily: "Inter_700Bold", letterSpacing: -0.5 },
    h2: { fontSize: 24, fontFamily: "Inter_600SemiBold", letterSpacing: -0.3 },
    h3: { fontSize: 18, fontFamily: "Inter_600SemiBold" },
    body: { fontSize: 16, fontFamily: "Inter_400Regular" },
    caption: { fontSize: 13, fontFamily: "Inter_500Medium" },
  },
} as const;

export type Theme = typeof theme;
