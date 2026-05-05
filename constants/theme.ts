export const CafeColors = {
  // Primary
  darkBrown: "#3E1F0D",
  mediumBrown: "#8B4513",
  lightBrown: "#D2691E",

  // Backgrounds
  cream: "#FDF6EC",
  beige: "#F5E6D3",
  softBeige: "#FFF8F0",
  white: "#FFFFFF",

  // Text
  textPrimary: "#3E1F0D",
  textSecondary: "#8B6355",
  textMuted: "#C4A882",
  textOnDark: "#FFF5E4",

  // Cards
  cardBrown: "#F3E5D8",
  cardCream: "#FFF0E0",

  // Status
  success: "#27AE60",
  warning: "#E67E22",
  danger: "#C0392B",
  info: "#2980B9",

  // Borders
  border: "#E8D5C0",
  borderLight: "#F0DEC8",
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  xxxl: 40,
} as const;

export const BorderRadius = {
  sm: 10,
  md: 16,
  lg: 20,
  xl: 24,
  pill: 100,
} as const;

export const Shadow = {
  soft: {
    shadowColor: "#3E1F0D",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  medium: {
    shadowColor: "#3E1F0D",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: 6,
  },
  strong: {
    shadowColor: "#3E1F0D",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 18,
    elevation: 10,
  },
} as const;

// Backwards compat with existing imports
export const Colors = {
  light: {
    text: CafeColors.textPrimary,
    background: CafeColors.cream,
    tint: CafeColors.darkBrown,
    icon: CafeColors.textSecondary,
    tabIconDefault: CafeColors.textSecondary,
    tabIconSelected: CafeColors.darkBrown,
  },
  dark: {
    text: CafeColors.textOnDark,
    background: CafeColors.darkBrown,
    tint: CafeColors.textOnDark,
    icon: CafeColors.textMuted,
    tabIconDefault: CafeColors.textMuted,
    tabIconSelected: CafeColors.textOnDark,
  },
};
