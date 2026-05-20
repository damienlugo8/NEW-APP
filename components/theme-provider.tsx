"use client";

import * as React from "react";

type Theme = "light" | "dark" | "system";
// FORGE is dark-first. The chrome was designed against the dark palette and
// reads correctly there; light is preserved as an opt-in under Settings →
// Appearance. Default = dark (no `system` ambiguity for first-time visitors).
const KEY = "forge-theme";
const DEFAULT_THEME: Theme = "dark";

interface Ctx {
  theme: Theme;
  resolved: "light" | "dark";
  setTheme: (t: Theme) => void;
}
const ThemeCtx = React.createContext<Ctx | null>(null);

function applyDom(t: "light" | "dark") {
  const html = document.documentElement;
  html.classList.toggle("dark", t === "dark");
  html.style.colorScheme = t;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = React.useState<Theme>(DEFAULT_THEME);
  const [resolved, setResolved] = React.useState<"light" | "dark">("dark");

  React.useEffect(() => {
    const stored = (localStorage.getItem(KEY) as Theme | null) ?? DEFAULT_THEME;
    setThemeState(stored);
  }, []);

  React.useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const resolve = () => {
      const next: "light" | "dark" =
        theme === "system" ? (mq.matches ? "dark" : "light") : theme;
      setResolved(next);
      applyDom(next);
    };
    resolve();
    mq.addEventListener("change", resolve);
    return () => mq.removeEventListener("change", resolve);
  }, [theme]);

  const setTheme = React.useCallback((t: Theme) => {
    localStorage.setItem(KEY, t);
    setThemeState(t);
  }, []);

  return (
    <ThemeCtx.Provider value={{ theme, resolved, setTheme }}>
      {children}
    </ThemeCtx.Provider>
  );
}

export function useTheme() {
  const ctx = React.useContext(ThemeCtx);
  if (!ctx) throw new Error("useTheme must be used inside ThemeProvider");
  return ctx;
}

/** Inline script that runs before hydration to prevent FOUC. */
export const themeBootstrap = `
(function(){try{
  var t = localStorage.getItem('${KEY}') || '${DEFAULT_THEME}';
  var d = t === 'dark' || (t === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  if (d) document.documentElement.classList.add('dark');
  document.documentElement.style.colorScheme = d ? 'dark' : 'light';
}catch(e){document.documentElement.classList.add('dark');document.documentElement.style.colorScheme='dark';}})();
`;
