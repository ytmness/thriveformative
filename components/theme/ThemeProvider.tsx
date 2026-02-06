"use client";

import React from "react";

export type ThemeId = "golden-sand" | "nocturnal" | "metals" | "earth-modern";

const THEMES: { id: ThemeId; name: string; description: string }[] = [
  { id: "golden-sand", name: "Golden Sand", description: "Cálido, clínico-premium, minimal." },
  { id: "nocturnal", name: "Nocturnal", description: "Oscuro elegante, lujo discreto." },
  { id: "metals", name: "Metallics", description: "Pearl + gold/rose/patina, look boutique." },
  { id: "earth-modern", name: "Earth Modern", description: "Tierra contemporánea, contraste balanceado." },
];

export function useThemes() {
  return THEMES;
}

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = React.useState<ThemeId>("golden-sand");

  React.useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

const ThemeContext = React.createContext<{
  theme: ThemeId;
  setTheme: (t: ThemeId) => void;
} | null>(null);

export function useTheme() {
  const ctx = React.useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
