"use client";

import * as React from "react";

type Theme = "light" | "dark" | "system";

const STORAGE_KEY = "personal-os-theme";

interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = React.createContext<ThemeContextValue>({
  theme: "system",
  setTheme: () => {},
});

/** localStorage as an external store (same-tab writes notify manually). */
const listeners = new Set<() => void>();
function emitStorage() {
  for (const listener of listeners) listener();
}
function subscribeStorage(callback: () => void) {
  listeners.add(callback);
  window.addEventListener("storage", callback);
  return () => {
    listeners.delete(callback);
    window.removeEventListener("storage", callback);
  };
}

/**
 * Minimal theme provider (replaces next-themes, whose injected <script>
 * trips React 19's client-render warning). The FOUC-prevention script
 * lives in the layout <head> shell, outside React reconciliation.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = React.useSyncExternalStore(
    subscribeStorage,
    () => (window.localStorage.getItem(STORAGE_KEY) as Theme | null) ?? "system",
    () => "system" as Theme
  );

  // Apply whenever theme or the system preference changes.
  React.useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () => {
      const resolved =
        theme === "system" ? (media.matches ? "dark" : "light") : theme;
      document.documentElement.classList.toggle("dark", resolved === "dark");
    };
    apply();
    if (theme === "system") {
      media.addEventListener("change", apply);
      return () => media.removeEventListener("change", apply);
    }
  }, [theme]);

  const setTheme = React.useCallback((next: Theme) => {
    window.localStorage.setItem(STORAGE_KEY, next);
    emitStorage();
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return React.useContext(ThemeContext);
}
