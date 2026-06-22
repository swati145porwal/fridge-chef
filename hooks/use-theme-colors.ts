"use client";

// FridgeChef theme colors - uses CSS variables for light/dark support
export const T = {
  bg: "var(--fc-bg)",
  surface: "var(--fc-surface)",
  card: "var(--fc-card)",
  card2: "var(--fc-card2)",
  border: "var(--fc-border)",
  border2: "var(--fc-border2)",
  text: "var(--fc-text)",
  textSub: "var(--fc-text-sub)",
  textMut: "var(--fc-text-mut)",
  accent: "var(--fc-accent)",
  gold: "var(--fc-gold)",
  teal: "var(--fc-teal)",
  tealBg: "var(--fc-teal-bg)",
  navBg: "var(--fc-nav-bg)",
  navBorder: "var(--fc-nav-border)",
} as const;

export type ThemeColors = typeof T;
