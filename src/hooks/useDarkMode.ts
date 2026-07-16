import { useState, useEffect } from "react";

const THEME_COOKIE_NAME = "taleex_theme";
const THEME_COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

const getThemeCookie = () => {
  if (typeof document === "undefined") return null;
  const cookie = document.cookie
    .split("; ")
    .find((entry) => entry.startsWith(`${THEME_COOKIE_NAME}=`));

  if (!cookie) return null;
  const value = cookie.split("=")[1];
  return value === "dark" || value === "light" ? value : null;
};

const setThemeCookie = (theme: "dark" | "light") => {
  if (typeof document === "undefined") return;
  document.cookie = `${THEME_COOKIE_NAME}=${theme}; path=/; max-age=${THEME_COOKIE_MAX_AGE}; SameSite=Lax`;
};

const getSystemTheme = () =>
  window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";

const applyTheme = (theme: "dark" | "light") => {
  document.documentElement.classList.add(theme);
  document.documentElement.classList.remove(
    theme === "dark" ? "light" : "dark",
  );
};

export const useDarkMode = () => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window === "undefined") return true;

    const storedTheme = getThemeCookie();
    return storedTheme ? storedTheme === "dark" : getSystemTheme() === "dark";
  });

  useEffect(() => {
    const storedTheme = getThemeCookie();
    const initialTheme = storedTheme || getSystemTheme();
    applyTheme(initialTheme);
    setIsDarkMode(initialTheme === "dark");

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleSystemThemeChange = (event: MediaQueryListEvent) => {
      if (getThemeCookie()) return;
      const nextTheme = event.matches ? "dark" : "light";
      applyTheme(nextTheme);
      setIsDarkMode(event.matches);
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", handleSystemThemeChange);
    } else {
      mediaQuery.addListener(handleSystemThemeChange);
    }

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener("change", handleSystemThemeChange);
      } else {
        mediaQuery.removeListener(handleSystemThemeChange);
      }
    };
  }, []);

  const toggleTheme = () => {
    const nextTheme = isDarkMode ? "light" : "dark";
    applyTheme(nextTheme);
    setThemeCookie(nextTheme);
    setIsDarkMode(nextTheme === "dark");
  };

  return { isDarkMode, toggleTheme };
};
