"use client";

import { useEffect, useState } from "react";

/**
 * Dark/light toggle. Dark is the default (per the Bold design system); the
 * choice is saved to localStorage and applied before paint by an inline script
 * in the root layout, so there's no flash of the wrong theme on load.
 */
export function ThemeToggle() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  useEffect(() => {
    const current =
      document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark";
    setTheme(current);
  }, []);

  function toggle() {
    // Read the live attribute (source of truth) so rapid clicks can't desync.
    const current =
      document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark";
    const next = current === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem("theme", next);
    } catch {}
    setTheme(next);
  }

  return (
    <button
      onClick={toggle}
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
      title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
      className="ml-auto inline-grid place-items-center w-11 h-11 rounded-xl border border-border text-lg hover:border-primary hover:bg-card transition-colors"
    >
      <span aria-hidden>{theme === "dark" ? "☀️" : "🌙"}</span>
    </button>
  );
}
