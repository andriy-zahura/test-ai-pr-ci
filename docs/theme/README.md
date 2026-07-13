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
| `src/success.ts` | Calls `initTheme()` + `mountThemeSwitcher()`; shows current theme label |
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

### Success page theme label

1. After auth session check, success page inserts `#theme-label` below user email.
2. Label text: `Current theme: ☀ Light` or `Current theme: ☾ Dark`.
3. Label updates when user clicks theme switcher.

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
| `getThemeLabel(theme?)` | Human-readable label for a theme (`☀ Light` / `☾ Dark`); defaults to current theme |
| `setTheme(theme)` | Persist + apply |
| `toggleTheme()` | Flip theme, return new value |
| `initTheme()` | Apply current theme to DOM |
| `mountThemeSwitcher()` | Append switcher button to body |

## UI contract

| Element | Requirement |
|---------|-------------|
| Switcher | Fixed top-right, class `theme-switcher` |
| Button label | `☀ Light` in dark mode, `☾ Dark` in light mode (via `getThemeLabel()` for target theme) |
| `aria-label` | `"Switch to dark theme"` or `"Switch to light theme"` |
| Success theme label | `#theme-label`, class `hint`, text `Current theme: <label>` |

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
- Success page shows current theme label; updates on toggle
- `getThemeLabel()` used for switcher and success label text
