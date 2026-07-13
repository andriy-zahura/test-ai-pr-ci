# Theme

App-wide light/dark theme with persisted preference and system fallback.

## Scope

Covers theme tokens, switcher UI, persistence, and page bootstrap. Does not cover auth flows or per-component theming beyond shared CSS variables.

## Files

| File | Role |
|------|------|
| `src/theme.ts` | Theme API, localStorage, switcher mount |
| `src/styles.css` | Light/dark CSS variable sets |
| `src/login.ts` | Calls `initTheme()` + `mountThemeSwitcher()` |
| `src/success.ts` | Calls `initTheme()` + `mountThemeSwitcher()` |
| `index.html` | Inline boot script to apply theme before paint |
| `success.html` | Inline boot script to apply theme before paint |

## User flows

### Initial load

1. Page loads inline script in `<head>`.
2. Script reads `app_theme` from localStorage.
3. If missing or invalid, uses `prefers-color-scheme` (dark → dark, else light).
4. Sets `data-theme="light"` or `data-theme="dark"` on `<html>`.
5. Module script calls `initTheme()` (sync) and `mountThemeSwitcher()`.

### Toggle theme

1. User clicks fixed top-right switcher button.
2. Label shows target theme: `☀ Light` when dark, `☾ Dark` when light.
3. Theme toggles light ↔ dark.
4. Preference saved to `app_theme`.
5. `data-theme` updated on `<html>` immediately.

### Cross-page persistence

1. User sets theme on login page.
2. Navigates to success page (or back).
3. Same theme applied from localStorage.

## Validation rules

| Input | Rule | Behavior |
|-------|------|----------|
| `app_theme` in localStorage | Must be `"light"` or `"dark"` | Invalid/missing → system preference |

## Storage / API

| Key / Attribute | Shape |
|-----------------|-------|
| `app_theme` (localStorage) | `"light"` \| `"dark"` |
| `data-theme` on `<html>` | `"light"` \| `"dark"` |

### `src/theme.ts` exports

| Function | Behavior |
|----------|----------|
| `getTheme()` | Stored theme or system fallback |
| `setTheme(theme)` | Persist + apply |
| `toggleTheme()` | Flip theme, return new value |
| `initTheme()` | Apply current theme to DOM |
| `mountThemeSwitcher()` | Append switcher button to body |

## UI contract

| Element | Requirement |
|---------|-------------|
| Switcher | Fixed top-right, class `theme-switcher` |
| Button label | `☀ Light` in dark mode, `☾ Dark` in light mode |
| `aria-label` | `"Switch to dark theme"` or `"Switch to light theme"` |

## Themes

Both themes use CSS custom properties on `[data-theme="light"]` and `[data-theme="dark"]`:

- Background, surface, border, text, accent, danger, success
- Cards, inputs, buttons, errors inherit tokens

## Non-goals

- No theme beyond light/dark
- No per-page theme override
- No server-side theme
- No `prefers-color-scheme` live listener (only used on first load when no stored pref)

## Reviewer focus

- Inline boot script matches `THEME_STORAGE_KEY` (`app_theme`)
- Both pages call `initTheme()` and `mountThemeSwitcher()`
- Invalid stored values fall back to system preference
- Switcher accessible (`aria-label`, button type)
- CSS uses variables; no hardcoded colors outside token blocks
- Theme persists across login ↔ success navigation
