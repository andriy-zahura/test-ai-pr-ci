export type Theme = "light" | "dark";

export const THEME_STORAGE_KEY = "app_theme";

const themeLabels: Record<Theme, string> = {
  light: "☀ Light",
  dark: "☾ Dark",
};

const toggleLabels: Record<Theme, string> = {
  light: "Switch to dark theme",
  dark: "Switch to light theme",
};

export function getThemeLabel(theme: Theme = getTheme()): string {
  return themeLabels[theme];
}

export function getStoredTheme(): Theme | null {
  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  return stored === "light" || stored === "dark" ? stored : null;
}

export function getSystemTheme(): Theme {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function getTheme(): Theme {
  return getStoredTheme() ?? getSystemTheme();
}

export function applyTheme(theme: Theme): void {
  document.documentElement.setAttribute("data-theme", theme);
}

export function setTheme(theme: Theme): void {
  localStorage.setItem(THEME_STORAGE_KEY, theme);
  applyTheme(theme);
}

export function toggleTheme(): Theme {
  const next = getTheme() === "dark" ? "light" : "dark";
  setTheme(next);
  return next;
}

export function initTheme(): void {
  applyTheme(getTheme());
}

export function mountThemeSwitcher(container: HTMLElement = document.body): HTMLButtonElement {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "theme-switcher";
  button.setAttribute("aria-label", toggleLabels[getTheme()]);

  const syncButton = (): void => {
    const theme = getTheme();
    button.textContent = getThemeLabel(theme === "dark" ? "light" : "dark");
    button.setAttribute("aria-label", toggleLabels[theme]);
  };

  button.addEventListener("click", () => {
    toggleTheme();
    syncButton();
  });

  syncButton();
  container.appendChild(button);
  return button;
}
